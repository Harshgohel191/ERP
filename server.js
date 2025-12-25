const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const { prisma, validateData, sanitizeString } = require('./lib/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = 3005;



// --- FILE PATHS (LEGACY - FOR TEXTILE AND SAAS) ---
const DIAMOND_FILE = path.join(__dirname, 'database.json');
const TEXTILE_FILE = path.join(__dirname, 'textile_data.json');
const SAAS_FILE = path.join(__dirname, 'saas_data.json');


// SECURITY: Input validation and sanitization middleware
const validateInput = (req, res, next) => {
    const sanitize = (str) => {
        if (typeof str !== 'string') return str;
        return str.trim().replace(/[<>]/g, '').substring(0, 1000);
    };
    
    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        const sanitized = {};
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                sanitized[key] = sanitize(obj[key]);
            } else {
                sanitized[key] = obj[key];
            }
        }
        return sanitized;
    };
    
    req.body = sanitizeObject(req.body);
    next();
};

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    if (fs.existsSync(path.join(__dirname, 'index.html'))) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.redirect('/dashboard.html');
    }
});


// --- DIAMOND LOGIC (JSON - TEMPORARY) ---
function loadDiamondData() {
    try {
        if (fs.existsSync(DIAMOND_FILE)) {
            const data = fs.readFileSync(DIAMOND_FILE, 'utf8');
            const parsed = JSON.parse(data);
            // Ensure it's always an array
            if (!Array.isArray(parsed)) {
                console.warn('Diamond data is not an array, converting...');
                return [];
            }
            
            // Normalize and validate all entries
            const normalized = parsed.map((entry, index) => {
                try {
                    // Ensure all required fields exist
                    const normalizedEntry = {
                        id: entry.id || Date.now() + index,
                        type: entry.type || (entry.expenseType === 'Income' ? 'credit' : 'debit'),
                        expenseType: entry.expenseType || (entry.type === 'credit' ? 'Income' : 'Expense'),
                        category: entry.category || 'Uncategorized',
                        description: entry.description || entry.desc || '',
                        amount: parseFloat(entry.amount) || 0,
                        status: entry.status || 'Completed',
                        business_id: entry.business_id || 'biz_diamond',
                        date: entry.date || entry.createdAt || new Date().toISOString(),
                        createdAt: entry.createdAt || entry.date || new Date().toISOString()
                    };
                    
                    // Validate entry
                    if (!normalizedEntry.description || normalizedEntry.description.trim() === '') {
                        console.warn(`Entry ${normalizedEntry.id} has no description, skipping`);
                        return null;
                    }
                    
                    if (isNaN(normalizedEntry.amount) || normalizedEntry.amount < 0) {
                        console.warn(`Entry ${normalizedEntry.id} has invalid amount, skipping`);
                        return null;
                    }
                    
                    return normalizedEntry;
                } catch (err) {
                    console.error(`Error normalizing entry at index ${index}:`, err);
                    return null;
                }
            }).filter(entry => entry !== null); // Remove invalid entries
            
            console.log(`Loaded ${normalized.length} Diamond entries (${parsed.length - normalized.length} invalid entries removed)`);
            return normalized;
        }
    } catch (error) {
        console.error('Error loading diamond data:', error);
    }
    // Create empty array file if it doesn't exist
    fs.writeFileSync(DIAMOND_FILE, '[]');
    return [];
}

function saveDiamondData(data) {
    try {
        // Ensure data is an array
        if (!Array.isArray(data)) {
            console.error('Diamond data is not an array!');
            throw new Error('Data must be an array');
        }
        fs.writeFileSync(DIAMOND_FILE, JSON.stringify(data, null, 2));
        console.log(`Saved ${data.length} Diamond entries`);
    } catch (error) {
        console.error('Error saving diamond data:', error);
        throw new Error('Failed to save data');
    }
}

app.get('/api/finance', (req, res) => {
    try {
        const data = loadDiamondData();
        console.log(`GET /api/finance: Returning ${data.length} entries`);
        res.json(data);
    } catch (error) {
        console.error('Error in GET /api/finance:', error);
        res.status(500).json({ error: 'Failed to load data', details: error.message });
    }
});

