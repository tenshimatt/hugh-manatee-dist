import AWS from 'aws-sdk';
import { createLogger } from 'winston';
import { createReadStream } from 'fs';
import { promisify } from 'util';

const logger = createLogger({
  level: 'info',
  format: require('winston').format.combine(
    require('winston').format.timestamp(),
    require('winston').format.errors({ stack: true }),
    require('winston').format.json()
  ),
  defaultMeta: { service: 'storage' },
  transports: [
    new (require('winston').transports.Console)({
      format: require('winston').format.simple()
    })
  ]
});

export interface StorageConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket: string;
  cdnUrl?: string;
}

export interface UploadOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  url: string;
  cdnUrl?: string;
  size: number;
  etag: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number; // seconds
  responseContentDisposition?: string;
  responseContentType?: string;
}

class StorageConnection {
  private static instance: StorageConnection;
  private s3: AWS.S3;
  private config: StorageConfig;

  private constructor() {
    this.config = {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: process.env.AWS_S3_BUCKET || 'spec-system-documents',
      cdnUrl: process.env.AWS_CLOUDFRONT_URL
    };

    AWS.config.update({
      region: this.config.region,
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey
    });

    this.s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      signatureVersion: 'v4'
    });

    logger.info('AWS S3 client initialized', {
      region: this.config.region,
      bucket: this.config.bucket
    });
  }

  public static getInstance(): StorageConnection {
    if (!StorageConnection.instance) {
      StorageConnection.instance = new StorageConnection();
    }
    return StorageConnection.instance;
  }

  public getClient(): AWS.S3 {
    return this.s3;
  }

  public getBucket(): string {
    return this.config.bucket;
  }

  // Document export uploads
  public async uploadExport(
    exportId: string,
    format: string,
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const key = `exports/${format}/${exportId}.${this.getFileExtension(format)}`;
    
    try {
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.config.bucket,
        Key: key,
        Body: buffer,
        ContentType: options.contentType || this.getContentType(format),
        CacheControl: options.cacheControl || 'max-age=31536000', // 1 year
        Metadata: {
          exportId,
          format,
          uploadedAt: new Date().toISOString(),
          ...options.metadata
        }
      };

      if (options.tags) {
        uploadParams.Tagging = this.buildTaggingString(options.tags);
      }

      const result = await this.s3.upload(uploadParams).promise();

      logger.info('Export uploaded successfully', {
        exportId,
        format,
        key,
        size: buffer.length
      });

      return {
        key,
        url: result.Location,
        cdnUrl: this.config.cdnUrl ? `${this.config.cdnUrl}/${key}` : undefined,
        size: buffer.length,
        etag: result.ETag
      };

    } catch (error) {
      logger.error('Failed to upload export', { exportId, format, error });
      throw error;
    }
  }

  // Document asset uploads (images, attachments)
  public async uploadAsset(
    documentId: string,
    fileName: string,
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const key = `documents/${documentId}/assets/${fileName}`;
    
    try {
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.config.bucket,
        Key: key,
        Body: buffer,
        ContentType: options.contentType || this.inferContentType(fileName),
        CacheControl: options.cacheControl || 'max-age=2592000', // 30 days
        Metadata: {
          documentId,
          originalFileName: fileName,
          uploadedAt: new Date().toISOString(),
          ...options.metadata
        }
      };

      const result = await this.s3.upload(uploadParams).promise();

      logger.info('Asset uploaded successfully', {
        documentId,
        fileName,
        key,
        size: buffer.length
      });

      return {
        key,
        url: result.Location,
        cdnUrl: this.config.cdnUrl ? `${this.config.cdnUrl}/${key}` : undefined,
        size: buffer.length,
        etag: result.ETag
      };

    } catch (error) {
      logger.error('Failed to upload asset', { documentId, fileName, error });
      throw error;
    }
  }

  // Generate presigned URLs for secure downloads
  public async getPresignedDownloadUrl(
    key: string,
    options: PresignedUrlOptions = {}
  ): Promise<string> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.config.bucket,
        Key: key
      };

      if (options.responseContentDisposition) {
        params.ResponseContentDisposition = options.responseContentDisposition;
      }

      if (options.responseContentType) {
        params.ResponseContentType = options.responseContentType;
      }

      const url = await this.s3.getSignedUrlPromise('getObject', {
        ...params,
        Expires: options.expiresIn || 3600 // 1 hour default
      });

      logger.debug('Presigned download URL generated', { key, expiresIn: options.expiresIn });
      return url;

    } catch (error) {
      logger.error('Failed to generate presigned URL', { key, error });
      throw error;
    }
  }

  // Generate presigned URLs for direct uploads
  public async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const params = {
        Bucket: this.config.bucket,
        Key: key,
        ContentType: contentType,
        Expires: expiresIn
      };

      const url = await this.s3.getSignedUrlPromise('putObject', params);
      
      logger.debug('Presigned upload URL generated', { key, contentType, expiresIn });
      return url;

    } catch (error) {
      logger.error('Failed to generate presigned upload URL', { key, error });
      throw error;
    }
  }

  // Delete files
  public async deleteFile(key: string): Promise<void> {
    try {
      await this.s3.deleteObject({
        Bucket: this.config.bucket,
        Key: key
      }).promise();

      logger.info('File deleted successfully', { key });
    } catch (error) {
      logger.error('Failed to delete file', { key, error });
      throw error;
    }
  }

  // Delete multiple files
  public async deleteFiles(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    try {
      const objects = keys.map(key => ({ Key: key }));
      
      await this.s3.deleteObjects({
        Bucket: this.config.bucket,
        Delete: {
          Objects: objects
        }
      }).promise();

      logger.info('Multiple files deleted successfully', { count: keys.length });
    } catch (error) {
      logger.error('Failed to delete multiple files', { keys, error });
      throw error;
    }
  }

  // List files with prefix
  public async listFiles(prefix: string, maxKeys: number = 1000): Promise<AWS.S3.Object[]> {
    try {
      const result = await this.s3.listObjectsV2({
        Bucket: this.config.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys
      }).promise();

      return result.Contents || [];
    } catch (error) {
      logger.error('Failed to list files', { prefix, error });
      throw error;
    }
  }

  // Get file metadata
  public async getFileMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      const result = await this.s3.headObject({
        Bucket: this.config.bucket,
        Key: key
      }).promise();

      return result;
    } catch (error) {
      logger.error('Failed to get file metadata', { key, error });
      throw error;
    }
  }

  // Copy file
  public async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      await this.s3.copyObject({
        Bucket: this.config.bucket,
        CopySource: `${this.config.bucket}/${sourceKey}`,
        Key: destinationKey
      }).promise();

      logger.info('File copied successfully', { sourceKey, destinationKey });
    } catch (error) {
      logger.error('Failed to copy file', { sourceKey, destinationKey, error });
      throw error;
    }
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      await this.s3.headBucket({ Bucket: this.config.bucket }).promise();
      return true;
    } catch (error) {
      logger.error('S3 health check failed', { error });
      return false;
    }
  }

  // Helper methods
  private getFileExtension(format: string): string {
    const extensions: Record<string, string> = {
      'pdf': 'pdf',
      'html': 'html',
      'markdown': 'md',
      'word': 'docx'
    };
    return extensions[format.toLowerCase()] || 'bin';
  }

  private getContentType(format: string): string {
    const contentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'html': 'text/html',
      'markdown': 'text/markdown',
      'word': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return contentTypes[format.toLowerCase()] || 'application/octet-stream';
  }

  private inferContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'md': 'text/markdown'
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  private buildTaggingString(tags: Record<string, string>): string {
    return Object.entries(tags)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }
}

export const storage = StorageConnection.getInstance();