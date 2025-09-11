import { PrismaClient, CollaborationSession, Prisma } from '@prisma/client';

export interface CollaborationSessionCreateInput {
  documentId: string;
  userId: string;
  socketId: string;
  cursor?: Prisma.JsonValue;
  presence?: Prisma.JsonValue;
  permissions?: string[];
}

export interface CollaborationSessionUpdateInput {
  cursor?: Prisma.JsonValue;
  presence?: Prisma.JsonValue;
  lastSeen?: Date;
  isActive?: boolean;
  permissions?: string[];
}

export interface CollaborationSessionQueryOptions {
  includeRelations?: {
    document?: boolean;
    user?: boolean;
  };
  orderBy?: Prisma.CollaborationSessionOrderByWithRelationInput[];
  take?: number;
  skip?: number;
}

export interface CursorPosition {
  sectionId: string;
  position: number; // Character position within section
  selection?: {
    start: number;
    end: number;
  };
  lastModified: string; // ISO timestamp
}

export interface UserPresence {
  userId: string;
  userName: string;
  userAvatar?: string;
  color: string; // Hex color for cursor/highlight
  isTyping: boolean;
  lastActivity: string; // ISO timestamp
  currentSection?: string;
  status: 'active' | 'idle' | 'away';
}

export interface CollaborationStats {
  totalActiveSessions: number;
  byDocument: Record<string, number>;
  averageSessionDuration: number; // minutes
  peakConcurrency: number;
  totalSessionsToday: number;
}

export interface SessionHeartbeat {
  sessionId: string;
  timestamp: Date;
  cursor?: CursorPosition;
  presence?: UserPresence;
}

export class CollaborationSessionModel {
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly SESSION_TIMEOUT = 300000; // 5 minutes
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute

  constructor(private prisma: PrismaClient) {
    // Start background cleanup process
    this.startCleanupProcess();
  }

  async create(data: CollaborationSessionCreateInput): Promise<CollaborationSession> {
    // Check if user already has an active session for this document
    const existingSession = await this.findActiveByUserAndDocument(data.userId, data.documentId);
    if (existingSession) {
      // Update existing session with new socket ID
      return this.update(existingSession.id, {
        socketId: data.socketId,
        isActive: true,
        lastSeen: new Date(),
      });
    }

    // Generate a unique user color for this session
    const userColor = this.generateUserColor(data.userId);

    const session = await this.prisma.collaborationSession.create({
      data: {
        documentId: data.documentId,
        userId: data.userId,
        socketId: data.socketId,
        cursor: data.cursor || {},
        presence: {
          userId: data.userId,
          color: userColor,
          isTyping: false,
          lastActivity: new Date().toISOString(),
          status: 'active',
          ...data.presence as object,
        },
        lastSeen: new Date(),
        isActive: true,
        permissions: data.permissions || ['read', 'write'],
      },
    });

    return session;
  }

