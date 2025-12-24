#!/usr/bin/env node

// ========================================
// ERP MAIN - MIGRATION EXECUTION SCRIPT
// Easy-to-run migration from JSON to MySQL
// ========================================

require('dotenv/config');
const { runCompleteMigration, rollbackMigration } = require('./lib/migration');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                 ERP MAIN - MYSQL MIGRATION                   ║
║              Production-Ready Database Migration             ║
╚══════════════════════════════════════════════════════════════╝
`);

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';
  
  try {
    switch (command) {
      case 'migrate':
        console.log('🚀 Starting migration process...');
        console.log('⚠️  Make sure you have:');
        console.log('   1. MySQL server running');
        console.log('   2. Database created (use database_schema.sql)');
        console.log('   3. .env file configured with DB credentials');
        console.log('   4. All JSON files backup created');
        console.log('');
        
        const proceed = await askUser('Do you want to proceed with migration? (yes/no): ');
        if (proceed.toLowerCase() !== 'yes') {
          console.log('❌ Migration cancelled by user');
          process.exit(0);
        }
        
        await runCompleteMigration();
        console.log('\n✅ Migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Update server.js to use database instead of JSON files');
        console.log('2. Test all API endpoints');
        console.log('3. Deploy to production');
        break;
        
      case 'rollback':
        console.log('🔄 Starting rollback process...');
        console.log('⚠️  This will delete ALL migrated data!');
        
        const confirm = await askUser('Are you sure you want to rollback? (yes/no): ');
        if (confirm.toLowerCase() !== 'yes') {
          console.log('❌ Rollback cancelled by user');
          process.exit(0);
        }
        
        await rollbackMigration();
        console.log('✅ Rollback completed successfully!');
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
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
Usage: node migrate.js [command]

Commands:
  migrate    Run complete migration from JSON to MySQL
  rollback   Rollback all migrated data
  help       Show this help message

Examples:
  node migrate.js migrate
  node migrate.js rollback
  node migrate.js help

Before running migration:
1. Create MySQL database using database_schema.sql
2. Configure .env file with database credentials
3. Create backup of JSON files
4. Ensure MySQL server is running
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
  console.log('\n❌ Migration interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n❌ Migration terminated');
  process.exit(1);
});

// Run main function
main();
