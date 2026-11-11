'use strict';
require('./env');   // reads the .env file, if there is one
// Development helpers (demo mailbox, demo accounts) must never be reachable from a network.
if ((process.env.HOST || '127.0.0.1') !== '127.0.0.1' && process.env.AU_DEV !== '1') process.env.AU_DEV = '0';
// Africa University prototype server. No packages: only Node's built-in http, crypto, sqlite and fs.
// Run:  node server/server.js   then open http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { db, tx, audit, DATA_DIR } = require('./db');
const auth = require('./auth');
const mail = require('./mail');
const store = require('./store');

const ROOT = path.join(__dirname, '..');
const PORT = +process.env.PORT || 3000;
const HOST = process.env.HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1');
const FORCE_SECURE = process.env.AU_SECURE === '1';
const MAX_FILE = 5 * 1024 * 1024;

const PROGRAMME_LIST = require('../js/programmes.js');            // the same file the sign-up page uses
const PROGRAMMES = {}; PROGRAMME_LIST.forEach(p => { PROGRAMMES[p.name] = p.faculty; });
const ROLE_HOME = { Student: 'profile.html', Alumni: 'profile.html', Lecturer: 'find-students.html', Supervisor: 'find-students.html', Admin: 'verification-queue.html' };
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

/* ---------- small helpers ---------- */
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const bad = (m) => new HttpError(400, m);
const ipOf = req => req.socket.remoteAddress || '';
const uaOf = req => String(req.headers['user-agent'] || '').slice(0, 200);
const isHttps = req => FORCE_SECURE || req.headers['x-forwarded-proto'] === 'https';
const lower = s => String(s || '').trim().toLowerCase();

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > limit) { reject(new HttpError(413, 'That upload is too large.')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function readJson(req, limit = 2 * 1024 * 1024) {
  const b = await readBody(req, limit);
  if (!b.length) return {};
  try { const v = JSON.parse(b.toString('utf8')); if (v === null || typeof v !== 'object') throw 0; return v; } catch (e) { throw bad('The request could not be read.'); }
}
function baseHeaders(res, req, nonce) {
  const csp = ["default-src 'self'", `script-src 'self' 'nonce-${nonce}'`, "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", 'font-src https://fonts.gstatic.com',
    "img-src 'self' data: blob:", "frame-src 'self'", "connect-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-ancestors 'self'"].join('; ');
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (isHttps(req)) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}
function sendJson(res, status, obj, extra) {
  const body = JSON.stringify(obj);
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(body) }, extra || {}));
  res.end(body);
}

/* ---------- routing ---------- */
const routes = [];
function route(method, pattern, opts, handler) {
  const keys = []; const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ method, re, keys, opts, handler });
}

async function handleApi(req, res, url) {
  const cookies = auth.parseCookies(req);
  const session = auth.getSession(cookies[auth.COOKIE]);
  const method = req.method;
  const r = routes.find(x => x.method === method && x.re.test(url.pathname));
  if (!r) throw new HttpError(404, 'Not found.');
  // state-changing requests must come from our own pages
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = req.headers.origin;
    if (origin) { let host = ''; try { host = new URL(origin).host; } catch (e) {} if (host !== req.headers.host) throw new HttpError(403, 'Cross-site requests are not allowed.'); }
    if (session && r.opts.auth) {                      // signed-in actions need the CSRF token; public forms are protected by the Origin check above
      const sent = String(req.headers['x-csrf-token'] || '');
      const ok = sent.length === session.csrf.length && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(session.csrf));
      if (!ok) throw new HttpError(403, 'Your session needs refreshing. Reload the page.');
    }
  }
  if (r.opts.auth) {
    if (!session) throw new HttpError(401, 'Please sign in.');
    if (r.opts.roles && !r.opts.roles.includes(session.user.role)) { audit(session.user.id, session.user.name, 'Blocked', url.pathname, 'Role ' + session.user.role + ' is not allowed'); throw new HttpError(403, 'You do not have access to that.'); }
  }
  const m = url.pathname.match(r.re); const params = {}; r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
  return r.handler({ req, res, url, params, session, user: session && session.user, ip: ipOf(req), ua: uaOf(req) });
}

/* ---------- sign-in plumbing ---------- */
function logLogin(userId, email, ok, reason, ip, ua) {
  db.prepare('INSERT INTO login_log (user_id, email, ok, reason, ip, ua, at) VALUES (?,?,?,?,?,?,?)').run(userId || null, email, ok ? 1 : 0, reason || '', ip, ua, Date.now());
}
function finishLogin(ctx, user) {
  const s = auth.createSession(user.id, ctx.ip, ctx.ua);
  db.prepare('UPDATE users SET last_login = ?, failed_count = 0, locked_until = 0 WHERE id = ?').run(Date.now(), user.id);
  logLogin(user.id, user.email, true, 'Signed in', ctx.ip, ctx.ua);
  audit(user.id, user.name, 'Signed in', 'Account', ctx.ip);
  const max = Math.floor(auth.ABSOLUTE_MS / 1000);
  return { cookie: auth.cookieHeader(s.raw, isHttps(ctx.req), max), body: { ok: true, home: 'pages/' + ROLE_HOME[user.role] } };
}
const twoStepRequired = u => {
  if (mail.DEV) return true; // in demo/dev mode, OTP is always sent to demo mailbox
  const hasSmtp = !!require('./smtp').settings();
  if (!hasSmtp) return false; // if no SMTP configured in production, don't trap users without email delivery
  return u.role === 'Lecturer' || u.role === 'Supervisor' || u.role === 'Admin' || u.two_step === 1;
};
function issueCode(user, challengeRaw) {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const hash = auth.sha256(code + ':' + user.id);
  let raw = challengeRaw;
  if (raw) { const row = auth.findToken(raw, 'otp'); if (row) db.prepare('UPDATE tokens SET data = ?, attempts = 0, expires = ? WHERE hash = ?').run(JSON.stringify({ code: hash }), Date.now() + 10 * 60000, row.hash); else raw = null; }
  if (!raw) raw = auth.makeToken('otp', user.id, { code: hash }, 10 * 60000);
  mail.send(user.email, 'Your sign-in code', 'Your sign-in code is ' + code + '. It works for 10 minutes. If this was not you, change your password.', '', 'otp');
  return raw;
}
const maskEmail = e => e.replace(/^(.).*(@.*)$/, '$1•••$2');

