'use strict';
// What each person may see (views) and what each person may change (policies + effects).
const crypto = require('crypto');
const { db, tx, audit } = require('./db');
const auth = require('./auth');
const mail = require('./mail');

/* ---------- shared lists (kept in step with the front end) ---------- */
const CATEGORIES = ['Academic Awards', 'Dean’s List', 'Scholarships & Bursaries', 'Conferences & Seminars', 'Certifications',
  'Clubs & Societies', 'Sports', 'Debate & Public Speaking', 'Leadership', 'Volunteering', 'Professional Experience', 'Pre-University'];
const LEVELS = ['Local', 'National', 'International'];
const TIERS = ['Major', 'Moderate', 'Minor'];
const VERIFIERS = ['Academic Records Office', 'Lecturer', 'Department head', 'Sports Director', 'Chaplaincy', 'Attachment supervisor'];
const LETTER_TYPES = ['Recommendation', 'Reference', 'Scholarship support', 'Employment support', 'Character reference', 'Attachment assessment', 'Industrial Attachment Evaluation'];
const OFFICIAL = ['Attachment letter', 'Admission letter'];
const SECTIONS = ['Achievements', 'Academic Record', 'Documents', 'Selected achievements'];
const VERIFIER_PEOPLE = {
  'Lecturer': { name: 'Dr. N. Dube', email: 'n.dube@africau.edu' },
  'Department head': { name: 'Prof. A. Mutasa (Head of Department)', email: 'a.mutasa@africau.edu' },
  'Sports Director': { name: 'Mr. K. Banda (Sports Director)', email: 'k.banda@africau.edu' },
  'Chaplaincy': { name: 'Rev. P. Zimba (Chaplain)', email: 'p.zimba@africau.edu' },
  'Attachment supervisor': { name: 'Mrs. R. Phiri (Industrial supervisor)', email: 'r.phiri@attachment.africau.edu' }
};
const STATUS_LABEL = { sent: 'Sent', accepted: 'Accepted', progress: 'In progress', completed: 'Completed', declined: 'Declined' };
const GRADE_POINTS = { 'A+': 4, 'A': 4, 'A-': 3.7, 'B+': 3.3, 'B': 3, 'B-': 2.7, 'C+': 2.3, 'C': 2, 'C-': 1.7, 'D+': 1.3, 'D': 1, 'F': 0 };
const TOTAL_CREDITS = 360;

class Forbidden extends Error { constructor(m) { super(m || 'Not allowed'); this.status = 403; } }
class Invalid extends Error { constructor(m) { super(m || 'Invalid request'); this.status = 400; } }
const deny = m => { throw new Forbidden(m); };

