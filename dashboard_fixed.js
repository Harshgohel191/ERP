// --- FIXED DATA INTEGRATION ---
// Now connects to actual database sources instead of just localStorage

const API_BASE = 'http://localhost:3005';

document.addEventListener('DOMContentLoaded', () => {
    loadAllBusinessData();
    setupEventListeners();
});

function setupEventListeners() {
    // Add transaction form listener
    const form = document.querySelector('.input-group');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            addTransaction();
        });
    }
}

// --- DATA LOADING FROM ALL SOURCES ---
async function loadAllBusinessData() {
    try {
        console.log('Loading data from all business sources...');
        
        // Load from all three business systems
        const [diamondData, textileData, saasData] = await Promise.all([
            fetch(`${API_BASE}/api/finance`).then(r => r.json()).catch(() => []),
            fetch(`${API_BASE}/api/textile/data`).then(r => r.json()).catch(() => ({ bills: [], sales: [], expenses: [], cashInHand: 0 })),
            fetch(`${API_BASE}/api/saas/data`).then(r => r.json()).catch(() => ({ revenue: [], expenses: [] }))
        ]);
        
        // Process and combine all data
        const allTransactions = processBusinessData(diamondData, textileData, saasData);
        
        console.log('Loaded transactions:', allTransactions.length);
        console.log('Diamond data:', diamondData);
        console.log('Textile data:', textileData);
        console.log('SaaS data:', saasData);
        
        renderDashboard(allTransactions);
        
    } catch (error) {
        console.error("Data load failed:", error);
        // Fallback to localStorage if API fails
        const localTransactions = loadTransactions();
        renderDashboard(localTransactions);
    }
}