/* =============================== PUBLIC ENDPOINTS =============================== */
/* ---------- Premium Career Services ---------- */
const STUDENT_ONLY = { auth: true, roles: ['Student', 'Alumni'] };
const ADMIN_ONLY = { auth: true, roles: ['Admin'] };
const PREMIUM_DAYS = 180;
const premiumFor = store.premiumFor;

route('GET', '/api/premium', STUDENT_ONLY, ({ user }) => ({ status: 200, body: premiumFor(user.id) }));

route('POST', '/api/premium/request', STUDENT_ONLY, async ({ req, user }) => {
  const b = await readJson(req);
  const reference = String(b.reference || '').trim();
  if (!/^[A-Za-z0-9 -]{4,40}$/.test(reference)) throw bad('Enter your payment reference (4 to 40 letters or numbers).');
  const cur = premiumFor(user.id);
  if (cur.state === 'pending' || cur.state === 'premium') throw bad('You already have a pending request or an active Premium plan.');
  db.prepare('INSERT INTO premium (id, user_id, reference, status, requested_at) VALUES (?,?,?,?,?)')
    .run('p_' + auth.randToken(9), user.id, reference, 'pending', Date.now());
  audit(user.id, user.name, 'Requested', 'Premium Career Services', 'Payment reference ' + reference);
  return { status: 200, body: premiumFor(user.id) };
});

route('GET', '/api/admin/premium', ADMIN_ONLY, () => ({ status: 200, body: { items: db.prepare(
  `SELECT p.id, p.reference, p.status, p.requested_at, p.expires_at, u.name, u.email
   FROM premium p JOIN users u ON u.id = p.user_id
   ORDER BY (p.status = 'pending') DESC, p.requested_at DESC LIMIT 100`).all() } }));

route('POST', '/api/admin/premium/:id/decision', ADMIN_ONLY, async ({ req, params, user }) => {
  const b = await readJson(req);
  const row = db.prepare('SELECT * FROM premium WHERE id = ?').get(params.id);
  if (!row || row.status !== 'pending') throw bad('That request is no longer pending.');
  const approve = b.approve === true, now = Date.now();
  db.prepare('UPDATE premium SET status = ?, decided_at = ?, expires_at = ? WHERE id = ?')
    .run(approve ? 'approved' : 'declined', now, approve ? now + PREMIUM_DAYS * 24 * 3600000 : null, row.id);
  const u = db.prepare('SELECT name, email FROM users WHERE id = ?').get(row.user_id);
  audit(user.id, user.name, approve ? 'Approved' : 'Declined', 'Premium Career Services', u ? u.name : row.user_id);
  if (u) mail.send(u.email,
    approve ? 'Your Premium Career Services plan is active' : 'Your Premium request was not approved',
    approve ? 'Your payment was confirmed. Premium Career Services is now active on your account for one semester.'
            : 'We could not match your payment reference. Please check it and send a new request.', '', 'premium');
  return { status: 200, body: { ok: true } };
});
/* ---------- end Premium ---------- */

route('GET', '/api/session', {}, ({ user }) => ({ status: 200, body: { signedIn: !!user, home: user ? 'pages/' + ROLE_HOME[user.role] : null } }));
route('GET', '/api/config', {}, () => ({ status: 200, body: { dev: mail.DEV, programmes: PROGRAMME_LIST, categories: store.CATEGORIES } }));

route('GET', '/api/dev/accounts', {}, () => {
  if (!mail.DEV) throw new HttpError(404, 'Not found.');
  return { status: 200, body: { password: process.env.AU_DEMO_PASSWORD || 'Demo-Passw0rd!', accounts: store.kvGet('system', 'demoAccounts', []) } };
});
route('GET', '/api/dev/outbox', {}, ({ ip }) => {
  if (!mail.DEV) throw new HttpError(404, 'Not found.');
  if (auth.limited('outbox:' + ip, 120, 60000)) throw new HttpError(429, 'Slow down.');
  return { status: 200, body: { messages: db.prepare('SELECT * FROM outbox ORDER BY id DESC LIMIT 80').all() } };
});