/* ---------- small helpers ---------- */
const pad = n => String(n).padStart(2, '0');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function isoOf(ms) { const d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
const todayISO = () => isoOf(Date.now());
function addDays(iso, n) { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return isoOf(d.getTime()); }
function fmtDate(iso) { const [y, m, d] = iso.split('-'); return +d + ' ' + MON[+m - 1] + ' ' + y; }
function relTime(ms) {
  const d = new Date(ms), n = new Date(), hm = pad(d.getHours()) + ':' + pad(d.getMinutes());
  const y = new Date(n); y.setDate(n.getDate() - 1);
  if (d.toDateString() === n.toDateString()) return 'Today, ' + hm;
  if (d.toDateString() === y.toDateString()) return 'Yesterday, ' + hm;
  return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
}
const initialsOf = name => name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
const clip = (v, max) => (typeof v === 'string' ? v.replace(/[<>]/g, '').slice(0, max) : '');
const isISO = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/* ---------- records ---------- */
const NUMERIC_ID = new Set(['achievements', 'adminQueue']);
function toClient(row) {
  const d = JSON.parse(row.data);
  d._id = row.id; d.owner = row.owner;
  if (NUMERIC_ID.has(row.collection)) d.id = row.id;
  if (row.collection === 'lecturerRequests') d.id = 'R' + row.id;
  return d;
}
const getRec = (id, coll) => db.prepare('SELECT * FROM records WHERE id = ? AND collection = ?').get(Number(id) || 0, coll);
const listRecs = (coll, owner) => (owner
  ? db.prepare('SELECT * FROM records WHERE collection = ? AND owner = ? ORDER BY id').all(coll, owner)
  : db.prepare('SELECT * FROM records WHERE collection = ? ORDER BY id').all(coll));
const listByRef = (coll, ref) => db.prepare('SELECT * FROM records WHERE collection = ? AND ref = ? ORDER BY id').all(coll, String(ref));
function insertRec(coll, owner, ref, data) {
  const t = Date.now();
  const r = db.prepare('INSERT INTO records (collection, owner, ref, data, created, updated) VALUES (?,?,?,?,?,?)')
    .run(coll, owner || null, ref == null ? null : String(ref), JSON.stringify(data), t, t);
  return Number(r.lastInsertRowid);
}
function saveRec(id, data, ref) {
  if (ref === undefined) db.prepare('UPDATE records SET data = ?, updated = ? WHERE id = ?').run(JSON.stringify(data), Date.now(), id);
  else db.prepare('UPDATE records SET data = ?, ref = ?, updated = ? WHERE id = ?').run(JSON.stringify(data), ref == null ? null : String(ref), Date.now(), id);
}
const delRec = id => db.prepare('DELETE FROM records WHERE id = ?').run(id);
function kvGet(owner, key, def) {
  const r = db.prepare('SELECT data FROM kv WHERE owner = ? AND key = ?').get(owner, key);
  return r ? JSON.parse(r.data) : def;
}
const kvSet = (owner, key, val) => db.prepare('INSERT INTO kv (owner, key, data) VALUES (?,?,?) ON CONFLICT(owner, key) DO UPDATE SET data = excluded.data').run(owner, key, JSON.stringify(val));
const userById = id => db.prepare('SELECT * FROM users WHERE id = ?').get(id);
const DEFAULT_VIS = { 'Achievements': true, 'Academic Record': true, 'Documents': false };

/* ---------- notifications and audit written by the server ---------- */
function notifyUser(uid, ic, tone, title, desc) {
  if (!uid) return;
  insertRec('notifications', uid, null, { icon: ic, tone, title: clip(title, 120), desc: clip(desc, 400), at: Date.now(), unread: true });
}
function notifyRole(role, ic, tone, title, desc) {
  db.prepare("SELECT id FROM users WHERE role = ? AND status = 'active'").all(role).forEach(u => notifyUser(u.id, ic, tone, title, desc));
}

/* ---------- academic record, computed from the registry import ---------- */
function semKey(s) { const m = /(\d)\D+(\d{4})/.exec(s) || /(\d{4})\D+(\d)/.exec(s); return m ? (/^\d{4}/.test(m[0]) ? +m[1] + m[2] * 10 : +m[2] * 10 + +m[1]) : 0; }
function classOf(g) { return g >= 3.7 ? 'First Class' : g >= 3.0 ? 'Upper Second Class' : g >= 2.5 ? 'Lower Second Class' : g >= 2.0 ? 'Third Class' : 'Pass'; }
function academicFor(studentId) {
  const rows = studentId ? db.prepare('SELECT * FROM courses WHERE student_id = ?').all(studentId) : [];
  if (!rows.length) return { gpa: '—', class: 'No grades imported yet', credits: 0, totalCredits: TOTAL_CREDITS, lastUpdated: 'Not yet', semesters: [], courses: [], has: false };
  let pts = 0, cr = 0, done = 0; const bySem = {};
  rows.forEach(r => {
    const gp = GRADE_POINTS[r.grade] ?? 0; pts += gp * r.credits; cr += r.credits; if (r.grade !== 'F') done += r.credits;
    (bySem[r.semester] = bySem[r.semester] || { p: 0, c: 0 }); bySem[r.semester].p += gp * r.credits; bySem[r.semester].c += r.credits;
  });
  const gpa = pts / cr;
  const sems = Object.keys(bySem).sort((a, b) => semKey(b) - semKey(a));
  const last = db.prepare('SELECT MAX(i.at) AS at FROM imports i JOIN courses c ON c.import_id = i.id WHERE c.student_id = ?').get(studentId);
  return {
    gpa: gpa.toFixed(2), class: classOf(gpa), credits: done, totalCredits: TOTAL_CREDITS, has: true,
    lastUpdated: last && last.at ? fmtDate(isoOf(last.at)) : 'Not yet',
    semesters: sems.slice(0, 3).map(s => { const m = /(\d)\D+(\d{4})/.exec(s); return { label: m ? 'S' + m[1] + ' ' + m[2] : s, gpa: (bySem[s].p / bySem[s].c).toFixed(2) }; }),
    courses: rows.sort((a, b) => semKey(b.semester) - semKey(a.semester) || a.code.localeCompare(b.code))
      .map(r => ({ code: r.code, name: r.name || r.code, credits: r.credits, grade: r.grade, sem: r.semester }))
  };
}

function premiumFor(userId) {
  const row = db.prepare('SELECT * FROM premium WHERE user_id = ? ORDER BY requested_at DESC LIMIT 1').get(userId);
  if (!row) return { state: 'free' };
  if (row.status === 'pending') return { state: 'pending', reference: row.reference, requestedAt: row.requested_at };
  if (row.status === 'declined') return { state: 'declined', reference: row.reference };
  if (row.expires_at > Date.now()) return { state: 'premium', expiresAt: row.expires_at };
  return { state: 'expired', expiresAt: row.expires_at };
}

/* ---------- views: what each person is allowed to see ---------- */
function userView(u) {
  const yr = new Date().getFullYear(); let badge, subtitle, status, portal;
  if (u.role === 'Student') { badge = 'Year ' + Math.min(6, Math.max(1, yr - (u.entry_year || yr) + 1)); subtitle = u.programme; status = 'Current student'; portal = 'Student portal'; }
  else if (u.role === 'Alumni') { badge = 'Alumni · Class of ' + u.grad_year; subtitle = badge; status = 'Graduated ' + u.grad_year; portal = 'Alumni portal'; }
  else if (u.role === 'Lecturer') { badge = 'Lecturer'; subtitle = u.faculty || u.dept; status = 'Lecturer'; portal = 'Lecturer portal'; }
  else if (u.role === 'Supervisor') { badge = 'Attachment Supervisor'; subtitle = u.dept || 'Industrial Supervisor'; status = 'Attachment Supervisor'; portal = 'Attachment Supervisor Portal'; }
  else { badge = 'Admin'; subtitle = u.title || 'Administrator'; status = 'Administrator'; portal = 'Admin portal'; }
  const uv = { id: u.id, name: u.name, initials: initialsOf(u.name), email: u.email, programme: u.programme || u.dept || '', faculty: u.faculty || '',
    studentId: u.student_id || '', badge, subtitle, entry: u.entry_year || '', status, phone: '', portal, dept: u.dept || '', role: u.role };
  if (u.role === 'Student' || u.role === 'Alumni') {
    uv.premium = premiumFor(u.id);
  }
  return uv;
}
const noteView = r => { const d = toClient(r); d.time = relTime(d.at); return d; };

function lecturerList() {
  return db.prepare("SELECT id, name, dept, role FROM users WHERE role IN ('Lecturer', 'Supervisor') AND status = 'active' ORDER BY (role = 'Lecturer') DESC, name").all();
}

function studentView(u) {
  const isPrem = premiumFor(u.id).state === 'premium';
  const reqs = listRecs('lecturerRequests', u.id).map(toClient);
  const notes = listRecs('notifications', u.id).map(noteView).sort((a, b) => b.at - a.at);
  const contact = kvGet(u.id, 'contact', { phone: '', backup: '' });
  const skills = kvGet(u.id, 'skills', []);
  return {
    achievements: listRecs('achievements', u.id).map(toClient),
    documents: listRecs('documents', u.id).map(toClient),
    lecturerRequests: reqs,
    letters: reqs.slice().reverse().map(r => ({ id: r.letterId, lecturer: r.lecturer, type: r.type, deadline: r.deadline, status: r.status, label: STATUS_LABEL[r.status], purpose: r.purpose, keyPoints: r.keyPoints, isPremium: isPrem })),
    access: listRecs('access', u.id).map(toClient),
    accessLog: listRecs('accessLog', u.id).map(toClient),
    notifications: notes,
    adminQueue: listRecs('adminQueue').filter(r => r.owner === u.id).map(toClient),
    exports: listRecs('exports', u.id).map(toClient).reverse(),
    skills: { [u.role]: skills }, contact: { [u.role]: contact },
    visibility: kvGet(u.id, 'visibility', DEFAULT_VIS), shareLink: kvGet(u.id, 'shareLink', null),
    lecturers: lecturerList(),
    academic: academicFor(u.student_id),
    activity: notes.slice(0, 3).map(n => ({ icon: n.icon, tone: n.tone, title: n.title, desc: n.desc, time: n.time }))
  };
}

function lecturerView(u) {
  const t = todayISO();
  const grants = listByRef('access', u.id).map(r => ({ row: r, g: toClient(r) })).filter(x => x.g.expiresISO >= t);
  const myReqs = listByRef('lecturerRequests', u.id).map(r => {
    const cl = toClient(r);
    cl.isPremium = premiumFor(r.owner).state === 'premium';
    return cl;
  });
  const students = grants.map(({ g }) => {
    const s = userById(g.owner);
    if (!s || s.status !== 'active') return null;
    const vis = kvGet(s.id, 'visibility', DEFAULT_VIS);
    const sections = g.sections.filter(x => x === 'Selected achievements' || vis[x]);
    const ver = listRecs('achievements', s.id).map(toClient).filter(a => a.status === 'verified');
    const picked = new Set(myReqs.filter(r => r.owner === s.id).flatMap(r => r.achievementIds || []));
    const canAll = sections.includes('Achievements'), canSel = sections.includes('Selected achievements');
    const ach = (canAll ? ver : canSel ? ver.filter(a => picked.has(a.id)) : [])
      .map(a => ({ id: a.id, title: a.title, category: a.category, date: a.date, tier: a.tier, status: 'verified', verifiedBy: a.verifiedBy, description: a.description }));
    const canAcad = sections.includes('Academic Record'), ac = academicFor(s.student_id);
    const v = userView(s);
    return { uid: s.id, id: s.student_id, name: s.name, initials: v.initials, programme: s.programme, level: v.badge, access: sections, until: g.expiresISO,
      isPremium: premiumFor(s.id).state === 'premium',
      profile: { gpa: canAcad ? ac.gpa : null, cls: canAcad ? ac.class : null, credits: canAcad ? ac.credits : null, total: TOTAL_CREDITS, achievements: ach, courses: canAcad ? ac.courses : [] } };
  }).filter(Boolean);
  return {
    lecturerRequests: myReqs,
    sharedStudents: students,
    drafts: listRecs('drafts', u.id).map(toClient),
    notifications: listRecs('notifications', u.id).map(noteView).sort((a, b) => b.at - a.at),
    lecturers: lecturerList(),
    isSupervisor: u.role === 'Supervisor'
  };
}

function adminView(u) {
  const q = listRecs('adminQueue').map(toClient);
  const weekAgo = Date.now() - 7 * 86400000;
  const verifiedWeek = listRecs('achievements').map(toClient).filter(a => a.status === 'verified' && (a.verifiedAt || 0) > weekAgo).length;
  const users = db.prepare('SELECT * FROM users ORDER BY created_at').all().map(x => ({
    _id: x.id, name: x.name, email: x.email, role: x.role,
    status: x.status === 'active' ? 'verified' : x.status === 'disabled' ? 'inactive' : 'invited',
    last: x.last_login ? relTime(x.last_login).replace(/^Today, .*/, 'Today') : 'Never' }));
  return {
    achievements: listRecs('achievements').map(toClient),
    documents: listRecs('documents').map(toClient),
    adminQueue: q,
    users,
    imports: db.prepare('SELECT * FROM imports ORDER BY id DESC LIMIT 50').all().map(i => ({ name: i.name, date: isoOf(i.at), by: i.by_name, rows: i.rows, result: 'Completed' })),
    audit: db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 500').all().map(a => {
      const d = new Date(a.at); return { ts: isoOf(a.at) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()), user: a.user_name, action: a.action, item: a.item, details: a.details };
    }),
    notifications: listRecs('notifications', u.id).map(noteView).sort((a, b) => b.at - a.at),
    stats: { verifiedWeek, avgDays: '—' },
    lecturers: lecturerList()
  };
}

