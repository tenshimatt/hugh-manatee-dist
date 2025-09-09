#!/usr/bin/env node
/**
 * RAWGLE Database Backup & Disaster Recovery Script
 * 
 * Provides comprehensive backup and recovery capabilities including:
 * - Automated daily backups with retention policies
 * - Point-in-time recovery preparation  
 * - Database health monitoring
 * - Replication setup assistance
 * - Emergency recovery procedures
 * 
 * Usage:
 *   npm run db:backup              - Create full backup
 *   npm run db:backup incremental  - Create incremental backup  
 *   npm run db:restore <file>      - Restore from backup
 *   npm run db:monitor             - Health monitoring
 *   npm run db:recovery-plan       - Generate recovery plan
 * 
 * Created: 2025-09-07
 * Component: Database Administration
 */

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { db } from '../config/database';
import { logger } from '../config/logger';
import { config, dbConfig } from '../config/env';

const execAsync = promisify(exec);

interface BackupConfig {
  retentionDays: number;
  backupDirectory: string;
  compressionLevel: number;
  encryptionEnabled: boolean;
}

interface DatabaseHealth {
  status: 'healthy' | 'warning' | 'critical';
  totalSize: string;
  connectionCount: number;
  lockCount: number;
  longRunningQueries: number;
  cacheHitRatio: number;
  diskSpaceUsed: number;
  uptime: string;
  lastBackup?: Date;
  issues: string[];
  recommendations: string[];
}

class BackupDisasterRecovery {
  private backupConfig: BackupConfig;
  
  constructor() {
    this.backupConfig = {
      retentionDays: 30,
      backupDirectory: path.join(process.cwd(), 'backups'),
      compressionLevel: 6,
      encryptionEnabled: false
    };
  }