app.post('/api/finance', validateInput, (req, res) => {
    try {
        const d = loadDiamondData();
        
        // Validate required fields
        if (!req.body.amount || parseFloat(req.body.amount) <= 0) {
            return res.status(400).json({ error: 'Amount is required and must be positive' });
        }
        
        if (!req.body.description && !req.body.desc) {
            return res.status(400).json({ error: 'Description is required' });
        }
        
        // Normalize data structure - ensure consistent format
        const entryId = Date.now();
        const entryType = req.body.type || (req.body.expenseType === 'Income' ? 'credit' : 'debit');
        const expenseType = req.body.expenseType || (req.body.type === 'credit' ? 'Income' : 'Expense');
        
        const entry = {
            id: entryId,
            type: entryType, // 'credit' or 'debit'
            expenseType: expenseType, // 'Income' or 'Expense'
            category: (req.body.category || 'Uncategorized').trim().substring(0, 100),
            description: (req.body.description || req.body.desc || '').trim().substring(0, 1000),
            amount: parseFloat(req.body.amount),
            status: req.body.status || 'Completed',
            business_id: req.body.business_id || 'biz_diamond',
            date: req.body.date || new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        // Validate final entry
        if (!entry.description || entry.description.trim() === '') {
            return res.status(400).json({ error: 'Description cannot be empty' });
        }
        
        if (isNaN(entry.amount) || entry.amount <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }
        
        d.push(entry);
        saveDiamondData(d);
        
        console.log(`POST /api/finance: Saved entry with id ${entry.id}`);
        
        io.emit('data_update', entry);
        res.json({ success: true, entryId: entry.id });
    } catch (error) {
        console.error('Error in POST /api/finance:', error);
        res.status(500).json({ error: 'Failed to save data', details: error.message });
    }
});

// DELETE DIAMOND ENTRY
app.delete('/api/finance/:id', validateInput, (req, res) => {
    try {
        const d = loadDiamondData();
        const entryId = parseInt(req.params.id);
        
        const entryIndex = d.findIndex(e => e.id === entryId);
        if (entryIndex === -1) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        
        const deletedEntry = d[entryIndex];
        d.splice(entryIndex, 1);
        saveDiamondData(d);
        
        console.log(`DELETE /api/finance/${entryId}: Deleted entry`);
        
        io.emit('data_delete', { id: entryId });
        res.json({ success: true, deleted: deletedEntry });
    } catch (error) {
        console.error('Error in DELETE /api/finance:', error);
        res.status(500).json({ error: 'Failed to delete entry', details: error.message });
    }
});


// ================================================================
// 🧵 TEXTILE V12 ENGINE (LEDGER FIX)
// ================================================================

// ================================================================
// 💼 SAAS BUSINESS ENGINE (COMPLETE CRM & PIPELINE SYSTEM)
// ================================================================

// SAAS DATABASE FUNCTIONS
function loadSaaSData() {
    let data = { 
        leads: [], 
        deals: [], 
        subscriptions: [], 
        goals: [], 
        team: [], 
        services: [],
        clients: [],
        pipeline: [],
        revenue: [],
        expenses: [],
        metrics: {}
    };
    
    if (fs.existsSync(SAAS_FILE)) {
        try { 
            const raw = fs.readFileSync(SAAS_FILE);
            const fileData = JSON.parse(raw);
            
            data = {
                leads: Array.isArray(fileData.leads) ? fileData.leads : [],
                deals: Array.isArray(fileData.deals) ? fileData.deals : [],
                subscriptions: Array.isArray(fileData.subscriptions) ? fileData.subscriptions : [],
                goals: Array.isArray(fileData.goals) ? fileData.goals : [],
                team: Array.isArray(fileData.team) ? fileData.team : [],
                services: Array.isArray(fileData.services) ? fileData.services : [],
                clients: Array.isArray(fileData.clients) ? fileData.clients : [],
                pipeline: Array.isArray(fileData.pipeline) ? fileData.pipeline : [],
                revenue: Array.isArray(fileData.revenue) ? fileData.revenue : [],
                expenses: Array.isArray(fileData.expenses) ? fileData.expenses : [],
                metrics: fileData.metrics || {}
            };
        } catch (e) { console.log("SaaS DB Read Error, Resetting"); }
    } else { 
        fs.writeFileSync(SAAS_FILE, JSON.stringify(data)); 
    }
    return data;
}

function saveSaaSData(data) { 
    fs.writeFileSync(SAAS_FILE, JSON.stringify(data, null, 2)); 
}

// GET ALL SAAS DATA
app.get('/api/saas/data', (req, res) => {
    const data = loadSaaSData();
    res.json(data);
});

// SAAS STATISTICS
app.get('/api/saas/stats', (req, res) => {
    const db = loadSaaSData();
    
    // Lead Statistics
    const totalLeads = db.leads.length;
    const qualifiedLeads = db.leads.filter(l => l.status === 'Qualified').length;
    const convertedLeads = db.leads.filter(l => l.status === 'Converted').length;
    const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(2) : 0;
    
    // Deal Statistics
    const totalDeals = db.deals.length;
    const wonDeals = db.deals.filter(d => d.stage === 'Closed Won').length;
    const lostDeals = db.deals.filter(d => d.stage === 'Closed Lost').length;
    const dealConversionRate = totalDeals > 0 ? (wonDeals / totalDeals * 100).toFixed(2) : 0;
    const totalPipelineValue = db.deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const totalWonValue = db.deals.filter(d => d.stage === 'Closed Won').reduce((sum, deal) => sum + (deal.value || 0), 0);
    
    // Revenue Statistics
    const monthlyRevenue = db.revenue.reduce((sum, r) => sum + (r.amount || 0), 0);
    const recurringRevenue = db.subscriptions.filter(s => s.status === 'Active').reduce((sum, s) => sum + (s.monthlyAmount || 0), 0);
    const totalExpenses = db.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = monthlyRevenue - totalExpenses;
    
    // Client Statistics
    const totalClients = db.clients.length;
    const activeClients = db.subscriptions.filter(s => s.status === 'Active').length;
    const churnRate = totalClients > 0 ? ((db.subscriptions.filter(s => s.status === 'Cancelled').length / totalClients) * 100).toFixed(2) : 0;
    
    // Goal Achievement
    const monthlyGoal = db.goals.find(g => g.type === 'Monthly Revenue' && g.month === new Date().getMonth() + 1);
    const goalProgress = monthlyGoal ? ((monthlyRevenue / monthlyGoal.target) * 100).toFixed(2) : 0;
    
    res.json({
        leads: { total: totalLeads, qualified: qualifiedLeads, converted: convertedLeads, conversionRate: leadConversionRate },
        deals: { total: totalDeals, won: wonDeals, lost: lostDeals, conversionRate: dealConversionRate, pipelineValue: totalPipelineValue, wonValue: totalWonValue },
        revenue: { monthly: monthlyRevenue, recurring: recurringRevenue, expenses: totalExpenses, netProfit: netProfit },
        clients: { total: totalClients, active: activeClients, churnRate: churnRate },
        goals: { monthlyGoal: monthlyGoal?.target || 0, progress: goalProgress, achieved: monthlyRevenue >= (monthlyGoal?.target || 0) }
    });
});

// SAVE LEAD
app.post('/api/saas/lead/save', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const { name, email, phone, company, source, service, notes, score } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }
        

        const newLead = {
            id: Date.now(),
            name: name.trim().substring(0, 100),
            email: email.trim().substring(0, 100),
            phone: (phone || '').trim().substring(0, 20),
            company: (company || '').trim().substring(0, 100),
            source: (source || 'Website').trim().substring(0, 50),
            service: (service || '').trim().substring(0, 100),
            notes: (notes || '').trim().substring(0, 500),
            score: Math.max(0, Math.min(100, parseInt(score) || 0)),
            status: 'New',
            assignedTo: null,
            createdAt: new Date().toISOString(),
            lastContact: new Date().toISOString(),
            nextFollowUp: null,
            activities: [],
            conversationHistory: []
        };
        
        db.leads.push(newLead);
        saveSaaSData(db);
        res.json({ success: true, leadId: newLead.id });
    } catch (error) {
        console.error('Error saving lead:', error);
        res.status(500).json({ error: 'Failed to save lead' });
    }
});

// UPDATE LEAD
app.put('/api/saas/lead/:id', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const leadId = parseInt(req.params.id);
        
        const leadIndex = db.leads.findIndex(l => l.id === leadId);
        if (leadIndex === -1) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        // Update lead with provided data
        const updatedLead = { ...db.leads[leadIndex], ...req.body };
        db.leads[leadIndex] = updatedLead;
        
        saveSaaSData(db);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ error: 'Failed to update lead' });
    }
});

