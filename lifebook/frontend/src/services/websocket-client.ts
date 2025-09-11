// WebSocket Client for Real-time Collaboration
// Provides type-safe WebSocket communication with automatic reconnection

import { io, Socket } from 'socket.io-client';

// Types for real-time events
interface CollaborationSession {
  id: string;
  documentId: string;
  userId: string;
  socketId: string;
  cursor: {
    position: number;
    selection: { start: number; end: number } | null;
    sectionId: string | null;
  };
  presence: {
    color: string;
    name: string;
    avatar?: string;
    status: 'active' | 'idle' | 'away';
  };
  lastSeen: string;
  isActive: boolean;
  permissions: string[];
}

interface CursorUpdate {
  userId: string;
  documentId: string;
  position: number;
  selection: { start: number; end: number } | null;
  sectionId?: string;
}

interface ContentUpdate {
  userId: string;
  documentId: string;
  sectionId?: string;
  operation: {
    type: 'insert' | 'delete' | 'replace';
    position: number;
    content?: string;
    length?: number;
  };
  timestamp: string;
}

interface PresenceUpdate {
  userId: string;
  documentId: string;
  status: 'active' | 'idle' | 'away';
  lastSeen: string;
}

interface DocumentLock {
  documentId: string;
  sectionId?: string;
  userId: string;
  lockType: 'edit' | 'structure';
  expiresAt: string;
}

// Event type mapping
interface ServerToClientEvents {
  // User joined/left document
  'user:joined': (session: CollaborationSession) => void;
  'user:left': (data: { userId: string; documentId: string }) => void;
  
  // Cursor and presence updates
  'cursor:update': (data: CursorUpdate) => void;
  'presence:update': (data: PresenceUpdate) => void;
  
  // Content collaboration
  'content:update': (data: ContentUpdate) => void;
  'content:conflict': (data: { documentId: string; conflictId: string; conflicts: any[] }) => void;
  
  // Document locking
  'document:locked': (data: DocumentLock) => void;
  'document:unlocked': (data: { documentId: string; sectionId?: string; userId: string }) => void;
  
  // System events
  'connection:established': (data: { sessionId: string; userId: string }) => void;
  'error': (data: { code: string; message: string; details?: any }) => void;
  
  // Export progress
  'export:progress': (data: { exportId: string; progress: number; status: string }) => void;
  'export:completed': (data: { exportId: string; downloadUrl: string }) => void;
  'export:failed': (data: { exportId: string; error: string }) => void;
}

interface ClientToServerEvents {
  // Join/leave document
  'document:join': (data: { documentId: string; userId: string }) => void;
  'document:leave': (data: { documentId: string }) => void;
  
  // Cursor and presence
  'cursor:move': (data: CursorUpdate) => void;
  'presence:update': (data: Omit<PresenceUpdate, 'lastSeen'>) => void;
  
  // Content updates
  'content:update': (data: Omit<ContentUpdate, 'timestamp'>) => void;
  'content:lock': (data: { documentId: string; sectionId?: string; lockType: 'edit' | 'structure' }) => void;
  'content:unlock': (data: { documentId: string; sectionId?: string }) => void;
  
  // Authentication
  'auth:authenticate': (data: { token: string }) => void;
}

