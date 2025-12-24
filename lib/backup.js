// ========================================
// ERP MAIN - BACKUP & RECOVERY SYSTEM
// Production-Grade Backup Strategy for MySQL
// ========================================

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
require('dotenv/config');

// ========================================
// BACKUP CONFIGURATION
// ========================================

const BACKUP_CONFIG = {
  // Local backup settings
  local: {
    basePath: process.env.BACKUP_DIR || './backups',
    retention: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    maxBackups: parseInt(process.env.MAX_BACKUPS || '100'),
    compression: true
  },
  
  // MySQL settings
  mysql: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || '3306',
    database: process.env.DATABASE_NAME || 'erp_main_db',
    username: process.env.DATABASE_USERNAME || 'root',
    password: process.env.DATABASE_PASSWORD || 'password'
  },
  
  // Remote backup settings (optional)
  remote: {
    enabled: process.env.REMOTE_BACKUP_ENABLED === 'true',
    type: process.env.REMOTE_BACKUP_TYPE || 's3', // s3, ftp, sftp
    config: {
      bucket: process.env.S3_BUCKET || '',
      region: process.env.S3_REGION || 'us-east-1',
      accessKey: process.env.S3_ACCESS_KEY || '',
      secretKey: process.env.S3_SECRET_KEY || ''
    }
  }
};

// ========================================
// BACKUP UTILITIES
// ========================================

class DatabaseBackup {
  constructor() {
    this.backupDir = BACKUP_CONFIG.local.basePath;
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupFile = `erp-backup-${this.timestamp}.sql`;
    this.fullPath = path.join(this.backupDir, this.backupFile);
  }

