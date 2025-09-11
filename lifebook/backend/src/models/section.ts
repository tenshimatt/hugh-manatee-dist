import { PrismaClient, Section, Prisma } from '@prisma/client';

export interface SectionCreateInput {
  documentId: string;
  parentId?: string | null;
  title: string;
  content?: string;
  level: number;
  order: number;
  wordCount?: number;
  metadata?: Prisma.JsonValue;
}

export interface SectionUpdateInput {
  title?: string;
  content?: string;
  level?: number;
  order?: number;
  wordCount?: number;
  metadata?: Prisma.JsonValue;
  parentId?: string | null;
}

export interface SectionQueryOptions {
  includeRelations?: {
    document?: boolean;
    parent?: boolean;
    children?: boolean;
  };
  orderBy?: Prisma.SectionOrderByWithRelationInput[];
  take?: number;
  skip?: number;
}

export interface SectionHierarchy extends Section {
  children?: SectionHierarchy[];
  depth?: number;
}

export class SectionModel {
  constructor(private prisma: PrismaClient) {}

  async create(data: SectionCreateInput): Promise<Section> {
    // Validate level constraints (0-6 for H1-H6)
    if (data.level < 0 || data.level > 6) {
      throw new Error('Section level must be between 0 and 6');
    }

    // Validate parent-child level consistency
    if (data.parentId) {
      const parent = await this.findById(data.parentId);
      if (parent && data.level <= parent.level) {
        throw new Error('Child section level must be greater than parent level');
      }
    }

    const section = await this.prisma.section.create({
      data: {
        documentId: data.documentId,
        parentId: data.parentId,
        title: data.title,
        content: data.content || '',
        level: data.level,
        order: data.order,
        wordCount: data.wordCount || 0,
        metadata: data.metadata || {},
      },
    });

    return section;
  }

