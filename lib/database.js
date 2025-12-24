// ========================================
// ERP MAIN - DATABASE CONNECTION UTILITIES
// Production-Ready Database Operations with Connection Pooling
// ========================================

const { PrismaClient } = require('../generated/prisma');
const fs = require('fs').promises;
const path = require('path');

// Configure Prisma Client with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings from environment
  connectionPool: {
    min: parseInt(process.env.DATABASE_POOL_MIN || '5'),
    max: parseInt(process.env.DATABASE_POOL_MAX || '20'),
    acquire: parseInt(process.env.DATABASE_POOL_ACQUIRE || '60000'),
    idle: parseInt(process.env.DATABASE_POOL_IDLE || '10000'),
  },
  // Enhanced error handling
  errorFormat: 'colorless',
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
  ],
});

// ========================================
// CONNECTION POOL MANAGEMENT
// ========================================

// Test database connection
async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Check connection health
async function checkConnectionHealth() {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    return {
      healthy: true,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// ========================================
// TRANSACTION WRAPPER FUNCTIONS
// ========================================

// Generic transaction wrapper with automatic retry
async function withTransaction(callback, maxRetries = 3) {
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      return await prisma.$transaction(callback);
    } catch (error) {
      retryCount++;
      
      if (retryCount >= maxRetries) {
        console.error(`Transaction failed after ${maxRetries} retries:`, error);
        throw error;
      }
      
      // Wait before retry with exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      console.warn(`Transaction retry ${retryCount}/${maxRetries} after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Atomic write operation wrapper
async function atomicWrite(operation, data) {
  try {
    return await withTransaction(async (tx) => {
      // Execute the operation within transaction
      if (typeof operation === 'function') {
        return await operation(tx, data);
      }
      
      // Handle Prisma operations
      const [result] = await Promise.all([
        operation,
        // Log the operation for audit trail
        tx.auditLog.create({
          data: {
            tableName: 'unknown',
            recordId: 0,
            action: 'INSERT',
            newValues: JSON.stringify(data),
            changedBy: 'system',
            changedAt: new Date(),
          }
        })
      ]);
      
      return result;
    });
  } catch (error) {
    console.error('Atomic write failed:', error);
    throw error;
  }
}

// ========================================
// SOFT DELETE UTILITIES
// ========================================

// Soft delete with audit trail
async function softDelete(model, id, changedBy = 'system') {
  return await withTransaction(async (tx) => {
    // Get the record for audit trail
    const record = await tx[model].findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!record) {
      throw new Error(`${model} with id ${id} not found`);
    }
    
    // Perform soft delete
    const updated = await tx[model].update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: new Date(),
        isActive: false
      }
    });
    
    // Log the soft delete
    await tx.auditLog.create({
      data: {
        tableName: model,
        recordId: parseInt(id),
        action: 'SOFT_DELETE',
        oldValues: JSON.stringify(record),
        newValues: JSON.stringify(updated),
        changedBy: changedBy,
        changedAt: new Date(),
      }
    });
    
    return updated;
  });
}

// Restore soft deleted record
async function softRestore(model, id, changedBy = 'system') {
  return await withTransaction(async (tx) => {
    // Get the soft deleted record
    const record = await tx[model].findUnique({
      where: { id: parseInt(id) },
      include: { deletedAt: true }
    });
    
    if (!record) {
      throw new Error(`${model} with id ${id} not found or not soft deleted`);
    }
    
    // Restore the record
    const restored = await tx[model].update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: null,
        isActive: true
      }
    });
    
    // Log the restore
    await tx.auditLog.create({
      data: {
        tableName: model,
        recordId: parseInt(id),
        action: 'SOFT_RESTORE',
        oldValues: JSON.stringify(record),
        newValues: JSON.stringify(restored),
        changedBy: changedBy,
        changedAt: new Date(),
      }
    });
    
    return restored;
  });
}

// ========================================
// DATA VALIDATION UTILITIES
// ========================================

// Validate data integrity before save
function validateData(data, requiredFields = []) {
  const errors = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate email format
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  // Validate positive numbers
  const numericFields = ['amount', 'price', 'rate', 'total', 'monthlyAmount'];
  for (const field of numericFields) {
    if (data[field] !== undefined && (isNaN(data[field]) || data[field] < 0)) {
      errors.push(`Invalid ${field}: must be a positive number`);
    }
  }
  
  return errors;
}

// Sanitize string inputs
function sanitizeString(str, maxLength = 1000) {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, maxLength);
}

// ========================================
// QUERY OPTIMIZATION UTILITIES
// ========================================

// Paginated query helper
async function paginatedQuery(model, options = {}) {
  const {
    page = 1,
    limit = 10,
    where = {},
    orderBy = { createdAt: 'desc' },
    include = {},
    select = {}
  } = options;
  
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    prisma[model].findMany({
      where: { ...where, isActive: true },
      skip,
      take: limit,
      orderBy,
      include,
      select: select.id ? undefined : undefined // Use include or select
    }),
    prisma[model].count({
      where: { ...where, isActive: true }
    })
  ]);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
}

// Search across multiple fields
async function searchAcrossFields(model, searchTerm, fields = [], options = {}) {
  const searchConditions = fields.map(field => ({
    [field]: {
      contains: searchTerm,
      mode: 'insensitive'
    }
  }));
  
  return await prisma[model].findMany({
    where: {
      OR: searchConditions,
      isActive: true
    },
    ...options
  });
}

// ========================================
// BACKUP AND RECOVERY UTILITIES
// ========================================

// Create data backup
async function createBackup(backupPath) {
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      data: {
        diamond_expenses: await prisma.diamondExpense.findMany(),
        textile_vendors: await prisma.textileVendor.findMany(),
        textile_bills: await prisma.textileBill.findMany(),
        textile_stock: await prisma.textileStock.findMany(),
        textile_sales: await prisma.textileSale.findMany(),
        saas_leads: await prisma.saasLead.findMany(),
        saas_deals: await prisma.saasDeal.findMany(),
        saas_subscriptions: await prisma.saasSubscription.findMany(),
        saas_revenue: await prisma.saasRevenue.findMany(),
      }
    };
    
    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup created: ${backupPath}`);
    return true;
  } catch (error) {
    console.error('❌ Backup creation failed:', error);
    return false;
  }
}

// ========================================
// ERROR HANDLING AND LOGGING
// ========================================

// Enhanced error logging
function logDatabaseError(operation, error, context = {}) {
  const errorLog = {
    operation,
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: process.env.NODE_ENV
  };
  
  console.error('Database Error:', JSON.stringify(errorLog, null, 2));
  
  // In production, you might want to send this to a logging service
  // logService.error('Database Error', errorLog);
}

// ========================================
// CLEANUP AND GRACEFUL SHUTDOWN
// ========================================

// Graceful shutdown
async function gracefulShutdown() {
  console.log('🔄 Starting graceful shutdown...');
  
  try {
    await prisma.$disconnect();
    console.log('✅ Database connections closed gracefully');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
}

// Handle process termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// ========================================
// EXPORTS
// ========================================

module.exports = {
  prisma,
  testConnection,
  checkConnectionHealth,
  withTransaction,
  atomicWrite,
  softDelete,
  softRestore,
  validateData,
  sanitizeString,
  paginatedQuery,
  searchAcrossFields,
  createBackup,
  logDatabaseError,
  gracefulShutdown
};