function buildData(u) {
  if (u.role === 'Student' || u.role === 'Alumni') return studentView(u);
  if (u.role === 'Lecturer' || u.role === 'Supervisor') return lecturerView(u);
  return adminView(u);
}

/* =====================================================================
   WRITES: every change from a page is checked here before it is saved.
   ===================================================================== */
const WRITABLE = {
  Student: ['achievements', 'documents', 'lecturerRequests', 'access', 'accessLog', 'notifications', 'adminQueue', 'exports', 'skills', 'contact', 'visibility', 'shareLink'],
  Lecturer: ['lecturerRequests', 'drafts', 'notifications'],
  Supervisor: ['lecturerRequests', 'drafts', 'notifications'],
  Admin: ['achievements', 'documents', 'adminQueue', 'notifications']
};
WRITABLE.Alumni = WRITABLE.Student;

const strip = d => { const c = { ...d }; delete c._id; delete c.owner; return c; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function cleanHistory(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, 120).map(h => ({ when: isoOrEmpty(h && h.when), text: clip(h && h.text, 300) })).filter(h => h.text);
}
const isoOrEmpty = v => (isISO(v) ? v : '');
function appendOnly(oldH, newH) {
  const n = cleanHistory(newH);
  if (n.length < oldH.length || !oldH.every((h, i) => same(h, n[i]))) deny('History can only be added to.');
  return n;
}