// WebSocket Client Class
class WebSocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isAuthenticated = false;
  private currentDocument: string | null = null;
  private userId: string | null = null;
  private token: string | null = null;
  
  // Event listeners storage
  private listeners = new Map<string, Set<Function>>();

  constructor(private url: string = '/') {}

  // Connection management
  connect(token: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.token = token;
      this.userId = userId;
      
      this.socket = io(this.url, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 5000,
        retries: 3,
      });

      // Connection success
      this.socket.on('connect', () => {
        this.reconnectAttempts = 0;
        this.authenticate();
      });

      // Authentication success
      this.socket.on('connection:established', (data) => {
        this.isAuthenticated = true;
        this.emit('connected', data);
        resolve();
      });

      // Connection error
      this.socket.on('connect_error', (error) => {
        this.emit('connectionError', error);
        reject(error);
      });

      // Disconnection handling
      this.socket.on('disconnect', (reason) => {
        this.isAuthenticated = false;
        this.emit('disconnected', { reason });
        this.handleReconnect();
      });

      // Set up event forwarding
      this.setupEventForwarding();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isAuthenticated = false;
    this.currentDocument = null;
    this.reconnectAttempts = 0;
  }

  // Authentication
  private authenticate() {
    if (this.socket && this.token) {
      this.socket.emit('auth:authenticate', { token: this.token });
    }
  }

  // Reconnection logic
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => {
      if (this.token && this.userId) {
        this.connect(this.token, this.userId).catch(() => {
          this.handleReconnect();
        });
      }
    }, delay);
  }

  // Set up event forwarding from socket to our event system
  private setupEventForwarding() {
    if (!this.socket) return;

    // Forward all server events to our listeners
    const serverEvents: (keyof ServerToClientEvents)[] = [
      'user:joined',
      'user:left',
      'cursor:update',
      'presence:update',
      'content:update',
      'content:conflict',
      'document:locked',
      'document:unlocked',
      'error',
      'export:progress',
      'export:completed',
      'export:failed',
    ];

    serverEvents.forEach((event) => {
      this.socket!.on(event, (data) => {
        this.emit(event, data);
      });
    });
  }

  // Document collaboration methods
  joinDocument(documentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isAuthenticated) {
        reject(new Error('Not connected or authenticated'));
        return;
      }

      if (!this.userId) {
        reject(new Error('User ID not set'));
        return;
      }

      this.currentDocument = documentId;
      this.socket.emit('document:join', { documentId, userId: this.userId });

      // Wait for confirmation or error
      const timeout = setTimeout(() => {
        reject(new Error('Join document timeout'));
      }, 5000);

      const handleJoined = () => {
        clearTimeout(timeout);
        resolve();
        this.off('user:joined', handleJoined);
        this.off('error', handleError);
      };

      const handleError = (error: any) => {
        clearTimeout(timeout);
        reject(error);
        this.off('user:joined', handleJoined);
        this.off('error', handleError);
      };

      this.on('user:joined', handleJoined);
      this.on('error', handleError);
    });
  }

  leaveDocument() {
    if (this.socket && this.currentDocument) {
      this.socket.emit('document:leave', { documentId: this.currentDocument });
      this.currentDocument = null;
    }
  }

  // Cursor and presence methods
  updateCursor(position: number, selection: { start: number; end: number } | null = null, sectionId?: string) {
    if (this.socket && this.currentDocument && this.userId) {
      this.socket.emit('cursor:move', {
        userId: this.userId,
        documentId: this.currentDocument,
        position,
        selection,
        sectionId,
      });
    }
  }

  updatePresence(status: 'active' | 'idle' | 'away') {
    if (this.socket && this.currentDocument && this.userId) {
      this.socket.emit('presence:update', {
        userId: this.userId,
        documentId: this.currentDocument,
        status,
      });
    }
  }

  // Content collaboration methods
  sendContentUpdate(operation: ContentUpdate['operation'], sectionId?: string) {
    if (this.socket && this.currentDocument && this.userId) {
      this.socket.emit('content:update', {
        userId: this.userId,
        documentId: this.currentDocument,
        sectionId,
        operation,
      });
    }
  }

  lockContent(sectionId?: string, lockType: 'edit' | 'structure' = 'edit') {
    if (this.socket && this.currentDocument) {
      this.socket.emit('content:lock', {
        documentId: this.currentDocument,
        sectionId,
        lockType,
      });
    }
  }

  unlockContent(sectionId?: string) {
    if (this.socket && this.currentDocument) {
      this.socket.emit('content:unlock', {
        documentId: this.currentDocument,
        sectionId,
      });
    }
  }

  // Event system
  on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  private emit(event: string, data?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected && this.isAuthenticated || false;
  }

  getCurrentDocument(): string | null {
    return this.currentDocument;
  }

  getConnectionState(): {
    connected: boolean;
    authenticated: boolean;
    currentDocument: string | null;
    reconnectAttempts: number;
  } {
    return {
      connected: this.socket?.connected || false,
      authenticated: this.isAuthenticated,
      currentDocument: this.currentDocument,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // Operational Transform helpers
  transformOperation(operation: ContentUpdate['operation'], otherOperations: ContentUpdate['operation'][]): ContentUpdate['operation'] {
    // Simple operational transform implementation
    // In production, use a library like ShareJS or Yjs
    let transformedOp = { ...operation };
    
    for (const otherOp of otherOperations) {
      if (otherOp.position <= transformedOp.position) {
        if (otherOp.type === 'insert') {
          transformedOp.position += otherOp.content?.length || 0;
        } else if (otherOp.type === 'delete') {
          transformedOp.position -= otherOp.length || 0;
        }
      }
    }
    
    return transformedOp;
  }

  // Presence management with activity detection
  private activityTimer: NodeJS.Timeout | null = null;
  private isActive = true;

  startActivityTracking() {
    // Track user activity and update presence accordingly
    const handleActivity = () => {
      if (!this.isActive) {
        this.isActive = true;
        this.updatePresence('active');
      }
      
      // Reset idle timer
      if (this.activityTimer) {
        clearTimeout(this.activityTimer);
      }
      
      this.activityTimer = setTimeout(() => {
        this.isActive = false;
        this.updatePresence('idle');
      }, 60000); // 1 minute idle timeout
    };

    // Listen to user activity events
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial activity
    handleActivity();
  }

  stopActivityTracking() {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach((event) => {
      document.removeEventListener(event, this.startActivityTracking, true);
    });
  }
}

// Create and export default WebSocket client instance
const webSocketClient = new WebSocketClient();

export default webSocketClient;
export type {
  CollaborationSession,
  CursorUpdate,
  ContentUpdate,
  PresenceUpdate,
  DocumentLock,
  ServerToClientEvents,
  ClientToServerEvents,
};

// Export WebSocket client class for custom instances
export { WebSocketClient };