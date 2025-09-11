import { PrismaClient, ExportFormat, ExportStatus } from '@prisma/client';
import ExportModel, { ExportCreateInput, ExportParameters } from '../../models/export';
import DocumentModel from '../../models/document';
import SectionModel from '../../models/section';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ExportServiceConfig {
  outputPath: string;
  s3Config?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  templatesPath?: string;
  maxConcurrentExports?: number;
}

export interface ExportJobProgress {
  exportId: string;
  status: ExportStatus;
  progress: number; // 0-100
  currentStep: string;
  startTime: Date;
  estimatedCompletion?: Date;
  error?: string;
}

export interface ExportResult {
  success: boolean;
  exportId: string;
  filePath?: string;
  fileSize?: number;
  downloadUrl?: string;
  error?: string;
}

export interface DocumentExportData {
  document: any;
  sections: any[];
  hierarchy: any[];
  metadata: Record<string, any>;
}

export class ExportService {
  private exportModel: ExportModel;
  private documentModel: DocumentModel;
  private sectionModel: SectionModel;
  private config: ExportServiceConfig;
  private activeJobs = new Map<string, ExportJobProgress>();
  private jobQueue: string[] = [];
  private processing = false;

  constructor(prisma: PrismaClient, config: ExportServiceConfig) {
    this.exportModel = new ExportModel(prisma);
    this.documentModel = new DocumentModel(prisma);
    this.sectionModel = new SectionModel(prisma);
    this.config = {
      maxConcurrentExports: 5,
      ...config,
    };

    // Start processing queue
    this.startQueueProcessor();
  }

  async requestExport(
    documentId: string,
    format: ExportFormat,
    userId: string,
    parameters?: ExportParameters
  ): Promise<{ exportId: string; queuePosition: number }> {
    // Check for duplicate recent export
    const duplicate = await this.exportModel.getDuplicateExport(documentId, format, parameters || {});
    if (duplicate) {
      return { exportId: duplicate.id, queuePosition: 0 };
    }

    // Create export record
    const exportRecord = await this.exportModel.create({
      documentId,
      format,
      createdById: userId,
      parameters: parameters as any,
    });

    // Add to processing queue
    this.jobQueue.push(exportRecord.id);
    const queuePosition = this.jobQueue.length;

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return { exportId: exportRecord.id, queuePosition };
  }

  async getExportStatus(exportId: string): Promise<ExportJobProgress | null> {
    // Check active jobs first
    const activeJob = this.activeJobs.get(exportId);
    if (activeJob) {
      return activeJob;
    }

    // Check database
    const exportRecord = await this.exportModel.findById(exportId);
    if (!exportRecord) {
      return null;
    }

    return {
      exportId,
      status: exportRecord.status,
      progress: this.getProgressFromStatus(exportRecord.status),
      currentStep: this.getStepFromStatus(exportRecord.status),
      startTime: exportRecord.createdAt,
      estimatedCompletion: exportRecord.completedAt || undefined,
      error: exportRecord.errorMessage || undefined,
    };
  }

  async cancelExport(exportId: string): Promise<boolean> {
    // Remove from queue if pending
    const queueIndex = this.jobQueue.indexOf(exportId);
    if (queueIndex !== -1) {
      this.jobQueue.splice(queueIndex, 1);
      await this.exportModel.markAsFailed(exportId, 'Export cancelled by user');
      return true;
    }

    // Can't cancel active exports (for simplicity)
    return false;
  }

  async getExportHistory(userId: string, limit: number = 20): Promise<any[]> {
    return this.exportModel.getRecentExports(userId, limit);
  }

  async getExportStats(userId?: string, documentId?: string): Promise<any> {
    return this.exportModel.getExportStats(userId, documentId);
  }

  async getQueueStatus(): Promise<any> {
    return this.exportModel.getQueueStatus();
  }

  async retryFailedExport(exportId: string): Promise<boolean> {
    try {
      await this.exportModel.retryFailed(exportId);
      this.jobQueue.push(exportId);
      return true;
    } catch (error) {
      return false;
    }
  }

