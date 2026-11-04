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
  const page = document.body.dataset.page;
  // if this page belongs to a different role's portal, go to this role's home page
  const allKeys = NAV.reduce((acc, g) => acc.concat(g.items.map(i => i.key)), []);
  if (allKeys.indexOf(page) === -1) { window.location.replace(ROLE_HOME[CURRENT_ROLE]); return; }
  const u = DATA.user;
  const badge = notificationsRead() ? 0 : DATA.unreadBadge;

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

document.addEventListener('DOMContentLoaded', buildShell);
