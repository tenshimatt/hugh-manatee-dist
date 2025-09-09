#!/usr/bin/env node
/**
 * RAWGLE Database Backup and Restore System
 * 
 * Comprehensive backup/restore solution with automated retention, encryption,
 * and disaster recovery capabilities for operational excellence.
 * 
 * Usage:
 *   npm run backup                    - Create full backup
 *   npm run backup:schema             - Schema-only backup
 *   npm run backup:data               - Data-only backup  
 *   npm run restore <backup_file>     - Restore from backup
 *   npm run backup:verify <file>      - Verify backup integrity
 *   npm run backup:schedule           - Run scheduled backup routine
 *   npm run backup:cleanup            - Clean old backups per retention policy
 * 
 * Created: 2025-09-07
 * Component: Database Operations
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import * as crypto from 'crypto';
import { db } from '../config/database';
import { logger } from '../config/logger';

// Configuration
const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');
const BACKUP_RETENTION_DAYS = 30;
const BACKUP_RETENTION_WEEKLY = 8; // Keep 8 weeks of weekly backups
const BACKUP_RETENTION_MONTHLY = 12; // Keep 12 months of monthly backups
const COMPRESS_BACKUPS = true;
const ENCRYPT_BACKUPS = process.env.BACKUP_ENCRYPTION_KEY ? true : false;
const BACKUP_ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY;

interface BackupMetadata {
  filename: string;
  timestamp: Date;
  type: 'full' | 'schema' | 'data' | 'incremental';
  size_bytes: number;
  checksum: string;
  compressed: boolean;
  encrypted: boolean;
  database_version: string;
  tables_included: string[];
  records_count: number;
  duration_ms: number;
  pgdump_version: string;
  created_by: string;
}

interface RestoreOptions {
  backupFile: string;
  targetDatabase?: string;
  schemaOnly?: boolean;
  dataOnly?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
  skipExistingTables?: boolean;
}

class BackupRestoreManager {

  constructor() {
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
      
      // Create subdirectories for organization
      await fs.mkdir(path.join(BACKUP_DIR, 'daily'), { recursive: true });
      await fs.mkdir(path.join(BACKUP_DIR, 'weekly'), { recursive: true });
      await fs.mkdir(path.join(BACKUP_DIR, 'monthly'), { recursive: true });
      await fs.mkdir(path.join(BACKUP_DIR, 'manual'), { recursive: true });
      
    } catch (error) {
      logger.error('Failed to create backup directory:', error);
      throw error;
    }
  }

  /**
   * Create a full database backup
   */
  async createFullBackup(isScheduled: boolean = false): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupType = isScheduled ? this.getScheduledBackupType() : 'manual';
    const filename = `rawgle-backup-full-${timestamp}.sql`;
    const backupPath = path.join(BACKUP_DIR, backupType, filename);

    logger.info(`Starting full backup: ${filename}`);
    const startTime = Date.now();

    try {
      // Get database connection info from environment
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      const dbConfig = this.parseDatabaseUrl(dbUrl);
      
      // Create pg_dump command
      const pgDumpArgs = [
        '--host', dbConfig.host,
        '--port', dbConfig.port.toString(),
        '--username', dbConfig.username,
        '--format', 'custom',
        '--verbose',
        '--compress', '9',
        '--no-password',
        '--file', backupPath,
        dbConfig.database
      ];

      // Set password via environment
      const env = { ...process.env, PGPASSWORD: dbConfig.password };

      // Execute pg_dump
      execSync(`pg_dump ${pgDumpArgs.join(' ')}`, {
        env,
        stdio: 'pipe'
      });

      // Get backup statistics
      const stats = await fs.stat(backupPath);
      const tablesCount = await this.getTableCount();
      const recordsCount = await this.getTotalRecordsCount();
      const pgDumpVersion = this.getPgDumpVersion();
      const databaseVersion = await this.getDatabaseVersion();

      // Calculate checksum
      const checksum = await this.calculateFileChecksum(backupPath);

      // Compress if enabled
      let finalPath = backupPath;
      if (COMPRESS_BACKUPS) {
        finalPath = await this.compressFile(backupPath);
        await fs.unlink(backupPath); // Remove uncompressed version
      }

      // Encrypt if enabled
      if (ENCRYPT_BACKUPS && BACKUP_ENCRYPTION_KEY) {
        finalPath = await this.encryptFile(finalPath);
        await fs.unlink(finalPath.replace('.enc', '')); // Remove unencrypted version
      }

      const duration = Date.now() - startTime;

      // Create metadata
      const metadata: BackupMetadata = {
        filename: path.basename(finalPath),
        timestamp: new Date(),
        type: 'full',
        size_bytes: (await fs.stat(finalPath)).size,
        checksum: await this.calculateFileChecksum(finalPath),
        compressed: COMPRESS_BACKUPS,
        encrypted: ENCRYPT_BACKUPS,
        database_version: databaseVersion,
        tables_included: await this.getTableNames(),
        records_count: recordsCount,
        duration_ms: duration,
        pgdump_version: pgDumpVersion,
        created_by: process.env.USER || 'system'
      };

      // Save metadata
      await this.saveBackupMetadata(metadata);

      logger.info(`Full backup completed: ${path.basename(finalPath)} (${this.formatBytes(metadata.size_bytes)}, ${duration}ms)`);
      
      return finalPath;

    } catch (error) {
      logger.error('Full backup failed:', error);
      
      // Clean up partial backup file
      try {
        await fs.unlink(backupPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw error;
    }
  }

  /**
   * Create schema-only backup
   */
  async createSchemaBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `rawgle-backup-schema-${timestamp}.sql`;
    const backupPath = path.join(BACKUP_DIR, 'manual', filename);

    logger.info(`Starting schema backup: ${filename}`);

    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      const dbConfig = this.parseDatabaseUrl(dbUrl);
      
      const pgDumpArgs = [
        '--host', dbConfig.host,
        '--port', dbConfig.port.toString(),
        '--username', dbConfig.username,
        '--schema-only',
        '--format', 'custom',
        '--no-password',
        '--file', backupPath,
        dbConfig.database
      ];

      const env = { ...process.env, PGPASSWORD: dbConfig.password };

      execSync(`pg_dump ${pgDumpArgs.join(' ')}`, {
        env,
        stdio: 'pipe'
      });

      logger.info(`Schema backup completed: ${filename}`);
      return backupPath;

    } catch (error) {
      logger.error('Schema backup failed:', error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(options: RestoreOptions): Promise<void> {
    logger.info(`Starting restore from: ${options.backupFile}`);

    try {
      // Verify backup file exists
      await fs.access(options.backupFile);

      let backupPath = options.backupFile;

      // Decrypt if needed
      if (path.extname(backupPath) === '.enc') {
        if (!BACKUP_ENCRYPTION_KEY) {
          throw new Error('Backup is encrypted but no decryption key provided');
        }
        backupPath = await this.decryptFile(backupPath);
      }

      // Decompress if needed
      if (path.extname(backupPath) === '.gz') {
        backupPath = await this.decompressFile(backupPath);
      }

      // Verify backup integrity
      const isValid = await this.verifyBackupIntegrity(backupPath);
      if (!isValid) {
        throw new Error('Backup file integrity check failed');
      }

      if (options.dryRun) {
        logger.info('Dry run completed - backup file is valid for restore');
        return;
      }

      // Get database configuration
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      const dbConfig = this.parseDatabaseUrl(dbUrl);
      const targetDb = options.targetDatabase || dbConfig.database;

      // Build pg_restore command
      const pgRestoreArgs = [
        '--host', dbConfig.host,
        '--port', dbConfig.port.toString(),
        '--username', dbConfig.username,
        '--dbname', targetDb,
        '--verbose',
        '--no-password'
      ];

      if (options.schemaOnly) {
        pgRestoreArgs.push('--schema-only');
      }

      if (options.dataOnly) {
        pgRestoreArgs.push('--data-only');
      }

      if (options.skipExistingTables) {
        pgRestoreArgs.push('--if-exists');
      }

      pgRestoreArgs.push(backupPath);

      const env = { ...process.env, PGPASSWORD: dbConfig.password };

      // Execute restore
      logger.info('Executing database restore...');
      execSync(`pg_restore ${pgRestoreArgs.join(' ')}`, {
        env,
        stdio: options.verbose ? 'inherit' : 'pipe'
      });

      logger.info('Database restore completed successfully');

      // Clean up temporary files if created during decrypt/decompress
      if (backupPath !== options.backupFile) {
        await fs.unlink(backupPath);
      }

    } catch (error) {
      logger.error('Database restore failed:', error);
      throw error;
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackupIntegrity(backupFile: string): Promise<boolean> {
    try {
      logger.info(`Verifying backup integrity: ${backupFile}`);

      // Check if file exists and is readable
      const stats = await fs.stat(backupFile);
      if (stats.size === 0) {
        logger.error('Backup file is empty');
        return false;
      }

      // For PostgreSQL custom format, use pg_restore --list to verify
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        logger.error('DATABASE_URL not configured for verification');
        return false;
      }

      const dbConfig = this.parseDatabaseUrl(dbUrl);
      
      const pgRestoreArgs = [
        '--host', dbConfig.host,
        '--port', dbConfig.port.toString(),
        '--username', dbConfig.username,
        '--list',
        '--no-password',
        backupFile
      ];

      const env = { ...process.env, PGPASSWORD: dbConfig.password };

      try {
        execSync(`pg_restore ${pgRestoreArgs.join(' ')}`, {
          env,
          stdio: 'pipe'
        });

        logger.info('Backup integrity verification passed');
        return true;

      } catch (error) {
        logger.error('Backup integrity verification failed:', error);
        return false;
      }

    } catch (error) {
      logger.error('Error during backup verification:', error);
      return false;
    }
  }

  /**
   * Run scheduled backup routine
   */
  async runScheduledBackup(): Promise<void> {
    logger.info('Starting scheduled backup routine');

    try {
      // Create backup
      const backupPath = await this.createFullBackup(true);
      
      // Run cleanup
      await this.cleanupOldBackups();
      
      // Verify the backup we just created
      const isValid = await this.verifyBackupIntegrity(backupPath);
      if (!isValid) {
        logger.error('Scheduled backup verification failed');
        // Consider sending alert notification here
      }

      logger.info('Scheduled backup routine completed');

    } catch (error) {
      logger.error('Scheduled backup routine failed:', error);
      throw error;
    }
  }

  /**
   * Clean up old backups according to retention policy
   */
  async cleanupOldBackups(): Promise<void> {
    logger.info('Starting backup cleanup');

    try {
      const backupTypes = ['daily', 'weekly', 'monthly', 'manual'];
      
      for (const backupType of backupTypes) {
        const backupDir = path.join(BACKUP_DIR, backupType);
        const files = await fs.readdir(backupDir);
        
        // Sort files by modification time (newest first)
        const fileStats = await Promise.all(
          files.map(async (file) => {
            const filePath = path.join(backupDir, file);
            const stats = await fs.stat(filePath);
            return { file, path: filePath, mtime: stats.mtime };
          })
        );
        
        fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
        
        // Apply retention policy
        const retentionDays = this.getRetentionDays(backupType);
        const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
        
        let deletedCount = 0;
        for (const fileInfo of fileStats) {
          if (fileInfo.mtime < cutoffDate) {
            await fs.unlink(fileInfo.path);
            
            // Also delete associated metadata file
            const metadataPath = fileInfo.path.replace(/\.(sql|gz|enc)$/, '.metadata.json');
            try {
              await fs.unlink(metadataPath);
            } catch (error) {
              // Ignore if metadata file doesn't exist
            }
            
            deletedCount++;
            logger.debug(`Deleted old backup: ${fileInfo.file}`);
          }
        }
        
        if (deletedCount > 0) {
          logger.info(`Cleaned up ${deletedCount} old ${backupType} backups`);
        }
      }

    } catch (error) {
      logger.error('Backup cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStatistics(): Promise<any> {
    try {
      const stats = {
        total_backups: 0,
        total_size_bytes: 0,
        by_type: {} as any,
        oldest_backup: null as Date | null,
        newest_backup: null as Date | null
      };

      const backupTypes = ['daily', 'weekly', 'monthly', 'manual'];
      
      for (const backupType of backupTypes) {
        const backupDir = path.join(BACKUP_DIR, backupType);
        
        try {
          const files = await fs.readdir(backupDir);
          
          let typeStats = {
            count: 0,
            size_bytes: 0,
            oldest: null as Date | null,
            newest: null as Date | null
          };
          
          for (const file of files) {
            if (file.endsWith('.metadata.json')) continue;
            
            const filePath = path.join(backupDir, file);
            const fileStats = await fs.stat(filePath);
            
            typeStats.count++;
            typeStats.size_bytes += fileStats.size;
            
            if (!typeStats.oldest || fileStats.mtime < typeStats.oldest) {
              typeStats.oldest = fileStats.mtime;
            }
            
            if (!typeStats.newest || fileStats.mtime > typeStats.newest) {
              typeStats.newest = fileStats.mtime;
            }
          }
          
          stats.by_type[backupType] = typeStats;
          stats.total_backups += typeStats.count;
          stats.total_size_bytes += typeStats.size_bytes;
          
          if (typeStats.oldest && (!stats.oldest_backup || typeStats.oldest < stats.oldest_backup)) {
            stats.oldest_backup = typeStats.oldest;
          }
          
          if (typeStats.newest && (!stats.newest_backup || typeStats.newest > stats.newest_backup)) {
            stats.newest_backup = typeStats.newest;
          }
          
        } catch (error) {
          // Directory might not exist, continue with other types
          continue;
        }
      }

      return stats;

    } catch (error) {
      logger.error('Failed to get backup statistics:', error);
      throw error;
    }
  }

  // Helper methods

  private parseDatabaseUrl(url: string): any {
    const match = url.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }
    
    return {
      username: match[1],
      password: match[2],
      host: match[3],
      port: parseInt(match[4]),
      database: match[5]
    };
  }

  private getScheduledBackupType(): string {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const dayOfWeek = now.getDay();
    
    // Monthly backup on 1st of month
    if (dayOfMonth === 1) {
      return 'monthly';
    }
    
    // Weekly backup on Sundays
    if (dayOfWeek === 0) {
      return 'weekly';
    }
    
    // Daily backup otherwise
    return 'daily';
  }

  private getRetentionDays(backupType: string): number {
    switch (backupType) {
      case 'daily': return BACKUP_RETENTION_DAYS;
      case 'weekly': return BACKUP_RETENTION_WEEKLY * 7;
      case 'monthly': return BACKUP_RETENTION_MONTHLY * 30;
      case 'manual': return BACKUP_RETENTION_DAYS * 2; // Keep manual backups longer
      default: return BACKUP_RETENTION_DAYS;
    }
  }

  private async calculateFileChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = require('fs').createReadStream(filePath);
      
      stream.on('data', (data: Buffer) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private async compressFile(filePath: string): Promise<string> {
    const compressedPath = filePath + '.gz';
    
    return new Promise((resolve, reject) => {
      const gzip = require('zlib').createGzip();
      const input = require('fs').createReadStream(filePath);
      const output = require('fs').createWriteStream(compressedPath);
      
      input.pipe(gzip).pipe(output);
      
      output.on('finish', () => resolve(compressedPath));
      output.on('error', reject);
    });
  }

  private async decompressFile(filePath: string): Promise<string> {
    const decompressedPath = filePath.replace('.gz', '');
    
    return new Promise((resolve, reject) => {
      const gunzip = require('zlib').createGunzip();
      const input = require('fs').createReadStream(filePath);
      const output = require('fs').createWriteStream(decompressedPath);
      
      input.pipe(gunzip).pipe(output);
      
      output.on('finish', () => resolve(decompressedPath));
      output.on('error', reject);
    });
  }

  private async encryptFile(filePath: string): Promise<string> {
    if (!BACKUP_ENCRYPTION_KEY) {
      throw new Error('Encryption key not provided');
    }
    
    const encryptedPath = filePath + '.enc';
    const key = crypto.scryptSync(BACKUP_ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    return new Promise((resolve, reject) => {
      const cipher = crypto.createCipherGCM('aes-256-gcm', key, iv);
      const input = require('fs').createReadStream(filePath);
      const output = require('fs').createWriteStream(encryptedPath);
      
      // Write IV at the beginning of the file
      output.write(iv);
      
      input.pipe(cipher).pipe(output);
      
      output.on('finish', () => {
        // Append auth tag
        const authTag = cipher.getAuthTag();
        require('fs').appendFileSync(encryptedPath, authTag);
        resolve(encryptedPath);
      });
      
      output.on('error', reject);
    });
  }

  private async decryptFile(filePath: string): Promise<string> {
    if (!BACKUP_ENCRYPTION_KEY) {
      throw new Error('Decryption key not provided');
    }
    
    const decryptedPath = filePath.replace('.enc', '');
    const key = crypto.scryptSync(BACKUP_ENCRYPTION_KEY, 'salt', 32);
    
    return new Promise((resolve, reject) => {
      const encryptedData = require('fs').readFileSync(filePath);
      const iv = encryptedData.slice(0, 16);
      const authTag = encryptedData.slice(-16);
      const encrypted = encryptedData.slice(16, -16);
      
      const decipher = crypto.createDecipherGCM('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      
      try {
        const decrypted = Buffer.concat([
          decipher.update(encrypted),
          decipher.final()
        ]);
        
        require('fs').writeFileSync(decryptedPath, decrypted);
        resolve(decryptedPath);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const metadataPath = path.join(path.dirname(metadata.filename), 
      path.basename(metadata.filename, path.extname(metadata.filename)) + '.metadata.json');
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  private async getTableCount(): Promise<number> {
    const result = await db.query(`
      SELECT COUNT(*) 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    return parseInt(result[0].count);
  }

  private async getTotalRecordsCount(): Promise<number> {
    const tablesResult = await db.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    let totalRecords = 0;
    for (const table of tablesResult) {
      const countResult = await db.query(`SELECT COUNT(*) FROM ${table.tablename}`);
      totalRecords += parseInt(countResult[0].count);
    }
    
    return totalRecords;
  }

  private async getTableNames(): Promise<string[]> {
    const result = await db.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    return result.map(row => row.tablename);
  }

  private async getDatabaseVersion(): Promise<string> {
    const result = await db.query('SELECT version()');
    return result[0].version;
  }

  private getPgDumpVersion(): string {
    try {
      return execSync('pg_dump --version', { encoding: 'utf-8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// CLI Interface
async function main() {
  const manager = new BackupRestoreManager();
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'full':
      case undefined:
        await manager.createFullBackup();
        break;
        
      case 'schema':
        await manager.createSchemaBackup();
        break;
        
      case 'restore':
        if (!arg) {
          throw new Error('Backup file path is required for restore');
        }
        await manager.restoreFromBackup({ backupFile: arg });
        break;
        
      case 'verify':
        if (!arg) {
          throw new Error('Backup file path is required for verification');
        }
        const isValid = await manager.verifyBackupIntegrity(arg);
        console.log(`Backup verification: ${isValid ? 'PASSED' : 'FAILED'}`);
        process.exit(isValid ? 0 : 1);
        break;
        
      case 'schedule':
        await manager.runScheduledBackup();
        break;
        
      case 'cleanup':
        await manager.cleanupOldBackups();
        break;
        
      case 'stats':
        const stats = await manager.getBackupStatistics();
        console.log('\n📊 Backup Statistics:');
        console.log('===================');
        console.log(`Total Backups: ${stats.total_backups}`);
        console.log(`Total Size: ${manager.formatBytes(stats.total_size_bytes)}`);
        console.log(`Oldest Backup: ${stats.oldest_backup?.toISOString()}`);
        console.log(`Newest Backup: ${stats.newest_backup?.toISOString()}`);
        console.log('\nBy Type:');
        for (const [type, typeStats] of Object.entries(stats.by_type)) {
          const ts = typeStats as any;
          console.log(`  ${type}: ${ts.count} backups, ${manager.formatBytes(ts.size_bytes)}`);
        }
        break;
        
      default:
        console.log(`
Usage: npm run backup [command]

Commands:
  full, (default)     Create full database backup
  schema              Create schema-only backup
  restore <file>      Restore from backup file
  verify <file>       Verify backup file integrity
  schedule            Run scheduled backup routine
  cleanup             Clean up old backups per retention policy
  stats               Show backup statistics

Environment Variables:
  DATABASE_URL              - PostgreSQL connection string (required)
  BACKUP_ENCRYPTION_KEY     - Key for backup encryption (optional)

Examples:
  npm run backup
  npm run backup schema
  npm run backup restore ./backups/daily/backup-2025-09-07.sql.gz
  npm run backup verify ./backups/daily/backup-2025-09-07.sql.gz
  npm run backup cleanup
        `);
        break;
    }
  } catch (error) {
    logger.error('Backup/restore operation failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Export for programmatic use
export { BackupRestoreManager };

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Backup/restore failed:', error);
    process.exit(1);
  });
}