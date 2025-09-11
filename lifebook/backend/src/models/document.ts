import { PrismaClient, Document, DocumentStatus, Prisma } from '@prisma/client';

export interface DocumentCreateInput {
  title: string;
  content?: Prisma.JsonValue;
  wordCount?: number;
  status?: DocumentStatus;
  version?: string;
  metadata?: Prisma.JsonValue;
  ownerId: string;
  createdById: string;
}

export interface DocumentUpdateInput {
  title?: string;
  content?: Prisma.JsonValue;
  wordCount?: number;
  status?: DocumentStatus;
  version?: string;
  metadata?: Prisma.JsonValue;
}

export interface DocumentQueryOptions {
  includeRelations?: {
    sections?: boolean;
    versions?: boolean;
    exports?: boolean;
    collaborationSessions?: boolean;
    workflowStates?: boolean;
    documentPermissions?: boolean;
    createdBy?: boolean;
    owner?: boolean;
  };
  orderBy?: Prisma.DocumentOrderByWithRelationInput[];
  take?: number;
  skip?: number;
}

export class DocumentModel {
  constructor(private prisma: PrismaClient) {}

  async create(data: DocumentCreateInput): Promise<Document> {
    const document = await this.prisma.document.create({
      data: {
        title: data.title,
        content: data.content || {},
        wordCount: data.wordCount || 0,
        status: data.status || DocumentStatus.DRAFT,
        version: data.version || '1.0.0',
        metadata: data.metadata || {},
        ownerId: data.ownerId,
        createdById: data.createdById,
      },
    });

    return document;
  }

  async findById(id: string, options?: DocumentQueryOptions): Promise<Document | null> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.document.findUnique({
      where: { id },
      include,
      orderBy: options?.orderBy,
    });
  }

  async findMany(options?: DocumentQueryOptions): Promise<Document[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.document.findMany({
      include,
      orderBy: options?.orderBy || [{ updatedAt: 'desc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findByOwner(ownerId: string, options?: DocumentQueryOptions): Promise<Document[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.document.findMany({
      where: { ownerId },
      include,
      orderBy: options?.orderBy || [{ updatedAt: 'desc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findByStatus(status: DocumentStatus, options?: DocumentQueryOptions): Promise<Document[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.document.findMany({
      where: { status },
      include,
      orderBy: options?.orderBy || [{ updatedAt: 'desc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async update(id: string, data: DocumentUpdateInput): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updateWordCount(id: string, wordCount: number): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data: { wordCount },
    });
  }

  async updateStatus(id: string, status: DocumentStatus): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<Document> {
    return this.prisma.document.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.document.count({
      where: { id },
    });
    return count > 0;
  }

  async getWordCountStats(ownerId?: string): Promise<{
    totalDocuments: number;
    totalWords: number;
    averageWords: number;
    maxWords: number;
  }> {
    const where = ownerId ? { ownerId } : {};
    
    const stats = await this.prisma.document.aggregate({
      where,
      _count: { id: true },
      _sum: { wordCount: true },
      _avg: { wordCount: true },
      _max: { wordCount: true },
    });

    return {
      totalDocuments: stats._count.id,
      totalWords: stats._sum.wordCount || 0,
      averageWords: Math.round(stats._avg.wordCount || 0),
      maxWords: stats._max.wordCount || 0,
    };
  }

  async validateTitleUniqueness(title: string, ownerId: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.DocumentWhereInput = {
      title,
      ownerId,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.document.count({ where });
    return count === 0;
  }

  async validateWordLimit(wordCount: number): Promise<boolean> {
    return wordCount <= 150000; // 150k word limit from requirements
  }

  private buildInclude(relations?: DocumentQueryOptions['includeRelations']) {
    if (!relations) return undefined;

    return {
      sections: relations.sections || false,
      versions: relations.versions || false,
      exports: relations.exports || false,
      collaborationSessions: relations.collaborationSessions || false,
      workflowStates: relations.workflowStates || false,
      documentPermissions: relations.documentPermissions || false,
      createdBy: relations.createdBy || false,
      owner: relations.owner || false,
    };
  }
}

export default DocumentModel;