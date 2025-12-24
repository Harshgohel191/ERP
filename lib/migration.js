// ========================================
// ERP MAIN - DATA MIGRATION UTILITIES
// Zero-Loss Migration from JSON to MySQL
// ========================================

const fs = require('fs').promises;
const path = require('path');
const { prisma, withTransaction, validateData, sanitizeString } = require('./database');

// ========================================
// DIAMOND BUSINESS MIGRATION
// ========================================

async function migrateDiamondData() {
  console.log('💎 Starting Diamond Business migration...');
  
  try {
    // Read existing JSON data
    const diamondData = await fs.readFile(path.join(__dirname, '../database.json'), 'utf8');
    const expenses = JSON.parse(diamondData);
    
    console.log(`📊 Found ${expenses.length} diamond expense records`);
    
    let migratedCount = 0;
    let errors = [];
    
    for (const expense of expenses) {
      try {
        // Validate and prepare data
        const validationErrors = validateData(expense, ['category', 'amount']);
        if (validationErrors.length > 0) {
          errors.push(`Record ${expense.id}: ${validationErrors.join(', ')}`);
          continue;
        }
        
        await withTransaction(async (tx) => {
          await tx.diamondExpense.create({
            data: {
              expenseDate: new Date(expense.date),
              expenseType: expense.type || 'expense',
              category: sanitizeString(expense.category, 100),
              amount: parseFloat(expense.amount) || 0,
              description: sanitizeString(expense.desc || '', 1000),
              status: expense.status || 'Completed',
              createdAt: new Date(expense.createdAt || expense.date),
              updatedAt: new Date(),
              isActive: true
            }
          });
        });
        
        migratedCount++;
        console.log(`✅ Migrated expense: ${expense.category} - ₹${expense.amount}`);
        
      } catch (error) {
        errors.push(`Record ${expense.id}: ${error.message}`);
        console.error(`❌ Error migrating expense ${expense.id}:`, error.message);
      }
    }
    
    console.log(`💎 Diamond migration completed: ${migratedCount} records migrated, ${errors.length} errors`);
    return { migrated: migratedCount, errors };
    
  } catch (error) {
    console.error('❌ Diamond migration failed:', error);
    throw error;
  }
}

// ========================================
// TEXTILE BUSINESS MIGRATION
// ========================================