function achievementContent(d) {
  const cats = Array.isArray(d.categories) ? d.categories.filter(c => CATEGORIES.includes(c)).slice(0, 12) : [];
  const files = Array.isArray(d.files) ? d.files.filter(f => typeof f === 'string').map(f => f.slice(0, 200)).slice(0, 10) : [];
  const date = isoOrEmpty(d.date);
  if (date && date > todayISO()) deny('The date cannot be in the future.');
  return { title: clip(d.title, 120).trim(), categories: cats, category: cats[0] || 'Uncategorised', date, level: LEVELS.includes(d.level) ? d.level : 'Local',
    role: clip(d.role, 120), description: clip(d.description, 2000), preUni: !!d.preUni, files, file: files[0] || '—', verifier: VERIFIERS.includes(d.verifier) ? d.verifier : '' };
}

/* an achievement just became "pending": queue it for staff and, if a person outside the portal should confirm it, email them */
function submitted(ctx, id, data, resubmitted) {
  const owner = userById(ctx.owner);
  const q = listByRef('adminQueue', id)[0];
  const entry = { id: q ? q.id : null, achId: id, student: owner.name, sid: owner.student_id || '', title: data.title, category: data.category, date: todayISO(),
    files: data.files.length ? data.files : ['(no file)'], status: 'pending', verifier: data.verifier || 'Academic Records Office', explanation: '', ownerId: owner.id };
  if (q) { entry.id = q.id; saveRec(q.id, entry, id); } else { entry.id = insertRec('adminQueue', owner.id, id, entry); saveRec(entry.id, entry, id); }
  // new link replaces any older one for this achievement
  db.prepare("UPDATE tokens SET used_at = ? WHERE kind = 'approval' AND used_at IS NULL AND json_extract(data, '$.achId') = ?").run(Date.now(), id);
  const person = VERIFIER_PEOPLE[data.verifier];
  if (person) {
    const raw = auth.makeToken('approval', owner.id, { achId: id, queueId: entry.id, to: person.name }, 7 * 86400000);
    mail.send(person.email, 'Please confirm an achievement for ' + owner.name,
      owner.name + ' asked the university to record “' + data.title + '” and named you to confirm it. Use the secure link. No login is needed. It works once and expires in 7 days.',
      '/pages/email-approval.html?t=' + raw, 'approval');
  }
  notifyRole('Admin', 'clock', 'amber', 'New achievement to review', owner.name + ': ' + data.title + ' (sent to ' + entry.verifier + ')');
  notifyUser(owner.id, 'check', 'green', 'Submitted for review', data.title + ' was sent to ' + entry.verifier + '. You will be told when it is verified.');
  audit(owner.id, owner.name, resubmitted ? 'Resubmitted' : 'Created', data.title, 'Submitted for review');
}

const H = {};

