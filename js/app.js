/* Shared code: icons, sidebar, top bar, toast, modal, helpers */

const ICONS = {
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  doc: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  cap: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  sliders: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  circleCheck: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  fileDown: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
  back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  menu: '<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>'
};

function icon(name, size = 20) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

/* ---------- storage (safe wrappers) ---------- */
function store(key, val) {
  try { if (val === undefined) return sessionStorage.getItem(key); sessionStorage.setItem(key, val); } catch (e) { return null; }
}
function notificationsRead() { return store('au_read') === '1'; }

/* ---------- shared helpers used across roles ---------- */
function pad2(n) { return String(n).padStart(2, '0'); }
function todayISO() { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function addDays(iso, n) { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function nextId(list) { return list.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1; }
function initialsOf(name) { return name.replace(/^(Dr\.|Prof\.)\s*/i, '').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(); }

/* tell another role something happened (shows in their Notifications) */
function notify(to, ic, tone, title, desc) {
  DATA.notifications.unshift({ icon: ic, tone: tone, title: title, desc: desc, time: 'Just now', unread: true, isNew: true, to: to });
  saveState();
}
/* record an action in the audit log */
function logAudit(action, item, details, asUser) {
  const d = new Date();
  DATA.audit.unshift({ ts: todayISO() + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()), user: asUser || DATA.user.name, action: action, item: item, details: details });
  saveState();
}

/* ---------- approval emails for staff who verify by link ---------- */
const VERIFIER_PEOPLE = {
  'Lecturer': 'Dr. N. Dube',
  'Department head': 'Prof. A. Mutasa (Head of Department)',
  'Sports Director': 'Mr. K. Banda (Sports Director)',
  'Chaplaincy': 'Rev. P. Zimba (Chaplain)',
  'Attachment supervisor': 'Mrs. R. Phiri (Industrial supervisor)'
};
function randToken(n) { const c = 'abcdefghijklmnopqrstuvwxyz0123456789'; let t = ''; for (let i = 0; i < n; i++) t += c[Math.floor(Math.random() * c.length)]; return t; }
function sendApprovalEmail(a, q) {
  const to = VERIFIER_PEOPLE[a.verifier];
  if (!to) return null;                                            // Records Office works from the queue
  DATA.emails.forEach(e => { if (e.achId === a.id && e.status === 'open') e.status = 'replaced'; });
  const e = { id: 'E' + Date.now(), token: randToken(24), kind: 'approval', to: to, subject: 'Please confirm an achievement for ' + q.student,
    student: q.student, sid: q.sid, title: a.title, category: a.category, date: a.date, description: a.description, files: a.files.slice(),
    queueId: q.id, achId: a.id, sentISO: todayISO(), expiresISO: addDays(todayISO(), 7), status: 'open' };
  DATA.emails.unshift(e); saveState();
  return e;
}
function mailLink(e) { return location.href.replace(/[^/]*(\?.*)?$/, '') + 'email-approval.html?t=' + e.token; }
function notifForRole(n) { return !n.to || n.to.indexOf(CURRENT_ROLE) > -1; }
function notifUnread(n) { return n.isNew ? n.unread : (n.unread && !notificationsRead()); }
function notifBadge() {
  const base = notificationsRead() ? 0 : DATA.unreadBadge;
  return base + DATA.notifications.filter(n => n.isNew && n.unread && notifForRole(n)).length;
}
function lecturerName() { return DATA.lecturers[0].name; }

/* ---------- helpers ---------- */
function fmtDate(iso, pad) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: pad ? '2-digit' : 'numeric', month: 'short', year: 'numeric' });
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function pill(status, label) {
  const text = label || status.charAt(0).toUpperCase() + status.slice(1);
  return `<span class="pill ${status}">${text}</span>`;
}