// CONVERT LEAD TO DEAL
app.post('/api/saas/lead/:id/convert', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const leadId = parseInt(req.params.id);
        const { dealValue, service, notes } = req.body;
        
        const leadIndex = db.leads.findIndex(l => l.id === leadId);
        if (leadIndex === -1) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        const lead = db.leads[leadIndex];
        
        // Create new deal from lead
        const newDeal = {
            id: Date.now(),
            leadId: leadId,
            clientName: lead.name,
            clientEmail: lead.email,
            company: lead.company,
            value: Math.max(0, parseFloat(dealValue) || 0),
            service: service || lead.service,
            stage: 'Prospecting',
            probability: 10,
            expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: notes || '',
            createdAt: new Date().toISOString(),
            activities: []
        };
        
        db.deals.push(newDeal);
        
        // Update lead status
        db.leads[leadIndex].status = 'Converted';
        db.leads[leadIndex].convertedTo = newDeal.id;
        
        saveSaaSData(db);

        res.json({ success: true, dealId: newDeal.id });
    } catch (error) {
        console.error('Error converting lead:', error);
        res.status(500).json({ error: 'Failed to convert lead' });
    }
});

// ADD LEAD ACTIVITY (Call, Email, SMS, Notes)
app.post('/api/saas/lead/:id/activity', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const leadId = parseInt(req.params.id);
        const { type, description, notes, outcome } = req.body;
        
        const leadIndex = db.leads.findIndex(l => l.id === leadId);
        if (leadIndex === -1) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        const lead = db.leads[leadIndex];
        
        // Create new activity
        const newActivity = {
            id: Date.now(),
            type: (type || 'note').trim().substring(0, 20), // call, email, sms, note
            description: (description || '').trim().substring(0, 500),
            notes: (notes || '').trim().substring(0, 1000),
            outcome: (outcome || '').trim().substring(0, 200),
            date: new Date().toISOString(),
            user: 'Current User', // Can be made dynamic
            timestamp: new Date().toISOString()
        };
        
        // Add activity to lead
        if (!lead.activities) lead.activities = [];
        lead.activities.push(newActivity);
        
        // Update last contact date
        lead.lastContact = new Date().toISOString();
        
        // Add to conversation history
        if (!lead.conversationHistory) lead.conversationHistory = [];
        lead.conversationHistory.push({
            type: newActivity.type,
            content: newActivity.description,
            date: newActivity.date,
            summary: newActivity.outcome || 'No outcome recorded'
        });
        
        saveSaaSData(db);
        res.json({ success: true, activityId: newActivity.id });
    } catch (error) {
        console.error('Error adding activity:', error);
        res.status(500).json({ error: 'Failed to add activity' });
    }
});

// GET LEAD ACTIVITIES/HISTORY
app.get('/api/saas/lead/:id/history', (req, res) => {
    try {
        const db = loadSaaSData();
        const leadId = parseInt(req.params.id);
        
        const lead = db.leads.find(l => l.id === leadId);
        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        const activities = lead.activities || [];
        const conversationHistory = lead.conversationHistory || [];
        
        res.json({
            lead: {
                id: lead.id,
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                status: lead.status,
                lastContact: lead.lastContact,
                nextFollowUp: lead.nextFollowUp
            },
            activities: activities.sort((a, b) => new Date(b.date) - new Date(a.date)),
            conversationHistory: conversationHistory.sort((a, b) => new Date(b.date) - new Date(a.date))
        });
    } catch (error) {
        console.error('Error getting history:', error);
        res.status(500).json({ error: 'Failed to get history' });
    }
});

// UPDATE LEAD STATUS WITH NOTES
app.put('/api/saas/lead/:id/status', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const leadId = parseInt(req.params.id);
        const { status, notes, followUpDate, priority } = req.body;
        
        const leadIndex = db.leads.findIndex(l => l.id === leadId);
        if (leadIndex === -1) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        const lead = db.leads[leadIndex];
        const oldStatus = lead.status;
        
        // Update lead status
        lead.status = (status || lead.status).trim();
        lead.priority = priority || lead.priority || 'Medium';
        
        // Add status change activity
        if (oldStatus !== lead.status) {
            const statusActivity = {
                id: Date.now(),
                type: 'status_change',
                description: `Status changed from ${oldStatus} to ${lead.status}`,
                notes: (notes || '').trim().substring(0, 500),
                date: new Date().toISOString(),
                user: 'Current User',
                timestamp: new Date().toISOString()
            };
            
            if (!lead.activities) lead.activities = [];
            lead.activities.push(statusActivity);
        }
        
        // Update follow-up date
        if (followUpDate) {
            lead.nextFollowUp = followUpDate;
        }
        
        // Add note if provided
        if (notes && notes.trim()) {
            const noteActivity = {
                id: Date.now() + 1,
                type: 'note',
                description: notes.trim().substring(0, 500),
                date: new Date().toISOString(),
                user: 'Current User',
                timestamp: new Date().toISOString()
            };
            
            if (!lead.activities) lead.activities = [];
            lead.activities.push(noteActivity);
        }
        
        // Update last contact
        lead.lastContact = new Date().toISOString();
        
        saveSaaSData(db);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// SET FOLLOW-UP DATE
app.put('/api/saas/lead/:id/followup', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const leadId = parseInt(req.params.id);
        const { followUpDate, followUpNotes, priority } = req.body;
        
        const leadIndex = db.leads.findIndex(l => l.id === leadId);
        if (leadIndex === -1) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        const lead = db.leads[leadIndex];
        
        // Update follow-up date
        if (followUpDate) {
            lead.nextFollowUp = followUpDate;
        }
        
        // Update priority
        if (priority) {
            lead.priority = priority;
        }
        
        // Add follow-up activity
        const followUpActivity = {
            id: Date.now(),
            type: 'followup',
            description: `Follow-up scheduled for ${followUpDate}`,
            notes: (followUpNotes || '').trim().substring(0, 500),
            date: new Date().toISOString(),
            user: 'Current User',
            timestamp: new Date().toISOString()
        };
        
        if (!lead.activities) lead.activities = [];
        lead.activities.push(followUpActivity);
        
        saveSaaSData(db);
        res.json({ success: true });
    } catch (error) {
        console.error('Error setting follow-up:', error);
        res.status(500).json({ error: 'Failed to set follow-up' });
    }
});

// GET FOLLOW-UP LEADS
app.get('/api/saas/followups', (req, res) => {
    try {
        const db = loadSaaSData();
        const today = new Date().toISOString().split('T')[0];
        
        const followUps = db.leads.filter(lead => {
            return lead.nextFollowUp && lead.nextFollowUp <= today && lead.status !== 'Converted';
        }).sort((a, b) => new Date(a.nextFollowUp) - new Date(b.nextFollowUp));
        
        res.json({
            today: followUps.filter(lead => lead.nextFollowUp === today),
            overdue: followUps.filter(lead => lead.nextFollowUp < today),
            upcoming: followUps.filter(lead => {
                const followUpDate = new Date(lead.nextFollowUp);
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                return followUpDate > new Date() && followUpDate <= tomorrow;
            })
        });
    } catch (error) {
        console.error('Error getting follow-ups:', error);
        res.status(500).json({ error: 'Failed to get follow-ups' });
    }
});