/* ----- achievements ----- */
H.achievements = (ctx, ch) => {
  const u = ctx.user, out = [];
  (ch.deletes || []).forEach(id => {
    const row = getRec(id, 'achievements'); if (!row) return;
    const d = JSON.parse(row.data);
    if (row.owner !== u.id || d.status !== 'draft') deny('Only your own drafts can be deleted.');
    delRec(row.id);
  });
  (ch.upserts || []).forEach(rec => {
    if (!rec._id) {                                           // ---- create
      if (u.role !== 'Student' && u.role !== 'Alumni') deny('Only students and alumni add their own achievements.');
      const c = achievementContent(rec); if (!c.title) deny('A title is needed.');
      const status = rec.status === 'pending' ? 'pending' : 'draft';
      const data = { ...c, id: null, tier: '', status, submitted: todayISO(), history: cleanHistory(rec.history) };
      const id = insertRec('achievements', u.id, null, data); data.id = id; saveRec(id, data);
      if (typeof rec.id === 'number' && rec.id < 0) ctx.idMap[rec.id] = id;
      if (status === 'pending') { ctx.owner = u.id; submitted(ctx, id, data, false); }
      out.push(toClient(getRec(id, 'achievements'))); return;
    }
    const row = getRec(rec._id, 'achievements'); if (!row) deny('That achievement no longer exists.');
    const old = JSON.parse(row.data); let next;
    if (u.role === 'Admin') {                                  // ---- staff decision
      next = { ...old };
      if (rec.status !== undefined && ['pending', 'verified', 'rejected'].includes(rec.status)) next.status = rec.status;
      if (rec.tier !== undefined && (rec.tier === '' || TIERS.includes(rec.tier))) next.tier = rec.tier;
      if (rec.verifiedBy !== undefined) next.verifiedBy = clip(rec.verifiedBy, 200);
      if (rec.reason !== undefined) next.reason = clip(rec.reason, 500);
      if (rec.flag !== undefined) next.flag = rec.flag ? { note: clip(rec.flag.note, 500), by: u.name, date: todayISO(), reply: old.flag ? old.flag.reply : null } : undefined;
      next.history = appendOnly(old.history || [], rec.history);
      if (next.status === 'verified' && old.status !== 'verified') {
        if (!next.tier) deny('Choose a tier before verifying.'); next.verifiedAt = Date.now();
        notifyUser(row.owner, 'check', 'green', 'Achievement verified', next.title + ' has been verified and is now visible on your shared profile.');
        audit(u.id, u.name, 'Verified', next.title, 'Tier set to ' + next.tier);
        db.prepare("UPDATE tokens SET used_at = ? WHERE kind = 'approval' AND used_at IS NULL AND json_extract(data, '$.achId') = ?").run(Date.now(), row.id);
      }
      if (next.status === 'rejected' && old.status !== 'rejected') {
        if (!next.reason) deny('Give a reason before rejecting.');
        notifyUser(row.owner, 'x', 'red', 'Achievement rejected', next.title + ': ' + next.reason);
        audit(u.id, u.name, 'Rejected', next.title, next.reason);
        db.prepare("UPDATE tokens SET used_at = ? WHERE kind = 'approval' AND used_at IS NULL AND json_extract(data, '$.achId') = ?").run(Date.now(), row.id);
      }
      if (next.flag && !old.flag) {
        notifyUser(row.owner, 'bell', 'red', 'Please explain an achievement', next.title + ': ' + next.flag.note);
        audit(u.id, u.name, 'Flagged', next.title, next.flag.note);
      }
      (next.history || []).slice((old.history || []).length).forEach(h => {
        if (/^More evidence requested/.test(h.text)) {
          notifyUser(row.owner, 'x', 'red', 'More evidence required', next.title + ': ' + h.text.replace(/^More evidence requested:?\s*/, ''));
          audit(u.id, u.name, 'Evidence requested', next.title, h.text.replace(/^More evidence requested:?\s*/, ''));
        }
      });
      saveRec(row.id, next); out.push(toClient(getRec(row.id, 'achievements'))); return;
    }
    if (row.owner !== u.id) deny('That achievement belongs to someone else.');
    if (old.status === 'verified') {                           // verified items: only a request note can be added
      next = { ...old, history: appendOnly(old.history || [], rec.history) };
    } else {
      const c = achievementContent(rec); if (!c.title) deny('A title is needed.');
      next = { ...old, ...c, history: appendOnly(old.history || [], rec.history) };
      if (!['draft', 'pending'].includes(rec.status)) deny('You cannot set that status.');
      next.status = rec.status;
      if (old.flag && !old.flag.reply && rec.flag && typeof rec.flag.reply === 'string' && rec.flag.reply.trim()) {
        next.flag = { ...old.flag, reply: clip(rec.flag.reply, 1500), replyDate: todayISO() };
        const q = listByRef('adminQueue', row.id)[0];
        if (q) { const qd = JSON.parse(q.data); qd.status = 'pending'; qd.explanation = next.flag.reply; saveRec(q.id, qd); }
        notifyRole('Admin', 'bell', 'grey', 'Student explained a flagged item', u.name + ' replied about ' + next.title + '.');
        audit(u.id, u.name, 'Explained', next.title, 'Student replied to a staff question');
      }
      saveRec(row.id, next);
      const becamePending = next.status === 'pending' && (old.status !== 'pending' || old.verifier !== next.verifier);
      if (becamePending) { ctx.owner = u.id; submitted(ctx, row.id, next, old.status === 'rejected'); }
      out.push(toClient(getRec(row.id, 'achievements'))); return;
    }
    saveRec(row.id, next); out.push(toClient(getRec(row.id, 'achievements')));
  });
  return out;
};

/* ----- documents (the files themselves are uploaded separately and checked there) ----- */
H.documents = (ctx, ch) => {
  const u = ctx.user, out = [];
  (ch.deletes || []).forEach(id => {
    const row = getRec(id, 'documents'); if (!row) return; const d = JSON.parse(row.data);
    if (u.role === 'Admin') { delRec(row.id); return; }
    if (row.owner !== u.id || d.status !== 'pending') deny('Only your own pending documents can be removed.');
    if (d.id) { db.prepare('DELETE FROM files WHERE id = ? AND owner = ?').run(d.id, u.id); require('fs').rm(require('path').join(require('./db').DATA_DIR, 'files', d.id), () => {}); }
    delRec(row.id);
  });
  (ch.upserts || []).forEach(rec => {
    if (!rec._id) {
      if (u.role !== 'Student' && u.role !== 'Alumni') deny('Only students and alumni upload documents.');
      const f = db.prepare('SELECT * FROM files WHERE id = ? AND owner = ?').get(String(rec.id || ''), u.id);
      if (!f) deny('That file was not uploaded by you.');
      if (listRecs('documents', u.id).some(r => JSON.parse(r.data).id === f.id)) { out.push(null); return; }
      const data = { id: f.id, name: f.name, linked: clip(rec.linked, 200) || 'Not linked', type: f.mime === 'application/pdf' ? 'PDF' : f.mime === 'image/png' ? 'PNG' : 'JPG',
        date: todayISO(), status: 'pending', size: f.size > 1048576 ? (f.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(f.size / 1024)) + ' KB' };
      const id = insertRec('documents', u.id, null, data);
      notifyRole('Admin', 'doc', 'amber', 'Document uploaded', u.name + ' uploaded ' + f.name + ' for ' + data.linked + '.');
      audit(u.id, u.name, 'Created', f.name, 'Uploaded for ' + data.linked);
      out.push(toClient(getRec(id, 'documents'))); return;
    }
    const row = getRec(rec._id, 'documents'); if (!row) deny('That document no longer exists.');
    if (u.role !== 'Admin') deny('Documents cannot be edited.');
    const d = JSON.parse(row.data);
    if (['pending', 'verified', 'rejected'].includes(rec.status)) d.status = rec.status;
    saveRec(row.id, d); out.push(toClient(getRec(row.id, 'documents')));
  });
  return out;
};

