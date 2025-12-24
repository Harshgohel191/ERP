
// --- 1. LOCAL STORAGE DATA MANAGEMENT ---
// Data ko localStorage se load aur save karenge
const DATA_KEY = 'diamond_transactions';

document.addEventListener('DOMContentLoaded', () => {
    fetchTransactions();
    setupEventListeners();
});


// --- 2. LOCAL STORAGE FUNCTIONS ---
function loadTransactions() {
    const stored = localStorage.getItem(DATA_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveTransactions(transactions) {
    localStorage.setItem(DATA_KEY, JSON.stringify(transactions));
}

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

// --- 3. FETCH LOGIC ---
async function fetchTransactions() {
    try {
        const transactions = loadTransactions();
        renderDashboard(transactions);
    } catch (error) {
        console.error("Data load failed:", error);
        alert("Data load karne mein error aaya!");
    }
}

// ... Baki Logic Same rahega (Render, Calc, Add, Delete) ...

function renderDashboard(transactions) {
    const tbody = document.getElementById('txnList');
    tbody.innerHTML = '';

    let totalIncome = 0;
    let totalExpense = 0;
    let cashReceived = 0;
    let pendingAmount = 0;
    let incomeCount = 0;

    // Sort: Newest First
    const sortedTxns = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedTxns.forEach(t => {
        if (t.type === 'expense') {
            totalExpense += t.amount;
        } else {
            totalIncome += t.amount;
            incomeCount++;
            if (t.status === 'Pending') {
                pendingAmount += t.amount;
            } else {
                cashReceived += t.amount;
            }
        }

        const dateObj = new Date(t.date);
        const timeStr = dateObj.toLocaleDateString('en-IN', {month:'short', day:'numeric'}) + ' ' + dateObj.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'});
        
        const statusBadge = t.type === 'income' 
            ? (t.status === 'Pending' ? '<span class="status pending">Pending</span>' : '<span class="status received">Received</span>') 
            : '<span style="opacity:0.5">-</span>';

        let actions = '';
        if(t.type === 'income' && t.status === 'Pending') {
            actions = `<button onclick="markReceived(${t.id})" style="padding:4px; font-size:10px; width:auto; background:var(--accent-gold); border:none; border-radius:4px; cursor:pointer;">💰 Get</button>`;
        }
        actions += ` <button onclick="deleteTxn(${t.id})" style="padding:4px; font-size:10px; width:auto; background:transparent; border:1px solid #334155; color:white; border-radius:4px; cursor:pointer;">❌</button>`;

        const row = `
            <tr>
                <td style="color:#64748b;">${timeStr}</td>
                <td style="color:${t.type==='income'?'var(--accent-green)':'var(--accent-red)'}">${t.type.toUpperCase()}</td>
                <td>${t.category}</td>
                <td>${t.desc}</td>
                <td style="font-weight:bold;">₹${t.amount.toLocaleString()}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    // Update UI
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
    
    // Metrics
    const marginEl = document.getElementById('netMargin');
    if(marginEl) {
        marginEl.innerText = `${margin}%`;
        marginEl.style.color = margin >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    }
    const avgEl = document.getElementById('avgOrder');
    if(avgEl) avgEl.innerText = `₹${parseInt(avgOrder).toLocaleString()}`;
    
    const volEl = document.getElementById('txnVolume');
    if(volEl) volEl.innerText = transactions.length;

    // Cash Card Color
    const cashCard = document.querySelector('.card.cash');
    if(cashCard) {
        if(cashInHand < 0) {
            cashCard.style.borderLeft = '4px solid var(--accent-red)';
        } else {
            cashCard.style.borderLeft = '4px solid var(--accent-gold)';
        }
    }
}


function addTransaction() {
    const type = document.getElementById('txnType').value;
    const category = document.getElementById('txnCategory').value;
    const desc = document.getElementById('txnDesc').value;
    const amount = document.getElementById('txnAmount').value;
    const status = type === 'income' ? document.getElementById('txnStatus').value : 'Completed';

    if(!amount) return;

    const transactions = loadTransactions();
    const newTxn = {
        id: Date.now(),
        type,
        category,
        desc,
        amount: parseFloat(amount),
        status,
        date: new Date().toISOString()
    };
    
    transactions.push(newTxn);
    saveTransactions(transactions);
    
    document.getElementById('txnDesc').value = '';
    document.getElementById('txnAmount').value = '';
    fetchTransactions();
}


function markReceived(id) {
    if(confirm("Confirm payment received?")) {
        const transactions = loadTransactions();
        const txn = transactions.find(t => t.id === id);
        if (txn) {
            txn.status = 'Received';
            saveTransactions(transactions);
            fetchTransactions();
        }
    }
}


function deleteTxn(id) {
    if(confirm("Delete entry?")) {
        const transactions = loadTransactions();
        const filtered = transactions.filter(t => t.id !== id);
        saveTransactions(filtered);
        fetchTransactions();
    }
}

function toggleStatus() {
    const type = document.getElementById('txnType').value;
    const statusEl = document.getElementById('txnStatus');
    if(statusEl) statusEl.style.display = type === 'income' ? 'block' : 'none';
}