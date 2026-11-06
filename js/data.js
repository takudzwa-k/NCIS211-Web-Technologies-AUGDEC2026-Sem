/* Mock data for the prototype. Edit freely. */

/* Which view is active (set by the login page or the profile menu) */
let CURRENT_ROLE = 'Student';
try { CURRENT_ROLE = sessionStorage.getItem('au_role') || 'Student'; } catch (e) {}
if (['Student', 'Alumni', 'Lecturer', 'Admin'].indexOf(CURRENT_ROLE) === -1) CURRENT_ROLE = 'Student';

const USERS = {
  Student: {
    name: 'Tendai Moyo', initials: 'TM',
    email: 't.moyo@students.africau.edu',
    programme: 'BSc Computer Science', faculty: 'Faculty of Science',
    studentId: 'AU-CS-230184',
    badge: 'Year 3', subtitle: 'BSc Computer Science',
    entry: 2023, status: 'Current student',
    phone: '+263 77 ••• ••45',
    portal: 'Student portal'
  },
  Alumni: {
    name: 'Rudo Chikwanha', initials: 'RC',
    email: 'r.chikwanha@alumni.africau.edu',
    programme: 'BCom Business Management', faculty: 'Faculty of Commerce',
    studentId: 'AU-BM-200742',
    badge: 'Alumna · Class of 2024', subtitle: 'Alumna · Class of 2024',
    entry: 2020, status: 'Graduated 2024',
    phone: '+263 71 ••• ••92',
    portal: 'Alumni portal'
  },
  Lecturer: {
    name: 'Dr. N. Dube', initials: 'ND',
    email: 'n.dube@africau.edu',
    programme: 'Department of Computer Science', faculty: 'Faculty of Science',
    studentId: '',
    badge: 'Lecturer', subtitle: 'Faculty of Science',
    entry: '', status: 'Lecturer', phone: '',
    portal: 'Lecturer portal'
  },
  Admin: {
    name: 'Chipo Nyathi', initials: 'CN',
    email: 'c.nyathi@africau.edu',
    programme: 'Registry', faculty: '',
    studentId: '',
    badge: 'Admin', subtitle: 'Registry Administrator',
    entry: '', status: 'Administrator', phone: '',
    portal: 'Admin portal'
  }
};
const DATA = {
  user: USERS[CURRENT_ROLE],

  academic: {
    gpa: '3.60',
    class: 'Upper Second Class',
    credits: 192,
    totalCredits: 360,
    lastUpdated: '15 Apr 2025',
    semesters: [
      { label: 'S1 2025', gpa: '3.72' },
      { label: 'S2 2024', gpa: '3.58' },
      { label: 'S1 2024', gpa: '3.49' }
    ],
    courses: [
      { code: 'CT301', name: 'Software Engineering',          credits: 15, grade: 'A',  sem: 'Semester 1, 2025' },
      { code: 'CT304', name: 'Database Systems II',           credits: 15, grade: 'A-', sem: 'Semester 1, 2025' },
      { code: 'CT307', name: 'Computer Networks',             credits: 15, grade: 'B+', sem: 'Semester 1, 2025' },
      { code: 'ST201', name: 'Applied Statistics',            credits: 12, grade: 'B+', sem: 'Semester 2, 2024' },
      { code: 'CT205', name: 'Data Structures & Algorithms',  credits: 15, grade: 'A',  sem: 'Semester 2, 2024' },
      { code: 'CT210', name: 'Operating Systems',             credits: 15, grade: 'B+', sem: 'Semester 2, 2024' },
      { code: 'CT201', name: 'Object-Oriented Programming',   credits: 15, grade: 'A-', sem: 'Semester 1, 2024' },
      { code: 'CT203', name: 'Web Technologies',              credits: 15, grade: 'A',  sem: 'Semester 1, 2024' },
      { code: 'MA201', name: 'Discrete Mathematics',          credits: 12, grade: 'B',  sem: 'Semester 1, 2024' }
    ]
  },

  achievements: [
    { id: 1, title: 'Dean’s List — Semester 2',            category: 'Dean’s List',            date: '2025-06-14', tier: 'Major',    status: 'verified', file: 'deans-list.pdf' },
    { id: 2, title: 'ZIM ICT Student Innovation Challenge', category: 'Academic Awards',        date: '2025-05-22', tier: 'Major',    status: 'verified', file: 'innovation-award.pdf' },
    { id: 3, title: 'Google Data Analytics Certificate',    category: 'Certifications',         date: '2025-04-08', tier: 'Moderate', status: 'pending',  file: 'certificate.pdf' },
    { id: 4, title: 'Computer Science Society Treasurer',   category: 'Leadership',             date: '2025-03-12', tier: 'Moderate', status: 'verified', file: 'appointment-letter.pdf' },
    { id: 5, title: 'Harare Code for Good Hackathon',       category: 'Conferences & Seminars', date: '2024-11-16', tier: '',         status: 'rejected', file: 'event-photo.jpg',
      reason: 'Please add an official certificate for Harare Code for Good Hackathon. A photo alone is not enough evidence.' },
    { id: 6, title: 'Peer Programming Tutor',               category: 'Volunteering',           date: '2024-09-02', tier: 'Minor',    status: 'verified', file: 'service-letter.pdf' },
    { id: 7, title: 'AU Interfaculty Debate',               category: 'Debate & Public Speaking', date: '2024-07-20', tier: 'Moderate', status: 'verified', file: 'debate-certificate.pdf' },
    { id: 8, title: 'Academic Excellence Award — Year 2',   category: 'Academic Awards',        date: '2024-05-10', tier: 'Moderate', status: 'verified', file: 'academic-excellence-award.pdf' },
    { id: 9, title: 'Merit Scholarship — Faculty of Science', category: 'Scholarships & Bursaries', date: '2024-02-12', tier: 'Major', status: 'verified', file: 'merit-scholarship-letter.pdf' }
  ],

  documents: [
    { name: 'deans-list.pdf',        linked: 'Dean’s List — Semester 2',            type: 'PDF', date: '2025-04-08', status: 'verified' },
    { name: 'innovation-award.pdf',  linked: 'ZIM ICT Student Innovation Challenge', type: 'PDF', date: '2025-04-09', status: 'verified' },
    { name: 'certificate.pdf',       linked: 'Google Data Analytics Certificate',    type: 'PDF', date: '2025-04-10', status: 'pending' },
    { name: 'appointment-letter.pdf',linked: 'Computer Science Society Treasurer',   type: 'PDF', date: '2025-04-11', status: 'verified' },
    { name: 'event-photo.jpg',       linked: 'Harare Code for Good Hackathon',       type: 'JPG', date: '2025-04-12', status: 'rejected' },
    { name: 'service-letter.pdf',    linked: 'Peer Programming Tutor',               type: 'PDF', date: '2025-04-13', status: 'verified' }
  ],

  letters: [
    { id: 'L1', lecturer: 'Dr. N. Dube',     type: 'Scholarship support', deadline: '2025-04-30', status: 'progress',  label: 'In progress', purpose: 'Merit scholarship application' },
    { id: 'L2', lecturer: 'Prof. T. Marume', type: 'Reference',           deadline: '2025-03-18', status: 'completed', label: 'Completed',   purpose: 'Internship application' },
    { id: 'L3', lecturer: 'Dr. S. Chuma',    type: 'Recommendation',      deadline: '2025-02-12', status: 'declined',  label: 'Declined',    purpose: 'Postgraduate programme application' }
  ],

  access: [
    { name: 'Dr. N. Dube', initials: 'ND', dept: 'Department of Computer Science', sections: ['Achievements', 'Academic Record'],
      expires: '30 Jun 2025', expiresISO: '2025-06-30', purpose: 'Scholarship support letter' }
  ],

  activity: [
    { icon: 'check', tone: 'green', title: 'Achievement verified', desc: 'Dean’s List — Semester 2', time: 'Today, 09:42' },
    { icon: 'clock', tone: 'amber', title: 'Submitted for review', desc: 'Google Data Analytics Certificate', time: '8 Apr 2025' },
    { icon: 'user',  tone: 'grey',  title: 'Profile access granted', desc: 'Dr. N. Dube · Expires 30 Jun 2025', time: '6 Apr 2025' }
  ],

  notifications: [
    { icon: 'check', tone: 'green', title: 'Achievement verified',    desc: 'Dean’s List — Semester 2 has been verified and is now visible on your shared profile.', time: 'Today, 09:42',     unread: true },
    { icon: 'x',     tone: 'red',   title: 'More evidence required',  desc: 'Please add an official certificate for Harare Code for Good Hackathon.',                 time: 'Yesterday, 15:18', unread: true },
    { icon: 'bell',  tone: 'grey',  title: 'Letter request accepted', desc: 'Dr. N. Dube accepted your scholarship support letter request.',                          time: '8 Apr 2025',       unread: false },
    { icon: 'bell',  tone: 'grey',  title: 'Profile access granted',  desc: 'You granted Dr. N. Dube access until 30 June 2025.',                                      time: '6 Apr 2025',       unread: false }
  ],

  /* ---- Lecturer view ---- */
  lecturerRequests: [
    { id: 'R1', student: 'Tendai Moyo',    sid: 'AU-CS-230184', letterId: 'L1', type: 'Scholarship support', deadline: '2025-04-30', status: 'progress',
      purpose: 'Merit scholarship application', achievementIds: [1, 2, 4, 8, 9],
      keyPoints: 'Please highlight my Dean’s List results and the ZIM ICT innovation win.' },
    { id: 'R2', student: 'Rudo Chikwanha', sid: 'AU-BM-200742', letterId: null, type: 'Employment support', deadline: '2025-04-22', status: 'sent',
      purpose: 'Graduate trainee application', achievementIds: [4, 6, 7],
      keyPoints: 'Mention my leadership and tutoring experience.' },
    { id: 'R3', student: 'Tafadzwa Ncube', sid: 'AU-CS-240317', letterId: null, type: 'Recommendation', deadline: '2025-05-08', status: 'accepted',
      purpose: 'Postgraduate programme application', achievementIds: [101, 102], keyPoints: '' }
  ],

  /* Students who have shared their profile with this lecturer, or sent a request */
  sharedStudents: [
    { name: 'Tendai Moyo',    initials: 'TM', programme: 'BSc Computer Science',     level: 'Year 3',                id: 'AU-CS-230184', live: true },
    { name: 'Tatenda Chari',  initials: 'TC', programme: 'BSc Information Systems',  level: 'Year 4',                id: 'AU-IS-220091', access: ['Achievements'], until: '2025-07-31',
      profile: { gpa: '3.18', cls: 'Upper Second Class', credits: 288, total: 360, achievements: [
        { id: 201, title: 'Faculty Hackathon Winner', category: 'Academic Awards', date: '2024-10-12', tier: 'Moderate', status: 'verified', verifiedBy: 'Dr. N. Dube' },
        { id: 202, title: 'IS Society Secretary',     category: 'Leadership',      date: '2024-03-01', tier: 'Minor',    status: 'verified', verifiedBy: 'Department head' } ] } },
    { name: 'Rudo Chikwanha', initials: 'RC', programme: 'BCom Business Management', level: 'Alumna · Class of 2024', id: 'AU-BM-200742', live: true },
    { name: 'Tafadzwa Ncube', initials: 'TN', programme: 'BSc Computer Science',     level: 'Year 2',                id: 'AU-CS-240317', access: ['Achievements'], until: '2025-05-31',
      profile: { gpa: '3.52', cls: 'Upper Second Class', credits: 120, total: 360, achievements: [
        { id: 101, title: 'Dean’s List — Semester 1', category: 'Dean’s List',  date: '2025-01-30', tier: 'Major', status: 'verified', verifiedBy: 'Academic Records Office' },
        { id: 102, title: 'Peer Mentor Programme',    category: 'Volunteering', date: '2024-11-05', tier: 'Minor', status: 'verified', verifiedBy: 'Chaplaincy' } ] } }
  ],

  /* ---- Admin view ---- */
  adminQueue: [
    { id: 1, achId: 3, student: 'Tendai Moyo',    sid: 'AU-CS-230184',  title: 'Google Data Analytics Certificate', category: 'Certifications', date: '2025-04-08', files: ['certificate.pdf'], status: 'pending', verifier: 'Academic Records Office' },
    { id: 2, achId: null, student: 'Rudo Chikwanha', sid: 'Alumna · 2024', title: 'Women in Tech Mentorship',          category: 'Volunteering',   date: '2025-04-07', files: ['mentorship-letter.pdf', 'mentorship-photo.jpg'], status: 'pending', verifier: 'Chaplaincy' }
  ],
  categories: ['Academic Awards', 'Dean’s List', 'Scholarships & Bursaries', 'Conferences & Seminars', 'Certifications',
               'Clubs & Societies', 'Sports', 'Debate & Public Speaking', 'Leadership', 'Volunteering', 'Professional Experience', 'Pre-University'],

  users: [
    { name: 'Tendai Moyo',    email: 't.moyo@students.africau.edu',      role: 'Student',  status: 'verified', last: 'Today' },
    { name: 'Dr. N. Dube',    email: 'n.dube@africau.edu',               role: 'Lecturer', status: 'verified', last: 'Today' },
    { name: 'Rudo Chikwanha', email: 'r.chikwanha@alumni.africau.edu',   role: 'Alumni',   status: 'verified', last: '12 Apr' },
    { name: 'Chipo Nyathi',   email: 'c.nyathi@africau.edu',             role: 'Admin',    status: 'verified', last: 'Today' }
  ],
  rolePermissions: {
    Student:  { summary: 'Manage own record',    items: ['Add and edit own achievements while they are pending', 'Upload supporting evidence', 'View own academic record (read-only)', 'Request letters from lecturers', 'Choose who can see their profile'] },
    Lecturer: { summary: 'View shared profiles', items: ['View profiles that students have shared', 'Accept or decline letter requests', 'Add and verify academic achievements for students', 'Prepare and export letter summaries'] },
    Admin:    { summary: 'Verify and manage',    items: ['Verify or reject submitted achievements', 'Manage users and roles', 'Import official academic data', 'View the audit log'] }
  },

  imports: [
    { name: 'semester-1-2025-results.csv', date: '2025-04-15', by: 'Chipo Nyathi', rows: 2184, result: 'Completed' },
    { name: 'graduating-class-2024.csv',   date: '2024-12-20', by: 'T. Mlambo',    rows: 812,  result: 'Completed' },
    { name: 'semester-2-2024-results.csv', date: '2024-12-06', by: 'Chipo Nyathi', rows: 2093, result: 'Completed' }
  ],

  audit: [
    { ts: '2025-04-15T09:42', user: 'Chipo Nyathi', action: 'Verified',      item: 'Dean’s List — Semester 2',          details: 'Tier set to Major' },
    { ts: '2025-04-15T08:15', user: 'Chipo Nyathi', action: 'Data imported', item: 'semester-1-2025-results.csv',       details: '2,184 academic records' },
    { ts: '2025-04-14T16:33', user: 'Dr. N. Dube',  action: 'Edited',        item: 'Scholarship support letter',        details: 'Draft updated' },
    { ts: '2025-04-14T11:06', user: 'Tendai Moyo',  action: 'Created',       item: 'Google Data Analytics Certificate', details: 'Submitted for review' },
    { ts: '2025-04-13T14:20', user: 'Chipo Nyathi', action: 'Rejected',      item: 'Harare Code for Good Hackathon',    details: 'Evidence insufficient' }
  ],

  unreadBadge: 3
};