/* ----- letter requests ----- */
H.lecturerRequests = (ctx, ch) => {
  const u = ctx.user, out = [], t = todayISO();
  if ((ch.deletes || []).length) deny('Requests cannot be deleted.');
  (ch.upserts || []).forEach(rec => {
    if (!rec._id) {
      if (u.role !== 'Student' && u.role !== 'Alumni') deny('Only students and alumni request letters.');
      const official = OFFICIAL.includes(rec.type);
      if (!official && !LETTER_TYPES.includes(rec.type)) deny('Unknown letter type.');
      if (!isISO(rec.deadline) || rec.deadline < t) deny('The deadline must be today or later.');
      const purpose = clip(rec.purpose, 200).trim(); if (!purpose) deny('Say what the letter is for.');
      let lec = null, ids = [];
      if (!official) {
        lec = db.prepare("SELECT * FROM users WHERE id = ? AND role IN ('Lecturer', 'Supervisor') AND status = 'active'").get(String(rec.lecturerId || ''));
        if (!lec) deny('Choose a lecturer or supervisor.');
        const mapped = (rec.achievementIds || []).map(x => (ctx.idMap[x] != null ? ctx.idMap[x] : x));
        ids = [...new Set(mapped)].slice(0, 50);
        if (!ids.length) deny('Choose at least one achievement.');
        ids.forEach(a => { const r = getRec(a, 'achievements'); if (!r || r.owner !== u.id || JSON.parse(r.data).status !== 'verified') deny('Only your verified achievements can be shared.'); });
      }
      const data = { letterId: '', student: u.name, sid: u.student_id || '', lecturerId: lec ? lec.id : null, lecturer: lec ? lec.name : 'Academic Records Office', official,
        type: rec.type, deadline: rec.deadline, status: 'sent', purpose, keyPoints: clip(rec.keyPoints, 1000), tailoring: clip(rec.tailoring, 80), achievementIds: ids };
      const id = insertRec('lecturerRequests', u.id, lec ? lec.id : null, data); data.letterId = 'L' + id; saveRec(id, data, lec ? lec.id : null);
      if (lec) {
        // the lecturer or supervisor may see only the chosen achievements, until the deadline
        const g = listByRef('access', lec.id).find(r => r.owner === u.id);
        if (!g) insertRec('access', u.id, lec.id, { lecturerId: lec.id, name: lec.name, initials: initialsOf(lec.name), dept: lec.dept || '', sections: ['Selected achievements'],
          purpose: rec.type + ' letter', expiresISO: rec.deadline, expires: fmtDate(rec.deadline) });
        else { const gd = JSON.parse(g.data); if (gd.expiresISO < rec.deadline) { gd.expiresISO = rec.deadline; gd.expires = fmtDate(rec.deadline); saveRec(g.id, gd, lec.id); } }
        notifyUser(lec.id, 'inbox', 'amber', 'New letter request', u.name + ' asked for a ' + rec.type.toLowerCase() + ' letter (due ' + fmtDate(rec.deadline) + ').');
      } else notifyRole('Admin', 'inbox', 'amber', 'Official letter requested', u.name + ' asked for an ' + rec.type.toLowerCase() + ' for ' + purpose + '.');
      notifyUser(u.id, 'check', 'green', 'Letter request sent', 'Your ' + rec.type.toLowerCase() + ' request was sent' + (lec ? ' to ' + lec.name + '.' : ' to the Records Office.'));
      audit(u.id, u.name, 'Created', rec.type + ' letter request', purpose);
      out.push(toClient(getRec(id, 'lecturerRequests'))); return;
    }
    const row = getRec(String(rec._id), 'lecturerRequests'); if (!row) deny('That request no longer exists.');
    const old = JSON.parse(row.data);
    if (row.owner === u.id) {                                   // the student may only ask for a revision
      if (rec.revisionAt && isISO(rec.revisionAt) && rec.revisionAt !== old.revisionAt) {
        old.revisionAt = rec.revisionAt; saveRec(row.id, old, row.ref);
        notifyUser(old.lecturerId, 'inbox', 'amber', 'Revision requested', u.name + ' asked for changes to the ' + old.type.toLowerCase() + ' letter.');
        audit(u.id, u.name, 'Revision requested', old.type + ' letter', 'Requested by ' + u.name);
      }
      out.push(toClient(getRec(row.id, 'lecturerRequests'))); return;
    }
    if ((u.role !== 'Lecturer' && u.role !== 'Supervisor') || row.ref !== u.id) deny('That request is not assigned to you.');
    const MOVES = { sent: ['accepted', 'declined'], accepted: ['progress', 'completed', 'declined'], progress: ['completed', 'declined'] };
    if (rec.status && rec.status !== old.status) {
      if (!(MOVES[old.status] || []).includes(rec.status)) deny('That status change is not allowed.');
      old.status = rec.status; saveRec(row.id, old, row.ref);
      const stu = old.type.toLowerCase();
      if (rec.status === 'accepted') notifyUser(row.owner, 'check', 'green', 'Letter request accepted', u.name + ' accepted your ' + stu + ' letter request.');
      if (rec.status === 'declined') notifyUser(row.owner, 'x', 'red', 'Letter request declined', u.name + ' could not take your ' + stu + ' letter request.');
      if (rec.status === 'completed') notifyUser(row.owner, 'check', 'green', 'Letter completed', 'Your ' + stu + ' letter from ' + u.name + ' is ready.');
      audit(u.id, u.name, STATUS_LABEL[rec.status], old.type + ' letter', old.student);
    }
    out.push(toClient(getRec(row.id, 'lecturerRequests')));
  });
  return out;
};