function toast(msg) {
  const root = document.getElementById('toast-root');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  root.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

function openModal({ title, body, actions, wide }) {
  const o = document.createElement('div');
  o.className = 'overlay';
  o.innerHTML = `<div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true"><h3>${title}</h3><div class="m-body">${body}</div><div class="m-actions"></div></div>`;
  const bar = o.querySelector('.m-actions');
  const close = () => { o.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  (actions || [{ label: 'Close', secondary: true }]).forEach(a => {
    const b = document.createElement('button');
    b.className = 'btn small' + (a.secondary ? ' secondary' : '') + (a.danger ? ' danger' : '');
    b.textContent = a.label;
    // onClick runs while the form is still on screen; return false to keep the popup open
    b.onclick = () => { const keepOpen = a.onClick ? a.onClick(o) === false : false; if (!keepOpen) close(); };
    bar.appendChild(b);
  });
  o.addEventListener('click', e => { if (e.target === o) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(o);
  o.close = close;
  return o;
}

/* ---------- uploaded files (kept in the browser so they can be previewed and downloaded) ---------- */
const fileStore = {
  db: null,
  open() {
    return new Promise((resolve, reject) => {
      if (this.db) return resolve(this.db);
      try {
        const r = indexedDB.open('au_files', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('files');
        r.onsuccess = () => { this.db = r.result; resolve(this.db); };
        r.onerror = () => reject(r.error);
      } catch (e) { reject(e); }
    });
  },
  run(mode, fn) {
    return this.open().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction('files', mode); const req = fn(tx.objectStore('files'));
      tx.oncomplete = () => resolve(req && req.result);
      tx.onerror = tx.onabort = () => reject(tx.error);
    })).catch(() => null);
  },
  put(id, blob) { return this.run('readwrite', st => st.put(blob, id)); },
  get(id)       { return this.run('readonly',  st => st.get(id)); },
  del(id)       { return this.run('readwrite', st => st.delete(id)); }
};

function fileSize(bytes) { return bytes > 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB'; }
function fileExt(name) { return name.split('.').pop().toUpperCase().replace('JPEG', 'JPG'); }

function downloadDoc(d) {
  if (!d.id) { toast('This is a sample document from the demo data, so there is no file to download.'); return; }
  fileStore.get(d.id).then(blob => {
    if (!blob) { toast('That file is no longer stored in this browser.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = d.name; document.body.appendChild(a); a.click(); a.remove();
  });
}

function previewDoc(d) {
  const sample = () => openModal({ title: esc(d.name), body: 'This is a sample document from the demo data, so there is no file to show. Files you upload yourself can be previewed here.' });
  if (!d.id) { sample(); return; }
  fileStore.get(d.id).then(blob => {
    if (!blob) { sample(); return; }
    const url = URL.createObjectURL(blob);
    const body = /^image\//.test(blob.type)
      ? `<img src="${url}" alt="${esc(d.name)}" style="max-width:100%;max-height:60vh;display:block;margin:0 auto;border-radius:8px">`
      : `<iframe src="${url}" title="${esc(d.name)}" style="width:100%;height:60vh;border:1px solid var(--border);border-radius:8px"></iframe>`;
    openModal({ wide: true, title: esc(d.name), body: body,
      actions: [{ label: 'Close', secondary: true }, { label: 'Download', onClick: () => { downloadDoc(d); return false; } }] });
  });
}

/* The upload dialog: drop or choose files, see each one, choose what they are for, upload. */
function openUploadDialog(opts) {
  opts = opts || {};
  const items = [];
  const achOptions = DATA.achievements.map(a => `<option value="${a.id}">${esc(a.title)}</option>`).join('');
  const o = openModal({
    wide: true,
    title: 'Upload document',
    body: `
      <div class="fld" id="up-g-link"><label for="up-link">This document is for</label>
        <select id="up-link"><option value="">Choose what this document is for</option>
          <option value="__transcript">Official transcript</option>
          <optgroup label="My achievements">${achOptions}</optgroup></select>
        <div class="msg">Choose what this document is for.</div></div>
      <div class="dropzone" id="up-drop" tabindex="0" role="button" aria-label="Choose files to upload">
        <div>${icon('upload', 26)}</div><strong>Drop files here or click to choose</strong>PDF, JPG or PNG, up to 5 MB each</div>
      <input type="file" id="up-input" multiple accept=".pdf,.jpg,.jpeg,.png" style="display:none">
      <div class="up-list" id="up-list"></div>`,
    actions: [
      { label: 'Cancel', secondary: true },
      { label: 'Upload', onClick: () => { finish(); return false; } }
    ]
  });
  const q = sel => o.querySelector(sel);
  const upBtn = o.querySelectorAll('.m-actions button')[1];
  if (opts.preset) q('#up-link').value = opts.preset;

  function refresh() {
    upBtn.disabled = !items.length || items.some(i => !i.done);
    upBtn.textContent = items.length ? 'Upload ' + items.length + ' file' + (items.length > 1 ? 's' : '') : 'Upload';
  }
  function addFiles(list) {
    [...list].forEach(f => {
      if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) { toast(f.name + ' is not a PDF, JPG or PNG.'); return; }
      if (f.size > 5 * 1024 * 1024) { toast(f.name + ' is larger than 5 MB.'); return; }
      if (items.some(i => i.file.name === f.name && i.file.size === f.size)) { toast(f.name + ' is already in the list.'); return; }
      const it = { file: f, done: false, pct: 0 };
      const isImg = /^image\//.test(f.type);
      it.el = document.createElement('div'); it.el.className = 'up-row';
      it.el.innerHTML = `<div class="up-thumb">${isImg ? '<img alt="">' : icon('doc', 22)}</div>
        <div class="up-meta"><strong>${esc(f.name)}</strong><span class="up-state">${fileSize(f.size)} · Uploading…</span>
          <div class="up-bar"><i style="width:0%"></i></div></div>
        <button type="button" class="icon-btn" aria-label="Remove ${esc(f.name)}">${icon('x', 16)}</button>`;
      if (isImg) { it.url = URL.createObjectURL(f); it.el.querySelector('img').src = it.url; }
      it.el.querySelector('button').onclick = () => { clearInterval(it.timer); items.splice(items.indexOf(it), 1); it.el.remove(); refresh(); };
      it.timer = setInterval(() => {
        it.pct = Math.min(100, it.pct + 12 + Math.random() * 22);
        it.el.querySelector('.up-bar i').style.width = it.pct + '%';
        if (it.pct >= 100) { clearInterval(it.timer); it.done = true; it.el.querySelector('.up-state').textContent = fileSize(f.size) + ' · Ready'; it.el.classList.add('ready'); refresh(); }
      }, 110);
      items.push(it); q('#up-list').appendChild(it.el);
    });
    refresh();
  }
  const drop = q('#up-drop'), input = q('#up-input');
  drop.onclick = () => input.click();
  drop.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } };
  input.onchange = () => { addFiles(input.files); input.value = ''; };
  ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));
  refresh();

  function finish() {
    const link = q('#up-link').value;
    q('#up-g-link').classList.toggle('err', !link);
    if (!link) { toast('Choose what this document is for.'); return; }
    upBtn.disabled = true; upBtn.textContent = 'Uploading…';
    const ach = link === '__transcript' ? null : DATA.achievements.find(a => a.id === +link);
    const linked = ach ? ach.title : 'Official transcript';
    const puts = [], stamp = Date.now(); let added = 0;
    items.forEach((it, i) => {
      if (DATA.documents.some(d => d.name === it.file.name && d.linked === linked)) return;
      const id = 'F' + stamp + '_' + i;
      DATA.documents.push({ id: id, name: it.file.name, linked: linked, type: fileExt(it.file.name), date: todayISO(), status: 'pending', size: fileSize(it.file.size) });
      puts.push(fileStore.put(id, it.file)); added++;
      if (ach && ach.files.indexOf(it.file.name) === -1) {
        ach.files.push(it.file.name);
        ach.history.push({ when: todayISO(), text: 'Evidence added: ' + it.file.name });
      }
    });
    Promise.all(puts).then(() => {
      if (added) {
        notify(['Admin'], 'doc', 'amber', 'Document uploaded', DATA.user.name + ' uploaded ' + added + ' document' + (added > 1 ? 's' : '') + ' for ' + linked + '.');
        logAudit('Created', added + ' document' + (added > 1 ? 's' : ''), 'Uploaded for ' + linked);
      }
      saveState(); o.close();
      toast(added ? added + ' document' + (added > 1 ? 's' : '') + ' uploaded. Staff will review ' + (added > 1 ? 'them' : 'it') + '.' : 'Those files were already uploaded.');
      if (opts.onDone) opts.onDone();
    });
  }
  return o;
}

