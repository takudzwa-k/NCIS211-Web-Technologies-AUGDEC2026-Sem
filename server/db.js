const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists so the database can be created
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Users Table (Includes Premium Tier Logic)
    // We track if they are 'free' or 'premium', and when the premium expires.
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL, -- 'student', 'alumni', 'lecturer', 'admin'
        student_id TEXT,
        tier TEXT DEFAULT 'free', -- 'free' or 'premium'
        tier_expires_at INTEGER,  -- Timestamp for expiry
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )`);

    // 2. Achievements Table
    db.run(`CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
        verified_by INTEGER,
        FOREIGN KEY (student_id) REFERENCES users(id)
    )`);

    // 3. Recommendation Letters Table (Includes Tailoring & Expedition)
    // This is where the Premium business logic lives.
    db.run(`CREATE TABLE IF NOT EXISTS letter_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        lecturer_id INTEGER NOT NULL,
        is_expedited INTEGER DEFAULT 0, -- 1 if Premium (Jumps the queue)
        is_tailored INTEGER DEFAULT 0,  -- 1 if Premium (Industry specific)
        target_industry TEXT,           -- e.g., 'Engineering', 'Management'
        draft_text TEXT,
        status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (lecturer_id) REFERENCES users(id)
    )`);

    // 4. Immutable Audit Log (Required by the Security Audit)
    // The server writes to this, and the triggers below prevent anyone from changing it.
    db.run(`CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_id INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
    )`);

    // --- SECURITY TRIGGERS ---
    // These enforce the "Immutable Audit Log" mentioned in the README.
    
    db.run(`CREATE TRIGGER IF NOT EXISTS prevent_audit_update
        BEFORE UPDATE ON audit_log
        BEGIN
            SELECT RAISE(ABORT, 'Audit log cannot be changed.');
        END;
    `);

    db.run(`CREATE TRIGGER IF NOT EXISTS prevent_audit_delete
        BEFORE DELETE ON audit_log
        BEGIN
            SELECT RAISE(ABORT, 'Audit log cannot be deleted.');
        END;
    `);

    console.log("Database tables initialized successfully with Premium Tier support and Immutable Audit Log.");
});

module.exports = db;