// --- PROCESS DATA FROM ALL BUSINESSES ---
function processBusinessData(diamondData, textileData, saasData) {
    const allTransactions = [];
    
    // 1. DIAMOND BUSINESS DATA
    if (Array.isArray(diamondData)) {
        diamondData.forEach(txn => {
            allTransactions.push({
                id: `diamond_${txn.id}`,
                type: txn.type === 'credit' ? 'income' : 'expense',
                category: 'Diamond Business',
                desc: txn.description || 'Diamond Transaction',
                amount: txn.amount || 0,
                status: txn.status || 'Completed',
                date: txn.createdAt || txn.date || new Date().toISOString(),
                source: 'Diamond',
                business_id: txn.business_id
            });
        });
    }
    
    // 2. TEXTILE BUSINESS DATA
    if (textileData) {
        // Textile Bills (Purchases)
        if (textileData.bills && Array.isArray(textileData.bills)) {
            textileData.bills.forEach(bill => {
                allTransactions.push({
                    id: `textile_bill_${bill.id}`,
                    type: 'expense',
                    category: 'Textile Purchase',
                    desc: `${bill.vendor} - Bill ${bill.billNo}`,
                    amount: bill.totalAmount || bill.amount || 0,
                    status: bill.status || 'Pending',
                    date: bill.billDate || bill.createdAt || new Date().toISOString(),
                    source: 'Textile',
                    business_id: 'biz_textile'
                });
            });
        }
        
        // Textile Sales
        if (textileData.sales && Array.isArray(textileData.sales)) {
            textileData.sales.forEach(sale => {
                allTransactions.push({
                    id: `textile_sale_${sale.id}`,
                    type: 'income',
                    category: 'Textile Sales',
                    desc: `${sale.customer} - Invoice ${sale.invoiceNo}`,
                    amount: sale.totalAmount || 0,
                    status: 'Received',
                    date: sale.saleDate || sale.date || new Date().toISOString(),
                    source: 'Textile',
                    business_id: 'biz_textile'
                });
            });
        }
        
        // Textile Expenses
        if (textileData.expenses && Array.isArray(textileData.expenses)) {
            textileData.expenses.forEach(expense => {
                allTransactions.push({
                    id: `textile_expense_${expense.id}`,
                    type: 'expense',
                    category: expense.category || 'Textile Expense',
                    desc: expense.description || 'Textile Business Expense',
                    amount: expense.amount || 0,
                    status: 'Completed',
                    date: expense.date || expense.dateCreated || new Date().toISOString(),
                    source: 'Textile',
                    business_id: 'biz_textile'
                });
            });
        }
    }
    
    // 3. SAAS BUSINESS DATA
    if (saasData) {
        // SaaS Revenue
        if (saasData.revenue && Array.isArray(saasData.revenue)) {
            saasData.revenue.forEach(revenue => {
                allTransactions.push({
                    id: `saas_revenue_${revenue.id}`,
                    type: 'income',
                    category: `SaaS - ${revenue.source}`,
                    desc: `${revenue.clientName || 'Client'} - ${revenue.service || 'Service'}`,
                    amount: revenue.amount || 0,
                    status: revenue.status || 'Received',
                    date: revenue.date || revenue.createdAt || new Date().toISOString(),
                    source: 'SaaS',
                    business_id: 'biz_software'
                });
            });
        }
        
        // SaaS Expenses
        if (saasData.expenses && Array.isArray(saasData.expenses)) {
            saasData.expenses.forEach(expense => {
                allTransactions.push({
                    id: `saas_expense_${expense.id}`,
                    type: 'expense',
                    category: expense.category || 'SaaS Expense',
                    desc: expense.description || 'SaaS Business Expense',
                    amount: expense.amount || 0,
                    status: 'Completed',
                    date: expense.date || new Date().toISOString(),
                    source: 'SaaS',
                    business_id: 'biz_software'
                });
            });
        }
    }
    
    // Sort by date (newest first)
    return allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// --- ENHANCED DASHBOARD RENDERING ---
function renderDashboard(transactions) {
    const tbody = document.getElementById('txnList');
    tbody.innerHTML = '';

    let totalIncome = 0;
    let totalExpense = 0;
    let cashReceived = 0;
    let pendingAmount = 0;
    let incomeCount = 0;

    // Group by business for better insights
    const businessStats = {
        Diamond: { income: 0, expense: 0, count: 0 },
        Textile: { income: 0, expense: 0, count: 0 },
        SaaS: { income: 0, expense: 0, count: 0 }
    };

    transactions.forEach(t => {
        if (t.type === 'expense') {
            totalExpense += t.amount;
            businessStats[t.source]?.expense += t.amount;
        } else {
            totalIncome += t.amount;
            incomeCount++;
            businessStats[t.source]?.income += t.amount;
            
            if (t.status === 'Pending') {
                pendingAmount += t.amount;
            } else {
                cashReceived += t.amount;
            }
        }
        businessStats[t.source]?.count++;
    });

    // Render transactions table
    transactions.forEach(t => {
        const dateObj = new Date(t.date);
        const timeStr = dateObj.toLocaleDateString('en-IN', {month:'short', day:'numeric'}) + ' ' + 
                       dateObj.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'});
        
        const statusBadge = t.type === 'income' 
            ? (t.status === 'Pending' ? '<span class="status pending">Pending</span>' : '<span class="status received">Received</span>') 
            : '<span style="opacity:0.5">-</span>';

        const businessColor = {
            'Diamond': '#3b82f6',
            'Textile': '#10b981', 
            'SaaS': '#f59e0b'
        }[t.source] || '#6b7280';

        const row = `
            <tr>
                <td style="color:#64748b;">${timeStr}</td>
                <td style="color:${t.type==='income'?'var(--accent-green)':'var(--accent-red)'}">${t.type.toUpperCase()}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="color:${businessColor}; font-weight:bold;">${t.source}</span>
                        <span style="font-size:11px; opacity:0.7;">${t.category}</span>
                    </div>
                </td>
                <td>${t.desc}</td>
                <td style="font-weight:bold;">₹${t.amount.toLocaleString()}</td>
                <td>${statusBadge}</td>
                <td>
                    <button onclick="deleteTxn('${t.id}')" style="padding:4px; font-size:10px; width:auto; background:transparent; border:1px solid #334155; color:white; border-radius:4px; cursor:pointer;">❌</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    // Update main KPI cards
    const netProfit = totalIncome - totalExpense;
    const cashInHand = cashReceived - totalExpense;

    let margin = 0;
    if(totalIncome > 0) margin = ((netProfit / totalIncome) * 100).toFixed(1);
    
    let avgOrder = 0;
    if(incomeCount > 0) avgOrder = (totalIncome / incomeCount).toFixed(0);

    document.getElementById('cashInHand').innerText = `₹${cashInHand.toLocaleString()}`;
    document.getElementById('netProfit').innerText = `₹${netProfit.toLocaleString()}`;
    document.getElementById('totalExpense').innerText = `₹${totalExpense.toLocaleString()}`;
    document.getElementById('pendingAmount').innerText = `₹${pendingAmount.toLocaleString()}`;
    
    // Update metrics
    const marginEl = document.getElementById('netMargin');
    if(marginEl) {
        marginEl.innerText = `${margin}%`;
        marginEl.style.color = margin >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    }
    const avgEl = document.getElementById('avgOrder');
    if(avgEl) avgEl.innerText = `₹${parseInt(avgOrder).toLocaleString()}`;
    
    const volEl = document.getElementById('txnVolume');
    if(volEl) volEl.innerText = transactions.length;

    // Update last activity
    const lastEl = document.getElementById('lastEntry');
    if(lastEl && transactions.length > 0) {
        const lastDate = new Date(transactions[0].date);
        const now = new Date();
        const diffHours = Math.floor((now - lastDate) / (1000 * 60 * 60));
        if (diffHours < 1) {
            lastEl.innerText = 'Just now';
        } else if (diffHours < 24) {
            lastEl.innerText = `${diffHours}h ago`;
        } else {
            lastEl.innerText = `${Math.floor(diffHours/24)}d ago`;
        }
    }

    // Update cash card color
    const cashCard = document.querySelector('.card.cash');
    if(cashCard) {
        if(cashInHand < 0) {
            cashCard.style.borderLeft = '4px solid var(--accent-red)';
        } else {
            cashCard.style.borderLeft = '4px solid var(--accent-gold)';
        }
    }

    // Log business summary
    console.log('Business Summary:', businessStats);
}

// --- ADD TRANSACTION (Saves to Diamond business by default) ---
async function addTransaction() {
    const type = document.getElementById('txnType').value;
    const category = document.getElementById('txnCategory').value;
    const desc = document.getElementById('txnDesc').value;
    const amount = document.getElementById('txnAmount').value;
    const status = type === 'income' ? document.getElementById('txnStatus').value : 'Completed';

    if(!amount) return;

    try {
        // Save to Diamond business API
        const response = await fetch(`${API_BASE}/api/finance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: type === 'income' ? 'credit' : 'debit',
                category: category,
                description: desc,
                amount: parseFloat(amount),
                status: status,
                business_id: 'biz_diamond'
            })
        });

        if (response.ok) {
            document.getElementById('txnDesc').value = '';
            document.getElementById('txnAmount').value = '';
            loadAllBusinessData(); // Reload all data
        } else {
            alert('Failed to save transaction');
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
        alert('Error saving transaction');
    }
}