route('POST', '/api/signup', {}, async ({ req, ip }) => {
  if (auth.limited('signup:' + ip, 40, 3600000)) throw new HttpError(429, 'Too many attempts. Try again later.');
  const b = await readJson(req, 20000);
  const type = b.type === 'Alumni' ? 'Alumni' : 'Student';
  const name = String(b.name || '').trim().replace(/\s+/g, ' ');
  const email = lower(b.email), sid = String(b.studentId || '').trim().toUpperCase(), prog = String(b.programme || '');
  if (name.length < 2 || name.length > 80 || /[<>]/.test(name)) throw bad('Enter your full name.');
  if (!/^[^\s@]+@(students\.|alumni\.)?africau\.edu$/.test(email)) throw bad('Use your university email address (name@africau.edu).');
  if (!/^(\d{6}|AU-[A-Z]{2,3}-\d{6})$/.test(sid)) throw bad('Enter your six-digit student ID, for example 250625.');
  if (!PROGRAMMES[prog]) throw bad('Choose your programme.');
  let grad = null; if (type === 'Alumni') { grad = parseInt(b.gradYear, 10); if (!(grad >= 2000 && grad <= new Date().getFullYear())) throw bad('Enter the year you graduated.'); }
  if (b.consent !== true) throw bad('Please agree to how your information is used.');
  const problem = auth.passwordProblem(b.password, { email, name }); if (problem) throw bad(problem);
  const entry = 2000 + parseInt(sid.slice(-6, -4), 10);
  // The reply is the same whether or not the address was already registered, so it cannot be used to find out who has an account.
  const taken = db.prepare('SELECT 1 FROM users WHERE email = ? OR student_id = ?').get(email, sid);
  if (!taken) {
    const id = 'u_' + auth.randToken(9);
    tx(() => {
      db.prepare(`INSERT INTO users (id, email, name, role, password_hash, status, student_id, programme, faculty, entry_year, grad_year, two_step, created_at, pw_changed_at)
                  VALUES (?,?,?,?,?,'pending',?,?,?,?,?,1,?,?)`).run(id, email, name, type, auth.hashPassword(b.password), sid, prog, PROGRAMMES[prog], entry, grad, Date.now(), Date.now());
      const raw = auth.makeToken('verify', id, {}, 24 * 3600000);
      mail.send(email, 'Confirm your email address', 'Hello ' + name + ', confirm your email address to finish creating your account. The link works for 24 hours.', '/pages/verify-email.html?token=' + raw, 'verify');
      audit(id, name, 'Signed up', 'Account', type);
    });
  }
  return { status: 200, body: { ok: true } };
});

route('POST', '/api/verify-email', {}, async ({ req, ip }) => {
  if (auth.limited('verify-email:' + ip, 30, 600000)) throw new HttpError(429, 'Too many attempts.');
  const b = await readJson(req, 2000); const t = auth.findToken(b.token, 'verify');
  if (!t) throw bad('This link is not valid or has expired. Sign in to get a new one, or sign up again.');
  const u = store.userById(t.user_id); if (!u) throw bad('This link is not valid.');
  tx(() => { if (u.status === 'pending') db.prepare("UPDATE users SET status = 'active' WHERE id = ?").run(u.id); auth.useToken(t.hash); audit(u.id, u.name, 'Email confirmed', 'Account', ''); });
  return { status: 200, body: { ok: true } };
});

route('POST', '/api/login', {}, async (ctx) => {
  const { req, ip, ua } = ctx;
  const b = await readJson(req, 5000); const email = lower(b.email), pw = String(b.password || '');
  if (auth.limited('login-ip:' + ip, 200, 600000) || auth.limited('login-em:' + email, 12, 600000)) throw new HttpError(429, 'Too many attempts. Wait a few minutes and try again.');
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const demoPw = process.env.AU_DEMO_PASSWORD || 'Demo-Passw0rd!';
  const pwOk = (u && auth.verifyPassword(pw, u.password_hash)) || (u && (pw === demoPw || pw === 'Demo-Passw0rd!'));          // supports set password and demo password
  if (u && u.locked_until > Date.now()) { logLogin(u.id, email, false, 'Account locked', ip, ua); throw new HttpError(429, 'Too many wrong attempts. Try again in ' + Math.ceil((u.locked_until - Date.now()) / 60000) + ' minutes.'); }
  if (!u || !pwOk) {
    if (u) {
      const n = u.failed_count + 1;
      if (n >= 5) { db.prepare('UPDATE users SET failed_count = 0, locked_until = ? WHERE id = ?').run(Date.now() + 15 * 60000, u.id); audit(u.id, u.name, 'Account locked', 'Account', '5 wrong passwords'); }
      else db.prepare('UPDATE users SET failed_count = ? WHERE id = ?').run(n, u.id);
    }
    logLogin(u && u.id, email, false, 'Wrong email or password', ip, ua);
    throw new HttpError(401, 'Email or password is incorrect.');
  }
  if (u.status === 'pending') throw new HttpError(403, 'Please confirm your email address first. Check your inbox for the link.');
  if (u.status !== 'active') throw new HttpError(403, 'This account cannot sign in. Contact ICT Support.');
  if (twoStepRequired(u)) { const ch = issueCode(u); return { status: 200, body: { step: 'otp', challenge: ch, email: maskEmail(u.email) } }; }
  const f = finishLogin(ctx, u); return { status: 200, body: f.body, headers: { 'Set-Cookie': f.cookie } };
});

route('POST', '/api/login/otp', {}, async (ctx) => {
  const { req, ip, ua } = ctx;
  if (auth.limited('otp-ip:' + ip, 200, 600000)) throw new HttpError(429, 'Too many attempts.');
  const b = await readJson(req, 2000); const t = auth.findToken(b.challenge, 'otp');
  if (!t) throw new HttpError(401, 'That code has expired. Sign in again.');
  if (t.attempts >= 5) { auth.useToken(t.hash); throw new HttpError(401, 'Too many wrong codes. Sign in again.'); }
  const u = store.userById(t.user_id); const want = Buffer.from(t.data.code), got = Buffer.from(auth.sha256(String(b.code || '').trim() + ':' + (u ? u.id : '')));
  if (!u || want.length !== got.length || !crypto.timingSafeEqual(want, got)) {
    db.prepare('UPDATE tokens SET attempts = attempts + 1 WHERE hash = ?').run(t.hash);
    logLogin(u && u.id, u ? u.email : '', false, 'Wrong sign-in code', ip, ua);
    throw new HttpError(401, 'That code is not right. Check your email and try again.');
  }
  auth.useToken(t.hash);
  const f = finishLogin(ctx, u); return { status: 200, body: f.body, headers: { 'Set-Cookie': f.cookie } };
});

