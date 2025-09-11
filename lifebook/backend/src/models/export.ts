import { PrismaClient, Export, ExportFormat, ExportStatus, Prisma } from '@prisma/client';

export interface ExportCreateInput {
  documentId: string;
  format: ExportFormat;
  parameters?: Prisma.JsonValue;
  createdById: string;
}

export interface ExportUpdateInput {
  status?: ExportStatus;
  filePath?: string;
  fileSize?: bigint;
  parameters?: Prisma.JsonValue;
  errorMessage?: string;
  completedAt?: Date;
}

export interface ExportQueryOptions {
  includeRelations?: {
    document?: boolean;
    createdBy?: boolean;
  };
  orderBy?: Prisma.ExportOrderByWithRelationInput[];
  take?: number;
  skip?: number;
}

export interface ExportParameters {
  // PDF parameters
  pageSize?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  includeTOC?: boolean;
  includePageNumbers?: boolean;
  headerFooter?: {
    header?: string;
    footer?: string;
  };

  // HTML parameters
  includeStyles?: boolean;
  includeNavigation?: boolean;
  singlePage?: boolean;
  customCSS?: string;

  // Markdown parameters
  includeMetadata?: boolean;
  includeTableOfContents?: boolean;
  markdownFlavor?: 'github' | 'commonmark' | 'pandoc';

  // Word parameters
  template?: string;
  includeComments?: boolean;
  trackChanges?: boolean;

  // Common parameters
  includeImages?: boolean;
  includeSections?: string[]; // Section IDs to include
  excludeSections?: string[]; // Section IDs to exclude
  watermark?: {
    text: string;
    opacity: number;
  };
}

export interface ExportProgress {
  exportId: string;
  status: ExportStatus;
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number; // seconds
  errorMessage?: string;
}

export interface ExportStats {
  totalExports: number;
  byFormat: Record<ExportFormat, number>;
  byStatus: Record<ExportStatus, number>;
  totalFileSize: bigint;
  averageFileSize: number;
  successRate: number;
}

export class ExportModel {
  constructor(private prisma: PrismaClient) {}

  async create(data: ExportCreateInput): Promise<Export> {
    // Validate export parameters
    if (data.parameters) {
      this.validateExportParameters(data.format, data.parameters as ExportParameters);
    }

    const exportRecord = await this.prisma.export.create({
      data: {
        documentId: data.documentId,
        format: data.format,
        status: ExportStatus.PENDING,
        parameters: data.parameters || {},
        createdById: data.createdById,
      },
    });

    return exportRecord;
  }