// --- DELETE TRANSACTION ---
async function deleteTxn(id) {
    if(!confirm("Delete this transaction?")) return;

    try {
        // Extract business type and ID from the transaction ID
        const [business, type, transactionId] = id.split('_');
        
        let deleteUrl = '';
        let deleteMethod = 'DELETE';
        
        if (business === 'diamond') {
            deleteUrl = `${API_BASE}/api/finance/${transactionId}`;
        } else if (business === 'textile') {
            if (type === 'bill') {
                deleteUrl = `${API_BASE}/api/textile/bill/${transactionId}`;
            } else if (type === 'sale') {
                deleteUrl = `${API_BASE}/api/textile/sale/${transactionId}`;
            } else if (type === 'expense') {
                deleteUrl = `${API_BASE}/api/textile/expense/${transactionId}`;
            }
        } else if (business === 'saas') {
            if (type === 'revenue') {
                // For SaaS revenue, we might need a different approach
                console.log('SaaS revenue deletion not implemented yet');
                return;
            } else if (type === 'expense') {
                console.log('SaaS expense deletion not implemented yet');
                return;
            }
        }
        
        if (deleteUrl) {
            const response = await fetch(deleteUrl, { method: deleteMethod });
            if (response.ok) {
                loadAllBusinessData(); // Reload data
            } else {
                alert('Failed to delete transaction');
            }
        } else {
            alert('Cannot delete this transaction type');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Error deleting transaction');
    }
}

// --- MARK PAYMENT RECEIVED (For pending transactions) ---
async function markReceived(id) {
    if(!confirm("Confirm payment received?")) return;

    try {
        const [business, type, transactionId] = id.split('_');
        
        if (business === 'diamond') {
            // Update Diamond transaction status
            const response = await fetch(`${API_BASE}/api/finance/${transactionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Received' })
            });
            
            if (response.ok) {
                loadAllBusinessData();
            }
        }
        // Add similar logic for other businesses as needed
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating payment status');
    }
}

// --- UTILITY FUNCTIONS ---
function toggleStatus() {
    const type = document.getElementById('txnType').value;
    const statusEl = document.getElementById('txnStatus');
    if(statusEl) statusEl.style.display = type === 'income' ? 'block' : 'none';
}

// Fallback functions for localStorage (if needed)
function loadTransactions() {
    const stored = localStorage.getItem('diamond_transactions');
    return stored ? JSON.parse(stored) : [];
}

function saveTransactions(transactions) {
    localStorage.setItem('diamond_transactions', JSON.stringify(transactions));
}
