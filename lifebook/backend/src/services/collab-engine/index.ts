import { PrismaClient } from '@prisma/client';
import CollaborationSessionModel, { 
  CollaborationSessionCreateInput, 
  CursorPosition, 
  UserPresence,
  SessionHeartbeat 
} from '../../models/collaboration-session';
import SectionModel from '../../models/section';

export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  authorId: string;
  timestamp: number;
  sectionId: string;
  documentId: string;
}

export interface TransformResult {
  transformedOps: Operation[];
  conflicts: OperationConflict[];
}

export interface OperationConflict {
  operation1: Operation;
  operation2: Operation;
  resolution: 'operation1' | 'operation2' | 'merge';
  reason: string;
}

export interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'cursor_moved' | 'typing_start' | 'typing_stop' | 'operation' | 'presence_update';
  sessionId: string;
  userId: string;
  documentId: string;
  data: any;
  timestamp: number;
}

export interface ActiveCollaborator {
  userId: string;
  sessionId: string;
  userName: string;
  userAvatar?: string;
  presence: UserPresence;
  cursor: CursorPosition;
  permissions: string[];
  joinedAt: Date;
  lastSeen: Date;
}

export interface DocumentLock {
  sectionId: string;
  userId: string;
  sessionId: string;
  lockedAt: Date;
  expiresAt: Date;
  lockType: 'edit' | 'view';
}

export class CollaborationService {
  private sessionModel: CollaborationSessionModel;
  private sectionModel: SectionModel;
  private operationQueue: Map<string, Operation[]> = new Map();
  private documentLocks: Map<string, DocumentLock> = new Map();
  private eventEmitter: ((event: CollaborationEvent) => void) | null = null;

  constructor(private prisma: PrismaClient) {
    this.sessionModel = new CollaborationSessionModel(prisma);
    this.sectionModel = new SectionModel(prisma);
    
    // Start cleanup processes
    this.startCleanupProcesses();
  }

  setEventEmitter(emitter: (event: CollaborationEvent) => void): void {
    this.eventEmitter = emitter;
  }

  async joinDocument(
    documentId: string, 
    userId: string, 
    socketId: string,
    permissions: string[] = ['read', 'write']
  ): Promise<{
    session: any;
    activeCollaborators: ActiveCollaborator[];
    documentState: any;
  }> {
    // Create or update collaboration session
    const session = await this.sessionModel.create({
      documentId,
      userId,
      socketId,
      permissions,
    });

    // Get active collaborators
    const activeCollaborators = await this.getActiveCollaborators(documentId);

    // Get current document state
    const documentState = await this.getDocumentState(documentId);

    // Emit user joined event
    this.emitEvent({
      type: 'user_joined',
      sessionId: session.id,
      userId,
      documentId,
      data: { session },
      timestamp: Date.now(),
    });

    return {
      session,
      activeCollaborators,
      documentState,
    };
  }