/* ---------- shell: sidebar + top bar ---------- */
const NAV_STUDENT = [
  { group: 'Overview', items: [
    { key: 'profile',      label: 'My Profile',       icon: 'user',   href: 'profile.html' },
    { key: 'achievements', label: 'Achievements',     icon: 'award',  href: 'achievements.html' },
    { key: 'academic',     label: 'Academic Record',  icon: 'book',   href: 'academic-record.html' },
    { key: 'documents',    label: 'Documents',        icon: 'doc',    href: 'documents.html' }
  ]},
  { group: 'Support', items: [
    { key: 'letters',      label: 'Letter Requests',  icon: 'inbox',  href: 'letter-requests.html' },
    { key: 'sharing',      label: 'Sharing & Privacy', icon: 'shield', href: 'sharing.html' },
    { key: 'notifications', label: 'Notifications',   icon: 'bell',   href: 'notifications.html', badge: true }
  ]}
];

const NAV_LECTURER = [
  { group: 'Workspace', items: [
    { key: 'find',          label: 'Find Students',   icon: 'search', href: 'find-students.html' },
    { key: 'lecturerLetters', label: 'Letter Requests', icon: 'inbox', href: 'lecturer-letters.html' },
    { key: 'drafts',        label: 'Drafts',          icon: 'doc',    href: 'drafts.html' },
    { key: 'notifications', label: 'Notifications',   icon: 'bell',   href: 'notifications.html', badge: true }
  ]}
];