  async cleanupOldExports(olderThanDays: number = 30): Promise<number> {
    return this.exportModel.cleanup(olderThanDays);
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.jobQueue.length > 0 && this.activeJobs.size < this.config.maxConcurrentExports!) {
      const exportId = this.jobQueue.shift()!;
      this.processExport(exportId);
    }

    this.processing = false;

    // Continue processing if there are more jobs
    if (this.jobQueue.length > 0) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  private async processExport(exportId: string): Promise<void> {
    const jobProgress: ExportJobProgress = {
      exportId,
      status: ExportStatus.PROCESSING,
      progress: 0,
      currentStep: 'Initializing export',
      startTime: new Date(),
    };

    this.activeJobs.set(exportId, jobProgress);

    try {
      // Mark as processing in database
      await this.exportModel.markAsProcessing(exportId);

      // Get export details
      const exportRecord = await this.exportModel.findById(exportId, {
        includeRelations: { document: true, createdBy: true },
      });

      if (!exportRecord) {
        throw new Error('Export record not found');
      }

      // Update progress
      jobProgress.currentStep = 'Loading document data';
      jobProgress.progress = 10;

      // Load document data
      const documentData = await this.loadDocumentData(exportRecord.documentId);

      // Update progress
      jobProgress.currentStep = 'Generating export';
      jobProgress.progress = 30;

      // Generate export based on format
      const result = await this.generateExport(
        documentData,
        exportRecord.format,
        exportRecord.parameters as ExportParameters
      );

      // Update progress
      jobProgress.currentStep = 'Saving file';
      jobProgress.progress = 80;

      // Save file and update database
      const fileSize = BigInt(result.data.length);
      const filePath = await this.saveExportFile(exportId, exportRecord.format, result.data);

      // Update progress
      jobProgress.currentStep = 'Finalizing';
      jobProgress.progress = 100;

      // Mark as completed
      await this.exportModel.markAsCompleted(exportId, filePath, fileSize);

      jobProgress.status = ExportStatus.COMPLETED;
      jobProgress.estimatedCompletion = new Date();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.exportModel.markAsFailed(exportId, errorMessage);
      
      jobProgress.status = ExportStatus.FAILED;
      jobProgress.error = errorMessage;
      jobProgress.progress = 0;
      jobProgress.currentStep = 'Failed';
    } finally {
      // Remove from active jobs after a delay to allow status checks
      setTimeout(() => {
        this.activeJobs.delete(exportId);
      }, 30000); // 30 seconds
    }
  }

  private async loadDocumentData(documentId: string): Promise<DocumentExportData> {
    const [document, sections, hierarchy] = await Promise.all([
      this.documentModel.findById(documentId, {
        includeRelations: {
          createdBy: true,
          owner: true,
        },
      }),
      this.sectionModel.findByDocumentId(documentId),
      this.sectionModel.getHierarchy(documentId),
    ]);

    if (!document) {
      throw new Error('Document not found');
    }

    return {
      document,
      sections,
      hierarchy,
      metadata: {
        exportedAt: new Date().toISOString(),
        documentId,
        title: document.title,
        wordCount: document.wordCount,
        version: document.version,
      },
    };
  }

