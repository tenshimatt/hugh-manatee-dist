import { PrismaClient, Version, Prisma } from '@prisma/client';

export interface VersionCreateInput {
  documentId: string;
  versionNumber: string;
  content: Prisma.JsonValue;
  changeDescription?: string;
  wordCount: number;
  createdById: string;
  tags?: string[];
}

export interface VersionUpdateInput {
  changeDescription?: string;
  tags?: string[];
}

export interface VersionQueryOptions {
  includeRelations?: {
    document?: boolean;
    createdBy?: boolean;
  };
  orderBy?: Prisma.VersionOrderByWithRelationInput[];
  take?: number;
  skip?: number;
}

export interface VersionComparison {
  fromVersion: Version;
  toVersion: Version;
  differences: {
    wordCountChange: number;
    contentChanged: boolean;
    sectionsAdded: number;
    sectionsRemoved: number;
    sectionsModified: number;
  };
}

export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export class VersionModel {
  constructor(private prisma: PrismaClient) {}

  async create(data: VersionCreateInput): Promise<Version> {
    // Validate semantic version format
    if (!this.isValidSemanticVersion(data.versionNumber)) {
      throw new Error('Version number must follow semantic versioning (MAJOR.MINOR.PATCH)');
    }

    // Check for version uniqueness within document
    const existingVersion = await this.findByDocumentAndVersion(data.documentId, data.versionNumber);
    if (existingVersion) {
      throw new Error(`Version ${data.versionNumber} already exists for this document`);
    }

    const version = await this.prisma.version.create({
      data: {
        documentId: data.documentId,
        versionNumber: data.versionNumber,
        content: data.content,
        changeDescription: data.changeDescription,
        wordCount: data.wordCount,
        createdById: data.createdById,
        tags: data.tags || [],
      },
    });

    return version;
  }

  async createSnapshot(documentId: string, createdById: string, changeDescription?: string): Promise<Version> {
    // Get current document content
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        sections: {
          orderBy: [{ level: 'asc' }, { order: 'asc' }],
        },
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Get the latest version to determine next version number
    const latestVersion = await this.getLatestVersion(documentId);
    const nextVersionNumber = this.incrementVersion(latestVersion?.versionNumber || '0.0.0');

    // Create content snapshot including document and sections
    const contentSnapshot = {
      document: {
        title: document.title,
        content: document.content,
        metadata: document.metadata,
        status: document.status,
      },
      sections: document.sections.map(section => ({
        id: section.id,
        title: section.title,
        content: section.content,
        level: section.level,
        order: section.order,
        parentId: section.parentId,
        metadata: section.metadata,
      })),
      timestamp: new Date().toISOString(),
    };

    return this.create({
      documentId,
      versionNumber: nextVersionNumber,
      content: contentSnapshot,
      changeDescription,
      wordCount: document.wordCount,
      createdById,
    });
  }

  async findById(id: string, options?: VersionQueryOptions): Promise<Version | null> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.version.findUnique({
      where: { id },
      include,
    });
  }

  async findByDocumentId(documentId: string, options?: VersionQueryOptions): Promise<Version[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.version.findMany({
      where: { documentId },
      include,
      orderBy: options?.orderBy || [{ createdAt: 'desc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findByDocumentAndVersion(documentId: string, versionNumber: string): Promise<Version | null> {
    return this.prisma.version.findUnique({
      where: {
        documentId_versionNumber: {
          documentId,
          versionNumber,
        },
      },
    });
  }

  async getLatestVersion(documentId: string): Promise<Version | null> {
    const versions = await this.prisma.version.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    return versions[0] || null;
  }

  async getVersionHistory(documentId: string, options?: VersionQueryOptions): Promise<Version[]> {
    return this.findByDocumentId(documentId, {
      ...options,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async restoreVersion(versionId: string): Promise<{ version: Version; restoredDocumentId: string }> {
    const version = await this.findById(versionId, {
      includeRelations: { document: true },
    });

    if (!version) {
      throw new Error('Version not found');
    }

    const contentSnapshot = version.content as any;
    if (!contentSnapshot.document || !contentSnapshot.sections) {
      throw new Error('Invalid version content format');
    }

    // Restore document content in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Update document
      await tx.document.update({
        where: { id: version.documentId },
        data: {
          title: contentSnapshot.document.title,
          content: contentSnapshot.document.content,
          metadata: contentSnapshot.document.metadata,
          wordCount: version.wordCount,
          version: version.versionNumber,
        },
      });

      // Delete existing sections
      await tx.section.deleteMany({
        where: { documentId: version.documentId },
      });

      // Restore sections
      for (const sectionData of contentSnapshot.sections) {
        await tx.section.create({
          data: {
            id: sectionData.id,
            documentId: version.documentId,
            title: sectionData.title,
            content: sectionData.content,
            level: sectionData.level,
            order: sectionData.order,
            parentId: sectionData.parentId,
            metadata: sectionData.metadata,
            wordCount: this.calculateWordCount(sectionData.content),
          },
        });
      }
    });

    return {
      version,
      restoredDocumentId: version.documentId,
    };
  }

  async compareVersions(fromVersionId: string, toVersionId: string): Promise<VersionComparison> {
    const fromVersion = await this.findById(fromVersionId);
    const toVersion = await this.findById(toVersionId);

    if (!fromVersion || !toVersion) {
      throw new Error('One or both versions not found');
    }

    if (fromVersion.documentId !== toVersion.documentId) {
      throw new Error('Versions must belong to the same document');
    }

    const fromContent = fromVersion.content as any;
    const toContent = toVersion.content as any;

    const differences = {
      wordCountChange: toVersion.wordCount - fromVersion.wordCount,
      contentChanged: JSON.stringify(fromContent) !== JSON.stringify(toContent),
      sectionsAdded: this.countSectionsAdded(fromContent.sections, toContent.sections),
      sectionsRemoved: this.countSectionsRemoved(fromContent.sections, toContent.sections),
      sectionsModified: this.countSectionsModified(fromContent.sections, toContent.sections),
    };

    return {
      fromVersion,
      toVersion,
      differences,
    };
  }

  async update(id: string, data: VersionUpdateInput): Promise<Version> {
    return this.prisma.version.update({
      where: { id },
      data,
    });
  }

  async addTag(id: string, tag: string): Promise<Version> {
    const version = await this.findById(id);
    if (!version) {
      throw new Error('Version not found');
    }

    const updatedTags = [...version.tags, tag];
    
    return this.prisma.version.update({
      where: { id },
      data: { tags: updatedTags },
    });
  }

  async removeTag(id: string, tag: string): Promise<Version> {
    const version = await this.findById(id);
    if (!version) {
      throw new Error('Version not found');
    }

    const updatedTags = version.tags.filter(t => t !== tag);
    
    return this.prisma.version.update({
      where: { id },
      data: { tags: updatedTags },
    });
  }

  async delete(id: string): Promise<Version> {
    return this.prisma.version.delete({
      where: { id },
    });
  }

  async cleanup(documentId: string, keepVersions: number = 10): Promise<number> {
    // Keep the latest N versions and delete older ones
    const versions = await this.findByDocumentId(documentId, {
      orderBy: [{ createdAt: 'desc' }],
    });

    if (versions.length <= keepVersions) {
      return 0; // No cleanup needed
    }

    const versionsToDelete = versions.slice(keepVersions);
    const deleteIds = versionsToDelete.map(v => v.id);

    await this.prisma.version.deleteMany({
      where: {
        id: { in: deleteIds },
      },
    });

    return deleteIds.length;
  }

  async getVersionStats(documentId: string): Promise<{
    totalVersions: number;
    firstVersion: Version | null;
    latestVersion: Version | null;
    totalWordCountChanges: number;
    averageTimeBetweenVersions: number; // in hours
  }> {
    const versions = await this.findByDocumentId(documentId, {
      orderBy: [{ createdAt: 'asc' }],
    });

    if (versions.length === 0) {
      return {
        totalVersions: 0,
        firstVersion: null,
        latestVersion: null,
        totalWordCountChanges: 0,
        averageTimeBetweenVersions: 0,
      };
    }

    const firstVersion = versions[0];
    const latestVersion = versions[versions.length - 1];
    
    const totalWordCountChanges = Math.abs(latestVersion.wordCount - firstVersion.wordCount);
    
    let averageTimeBetweenVersions = 0;
    if (versions.length > 1) {
      const totalTimeMs = latestVersion.createdAt.getTime() - firstVersion.createdAt.getTime();
      const totalHours = totalTimeMs / (1000 * 60 * 60);
      averageTimeBetweenVersions = totalHours / (versions.length - 1);
    }

    return {
      totalVersions: versions.length,
      firstVersion,
      latestVersion,
      totalWordCountChanges,
      averageTimeBetweenVersions,
    };
  }

  private isValidSemanticVersion(version: string): boolean {
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9\-\.]+))?$/;
    return semverRegex.test(version);
  }

  private parseSemanticVersion(version: string): SemanticVersion {
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9\-\.]+))?$/;
    const match = version.match(semverRegex);
    
    if (!match) {
      throw new Error('Invalid semantic version format');
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
    };
  }

  private incrementVersion(currentVersion: string, type: 'major' | 'minor' | 'patch' = 'patch'): string {
    const parsed = this.parseSemanticVersion(currentVersion);

    switch (type) {
      case 'major':
        return `${parsed.major + 1}.0.0`;
      case 'minor':
        return `${parsed.major}.${parsed.minor + 1}.0`;
      case 'patch':
      default:
        return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    }
  }

  private calculateWordCount(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private countSectionsAdded(fromSections: any[], toSections: any[]): number {
    const fromIds = new Set(fromSections.map(s => s.id));
    return toSections.filter(s => !fromIds.has(s.id)).length;
  }

  private countSectionsRemoved(fromSections: any[], toSections: any[]): number {
    const toIds = new Set(toSections.map(s => s.id));
    return fromSections.filter(s => !toIds.has(s.id)).length;
  }

  private countSectionsModified(fromSections: any[], toSections: any[]): number {
    const toSectionsMap = new Map(toSections.map(s => [s.id, s]));
    
    return fromSections.filter(fromSection => {
      const toSection = toSectionsMap.get(fromSection.id);
      if (!toSection) return false; // Section was removed, not modified
      
      return (
        fromSection.title !== toSection.title ||
        fromSection.content !== toSection.content ||
        fromSection.level !== toSection.level ||
        fromSection.order !== toSection.order ||
        fromSection.parentId !== toSection.parentId
      );
    }).length;
  }

  private buildInclude(relations?: VersionQueryOptions['includeRelations']) {
    if (!relations) return undefined;

    return {
      document: relations.document || false,
      createdBy: relations.createdBy || false,
    };
  }
}

export default VersionModel;