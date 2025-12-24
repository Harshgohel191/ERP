const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Data is King: Ye file database store karegi
const dbPath = path.join(__dirname, 'finance.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Data Store Error:', err.message);
    } else {
        console.log('Connected to the Secure Finance Database.');
    }
});

// Tables create karna (Agar nahi hai to)
db.serialize(() => {
    // Business List (Diamond, Uber, Textile, etc.)
    db.run(`CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT
    )`);

    // Transactions (Sabka hisab yaha hoga)
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        business_id TEXT,
        amount REAL,
        type TEXT, -- 'credit' (Income) or 'debit' (Expense)
        description TEXT,
        date TEXT,
        details TEXT, -- Extra info (JSON string: Carat, KM, Fabric)
        FOREIGN KEY(business_id) REFERENCES businesses(id)
    )`);

    // Default Businesses daal dete hai (Sirf pehli baar)
    db.get("SELECT count(*) as count FROM businesses", (err, row) => {
        if (row.count === 0) {
            console.log("Creating default businesses...");
            const stmt = db.prepare("INSERT INTO businesses VALUES (?, ?, ?)");
            stmt.run("biz_diamond", "Diamond Co", "diamond");
            stmt.run("biz_textile", "Textile Hub", "textile");
            stmt.run("biz_uber", "Uber Fleet", "uber");
            stmt.run("biz_software", "Manhavi Soft", "software");
            stmt.finalize();
        }
    });
});

module.exports = db;