// SAVE DEAL
app.post('/api/saas/deal/save', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const { clientName, clientEmail, company, value, service, stage, probability, expectedCloseDate, notes } = req.body;
        
        if (!clientName || !value) {
            return res.status(400).json({ error: 'Client name and value are required' });
        }
        
        const newDeal = {
            id: Date.now(),
            clientName: clientName.trim().substring(0, 100),
            clientEmail: (clientEmail || '').trim().substring(0, 100),
            company: (company || '').trim().substring(0, 100),
            value: Math.max(0, parseFloat(value) || 0),
            service: (service || '').trim().substring(0, 100),
            stage: (stage || 'Prospecting').trim(),
            probability: Math.max(0, Math.min(100, parseInt(probability) || 10)),
            expectedCloseDate: expectedCloseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: (notes || '').trim().substring(0, 500),
            createdAt: new Date().toISOString(),
            activities: []
        };
        
        db.deals.push(newDeal);
        saveSaaSData(db);
        res.json({ success: true, dealId: newDeal.id });
    } catch (error) {
        console.error('Error saving deal:', error);
        res.status(500).json({ error: 'Failed to save deal' });
    }
});


// UPDATE DEAL STAGE
app.put('/api/saas/deal/:id/stage', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const dealId = parseInt(req.params.id);
        const { stage, probability, notes } = req.body;
        
        const dealIndex = db.deals.findIndex(d => d.id === dealId);
        if (dealIndex === -1) {
            return res.status(404).json({ error: 'Deal not found' });
        }
        
        const deal = db.deals[dealIndex];
        const oldStage = deal.stage;
        
        // Update deal
        deal.stage = (stage || deal.stage).trim();
        deal.probability = Math.max(0, Math.min(100, parseInt(probability) || deal.probability));
        if (notes) deal.notes = notes.trim().substring(0, 500);
        
        // Log stage change
        deal.activities.push({
            type: 'Stage Change',
            from: oldStage,
            to: deal.stage,
            date: new Date().toISOString(),
            notes: notes || ''
        });
        
        // If deal is won, create client and subscription
        if (deal.stage === 'Closed Won' && oldStage !== 'Closed Won') {
            // Create client
            const newClient = {
                id: Date.now(),
                name: deal.clientName,
                email: deal.clientEmail,
                company: deal.company,
                dealId: dealId,
                service: deal.service,
                status: 'Active',
                createdAt: new Date().toISOString()
            };
            db.clients.push(newClient);
            
            // Create subscription based on deal value and service
            let monthlyAmount = deal.value;
            let billingCycle = 'Monthly';
            let nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            // Smart subscription calculation based on deal value
            if (deal.value >= 50000) {
                // Annual contract - monthly amount
                monthlyAmount = Math.round(deal.value / 12);
                billingCycle = 'Monthly';
            } else if (deal.value >= 10000) {
                // Quarterly contract
                monthlyAmount = deal.value;
                billingCycle = 'Monthly';
                nextBilling = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            } else {
                // Monthly contract
                monthlyAmount = deal.value;
                billingCycle = 'Monthly';
            }
            
            const newSubscription = {
                id: Date.now(),
                clientId: newClient.id,
                clientName: deal.clientName,
                service: deal.service,
                monthlyAmount: monthlyAmount,
                totalContractValue: deal.value,
                billingCycle: billingCycle,
                status: 'Active',
                startDate: new Date().toISOString().split('T')[0],
                nextBilling: nextBilling,
                lastBilling: null,
                billingHistory: [],
                createdAt: new Date().toISOString()
            };
            db.subscriptions.push(newSubscription);
            
            // Generate initial revenue entry for the contract
            const initialRevenue = {
                id: Date.now() + 1,
                amount: deal.value,
                source: 'Contract Signed',
                clientName: deal.clientName,
                service: deal.service,
                subscriptionId: newSubscription.id,
                date: new Date().toISOString().split('T')[0],
                notes: `Initial contract value - ${billingCycle} billing`,
                type: 'contract',
                createdAt: new Date().toISOString()
            };
            db.revenue.push(initialRevenue);
        }
        
        saveSaaSData(db);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating deal stage:', error);
        res.status(500).json({ error: 'Failed to update deal stage' });
    }
});

// SAVE SUBSCRIPTION
app.post('/api/saas/subscription/save', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const { clientId, clientName, service, monthlyAmount, billingCycle, startDate, status } = req.body;
        
        if (!clientName || !service || !monthlyAmount) {
            return res.status(400).json({ error: 'Client name, service, and amount are required' });
        }
        
        const newSubscription = {
            id: Date.now(),
            clientId: clientId || null,
            clientName: clientName.trim().substring(0, 100),
            service: service.trim().substring(0, 100),
            monthlyAmount: Math.max(0, parseFloat(monthlyAmount) || 0),
            billingCycle: (billingCycle || 'Monthly').trim(),
            startDate: startDate || new Date().toISOString().split('T')[0],
            status: (status || 'Active').trim(),
            nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };
        
        db.subscriptions.push(newSubscription);
        saveSaaSData(db);
        res.json({ success: true, subscriptionId: newSubscription.id });
    } catch (error) {
        console.error('Error saving subscription:', error);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
});

// RECORD REVENUE
app.post('/api/saas/revenue/save', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const { amount, source, clientName, service, date, notes } = req.body;
        
        if (!amount || !source) {
            return res.status(400).json({ error: 'Amount and source are required' });
        }
        
        const newRevenue = {
            id: Date.now(),
            amount: Math.max(0, parseFloat(amount) || 0),
            source: source.trim().substring(0, 100),
            clientName: (clientName || '').trim().substring(0, 100),
            service: (service || '').trim().substring(0, 100),
            date: date || new Date().toISOString().split('T')[0],
            notes: (notes || '').trim().substring(0, 500),
            createdAt: new Date().toISOString()
        };
        
        db.revenue.push(newRevenue);
        saveSaaSData(db);
        res.json({ success: true, revenueId: newRevenue.id });
    } catch (error) {
        console.error('Error saving revenue:', error);
        res.status(500).json({ error: 'Failed to save revenue' });
    }
});