/* ---------- extra seed data ---------- */
DATA.lecturers = [
  { name: 'Dr. N. Dube',     dept: 'Department of Computer Science' },
  { name: 'Prof. T. Marume', dept: 'Department of Business Studies' },
  { name: 'Dr. S. Chuma',    dept: 'Department of Information Systems' }
];
DATA.verifiers = ['Academic Records Office', 'Lecturer', 'Department head', 'Sports Director', 'Chaplaincy', 'Attachment supervisor'];
DATA.officialLetters = ['Attachment letter', 'Admission letter'];   // issued by the Records Office (to be confirmed)
DATA.letterTypes = ['Recommendation', 'Reference', 'Scholarship support', 'Employment support', 'Character reference'];
DATA.evidenceRequired = ['Academic Awards', 'Scholarships & Bursaries', 'Certifications', 'Conferences & Seminars'];

DATA.drafts = [];
DATA.accessLog = [
  { ts: '2025-04-12T10:14', who: 'Dr. N. Dube', what: 'Viewed profile', sections: 'Achievements, Academic Record' }
];
DATA.skills = {
  Student: [{ name: 'English', type: 'Language' }, { name: 'Shona', type: 'Language' }, { name: 'Python', type: 'Technical' }, { name: 'SQL', type: 'Technical' }, { name: 'Web development', type: 'Technical' }],
  Alumni:  [{ name: 'English', type: 'Language' }, { name: 'Shona', type: 'Language' }, { name: 'Ndebele', type: 'Language' }, { name: 'Excel', type: 'Technical' }, { name: 'Project management', type: 'Technical' }]
};
DATA.contact = {
  Student: { phone: '+263 77 ••• ••45', backup: '' },
  Alumni:  { phone: '+263 71 ••• ••92', backup: 'rudo.chikwanha@gmail.com' }
};
DATA.visibility = { 'Achievements': true, 'Academic Record': true, 'Documents': false };
DATA.shareLink = null;
DATA.security = { twoStep: true };
DATA.loginHistory = [
  { device: 'Chrome on Ubuntu',  place: 'Harare, ZW', when: '14 Apr 2025 · 18:02', result: 'Signed in' },
  { device: 'Firefox on Windows', place: 'Harare, ZW', when: '9 Apr 2025 · 07:45',  result: 'Signed in' },
  { device: 'Unknown browser',   place: 'Lagos, NG',  when: '2 Apr 2025 · 03:11',  result: 'Blocked, code needed' }
];
DATA.queueStats = { verified: 0, closed: 0 };


