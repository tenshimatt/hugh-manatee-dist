import { PrismaClient } from '@prisma/client';
import DocumentModel, { DocumentCreateInput, DocumentUpdateInput, DocumentQueryOptions } from '../../models/document';
import SectionModel, { SectionCreateInput, SectionUpdateInput } from '../../models/section';
import VersionModel from '../../models/version';
import TemplateModel from '../../models/template';

export interface DocumentServiceOptions {
  includeVersioning?: boolean;
  autoSave?: boolean;
  wordCountThreshold?: number;
  maxWordCount?: number;
}

export interface CreateDocumentInput extends DocumentCreateInput {
  sections?: SectionCreateInput[];
  templateId?: string;
}

export interface UpdateDocumentInput extends DocumentUpdateInput {
  sections?: {
    create?: SectionCreateInput[];
    update?: { id: string; data: SectionUpdateInput }[];
    delete?: string[];
  };
  createVersion?: boolean;
  versionDescription?: string;
}

export interface DocumentWithSections {
  document: any;
  sections: any[];
  hierarchy: any[];
  wordCount: number;
  validation: {
    isValid: boolean;
    errors: string[];
  };
}

export class DocumentService {
  private documentModel: DocumentModel;
  private sectionModel: SectionModel;
  private versionModel: VersionModel;
  private templateModel: TemplateModel;
  private options: DocumentServiceOptions;

  constructor(prisma: PrismaClient, options: DocumentServiceOptions = {}) {
    this.documentModel = new DocumentModel(prisma);
    this.sectionModel = new SectionModel(prisma);
    this.versionModel = new VersionModel(prisma);
    this.templateModel = new TemplateModel(prisma);
    
    this.options = {
      includeVersioning: true,
      autoSave: false,
      wordCountThreshold: 1000,
      maxWordCount: 150000,
      ...options,
    };
  }

  async createDocument(data: CreateDocumentInput, userId: string): Promise<DocumentWithSections> {
    // Validate word count if provided
    if (data.wordCount && data.wordCount > this.options.maxWordCount!) {
      throw new Error(`Document exceeds maximum word count of ${this.options.maxWordCount}`);
    }

    // If creating from template
    if (data.templateId) {
      const result = await this.templateModel.createDocumentFromTemplate(
        data.templateId,
        {
          title: data.title,
          ownerId: data.ownerId,
          createdById: data.createdById,
        }
      );

      return this.getDocumentWithSections(result.documentId);
    }

    // Create document
    const document = await this.documentModel.create({
      title: data.title,
      content: data.content,
      wordCount: 0, // Will be calculated from sections
      status: data.status,
      version: data.version,
      metadata: data.metadata,
      ownerId: data.ownerId,
      createdById: data.createdById,
    });

    // Create sections if provided
    if (data.sections && data.sections.length > 0) {
      for (const sectionData of data.sections) {
        await this.sectionModel.create({
          ...sectionData,
          documentId: document.id,
        });
      }
    }

    // Calculate and update word count
    await this.recalculateWordCount(document.id);

    // Create initial version if versioning is enabled
    if (this.options.includeVersioning) {
      await this.versionModel.createSnapshot(
        document.id,
        userId,
        'Initial document creation'
      );
    }

    return this.getDocumentWithSections(document.id);
  }

  async getDocument(documentId: string, options?: DocumentQueryOptions): Promise<DocumentWithSections | null> {
    const document = await this.documentModel.findById(documentId, options);
    if (!document) {
      return null;
    }

    return this.getDocumentWithSections(documentId);
  }

