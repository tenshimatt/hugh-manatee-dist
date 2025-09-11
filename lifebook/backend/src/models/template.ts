import { PrismaClient, Template, Prisma } from '@prisma/client';

export interface TemplateCreateInput {
  name: string;
  description: string;
  category: string;
  structure: Prisma.JsonValue;
  defaultContent?: Prisma.JsonValue;
  metadata?: Prisma.JsonValue;
  createdById: string;
  isPublic?: boolean;
}

export interface TemplateUpdateInput {
  name?: string;
  description?: string;
  category?: string;
  structure?: Prisma.JsonValue;
  defaultContent?: Prisma.JsonValue;
  metadata?: Prisma.JsonValue;
  isPublic?: boolean;
}

export interface TemplateQueryOptions {
  includeRelations?: {
    createdBy?: boolean;
  };
  orderBy?: Prisma.TemplateOrderByWithRelationInput[];
  take?: number;
  skip?: number;
}

export interface TemplateStructure {
  sections: TemplateSection[];
  metadata?: Record<string, any>;
  settings?: {
    allowCustomSections?: boolean;
    enforceStructure?: boolean;
    maxWordCount?: number;
  };
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  level: number;
  order: number;
  required: boolean;
  placeholder?: string;
  contentType: 'text' | 'markdown' | 'rich_text';
  validation?: {
    minWords?: number;
    maxWords?: number;
    requiredPatterns?: string[];
  };
  children?: TemplateSection[];
}

export interface TemplateUsageStats {
  totalUsage: number;
  recentUsage: number; // Last 30 days
  topUsers: { userId: string; userName: string; usageCount: number }[];
}

export class TemplateModel {
  constructor(private prisma: PrismaClient) {}

  async create(data: TemplateCreateInput): Promise<Template> {
    // Validate template name uniqueness for user
    const existingTemplate = await this.findByNameAndUser(data.name, data.createdById);
    if (existingTemplate) {
      throw new Error('Template name already exists for this user');
    }

    // Validate template structure
    this.validateTemplateStructure(data.structure);

    const template = await this.prisma.template.create({
      data: {
        name: data.name.trim(),
        description: data.description.trim(),
        category: data.category.trim(),
        structure: data.structure,
        defaultContent: data.defaultContent || {},
        metadata: data.metadata || {},
        createdById: data.createdById,
        isPublic: data.isPublic || false,
        usageCount: 0,
      },
    });

    return template;
  }