  private async generateExport(
    data: DocumentExportData,
    format: ExportFormat,
    parameters: ExportParameters
  ): Promise<{ data: Buffer; mimeType: string }> {
    switch (format) {
      case ExportFormat.PDF:
        return this.generatePDF(data, parameters);
      case ExportFormat.HTML:
        return this.generateHTML(data, parameters);
      case ExportFormat.MARKDOWN:
        return this.generateMarkdown(data, parameters);
      case ExportFormat.WORD:
        return this.generateWord(data, parameters);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private async generatePDF(data: DocumentExportData, parameters: ExportParameters): Promise<{ data: Buffer; mimeType: string }> {
    // In production, you'd use a library like puppeteer, pdfkit, or jsPDF
    // For now, we'll create a simple text-based PDF representation
    
    const content = this.buildTextContent(data, parameters);
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Times-Roman
>>
endobj

5 0 obj
<<
/Length ${content.length}
>>
stream
BT
/F1 12 Tf
72 720 Td
(${content.replace(/\n/g, ') Tj 0 -14 Td (')}) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000380 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${530 + content.length}
%%EOF`;

    return {
      data: Buffer.from(pdfContent, 'utf8'),
      mimeType: 'application/pdf',
    };
  }

  private async generateHTML(data: DocumentExportData, parameters: ExportParameters): Promise<{ data: Buffer; mimeType: string }> {
    const styles = parameters.includeStyles ? this.getDefaultCSS() : '';
    const navigation = parameters.includeNavigation ? this.buildNavigation(data.hierarchy) : '';
    const content = this.buildHTMLContent(data, parameters);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.document.title}</title>
  ${styles ? `<style>${styles}</style>` : ''}
  ${parameters.customCSS ? `<style>${parameters.customCSS}</style>` : ''}
</head>
<body>
  <header>
    <h1>${data.document.title}</h1>
    <p>Exported on ${data.metadata.exportedAt}</p>
    <p>Word Count: ${data.document.wordCount}</p>
  </header>
  
  ${navigation}
  
  <main>
    ${content}
  </main>
  
  <footer>
    <p>Generated by Technical Specification System</p>
  </footer>
</body>
</html>`;

    return {
      data: Buffer.from(html, 'utf8'),
      mimeType: 'text/html',
    };
  }

  private async generateMarkdown(data: DocumentExportData, parameters: ExportParameters): Promise<{ data: Buffer; mimeType: string }> {
    let markdown = '';

    // Add metadata if requested
    if (parameters.includeMetadata) {
      markdown += `---
title: ${data.document.title}
exported: ${data.metadata.exportedAt}
word_count: ${data.document.wordCount}
version: ${data.document.version}
---

`;
    }

    // Add title
    markdown += `# ${data.document.title}\n\n`;

    // Add table of contents if requested
    if (parameters.includeTableOfContents) {
      markdown += '## Table of Contents\n\n';
      for (const section of data.hierarchy) {
        const indent = '  '.repeat(section.level);
        markdown += `${indent}- [${section.title}](#${this.slugify(section.title)})\n`;
      }
      markdown += '\n';
    }

    // Add content
    markdown += this.buildMarkdownContent(data.hierarchy, parameters);

    return {
      data: Buffer.from(markdown, 'utf8'),
      mimeType: 'text/markdown',
    };
  }

  private async generateWord(data: DocumentExportData, parameters: ExportParameters): Promise<{ data: Buffer; mimeType: string }> {
    // In production, you'd use a library like docx or officegen
    // For now, we'll create a simple RTF document that Word can open
    
    const content = this.buildTextContent(data, parameters);
    const rtf = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24 ${data.document.title}\\par
\\par
Exported on ${data.metadata.exportedAt}\\par
Word Count: ${data.document.wordCount}\\par
\\par
${content.replace(/\n/g, '\\par ')}}`;

    return {
      data: Buffer.from(rtf, 'utf8'),
      mimeType: 'application/rtf',
    };
  }

  private buildTextContent(data: DocumentExportData, parameters: ExportParameters): string {
    let content = `${data.document.title}\n\n`;
    
    const sectionsToInclude = this.filterSections(data.sections, parameters);
    
    for (const section of sectionsToInclude) {
      const headingLevel = Math.min(section.level + 1, 6);
      const heading = '#'.repeat(headingLevel);
      content += `${heading} ${section.title}\n\n`;
      content += `${section.content}\n\n`;
    }

    return content;
  }

  private buildHTMLContent(data: DocumentExportData, parameters: ExportParameters): string {
    let html = '';
    const sectionsToInclude = this.filterSections(data.sections, parameters);

    for (const section of sectionsToInclude) {
      const headingLevel = Math.min(section.level + 1, 6);
      const id = this.slugify(section.title);
      
      html += `<section id="${id}">
        <h${headingLevel}>${section.title}</h${headingLevel}>
        <div class="content">${this.convertMarkdownToHTML(section.content)}</div>
      </section>\n`;
    }

    return html;
  }

  private buildMarkdownContent(hierarchy: any[], parameters: ExportParameters): string {
    let markdown = '';

    const processSection = (section: any) => {
      const headingLevel = Math.min(section.level + 1, 6);
      const heading = '#'.repeat(headingLevel);
      
      markdown += `${heading} ${section.title}\n\n`;
      markdown += `${section.content}\n\n`;

      if (section.children) {
        for (const child of section.children) {
          processSection(child);
        }
      }
    };

    for (const section of hierarchy) {
      processSection(section);
    }

    return markdown;
  }

  private buildNavigation(hierarchy: any[]): string {
    let nav = '<nav class="table-of-contents"><ul>';

    const buildNavItem = (section: any) => {
      const id = this.slugify(section.title);
      nav += `<li><a href="#${id}">${section.title}</a>`;
      
      if (section.children && section.children.length > 0) {
        nav += '<ul>';
        for (const child of section.children) {
          buildNavItem(child);
        }
        nav += '</ul>';
      }
      
      nav += '</li>';
    };

    for (const section of hierarchy) {
      buildNavItem(section);
    }

    nav += '</ul></nav>';
    return nav;
  }

  private filterSections(sections: any[], parameters: ExportParameters): any[] {
    let filtered = sections;

    if (parameters.includeSections && parameters.includeSections.length > 0) {
      filtered = filtered.filter(s => parameters.includeSections!.includes(s.id));
    }

    if (parameters.excludeSections && parameters.excludeSections.length > 0) {
      filtered = filtered.filter(s => !parameters.excludeSections!.includes(s.id));
    }

    return filtered.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.order - b.order;
    });
  }

  private convertMarkdownToHTML(markdown: string): string {
    // Simple markdown to HTML conversion
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private getDefaultCSS(): string {
    return `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
      header { border-bottom: 1px solid #ddd; margin-bottom: 30px; padding-bottom: 20px; }
      h1, h2, h3, h4, h5, h6 { color: #333; margin-top: 30px; }
      .table-of-contents { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
      .table-of-contents ul { list-style-type: none; padding-left: 20px; }
      .table-of-contents a { text-decoration: none; color: #0066cc; }
      .content { margin: 20px 0; }
      code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: 'Monaco', monospace; }
      footer { border-top: 1px solid #ddd; margin-top: 50px; padding-top: 20px; text-align: center; color: #666; }
    `;
  }

  private async saveExportFile(exportId: string, format: ExportFormat, data: Buffer): Promise<string> {
    const extension = this.getFileExtension(format);
    const filename = `${exportId}.${extension}`;
    const filePath = path.join(this.config.outputPath, filename);

    // Ensure output directory exists
    await fs.mkdir(this.config.outputPath, { recursive: true });

    // Write file
    await fs.writeFile(filePath, data);

    // If S3 is configured, upload to S3 and return S3 path
    if (this.config.s3Config) {
      return this.uploadToS3(filename, data);
    }

    return filename; // Return relative path
  }

  private async uploadToS3(filename: string, data: Buffer): Promise<string> {
    // In production, you'd use AWS SDK to upload to S3
    // For now, return a placeholder S3 path
    return `s3://${this.config.s3Config!.bucket}/exports/${filename}`;
  }

  private getFileExtension(format: ExportFormat): string {
    switch (format) {
      case ExportFormat.PDF: return 'pdf';
      case ExportFormat.HTML: return 'html';
      case ExportFormat.MARKDOWN: return 'md';
      case ExportFormat.WORD: return 'rtf';
      default: return 'txt';
    }
  }

  private getProgressFromStatus(status: ExportStatus): number {
    switch (status) {
      case ExportStatus.PENDING: return 0;
      case ExportStatus.PROCESSING: return 50;
      case ExportStatus.COMPLETED: return 100;
      case ExportStatus.FAILED: return 0;
      default: return 0;
    }
  }

  private getStepFromStatus(status: ExportStatus): string {
    switch (status) {
      case ExportStatus.PENDING: return 'Queued for processing';
      case ExportStatus.PROCESSING: return 'Processing export';
      case ExportStatus.COMPLETED: return 'Export completed';
      case ExportStatus.FAILED: return 'Export failed';
      default: return 'Unknown status';
    }
  }

  private startQueueProcessor(): void {
    // Process queue every 5 seconds
    setInterval(() => {
      if (!this.processing && this.jobQueue.length > 0) {
        this.processQueue();
      }
    }, 5000);
  }
}

export default ExportService;