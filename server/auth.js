'use strict';
// Passwords, sessions, one-time codes, rate limits. Only Node's built-in crypto.
const crypto = require('crypto');
const { db } = require('./db');

const COOKIE = 'au_sid';
const IDLE_MS = 60 * 60 * 1000;          // signed out after 1 hour without activity
const ABSOLUTE_MS = 12 * 60 * 60 * 1000; // and always after 12 hours

const sha256 = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const randToken = (n = 32) => crypto.randomBytes(n).toString('base64url');

/* ---------- passwords (scrypt, per-user salt) ---------- */
const SCRYPT = { N: 16384, r: 8, p: 1 };
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const h = crypto.scryptSync(pw, salt, 64, SCRYPT);
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), h.toString('base64')].join('$');
}
const DUMMY = hashPassword('dummy-password-for-timing');
function verifyPassword(pw, stored) {
  const parts = String(stored || DUMMY).split('$');
  if (parts[0] !== 'scrypt') return false;
  const [, N, r, p, salt, hash] = parts;
  const expected = Buffer.from(hash, 'base64');
  const got = crypto.scryptSync(String(pw), Buffer.from(salt, 'base64'), expected.length, { N: +N, r: +r, p: +p });
  const ok = crypto.timingSafeEqual(got, expected);
  return stored ? ok : false;          // unknown users still cost the same time
}

const COMMON = new Set(['password', 'password1', 'password12', 'password123', '1234567890', '12345678910', 'qwertyuiop', 'qwerty12345', 'iloveyou123',
  'admin12345', 'welcome123', 'letmein1234', 'africau1234', 'changeme123', 'p@ssw0rd123', 'passw0rd123', 'abcdefghij', 'abc1234567', '0123456789']);
function passwordProblem(pw, ctx = {}) {
  if (typeof pw !== 'string' || !pw) return 'Enter a password.';
  if (pw.length < 10) return 'Use at least 10 characters.';
  if (pw.length > 128) return 'Use at most 128 characters.';
  const lower = pw.toLowerCase();
  if (COMMON.has(lower)) return 'That password is too common. Choose something less guessable.';
  const local = String(ctx.email || '').split('@')[0].toLowerCase();
  if (local.length >= 4 && lower.includes(local)) return 'Do not use your email name inside your password.';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;
  if (classes < 3 && pw.length < 16) return 'Mix at least three of: lower case, upper case, numbers, symbols (or use 16 or more characters).';
  if (/^(.)\1+$/.test(pw)) return 'Do not repeat one character.';
  return null;
}

/* ---------- simple in-memory rate limiting ---------- */
const buckets = new Map();
function limited(key, max, windowMs) {
  const t = Date.now();
  let b = buckets.get(key);
  if (!b || t > b.reset) { b = { n: 0, reset: t + windowMs }; buckets.set(key, b); }
  b.n++;
  if (buckets.size > 5000) for (const [k, v] of buckets) if (t > v.reset) buckets.delete(k);
  return b.n > max;
}

/* ---------- cookies ---------- */
function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function cookieHeader(value, secure, maxAgeSec) {
  return `${COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}; Max-Age=${maxAgeSec}`;
}

/* ---------- sessions (only a hash of the cookie value is stored) ---------- */
function createSession(userId, ip, ua) {
  const raw = randToken(32), csrf = randToken(24), t = Date.now();
  db.prepare('INSERT INTO sessions (id_hash, user_id, csrf, created, last_seen, expires, ip, ua) VALUES (?,?,?,?,?,?,?,?)')
    .run(sha256(raw), userId, csrf, t, t, t + ABSOLUTE_MS, ip || '', String(ua || '').slice(0, 200));
  return { raw, csrf };
}
function getSession(raw) {
  if (!raw) return null;
  const row = db.prepare(`SELECT s.id_hash, s.csrf, s.created, s.last_seen, s.expires, u.*
                          FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id_hash = ?`).get(sha256(raw));
  if (!row) return null;
  const t = Date.now();
  if (t > row.expires || t - row.last_seen > IDLE_MS || row.status !== 'active') {
    db.prepare('DELETE FROM sessions WHERE id_hash = ?').run(row.id_hash);
    return null;
  }
  if (t - row.last_seen > 60 * 1000) db.prepare('UPDATE sessions SET last_seen = ? WHERE id_hash = ?').run(t, row.id_hash);
  return { hash: row.id_hash, csrf: row.csrf, user: row };
}
const destroySession = hash => db.prepare('DELETE FROM sessions WHERE id_hash = ?').run(hash);
const destroyUserSessions = (userId, exceptHash) =>
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND id_hash != ?').run(userId, exceptHash || '');

/* ---------- single-use tokens (email links, sign-in codes) ---------- */
function makeToken(kind, userId, data, ttlMs) {
  const raw = randToken(32);
  db.prepare('INSERT INTO tokens (hash, kind, user_id, data, expires) VALUES (?,?,?,?,?)')
    .run(sha256(raw), kind, userId || null, JSON.stringify(data || {}), Date.now() + ttlMs);
  return raw;
}
function findToken(raw, kind) {
  if (!raw || typeof raw !== 'string' || raw.length > 200) return null;
  const row = db.prepare('SELECT * FROM tokens WHERE hash = ? AND kind = ?').get(sha256(raw), kind);
  if (!row || row.used_at || Date.now() > row.expires) return null;
  row.data = JSON.parse(row.data || '{}');
  return row;
}
const useToken = hash => db.prepare('UPDATE tokens SET used_at = ? WHERE hash = ?').run(Date.now(), hash);

module.exports = { COOKIE, sha256, randToken, hashPassword, verifyPassword, passwordProblem, limited, parseCookies, cookieHeader,
  createSession, getSession, destroySession, destroyUserSessions, makeToken, findToken, useToken, IDLE_MS, ABSOLUTE_MS };