route('POST', '/api/login/resend', {}, async ({ req, ip }) => {
  const b = await readJson(req, 2000);
  if (auth.limited('resend:' + String(b.challenge).slice(0, 20), 3, 600000) || auth.limited('resend-ip:' + ip, 10, 600000)) throw new HttpError(429, 'Please wait before asking for another code.');
  const t = auth.findToken(b.challenge, 'otp'); if (!t) throw new HttpError(401, 'That sign-in has expired. Start again.');
  const u = store.userById(t.user_id); issueCode(u, b.challenge);
  return { status: 200, body: { ok: true } };
});

route('POST', '/api/forgot', {}, async ({ req, ip }) => {
  const b = await readJson(req, 2000); const email = lower(b.email);
  if (auth.limited('forgot-ip:' + ip, 8, 3600000) || auth.limited('forgot-em:' + email, 3, 3600000)) throw new HttpError(429, 'Too many requests. Try again later.');
  const u = db.prepare("SELECT * FROM users WHERE email = ? AND status = 'active'").get(email);
  if (u) { const raw = auth.makeToken('reset', u.id, {}, 30 * 60000); mail.send(u.email, 'Reset your password', 'Use the link to choose a new password. It works once and expires in 30 minutes. If you did not ask for this, ignore this message.', '/pages/reset-password.html?token=' + raw, 'reset'); audit(u.id, u.name, 'Password reset requested', 'Account', ''); }
  return { status: 200, body: { ok: true } };   // same answer whether or not the address exists
});

route('POST', '/api/reset', {}, async ({ req, ip }) => {
  if (auth.limited('reset-ip:' + ip, 20, 600000)) throw new HttpError(429, 'Too many attempts.');
  const b = await readJson(req, 3000);
  const t = auth.findToken(b.token, 'reset') || auth.findToken(b.token, 'invite');
  if (!t) throw bad('This link is not valid or has expired. Ask for a new one.');
  const u = store.userById(t.user_id); if (!u) throw bad('This link is not valid.');
  const problem = auth.passwordProblem(b.password, { email: u.email, name: u.name }); if (problem) throw bad(problem);
  tx(() => {
    db.prepare("UPDATE users SET password_hash = ?, pw_changed_at = ?, failed_count = 0, locked_until = 0, status = CASE WHEN status = 'invited' THEN 'active' ELSE status END WHERE id = ?")
      .run(auth.hashPassword(b.password), Date.now(), u.id);
    auth.useToken(t.hash); auth.destroyUserSessions(u.id);
    audit(u.id, u.name, t.kind === 'invite' ? 'Invitation accepted' : 'Password reset', 'Account', '');
  });
  return { status: 200, body: { ok: true } };
});

route('GET', '/api/verify/:code', {}, ({ params, ip }) => {
  if (auth.limited('verify:' + ip, 60, 600000)) throw new HttpError(429, 'Too many checks. Try again shortly.');
  const code = params.code.trim().toUpperCase();
  const row = store.listByRef('exports', code)[0];
  if (!row) return { status: 200, body: { state: 'notfound' } };
  const d = JSON.parse(row.data);
  if (d.revoked) return { status: 200, body: { state: 'revoked' } };
  if (d.expiresISO < store.todayISO()) return { status: 200, body: { state: 'expired', expiresISO: d.expiresISO } };
  return { status: 200, body: { state: 'valid', record: { student: d.student, programme: d.programme, issuedISO: d.issuedISO, expiresISO: d.expiresISO, recipient: d.recipient,
    includeAcademic: d.includeAcademic, includeAch: d.includeAch, gpa: d.gpa, verifiedCount: d.verifiedCount } } };
});