  async leaveDocument(sessionId: string): Promise<void> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) return;

    // Remove any locks held by this session
    await this.releaseLocks(sessionId);

    // Deactivate session
    await this.sessionModel.deactivateSession(sessionId);

    // Emit user left event
    this.emitEvent({
      type: 'user_left',
      sessionId: session.id,
      userId: session.userId,
      documentId: session.documentId,
      data: {},
      timestamp: Date.now(),
    });
  }

  async updateCursor(sessionId: string, cursor: CursorPosition): Promise<void> {
    await this.sessionModel.updateCursor(sessionId, cursor);

    const session = await this.sessionModel.findById(sessionId);
    if (session) {
      this.emitEvent({
        type: 'cursor_moved',
        sessionId,
        userId: session.userId,
        documentId: session.documentId,
        data: { cursor },
        timestamp: Date.now(),
      });
    }
  }

  async updatePresence(sessionId: string, presence: Partial<UserPresence>): Promise<void> {
    await this.sessionModel.updatePresence(sessionId, presence);

    const session = await this.sessionModel.findById(sessionId);
    if (session) {
      this.emitEvent({
        type: 'presence_update',
        sessionId,
        userId: session.userId,
        documentId: session.documentId,
        data: { presence },
        timestamp: Date.now(),
      });
    }
  }

  async setTypingStatus(sessionId: string, isTyping: boolean, sectionId?: string): Promise<void> {
    await this.sessionModel.setTypingStatus(sessionId, isTyping, sectionId);

    const session = await this.sessionModel.findById(sessionId);
    if (session) {
      const eventType = isTyping ? 'typing_start' : 'typing_stop';
      this.emitEvent({
        type: eventType,
        sessionId,
        userId: session.userId,
        documentId: session.documentId,
        data: { sectionId },
        timestamp: Date.now(),
      });
    }
  }

  async applyOperation(sessionId: string, operation: Omit<Operation, 'id' | 'timestamp' | 'authorId'>): Promise<{
    success: boolean;
    transformedOperation?: Operation;
    conflicts?: OperationConflict[];
    error?: string;
  }> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Check permissions
    if (!session.permissions.includes('write')) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Check if section is locked by another user
    const lock = this.getSectionLock(operation.sectionId);
    if (lock && lock.sessionId !== sessionId && lock.expiresAt > new Date()) {
      return { success: false, error: 'Section is locked by another user' };
    }

    // Create full operation
    const fullOperation: Operation = {
      id: this.generateOperationId(),
      timestamp: Date.now(),
      authorId: session.userId,
      ...operation,
    };

    try {
      // Get pending operations for this section
      const pendingOps = this.getQueuedOperations(operation.sectionId);

      // Transform operation against pending operations
      const transformResult = this.transformOperations([fullOperation], pendingOps);

      // Apply transformed operation to document
      const success = await this.applyOperationToDocument(transformResult.transformedOps[0]);

      if (success) {
        // Add to operation queue for other clients
        this.queueOperation(fullOperation);

        // Emit operation event
        this.emitEvent({
          type: 'operation',
          sessionId,
          userId: session.userId,
          documentId: session.documentId,
          data: { operation: transformResult.transformedOps[0] },
          timestamp: Date.now(),
        });

        return { 
          success: true, 
          transformedOperation: transformResult.transformedOps[0],
          conflicts: transformResult.conflicts 
        };
      } else {
        return { success: false, error: 'Failed to apply operation to document' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async acquireLock(
    sessionId: string, 
    sectionId: string, 
    lockType: 'edit' | 'view' = 'edit',
    durationMs: number = 300000 // 5 minutes
  ): Promise<{ success: boolean; lock?: DocumentLock; error?: string }> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Check if section is already locked
    const existingLock = this.getSectionLock(sectionId);
    if (existingLock && existingLock.expiresAt > new Date()) {
      if (existingLock.sessionId === sessionId) {
        // Extend existing lock
        existingLock.expiresAt = new Date(Date.now() + durationMs);
        return { success: true, lock: existingLock };
      } else {
        return { success: false, error: 'Section is locked by another user' };
      }
    }

    // Create new lock
    const lock: DocumentLock = {
      sectionId,
      userId: session.userId,
      sessionId,
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + durationMs),
      lockType,
    };

    this.documentLocks.set(sectionId, lock);

    return { success: true, lock };
  }

  async releaseLock(sessionId: string, sectionId: string): Promise<boolean> {
    const lock = this.getSectionLock(sectionId);
    if (lock && lock.sessionId === sessionId) {
      this.documentLocks.delete(sectionId);
      return true;
    }
    return false;
  }

  async releaseLocks(sessionId: string): Promise<number> {
    let released = 0;
    for (const [sectionId, lock] of this.documentLocks.entries()) {
      if (lock.sessionId === sessionId) {
        this.documentLocks.delete(sectionId);
        released++;
      }
    }
    return released;
  }

  async getActiveCollaborators(documentId: string): Promise<ActiveCollaborator[]> {
    const sessions = await this.sessionModel.getDocumentCollaborators(documentId);
    
    return sessions.map(session => ({
      userId: session.userId,
      sessionId: session.id,
      userName: (session.user as any)?.name || 'Unknown',
      userAvatar: (session.user as any)?.avatar,
      presence: session.presence as UserPresence,
      cursor: session.cursor as CursorPosition,
      permissions: session.permissions,
      joinedAt: session.createdAt,
      lastSeen: session.lastSeen,
    }));
  }

  async recordHeartbeat(heartbeat: SessionHeartbeat): Promise<void> {
    await this.sessionModel.recordHeartbeat(heartbeat);
  }

  async getCollaborationStats(documentId?: string): Promise<any> {
    return this.sessionModel.getCollaborationStats(documentId);
  }

  async getDocumentActivity(documentId: string, hours: number = 24): Promise<any> {
    return this.sessionModel.getDocumentActivity(documentId, hours);
  }

  private transformOperations(operations: Operation[], existingOps: Operation[]): TransformResult {
    const transformedOps: Operation[] = [];
    const conflicts: OperationConflict[] = [];

    for (const op of operations) {
      let transformedOp = { ...op };

      for (const existingOp of existingOps) {
        if (existingOp.sectionId !== op.sectionId) continue;
        if (existingOp.timestamp >= op.timestamp) continue;

        const transformResult = this.transformTwoOperations(transformedOp, existingOp);
        transformedOp = transformResult.transformedOp;

        if (transformResult.conflict) {
          conflicts.push(transformResult.conflict);
        }
      }

      transformedOps.push(transformedOp);
    }

    return { transformedOps, conflicts };
  }

  private transformTwoOperations(op1: Operation, op2: Operation): {
    transformedOp: Operation;
    conflict?: OperationConflict;
  } {
    // Simplified operational transform - in production you'd use a more sophisticated OT algorithm
    const transformedOp = { ...op1 };
    let conflict: OperationConflict | undefined;

    // Handle different operation type combinations
    if (op1.type === 'insert' && op2.type === 'insert') {
      // Both insertions at same position - resolve by timestamp
      if (op1.position === op2.position) {
        if (op1.timestamp > op2.timestamp) {
          transformedOp.position += (op2.content?.length || 0);
        }
        
        conflict = {
          operation1: op1,
          operation2: op2,
          resolution: op1.timestamp > op2.timestamp ? 'operation1' : 'operation2',
          reason: 'Concurrent insertions at same position',
        };
      } else if (op1.position > op2.position) {
        // Insert after previous insertion
        transformedOp.position += (op2.content?.length || 0);
      }
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position >= op2.position) {
        transformedOp.position += (op2.content?.length || 0);
      }
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position > op2.position) {
        transformedOp.position -= Math.min(op1.position - op2.position, op2.length || 0);
      }
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      // Handle overlapping deletions
      const op1End = op1.position + (op1.length || 0);
      const op2End = op2.position + (op2.length || 0);

      if (op1.position >= op2End) {
        // Delete after previous deletion
        transformedOp.position -= (op2.length || 0);
      } else if (op1End <= op2.position) {
        // Delete before previous deletion - no change needed
      } else {
        // Overlapping deletions - create conflict
        conflict = {
          operation1: op1,
          operation2: op2,
          resolution: op1.timestamp > op2.timestamp ? 'operation1' : 'operation2',
          reason: 'Overlapping deletions',
        };

        // Adjust for overlap
        if (op1.position < op2.position) {
          transformedOp.length = op2.position - op1.position;
        } else {
          transformedOp.position = op2.position;
          transformedOp.length = Math.max(0, op1End - op2End);
        }
      }
    }

    return { transformedOp, conflict };
  }

  private async applyOperationToDocument(operation: Operation): Promise<boolean> {
    try {
      const section = await this.sectionModel.findById(operation.sectionId);
      if (!section) return false;

      let newContent = section.content;

      switch (operation.type) {
        case 'insert':
          newContent = 
            newContent.slice(0, operation.position) +
            (operation.content || '') +
            newContent.slice(operation.position);
          break;

        case 'delete':
          newContent = 
            newContent.slice(0, operation.position) +
            newContent.slice(operation.position + (operation.length || 0));
          break;

        case 'retain':
          // No content change for retain operations
          break;
      }

      // Update section content
      await this.sectionModel.update(operation.sectionId, {
        content: newContent,
        wordCount: this.calculateWordCount(newContent),
      });

      return true;
    } catch (error) {
      console.error('Failed to apply operation to document:', error);
      return false;
    }
  }

  private async getDocumentState(documentId: string): Promise<any> {
    const sections = await this.sectionModel.findByDocumentId(documentId);
    return {
      sections: sections.map(section => ({
        id: section.id,
        title: section.title,
        content: section.content,
        level: section.level,
        order: section.order,
        parentId: section.parentId,
        wordCount: section.wordCount,
      })),
    };
  }

  private queueOperation(operation: Operation): void {
    const key = operation.sectionId;
    const queue = this.operationQueue.get(key) || [];
    queue.push(operation);
    this.operationQueue.set(key, queue);

    // Clean old operations (keep last 100)
    if (queue.length > 100) {
      queue.splice(0, queue.length - 100);
    }
  }

  private getQueuedOperations(sectionId: string): Operation[] {
    return this.operationQueue.get(sectionId) || [];
  }

  private getSectionLock(sectionId: string): DocumentLock | undefined {
    return this.documentLocks.get(sectionId);
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateWordCount(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private emitEvent(event: CollaborationEvent): void {
    if (this.eventEmitter) {
      this.eventEmitter(event);
    }
  }

  private startCleanupProcesses(): void {
    // Clean expired locks every minute
    setInterval(() => {
      const now = new Date();
      for (const [sectionId, lock] of this.documentLocks.entries()) {
        if (lock.expiresAt <= now) {
          this.documentLocks.delete(sectionId);
        }
      }
    }, 60000);

    // Clean old operations every 5 minutes
    setInterval(() => {
      const cutoff = Date.now() - (30 * 60 * 1000); // 30 minutes
      for (const [sectionId, operations] of this.operationQueue.entries()) {
        const filtered = operations.filter(op => op.timestamp > cutoff);
        if (filtered.length === 0) {
          this.operationQueue.delete(sectionId);
        } else {
          this.operationQueue.set(sectionId, filtered);
        }
      }
    }, 5 * 60000);
  }
}

export default CollaborationService;