const NAV_ADMIN = [
  { group: 'Administration', items: [
    { key: 'queue',   label: 'Verification Queue',    icon: 'clipboard', href: 'verification-queue.html' },
    { key: 'users',   label: 'Users & Permissions',   icon: 'users',     href: 'users.html' },
    { key: 'import',  label: 'Academic Data Import',  icon: 'upload',    href: 'data-import.html' }
  ]},
  { group: 'Monitoring', items: [
    { key: 'audit',   label: 'Audit Log',             icon: 'history',   href: 'audit-log.html' },
    { key: 'reports', label: 'Reports',               icon: 'activity',  href: 'reports.html' },
    { key: 'notifications', label: 'Notifications',   icon: 'bell',      href: 'notifications.html', badge: true }
  ]}
];

const NAV = CURRENT_ROLE === 'Lecturer' ? NAV_LECTURER : CURRENT_ROLE === 'Admin' ? NAV_ADMIN : NAV_STUDENT;
const ROLE_HOME = { Student: 'profile.html', Alumni: 'profile.html', Lecturer: 'find-students.html', Admin: 'verification-queue.html' };

function buildShell() {
  if (!document.getElementById('sidebar')) return;   // standalone pages have no portal shell
  const page = document.body.dataset.page;
  // if this page belongs to a different role's portal, go to this role's home page
  const allKeys = NAV.reduce((acc, g) => acc.concat(g.items.map(i => i.key)), []);
  if (allKeys.indexOf(page) === -1) { window.location.replace(ROLE_HOME[CURRENT_ROLE]); return; }
  const u = DATA.user;
  const badge = notifBadge();

  document.getElementById('sidebar').innerHTML = `
    <div class="brand">
      <div class="brand-mark">${icon('cap', 20)}</div>
      <div class="brand-name">AU Student Achievement &amp; Recommendation Profile</div>
    </div>
    <div class="portal-label">${u.portal}</div>
    <nav class="nav">
      ${NAV.map(g => `
        <div class="nav-group">${g.group}</div>
        ${g.items.map(i => `
          <a href="${i.href}" class="${i.key === page ? 'active' : ''}">
            ${icon(i.icon, 22)}<span>${i.label}</span>
            ${i.badge && badge ? `<span class="badge" id="nav-badge">${badge}</span>` : ''}
          </a>`).join('')}
      `).join('')}
    </nav>
    <div class="sidebar-note">
      ${icon('shield', 18)}
      <div><strong>Verified records</strong><span>Your information is securely managed by the university.</span></div>
    </div>`;

  document.getElementById('topbar').innerHTML = `
    <button class="menu-btn" id="menu-btn" aria-label="Open menu">${icon('menu', 20)}</button>
    <div class="search">
      ${icon('search', 18)}
      <input id="global-search" type="text" placeholder="Search records, students or requests..." aria-label="Search">
      <kbd>Ctrl K</kbd>
    </div>
    <div class="topbar-right">
      <a href="notifications.html" class="bell" aria-label="Notifications">
        ${icon('bell', 22)}${badge ? '<span class="dot" id="bell-dot"></span>' : ''}
      </a>
      <div class="user-wrap">
        <button class="user-btn" id="user-btn" aria-haspopup="true">
          <div class="avatar">${u.initials}</div>
          <div class="user-info"><strong>${u.name}</strong><span>${u.subtitle}</span></div>
          ${icon('down', 18)}
        </button>
        <div class="menu" id="user-menu">
          <div class="menu-label">Switch prototype view</div>
          ${['Student', 'Alumni', 'Lecturer', 'Admin'].map(r => `
            <button data-role="${r}" class="${r === CURRENT_ROLE ? 'current' : ''}">${r}${r === CURRENT_ROLE ? icon('check', 18) : ''}</button>`).join('')}
          <hr>
          <button id="open-mailbox">Demo mailbox</button>
          <button id="reset-demo">Reset demo data</button>
          <button class="signout" id="signout">Sign out</button>
        </div>
      </div>
    </div>`;

  // menu behaviour
  const menu = document.getElementById('user-menu');
  document.getElementById('user-btn').onclick = e => { e.stopPropagation(); menu.classList.toggle('open'); };
  document.addEventListener('click', e => { if (!menu.contains(e.target)) menu.classList.remove('open'); });
  menu.querySelectorAll('[data-role]').forEach(b => b.onclick = () => {
    menu.classList.remove('open');
    const r = b.dataset.role;
    if (r === CURRENT_ROLE) return;
    store('au_role', r);
    window.location.href = ROLE_HOME[r];
  });
  document.getElementById('open-mailbox').onclick = () => { window.location.href = 'mailbox.html'; };
  document.getElementById('reset-demo').onclick = () => {
    try { sessionStorage.removeItem('au_state'); sessionStorage.removeItem('au_read'); indexedDB.deleteDatabase('au_files'); } catch (e) {}
    window.location.reload();
  };
  document.getElementById('signout').onclick = () => { window.location.href = '../index.html'; };

  // mobile sidebar
  const sb = document.getElementById('sidebar');
  document.getElementById('menu-btn').onclick = e => { e.stopPropagation(); sb.classList.toggle('open'); };
  document.addEventListener('click', e => { if (!sb.contains(e.target)) sb.classList.remove('open'); });

  // Ctrl/Cmd + K focuses search
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('global-search').focus(); }
  });
}

function flash(msg) { store('au_flash', msg); }
document.addEventListener('DOMContentLoaded', () => {
  buildShell();
  const f = store('au_flash');
  if (f) { try { sessionStorage.removeItem('au_flash'); } catch (e) {} toast(f); }
});