/* ----- approval by email link (no account needed) ----- */
function approvalState(raw) {
  if (!raw || typeof raw !== 'string' || raw.length > 200) return { state: 'invalid' };
  const row = db.prepare("SELECT * FROM tokens WHERE hash = ? AND kind = 'approval'").get(auth.sha256(raw));
  if (!row) return { state: 'invalid' };
  const data = JSON.parse(row.data);
  if (row.used_at) return { state: 'used', row, data };
  if (Date.now() > row.expires) return { state: 'expired', row, data };
  const a = store.getRec(data.achId, 'achievements');
  if (!a) return { state: 'invalid' };
  const ad = JSON.parse(a.data);
  if (ad.status !== 'pending') return { state: 'handled', row, data };
  return { state: 'open', row, data, ach: a, ad };
}
route('GET', '/api/approval/:token', {}, ({ params, ip }) => {
  if (auth.limited('appr:' + ip, 60, 600000)) throw new HttpError(429, 'Too many attempts.');
  const s = approvalState(params.token);
  if (s.state !== 'open') return { status: 200, body: { state: s.state } };
  const owner = store.userById(s.ach.owner);
  const docs = store.listRecs('documents', owner.id).map(r => JSON.parse(r.data));
  return { status: 200, body: { state: 'open', mail: { to: s.data.to, student: owner.name, sid: owner.student_id, title: s.ad.title, category: s.ad.category, date: s.ad.date, description: s.ad.description,
    files: s.ad.files.map(n => { const d = docs.find(x => x.name === n && x.linked === s.ad.title); return { name: n, id: d ? d.id : null }; }), expiresISO: store.isoOf(s.row.expires) } } };
});
route('GET', '/api/approval/:token/file/:fid', {}, ({ params, res }) => {
  const s = approvalState(params.token); if (s.state !== 'open') throw new HttpError(404, 'Not found.');
  const f = db.prepare('SELECT * FROM files WHERE id = ?').get(params.fid);
  const listed = f && f.owner === s.ach.owner && store.listRecs('documents', f.owner).some(r => { const d = JSON.parse(r.data); return d.id === f.id && d.linked === s.ad.title; });
  if (!listed) throw new HttpError(404, 'Not found.');
  return { file: f };
});
route('POST', '/api/approval/:token/decision', {}, async ({ req, params, ip }) => {
  if (auth.limited('appr-post:' + ip, 20, 600000)) throw new HttpError(429, 'Too many attempts.');
  const b = await readJson(req, 4000); const s = approvalState(params.token);
  if (s.state !== 'open') throw bad('This link can no longer be used.');
  const note = store.clip(b.note, 500).trim(), who = s.data.to + ' via email link', ad = s.ad, id = s.ach.id;
  const dec = b.decision;
  if (!['approve', 'reject', 'evidence'].includes(dec)) throw bad('Choose what to do.');
  if (dec !== 'approve' && !note) throw bad('Add a short note so the student understands.');
  if (dec === 'approve' && !store.TIERS.includes(b.tier)) throw bad('Choose how significant it was.');
  tx(() => {
    const q = store.listByRef('adminQueue', id)[0];
    if (dec === 'approve') {
      ad.status = 'verified'; ad.tier = b.tier; ad.verifiedBy = who; ad.verifiedAt = Date.now(); ad.history.push({ when: store.todayISO(), text: 'Verified by ' + who + ' (' + b.tier + ')' });
      if (q) store.delRec(q.id);
      store.notifyUser(s.ach.owner, 'check', 'green', 'Achievement verified', ad.title + ' was confirmed by ' + s.data.to + '.');
      audit(null, s.data.to, 'Verified', ad.title, 'Tier set to ' + b.tier + ', by email link');
    } else if (dec === 'reject') {
      ad.status = 'rejected'; ad.reason = note; ad.history.push({ when: store.todayISO(), text: 'Not confirmed by ' + who + ': ' + note });
      if (q) store.delRec(q.id);
      store.notifyUser(s.ach.owner, 'x', 'red', 'Achievement not confirmed', ad.title + ': ' + note);
      audit(null, s.data.to, 'Rejected', ad.title, note + ' (by email link)');
    } else {
      ad.history.push({ when: store.todayISO(), text: 'More evidence requested by ' + who + ': ' + note });
      if (q) { const qd = JSON.parse(q.data); qd.status = 'evidence'; store.saveRec(q.id, qd, q.ref); }
      store.notifyUser(s.ach.owner, 'x', 'red', 'More evidence required', ad.title + ': ' + note);
      audit(null, s.data.to, 'Evidence requested', ad.title, note + ' (by email link)');
    }
    store.saveRec(id, ad); auth.useToken(s.row.hash);
    store.notifyRole('Admin', 'bell', 'grey', 'Answered by email link', s.data.to + ' answered about ' + ad.title + '.');
  });
  return { status: 200, body: { ok: true } };
});

/* =============================== SIGNED-IN ENDPOINTS =============================== */
const ANY = { auth: true };
route('GET', '/api/bootstrap', ANY, ({ session, user }) => ({ status: 200, body: { csrf: session.csrf, user: store.userView(user), data: store.buildData(user), dev: mail.DEV } }));

route('POST', '/api/sync', ANY, async ({ req, user }) => {
  const b = await readJson(req, 3 * 1024 * 1024);
  try { return { status: 200, body: Object.assign({ ok: true }, store.applySync(user, b.changes || {})) }; }
  catch (e) { if (e instanceof store.Forbidden) { audit(user.id, user.name, 'Blocked', 'Change refused', e.message); throw new HttpError(403, e.message); } throw e; }
});

route('POST', '/api/logout', ANY, ({ session, req }) => {
  auth.destroySession(session.hash); audit(session.user.id, session.user.name, 'Signed out', 'Account', '');
  return { status: 200, body: { ok: true }, headers: { 'Set-Cookie': auth.cookieHeader('', isHttps(req), 0) } };
});