async function migrateTextileData() {
  console.log('🧵 Starting Textile Business migration...');
  
  try {
    // Read existing JSON data
    const textileData = await fs.readFile(path.join(__dirname, '../textile_data.json'), 'utf8');
    const data = JSON.parse(textileData);
    
    let migratedCount = 0;
    let errors = [];
    
    // 1. Migrate Vendors
    console.log('📊 Migrating vendors...');
    if (data.vendors && data.vendors.length > 0) {
      for (const vendor of data.vendors) {
        try {
          await withTransaction(async (tx) => {
            await tx.textileVendor.create({
              data: {
                vendorName: sanitizeString(vendor.name, 200),
                vendorType: vendor.type || 'GreyPurchase',
                contactInfo: sanitizeString(vendor.contactInfo || '', 500),
                address: sanitizeString(vendor.address || '', 1000),
                createdAt: new Date(vendor.date || new Date()),
                updatedAt: new Date(),
                isActive: true
              }
            });
          });
          migratedCount++;
        } catch (error) {
          errors.push(`Vendor ${vendor.name}: ${error.message}`);
        }
      }
    }
    
    // 2. Migrate Bills
    console.log('📊 Migrating bills...');
    if (data.bills && data.bills.length > 0) {
      for (const bill of data.bills) {
        try {
          await withTransaction(async (tx) => {
            // Find or create vendor
            let vendorId = null;
            if (bill.vendor) {
              const vendor = await tx.textileVendor.findFirst({
                where: { vendorName: { contains: bill.vendor, mode: 'insensitive' } }
              });
              vendorId = vendor?.id;
            }
            
            const billRecord = await tx.textileBill.create({
              data: {
                vendorId: vendorId,
                billNumber: sanitizeString(bill.billNo, 100),
                billDate: new Date(bill.billDate),
                dueDate: bill.dueDate ? new Date(bill.dueDate) : null,
                creditDays: parseInt(bill.creditDays || 30),
                subtotal: parseFloat(bill.subtotal) || 0,
                gstIncluded: !!bill.gstIncluded,
                gstRate: parseFloat(bill.gstRate) || 0,
                gstAmount: parseFloat(bill.gstAmount) || 0,
                totalAmount: parseFloat(bill.totalAmount) || 0,
                paidAmount: parseFloat(bill.paidAmount) || 0,
                discountAmount: parseFloat(bill.discountAmount) || 0,
                balanceAmount: parseFloat(bill.balance) || 0,
                status: bill.status || 'Unpaid',
                createdAt: new Date(bill.createdAt || bill.billDate),
                updatedAt: new Date(),
                isActive: true
              }
            });
            
            // Migrate bill items
            if (bill.items && bill.items.length > 0) {
              for (const item of bill.items) {
                await tx.textileBillItem.create({
                  data: {
                    billId: billRecord.id,
                    itemName: sanitizeString(item.name, 200),
                    quantity: parseFloat(item.qty) || 0,
                    rate: parseFloat(item.rate) || 0,
                    total: parseFloat(item.total) || 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isActive: true
                  }
                });
              }
            }
          });
          migratedCount++;
          console.log(`✅ Migrated bill: ${bill.billNo} - ${bill.vendor}`);
        } catch (error) {
          errors.push(`Bill ${bill.billNo}: ${error.message}`);
          console.error(`❌ Error migrating bill ${bill.billNo}:`, error.message);
        }
      }
    }
    
    // 3. Migrate Stock
    console.log('📊 Migrating stock...');
    if (data.stock && data.stock.length > 0) {
      for (const stockItem of data.stock) {
        try {
          await withTransaction(async (tx) => {
            // Find vendor if exists
            let vendorId = null;
            if (stockItem.vendor) {
              const vendor = await tx.textileVendor.findFirst({
                where: { vendorName: { contains: stockItem.vendor, mode: 'insensitive' } }
              });
              vendorId = vendor?.id;
            }
            
            await tx.textileStock.create({
              data: {
                stockName: sanitizeString(stockItem.name, 200),
                quantity: parseFloat(stockItem.qty) || 0,
                rate: parseFloat(stockItem.rate) || 0,
                vendorId: vendorId,
                transactionType: stockItem.type || 'Purchase',
                createdAt: new Date(stockItem.date || new Date()),
                updatedAt: new Date(),
                isActive: true
              }
            });
          });
          migratedCount++;
        } catch (error) {
          errors.push(`Stock ${stockItem.name}: ${error.message}`);
        }
      }
    }
    
    // 4. Migrate Sales
    console.log('📊 Migrating sales...');
    if (data.sales && data.sales.length > 0) {
      for (const sale of data.sales) {
        try {
          await withTransaction(async (tx) => {
            const saleRecord = await tx.textileSale.create({
              data: {
                customerName: sanitizeString(sale.customer, 200),
                invoiceNumber: sanitizeString(sale.invoiceNo, 100),
                saleDate: new Date(sale.saleDate),
                subtotal: parseFloat(sale.subtotal) || 0,
                gstIncluded: !!sale.gstIncluded,
                gstRate: parseFloat(sale.gstRate) || 0,
                gstAmount: parseFloat(sale.gstAmount) || 0,
                totalAmount: parseFloat(sale.totalAmount) || 0,
                paymentStatus: sale.paymentStatus || 'Paid',
                createdAt: new Date(sale.date || sale.saleDate),
                updatedAt: new Date(),
                isActive: true
              }
            });
            
            // Migrate sale items
            if (sale.items && sale.items.length > 0) {
              for (const item of sale.items) {
                await tx.textileSaleItem.create({
                  data: {
                    saleId: saleRecord.id,
                    itemName: sanitizeString(item.name, 200),
                    quantity: parseFloat(item.qty) || 0,
                    rate: parseFloat(item.rate) || 0,
                    total: parseFloat(item.total) || 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isActive: true
                  }
                });
              }
            }
          });
          migratedCount++;
          console.log(`✅ Migrated sale: ${sale.invoiceNo} - ${sale.customer}`);
        } catch (error) {
          errors.push(`Sale ${sale.invoiceNo}: ${error.message}`);
          console.error(`❌ Error migrating sale ${sale.invoiceNo}:`, error.message);
        }
      }
    }
    
    // 5. Migrate Item History
    console.log('📊 Migrating item history...');
    if (data.itemHistory) {
      for (const [itemName, price] of Object.entries(data.itemHistory)) {
        try {
          await withTransaction(async (tx) => {
            await tx.textileItemHistory.create({
              data: {
                itemName: sanitizeString(itemName, 200),
                lastPrice: parseFloat(price) || 0,
                lastUpdated: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          });
          migratedCount++;
        } catch (error) {
          errors.push(`Item history ${itemName}: ${error.message}`);
        }
      }
    }
    
    // 6. Migrate Expenses
    console.log('📊 Migrating expenses...');
    if (data.expenses && data.expenses.length > 0) {
      for (const expense of data.expenses) {
        try {
          await withTransaction(async (tx) => {
            await tx.textileExpense.create({
              data: {
                category: sanitizeString(expense.category, 100),
                description: sanitizeString(expense.description, 500),
                amount: parseFloat(expense.amount) || 0,
                expenseDate: new Date(expense.date),
                paymentMode: expense.mode || 'Cash',
                createdAt: new Date(expense.dateCreated || expense.date),
                updatedAt: new Date(),
                isActive: true
              }
            });
          });
          migratedCount++;
          console.log(`✅ Migrated expense: ${expense.category} - ₹${expense.amount}`);
        } catch (error) {
          errors.push(`Expense ${expense.category}: ${error.message}`);
        }
      }
    }
    
    // 7. Set Cash in Hand
    console.log('📊 Setting cash in hand...');
    try {
      await withTransaction(async (tx) => {
        await tx.textileCashInHand.create({
          data: {
            cashAmount: parseFloat(data.cashInHand) || 0,
            lastUpdated: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      });
      migratedCount++;
    } catch (error) {
      errors.push(`Cash in hand: ${error.message}`);
    }
    
    console.log(`🧵 Textile migration completed: ${migratedCount} records migrated, ${errors.length} errors`);
    return { migrated: migratedCount, errors };
    
  } catch (error) {
    console.error('❌ Textile migration failed:', error);
    throw error;
  }
}

// ========================================
// SAAS BUSINESS MIGRATION
// ========================================

async function migrateSaaSData() {
  console.log('💼 Starting SaaS Business migration...');
  
  try {
    // Read existing JSON data
    const saasData = await fs.readFile(path.join(__dirname, '../saas_data.json'), 'utf8');
    const data = JSON.parse(saasData);
    
    let migratedCount = 0;
    let errors = [];
    
    // 1. Migrate Leads
    console.log('📊 Migrating leads...');
    if (data.leads && data.leads.length > 0) {
      for (const lead of data.leads) {
        try {
          await withTransaction(async (tx) => {
            const leadRecord = await tx.saasLead.create({
              data: {
                name: sanitizeString(lead.name, 200),
                email: sanitizeString(lead.email, 200),
                phone: sanitizeString(lead.phone || '', 20),
                company: sanitizeString(lead.company || '', 200),
                source: sanitizeString(lead.source || '', 100),
                service: sanitizeString(lead.service || '', 200),
                notes: sanitizeString(lead.notes || '', 2000),
                score: parseInt(lead.score) || 50,
                status: lead.status || 'New',
                priority: lead.priority || 'Medium',
                assignedTo: sanitizeString(lead.assignedTo || '', 100),
                createdAt: new Date(lead.createdAt),
                updatedAt: new Date(lead.lastContact || lead.createdAt),
                lastContact: lead.lastContact ? new Date(lead.lastContact) : null,
                nextFollowUp: lead.nextFollowUp ? new Date(lead.nextFollowUp) : null,
                convertedTo: lead.convertedTo ? parseInt(lead.convertedTo) : null,
                isActive: true
              }
            });
            
            // Migrate lead activities
            if (lead.activities && lead.activities.length > 0) {
              for (const activity of lead.activities) {
                await tx.saasLeadActivity.create({
                  data: {
                    leadId: leadRecord.id,
                    activityType: activity.type || 'note',
                    description: sanitizeString(activity.description || '', 1000),
                    notes: sanitizeString(activity.notes || '', 1000),
                    outcome: sanitizeString(activity.outcome || '', 200),
                    userName: sanitizeString(activity.user || 'Current User', 100),
                    activityDate: new Date(activity.date || activity.timestamp),
                    createdAt: new Date(activity.date || activity.timestamp),
                    updatedAt: new Date(activity.date || activity.timestamp)
                  }
                });
              }
            }
          });
          migratedCount++;
          console.log(`✅ Migrated lead: ${lead.name} - ${lead.email}`);
        } catch (error) {
          errors.push(`Lead ${lead.name}: ${error.message}`);
          console.error(`❌ Error migrating lead ${lead.name}:`, error.message);
        }
      }
    }
    
    // 2. Migrate Deals
    console.log('📊 Migrating deals...');
    if (data.deals && data.deals.length > 0) {
      for (const deal of data.deals) {
        try {
          await withTransaction(async (tx) => {
            const dealRecord = await tx.saasDeal.create({
              data: {
                leadId: deal.leadId ? parseInt(deal.leadId) : null,
                clientName: sanitizeString(deal.clientName, 200),
                clientEmail: sanitizeString(deal.clientEmail || '', 200),
                company: sanitizeString(deal.company || '', 200),
                dealValue: parseFloat(deal.value) || 0,
                service: sanitizeString(deal.service || '', 200),
                stage: deal.stage || 'Prospecting',
                probability: parseInt(deal.probability) || 10,
                expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : null,
                notes: sanitizeString(deal.notes || '', 2000),
                createdAt: new Date(deal.createdAt),
                updatedAt: new Date(),
                isActive: true
              }
            });
            
            // Migrate deal activities
            if (deal.activities && deal.activities.length > 0) {
              for (const activity of deal.activities) {
                await tx.saasDealActivity.create({
                  data: {
                    dealId: dealRecord.id,
                    activityType: activity.type || 'Stage Change',
                    fromStage: sanitizeString(activity.from || '', 50),
                    toStage: sanitizeString(activity.to || '', 50),
                    notes: sanitizeString(activity.notes || '', 1000),
                    activityDate: new Date(activity.date),
                    createdAt: new Date(activity.date),
                    updatedAt: new Date(activity.date)
                  }
                });
              }
            }
          });
          migratedCount++;
          console.log(`✅ Migrated deal: ${deal.clientName} - ₹${deal.value}`);
        } catch (error) {
          errors.push(`Deal ${deal.clientName}: ${error.message}`);
          console.error(`❌ Error migrating deal ${deal.clientName}:`, error.message);
        }
      }
    }
    
    // 3. Migrate Clients
    console.log('📊 Migrating clients...');
    if (data.clients && data.clients.length > 0) {
      for (const client of data.clients) {
        try {
          await withTransaction(async (tx) => {
            await tx.saasClient.create({
              data: {
                name: sanitizeString(client.name, 200),
                email: sanitizeString(client.email, 200),
                company: sanitizeString(client.company || '', 200),
                dealId: client.dealId ? parseInt(client.dealId) : null,
                service: sanitizeString(client.service || '', 200),
                status: client.status || 'Active',
                createdAt: new Date(client.createdAt),
                updatedAt: new Date(),
                isActive: true
              }
            });
          });
          migratedCount++;
          console.log(`✅ Migrated client: ${client.name} - ${client.email}`);
        } catch (error) {
          errors.push(`Client ${client.name}: ${error.message}`);
        }
      }
    }
    
    // 4. Migrate Subscriptions
    console.log('📊 Migrating subscriptions...');
    if (data.subscriptions && data.subscriptions.length > 0) {
      for (const subscription of data.subscriptions) {
        try {
          await withTransaction(async (tx) => {
            await tx.saasSubscription.create({
              data: {
                clientId: subscription.clientId ? parseInt(subscription.clientId) : null,
                clientName: sanitizeString(subscription.clientName, 200),
                service: sanitizeString(subscription.service, 200),
                monthlyAmount: parseFloat(subscription.monthlyAmount) || 0,
                totalContractValue: parseFloat(subscription.totalContractValue) || null,
                billingCycle: subscription.billingCycle || 'Monthly',
                status: subscription.status || 'Active',
                startDate: new Date(subscription.startDate),
                nextBillingDate: subscription.nextBilling ? new Date(subscription.nextBilling) : null,
                lastBillingDate: subscription.lastBilling ? new Date(subscription.lastBilling) : null,
                createdAt: new Date(subscription.createdAt),
                updatedAt: new Date(),
                isActive: true
              }
            });
          });
          migratedCount++;
          console.log(`✅ Migrated subscription: ${subscription.clientName} - ₹${subscription.monthlyAmount}`);
        } catch (error) {
          errors.push(`Subscription ${subscription.clientName}: ${error.message}`);
        }
      }
    }
    
    // 5. Migrate Revenue
    console.log('📊 Migrating revenue...');
    if (data.revenue && data.revenue.length > 0) {
      for (const revenue of data.revenue) {
        try {
          await withTransaction(async (tx) => {
            await tx.saasRevenue.create({
              data: {
                amount: parseFloat(revenue.amount) || 0,
                source: sanitizeString(revenue.source, 100),
                clientName: sanitizeString(revenue.clientName || '', 200),
                service: sanitizeString(revenue.service || '', 200),
                subscriptionId: revenue.subscriptionId ? parseInt(revenue.subscriptionId) : null,
                revenueDate: new Date(revenue.date),
                notes: sanitizeString(revenue.notes || '', 1000),
                revenueType: revenue.type || 'other',
                status: revenue.status || 'confirmed',
                createdAt: new Date(revenue.createdAt),
                updatedAt: new Date(),
                isActive: true
              }
            });
          });
          migratedCount++;
          console.log(`✅ Migrated revenue: ${revenue.source} - ₹${revenue.amount}`);
        } catch (error) {
          errors.push(`Revenue ${revenue.source}: ${error.message}`);
        }
      }
    }
    
    // 6. Migrate Goals
    console.log('📊 Migrating goals...');
    if (data.goals && data.goals.length > 0) {
      for (const goal of data.goals) {
        try {
          await withTransaction(async (tx) => {
            await tx.saasGoal.create({
              data: {
                goalType: sanitizeString(goal.type, 100),
                targetAmount: parseFloat(goal.target) || 0,
                currentAmount: parseFloat(goal.current) || 0,
                goalMonth: parseInt(goal.month) || new Date().getMonth() + 1,
                goalYear: parseInt(goal.year) || new Date().getFullYear(),
                description: sanitizeString(goal.description || '', 500),
                createdAt: new Date(goal.createdAt),
                updatedAt: new Date(),
                isActive: true
              }
            });
          });
          migratedCount++;
          console.log(`✅ Migrated goal: ${goal.type} - ₹${goal.target}`);
        } catch (error) {
          errors.push(`Goal ${goal.type}: ${error.message}`);
        }
      }
    }
    
    // 7. Migrate Expenses
    console.log('📊 Migrating expenses...');
    if (data.expenses && data.expenses.length > 0) {
      for (const expense of data.expenses) {
        try {
          await withTransaction(async (tx) => {
            await tx.saasExpense.create({
              data: {
                category: sanitizeString(expense.category, 100),
                description: sanitizeString(expense.description, 500),
                amount: parseFloat(expense.amount) || 0,
                expenseDate: new Date(expense.date),
                vendor: sanitizeString(expense.vendor || '', 200),
                createdAt: new Date(expense.createdAt || expense.date),
                updatedAt: new Date(),
                isActive: true
              }
            });
          });
          migratedCount++;
          console.log(`✅ Migrated expense: ${expense.category} - ₹${expense.amount}`);
        } catch (error) {
          errors.push(`Expense ${expense.category}: ${error.message}`);
        }
      }
    }
    
    console.log(`💼 SaaS migration completed: ${migratedCount} records migrated, ${errors.length} errors`);
    return { migrated: migratedCount, errors };
    
  } catch (error) {
    console.error('❌ SaaS migration failed:', error);
    throw error;
  }
}

// ========================================
// COMPLETE MIGRATION ORCHESTRATOR
// ========================================

async function runCompleteMigration() {
  console.log('🚀 Starting complete ERP migration from JSON to MySQL...');
  console.log('=' * 60);
  
  try {
    // Test database connection first
    console.log('🔗 Testing database connection...');
    const isConnected = await prisma.$queryRaw`SELECT 1`;
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connection successful');
    
    const results = {
      diamond: null,
      textile: null,
      saas: null,
      totalMigrated: 0,
      totalErrors: 0
    };
    
    // Run migrations in sequence
    console.log('\n' + '=' * 60);
    results.diamond = await migrateDiamondData();
    results.totalMigrated += results.diamond.migrated;
    results.totalErrors += results.diamond.errors.length;
    
    console.log('\n' + '=' * 60);
    results.textile = await migrateTextileData();
    results.totalMigrated += results.textile.migrated;
    results.totalErrors += results.textile.errors.length;
    
    console.log('\n' + '=' * 60);
    results.saas = await migrateSaaSData();
    results.totalMigrated += results.saas.migrated;
    results.totalErrors += results.saas.errors.length;
    
    // Create initial system settings
    console.log('\n' + '=' * 60);
    console.log('⚙️  Creating system settings...');
    await withTransaction(async (tx) => {
      await tx.systemSetting.createMany({
        data: [
          {
            settingKey: 'system_version',
            settingValue: '2.0.0',
            settingType: 'string',
            description: 'Current system version',
            updatedBy: 'migration'
          },
          {
            settingKey: 'db_version',
            settingValue: '2.0.0',
            settingType: 'string',
            description: 'Database schema version',
            updatedBy: 'migration'
          },
          {
            settingKey: 'migration_completed',
            settingValue: new Date().toISOString(),
            settingType: 'string',
            description: 'Migration completion timestamp',
            updatedBy: 'migration'
          },
          {
            settingKey: 'total_records_migrated',
            settingValue: results.totalMigrated.toString(),
            settingType: 'number',
            description: 'Total records migrated from JSON',
            updatedBy: 'migration'
          }
        ]
      });
    });
    
    console.log('\n' + '=' * 60);
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('=' * 60);
    console.log(`📊 Total Records Migrated: ${results.totalMigrated}`);
    console.log(`❌ Total Errors: ${results.totalErrors}`);
    console.log(`💎 Diamond: ${results.diamond.migrated} records`);
    console.log(`🧵 Textile: ${results.textile.migrated} records`);
    console.log(`💼 SaaS: ${results.saas.migrated} records`);
    
    if (results.totalErrors > 0) {
      console.log('\n⚠️  ERRORS ENCOUNTERED:');
      if (results.diamond.errors.length > 0) {
        console.log('Diamond Errors:', results.diamond.errors.slice(0, 5));
      }
      if (results.textile.errors.length > 0) {
        console.log('Textile Errors:', results.textile.errors.slice(0, 5));
      }
      if (results.saas.errors.length > 0) {
        console.log('SaaS Errors:', results.saas.errors.slice(0, 5));
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// ========================================
// ROLLBACK FUNCTIONALITY
// ========================================

async function rollbackMigration() {
  console.log('🔄 Starting rollback...');
  
  try {
    await withTransaction(async (tx) => {
      // Delete all migrated data in reverse order
      await tx.saasExpense.deleteMany();
      await tx.saasGoal.deleteMany();
      await tx.saasRevenue.deleteMany();
      await tx.saasSubscription.deleteMany();
      await tx.saasClient.deleteMany();
      await tx.saasDealActivity.deleteMany();
      await tx.saasDeal.deleteMany();
      await tx.saasLeadActivity.deleteMany();
      await tx.saasLead.deleteMany();
      
      await tx.textileExpense.deleteMany();
      await tx.textileItemHistory.deleteMany();
      await tx.textileSaleItem.deleteMany();
      await tx.textileSale.deleteMany();
      await tx.textileStock.deleteMany();
      await tx.textileBillItem.deleteMany();
      await tx.textileBill.deleteMany();
      await tx.textileVendor.deleteMany();
      await tx.textileCashInHand.deleteMany();
      
      await tx.diamondExpense.deleteMany();
      
      await tx.systemSetting.deleteMany();
    });
    
    console.log('✅ Rollback completed successfully');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  migrateDiamondData,
  migrateTextileData,
  migrateSaaSData,
  runCompleteMigration,
  rollbackMigration
};