/* ----- who may see my profile ----- */
H.access = (ctx, ch) => {
  const u = ctx.user, out = [], t = todayISO();
  (ch.deletes || []).forEach(id => {
    const row = getRec(id, 'access'); if (!row) return;
    if (row.owner !== u.id) deny('That is not your access list.');
    const d = JSON.parse(row.data); delRec(row.id);
    notifyUser(d.lecturerId, 'bell', 'grey', 'Profile access ended', u.name + ' ended your access to their profile.');
    audit(u.id, u.name, 'Access revoked', d.name, 'Revoked by ' + u.name);
  });
  (ch.upserts || []).forEach(rec => {
    const lec = db.prepare("SELECT * FROM users WHERE id = ? AND role IN ('Lecturer', 'Supervisor') AND status = 'active'").get(String(rec.lecturerId || ''));
    if (!lec) deny('Choose a lecturer or supervisor.');
    const sections = [...new Set((rec.sections || []).filter(s => SECTIONS.includes(s)))];
    if (!sections.length) deny('Choose what the lecturer can see.');
    if (!isISO(rec.expiresISO) || rec.expiresISO < t) deny('The end date must be today or later.');
    const data = { lecturerId: lec.id, name: lec.name, initials: initialsOf(lec.name), dept: lec.dept || '', sections, purpose: clip(rec.purpose, 200), expiresISO: rec.expiresISO, expires: fmtDate(rec.expiresISO) };
    let row = rec._id ? getRec(rec._id, 'access') : null;
    if (row && row.owner !== u.id) deny('That is not your access list.');
    if (!row) row = listByRef('access', lec.id).find(r => r.owner === u.id) || null;   // one grant per lecturer
    let id;
    if (row) { id = row.id; saveRec(id, data, lec.id); audit(u.id, u.name, 'Access updated', lec.name, sections.join(', ') + ' until ' + fmtDate(data.expiresISO)); }
    else {
      id = insertRec('access', u.id, lec.id, data);
      notifyUser(lec.id, 'shield', 'green', 'Profile access granted', u.name + ' shared ' + sections.join(' and ').toLowerCase() + ' with you until ' + fmtDate(data.expiresISO) + '.');
      audit(u.id, u.name, 'Access granted', lec.name, sections.join(', ') + ' until ' + fmtDate(data.expiresISO));
    }
    out.push(toClient(getRec(id, 'access')));
  });
  return out;
};

H.accessLog = (ctx, ch) => {          // students may only add their own "You ..." lines; the server writes everyone else's
  const u = ctx.user, out = [];
  (ch.upserts || []).forEach(rec => {
    if (rec._id) { out.push(null); return; }
    const id = insertRec('accessLog', u.id, null, { ts: clip(rec.ts, 16), who: 'You', what: clip(rec.what, 120), sections: clip(rec.sections, 120) });
    out.push(toClient(getRec(id, 'accessLog')));
  });
  return out;
};

H.notifications = (ctx, ch) => {      // the only thing a person may change is "read / unread" on their own
  const out = [];
  (ch.upserts || []).forEach(rec => {
    const row = rec._id ? getRec(rec._id, 'notifications') : null;
    if (!row || row.owner !== ctx.user.id) { out.push(null); return; }
    const d = JSON.parse(row.data); d.unread = !!rec.unread && d.unread; saveRec(row.id, d);
    out.push(noteView(getRec(row.id, 'notifications')));
  });
  return out;
};

H.adminQueue = (ctx, ch) => {
  const u = ctx.user, out = [];
  if (u.role !== 'Admin') { (ch.upserts || []).forEach(() => out.push(null)); return out; }   // the server manages queue entries for students
  (ch.deletes || []).forEach(id => { const r = getRec(id, 'adminQueue'); if (r) delRec(r.id); });
  (ch.upserts || []).forEach(rec => {
    const row = rec._id ? getRec(rec._id, 'adminQueue') : null; if (!row) { out.push(null); return; }
    const d = JSON.parse(row.data);
    if (['pending', 'evidence', 'flagged'].includes(rec.status)) d.status = rec.status;
    if (rec.flagNote !== undefined) d.flagNote = clip(rec.flagNote, 500);
    saveRec(row.id, d, row.ref); out.push(toClient(getRec(row.id, 'adminQueue')));
  });
  return out;
};