// SAVE GOAL
app.post('/api/saas/goal/save', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const { type, target, current, month, year, description } = req.body;
        
        if (!type || !target) {
            return res.status(400).json({ error: 'Goal type and target are required' });
        }
        
        const newGoal = {
            id: Date.now(),
            type: type.trim().substring(0, 50),
            target: Math.max(0, parseFloat(target) || 0),
            current: Math.max(0, parseFloat(current) || 0),
            month: month || new Date().getMonth() + 1,
            year: year || new Date().getFullYear(),
            description: (description || '').trim().substring(0, 200),
            createdAt: new Date().toISOString()
        };
        
        db.goals.push(newGoal);
        saveSaaSData(db);
        res.json({ success: true, goalId: newGoal.id });
    } catch (error) {
        console.error('Error saving goal:', error);
        res.status(500).json({ error: 'Failed to save goal' });
    }
});

// SAVE EXPENSE
app.post('/api/saas/expense/save', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const { category, description, amount, date, vendor } = req.body;
        
        if (!category || !amount) {
            return res.status(400).json({ error: 'Category and amount are required' });
        }
        
        const newExpense = {
            id: Date.now(),
            category: category.trim().substring(0, 50),
            description: (description || '').trim().substring(0, 200),
            amount: Math.max(0, parseFloat(amount) || 0),
            date: date || new Date().toISOString().split('T')[0],
            vendor: (vendor || '').trim().substring(0, 100),
            createdAt: new Date().toISOString()
        };
        
        db.expenses.push(newExpense);
        saveSaaSData(db);
        res.json({ success: true, expenseId: newExpense.id });
    } catch (error) {
        console.error('Error saving expense:', error);
        res.status(500).json({ error: 'Failed to save expense' });
    }
});


// CHECK SUBSCRIPTION BILLING
app.get('/api/saas/subscription/check-billing', (req, res) => {
    try {
        const db = loadSaaSData();
        const today = new Date().toISOString().split('T')[0];
        
        // Find subscriptions due for billing today or overdue
        const dueSubscriptions = db.subscriptions.filter(sub => {
            const nextBilling = new Date(sub.nextBilling);
            const todayDate = new Date(today);
            return sub.status === 'Active' && nextBilling <= todayDate;
        });
        
        // Update next billing dates for active subscriptions
        dueSubscriptions.forEach(sub => {
            // Record monthly revenue
            const monthlyRevenue = {
                id: Date.now() + Math.random(),
                amount: sub.monthlyAmount,
                source: 'Subscription Billing',
                clientName: sub.clientName,
                service: sub.service,
                subscriptionId: sub.id,
                date: today,
                notes: `Monthly subscription billing - ${sub.billingCycle}`,
                type: 'subscription',
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            // Add to billing history
            sub.billingHistory.push({
                id: monthlyRevenue.id,
                date: today,
                amount: sub.monthlyAmount,
                status: 'pending'
            });
            
            // Update next billing date
            if (sub.billingCycle === 'Monthly') {
                sub.nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            } else if (sub.billingCycle === 'Quarterly') {
                sub.nextBilling = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            } else if (sub.billingCycle === 'Annual') {
                sub.nextBilling = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            }
            
            sub.lastBilling = today;
        });
        
        saveSaaSData(db);
        res.json({ 
            success: true, 
            dueSubscriptions: dueSubscriptions.length,
            revenue: dueSubscriptions.reduce((sum, sub) => sum + sub.monthlyAmount, 0)
        });
    } catch (error) {
        console.error('Error checking subscription billing:', error);
        res.status(500).json({ error: 'Failed to check subscription billing' });
    }
});

// CONFIRM SUBSCRIPTION PAYMENT
app.post('/api/saas/subscription/confirm-payment', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const { subscriptionId, revenueId, paymentStatus } = req.body;
        
        const subscription = db.subscriptions.find(s => s.id === parseInt(subscriptionId));
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }
        
        const revenue = db.revenue.find(r => r.id === parseInt(revenueId));
        if (!revenue) {
            return res.status(404).json({ error: 'Revenue record not found' });
        }
        
        // Update billing status
        const billingRecord = subscription.billingHistory.find(b => b.id === parseInt(revenueId));
        if (billingRecord) {
            billingRecord.status = paymentStatus || 'received';
        }
        
        // Update revenue status
        revenue.status = paymentStatus || 'received';
        revenue.confirmedAt = new Date().toISOString();
        
        saveSaaSData(db);
        res.json({ success: true });
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ error: 'Failed to confirm payment' });
    }
});

// IMPORT LEADS FROM EXCEL/CSV
app.post('/api/saas/lead/import', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const { leads } = req.body; // Array of lead objects
        
        if (!Array.isArray(leads) || leads.length === 0) {
            return res.status(400).json({ error: 'Valid leads array is required' });
        }
        
        let importedCount = 0;
        let errors = [];
        
        leads.forEach((lead, index) => {
            try {
                // Validate required fields
                if (!lead.name || !lead.email) {
                    errors.push(`Row ${index + 1}: Name and email are required`);
                    return;
                }
                
                // Create lead object
                const newLead = {
                    id: Date.now() + index,
                    name: String(lead.name).trim().substring(0, 100),
                    email: String(lead.email).trim().substring(0, 100),
                    phone: String(lead.phone || '').trim().substring(0, 20),
                    company: String(lead.company || '').trim().substring(0, 100),
                    source: String(lead.source || 'Excel Import').trim().substring(0, 50),
                    service: String(lead.service || '').trim().substring(0, 100),
                    notes: String(lead.notes || '').trim().substring(0, 500),
                    score: Math.max(0, Math.min(100, parseInt(lead.score) || 50)),
                    status: 'New',
                    assignedTo: null,
                    createdAt: new Date().toISOString(),
                    lastContact: new Date().toISOString(),
                    nextFollowUp: null,
                    importedFrom: 'Excel',
                    importDate: new Date().toISOString()
                };
                
                db.leads.push(newLead);
                importedCount++;
            } catch (leadError) {
                errors.push(`Row ${index + 1}: ${leadError.message}`);
            }
        });
        
        saveSaaSData(db);
        res.json({ 
            success: true, 
            imported: importedCount,
            errors: errors,
            total: leads.length
        });
    } catch (error) {
        console.error('Error importing leads:', error);
        res.status(500).json({ error: 'Failed to import leads' });
    }
});

