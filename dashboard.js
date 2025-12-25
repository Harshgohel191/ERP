

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
            fetch(`${API_BASE}/api/finance`)
                .then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.json();
                })
                .catch(err => {
                    console.error('Error loading Diamond data:', err);
                    return [];
                }),
            fetch(`${API_BASE}/api/textile/data`)
                .then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.json();
                })
                .catch(err => {
                    console.error('Error loading Textile data:', err);
                    return { bills: [], sales: [], expenses: [], cashInHand: 0 };
                }),
            fetch(`${API_BASE}/api/saas/data`)
                .then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.json();
                })
                .catch(err => {
                    console.error('Error loading SaaS data:', err);
                    return { revenue: [], expenses: [] };
                })
        ]);
        
        // Debug logging
        console.log('Raw Diamond data loaded:', diamondData);
        console.log('Diamond entries count:', Array.isArray(diamondData) ? diamondData.length : 0);
        
        // Process and combine all data
        const allTransactions = processBusinessData(diamondData, textileData, saasData);
        
        console.log('Processed transactions:', allTransactions.length);
        console.log('Diamond transactions:', allTransactions.filter(t => t.source === 'Diamond').length);
        
        renderDashboard(allTransactions);
        
    } catch (error) {
        console.error("Data load failed:", error);
        alert('Error loading data: ' + error.message);
        // Fallback to localStorage if API fails
        const localTransactions = loadTransactions();
        if (localTransactions.length > 0) {
            renderDashboard(localTransactions);
        } else {
            // Show empty state
            renderDashboard([]);
        }
    }
}


