#!/usr/bin/env node

// ========================================
// ERP MAIN - BACKUP EXECUTION SCRIPT
// Easy-to-run backup and recovery system
// ========================================

require('dotenv/config');
const { DatabaseBackup, DatabaseRecovery, ScheduledBackup } = require('./lib/backup');
const fs = require('fs').promises;
const path = require('path');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║               ERP MAIN - BACKUP & RECOVERY SYSTEM            ║
║              Production-Grade Data Protection                ║
╚══════════════════════════════════════════════════════════════╝
`);

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'backup';
  
  try {
    switch (command) {
      case 'backup':
        console.log('🚀 Starting database backup...');
        const backupInstance = new DatabaseBackup();
        const backupResult = await backupInstance.createBackup();
        
        console.log('\n✅ Backup completed successfully!');
        console.log(`📁 Backup file: ${backupResult.backupPath}`);
        console.log(`📋 Metadata: ${backupResult.metadataPath}`);
        console.log(`💾 Size: ${(backupResult.size / 1024 / 1024).toFixed(2)} MB`);
        break;
        
      case 'restore':
        const backupFile = args[1];
        if (!backupFile) {
          console.log('❌ Please specify backup file: node backup.js restore <backup-file>');
          process.exit(1);
        }
        
        console.log(`🔄 Starting restoration from: ${backupFile}`);
        const recovery = new DatabaseRecovery(backupFile);
        await recovery.restore();
        break;
        
      case 'schedule':
        console.log('⏰ Starting scheduled backup system...');
        const scheduled = new ScheduledBackup();
        scheduled.start();
        console.log('✅ Scheduled backups started. Press Ctrl+C to stop.');
        // Keep the process running
        process.on('SIGINT', () => {
          console.log('\n✅ Scheduled backups stopped');
          process.exit(0);
        });
        break;
        
      case 'list':
        console.log('📋 Listing available backups...');
        await listBackups();
        break;
        
      case 'verify':
        const verifyFile = args[1];
        if (!verifyFile) {
          console.log('❌ Please specify backup file: node backup.js verify <backup-file>');
          process.exit(1);
        }
        console.log(`🔍 Verifying backup: ${verifyFile}`);
        const backupVerify = new DatabaseBackup();
        await backupVerify.verifyBackup(verifyFile);
        break;
        
      case 'help':
        showHelp();
        break;
        
      default:
        console.log('❌ Unknown command:', command);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function listBackups() {
  try {
    const backupDir = process.env.BACKUP_DIR || './backups';
    
    const files = await fs.readdir(backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('erp-backup-'))
      .sort((a, b) => b.localeCompare(a));
    
    if (backupFiles.length === 0) {
      console.log('📭 No backups found');
      return;
    }
    
    console.log(`📁 Found ${backupFiles.length} backups:`);
    console.log('=' * 60);
    
    for (const file of backupFiles) {
      const filePath = path.join(backupDir, file);
      const stats = await fs.stat(filePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      const date = stats.mtime.toISOString().split('T')[0];
      
      console.log(`${date} | ${file} | ${sizeMB} MB`);
      
      // Show metadata if exists
      const metadataFile = filePath + '.meta.json';
      try {
        const metadata = JSON.parse(await fs.readFile(metadataFile, 'utf8'));
        console.log(`        Database: ${metadata.database} | Compressed: ${metadata.compressed}`);
      } catch {
        // No metadata file
      }
      console.log('');
    }
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📁 Backup directory not found. Run backup first.');
    } else {
      console.error('❌ Error listing backups:', error.message);
    }
  }
}

function showHelp() {
  console.log(`
Usage: node backup.js [command] [options]

Commands:
  backup              Create a database backup
  restore <file>      Restore from backup file
  schedule            Start automated scheduled backups
  list                List all available backups
  verify <file>       Verify backup integrity
  help                Show this help message

Examples:
  node backup.js backup
  node backup.js restore erp-backup-2025-01-15T10-30-00.sql.gz
  node backup.js schedule
  node backup.js list
  node backup.js verify erp-backup-2025-01-15T10-30-00.sql.gz

Environment Variables (in .env):
  BACKUP_DIR=./backups          # Backup directory
  BACKUP_RETENTION_DAYS=30      # Days to keep backups
  MAX_BACKUPS=100               # Maximum number of backups
  BACKUP_INTERVAL_MINUTES=1440  # Auto backup interval (24 hours)
  REMOTE_BACKUP_ENABLED=false   # Enable remote backup
  S3_BUCKET=your-bucket         # AWS S3 bucket for remote backup

Features:
  ✅ Automated compression (gzip)
  ✅ Backup integrity verification
  ✅ Remote storage support (S3)
  ✅ Automatic cleanup of old backups
  ✅ Scheduled backup system
  ✅ Metadata tracking
  ✅ Recovery verification
`);
}

function askUser(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n❌ Backup interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n❌ Backup terminated');
  process.exit(1);
});

// Run main function
main();
