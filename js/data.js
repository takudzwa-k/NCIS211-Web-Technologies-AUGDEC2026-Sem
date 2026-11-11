/* Data layer.
   The server decides what the signed-in person may see and checks every change before saving it.
   This file loads that data when a page opens, and sends changes back when a page calls saveState(). */

const IS_PUBLIC = /\/(index|verify|mailbox|email-approval|reset-password|verify-email)\.html$/.test(location.pathname) || location.pathname === '/';
let CURRENT_ROLE = 'Student';
let CSRF = '';

const DATA = {
  /* lists the pages share */
  categories: ['Academic Awards', 'Dean’s List', 'Scholarships & Bursaries', 'Conferences & Seminars', 'Certifications',
               'Clubs & Societies', 'Sports', 'Debate & Public Speaking', 'Leadership', 'Volunteering', 'Professional Experience', 'Pre-University'],
  verifiers: ['Academic Records Office', 'Lecturer', 'Department head', 'Sports Director', 'Chaplaincy', 'Attachment supervisor'],
  officialLetters: ['Attachment letter', 'Admission letter'],
  letterTypes: ['Recommendation', 'Reference', 'Scholarship support', 'Employment support', 'Character reference', 'Attachment assessment', 'Industrial Attachment Evaluation'],
  evidenceRequired: ['Academic Awards', 'Scholarships & Bursaries', 'Certifications', 'Conferences & Seminars'],
  rolePermissions: {
    Student:    { summary: 'Manage own record',       items: ['Add and edit own achievements while they are pending', 'Upload supporting evidence', 'View own academic record (read-only)', 'Request letters from lecturers and supervisors', 'Choose who can see their profile'] },
    Lecturer:   { summary: 'View shared profiles',    items: ['View profiles that students have shared', 'Accept or decline letter requests', 'Add and verify academic achievements for students', 'Prepare and export letter summaries'] },
    Supervisor: { summary: 'Supervise attached students', items: ['View assigned or shared attached students', 'Assess and endorse industrial attachment performance', 'Complete attachment evaluation letters and reports', 'Verify workplace achievements and technical contributions'] },
    Admin:      { summary: 'Verify and manage',       items: ['Verify or reject submitted achievements', 'Manage users and roles', 'Import official academic data', 'View the audit log'] }
  },
  /* filled in from the server */
  user: { name: '', initials: '', email: '', programme: '', faculty: '', studentId: '', badge: '', subtitle: '', entry: '', status: '', phone: '', portal: '' },
  academic: { gpa: '—', class: '', credits: 0, totalCredits: 360, lastUpdated: '', semesters: [], courses: [] },
  achievements: [], documents: [], lecturerRequests: [], letters: [], access: [], accessLog: [], notifications: [], adminQueue: [], exports: [], drafts: [],
  sharedStudents: [], users: [], imports: [], audit: [], lecturers: [], activity: [], stats: {},
  skills: {}, contact: {}, visibility: { 'Achievements': true, 'Academic Record': true, 'Documents': false }, shareLink: null
};

/* ---------- talking to the server ---------- */
function api(method, url, body) {                        // synchronous, so pages can use the data straight away
  const x = new XMLHttpRequest();
  x.open(method, url, false);
  if (body !== undefined) x.setRequestHeader('Content-Type', 'application/json');
  if (CSRF) x.setRequestHeader('X-CSRF-Token', CSRF);
  x.send(body !== undefined ? JSON.stringify(body) : null);
  let json = null; try { json = JSON.parse(x.responseText); } catch (e) {}
  return { status: x.status, json: json };
}
function apiAsync(method, url, body) {                   // for buttons that wait for an answer
  const opts = { method: method, headers: { 'X-CSRF-Token': CSRF }, credentials: 'same-origin' };
  if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  return fetch(url, opts).then(r => r.json().catch(() => ({})).then(j => ({ status: r.status, json: j })));
}

const SYNC_ARRAYS = ['achievements', 'documents', 'lecturerRequests', 'access', 'accessLog', 'notifications', 'adminQueue', 'exports', 'drafts'];
const SYNC_SINGLES = ['skills', 'contact', 'visibility', 'shareLink'];
let BASELINE = {};
function snapshot() {
  const s = {};
  SYNC_ARRAYS.forEach(k => { const m = {}; (DATA[k] || []).forEach(r => { if (r._id != null) m[r._id] = JSON.stringify(r); }); s[k] = m; });
  SYNC_SINGLES.forEach(k => { s[k] = JSON.stringify(DATA[k]); });
  return s;
}

(function boot() {
  if (IS_PUBLIC) return;
  const r = api('GET', '/api/bootstrap');
  if (r.status === 401 || !r.json || !r.json.user) { window.location.replace('/index.html' + (r.status === 401 ? '?expired=1' : '')); return; }
  CSRF = r.json.csrf; CURRENT_ROLE = r.json.user.role; DATA.dev = r.json.dev;
  DATA.user = r.json.user;
  Object.keys(r.json.data).forEach(k => { DATA[k] = r.json.data[k]; });
  BASELINE = snapshot();
})();

/* Send whatever changed since the last save. The server checks each change against the person's role. */
function saveState() {
  if (IS_PUBLIC || !CSRF) return true;
  const changes = {}, sent = {};
  SYNC_ARRAYS.forEach(k => {
    const arr = DATA[k] || [], ups = [], seen = new Set();
    arr.forEach(r => {
      if (r._id != null) { seen.add(String(r._id)); if (BASELINE[k][r._id] !== JSON.stringify(r)) ups.push(r); }
      else ups.push(r);
    });
    const dels = Object.keys(BASELINE[k]).filter(id => !seen.has(id)).map(Number);
    if (ups.length || dels.length) { changes[k] = { upserts: ups, deletes: dels }; sent[k] = ups; }
  });
  SYNC_SINGLES.forEach(k => { if (JSON.stringify(DATA[k]) !== BASELINE[k]) changes[k] = { doc: DATA[k] }; });
  if (!Object.keys(changes).length) return true;

  const r = api('POST', '/api/sync', { changes: changes });
  if (r.status === 401) { window.location.replace('/index.html?expired=1'); return false; }
  if (r.status !== 200 || !r.json) {
    const msg = (r.json && r.json.error) || 'That change could not be saved.';
    if (typeof toast === 'function') toast(msg);
    setTimeout(() => window.location.reload(), 1800);    // show the real state again
    return false;
  }
  const out = r.json;
  SYNC_ARRAYS.forEach(k => {
    if (!sent[k]) return;
    const res = out.results[k] || [];
    sent[k].forEach((rec, i) => {
      const canon = res[i];
      if (!canon) { const at = DATA[k].indexOf(rec); if (at > -1) DATA[k].splice(at, 1); return; }
      Object.keys(rec).forEach(key => delete rec[key]); Object.assign(rec, canon);
    });
  });
  const map = out.idMap || {};                           // temporary ids the page made up -> real ids
  ['achievements', 'adminQueue', 'lecturerRequests'].forEach(k => (DATA[k] || []).forEach(rec => {
    if (map[rec.achId] != null) rec.achId = map[rec.achId];
    if (Array.isArray(rec.achievementIds)) rec.achievementIds = rec.achievementIds.map(x => (map[x] != null ? map[x] : x));
  }));
  Object.keys(out.singles || {}).forEach(k => { DATA[k] = out.singles[k]; });
  BASELINE = snapshot();
  return true;
}