// --- PROCESS DATA FROM ALL BUSINESSES ---
function processBusinessData(diamondData, textileData, saasData) {
    const allTransactions = [];
    
    // 1. DIAMOND BUSINESS DATA
    if (Array.isArray(diamondData)) {
        diamondData.forEach((txn, index) => {
            try {
                // Validate entry has required fields
                if (!txn || typeof txn !== 'object') {
                    console.warn(`Skipping invalid entry at index ${index}:`, txn);
                    return;
                }
                
                // Handle different data formats - normalize type
                let transactionType = 'expense';
                if (txn.type === 'credit' || txn.type === 'income' || txn.expenseType === 'Income') {
                    transactionType = 'income';
                } else if (txn.type === 'debit' || txn.type === 'expense' || txn.expenseType === 'Expense') {
                    transactionType = 'expense';
                }
                
                // Handle different description field names
                const description = txn.description || txn.desc || txn.details || 'Diamond Transaction';
                
                // Handle different category field names
                const category = txn.category || txn.expenseType || 'Diamond Business';
                
                // Handle different date formats - ensure valid date
                let date = txn.createdAt || txn.date || txn.timestamp;
                if (!date) {
                    date = new Date().toISOString();
                } else {
                    // Validate date
                    const dateObj = new Date(date);
                    if (isNaN(dateObj.getTime())) {
                        console.warn(`Invalid date for entry ${txn.id}, using current date`);
                        date = new Date().toISOString();
                    } else {
                        date = dateObj.toISOString();
                    }
                }
                
                // Validate amount
                const amount = parseFloat(txn.amount);
                if (isNaN(amount) || amount < 0) {
                    console.warn(`Invalid amount for entry ${txn.id}:`, txn.amount);
                    return; // Skip invalid entries
                }
                
                // Validate ID
                const entryId = txn.id || Date.now() + index;
                
                allTransactions.push({
                    id: `diamond_${entryId}`,
                    type: transactionType,
                    category: String(category).trim() || 'Diamond Business',
                    desc: String(description).trim() || 'Diamond Transaction',
                    amount: amount,
                    status: txn.status || 'Completed',
                    date: date,
                    source: 'Diamond',
                    business_id: txn.business_id || 'biz_diamond',
                    originalId: entryId // Keep original ID for delete operations
                });
            } catch (error) {
                console.error(`Error processing Diamond entry at index ${index}:`, error, txn);
            }
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

    // Show empty state if no transactions
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:40px; color:#64748b;">
                    No transactions found. Add your first entry above.
                </td>
            </tr>
        `;
        return;
    }
    
    // Render transactions table
    transactions.forEach(t => {
        try {
            const dateObj = new Date(t.date);
            // Check if date is valid
            if (isNaN(dateObj.getTime())) {
                console.warn('Invalid date for transaction:', t);
                return;
            }
            
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

            // Escape HTML to prevent XSS
            const escapeHtml = (text) => {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            };

            const row = `
                <tr>
                    <td style="color:#64748b;">${timeStr}</td>
                    <td style="color:${t.type==='income'?'var(--accent-green)':'var(--accent-red)'}">${t.type.toUpperCase()}</td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="color:${businessColor}; font-weight:bold;">${escapeHtml(t.source || 'Unknown')}</span>
                            <span style="font-size:11px; opacity:0.7;">${escapeHtml(t.category || 'Uncategorized')}</span>
                        </div>
                    </td>
                    <td>${escapeHtml(t.desc || 'No description')}</td>
                    <td style="font-weight:bold;">₹${(t.amount || 0).toLocaleString()}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button onclick="deleteTxn('${t.id}')" style="padding:4px; font-size:10px; width:auto; background:transparent; border:1px solid #334155; color:white; border-radius:4px; cursor:pointer;">❌</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        } catch (err) {
            console.error('Error rendering transaction:', t, err);
        }
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



async function addTransaction() {
    console.log('addTransaction called');
    
    const type = document.getElementById('txnType').value;
    const category = document.getElementById('txnCategory').value;
    const desc = document.getElementById('txnDesc').value.trim();
    const amount = document.getElementById('txnAmount').value.trim();
    const statusEl = document.getElementById('txnStatus');
    const status = type === 'income' && statusEl ? statusEl.value : 'Completed';

    // Validation with user feedback
    if(!amount || amount === '' || parseFloat(amount) <= 0) {
        alert('Please enter a valid amount');
        document.getElementById('txnAmount').focus();
        return;
    }

    if(!desc || desc === '') {
        alert('Please enter a description');
        document.getElementById('txnDesc').focus();
        return;
    }

    // Get button and show loading state
    const button = document.querySelector('button[onclick="addTransaction()"]');
    const originalText = button ? button.textContent : 'ADD ENTRY';
    if (button) {
        button.disabled = true;
        button.textContent = 'Saving...';
        button.style.opacity = '0.7';
    }

    try {
        const payload = {
            type: type === 'income' ? 'credit' : 'debit',
            expenseType: type === 'income' ? 'Income' : 'Expense',
            category: category,
            description: desc,
            amount: parseFloat(amount),
            status: status,
            business_id: 'biz_diamond',
            date: new Date().toISOString()
        };

        console.log('Sending payload:', payload);

        // Save to Diamond business API
        const response = await fetch(`${API_BASE}/api/finance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('Response:', result);

        if (response.ok && result.success) {
            // Clear form
            document.getElementById('txnDesc').value = '';
            document.getElementById('txnAmount').value = '';
            
            // Show success message
            if (button) {
                button.textContent = '✓ Saved!';
                button.style.background = 'var(--accent-green)';
                button.style.opacity = '1';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '';
                    button.disabled = false;
                }, 2000);
            }
            
            // Reload all data after a short delay to ensure server has saved
            setTimeout(() => {
                loadAllBusinessData();
            }, 500);
        } else {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
                button.style.opacity = '1';
            }
            const errorMsg = result.error || result.message || 'Unknown error';
            console.error('Save failed:', result);
            alert('Failed to save transaction: ' + errorMsg);
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
            button.style.opacity = '1';
        }
        alert('Error saving transaction: ' + error.message);
    }
}






function toggleStatus() {
    const type = document.getElementById('txnType').value;
    const statusEl = document.getElementById('txnStatus');
    if(statusEl) statusEl.style.display = type === 'income' ? 'block' : 'none';
}

// --- DELETE TRANSACTION ---
async function deleteTxn(transactionId) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    try {
        // Extract the original ID from the prefixed ID
        const originalId = transactionId.replace(/^(diamond_|textile_|saas_)/, '');
        const source = transactionId.split('_')[0];
        
        // For Diamond business, delete via API
        if (source === 'diamond') {
            const response = await fetch(`${API_BASE}/api/finance/${originalId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Transaction deleted successfully');
                loadAllBusinessData();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete transaction');
            }
        } else {
            // For other businesses, show message
            alert('Delete functionality for ' + source + ' business is not yet implemented');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Error deleting transaction: ' + error.message);
    }
}

// --- FALLBACK FUNCTIONS FOR LOCALSTORAGE (if needed) ---
function loadTransactions() {
    const stored = localStorage.getItem('diamond_transactions');
    return stored ? JSON.parse(stored) : [];
}

function saveTransactions(transactions) {
    localStorage.setItem('diamond_transactions', JSON.stringify(transactions));
}