  /**
   * Create full database backup
   */
  async createFullBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupConfig.backupDirectory, `rawgle-full-${timestamp}.sql`);
    
    logger.info('Creating full database backup...');
    
    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupConfig.backupDirectory, { recursive: true });
      
      // Create pg_dump command
      const dumpCommand = [
        'pg_dump',
        `--host=${dbConfig.host}`,
        `--port=${dbConfig.port}`,
        `--username=${dbConfig.user}`,
        `--dbname=${dbConfig.database}`,
        '--format=custom',
        '--no-owner',
        '--no-privileges',
        '--verbose',
        '--file=' + backupFile
      ].join(' ');
      
      // Set password via environment variable
      const env = { ...process.env, PGPASSWORD: dbConfig.password };
      
      const { stdout, stderr } = await execAsync(dumpCommand, { env });
      
      if (stderr && !stderr.includes('NOTICE')) {
        logger.warn('pg_dump stderr output:', stderr);
      }
      
      // Compress backup if configured
      if (this.backupConfig.compressionLevel > 0) {
        const compressedFile = backupFile + '.gz';
        await execAsync(`gzip -${this.backupConfig.compressionLevel} "${backupFile}"`);
        logger.info(`Backup compressed: ${compressedFile}`);
        return compressedFile;
      }
      
      logger.info(`Full backup created successfully: ${backupFile}`);
      
      // Update backup metadata
      await this.updateBackupMetadata(backupFile, 'full');
      
      return backupFile;
      
    } catch (error) {
      logger.error('Failed to create full backup:', error);
      throw error;
    }
  }

  /**
   * Create incremental backup (WAL segments)
   */
  async createIncrementalBackup(): Promise<void> {
    logger.info('Creating incremental backup...');
    
    try {
      // For incremental backups, we would typically use WAL-E or similar
      // This is a simplified version showing the concept
      
      const walDirectory = path.join(this.backupConfig.backupDirectory, 'wal');
      await fs.mkdir(walDirectory, { recursive: true });
      
      // Archive current WAL segments
      const archiveCommand = `SELECT pg_switch_wal()`;
      await db.query(archiveCommand);
      
      logger.info('WAL segment switch triggered for incremental backup');
      
    } catch (error) {
      logger.error('Failed to create incremental backup:', error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(backupFile: string, targetDatabase?: string): Promise<void> {
    const dbName = targetDatabase || dbConfig.database;
    
    logger.info(`Restoring database from backup: ${backupFile}`);
    logger.warn('⚠️  This will OVERWRITE the target database!');
    
    try {
      // Check if backup file exists
      await fs.access(backupFile);
      
      // Drop existing connections to target database
      await this.terminateConnections(dbName);
      
      // Create restore command
      const restoreCommand = [
        'pg_restore',
        `--host=${dbConfig.host}`,
        `--port=${dbConfig.port}`,
        `--username=${dbConfig.user}`,
        `--dbname=${dbName}`,
        '--clean',
        '--if-exists',
        '--no-owner',
        '--no-privileges',
        '--verbose',
        backupFile
      ].join(' ');
      
      const env = { ...process.env, PGPASSWORD: dbConfig.password };
      
      const { stdout, stderr } = await execAsync(restoreCommand, { env });
      
      if (stderr && !stderr.includes('NOTICE')) {
        logger.warn('pg_restore stderr output:', stderr);
      }
      
      logger.info(`Database restored successfully from: ${backupFile}`);
      
    } catch (error) {
      logger.error('Failed to restore from backup:', error);
      throw error;
    }
  }

  /**
   * Monitor database health
   */
  async monitorHealth(): Promise<DatabaseHealth> {
    logger.info('Monitoring database health...');
    
    try {
      const health: DatabaseHealth = {
        status: 'healthy',
        totalSize: '0 MB',
        connectionCount: 0,
        lockCount: 0,
        longRunningQueries: 0,
        cacheHitRatio: 0,
        diskSpaceUsed: 0,
        uptime: '0',
        issues: [],
        recommendations: []
      };

      // Database size
      const sizeResult = await db.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      health.totalSize = sizeResult[0]?.size || '0 MB';

      // Connection count
      const connectionResult = await db.query(`
        SELECT count(*) as count FROM pg_stat_activity 
        WHERE state = 'active' AND pid != pg_backend_pid()
      `);
      health.connectionCount = parseInt(connectionResult[0]?.count || '0');

      // Lock count
      const lockResult = await db.query(`
        SELECT count(*) as count FROM pg_locks WHERE NOT granted
      `);
      health.lockCount = parseInt(lockResult[0]?.count || '0');

      // Long running queries
      const longQueryResult = await db.query(`
        SELECT count(*) as count FROM pg_stat_activity 
        WHERE state = 'active' 
          AND now() - query_start > interval '5 minutes'
          AND pid != pg_backend_pid()
      `);
      health.longRunningQueries = parseInt(longQueryResult[0]?.count || '0');

      // Cache hit ratio
      const cacheResult = await db.query(`
        SELECT round(
          100 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read) + 1), 2
        ) as hit_ratio
        FROM pg_stat_database
        WHERE datname = current_database()
      `);
      health.cacheHitRatio = parseFloat(cacheResult[0]?.hit_ratio || '0');

      // Database uptime
      const uptimeResult = await db.query(`
        SELECT date_trunc('second', now() - pg_postmaster_start_time()) as uptime
      `);
      health.uptime = uptimeResult[0]?.uptime || '0';

      // Analyze health issues
      if (health.connectionCount > 80) {
        health.issues.push('High connection count');
        health.status = 'warning';
      }

      if (health.lockCount > 10) {
        health.issues.push('High lock count - possible deadlocks');
        health.status = 'warning';
      }

      if (health.longRunningQueries > 0) {
        health.issues.push('Long running queries detected');
        health.status = 'warning';
      }

      if (health.cacheHitRatio < 95) {
        health.issues.push('Low cache hit ratio');
        health.recommendations.push('Consider increasing shared_buffers');
      }

      // Check last backup
      const backupMetadata = await this.getLastBackupInfo();
      if (backupMetadata) {
        health.lastBackup = new Date(backupMetadata.created_at);
        const daysSinceBackup = (Date.now() - health.lastBackup.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceBackup > 1) {
          health.issues.push('Backup is more than 1 day old');
          health.status = health.status === 'healthy' ? 'warning' : health.status;
        }
      } else {
        health.issues.push('No backup information found');
        health.status = 'critical';
      }

      logger.info(`Database health status: ${health.status}`);
      return health;

    } catch (error) {
      logger.error('Failed to monitor database health:', error);
      return {
        status: 'critical',
        totalSize: '0 MB',
        connectionCount: 0,
        lockCount: 0,
        longRunningQueries: 0,
        cacheHitRatio: 0,
        diskSpaceUsed: 0,
        uptime: '0',
        issues: ['Health monitoring failed'],
        recommendations: ['Check database connectivity']
      };
    }
  }

  /**
   * Generate disaster recovery plan
   */
  async generateRecoveryPlan(): Promise<string> {
    const health = await this.monitorHealth();
    const backupInfo = await this.getLastBackupInfo();
    
    const plan = `
# RAWGLE Database Disaster Recovery Plan
Generated: ${new Date().toISOString()}

## Current Status
- Database Health: ${health.status}
- Last Backup: ${backupInfo ? new Date(backupInfo.created_at).toISOString() : 'None'}
- Database Size: ${health.totalSize}
- Uptime: ${health.uptime}

## Recovery Time Objectives (RTO)
- Critical Systems: 15 minutes
- Full System Recovery: 2 hours
- Maximum Acceptable Downtime: 4 hours

## Recovery Point Objectives (RPO)
- Maximum Data Loss: 1 hour
- Backup Frequency: Daily full, Hourly incremental
- Transaction Log Archiving: Continuous

## Emergency Contacts
- Database Administrator: dba@rawgle.com
- System Administrator: sysadmin@rawgle.com
- Emergency Hotline: +1-555-RAWGLE

## Recovery Procedures

### 1. Complete Database Failure
\`\`\`bash
# Step 1: Assess damage
npm run db:monitor

# Step 2: Restore from latest backup
npm run db:restore <backup-file>

# Step 3: Apply incremental backups if available
npm run db:recovery-incremental

# Step 4: Verify data integrity
npm run db:verify
\`\`\`

### 2. Partial Data Corruption
\`\`\`bash
# Step 1: Identify affected tables
npm run db:check-integrity

# Step 2: Restore specific tables from backup
pg_restore --table=<table_name> <backup-file>

# Step 3: Rebuild indexes
npm run db:reindex
\`\`\`

### 3. Performance Issues
\`\`\`bash
# Step 1: Identify blocking queries
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Step 2: Kill problematic queries
SELECT pg_terminate_backend(<pid>);

# Step 3: Run maintenance
npm run db:maintenance
\`\`\`

## Testing Schedule
- Weekly: Backup restoration test
- Monthly: Full disaster recovery drill
- Quarterly: Recovery plan review

## Monitoring Alerts
${health.issues.length > 0 ? '⚠️ Current Issues:\n' + health.issues.map(i => `- ${i}`).join('\n') : '✅ No current issues'}

${health.recommendations.length > 0 ? '\n📋 Recommendations:\n' + health.recommendations.map(r => `- ${r}`).join('\n') : ''}

## Backup Retention Policy
- Daily backups: 30 days
- Weekly backups: 12 weeks  
- Monthly backups: 12 months
- Yearly backups: 7 years

## Next Steps
1. Verify backup integrity
2. Test restoration procedures
3. Update recovery documentation
4. Schedule next disaster recovery test
`;

    const planFile = path.join(this.backupConfig.backupDirectory, `recovery-plan-${new Date().toISOString().split('T')[0]}.md`);
    await fs.writeFile(planFile, plan, 'utf-8');
    
    logger.info(`Recovery plan generated: ${planFile}`);
    return plan;
  }

  /**
   * Setup continuous WAL archiving for point-in-time recovery
   */
  async setupWALArchiving(): Promise<void> {
    logger.info('Setting up WAL archiving for point-in-time recovery...');
    
    const walArchiveDir = path.join(this.backupConfig.backupDirectory, 'wal-archive');
    await fs.mkdir(walArchiveDir, { recursive: true });
    
    const archiveScript = `#!/bin/bash
# WAL Archive Script for RAWGLE
# This script should be called by PostgreSQL archive_command

WAL_FILE=$1
ARCHIVE_DIR="${walArchiveDir}"
DESTINATION="$ARCHIVE_DIR/$(basename $WAL_FILE)"

# Copy WAL file to archive directory
cp "$WAL_FILE" "$DESTINATION"

# Verify copy
if [ -f "$DESTINATION" ]; then
    echo "$(date): Archived $WAL_FILE to $DESTINATION" >> ${walArchiveDir}/archive.log
    exit 0
else
    echo "$(date): Failed to archive $WAL_FILE" >> ${walArchiveDir}/archive.log
    exit 1
fi
`;

    const scriptPath = path.join(walArchiveDir, 'archive-wal.sh');
    await fs.writeFile(scriptPath, archiveScript, 'utf-8');
    await execAsync(`chmod +x "${scriptPath}"`);
    
    logger.info('WAL archiving script created. Update postgresql.conf with:');
    logger.info(`archive_mode = on`);
    logger.info(`archive_command = '${scriptPath} %p'`);
  }

  /**
   * Cleanup old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<void> {
    logger.info('Cleaning up old backups...');
    
    try {
      const files = await fs.readdir(this.backupConfig.backupDirectory);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.backupConfig.retentionDays);
      
      let deletedCount = 0;
      
      for (const file of files) {
        if (!file.startsWith('rawgle-') || !file.endsWith('.sql')) continue;
        
        const filePath = path.join(this.backupConfig.backupDirectory, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
          logger.debug(`Deleted old backup: ${file}`);
        }
      }
      
      logger.info(`Cleaned up ${deletedCount} old backup files`);
      
    } catch (error) {
      logger.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Terminate active connections to a database
   */
  private async terminateConnections(database: string): Promise<void> {
    try {
      await db.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = $1
          AND pid <> pg_backend_pid()
      `, [database]);
      
      logger.info(`Terminated connections to database: ${database}`);
    } catch (error) {
      logger.warn('Failed to terminate some connections:', error);
    }
  }

  /**
   * Update backup metadata
   */
  private async updateBackupMetadata(backupFile: string, backupType: string): Promise<void> {
    const metadataFile = path.join(this.backupConfig.backupDirectory, 'backup-metadata.json');
    
    try {
      let metadata: any = {};
      try {
        const existing = await fs.readFile(metadataFile, 'utf-8');
        metadata = JSON.parse(existing);
      } catch {
        // File doesn't exist, start with empty metadata
      }
      
      if (!metadata.backups) metadata.backups = [];
      
      metadata.backups.push({
        file: path.basename(backupFile),
        type: backupType,
        created_at: new Date().toISOString(),
        size: (await fs.stat(backupFile)).size
      });
      
      // Keep only last 100 backup records
      if (metadata.backups.length > 100) {
        metadata.backups = metadata.backups.slice(-100);
      }
      
      await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
      
    } catch (error) {
      logger.warn('Failed to update backup metadata:', error);
    }
  }

  /**
   * Get information about the last backup
   */
  private async getLastBackupInfo(): Promise<any> {
    const metadataFile = path.join(this.backupConfig.backupDirectory, 'backup-metadata.json');
    
    try {
      const metadata = JSON.parse(await fs.readFile(metadataFile, 'utf-8'));
      return metadata.backups && metadata.backups.length > 0 
        ? metadata.backups[metadata.backups.length - 1]
        : null;
    } catch {
      return null;
    }
  }
}

// CLI Interface
async function main() {
  const recovery = new BackupDisasterRecovery();
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'full':
      case undefined:
        await recovery.createFullBackup();
        await recovery.cleanupOldBackups();
        break;
        
      case 'incremental':
        await recovery.createIncrementalBackup();
        break;
        
      case 'restore':
        if (!arg) {
          throw new Error('Backup file is required for restore');
        }
        await recovery.restoreFromBackup(arg);
        break;
        
      case 'monitor':
        const health = await recovery.monitorHealth();
        console.log('\n📊 Database Health Report:');
        console.log('==========================');
        console.log(`Status: ${health.status === 'healthy' ? '✅' : health.status === 'warning' ? '⚠️' : '❌'} ${health.status.toUpperCase()}`);
        console.log(`Size: ${health.totalSize}`);
        console.log(`Connections: ${health.connectionCount}`);
        console.log(`Cache Hit Ratio: ${health.cacheHitRatio}%`);
        console.log(`Uptime: ${health.uptime}`);
        
        if (health.lastBackup) {
          console.log(`Last Backup: ${health.lastBackup.toISOString()}`);
        }
        
        if (health.issues.length > 0) {
          console.log('\n⚠️ Issues:');
          health.issues.forEach(issue => console.log(`  - ${issue}`));
        }
        
        if (health.recommendations.length > 0) {
          console.log('\n📋 Recommendations:');
          health.recommendations.forEach(rec => console.log(`  - ${rec}`));
        }
        break;
        
      case 'recovery-plan':
        const plan = await recovery.generateRecoveryPlan();
        console.log(plan);
        break;
        
      case 'setup-wal':
        await recovery.setupWALArchiving();
        break;
        
      case 'cleanup':
        await recovery.cleanupOldBackups();
        break;
        
      default:
        console.log(`
Usage: npm run db:backup [command]

Commands:
  full, (default)     Create full database backup
  incremental         Create incremental backup
  restore <file>      Restore from backup file
  monitor            Monitor database health
  recovery-plan      Generate disaster recovery plan
  setup-wal          Setup WAL archiving
  cleanup            Clean up old backups

Examples:
  npm run db:backup
  npm run db:backup incremental
  npm run db:backup restore backups/rawgle-full-2025-09-07.sql
  npm run db:backup monitor
        `);
        break;
    }
  } catch (error) {
    logger.error('Backup/recovery command failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Export for programmatic use
export { BackupDisasterRecovery };

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Backup/recovery failed:', error);
    process.exit(1);
  });
}