// GET ADVANCED SAAS STATISTICS
app.get('/api/saas/advanced-stats', (req, res) => {
    try {
        const db = loadSaaSData();
        const today = new Date();
        const thisMonth = today.getMonth() + 1;
        const thisYear = today.getFullYear();
        
        // Lead analytics
        const totalLeads = db.leads.length;
        const qualifiedLeads = db.leads.filter(l => l.status === 'Qualified').length;
        const convertedLeads = db.leads.filter(l => l.status === 'Converted').length;

        const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(2) : 0;
        
        // Deal analytics
        const totalDeals = db.deals.length;
        const wonDeals = db.deals.filter(d => d.stage === 'Closed Won').length;
        const lostDeals = db.deals.filter(d => d.stage === 'Closed Lost').length;
        const pipelineValue = db.deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').reduce((sum, deal) => sum + (deal.value || 0), 0);
        
        // Subscription analytics
        const activeSubscriptions = db.subscriptions.filter(s => s.status === 'Active').length;
        const monthlyRecurringRevenue = db.subscriptions.filter(s => s.status === 'Active').reduce((sum, s) => sum + s.monthlyAmount, 0);
        const overdueSubscriptions = db.subscriptions.filter(s => {
            const nextBilling = new Date(s.nextBilling);
            return s.status === 'Active' && nextBilling < new Date();
        }).length;
        
        // Revenue analytics
        const monthlyRevenue = db.revenue
            .filter(r => {
                const revenueDate = new Date(r.date);
                return revenueDate.getMonth() + 1 === thisMonth && revenueDate.getFullYear() === thisYear;
            })
            .reduce((sum, r) => sum + (r.amount || 0), 0);
        
        const subscriptionRevenue = db.revenue
            .filter(r => r.type === 'subscription')
            .reduce((sum, r) => sum + (r.amount || 0), 0);
        
        // Goal analytics
        const monthlyGoal = db.goals.find(g => g.type === 'Monthly Revenue' && g.month === thisMonth && g.year === thisYear);
        const goalProgress = monthlyGoal ? ((monthlyRevenue / monthlyGoal.target) * 100).toFixed(2) : 0;
        
        // Lead source analytics
        const leadSources = {};
        db.leads.forEach(lead => {
            const source = lead.source || 'Unknown';
            leadSources[source] = (leadSources[source] || 0) + 1;
        });
        
        res.json({
            leads: {
                total: totalLeads,
                qualified: qualifiedLeads,
                converted: convertedLeads,
                conversionRate: leadConversionRate,
                sources: leadSources
            },
            deals: {
                total: totalDeals,
                won: wonDeals,
                lost: lostDeals,
                pipelineValue: pipelineValue,
                winRate: totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(2) : 0
            },
            subscriptions: {
                active: activeSubscriptions,
                overdue: overdueSubscriptions,
                monthlyRecurringRevenue: monthlyRecurringRevenue
            },
            revenue: {
                monthly: monthlyRevenue,
                subscription: subscriptionRevenue,
                total: monthlyRevenue
            },
            goals: {
                target: monthlyGoal?.target || 0,
                current: monthlyRevenue,
                progress: goalProgress,
                achieved: monthlyRevenue >= (monthlyGoal?.target || 0)
            }
        });
    } catch (error) {
        console.error('Error getting advanced stats:', error);
        res.status(500).json({ error: 'Failed to get advanced statistics' });
    }
});

// DELETE FUNCTIONS
app.delete('/api/saas/lead/:id', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const leadId = parseInt(req.params.id);
        
        const leadIndex = db.leads.findIndex(l => l.id === leadId);
        if (leadIndex === -1) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        const deletedLead = db.leads[leadIndex];
        db.leads.splice(leadIndex, 1);
        
        saveSaaSData(db);
        res.json({ success: true, deleted: deletedLead });
    } catch (error) {
        console.error('Error deleting lead:', error);
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});

app.delete('/api/saas/deal/:id', validateInput, (req, res) => {
    try {
        const db = loadSaaSData();
        const dealId = parseInt(req.params.id);
        
        const dealIndex = db.deals.findIndex(d => d.id === dealId);
        if (dealIndex === -1) {
            return res.status(404).json({ error: 'Deal not found' });
        }
        
        const deletedDeal = db.deals[dealIndex];
        db.deals.splice(dealIndex, 1);
        
        saveSaaSData(db);
        res.json({ success: true, deleted: deletedDeal });
    } catch (error) {
        console.error('Error deleting deal:', error);
        res.status(500).json({ error: 'Failed to delete deal' });
    }
});



function loadTextileDB() {
    let data = { bills: [], itemHistory: {}, stock: [], cashInHand: 0, expenses: [], sales: [] };
    if (fs.existsSync(TEXTILE_FILE)) {
        try { 
            const raw = fs.readFileSync(TEXTILE_FILE);
            const fileData = JSON.parse(raw);
            
            // Keep existing data structure and add missing fields
            data = {
                bills: fileData.bills || [],
                itemHistory: fileData.itemHistory || {},
                stock: fileData.stock || [],
                cashInHand: fileData.cashInHand || 0,
                // Ensure expenses and sales are arrays, not null
                expenses: Array.isArray(fileData.expenses) ? fileData.expenses : [],
                sales: Array.isArray(fileData.sales) ? fileData.sales : [],
                // Keep existing data
                greyStock: fileData.greyStock || [],
                millProcess: fileData.millProcess || [],
                readyStock: fileData.readyStock || [],
                vendors: fileData.vendors || []
            };
        } catch (e) { console.log("DB Read Error, Resetting RAM"); }
    } else { fs.writeFileSync(TEXTILE_FILE, JSON.stringify(data)); }
    return data;
}


function saveTextileDB(data) { 
    // Preserve existing data structure while updating bills
    const existingData = loadTextileDB();
    const updatedData = {
        ...existingData,
        ...data,
        // Ensure existing arrays are preserved - use data if it exists and is an array, otherwise use existing
        bills: Array.isArray(data.bills) ? data.bills : (existingData.bills || []),
        sales: Array.isArray(data.sales) ? data.sales : (existingData.sales || []),
        expenses: Array.isArray(data.expenses) ? data.expenses : (existingData.expenses || []),
        stock: Array.isArray(data.stock) ? data.stock : (existingData.stock || []),
        greyStock: Array.isArray(data.greyStock) ? data.greyStock : (existingData.greyStock || []),
        millProcess: Array.isArray(data.millProcess) ? data.millProcess : (existingData.millProcess || []),
        readyStock: Array.isArray(data.readyStock) ? data.readyStock : (existingData.readyStock || []),
        vendors: Array.isArray(data.vendors) ? data.vendors : (existingData.vendors || []),
        // Preserve other fields
        itemHistory: data.itemHistory || existingData.itemHistory || {},
        cashInHand: data.cashInHand !== undefined ? data.cashInHand : existingData.cashInHand
    };
    fs.writeFileSync(TEXTILE_FILE, JSON.stringify(updatedData, null, 2)); 
}

// 1. GET ALL DATA (Debugged)
app.get('/api/textile/data', (req, res) => {
    const data = loadTextileDB();
    res.json(data);
});


