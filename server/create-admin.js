'use strict';
require('./env');
// Creates the first administrator on a fresh install:   node server/create-admin.js you@africau.edu "Your Name"
// It prints a one-time link for choosing the password. No password is ever written down or shown.
const { db, audit } = require('./db');
const auth = require('./auth');
const email = String(process.argv[2] || '').trim().toLowerCase(), name = String(process.argv[3] || '').trim();
if (!/^[^\s@]+@africau\.edu$/.test(email) || name.length < 2) { console.error('Usage: node server/create-admin.js name@africau.edu "Full Name"'); process.exit(1); }
if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) { console.error('That email already has an account.'); process.exit(1); }
const id = 'u_' + auth.randToken(9);
db.prepare("INSERT INTO users (id, email, name, role, status, title, two_step, created_at) VALUES (?,?,?,'Admin','invited','Administrator',1,?)").run(id, email, name, Date.now());
const raw = auth.makeToken('invite', id, {}, 24 * 3600000);
audit(id, name, 'Created', name, 'First administrator created from the command line');
console.log('\nAdministrator created. Open this link within 24 hours to choose a password:\n');
console.log('  http://localhost:' + (process.env.PORT || 3000) + '/pages/reset-password.html?token=' + raw + '&invite=1\n');