  async updateDocument(documentId: string, data: UpdateDocumentInput, userId: string): Promise<DocumentWithSections> {
    const existingDocument = await this.documentModel.findById(documentId);
    if (!existingDocument) {
      throw new Error('Document not found');
    }

    // Handle section operations
    if (data.sections) {
      // Create new sections
      if (data.sections.create) {
        for (const sectionData of data.sections.create) {
          await this.sectionModel.create({
            ...sectionData,
            documentId,
          });
        }
      }

      // Update existing sections
      if (data.sections.update) {
        for (const { id, data: sectionData } of data.sections.update) {
          await this.sectionModel.update(id, sectionData);
        }
      }

      // Delete sections
      if (data.sections.delete) {
        for (const sectionId of data.sections.delete) {
          await this.sectionModel.delete(sectionId);
        }
      }
    }

    // Update document
    const { sections, createVersion, versionDescription, ...documentData } = data;
    
    if (Object.keys(documentData).length > 0) {
      await this.documentModel.update(documentId, documentData);
    }

    // Recalculate word count
    await this.recalculateWordCount(documentId);

    // Create version if requested and versioning is enabled
    if (createVersion && this.options.includeVersioning) {
      await this.versionModel.createSnapshot(
        documentId,
        userId,
        versionDescription || 'Document update'
      );
    }

    return this.getDocumentWithSections(documentId);
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      await this.documentModel.delete(documentId);
      return true;
    } catch (error) {
      return false;
    }
  }

  async duplicateDocument(documentId: string, newTitle: string, userId: string): Promise<DocumentWithSections> {
    const original = await this.getDocument(documentId);
    if (!original) {
      throw new Error('Document not found');
    }

    // Create duplicate document
    const duplicateData: CreateDocumentInput = {
      title: newTitle,
      content: original.document.content,
      status: 'DRAFT',
      metadata: {
        ...original.document.metadata,
        duplicatedFrom: documentId,
        duplicatedAt: new Date().toISOString(),
      },
      ownerId: userId,
      createdById: userId,
      sections: original.sections.map(section => ({
        title: section.title,
        content: section.content,
        level: section.level,
        order: section.order,
        parentId: section.parentId,
        metadata: section.metadata,
      })),
    };

    return this.createDocument(duplicateData, userId);
  }

  async recalculateWordCount(documentId: string): Promise<number> {
    const totalWordCount = await this.sectionModel.getDocumentWordCount(documentId);
    
    // Validate word count limit
    if (totalWordCount > this.options.maxWordCount!) {
      throw new Error(`Document exceeds maximum word count of ${this.options.maxWordCount}`);
    }

    await this.documentModel.updateWordCount(documentId, totalWordCount);
    return totalWordCount;
  }

  async validateDocument(documentId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if document exists
    const document = await this.documentModel.findById(documentId);
    if (!document) {
      errors.push('Document not found');
      return { isValid: false, errors, warnings };
    }

    // Validate title
    if (!document.title || document.title.trim().length === 0) {
      errors.push('Document title is required');
    }

    // Validate word count
    const actualWordCount = await this.sectionModel.getDocumentWordCount(documentId);
    if (actualWordCount !== document.wordCount) {
      warnings.push(`Word count mismatch: stored ${document.wordCount}, actual ${actualWordCount}`);
    }

    if (actualWordCount > this.options.maxWordCount!) {
      errors.push(`Document exceeds maximum word count of ${this.options.maxWordCount}`);
    }

    // Validate section hierarchy
    const sectionValidation = await this.sectionModel.validateHierarchy(documentId);
    if (!sectionValidation.isValid) {
      errors.push(...sectionValidation.errors);
    }

    // Check for orphaned sections
    const sections = await this.sectionModel.findByDocumentId(documentId);
    const sectionIds = new Set(sections.map(s => s.id));
    
    for (const section of sections) {
      if (section.parentId && !sectionIds.has(section.parentId)) {
        errors.push(`Section "${section.title}" has invalid parent reference`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async searchDocuments(query: string, ownerId?: string, options?: {
    take?: number;
    skip?: number;
    status?: string[];
  }): Promise<any[]> {
    // This is a basic implementation - in production you'd use Elasticsearch
    const searchOptions: DocumentQueryOptions = {
      take: options?.take || 20,
      skip: options?.skip || 0,
      orderBy: [{ updatedAt: 'desc' }],
    };

    let documents = await this.documentModel.findMany(searchOptions);

    // Filter by owner if specified
    if (ownerId) {
      documents = documents.filter(doc => doc.ownerId === ownerId);
    }

    // Filter by status if specified
    if (options?.status && options.status.length > 0) {
      documents = documents.filter(doc => options.status!.includes(doc.status));
    }

    // Simple text search in title and content
    if (query) {
      const queryLower = query.toLowerCase();
      documents = documents.filter(doc => 
        doc.title.toLowerCase().includes(queryLower) ||
        JSON.stringify(doc.content).toLowerCase().includes(queryLower)
      );
    }

    return documents;
  }

  async getDocumentStats(ownerId?: string): Promise<{
    totalDocuments: number;
    totalWords: number;
    averageWords: number;
    maxWords: number;
    byStatus: Record<string, number>;
    recentActivity: any[];
  }> {
    const stats = await this.documentModel.getWordCountStats(ownerId);
    
    // Get documents for status breakdown
    const documents = ownerId 
      ? await this.documentModel.findByOwner(ownerId)
      : await this.documentModel.findMany();

    const byStatus = documents.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentActivity = documents
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10)
      .map(doc => ({
        id: doc.id,
        title: doc.title,
        status: doc.status,
        wordCount: doc.wordCount,
        updatedAt: doc.updatedAt,
      }));

    return {
      ...stats,
      byStatus,
      recentActivity,
    };
  }

  async getDocumentHistory(documentId: string): Promise<{
    versions: any[];
    totalVersions: number;
    latestVersion: any;
    stats: any;
  }> {
    if (!this.options.includeVersioning) {
      throw new Error('Versioning is not enabled');
    }

    const [versions, stats] = await Promise.all([
      this.versionModel.findByDocumentId(documentId),
      this.versionModel.getVersionStats(documentId),
    ]);

    return {
      versions,
      totalVersions: stats.totalVersions,
      latestVersion: stats.latestVersion,
      stats,
    };
  }

  async restoreDocumentVersion(versionId: string, userId: string): Promise<DocumentWithSections> {
    if (!this.options.includeVersioning) {
      throw new Error('Versioning is not enabled');
    }

    const result = await this.versionModel.restoreVersion(versionId);
    
    // Create a new version for the restore action
    await this.versionModel.createSnapshot(
      result.restoredDocumentId,
      userId,
      `Restored to version ${result.version.versionNumber}`
    );

    return this.getDocumentWithSections(result.restoredDocumentId);
  }

  private async getDocumentWithSections(documentId: string): Promise<DocumentWithSections> {
    const [document, sections, hierarchy, validation] = await Promise.all([
      this.documentModel.findById(documentId, {
        includeRelations: {
          createdBy: true,
          owner: true,
        },
      }),
      this.sectionModel.findByDocumentId(documentId),
      this.sectionModel.getHierarchy(documentId),
      this.validateDocument(documentId),
    ]);

    if (!document) {
      throw new Error('Document not found');
    }

    const wordCount = await this.sectionModel.getDocumentWordCount(documentId);

    return {
      document,
      sections,
      hierarchy,
      wordCount,
      validation,
    };
  }

  // Auto-save functionality
  async enableAutoSave(documentId: string, userId: string, intervalMs: number = 30000): Promise<NodeJS.Timeout> {
    if (!this.options.autoSave) {
      throw new Error('Auto-save is not enabled');
    }

    return setInterval(async () => {
      try {
        // Create a snapshot if there have been changes
        await this.versionModel.createSnapshot(
          documentId,
          userId,
          'Auto-save checkpoint'
        );
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, intervalMs);
  }

  async disableAutoSave(intervalId: NodeJS.Timeout): Promise<void> {
    clearInterval(intervalId);
  }
}

export default DocumentService;