// 2. SMART PRICE (SECURED)
app.post('/api/textile/check-price', validateInput, (req, res) => {
    try {
        const db = loadTextileDB();
        const itemName = (req.body.itemName || "").toString().trim().toLowerCase();
        // Validate input
        if (!itemName || itemName.length > 100) {
            return res.status(400).json({ error: 'Invalid item name' });
        }
        const lastPrice = db.itemHistory[itemName] || 0;
        res.json({ lastPrice });
    } catch (error) {
        console.error('Error in check-price:', error);
        res.status(500).json({ error: 'Failed to check price' });
    }
});





// 3. SAVE BILL (SECURED) with GST support
app.post('/api/textile/purchase/save', validateInput, (req, res) => {
    try {
        const db = loadTextileDB();
        const { vendor, billNo, billDate, creditDays, items, subtotal, gstIncluded, gstRate, gstAmount, totalAmount } = req.body; 
        
        // Validate required fields
        if (!vendor || !billNo || !billDate || !items) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        let billTotal = 0;
        // Ensure items is an array and validate
        const safeItems = Array.isArray(items) ? items.slice(0, 100) : []; // Limit to 100 items
        
        for (const item of safeItems) {
            if (!item.name || !item.qty || !item.rate) {
                return res.status(400).json({ error: 'Invalid item data' });
            }
            billTotal += parseFloat(item.total || 0);
            db.itemHistory[item.name.trim().toLowerCase()] = parseFloat(item.rate);
            db.stock.push({
                id: Date.now() + Math.random(), type: 'Purchase',
                name: item.name.trim(), qty: item.qty, rate: item.rate, vendor: vendor.trim(), date: new Date()
            });
        }

        const dueDate = new Date(new Date(billDate).getTime() + (parseInt(creditDays || 30) * 86400000));
        
        // Use provided GST data if available, otherwise calculate
        const finalSubtotal = subtotal || billTotal;
        const finalGstAmount = gstAmount || 0;
        const finalTotalAmount = totalAmount || (finalSubtotal + finalGstAmount);
        
        // Create ONE unified bill entry with GST support
        const newBill = {
            id: Date.now(),
            vendor: vendor.trim().substring(0, 100),
            billNo: billNo.trim().substring(0, 50),
            billDate,
            dueDate,
            items: safeItems,
            subtotal: finalSubtotal,
            gstIncluded: !!gstIncluded,
            gstRate: Math.max(0, Math.min(28, gstRate || 0)), // GST rate between 0-28%
            gstAmount: finalGstAmount,
            totalAmount: finalTotalAmount,
            paidAmount: 0, 
            discountAmount: 0, 
            balance: finalTotalAmount,
            status: 'Unpaid', 
            payments: [],
            createdAt: new Date().toISOString()
        };
        
        db.bills.push(newBill);
        saveTextileDB(db);
        res.json({ success: true });
    } catch (error) {
        console.error('Error in purchase/save:', error);
        res.status(500).json({ error: 'Failed to save purchase' });
    }
});


// 4. PAY & DISCOUNT (SECURED)
app.post('/api/textile/pay', validateInput, (req, res) => {
    try {
        const db = loadTextileDB();
        const { billId, payAmount, discountAmount, payDate, payMode } = req.body;
        
        // Validate inputs
        if (!billId || billId <= 0) {
            return res.status(400).json({ error: 'Invalid bill ID' });
        }
        
        const pay = Math.max(0, parseFloat(payAmount) || 0);
        const disc = Math.max(0, parseFloat(discountAmount) || 0);
        
        if (pay < 0 || disc < 0) {
            return res.status(400).json({ error: 'Amounts must be positive' });
        }
        
        const bill = db.bills.find(b => b.id == billId);
        if (!bill) return res.status(404).json({ error: "Bill not found" });
        
        const currentBalance = bill.totalAmount - (bill.paidAmount + bill.discountAmount);
        if (pay + disc > currentBalance) {
            return res.status(400).json({ error: 'Payment amount exceeds balance' });
        }

        bill.paidAmount = (bill.paidAmount || 0) + pay;
        bill.discountAmount = (bill.discountAmount || 0) + disc;
        
        let bal = bill.totalAmount - (bill.paidAmount + bill.discountAmount);
        if (bal < 1) bal = 0;
        
        bill.balance = bal;
        bill.status = (bal === 0) ? 'Paid' : 'Partial';

        bill.payments.push({ 
            date: payDate || new Date().toISOString().split('T')[0], 
            amount: pay, 
            discount: disc, 
            mode: (payMode || 'Bank').trim() 
        });
        
        if (payMode === 'Cash') {
            db.cashInHand = (db.cashInHand || 0) - pay;
        }

        saveTextileDB(db);
        res.json({ success: true });
    } catch (error) {
        console.error('Error in pay:', error);
        res.status(500).json({ error: 'Failed to process payment' });
    }
});





// 4. DELETE BILL (SECURED)
app.delete('/api/textile/bill/:id', validateInput, (req, res) => {
    try {
        const db = loadTextileDB();
        const billId = parseInt(req.params.id);
        
        // Validate bill ID
        if (!billId || billId <= 0) {
            return res.status(400).json({ error: 'Invalid bill ID' });
        }
        
        // Find and remove the bill
        const billIndex = db.bills.findIndex(b => b.id === billId);
        if (billIndex === -1) {
            return res.status(404).json({ error: "Bill not found" });
        }
        
        const deletedBill = db.bills[billIndex];
        db.bills.splice(billIndex, 1);
        
        saveTextileDB(db);
        res.json({ success: true, deleted: deletedBill });
    } catch (error) {
        console.error('Error in delete bill:', error);
        res.status(500).json({ error: 'Failed to delete bill' });
    }
});

// 4.1 DELETE SALE (SECURED)
app.delete('/api/textile/sale/:id', validateInput, (req, res) => {
    try {
        const db = loadTextileDB();
        const saleId = parseInt(req.params.id);
        
        // Validate sale ID
        if (!saleId || saleId <= 0) {
            return res.status(400).json({ error: 'Invalid sale ID' });
        }
        
        // Find and remove the sale
        const saleIndex = db.sales.findIndex(s => s.id === saleId);
        if (saleIndex === -1) {
            return res.status(404).json({ error: "Sale not found" });
        }
        
        const deletedSale = db.sales[saleIndex];
        db.sales.splice(saleIndex, 1);
        
        // Update cash in hand (remove the sale amount)
        if (deletedSale.totalAmount) {
            db.cashInHand = (db.cashInHand || 0) - deletedSale.totalAmount;
        }
        
        saveTextileDB(db);
        res.json({ success: true, deleted: deletedSale });
    } catch (error) {
        console.error('Error in delete sale:', error);
        res.status(500).json({ error: 'Failed to delete sale' });
    }
});