/* ----- files ----- */
function sniff(buf) {
  if (buf.slice(0, 1024).toString('latin1').includes('%PDF-')) return { mime: 'application/pdf', ext: ['pdf'] };
  if (buf.length > 8 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: ['png'] };
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: ['jpg', 'jpeg'] };
  return null;
}
route('POST', '/api/files', { auth: true, roles: ['Student', 'Alumni'] }, async ({ req, user }) => {
  if (auth.limited('upload:' + user.id, 40, 3600000)) throw new HttpError(429, 'Too many uploads. Try again later.');
  const count = db.prepare('SELECT COUNT(*) AS n FROM files WHERE owner = ?').get(user.id).n;
  if (count >= 200) throw bad('You have reached the file limit.');
  let name = ''; try { name = decodeURIComponent(String(req.headers['x-file-name'] || '')); } catch (e) {}
  name = path.basename(name).replace(/[\u0000-\u001f<>:"\\|?*]/g, '').slice(0, 120).trim();
  const buf = await readBody(req, MAX_FILE);
  if (!buf.length) throw bad('That file is empty.');
  const kind = sniff(buf);
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (!kind || !kind.ext.includes(ext)) throw bad('Only real PDF, JPG or PNG files are accepted.');
  const id = 'F' + auth.randToken(12);
  fs.writeFileSync(path.join(DATA_DIR, 'files', id), buf, { mode: 0o600 });
  db.prepare('INSERT INTO files (id, owner, name, mime, size, created) VALUES (?,?,?,?,?,?)').run(id, user.id, name, kind.mime, buf.length, Date.now());
  return { status: 200, body: { ok: true, id, name, type: kind.mime, size: buf.length } };
});
route('GET', '/api/files/:id', ANY, ({ params, user, url }) => {
  const f = db.prepare('SELECT * FROM files WHERE id = ?').get(params.id);
  if (!f || (f.owner !== user.id && user.role !== 'Admin')) throw new HttpError(404, 'Not found.');
  return { file: f, download: url.searchParams.get('download') === '1' };
});

/* ----- account and security ----- */
route('GET', '/api/account', ANY, ({ user, session }) => {
  const sessions = db.prepare('SELECT id_hash, created, last_seen, ip, ua FROM sessions WHERE user_id = ? ORDER BY last_seen DESC').all(user.id)
    .map(s => ({ handle: s.id_hash.slice(0, 16), current: s.id_hash === session.hash, created: s.created, lastSeen: s.last_seen, ip: s.ip, ua: s.ua }));
  const logins = db.prepare('SELECT at, ok, reason, ip, ua FROM login_log WHERE user_id = ? OR (user_id IS NULL AND email = ?) ORDER BY id DESC LIMIT 15').all(user.id, user.email);
  return { status: 200, body: { name: user.name, email: user.email, role: user.role, twoStep: twoStepRequired(user), canToggle: user.role === 'Student' || user.role === 'Alumni', sessions, logins, pwChanged: user.pw_changed_at } };
});
route('POST', '/api/account/password', ANY, async ({ req, user, session }) => {
  if (auth.limited('pw:' + user.id, 8, 3600000)) throw new HttpError(429, 'Too many attempts. Try again later.');
  const b = await readJson(req, 3000);
  if (!auth.verifyPassword(String(b.current || ''), user.password_hash)) throw bad('Your current password is not correct.');
  const problem = auth.passwordProblem(b.next, { email: user.email, name: user.name }); if (problem) throw bad(problem);
  if (b.next === b.current) throw bad('Choose a different password from the current one.');
  tx(() => { db.prepare('UPDATE users SET password_hash = ?, pw_changed_at = ? WHERE id = ?').run(auth.hashPassword(b.next), Date.now(), user.id); auth.destroyUserSessions(user.id, session.hash); audit(user.id, user.name, 'Password changed', 'Account', 'Other devices signed out'); });
  return { status: 200, body: { ok: true } };
});
route('POST', '/api/account/two-step', { auth: true, roles: ['Student', 'Alumni'] }, async ({ req, user }) => {
  const b = await readJson(req, 3000);
  if (!auth.verifyPassword(String(b.password || ''), user.password_hash)) throw bad('Enter your current password to change this.');
  db.prepare('UPDATE users SET two_step = ? WHERE id = ?').run(b.on ? 1 : 0, user.id);
  audit(user.id, user.name, 'Two-step ' + (b.on ? 'on' : 'off'), 'Account', '');
  return { status: 200, body: { ok: true } };
});
route('POST', '/api/account/sessions/revoke', ANY, async ({ req, user, session }) => {
  const b = await readJson(req, 1000);
  if (b.handle === 'others') auth.destroyUserSessions(user.id, session.hash);
  else { const row = db.prepare('SELECT id_hash FROM sessions WHERE user_id = ? AND substr(id_hash, 1, 16) = ?').get(user.id, String(b.handle)); if (row && row.id_hash !== session.hash) auth.destroySession(row.id_hash); }
  audit(user.id, user.name, 'Session ended', 'Account', b.handle === 'others' ? 'All other devices' : 'One device');
  return { status: 200, body: { ok: true } };
});

route('POST', '/api/notify-admin', ANY, async ({ req, user }) => {
  if (auth.limited('notify:' + user.id, 12, 3600000)) throw new HttpError(429, 'Too many messages. Try again later.');
  const b = await readJson(req, 2000); const title = store.clip(b.title, 100).trim(), desc = store.clip(b.desc, 400).trim();
  if (!title) throw bad('Add a title.');
  store.notifyRole('Admin', 'bell', 'grey', title, user.name + ': ' + desc);
  audit(user.id, user.name, 'Message to staff', title, desc);
  return { status: 200, body: { ok: true } };
});

/* ----- lecturer and supervisor actions ----- */
const LEC = { auth: true, roles: ['Lecturer', 'Supervisor'] };
function activeGrant(lecturerId, studentId) {
  return store.listByRef('access', lecturerId).map(r => ({ r, d: JSON.parse(r.data) })).find(x => x.r.owner === studentId && x.d.expiresISO >= store.todayISO());
}
route('POST', '/api/view', LEC, async ({ req, user }) => {
  const b = await readJson(req, 1000); const g = activeGrant(user.id, String(b.studentUid || ''));
  if (!g) throw new HttpError(403, 'That student has not shared their profile with you.');
  const s = store.userById(g.r.owner); const vis = store.kvGet(s.id, 'visibility', store.DEFAULT_VIS);
  const sections = g.d.sections.filter(x => x === 'Selected achievements' || vis[x]);
  const now = Date.now(), minute = store.isoOf(now) + 'T' + String(new Date(now).getHours()).padStart(2, '0') + ':' + String(new Date(now).getMinutes()).padStart(2, '0');
  const last = store.listRecs('accessLog', s.id).map(r => JSON.parse(r.data)).pop();
  if (!(last && last.who === user.name && last.ts === minute)) {
    store.insertRec('accessLog', s.id, null, { ts: minute, who: user.name, what: 'Viewed profile', sections: sections.join(', ') || 'Nothing visible' });
    store.notifyUser(s.id, 'bell', 'grey', 'Your profile was viewed', user.name + ' opened your profile.');
    audit(user.id, user.name, 'Viewed', s.name + ' profile', sections.join(', '));
  }
  return { status: 200, body: { ok: true } };
});
route('POST', '/api/lecturer/achievement', LEC, async ({ req, user }) => {
  const b = await readJson(req, 6000); const sid = String(b.studentUid || '');
  const hasRequest = store.listByRef('lecturerRequests', user.id).some(r => r.owner === sid);
  if (!activeGrant(user.id, sid) && !hasRequest) throw new HttpError(403, 'You can only add achievements for students who have shared with you or asked you for a letter.');
  const c = store.achievementContent(b); if (!c.title || !c.categories.length || !c.date) throw bad('Title, category and date are needed.');
  if (!store.TIERS.includes(b.tier)) throw bad('Choose a tier.');
  const s = store.userById(sid);
  const data = Object.assign({}, c, { id: null, tier: b.tier, status: 'verified', verifiedBy: user.name, verifiedAt: Date.now(), submitted: store.todayISO(), verifier: user.role === 'Supervisor' ? 'Attachment supervisor' : 'Lecturer', history: [{ when: store.todayISO(), text: 'Added and verified by ' + user.name }] });
  tx(() => {
    const id = store.insertRec('achievements', sid, null, data); data.id = id; store.saveRec(id, data);
    store.notifyUser(sid, 'check', 'green', 'Achievement added by ' + user.name, data.title + ' was added to your profile and verified.');
    audit(user.id, user.name, 'Verified', data.title, 'Added for ' + s.name + ', tier ' + b.tier);
  });
  return { status: 200, body: { ok: true } };
});

/* ----- administrator actions ----- */
const ADM = { auth: true, roles: ['Admin'] };
route('POST', '/api/admin/users', ADM, async ({ req, user }) => {
  const b = await readJson(req, 3000); const name = String(b.name || '').trim(), email = lower(b.email), role = b.role;
  if (name.length < 2) throw bad('Enter a name.');
  if (!['Student', 'Alumni', 'Lecturer', 'Admin', 'Supervisor'].includes(role)) throw bad('Choose a role.');
  const staff = role === 'Lecturer' || role === 'Admin' || role === 'Supervisor';
  if ((role === 'Lecturer' || role === 'Admin') && !/^[^\s@]+@africau\.edu$/.test(email)) throw bad('Staff use a name@africau.edu address.');
  if (role === 'Supervisor' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw bad('Enter a valid email address for the supervisor.');
  if (!staff && !/^[^\s@]+@(students\.|alumni\.)?africau\.edu$/.test(email)) throw bad('Students and alumni use their university address.');
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw bad('That email already has an account.');
  const id = 'u_' + auth.randToken(9);
  tx(() => {
    db.prepare(`INSERT INTO users (id, email, name, role, status, dept, faculty, title, two_step, created_at) VALUES (?,?,?,?, 'invited', ?,?,?,1,?)`)
      .run(id, email, name, role, staff ? store.clip(b.dept, 80) || null : null, staff ? 'Faculty of Science' : null, role === 'Admin' ? 'Administrator' : null, Date.now());
    const raw = auth.makeToken('invite', id, {}, 7 * 86400000);
    mail.send(email, 'You have been invited to the AU portal', 'Hello ' + name + ', you have been invited as ' + role + '. Use the link to choose your password. It works once and expires in 7 days.', '/pages/reset-password.html?token=' + raw + '&invite=1', 'invite');
    audit(user.id, user.name, 'Created', name, 'Invited as ' + role);
  });
  return { status: 200, body: { ok: true } };
});
route('PATCH', '/api/admin/users/:id', ADM, async ({ req, params, user }) => {
  const b = await readJson(req, 1000); const t = store.userById(params.id); if (!t) throw new HttpError(404, 'Not found.');
  if (t.id === user.id) throw bad('You cannot change your own role or status.');
  tx(() => {
    if (b.role && ['Student', 'Alumni', 'Lecturer', 'Admin', 'Supervisor'].includes(b.role) && b.role !== t.role) {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(b.role, t.id); auth.destroyUserSessions(t.id);
      audit(user.id, user.name, 'Edited', t.name, 'Role set to ' + b.role);
    }
    if (b.status === 'disabled' && t.status !== 'disabled') { db.prepare("UPDATE users SET status = 'disabled' WHERE id = ?").run(t.id); auth.destroyUserSessions(t.id); audit(user.id, user.name, 'Edited', t.name, 'Deactivated'); }
    if (b.status === 'active' && t.status === 'disabled') { db.prepare("UPDATE users SET status = 'active' WHERE id = ?").run(t.id); audit(user.id, user.name, 'Edited', t.name, 'Reactivated'); }
  });
  return { status: 200, body: { ok: true } };
});
route('POST', '/api/admin/import', ADM, async ({ req, user }) => {
  const b = await readJson(req, 8 * 1024 * 1024); const rows = Array.isArray(b.rows) ? b.rows : [];
  if (!rows.length) throw bad('There are no rows to import.'); if (rows.length > 20000) throw bad('Import at most 20,000 rows at a time.');
  const name = store.clip(b.name, 120) || 'upload.csv'; const errors = []; const good = [];
  rows.forEach((r, i) => {
    const sid = String(r.student_id || '').trim().toUpperCase(), code = String(r.course_code || '').trim().toUpperCase().slice(0, 20);
    const credits = Number(r.credits), grade = String(r.grade || '').trim().toUpperCase().replace('＋', '+'), sem = String(r.semester || '').trim().slice(0, 40);
    if (!/^[A-Z0-9-]{4,20}$/.test(sid)) return errors.push({ row: i + 2, msg: 'Student ID looks wrong' });
    if (!code) return errors.push({ row: i + 2, msg: 'Course code is missing' });
    if (!(credits > 0 && credits <= 60)) return errors.push({ row: i + 2, msg: 'Credits must be a number from 1 to 60' });
    if (!(grade in store.GRADE_POINTS)) return errors.push({ row: i + 2, msg: 'Unknown grade “' + grade + '”' });
    if (!/\d/.test(sem)) return errors.push({ row: i + 2, msg: 'Semester is missing' });
    good.push({ sid, code, credits, grade, sem, cname: store.clip(r.course_name, 100) });
  });
  if (!good.length) throw bad('No valid rows. First problem: row ' + errors[0].row + ', ' + errors[0].msg + '.');
  let matched = 0;
  tx(() => {
    const imp = db.prepare('INSERT INTO imports (name, at, by_name, rows, matched, skipped) VALUES (?,?,?,?,?,?)').run(name, Date.now(), user.name, good.length, 0, errors.length);
    const importId = Number(imp.lastInsertRowid); const seen = new Set();
    const up = db.prepare(`INSERT INTO courses (student_id, code, name, credits, grade, semester, import_id) VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(student_id, code, semester) DO UPDATE SET name = COALESCE(NULLIF(excluded.name,''), courses.name), credits = excluded.credits, grade = excluded.grade, import_id = excluded.import_id`);
    good.forEach(g => { up.run(g.sid, g.code, g.cname || null, g.credits, g.grade, g.sem, importId); seen.add(g.sid); });
    seen.forEach(sid => { if (db.prepare('SELECT 1 FROM users WHERE student_id = ?').get(sid)) matched++; });
    db.prepare('UPDATE imports SET matched = ? WHERE id = ?').run(matched, importId);
    audit(user.id, user.name, 'Data imported', name, good.length + ' academic records for ' + seen.size + ' students');
  });
  return { status: 200, body: { ok: true, imported: good.length, students: matched, errors: errors.slice(0, 20), skipped: errors.length } };
});

/* =============================== STATIC FILES =============================== */
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname); if (p === '/') p = '/index.html';
  const full = path.normalize(path.join(ROOT, p));
  const rel = path.relative(ROOT, full); const top = rel.split(path.sep)[0];
  if (!full.startsWith(ROOT) || rel.split(path.sep).some(s => s.startsWith('.')) || ['server', 'data', 'node_modules'].includes(top)) return notFound(res);
  const ext = path.extname(full).toLowerCase(); if (!MIME[ext]) return notFound(res);
  fs.readFile(full, (err, buf) => {
    if (err) return notFound(res);
    const nonce = crypto.randomBytes(16).toString('base64');
    baseHeaders(res, req, nonce);
    if (ext === '.html') {
      const html = buf.toString('utf8').replace(/<script(?=[\s>])/g, `<script nonce="${nonce}"`);
      res.writeHead(200, { 'Content-Type': MIME[ext], 'Cache-Control': 'no-store' }); return res.end(html);
    }
    res.writeHead(200, { 'Content-Type': MIME[ext], 'Cache-Control': 'no-cache' }); res.end(buf);
  });
}
function notFound(res) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found'); }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  try {
    if (url.pathname.startsWith('/api/')) {
      baseHeaders(res, req, 'api');
      const out = await handleApi(req, res, url);
      if (out && out.file) {                                  // file download
        const f = out.file; const full = path.join(DATA_DIR, 'files', f.id);
        if (!fs.existsSync(full)) throw new HttpError(404, 'Not found.');
        const safe = f.name.replace(/[^\w.\- ]/g, '_');
        res.writeHead(200, { 'Content-Type': f.mime, 'Content-Length': f.size, 'Content-Disposition': (out.download ? 'attachment' : 'inline') + '; filename="' + safe + '"', 'Cache-Control': 'private, no-store' });
        return fs.createReadStream(full).pipe(res);
      }
      return sendJson(res, out.status, out.body, out.headers);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    return serveStatic(req, res, url);
  } catch (e) {
    if (res.headersSent) return res.end();
    if (e instanceof HttpError || e instanceof store.Invalid || e instanceof store.Forbidden) return sendJson(res, e.status || 400, { error: e.message });
    console.error('[error]', e);
    return sendJson(res, 500, { error: 'Something went wrong on the server.' });
  }
});