  // Create backup directory
  async createBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`📁 Backup directory created: ${this.backupDir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  // Execute MySQL dump command
  async createMySQLDump() {
    return new Promise((resolve, reject) => {
      const { host, port, database, username, password } = BACKUP_CONFIG.mysql;
      
      // Build mysqldump command
      let dumpCmd = `mysqldump`;
      
      // Add connection options
      dumpCmd += ` --host=${host}`;
      dumpCmd += ` --port=${port}`;
      dumpCmd += ` --user=${username}`;
      dumpCmd += ` --password=${password}`;
      
      // Add backup options
      dumpCmd += ` --single-transaction`; // Consistent backup
      dumpCmd += ` --routines`;           // Include stored procedures
      dumpCmd += ` --triggers`;           // Include triggers
      dumpCmd += ` --events`;             // Include events
      dumpCmd += ` --add-drop-database`;  // Add DROP DATABASE
      dumpCmd += ` --databases`;          // Backup database creation
      
      dumpCmd += ` ${database}`;
      
      // Create write stream
      const writeStream = require('fs').createWriteStream(this.fullPath);
      
      console.log('🔄 Starting MySQL backup...');
      
      const child = exec(dumpCmd, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`mysqldump failed: ${error.message}`));
          return;
        }
        
        if (stderr) {
          console.warn('⚠️ mysqldump warnings:', stderr);
        }
        
        writeStream.end();
        resolve(this.fullPath);
      });
      
      // Handle stream events
      child.stdout.pipe(writeStream);
      child.stderr.on('data', (data) => {
        console.warn('mysqldump:', data.toString());
      });
    });
  }

  // Compress backup file
  async compressBackup() {
    if (!BACKUP_CONFIG.local.compression) return this.fullPath;
    
    const compressedFile = this.fullPath + '.gz';
    
    return new Promise((resolve, reject) => {
      console.log('🗜️ Compressing backup...');
      
      exec(`gzip -c "${this.fullPath}" > "${compressedFile}"`, (error) => {
        if (error) {
          reject(error);
          return;
        }
        
        // Remove uncompressed file
        fs.unlink(this.fullPath).catch(console.warn);
        
        console.log(`✅ Backup compressed: ${compressedFile}`);
        resolve(compressedFile);
      });
    });
  }

  // Verify backup integrity
  async verifyBackup(backupPath) {
    try {
      console.log('🔍 Verifying backup integrity...');
      
      const isCompressed = backupPath.endsWith('.gz');
      const verifyCmd = isCompressed 
        ? `gunzip -t "${backupPath}"`
        : `mysql --host=${BACKUP_CONFIG.mysql.host} --user=${BACKUP_CONFIG.mysql.username} --password=${BACKUP_CONFIG.mysql.password} --execute="SELECT 1" ${BACKUP_CONFIG.mysql.database}`;
      
      return new Promise((resolve, reject) => {
        exec(verifyCmd, (error) => {
          if (error) {
            reject(new Error(`Backup verification failed: ${error.message}`));
            return;
          }
          
          console.log('✅ Backup verification successful');
          resolve(true);
        });
      });
    } catch (error) {
      console.error('❌ Backup verification failed:', error.message);
      throw error;
    }
  }

  // Upload to remote storage
  async uploadToRemote(backupPath) {
    if (!BACKUP_CONFIG.remote.enabled) {
      console.log('☁️ Remote backup disabled');
      return false;
    }
    
    try {
      console.log('☁️ Uploading to remote storage...');
      
      if (BACKUP_CONFIG.remote.type === 's3') {
        return await this.uploadToS3(backupPath);
      } else {
        console.log('☁️ Remote backup type not implemented yet');
        return false;
      }
    } catch (error) {
      console.error('❌ Remote upload failed:', error.message);
      return false;
    }
  }

  // Upload to AWS S3
  async uploadToS3(backupPath) {
    try {
      const AWS = require('aws-sdk');
      const { bucket, region, accessKey, secretKey } = BACKUP_CONFIG.remote.config;
      
      AWS.config.update({
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        region: region
      });
      
      const s3 = new AWS.S3();
      const fileName = path.basename(backupPath);
      const s3Key = `erp-backups/${fileName}`;
      
      const fileContent = await fs.readFile(backupPath);
      
      await s3.upload({
        Bucket: bucket,
        Key: s3Key,
        Body: fileContent,
        ServerSideEncryption: 'AES256'
      }).promise();
      
      console.log(`✅ Backup uploaded to S3: s3://${bucket}/${s3Key}`);
      return true;
    } catch (error) {
      console.error('❌ S3 upload failed:', error.message);
      return false;
    }
  }

  // Cleanup old backups
  async cleanupOldBackups() {
    try {
      console.log('🧹 Cleaning up old backups...');
      
      const files = await fs.readdir(this.backupDir);
      const backupFileStats = await Promise.all(
        files
          .filter(file => file.startsWith('erp-backup-'))
          .map(async file => {
            const stat = await fs.stat(path.join(this.backupDir, file));
            return {
              name: file,
              path: path.join(this.backupDir, file),
              time: stat.mtime
            };
          })
      );
      
      const backupFiles = backupFileStats.sort((a, b) => b.time - a.time);
      
      const maxBackups = BACKUP_CONFIG.local.maxBackups;
      const retentionDays = BACKUP_CONFIG.local.retention;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const toDelete = [];
      
      // Remove excess backups
      if (backupFiles.length > maxBackups) {
        toDelete.push(...backupFiles.slice(maxBackups));
      }
      
      // Remove old backups
      backupFiles.forEach(backup => {
        if (backup.time < cutoffDate) {
          toDelete.push(backup);
        }
      });
      
      // Delete old backups
      for (const backup of toDelete) {
        await fs.unlink(backup.path);
        console.log(`🗑️ Deleted old backup: ${backup.name}`);
      }
      
      console.log(`✅ Cleanup completed. ${toDelete.length} old backups deleted`);
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  // Create backup metadata
  async createBackupMetadata(backupPath) {
    const metadata = {
      timestamp: new Date().toISOString(),
      backupFile: path.basename(backupPath),
      size: (await fs.stat(backupPath)).size,
      compressed: backupPath.endsWith('.gz'),
      database: BACKUP_CONFIG.mysql.database,
      host: BACKUP_CONFIG.mysql.host,
      version: '2.0.0'
    };
    
    const metadataPath = backupPath + '.meta.json';
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`📋 Backup metadata created: ${metadataPath}`);
    return metadataPath;
  }

  // Main backup process
  async createBackup() {
    console.log('🚀 Starting database backup process...');
    console.log('=' * 50);
    
    try {
      // Create backup directory
      await this.createBackupDirectory();
      
      // Create MySQL dump
      const backupPath = await this.createMySQLDump();
      
      // Compress if enabled
      const finalPath = await this.compressBackup();
      
      // Verify backup
      await this.verifyBackup(finalPath);
      
      // Upload to remote storage
      await this.uploadToRemote(finalPath);
      
      // Create metadata
      const metadataPath = await this.createBackupMetadata(finalPath);
      
      // Cleanup old backups
      await this.cleanupOldBackups();
      
      console.log('=' * 50);
      console.log('✅ Backup completed successfully!');
      console.log(`📁 Backup file: ${finalPath}`);
      console.log(`📋 Metadata: ${metadataPath}`);
      
      return {
        success: true,
        backupPath: finalPath,
        metadataPath: metadataPath,
        size: (await fs.stat(finalPath)).size
      };
      
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }
}

// ========================================
// RECOVERY UTILITIES
// ========================================

class DatabaseRecovery {
  constructor(backupPath) {
    this.backupPath = backupPath;
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  // Create recovery directory
  async createRecoveryDirectory() {
    const recoveryDir = path.join('./recovery', this.timestamp);
    await fs.mkdir(recoveryDir, { recursive: true });
    console.log(`📁 Recovery directory created: ${recoveryDir}`);
    return recoveryDir;
  }

  // Extract compressed backup
  async extractBackup(backupPath) {
    if (!backupPath.endsWith('.gz')) {
      return backupPath;
    }
    
    const extractedPath = backupPath.replace('.gz', '');
    
    console.log('🗜️ Extracting compressed backup...');
    
    return new Promise((resolve, reject) => {
      exec(`gunzip -c "${backupPath}" > "${extractedPath}"`, (error) => {
        if (error) {
          reject(error);
          return;
        }
        
        console.log(`✅ Backup extracted: ${extractedPath}`);
        resolve(extractedPath);
      });
    });
  }

  // Restore from backup
  async restoreDatabase(backupPath) {
    const { host, port, username, password, database } = BACKUP_CONFIG.mysql;
    
    console.log('🔄 Starting database restoration...');
    console.log('⚠️  This will overwrite existing data!');
    
    return new Promise((resolve, reject) => {
      let restoreCmd = `mysql`;
      restoreCmd += ` --host=${host}`;
      restoreCmd += ` --port=${port}`;
      restoreCmd += ` --user=${username}`;
      restoreCmd += ` --password=${password}`;
      restoreCmd += ` < "${backupPath}"`;
      
      exec(restoreCmd, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Restore failed: ${error.message}`));
          return;
        }
        
        if (stderr) {
          console.warn('⚠️ Restore warnings:', stderr);
        }
        
        console.log('✅ Database restoration completed');
        resolve(true);
      });
    });
  }

  // Verify restoration
  async verifyRestoration() {
    console.log('🔍 Verifying restoration...');
    
    const { prisma } = require('./database');
    
    try {
      // Test basic queries
      const diamondCount = await prisma.diamondExpense.count();
      const textileVendors = await prisma.textileVendor.count();
      const saasLeads = await prisma.saasLead.count();
      
      console.log(`✅ Restoration verification:`);
      console.log(`   💎 Diamond expenses: ${diamondCount}`);
      console.log(`   🧵 Textile vendors: ${textileVendors}`);
      console.log(`   💼 SaaS leads: ${saasLeads}`);
      
      return true;
    } catch (error) {
      console.error('❌ Restoration verification failed:', error.message);
      throw error;
    }
  }

  // Main recovery process
  async restore() {
    console.log('🚀 Starting database recovery process...');
    console.log('=' * 50);
    
    try {
      // Create recovery directory
      const recoveryDir = await this.createRecoveryDirectory();
      
      // Extract backup if compressed
      const extractedPath = await this.extractBackup(this.backupPath);
      
      // Restore database
      await this.restoreDatabase(extractedPath);
      
      // Verify restoration
      await this.verifyRestoration();
      
      console.log('=' * 50);
      console.log('✅ Recovery completed successfully!');
      
      return {
        success: true,
        recoveryDir: recoveryDir,
        extractedPath: extractedPath
      };
      
    } catch (error) {
      console.error('❌ Recovery failed:', error.message);
      throw error;
    }
  }
}

// ========================================
// SCHEDULED BACKUP UTILITIES
// ========================================

class ScheduledBackup {
  constructor() {
    this.backupInterval = parseInt(process.env.BACKUP_INTERVAL_MINUTES || '1440'); // 24 hours default
  }

  // Start scheduled backups
  start() {
    console.log(`⏰ Starting scheduled backups (every ${this.backupInterval} minutes)`);
    
    setInterval(async () => {
      try {
        console.log('🔔 Running scheduled backup...');
        const backup = new DatabaseBackup();
        await backup.createBackup();
        console.log('✅ Scheduled backup completed');
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error.message);
      }
    }, this.backupInterval * 60 * 1000);
  }
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  DatabaseBackup,
  DatabaseRecovery,
  ScheduledBackup,
  BACKUP_CONFIG
};