// 4.2 DELETE EXPENSE (SECURED)
app.delete('/api/textile/expense/:id', validateInput, (req, res) => {
    try {
        const db = loadTextileDB();
        const expenseId = parseInt(req.params.id);
        
        // Validate expense ID
        if (!expenseId || expenseId <= 0) {
            return res.status(400).json({ error: 'Invalid expense ID' });
        }
        
        // Find and remove the expense
        const expenseIndex = db.expenses.findIndex(e => e.id === expenseId);
        if (expenseIndex === -1) {
            return res.status(404).json({ error: "Expense not found" });
        }
        
        const deletedExpense = db.expenses[expenseIndex];
        db.expenses.splice(expenseIndex, 1);
        
        // Update cash in hand (add back the expense amount)
        if (deletedExpense.mode === 'Cash' && deletedExpense.amount) {
            db.cashInHand = (db.cashInHand || 0) + deletedExpense.amount;
        }
        
        saveTextileDB(db);
        res.json({ success: true, deleted: deletedExpense });
    } catch (error) {
        console.error('Error in delete expense:', error);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});



// 5. SAVE SALE (SECURED)
app.post('/api/textile/sale/save', validateInput, (req, res) => {
    try {
        const db = loadTextileDB();
        const { customer, invoiceNo, saleDate, items, subtotal, gstIncluded, gstRate, gstAmount, totalAmount } = req.body;
        
        // Validate required fields
        if (!customer || !invoiceNo || !saleDate || !items) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Ensure items is an array and validate
        const safeItems = Array.isArray(items) ? items.slice(0, 100) : []; // Limit to 100 items
        
        for (const item of safeItems) {
            if (!item.name || !item.qty || !item.rate) {
                return res.status(400).json({ error: 'Invalid item data' });
            }
        }



        // Update item history with selling prices
        safeItems.forEach(item => {
            db.itemHistory[item.name.trim().toLowerCase()] = parseFloat(item.rate);
            
            // Update stock (reduce quantity when sold)
            const stockItem = db.stock.find(s => s.name.toLowerCase() === item.name.trim().toLowerCase() && s.type === 'Purchase');
            if(stockItem) {
                stockItem.qty = Math.max(0, (parseFloat(stockItem.qty) || 0) - (parseFloat(item.qty) || 0));
            }
        });

        // Create new sale entry
        const newSale = {
            id: Date.now(),
            customer: customer.trim().substring(0, 100),
            invoiceNo: invoiceNo.trim().substring(0, 50),
            saleDate,
            items: safeItems,
            subtotal: Math.max(0, subtotal || 0),
            gstIncluded: !!gstIncluded,
            gstRate: Math.max(0, Math.min(28, gstRate || 0)), // GST rate between 0-28%
            gstAmount: Math.max(0, gstAmount || 0),
            totalAmount: Math.max(0, totalAmount || 0),
            paymentStatus: 'Paid', // Sales are typically paid immediately
            date: new Date().toISOString()
        };
        
        // Add to sales array
        if(!db.sales) db.sales = [];
        db.sales.push(newSale);
        
        // Update cash in hand
        db.cashInHand = (db.cashInHand || 0) + (totalAmount || 0);

        saveTextileDB(db);
        res.json({ success: true, saleId: newSale.id });
    } catch (error) {
        console.error('Error in sale/save:', error);
        res.status(500).json({ error: 'Failed to save sale' });
    }
});


// 7. SAVE EXPENSE (SECURED)
app.post('/api/textile/expense/save', validateInput, (req, res) => {
    try {
        const db = loadTextileDB();
        const { category, description, amount, date, mode } = req.body;
        
        // Validate required fields
        if (!category || !description || !amount || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const cleanAmount = Math.max(0, parseFloat(amount) || 0);
        if (cleanAmount <= 0) {
            return res.status(400).json({ error: 'Amount must be positive' });
        }
        
        const cleanMode = (mode || 'Cash').trim().substring(0, 20);
        const validModes = ['Cash', 'Bank', 'UPI'];
        if (!validModes.includes(cleanMode)) {
            return res.status(400).json({ error: 'Invalid payment mode' });
        }
        
        // Create new expense entry
        const newExpense = {
            id: Date.now(),
            category: category.trim().substring(0, 50),
            description: description.trim().substring(0, 200),
            amount: cleanAmount,
            date,
            mode: cleanMode,
            dateCreated: new Date().toISOString()
        };
        
        // Add to expenses array
        if(!db.expenses) db.expenses = [];
        db.expenses.push(newExpense);
        
        // Update cash in hand (expenses reduce cash)
        if(cleanMode === 'Cash') {
            db.cashInHand = (db.cashInHand || 0) - cleanAmount;
        }

        saveTextileDB(db);
        res.json({ success: true, expenseId: newExpense.id });
    } catch (error) {
        console.error('Error in expense/save:', error);
        res.status(500).json({ error: 'Failed to save expense' });
    }
});



// 6. STATS (Fixed Cash Calculation)
app.get('/api/textile/stats', (req, res) => {
    const db = loadTextileDB();
    let purchase = 0, paid = 0, pending = 0, sales = 0, expenses = 0;
    
    // Purchase stats
    db.bills.forEach(b => {
        const total = b.totalAmount || b.amount || 0;
        const paidAmt = b.paidAmount || 0;
        const discountAmt = b.discountAmount || 0;
        const balance = b.balance || (total - paidAmt - discountAmt);
        
        purchase += total;
        paid += paidAmt;
        pending += balance;
    });
    
    // Sales stats
    if(db.sales && Array.isArray(db.sales)) {
        db.sales.forEach(sale => {
            sales += sale.totalAmount || 0;
        });
    }
    
    // Expense stats
    if(db.expenses && Array.isArray(db.expenses)) {
        db.expenses.forEach(expense => {
            expenses += expense.amount || 0;
        });
    }
    
    // FIXED: Calculate Cash in Hand properly
    // Cash in Hand = Total Sales - Total Purchases - Total Expenses
    // This gives us the actual cash position
    const cashInHand = sales - purchase - expenses;
    
    const grossProfit = sales - purchase;
    const netProfit = grossProfit - expenses;
    
    res.json({ 
        cash: cashInHand, 
        purchase, 
        paid, 
        payable: pending,
        sales,
        expenses,
        grossProfit,
        netProfit
    });
});


server.listen(port, '0.0.0.0', () => {
    console.log(`✅ MULTI-BUSINESS SYSTEM RUNNING on port ${port}`);
    console.log(`   💎 Diamond Business: /api/finance`);
    console.log(`   🧵 Textile Business: /api/textile/*`);
    console.log(`   💼 SaaS Business: /api/saas/*`);
    console.log(`   🌐 Web Interface: http://localhost:${port}`);
});
