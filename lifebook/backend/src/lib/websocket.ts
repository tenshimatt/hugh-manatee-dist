import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server as HTTPServer } from 'http';
import { createLogger } from 'winston';
import jwt from 'jsonwebtoken';

const logger = createLogger({
  level: 'info',
  format: require('winston').format.combine(
    require('winston').format.timestamp(),
    require('winston').format.errors({ stack: true }),
    require('winston').format.json()
  ),
  defaultMeta: { service: 'websocket' },
  transports: [
    new (require('winston').transports.Console)({
      format: require('winston').format.simple()
    })
  ]
});

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  role: string;
}

export interface DocumentSession {
  documentId: string;
  users: Map<string, CollaborationUser>;
  lastActivity: Date;
}

export interface OperationTransform {
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  content?: string;
  length?: number;
  attributes?: any;
  author: string;
  timestamp: Date;
  operationId: string;
}

export interface CursorPosition {
  sectionId: string;
  position: number;
  selection?: {
    start: number;
    end: number;
  };
  userId: string;
}

class WebSocketServer {
  private static instance: WebSocketServer;
  private io: SocketIOServer | null = null;
  private documentSessions: Map<string, DocumentSession> = new Map();
  private userColors: string[] = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
  ];
  private colorIndex: number = 0;

  private constructor() {
    logger.info('WebSocket server initialized');
  }

  public static getInstance(): WebSocketServer {
    if (!WebSocketServer.instance) {
      WebSocketServer.instance = new WebSocketServer();
    }
    return WebSocketServer.instance;
  }

  public async initialize(httpServer: HTTPServer): Promise<void> {
    try {
      // Create Socket.IO server
      this.io = new SocketIOServer(httpServer, {
        cors: {
          origin: process.env.FRONTEND_URL || "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000
      });

      // Setup Redis adapter for horizontal scaling
      await this.setupRedisAdapter();

      // Setup authentication middleware
      this.setupAuthenticationMiddleware();

      // Setup event handlers
      this.setupEventHandlers();

      logger.info('WebSocket server started successfully');

    } catch (error) {
      logger.error('Failed to initialize WebSocket server', { error });
      throw error;
    }
  }

  private async setupRedisAdapter(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();

      await Promise.all([
        pubClient.connect(),
        subClient.connect()
      ]);

      if (this.io) {
        this.io.adapter(createAdapter(pubClient, subClient));
        logger.info('Redis adapter configured for Socket.IO scaling');
      }

    } catch (error) {
      logger.error('Failed to setup Redis adapter', { error });
      // Continue without Redis adapter (single instance mode)
      logger.warn('Running in single instance mode without Redis scaling');
    }
  }

  private setupAuthenticationMiddleware(): void {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          throw new Error('No authentication token provided');
        }

        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace('Bearer ', '');
        
        // Verify JWT token
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || 'your-secret-key') as any;
        
        // Attach user info to socket
        socket.data.user = {
          id: decoded.userId,
          name: decoded.name,
          email: decoded.email,
          avatar: decoded.avatar,
          role: decoded.role,
          color: this.assignUserColor()
        };

        logger.debug('Socket authenticated', {
          socketId: socket.id,
          userId: decoded.userId,
          email: decoded.email
        });

        next();
      } catch (error) {
        logger.error('Socket authentication failed', {
          socketId: socket.id,
          error: error.message
        });
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const user = socket.data.user as CollaborationUser;
      logger.info('User connected', {
        socketId: socket.id,
        userId: user.id,
        name: user.name
      });

      // Document collaboration events
      socket.on('join_document', async (data) => {
        await this.handleJoinDocument(socket, data);
      });

      socket.on('leave_document', async (data) => {
        await this.handleLeaveDocument(socket, data);
      });

      // Real-time editing events
      socket.on('text_operation', async (data) => {
        await this.handleTextOperation(socket, data);
      });

      socket.on('section_operation', async (data) => {
        await this.handleSectionOperation(socket, data);
      });

      // Cursor and presence events
      socket.on('cursor_update', async (data) => {
        await this.handleCursorUpdate(socket, data);
      });

      // Document state synchronization
      socket.on('request_document_state', async (data) => {
        await this.handleDocumentStateRequest(socket, data);
      });

      // Section locking events
      socket.on('lock_section', async (data) => {
        await this.handleSectionLock(socket, data);
      });

      socket.on('unlock_section', async (data) => {
        await this.handleSectionUnlock(socket, data);
      });

      // Comment events
      socket.on('add_comment', async (data) => {
        await this.handleAddComment(socket, data);
      });

      socket.on('resolve_comment', async (data) => {
        await this.handleResolveComment(socket, data);
      });

      // Disconnection handling
      socket.on('disconnect', async (reason) => {
        await this.handleDisconnection(socket, reason);
      });

      // Error handling
      socket.on('error', (error) => {
        logger.error('Socket error', {
          socketId: socket.id,
          userId: user.id,
          error
        });
      });
    });
  }

  private async handleJoinDocument(socket: any, data: any): Promise<void> {
    try {
      const { documentId } = data;
      const user = socket.data.user as CollaborationUser;

      // Join the document room
      await socket.join(`document:${documentId}`);

      // Update document session
      if (!this.documentSessions.has(documentId)) {
        this.documentSessions.set(documentId, {
          documentId,
          users: new Map(),
          lastActivity: new Date()
        });
      }

      const session = this.documentSessions.get(documentId)!;
      session.users.set(user.id, user);
      session.lastActivity = new Date();

      // Notify other users in the document
      socket.to(`document:${documentId}`).emit('user_joined', {
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          color: user.color
        },
        documentId
      });

      // Send current active users to the joining user
      const activeUsers = Array.from(session.users.values());
      socket.emit('document_joined', {
        documentId,
        activeUsers,
        userCount: activeUsers.length
      });

      // Broadcast updated active users list
      this.io?.to(`document:${documentId}`).emit('active_users', {
        documentId,
        users: activeUsers,
        count: activeUsers.length
      });

      logger.info('User joined document', {
        socketId: socket.id,
        userId: user.id,
        documentId,
        activeUserCount: activeUsers.length
      });

    } catch (error) {
      logger.error('Failed to join document', {
        socketId: socket.id,
        data,
        error
      });
      socket.emit('operation_error', {
        code: 'JOIN_DOCUMENT_FAILED',
        message: 'Failed to join document collaboration session'
      });
    }
  }

  private async handleLeaveDocument(socket: any, data: any): Promise<void> {
    try {
      const { documentId } = data;
      const user = socket.data.user as CollaborationUser;

      // Leave the document room
      await socket.leave(`document:${documentId}`);

      // Update document session
      const session = this.documentSessions.get(documentId);
      if (session) {
        session.users.delete(user.id);
        
        // Clean up empty sessions
        if (session.users.size === 0) {
          this.documentSessions.delete(documentId);
        } else {
          session.lastActivity = new Date();
        }
      }

      // Notify other users
      socket.to(`document:${documentId}`).emit('user_left', {
        userId: user.id,
        documentId
      });

      // Update active users list
      if (session && session.users.size > 0) {
        this.io?.to(`document:${documentId}`).emit('active_users', {
          documentId,
          users: Array.from(session.users.values()),
          count: session.users.size
        });
      }

      socket.emit('document_left', { documentId });

      logger.info('User left document', {
        socketId: socket.id,
        userId: user.id,
        documentId
      });

    } catch (error) {
      logger.error('Failed to leave document', {
        socketId: socket.id,
        data,
        error
      });
    }
  }

  private async handleTextOperation(socket: any, data: any): Promise<void> {
    try {
      const { documentId, sectionId, operation } = data;
      const user = socket.data.user as CollaborationUser;

      // Add operation metadata
      const enhancedOperation: OperationTransform = {
        ...operation,
        author: user.id,
        timestamp: new Date(),
        operationId: this.generateOperationId()
      };

      // Broadcast to other users in the document
      socket.to(`document:${documentId}`).emit('text_operation', {
        documentId,
        sectionId,
        operation: enhancedOperation,
        author: {
          id: user.id,
          name: user.name,
          color: user.color
        }
      });

      // Update session activity
      const session = this.documentSessions.get(documentId);
      if (session) {
        session.lastActivity = new Date();
      }

      logger.debug('Text operation processed', {
        documentId,
        sectionId,
        operationType: operation.type,
        author: user.id,
        operationId: enhancedOperation.operationId
      });

    } catch (error) {
      logger.error('Failed to process text operation', {
        socketId: socket.id,
        data,
        error
      });
      socket.emit('operation_error', {
        code: 'TEXT_OPERATION_FAILED',
        message: 'Failed to process text operation'
      });
    }
  }

  private async handleSectionOperation(socket: any, data: any): Promise<void> {
    try {
      const { documentId, operation } = data;
      const user = socket.data.user as CollaborationUser;

      // Broadcast section structure changes to all users
      socket.to(`document:${documentId}`).emit('section_operation', {
        documentId,
        operation: {
          ...operation,
          author: user.id,
          timestamp: new Date()
        },
        author: {
          id: user.id,
          name: user.name,
          color: user.color
        }
      });

      logger.debug('Section operation processed', {
        documentId,
        operationType: operation.type,
        author: user.id
      });

    } catch (error) {
      logger.error('Failed to process section operation', {
        socketId: socket.id,
        data,
        error
      });
      socket.emit('operation_error', {
        code: 'SECTION_OPERATION_FAILED',
        message: 'Failed to process section operation'
      });
    }
  }

  private async handleCursorUpdate(socket: any, data: any): Promise<void> {
    try {
      const { documentId, cursor } = data;
      const user = socket.data.user as CollaborationUser;

      // Broadcast cursor position to other users
      socket.to(`document:${documentId}`).emit('cursor_update', {
        documentId,
        cursor: {
          ...cursor,
          userId: user.id
        },
        user: {
          id: user.id,
          name: user.name,
          color: user.color
        }
      });

    } catch (error) {
      logger.error('Failed to process cursor update', {
        socketId: socket.id,
        data,
        error
      });
    }
  }

  private async handleDocumentStateRequest(socket: any, data: any): Promise<void> {
    try {
      const { documentId } = data;

      // In a real implementation, fetch current document state from database
      // For now, send a mock response
      socket.emit('document_state', {
        documentId,
        content: { sections: [] }, // Would fetch from database
        version: '1.0.0',
        lastUpdated: new Date(),
        wordCount: 0
      });

    } catch (error) {
      logger.error('Failed to handle document state request', {
        socketId: socket.id,
        data,
        error
      });
    }
  }

  private async handleSectionLock(socket: any, data: any): Promise<void> {
    try {
      const { documentId, sectionId, lockType } = data;
      const user = socket.data.user as CollaborationUser;

      // Broadcast lock acquisition
      this.io?.to(`document:${documentId}`).emit('section_locked', {
        documentId,
        sectionId,
        lockedBy: {
          id: user.id,
          name: user.name,
          color: user.color
        },
        lockType,
        expiresAt: new Date(Date.now() + 30000) // 30 seconds
      });

    } catch (error) {
      logger.error('Failed to handle section lock', {
        socketId: socket.id,
        data,
        error
      });
    }
  }

  private async handleSectionUnlock(socket: any, data: any): Promise<void> {
    try {
      const { documentId, sectionId } = data;

      // Broadcast lock release
      this.io?.to(`document:${documentId}`).emit('section_unlocked', {
        documentId,
        sectionId
      });

    } catch (error) {
      logger.error('Failed to handle section unlock', {
        socketId: socket.id,
        data,
        error
      });
    }
  }

  private async handleAddComment(socket: any, data: any): Promise<void> {
    try {
      const { documentId, sectionId, comment } = data;
      const user = socket.data.user as CollaborationUser;

      // Broadcast new comment
      this.io?.to(`document:${documentId}`).emit('comment_added', {
        documentId,
        sectionId,
        comment: {
          ...comment,
          id: this.generateCommentId(),
          author: user.id,
          createdAt: new Date()
        },
        author: {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        }
      });

    } catch (error) {
      logger.error('Failed to handle add comment', {
        socketId: socket.id,
        data,
        error
      });
    }
  }

  private async handleResolveComment(socket: any, data: any): Promise<void> {
    try {
      const { documentId, commentId, resolution } = data;
      const user = socket.data.user as CollaborationUser;

      // Broadcast comment resolution
      this.io?.to(`document:${documentId}`).emit('comment_resolved', {
        documentId,
        commentId,
        resolution,
        resolvedBy: user.id,
        resolvedAt: new Date()
      });

    } catch (error) {
      logger.error('Failed to handle resolve comment', {
        socketId: socket.id,
        data,
        error
      });
    }
  }

  private async handleDisconnection(socket: any, reason: string): Promise<void> {
    try {
      const user = socket.data.user as CollaborationUser;

      // Remove user from all document sessions
      for (const [documentId, session] of this.documentSessions.entries()) {
        if (session.users.has(user.id)) {
          session.users.delete(user.id);

          // Notify other users
          socket.to(`document:${documentId}`).emit('user_left', {
            userId: user.id,
            documentId
          });

          // Update active users list
          if (session.users.size > 0) {
            this.io?.to(`document:${documentId}`).emit('active_users', {
              documentId,
              users: Array.from(session.users.values()),
              count: session.users.size
            });
          } else {
            // Clean up empty sessions
            this.documentSessions.delete(documentId);
          }
        }
      }

      logger.info('User disconnected', {
        socketId: socket.id,
        userId: user.id,
        reason
      });

    } catch (error) {
      logger.error('Error handling disconnection', {
        socketId: socket.id,
        error
      });
    }
  }

  // Helper methods
  private assignUserColor(): string {
    const color = this.userColors[this.colorIndex];
    this.colorIndex = (this.colorIndex + 1) % this.userColors.length;
    return color;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCommentId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getActiveDocuments(): string[] {
    return Array.from(this.documentSessions.keys());
  }

  public getDocumentUserCount(documentId: string): number {
    const session = this.documentSessions.get(documentId);
    return session ? session.users.size : 0;
  }

  public getTotalConnectedUsers(): number {
    return this.io ? this.io.engine.clientsCount : 0;
  }

  public async close(): Promise<void> {
    if (this.io) {
      this.io.close();
      logger.info('WebSocket server closed');
    }
  }
}

export const websocketServer = WebSocketServer.getInstance();