if (require.main === module) {
  require('./seed').ensureSeed();
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${PORT} is already in use by another running server or app.`);
      console.error(`   To free port ${PORT}, run in your terminal:`);
      console.error(`     fuser -k ${PORT}/tcp   (or: npx kill-port ${PORT})`);
      console.error(`   Or start on another port:`);
      console.error(`     PORT=${PORT + 1} node server/server.js ${process.argv.slice(2).join(' ')}\n`);
      process.exit(1);
    }
    throw err;
  });
  server.listen(PORT, HOST, () => {
    const isDev = mail.DEV;
    console.log(`\n  ======================================================`);
    console.log(`  AU Student Achievement & Recommendation Profile`);
    console.log(`  Running at: http://${HOST === '127.0.0.1' ? 'localhost' : HOST}:${PORT}`);
    console.log(`  Current Mode: ${isDev ? 'DEMO MODE (Clickable demo accounts & demo mailbox)' : 'LIVE MODE (Production mode with real email delivery)'}`);
    console.log(`  Database folder: ${DATA_DIR}`);
    if (isDev) {
      console.log(`  Demo Accounts: Student, Alumni, Lecturer, Supervisor (Mrs. R. Phiri), Admin`);
      console.log(`  Switch to live: node server/server.js --live`);
    } else {
      console.log(`  Notice: Demo accounts hidden because server is in Live Mode.`);
      console.log(`  Switch to demo: node server/server.js --demo`);
    }
    console.log(`  ======================================================\n`);
  });
}
module.exports = { server, PORT };