  async findById(id: string, options?: ExportQueryOptions): Promise<Export | null> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.export.findUnique({
      where: { id },
      include,
    });
  }

  async findMany(options?: ExportQueryOptions): Promise<Export[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.export.findMany({
      include,
      orderBy: options?.orderBy || [{ createdAt: 'desc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findByDocument(documentId: string, options?: ExportQueryOptions): Promise<Export[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.export.findMany({
      where: { documentId },
      include,
      orderBy: options?.orderBy || [{ createdAt: 'desc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findByUser(userId: string, options?: ExportQueryOptions): Promise<Export[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.export.findMany({
      where: { createdById: userId },
      include,
      orderBy: options?.orderBy || [{ createdAt: 'desc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findByStatus(status: ExportStatus, options?: ExportQueryOptions): Promise<Export[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.export.findMany({
      where: { status },
      include,
      orderBy: options?.orderBy || [{ createdAt: 'asc' }], // Oldest first for processing
      take: options?.take,
      skip: options?.skip,
    });
  }

  async getPendingExports(limit?: number): Promise<Export[]> {
    return this.findByStatus(ExportStatus.PENDING, {
      take: limit,
      orderBy: [{ createdAt: 'asc' }],
    });
  }

  async getProcessingExports(): Promise<Export[]> {
    return this.findByStatus(ExportStatus.PROCESSING);
  }

  async updateStatus(id: string, status: ExportStatus, additionalData?: {
    filePath?: string;
    fileSize?: bigint;
    errorMessage?: string;
  }): Promise<Export> {
    const updateData: any = { status };

    if (status === ExportStatus.COMPLETED) {
      updateData.completedAt = new Date();
      if (additionalData?.filePath) {
        updateData.filePath = additionalData.filePath;
      }
      if (additionalData?.fileSize) {
        updateData.fileSize = additionalData.fileSize;
      }
    }

    if (status === ExportStatus.FAILED && additionalData?.errorMessage) {
      updateData.errorMessage = additionalData.errorMessage;
    }

    return this.prisma.export.update({
      where: { id },
      data: updateData,
    });
  }

  async markAsProcessing(id: string): Promise<Export> {
    return this.updateStatus(id, ExportStatus.PROCESSING);
  }

  async markAsCompleted(id: string, filePath: string, fileSize: bigint): Promise<Export> {
    return this.updateStatus(id, ExportStatus.COMPLETED, { filePath, fileSize });
  }

  async markAsFailed(id: string, errorMessage: string): Promise<Export> {
    return this.updateStatus(id, ExportStatus.FAILED, { errorMessage });
  }

  async update(id: string, data: ExportUpdateInput): Promise<Export> {
    return this.prisma.export.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Export> {
    return this.prisma.export.delete({
      where: { id },
    });
  }

  async cleanup(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.export.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: {
          in: [ExportStatus.COMPLETED, ExportStatus.FAILED],
        },
      },
    });

    return result.count;
  }

  async getExportStats(userId?: string, documentId?: string): Promise<ExportStats> {
    const where: Prisma.ExportWhereInput = {};
    
    if (userId) {
      where.createdById = userId;
    }
    
    if (documentId) {
      where.documentId = documentId;
    }

    const [totalCount, formatStats, statusStats, sizeStats] = await Promise.all([
      this.prisma.export.count({ where }),
      this.prisma.export.groupBy({
        by: ['format'],
        where,
        _count: { format: true },
      }),
      this.prisma.export.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      this.prisma.export.aggregate({
        where: {
          ...where,
          fileSize: { not: null },
        },
        _sum: { fileSize: true },
        _avg: { fileSize: true },
      }),
    ]);

    const byFormat = Object.fromEntries(
      Object.values(ExportFormat).map(format => [
        format,
        formatStats.find(stat => stat.format === format)?._count.format || 0,
      ])
    ) as Record<ExportFormat, number>;

    const byStatus = Object.fromEntries(
      Object.values(ExportStatus).map(status => [
        status,
        statusStats.find(stat => stat.status === status)?._count.status || 0,
      ])
    ) as Record<ExportStatus, number>;

    const successfulExports = byStatus[ExportStatus.COMPLETED];
    const successRate = totalCount > 0 ? (successfulExports / totalCount) * 100 : 0;

    return {
      totalExports: totalCount,
      byFormat,
      byStatus,
      totalFileSize: sizeStats._sum.fileSize || BigInt(0),
      averageFileSize: Number(sizeStats._avg.fileSize || 0),
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  async getRecentExports(userId: string, limit: number = 10): Promise<Export[]> {
    return this.findByUser(userId, {
      take: limit,
      orderBy: [{ createdAt: 'desc' }],
      includeRelations: {
        document: true,
      },
    });
  }

  async getDuplicateExport(documentId: string, format: ExportFormat, parameters: Prisma.JsonValue): Promise<Export | null> {
    // Check for recent exports with same parameters to avoid duplicates
    const recentExports = await this.prisma.export.findMany({
      where: {
        documentId,
        format,
        status: ExportStatus.COMPLETED,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Simple parameter comparison (in production, you might want more sophisticated comparison)
    const parametersString = JSON.stringify(parameters);
    
    return recentExports.find(exp => 
      JSON.stringify(exp.parameters) === parametersString
    ) || null;
  }

  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    avgProcessingTime: number; // minutes
    oldestPending?: Date;
  }> {
    const [pending, processing, completedRecent] = await Promise.all([
      this.prisma.export.count({
        where: { status: ExportStatus.PENDING },
      }),
      this.prisma.export.count({
        where: { status: ExportStatus.PROCESSING },
      }),
      this.prisma.export.findMany({
        where: {
          status: ExportStatus.COMPLETED,
          completedAt: { not: null },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        select: {
          createdAt: true,
          completedAt: true,
        },
      }),
    ]);

    // Calculate average processing time
    let avgProcessingTime = 0;
    if (completedRecent.length > 0) {
      const totalProcessingTime = completedRecent.reduce((sum, exp) => {
        const processingTime = exp.completedAt!.getTime() - exp.createdAt.getTime();
        return sum + processingTime;
      }, 0);
      
      avgProcessingTime = totalProcessingTime / completedRecent.length / (1000 * 60); // Convert to minutes
    }

    // Get oldest pending export
    const oldestPending = await this.prisma.export.findFirst({
      where: { status: ExportStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    return {
      pending,
      processing,
      avgProcessingTime: Math.round(avgProcessingTime * 100) / 100,
      oldestPending: oldestPending?.createdAt,
    };
  }

  async retryFailed(id: string): Promise<Export> {
    const exportRecord = await this.findById(id);
    if (!exportRecord) {
      throw new Error('Export not found');
    }

    if (exportRecord.status !== ExportStatus.FAILED) {
      throw new Error('Can only retry failed exports');
    }

    return this.prisma.export.update({
      where: { id },
      data: {
        status: ExportStatus.PENDING,
        errorMessage: null,
        completedAt: null,
      },
    });
  }

  private validateExportParameters(format: ExportFormat, parameters: ExportParameters): void {
    switch (format) {
      case ExportFormat.PDF:
        this.validatePdfParameters(parameters);
        break;
      case ExportFormat.HTML:
        this.validateHtmlParameters(parameters);
        break;
      case ExportFormat.MARKDOWN:
        this.validateMarkdownParameters(parameters);
        break;
      case ExportFormat.WORD:
        this.validateWordParameters(parameters);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private validatePdfParameters(parameters: ExportParameters): void {
    if (parameters.pageSize && !['A4', 'Letter', 'Legal'].includes(parameters.pageSize)) {
      throw new Error('Invalid PDF page size');
    }

    if (parameters.orientation && !['portrait', 'landscape'].includes(parameters.orientation)) {
      throw new Error('Invalid PDF orientation');
    }

    if (parameters.margins) {
      const { top, right, bottom, left } = parameters.margins;
      if ([top, right, bottom, left].some(margin => margin < 0 || margin > 100)) {
        throw new Error('PDF margins must be between 0 and 100mm');
      }
    }
  }

  private validateHtmlParameters(parameters: ExportParameters): void {
    if (parameters.customCSS && parameters.customCSS.length > 10000) {
      throw new Error('Custom CSS is too long (max 10,000 characters)');
    }
  }

  private validateMarkdownParameters(parameters: ExportParameters): void {
    if (parameters.markdownFlavor && !['github', 'commonmark', 'pandoc'].includes(parameters.markdownFlavor)) {
      throw new Error('Invalid Markdown flavor');
    }
  }

  private validateWordParameters(parameters: ExportParameters): void {
    if (parameters.template && parameters.template.length > 1000) {
      throw new Error('Word template name is too long');
    }
  }

  private buildInclude(relations?: ExportQueryOptions['includeRelations']) {
    if (!relations) return undefined;

    return {
      document: relations.document || false,
      createdBy: relations.createdBy || false,
    };
  }
}

export default ExportModel;