  async findById(id: string, options?: CollaborationSessionQueryOptions): Promise<CollaborationSession | null> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.collaborationSession.findUnique({
      where: { id },
      include,
    });
  }

  async findBySocketId(socketId: string): Promise<CollaborationSession | null> {
    return this.prisma.collaborationSession.findUnique({
      where: { socketId },
    });
  }

  async findActiveByUserAndDocument(userId: string, documentId: string): Promise<CollaborationSession | null> {
    return this.prisma.collaborationSession.findFirst({
      where: {
        userId,
        documentId,
        isActive: true,
      },
      orderBy: { lastSeen: 'desc' },
    });
  }

  async findActiveByDocument(documentId: string, options?: CollaborationSessionQueryOptions): Promise<CollaborationSession[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.collaborationSession.findMany({
      where: {
        documentId,
        isActive: true,
      },
      include,
      orderBy: options?.orderBy || [{ lastSeen: 'desc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findActiveByUser(userId: string, options?: CollaborationSessionQueryOptions): Promise<CollaborationSession[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.collaborationSession.findMany({
      where: {
        userId,
        isActive: true,
      },
      include,
      orderBy: options?.orderBy || [{ lastSeen: 'desc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async getDocumentCollaborators(documentId: string): Promise<CollaborationSession[]> {
    return this.findActiveByDocument(documentId, {
      includeRelations: {
        user: true,
      },
    });
  }

  async updateCursor(sessionId: string, cursor: CursorPosition): Promise<CollaborationSession> {
    return this.prisma.collaborationSession.update({
      where: { id: sessionId },
      data: {
        cursor: cursor as Prisma.JsonValue,
        lastSeen: new Date(),
      },
    });
  }

  async updatePresence(sessionId: string, presence: Partial<UserPresence>): Promise<CollaborationSession> {
    const session = await this.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const currentPresence = session.presence as UserPresence;
    const updatedPresence = {
      ...currentPresence,
      ...presence,
      lastActivity: new Date().toISOString(),
    };

    return this.prisma.collaborationSession.update({
      where: { id: sessionId },
      data: {
        presence: updatedPresence as Prisma.JsonValue,
        lastSeen: new Date(),
      },
    });
  }

  async recordHeartbeat(heartbeat: SessionHeartbeat): Promise<void> {
    const updateData: any = {
      lastSeen: heartbeat.timestamp,
    };

    if (heartbeat.cursor) {
      updateData.cursor = heartbeat.cursor;
    }

    if (heartbeat.presence) {
      updateData.presence = heartbeat.presence;
    }

    await this.prisma.collaborationSession.update({
      where: { id: heartbeat.sessionId },
      data: updateData,
    });
  }

  async setTypingStatus(sessionId: string, isTyping: boolean, sectionId?: string): Promise<CollaborationSession> {
    const session = await this.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const currentPresence = session.presence as UserPresence;
    const updatedPresence = {
      ...currentPresence,
      isTyping,
      currentSection: sectionId || currentPresence.currentSection,
      lastActivity: new Date().toISOString(),
    };

    return this.prisma.collaborationSession.update({
      where: { id: sessionId },
      data: {
        presence: updatedPresence as Prisma.JsonValue,
        lastSeen: new Date(),
      },
    });
  }

  async update(id: string, data: CollaborationSessionUpdateInput): Promise<CollaborationSession> {
    const updateData: any = { ...data };
    
    if (!data.lastSeen) {
      updateData.lastSeen = new Date();
    }

    return this.prisma.collaborationSession.update({
      where: { id },
      data: updateData,
    });
  }

  async deactivateSession(sessionId: string): Promise<CollaborationSession> {
    return this.prisma.collaborationSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        lastSeen: new Date(),
      },
    });
  }

  async deactivateBySocketId(socketId: string): Promise<CollaborationSession | null> {
    try {
      return await this.prisma.collaborationSession.update({
        where: { socketId },
        data: {
          isActive: false,
          lastSeen: new Date(),
        },
      });
    } catch (error) {
      // Session might not exist
      return null;
    }
  }

  async deactivateUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    const where: Prisma.CollaborationSessionWhereInput = {
      userId,
      isActive: true,
    };

    if (exceptSessionId) {
      where.id = { not: exceptSessionId };
    }

    const result = await this.prisma.collaborationSession.updateMany({
      where,
      data: {
        isActive: false,
        lastSeen: new Date(),
      },
    });

    return result.count;
  }

  async cleanupStaleSessions(): Promise<number> {
    const staleThreshold = new Date(Date.now() - this.SESSION_TIMEOUT);
    
    const result = await this.prisma.collaborationSession.updateMany({
      where: {
        isActive: true,
        lastSeen: {
          lt: staleThreshold,
        },
      },
      data: {
        isActive: false,
      },
    });

    return result.count;
  }

  async deleteOldSessions(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.collaborationSession.deleteMany({
      where: {
        isActive: false,
        lastSeen: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  async getCollaborationStats(documentId?: string): Promise<CollaborationStats> {
    const where: Prisma.CollaborationSessionWhereInput = {
      isActive: true,
    };

    if (documentId) {
      where.documentId = documentId;
    }

    const [activeSessions, documentStats, sessionDurations, todaySessions] = await Promise.all([
      this.prisma.collaborationSession.count({ where }),
      
      this.prisma.collaborationSession.groupBy({
        by: ['documentId'],
        where,
        _count: { documentId: true },
      }),
      
      this.prisma.collaborationSession.findMany({
        where: {
          isActive: false,
          lastSeen: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        select: {
          createdAt: true,
          lastSeen: true,
        },
      }),
      
      this.prisma.collaborationSession.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
          },
        },
      }),
    ]);

    const byDocument = Object.fromEntries(
      documentStats.map(stat => [stat.documentId, stat._count.documentId])
    );

    let averageSessionDuration = 0;
    if (sessionDurations.length > 0) {
      const totalDuration = sessionDurations.reduce((sum, session) => {
        const duration = session.lastSeen.getTime() - session.createdAt.getTime();
        return sum + duration;
      }, 0);
      
      averageSessionDuration = totalDuration / sessionDurations.length / (1000 * 60); // Convert to minutes
    }

    // Calculate peak concurrency (simplified - in production you'd track this over time)
    const peakConcurrency = Math.max(activeSessions, 1);

    return {
      totalActiveSessions: activeSessions,
      byDocument,
      averageSessionDuration: Math.round(averageSessionDuration * 100) / 100,
      peakConcurrency,
      totalSessionsToday: todaySessions,
    };
  }

  async getDocumentActivity(documentId: string, hours: number = 24): Promise<{
    uniqueCollaborators: number;
    totalSessionTime: number; // minutes
    peakConcurrentUsers: number;
    activityTimeline: { hour: number; activeUsers: number }[];
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const sessions = await this.prisma.collaborationSession.findMany({
      where: {
        documentId,
        createdAt: {
          gte: since,
        },
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    const uniqueCollaborators = new Set(sessions.map(s => s.userId)).size;
    
    const totalSessionTime = sessions.reduce((sum, session) => {
      const endTime = session.isActive ? new Date() : session.lastSeen;
      const duration = endTime.getTime() - session.createdAt.getTime();
      return sum + duration;
    }, 0) / (1000 * 60); // Convert to minutes

    // Calculate activity timeline (simplified)
    const activityTimeline = Array.from({ length: hours }, (_, i) => ({
      hour: i,
      activeUsers: Math.floor(Math.random() * uniqueCollaborators) + 1, // Placeholder
    }));

    return {
      uniqueCollaborators,
      totalSessionTime: Math.round(totalSessionTime * 100) / 100,
      peakConcurrentUsers: uniqueCollaborators,
      activityTimeline,
    };
  }

  async hasPermission(sessionId: string, permission: string): Promise<boolean> {
    const session = await this.findById(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    return session.permissions.includes(permission);
  }

  async updatePermissions(sessionId: string, permissions: string[]): Promise<CollaborationSession> {
    return this.prisma.collaborationSession.update({
      where: { id: sessionId },
      data: { permissions },
    });
  }

  private generateUserColor(userId: string): string {
    // Generate a consistent color based on user ID
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#FADBD8',
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  private startCleanupProcess(): void {
    setInterval(async () => {
      try {
        await this.cleanupStaleSessions();
      } catch (error) {
        console.error('Error during session cleanup:', error);
      }
    }, this.CLEANUP_INTERVAL);
  }

  private buildInclude(relations?: CollaborationSessionQueryOptions['includeRelations']) {
    if (!relations) return undefined;

    return {
      document: relations.document ? {
        select: {
          id: true,
          title: true,
          status: true,
        },
      } : false,
      user: relations.user ? {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
        },
      } : false,
    };
  }
}

export default CollaborationSessionModel;