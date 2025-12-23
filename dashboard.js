// --- 1. SMART CONNECTION (Phone & Laptop Both) ---
// Yahan koi URL nahi likhna. Bas socket() likho, ye khud samajh jayega.
const socket = io(); 

// API ke aage bhi koi http://localhost nahi lagana
const apiUrl = '/api/finance';

document.addEventListener('DOMContentLoaded', fetchTransactions);

// --- 2. LIVE SYNC ---
socket.on('data_update', () => {
    console.log("New Entry Detected! Refreshing...");
    fetchTransactions();
});

// --- 3. FETCH LOGIC ---
async function fetchTransactions() {
    try {
        const res = await fetch(apiUrl); // Ye ab Phone par bhi chalega
        if (!res.ok) throw new Error("Server Error");
        
        const data = await res.json();
        renderDashboard(data);
    } catch (error) {
        console.error("Connection Failed:", error);
        // Agar phone par error aaye to user ko batao
        alert("Server se connect nahi ho pa raha. Check karein Laptop ON hai?");
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

async function addTransaction() {
    const type = document.getElementById('txnType').value;
    const category = document.getElementById('txnCategory').value;
    const desc = document.getElementById('txnDesc').value;
    const amount = document.getElementById('txnAmount').value;
    const status = type === 'income' ? document.getElementById('txnStatus').value : 'Completed';

    if(!amount) return;

    await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, category, desc, amount, status })
    });
    
    document.getElementById('txnDesc').value = '';
    document.getElementById('txnAmount').value = '';
    // fetchTransactions(); // Socket khud update karega
}

async function markReceived(id) {
    if(confirm("Confirm payment received?")) {
        await fetch(`${apiUrl}/${id}`, { method: 'PATCH' });
    }
}

async function deleteTxn(id) {
    if(confirm("Delete entry?")) {
        await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
    }
}

function toggleStatus() {
    const type = document.getElementById('txnType').value;
    const statusEl = document.getElementById('txnStatus');
    if(statusEl) statusEl.style.display = type === 'income' ? 'block' : 'none';
}