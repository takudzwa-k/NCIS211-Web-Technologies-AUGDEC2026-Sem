'use strict';
// SQLite database (built into Node 22+, no packages needed).
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.AU_DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(path.join(DATA_DIR, 'files'), { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'hub.sqlite'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Student','Alumni','Lecturer','Admin','Supervisor')),
  password_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','invited','active','disabled')),
  student_id TEXT UNIQUE,
  programme TEXT, faculty TEXT, entry_year INTEGER, grad_year INTEGER, dept TEXT, title TEXT,
  two_step INTEGER NOT NULL DEFAULT 1,
  failed_count INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL, last_login INTEGER, pw_changed_at INTEGER
);
CREATE TABLE IF NOT EXISTS sessions (
  id_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, csrf TEXT NOT NULL,
  created INTEGER NOT NULL, last_seen INTEGER NOT NULL, expires INTEGER NOT NULL, ip TEXT, ua TEXT
);
CREATE TABLE IF NOT EXISTS tokens (
  hash TEXT PRIMARY KEY, kind TEXT NOT NULL, user_id TEXT, data TEXT,
  expires INTEGER NOT NULL, used_at INTEGER, attempts INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS login_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, email TEXT, ok INTEGER, reason TEXT, ip TEXT, ua TEXT, at INTEGER
);
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT, to_email TEXT, subject TEXT, body TEXT, link TEXT, kind TEXT, at INTEGER
);
CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT, collection TEXT NOT NULL, owner TEXT, ref TEXT,
  data TEXT NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rec_coll_owner ON records (collection, owner);
CREATE INDEX IF NOT EXISTS rec_coll_ref ON records (collection, ref);
CREATE TABLE IF NOT EXISTS kv (owner TEXT NOT NULL, key TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (owner, key));
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY, owner TEXT NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, user_id TEXT, user_name TEXT,
  action TEXT NOT NULL, item TEXT, details TEXT
);
CREATE TABLE IF NOT EXISTS courses (
  student_id TEXT NOT NULL, code TEXT NOT NULL, name TEXT, credits REAL NOT NULL, grade TEXT NOT NULL,
  semester TEXT NOT NULL, import_id INTEGER, PRIMARY KEY (student_id, code, semester)
);
CREATE TABLE IF NOT EXISTS imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, at INTEGER, by_name TEXT, rows INTEGER, matched INTEGER, skipped INTEGER
);
CREATE TABLE IF NOT EXISTS premium (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, reference TEXT NOT NULL,
  status TEXT NOT NULL, requested_at INTEGER NOT NULL, decided_at INTEGER, expires_at INTEGER
);
CREATE INDEX IF NOT EXISTS premium_user ON premium (user_id);
-- The audit trail can be added to but never edited or erased, even by the application itself.
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT, 'audit log is append-only'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT, 'audit log is append-only'); END;
`);

// Upgrade users table constraint if it was created before 'Supervisor' was added
try {
  const userTableSql = db.prepare("SELECT sql FROM sqlite_master WHERE name='users'").get();
  if (userTableSql && userTableSql.sql && !userTableSql.sql.includes("'Supervisor'")) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      CREATE TABLE users_new (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('Student','Alumni','Lecturer','Admin','Supervisor')),
        password_hash TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','invited','active','disabled')),
        student_id TEXT UNIQUE,
        programme TEXT, faculty TEXT, entry_year INTEGER, grad_year INTEGER, dept TEXT, title TEXT,
        two_step INTEGER NOT NULL DEFAULT 1,
        failed_count INTEGER NOT NULL DEFAULT 0,
        locked_until INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL, last_login INTEGER, pw_changed_at INTEGER
      );
      INSERT INTO users_new SELECT * FROM users;
      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;
      PRAGMA foreign_keys = ON;
    `);
  }
} catch (e) {
  console.warn('Users table migration notice:', e.message);
}

function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { try { db.exec('ROLLBACK'); } catch (_) {} throw e; }
}

function audit(userId, userName, action, item, details) {
  db.prepare('INSERT INTO audit (at, user_id, user_name, action, item, details) VALUES (?,?,?,?,?,?)')
    .run(Date.now(), userId || null, userName || 'System', action, item || '', details || '');
}

module.exports = { db, tx, audit, DATA_DIR };