  async findById(id: string, options?: SectionQueryOptions): Promise<Section | null> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.section.findUnique({
      where: { id },
      include,
    });
  }

  async findByDocumentId(documentId: string, options?: SectionQueryOptions): Promise<Section[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.section.findMany({
      where: { documentId },
      include,
      orderBy: options?.orderBy || [{ level: 'asc' }, { order: 'asc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findRootSections(documentId: string, options?: SectionQueryOptions): Promise<Section[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.section.findMany({
      where: {
        documentId,
        parentId: null,
      },
      include,
      orderBy: [{ order: 'asc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findChildren(parentId: string, options?: SectionQueryOptions): Promise<Section[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.section.findMany({
      where: { parentId },
      include,
      orderBy: [{ order: 'asc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async getHierarchy(documentId: string): Promise<SectionHierarchy[]> {
    // Get all sections for the document
    const sections = await this.findByDocumentId(documentId, {
      orderBy: [{ level: 'asc' }, { order: 'asc' }],
    });

    // Build hierarchy tree
    return this.buildHierarchyTree(sections);
  }

  async getFullPath(sectionId: string): Promise<Section[]> {
    const path: Section[] = [];
    let currentSection = await this.findById(sectionId);

    while (currentSection) {
      path.unshift(currentSection);
      if (currentSection.parentId) {
        currentSection = await this.findById(currentSection.parentId);
      } else {
        break;
      }
    }

    return path;
  }

  async getSectionDepth(sectionId: string): Promise<number> {
    const path = await this.getFullPath(sectionId);
    return path.length - 1; // Depth starts at 0 for root sections
  }

  async getNextOrderNumber(documentId: string, parentId?: string | null): Promise<number> {
    const maxOrder = await this.prisma.section.aggregate({
      where: {
        documentId,
        parentId: parentId || null,
      },
      _max: {
        order: true,
      },
    });

    return (maxOrder._max.order || 0) + 1;
  }

  async reorderSections(documentId: string, parentId: string | null, sectionOrders: { id: string; order: number }[]): Promise<void> {
    await this.prisma.$transaction(
      sectionOrders.map(({ id, order }) =>
        this.prisma.section.update({
          where: { id },
          data: { order },
        })
      )
    );
  }

  async moveSection(sectionId: string, newParentId: string | null, newOrder: number): Promise<Section> {
    const section = await this.findById(sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // Validate that we're not creating a circular reference
    if (newParentId) {
      const isCircular = await this.wouldCreateCircularReference(sectionId, newParentId);
      if (isCircular) {
        throw new Error('Cannot move section: would create circular reference');
      }
    }

    return this.prisma.section.update({
      where: { id: sectionId },
      data: {
        parentId: newParentId,
        order: newOrder,
      },
    });
  }

  async update(id: string, data: SectionUpdateInput): Promise<Section> {
    // Validate level constraints if level is being updated
    if (data.level !== undefined && (data.level < 0 || data.level > 6)) {
      throw new Error('Section level must be between 0 and 6');
    }

    return this.prisma.section.update({
      where: { id },
      data,
    });
  }

  async updateWordCount(id: string, wordCount: number): Promise<Section> {
    return this.prisma.section.update({
      where: { id },
      data: { wordCount },
    });
  }

  async delete(id: string): Promise<Section> {
    // This will cascade delete all children due to the onDelete: Cascade in schema
    return this.prisma.section.delete({
      where: { id },
    });
  }

  async getDocumentWordCount(documentId: string): Promise<number> {
    const result = await this.prisma.section.aggregate({
      where: { documentId },
      _sum: {
        wordCount: true,
      },
    });

    return result._sum.wordCount || 0;
  }

  async validateHierarchy(documentId: string): Promise<{ isValid: boolean; errors: string[] }> {
    const sections = await this.findByDocumentId(documentId);
    const errors: string[] = [];

    for (const section of sections) {
      // Check level constraints
      if (section.level < 0 || section.level > 6) {
        errors.push(`Section ${section.id}: Invalid level ${section.level}`);
      }

      // Check parent-child level consistency
      if (section.parentId) {
        const parent = sections.find(s => s.id === section.parentId);
        if (parent && section.level <= parent.level) {
          errors.push(`Section ${section.id}: Level ${section.level} is not greater than parent level ${parent.level}`);
        }
      }

      // Check for order conflicts within the same parent
      const siblings = sections.filter(s => s.parentId === section.parentId && s.id !== section.id);
      const duplicateOrder = siblings.find(s => s.order === section.order);
      if (duplicateOrder) {
        errors.push(`Section ${section.id}: Duplicate order ${section.order} with section ${duplicateOrder.id}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private buildHierarchyTree(sections: Section[], parentId: string | null = null): SectionHierarchy[] {
    const children = sections
      .filter(section => section.parentId === parentId)
      .map(section => ({
        ...section,
        children: this.buildHierarchyTree(sections, section.id),
        depth: this.calculateDepth(sections, section.id),
      }));

    return children;
  }

  private calculateDepth(sections: Section[], sectionId: string): number {
    const section = sections.find(s => s.id === sectionId);
    if (!section || !section.parentId) return 0;
    
    return 1 + this.calculateDepth(sections, section.parentId);
  }

  private async wouldCreateCircularReference(sectionId: string, newParentId: string): Promise<boolean> {
    // Check if newParentId is a descendant of sectionId
    let currentParentId: string | null = newParentId;
    
    while (currentParentId) {
      if (currentParentId === sectionId) {
        return true; // Circular reference detected
      }
      
      const parent = await this.findById(currentParentId);
      currentParentId = parent?.parentId || null;
    }
    
    return false;
  }

  private buildInclude(relations?: SectionQueryOptions['includeRelations']) {
    if (!relations) return undefined;

    return {
      document: relations.document || false,
      parent: relations.parent || false,
      children: relations.children || false,
    };
  }
}

export default SectionModel;