/* ---------- email approval links and verified-record exports ---------- */
DATA.exports = [];
DATA.emails = (function () {
  const iso = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  return [{
    id: 'E1', token: 'demo-chaplain-1', kind: 'approval', to: 'Rev. P. Zimba (Chaplain)', subject: 'Please confirm an achievement for Rudo Chikwanha',
    student: 'Rudo Chikwanha', sid: 'Alumna · 2024', title: 'Women in Tech Mentorship', category: 'Volunteering', date: '2025-04-07',
    description: 'Mentored first-year women in technology for two semesters.', files: ['mentorship-letter.pdf', 'mentorship-photo.jpg'],
    queueId: 2, achId: null, sentISO: iso(0), expiresISO: iso(7), status: 'open'
  }];
})();

/* ---------- fill in fields the newer screens need ---------- */
(function normalise() {
  const verifiedBy = { 1: 'Academic Records Office', 2: 'Dr. N. Dube', 4: 'Department head', 6: 'Chaplaincy', 7: 'Dr. N. Dube', 8: 'Academic Records Office', 9: 'Academic Records Office' };
  DATA.achievements.forEach(a => {
    if (!a.categories) a.categories = [a.category];
    if (!a.level) a.level = 'National';
    if (!a.description) a.description = 'Added from the university record.';
    if (!a.files) a.files = a.file ? [a.file] : [];
    if (!a.submitted) a.submitted = a.id === 3 ? '2025-04-08' : a.date;
    if (a.status === 'verified' && !a.verifiedBy) a.verifiedBy = verifiedBy[a.id] || 'Academic Records Office';
    if (!a.history) {
      a.history = [{ when: a.submitted, text: 'Submitted for verification' }];
      if (a.status === 'verified') a.history.push({ when: a.date, text: 'Verified by ' + a.verifiedBy });
      if (a.status === 'rejected') a.history.push({ when: a.date, text: 'Rejected: ' + (a.reason || 'Evidence insufficient') });
    }
  });
})();

/* ---------- keep changes for the browser session so the roles connect ---------- */
const PERSIST = ['achievements', 'documents', 'letters', 'lecturerRequests', 'access', 'accessLog', 'notifications', 'adminQueue',
                 'users', 'imports', 'audit', 'drafts', 'skills', 'contact', 'visibility', 'shareLink', 'security', 'queueStats', 'sharedStudents', 'emails', 'exports'];
function saveState() {
  try { const o = {}; PERSIST.forEach(k => o[k] = DATA[k]); sessionStorage.setItem('au_state', JSON.stringify(o)); } catch (e) {}
}
(function loadState() {
  try {
    const raw = sessionStorage.getItem('au_state');
    if (!raw) return;
    const o = JSON.parse(raw);
    PERSIST.forEach(k => { if (o[k] !== undefined) DATA[k] = o[k]; });
  } catch (e) {}
})();