/* ----- verified-record exports (the code is made here, so it cannot be invented by the page) ----- */
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode() { let s = ''; const b = crypto.randomBytes(8); for (let i = 0; i < 8; i++) s += CODE_CHARS[b[i] % CODE_CHARS.length]; return 'AU-VR-' + s; }
H.exports = (ctx, ch) => {
  const u = ctx.user, out = [];
  if ((ch.deletes || []).length) deny('Records cannot be deleted. Withdraw them instead.');
  (ch.upserts || []).forEach(rec => {
    if (!rec._id) {
      const t = todayISO(); let exp = isISO(rec.expiresISO) ? rec.expiresISO : addDays(t, 90);
      if (exp < t) exp = t; if (exp > addDays(t, 366)) exp = addDays(t, 366);
      const ver = listRecs('achievements', u.id).map(r => JSON.parse(r.data)).filter(a => a.status === 'verified').length;
      const data = { code: newCode(), issuedISO: t, expiresISO: exp, recipient: clip(rec.recipient, 120), includeAcademic: !!rec.includeAcademic, includeAch: !!rec.includeAch,
        revoked: false, student: u.name, sid: u.student_id || '', programme: u.programme || '', gpa: academicFor(u.student_id).gpa, verifiedCount: ver };
      const id = insertRec('exports', u.id, data.code, data);
      audit(u.id, u.name, 'Record exported', u.name + ' verified record', data.code + (data.recipient ? ' for ' + data.recipient : ''));
      out.push(toClient(getRec(id, 'exports'))); return;
    }
    const row = getRec(rec._id, 'exports'); if (!row || row.owner !== u.id) deny('That is not your record.');
    const d = JSON.parse(row.data);
    if (rec.revoked === true && !d.revoked) { d.revoked = true; saveRec(row.id, d, row.ref); audit(u.id, u.name, 'Record withdrawn', 'Verified record', d.code); }
    out.push(toClient(getRec(row.id, 'exports')));
  });
  return out;
};

H.drafts = (ctx, ch) => {
  const u = ctx.user, out = [];
  (ch.deletes || []).forEach(id => { const r = getRec(id, 'drafts'); if (r && r.owner === u.id) delRec(r.id); });
  (ch.upserts || []).forEach(rec => {
    const reqRow = getRec(String(rec.reqId || '').replace(/^R/, ''), 'lecturerRequests');
    if (!reqRow || reqRow.ref !== u.id) deny('That draft is not linked to one of your requests.');
    const data = { reqId: 'R' + reqRow.id, student: clip(rec.student, 120), sid: clip(rec.sid, 40), type: clip(rec.type, 60), purpose: clip(rec.purpose, 200), deadline: isoOrEmpty(rec.deadline), text: clip(rec.text, 20000), updated: todayISO() };
    const row = rec._id ? getRec(rec._id, 'drafts') : listByRef('drafts', 'R' + reqRow.id).find(r => r.owner === u.id);
    if (row && row.owner !== u.id) deny('That draft is not yours.');
    let id; if (row) { id = row.id; saveRec(id, data, data.reqId); audit(u.id, u.name, 'Edited', data.type + ' letter', 'Draft updated for ' + data.student); }
    else { id = insertRec('drafts', u.id, data.reqId, data); }
    out.push(toClient(getRec(id, 'drafts')));
  });
  return out;
};

/* ----- personal settings (skills, contact, who can see what, share link) ----- */
const SINGLES = {
  skills: (u, v) => { const list = (v && v[u.role]) || []; return Array.isArray(list) ? list.slice(0, 50).map(s => ({ name: clip(s && s.name, 60), type: s && s.type === 'Language' ? 'Language' : 'Technical' })).filter(s => s.name) : []; },
  contact: (u, v) => { const c = (v && v[u.role]) || {}; const bk = clip(c.backup, 120).trim(); if (bk && !/^\S+@\S+\.\S+$/.test(bk)) deny('Enter a valid backup email address.'); return { phone: clip(c.phone, 30), backup: bk }; },
  visibility: (u, v) => ({ 'Achievements': !!(v && v['Achievements']), 'Academic Record': !!(v && v['Academic Record']), 'Documents': !!(v && v['Documents']) }),
  shareLink: (u, v) => { if (!v) return null; const t = todayISO(); let e = isISO(v.expiresISO) ? v.expiresISO : addDays(t, 30); if (e > addDays(t, 90)) e = addDays(t, 90);
    const old = kvGet(u.id, 'shareLink', null); return { url: old && old.url ? old.url : 'https://portal.africau.edu/share/' + auth.randToken(16), expiresISO: e }; }
};

function applySync(user, changes) {
  const allowed = WRITABLE[user.role] || [];
  Object.keys(changes).forEach(k => { if (!allowed.includes(k)) deny('You cannot change ' + k + '.'); });
  return tx(() => {
    const ctx = { user, idMap: {}, owner: user.id }; const results = {}, singles = {};
    ['achievements', 'documents', 'lecturerRequests', 'access', 'accessLog', 'notifications', 'adminQueue', 'exports', 'drafts'].forEach(k => {
      if (changes[k]) results[k] = H[k](ctx, changes[k]);
    });
    ['skills', 'contact', 'visibility', 'shareLink'].forEach(k => {
      if (changes[k] !== undefined) {
        const val = SINGLES[k](user, changes[k].doc);
        kvSet(user.id, k, val); singles[k] = k === 'skills' || k === 'contact' ? { [user.role]: val } : val;
      }
    });
    return { idMap: ctx.idMap, results, singles };
  });
}

module.exports = { buildData, userView, applySync, academicFor, kvGet, kvSet, listRecs, listByRef, getRec, saveRec, insertRec, delRec, toClient, notifyUser, notifyRole, userById, premiumFor,
  todayISO, addDays, fmtDate, isoOf, relTime, initialsOf, clip, isISO, Forbidden, Invalid, deny, VERIFIER_PEOPLE, TIERS, GRADE_POINTS, CATEGORIES, DEFAULT_VIS, submitted, achievementContent, SECTIONS };