  async findById(id: string, options?: TemplateQueryOptions): Promise<Template | null> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.template.findUnique({
      where: { id },
      include,
    });
  }

  async findByNameAndUser(name: string, userId: string): Promise<Template | null> {
    return this.prisma.template.findUnique({
      where: {
        name_createdById: {
          name: name.trim(),
          createdById: userId,
        },
      },
    });
  }

  async findMany(options?: TemplateQueryOptions): Promise<Template[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.template.findMany({
      include,
      orderBy: options?.orderBy || [{ usageCount: 'desc' }, { name: 'asc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findPublicTemplates(options?: TemplateQueryOptions): Promise<Template[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.template.findMany({
      where: { isPublic: true },
      include,
      orderBy: options?.orderBy || [{ usageCount: 'desc' }, { name: 'asc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findByCategory(category: string, includePrivate: boolean = false, userId?: string, options?: TemplateQueryOptions): Promise<Template[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    const where: Prisma.TemplateWhereInput = {
      category: category.trim(),
    };

    if (!includePrivate) {
      where.isPublic = true;
    } else if (userId) {
      where.OR = [
        { isPublic: true },
        { createdById: userId },
      ];
    }

    return this.prisma.template.findMany({
      where,
      include,
      orderBy: options?.orderBy || [{ usageCount: 'desc' }, { name: 'asc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findByUser(userId: string, options?: TemplateQueryOptions): Promise<Template[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.template.findMany({
      where: { createdById: userId },
      include,
      orderBy: options?.orderBy || [{ updatedAt: 'desc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async searchTemplates(query: string, userId?: string, options?: TemplateQueryOptions): Promise<Template[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    const where: Prisma.TemplateWhereInput = {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
      ],
    };

    // Include public templates and user's private templates
    if (userId) {
      where.AND!.push({
        OR: [
          { isPublic: true },
          { createdById: userId },
        ],
      });
    } else {
      where.AND!.push({ isPublic: true });
    }

    return this.prisma.template.findMany({
      where,
      include,
      orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
      take: options?.take || 20,
      skip: options?.skip,
    });
  }

  async getPopularTemplates(limit: number = 10, category?: string): Promise<Template[]> {
    const where: Prisma.TemplateWhereInput = {
      isPublic: true,
    };

    if (category) {
      where.category = category;
    }

    return this.prisma.template.findMany({
      where,
      orderBy: [{ usageCount: 'desc' }],
      take: limit,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getCategories(): Promise<{ category: string; count: number; isPublic: boolean }[]> {
    const categories = await this.prisma.template.groupBy({
      by: ['category', 'isPublic'],
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
    });

    return categories.map(cat => ({
      category: cat.category,
      count: cat._count.category,
      isPublic: cat.isPublic,
    }));
  }

  async createDocumentFromTemplate(templateId: string, documentData: {
    title: string;
    ownerId: string;
    createdById: string;
    customContent?: Record<string, any>;
  }): Promise<{ documentId: string; sectionsCreated: number }> {
    const template = await this.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const structure = template.structure as TemplateStructure;
    const defaultContent = template.defaultContent as Record<string, any> || {};
    const customContent = documentData.customContent || {};

    let sectionsCreated = 0;

    const result = await this.prisma.$transaction(async (tx) => {
      // Create the document
      const document = await tx.document.create({
        data: {
          title: documentData.title,
          content: { templateId, templateName: template.name },
          wordCount: 0,
          ownerId: documentData.ownerId,
          createdById: documentData.createdById,
          metadata: {
            createdFromTemplate: templateId,
            templateVersion: template.updatedAt.toISOString(),
          },
        },
      });

      // Create sections from template structure
      if (structure.sections) {
        await this.createSectionsFromTemplate(
          tx,
          document.id,
          structure.sections,
          defaultContent,
          customContent
        );
        sectionsCreated = structure.sections.length;
      }

      // Update template usage count
      await tx.template.update({
        where: { id: templateId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });

      return { documentId: document.id, sectionsCreated };
    });

    return result;
  }

  async update(id: string, data: TemplateUpdateInput): Promise<Template> {
    // Validate template name uniqueness if name is being updated
    if (data.name) {
      const template = await this.findById(id);
      if (!template) {
        throw new Error('Template not found');
      }

      const existingTemplate = await this.findByNameAndUser(data.name, template.createdById);
      if (existingTemplate && existingTemplate.id !== id) {
        throw new Error('Template name already exists');
      }
    }

    // Validate structure if being updated
    if (data.structure) {
      this.validateTemplateStructure(data.structure);
    }

    const updateData: any = { ...data };
    if (data.name) {
      updateData.name = data.name.trim();
    }
    if (data.description) {
      updateData.description = data.description.trim();
    }
    if (data.category) {
      updateData.category = data.category.trim();
    }

    return this.prisma.template.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<Template> {
    return this.prisma.template.delete({
      where: { id },
    });
  }

  async cloneTemplate(templateId: string, newName: string, userId: string): Promise<Template> {
    const originalTemplate = await this.findById(templateId);
    if (!originalTemplate) {
      throw new Error('Template not found');
    }

    // Check if user has access to the template
    if (!originalTemplate.isPublic && originalTemplate.createdById !== userId) {
      throw new Error('Access denied to template');
    }

    return this.create({
      name: newName,
      description: `Cloned from ${originalTemplate.name}`,
      category: originalTemplate.category,
      structure: originalTemplate.structure,
      defaultContent: originalTemplate.defaultContent,
      metadata: {
        ...originalTemplate.metadata,
        clonedFrom: templateId,
        clonedAt: new Date().toISOString(),
      },
      createdById: userId,
      isPublic: false, // Cloned templates are private by default
    });
  }

  async getUsageStats(templateId: string): Promise<TemplateUsageStats> {
    const template = await this.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Get usage from last 30 days (simplified - in production you'd track actual usage)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // This is a simplified implementation - in production you'd have a separate usage tracking table
    const recentDocuments = await this.prisma.document.count({
      where: {
        metadata: {
          path: ['createdFromTemplate'],
          equals: templateId,
        },
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return {
      totalUsage: template.usageCount,
      recentUsage: recentDocuments,
      topUsers: [], // Would require additional tracking in production
    };
  }

  async validateTemplateStructure(structure: Prisma.JsonValue): boolean {
    try {
      const parsed = structure as TemplateStructure;
      
      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        throw new Error('Template structure must contain a sections array');
      }

      this.validateSections(parsed.sections);
      return true;
    } catch (error) {
      throw new Error(`Invalid template structure: ${error.message}`);
    }
  }

  private validateSections(sections: TemplateSection[], parentLevel: number = -1): void {
    const orderNumbers = new Set<number>();

    for (const section of sections) {
      // Validate required fields
      if (!section.id || !section.title || section.level === undefined || section.order === undefined) {
        throw new Error('Section must have id, title, level, and order');
      }

      // Validate level progression
      if (section.level < 0 || section.level > 6) {
        throw new Error('Section level must be between 0 and 6');
      }

      if (section.level <= parentLevel) {
        throw new Error('Child section level must be greater than parent level');
      }

      // Validate unique order numbers
      if (orderNumbers.has(section.order)) {
        throw new Error('Duplicate order numbers in sections');
      }
      orderNumbers.add(section.order);

      // Validate content type
      if (!['text', 'markdown', 'rich_text'].includes(section.contentType)) {
        throw new Error('Invalid content type');
      }

      // Validate children recursively
      if (section.children && section.children.length > 0) {
        this.validateSections(section.children, section.level);
      }
    }
  }

  private async createSectionsFromTemplate(
    tx: any,
    documentId: string,
    sections: TemplateSection[],
    defaultContent: Record<string, any>,
    customContent: Record<string, any>,
    parentId?: string
  ): Promise<void> {
    for (const sectionTemplate of sections) {
      const content = customContent[sectionTemplate.id] || 
                     defaultContent[sectionTemplate.id] || 
                     sectionTemplate.placeholder || '';

      const section = await tx.section.create({
        data: {
          documentId,
          parentId,
          title: sectionTemplate.title,
          content,
          level: sectionTemplate.level,
          order: sectionTemplate.order,
          wordCount: this.calculateWordCount(content),
          metadata: {
            templateSectionId: sectionTemplate.id,
            required: sectionTemplate.required,
            contentType: sectionTemplate.contentType,
            validation: sectionTemplate.validation,
          },
        },
      });

      // Create child sections recursively
      if (sectionTemplate.children && sectionTemplate.children.length > 0) {
        await this.createSectionsFromTemplate(
          tx,
          documentId,
          sectionTemplate.children,
          defaultContent,
          customContent,
          section.id
        );
      }
    }
  }

  private calculateWordCount(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private buildInclude(relations?: TemplateQueryOptions['includeRelations']) {
    if (!relations) return undefined;

    return {
      createdBy: relations.createdBy || false,
    };
  }
}

export default TemplateModel;