'use strict';
// Creates the demo accounts and sample records the first time the server starts on an empty database.
const { db, tx, audit } = require('./db');
const auth = require('./auth');
const store = require('./store');

const PASSWORD = process.env.AU_DEMO_PASSWORD || 'Demo-Passw0rd!';

function ensureSeed() {
  if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0 || process.env.AU_NO_SEED === '1') {
    ensureSupervisor();
    return false;
  }
  tx(seedAll);
  return true;
}

function ensureSupervisor() {
  const existing = db.prepare("SELECT * FROM users WHERE email = 'r.phiri@attachment.africau.edu'").get();
  const hash = auth.hashPassword(PASSWORD);
  const now = Date.now(), day = 86400000, t = store.todayISO();
  let phiriId = existing ? existing.id : 'u_demo_phiri';
  if (!existing) {
    db.prepare(`INSERT INTO users (id, email, name, role, password_hash, status, dept, title, two_step, created_at, pw_changed_at, last_login)
                VALUES (?,?,?,?,?,'active',?,?,1,?,?,?)`)
      .run(phiriId, 'r.phiri@attachment.africau.edu', 'Mrs. R. Phiri', 'Supervisor', hash, 'Econet Wireless / Industrial Partner', 'Industrial Attachment Supervisor', now - 60 * day, now - 10 * day, now - 3600000);
  }
  const DEMO_ACCOUNTS = [
    { name: 'Tendai Moyo', role: 'Student', label: 'Student (Premium)', email: 't.moyo@students.africau.edu' },
    { name: 'Tafadzwa Ncube', role: 'Student', label: 'Student (Free)', email: 't.ncube@students.africau.edu' },
    { name: 'Rudo Chikwanha', role: 'Alumni', label: 'Alumni', email: 'r.chikwanha@alumni.africau.edu' },
    { name: 'Dr. N. Dube', role: 'Lecturer', label: 'Lecturer', email: 'n.dube@africau.edu' },
    { name: 'Mrs. R. Phiri', role: 'Supervisor', label: 'Supervisor', email: 'r.phiri@attachment.africau.edu' },
    { name: 'Chipo Nyathi', role: 'Admin', label: 'Admin', email: 'c.nyathi@africau.edu' }
  ];
  store.kvSet('system', 'demoAccounts', DEMO_ACCOUNTS);

  // Ensure Tafadzwa Ncube (free student) exists
  const existingTafadzwa = db.prepare("SELECT * FROM users WHERE email = 't.ncube@students.africau.edu'").get();
  let tafadzwaId = existingTafadzwa ? existingTafadzwa.id : 'u_demo_tafadzwa';
  if (!existingTafadzwa) {
    db.prepare(`INSERT INTO users (id, email, name, role, password_hash, status, student_id, programme, faculty, entry_year, two_step, created_at, pw_changed_at, last_login)
                VALUES (?,?,?,?,?,'active',?,?,?,?,1,?,?,?)`)
      .run(tafadzwaId, 't.ncube@students.africau.edu', 'Tafadzwa Ncube', 'Student', hash, '240317', 'Bachelor of Science Honours in Computer Science', 'Faculty of Science and Technology', 2024, now - 60 * day, now - 15 * day, now - 7200000);
    // Add sample achievement for Tafadzwa
    const d = { title: 'First Year Code Jam — Winner', categories: ['Academic'], category: 'Academic', date: store.addDays(t, -40), level: 'Institutional',
      role: 'Participant', description: 'Won 1st place in the Africa University annual First Year Code Jam hackathon.',
      preUni: false, files: [], file: '—', verifier: 'Dr. N. Dube', tier: 'Major', status: 'verified', submitted: store.addDays(t, -45),
      history: [{ when: store.addDays(t, -45), text: 'Submitted for verification' }, { when: store.addDays(t, -40), text: 'Verified by Dr. N. Dube' }], id: null,
      verifiedBy: 'Dr. N. Dube', verifiedAt: now - 35 * day };
    store.insertRec('achievements', tafadzwaId, null, d);
    store.kvSet(tafadzwaId, 'skills', [{ name: 'Python', type: 'Technical' }, { name: 'HTML/CSS', type: 'Technical' }, { name: 'English', type: 'Language' }]);
  }
  const tendai = db.prepare("SELECT id, name, student_id FROM users WHERE id = 'u_demo_tendai' OR name LIKE '%Tendai%'").get();
  if (tendai) {
    const hasGrant = store.listByRef('access', phiriId).some(r => r.owner === tendai.id);
    if (!hasGrant) {
      store.insertRec('access', tendai.id, phiriId, { lecturerId: phiriId, name: 'Mrs. R. Phiri', initials: 'RP', dept: 'Econet Wireless / Industrial Partner', sections: ['Achievements', 'Documents'], purpose: 'Industrial attachment supervision & assessment', expiresISO: store.addDays(t, 90), expires: store.fmtDate(store.addDays(t, 90)) });
    }
    const hasReq = store.listByRef('lecturerRequests', phiriId).some(r => r.owner === tendai.id);
    if (!hasReq) {
      const achs = store.listRecs('achievements', tendai.id).map(store.toClient).filter(a => a.status === 'verified').slice(0, 2);
      const d = { letterId: '', student: tendai.name, sid: tendai.student_id, lecturerId: phiriId, lecturer: 'Mrs. R. Phiri', official: false,
        type: 'Attachment assessment', deadline: store.addDays(t, 25), status: 'progress', purpose: 'Industrial attachment performance evaluation',
        achievementIds: achs.map(a => a.id), keyPoints: 'Software engineering intern at Econet Wireless.' };
      const reqId = store.insertRec('lecturerRequests', tendai.id, phiriId, d);
      d.letterId = 'L' + reqId;
      store.saveRec(reqId, d, phiriId);
      store.insertRec('notifications', phiriId, null, { icon: 'inbox', tone: 'amber', title: 'New assessment request', desc: 'Tendai Moyo requested an industrial attachment assessment.', at: Date.now() - 45 * 60000, unread: true });
    }
  }
  ensureTendaiPremium();
}

function ensureTendaiPremium() {
  const now = Date.now(), day = 86400000, oneYearLater = now + 365 * day;
  const tendai = db.prepare("SELECT id, name FROM users WHERE id = 'u_demo_tendai' OR email = 't.moyo@students.africau.edu'").get();
  if (tendai) {
    const existing = db.prepare("SELECT * FROM premium WHERE user_id = ?").get(tendai.id);
    if (!existing) {
      db.prepare(`INSERT INTO premium (id, user_id, reference, status, requested_at, decided_at, expires_at)
                  VALUES (?, ?, ?, 'approved', ?, ?, ?)`).run(
        'p_demo_' + tendai.id,
        tendai.id,
        'ECO-PAY-SEM2-2026',
        now - 5 * day,
        now - 4 * day,
        oneYearLater
      );
    } else {
      db.prepare(`UPDATE premium SET status = 'approved', expires_at = ? WHERE id = ?`).run(
        oneYearLater,
        existing.id
      );
    }
  }
  let takudzwa = db.prepare("SELECT id, name FROM users WHERE email = 'kachingwet@africau.edu'").get();
  const takudzwaHash = 'scrypt$16384$8$1$e32Yp3aHN2dLm9/VbnCNnA==$rhTommrwbx45K356ikNNlRUIj3PSkAV9Fp7RM+ryev6wUgTO/WLGSvPMIPZbJGjY5IDMSsKQvy3eT94GeSfq8g==';
  if (!takudzwa) {
    const takId = 'u_YodQu1pfuEqP';
    db.prepare(`INSERT INTO users (id, email, name, role, password_hash, status, student_id, programme, faculty, entry_year, two_step, created_at, pw_changed_at, last_login)
                VALUES (?, ?, 'Takudzwa Kachingwe', 'Student', ?, 'active', '250625', 'Bachelor of Science Honours in Computer Science', 'Faculty of Science and Technology', 2025, 0, ?, ?, ?)`).run(
      takId,
      'kachingwet@africau.edu',
      takudzwaHash,
      now - 60 * day,
      now - 30 * day,
      now
    );
    takudzwa = { id: takId, name: 'Takudzwa Kachingwe' };
    const d = { title: 'Advanced Web Applications Development', categories: ['Academic Awards'], category: 'Academic Awards', date: store.addDays(store.todayISO(), -20), level: 'Institutional',
      role: 'Lead Developer', description: 'Engineered Africa University Achievement & Recommendation Portal prototype.',
      preUni: false, files: [], file: '—', verifier: 'Dr. N. Dube', tier: 'Major', status: 'verified', submitted: store.addDays(store.todayISO(), -25),
      history: [{ when: store.addDays(store.todayISO(), -25), text: 'Submitted for verification' }, { when: store.addDays(store.todayISO(), -20), text: 'Verified by Dr. N. Dube' }], id: null,
      verifiedBy: 'Dr. N. Dube', verifiedAt: now - 20 * day };
    store.insertRec('achievements', takId, null, d);
    store.kvSet(takId, 'skills', [{ name: 'JavaScript', type: 'Technical' }, { name: 'Node.js', type: 'Technical' }, { name: 'SQLite', type: 'Technical' }]);
  }
  if (takudzwa) {
    const existingTak = db.prepare("SELECT * FROM premium WHERE user_id = ?").get(takudzwa.id);
    if (!existingTak) {
      db.prepare(`INSERT INTO premium (id, user_id, reference, status, requested_at, decided_at, expires_at)
                  VALUES (?, ?, ?, 'approved', ?, ?, ?)`).run(
        'prem_' + takudzwa.id,
        takudzwa.id,
        'ECOCASH-PREM-KAD5IC',
        now - 5 * day,
        now - 4 * day,
        oneYearLater
      );
    } else {
      db.prepare(`UPDATE premium SET status = 'approved', expires_at = ? WHERE id = ?`).run(
        oneYearLater,
        existingTak.id
      );
    }
  }
}

function seedAll() {
  const now = Date.now(), t = store.todayISO(), day = 86400000;
  const hash = auth.hashPassword(PASSWORD);
  const U = {};
  const add = (key, o) => {
    const id = 'u_demo_' + key;
    db.prepare(`INSERT INTO users (id, email, name, role, password_hash, status, student_id, programme, faculty, entry_year, grad_year, dept, title, two_step, created_at, pw_changed_at, last_login)
                VALUES (?,?,?,?,?,'active',?,?,?,?,?,?,?,1,?,?,?)`)
      .run(id, o.email, o.name, o.role, hash, o.sid || null, o.programme || null, o.faculty || null, o.entry || null, o.grad || null, o.dept || null, o.title || null, now - 90 * day, now - 30 * day, o.last || null);
    U[key] = id; return id;
  };
  add('tendai', { email: 't.moyo@students.africau.edu', name: 'Tendai Moyo', role: 'Student', sid: '230184', programme: 'Bachelor of Science Honours in Computer Science', faculty: 'Faculty of Science and Technology', entry: 2023, last: now - 3600000 });
  add('takudzwa', { email: 'kachingwet@africau.edu', name: 'Takudzwa Kachingwe', role: 'Student', sid: '250625', programme: 'Bachelor of Science Honours in Computer Science', faculty: 'Faculty of Science and Technology', entry: 2025, last: now - 1800000 });
  add('rudo', { email: 'r.chikwanha@alumni.africau.edu', name: 'Rudo Chikwanha', role: 'Alumni', sid: '200742', programme: 'Bachelor of Business Studies Honours in Management', faculty: 'Faculty of Management and Administration', entry: 2020, grad: 2024, last: now - 12 * day });
  add('tatenda', { email: 'tatenda.chari@students.africau.edu', name: 'Tatenda Chari', role: 'Student', sid: '220091', programme: 'Bachelor of Science Honours in Computer Information Systems', faculty: 'Faculty of Science and Technology', entry: 2022 });
  add('tafadzwa', { email: 't.ncube@students.africau.edu', name: 'Tafadzwa Ncube', role: 'Student', sid: '240317', programme: 'Bachelor of Science Honours in Computer Science', faculty: 'Faculty of Science and Technology', entry: 2024 });
  add('dube', { email: 'n.dube@africau.edu', name: 'Dr. N. Dube', role: 'Lecturer', dept: 'Department of Computer Science', faculty: 'Faculty of Science and Technology', last: now - 7200000 });
  add('marume', { email: 't.marume@africau.edu', name: 'Prof. T. Marume', role: 'Lecturer', dept: 'Department of Business Studies', faculty: 'Faculty of Management and Administration' });
  add('chuma', { email: 's.chuma@africau.edu', name: 'Dr. S. Chuma', role: 'Lecturer', dept: 'Department of Information Systems', faculty: 'Faculty of Science and Technology' });
  add('phiri', { email: 'r.phiri@attachment.africau.edu', name: 'Mrs. R. Phiri', role: 'Supervisor', title: 'Industrial Attachment Supervisor', dept: 'Econet Wireless / Industrial Partner' });
  add('chipo', { email: 'c.nyathi@africau.edu', name: 'Chipo Nyathi', role: 'Admin', title: 'Registry Administrator', last: now - 1800000 });
  add('mlambo', { email: 't.mlambo@africau.edu', name: 'T. Mlambo', role: 'Admin', title: 'Records Officer' });

  store.kvSet('system', 'demoAccounts', [
    { name: 'Tendai Moyo', role: 'Student', label: 'Student (Premium)', email: 't.moyo@students.africau.edu' },
    { name: 'Tafadzwa Ncube', role: 'Student', label: 'Student (Free)', email: 't.ncube@students.africau.edu' },
    { name: 'Rudo Chikwanha', role: 'Alumni', label: 'Alumni', email: 'r.chikwanha@alumni.africau.edu' },
    { name: 'Dr. N. Dube', role: 'Lecturer', label: 'Lecturer', email: 'n.dube@africau.edu' },
    { name: 'Mrs. R. Phiri', role: 'Supervisor', label: 'Supervisor', email: 'r.phiri@attachment.africau.edu' },
    { name: 'Chipo Nyathi', role: 'Admin', label: 'Admin', email: 'c.nyathi@africau.edu' }]);

  /* ----- grades from the Records Office ----- */
  const imp = (name, daysAgo, by, rows) => Number(db.prepare('INSERT INTO imports (name, at, by_name, rows, matched, skipped) VALUES (?,?,?,?,?,0)').run(name, now - daysAgo * day, by, rows, 4).lastInsertRowid);
  const i3 = imp('semester-2-2024-results.csv', 340, 'Chipo Nyathi', 2093), i2 = imp('graduating-class-2024.csv', 320, 'T. Mlambo', 812), i1 = imp('semester-1-2025-results.csv', 20, 'Chipo Nyathi', 2184);
  const course = (sid, code, name, cr, g, sem, imp) => db.prepare('INSERT INTO courses (student_id, code, name, credits, grade, semester, import_id) VALUES (?,?,?,?,?,?,?)').run(sid, code, name, cr, g, sem, imp);
  [['CT101', 'Introduction to Programming', 15, 'A-', 'Semester 1, 2023'], ['CT102', 'Computer Systems', 15, 'B+', 'Semester 1, 2023'], ['MA101', 'Calculus', 12, 'B+', 'Semester 1, 2023'],
   ['CT111', 'Web Basics', 15, 'A-', 'Semester 2, 2023'], ['CT103', 'Professional Skills', 12, 'A', 'Semester 2, 2023'], ['ST101', 'Statistics I', 9, 'B+', 'Semester 2, 2023'],
   ['CT201', 'Object-Oriented Programming', 15, 'A-', 'Semester 1, 2024'], ['CT203', 'Web Technologies', 15, 'A', 'Semester 1, 2024'], ['MA201', 'Discrete Mathematics', 12, 'B', 'Semester 1, 2024'],
   ['CT205', 'Data Structures & Algorithms', 15, 'A', 'Semester 2, 2024'], ['CT210', 'Operating Systems', 15, 'B+', 'Semester 2, 2024'], ['ST201', 'Applied Statistics', 12, 'B+', 'Semester 2, 2024'],
   ['CT301', 'Software Engineering', 15, 'A', 'Semester 1, 2025'], ['CT304', 'Database Systems II', 15, 'A-', 'Semester 1, 2025'], ['CT307', 'Computer Networks', 15, 'B+', 'Semester 1, 2025']]
    .forEach((c, i) => course('230184', c[0], c[1], c[2], c[3], c[4], i < 6 ? i3 : i < 12 ? i2 : i1));
  [['BM301', 'Strategic Management', 15, 'A-', 'Semester 2, 2023'], ['BM302', 'Marketing Analytics', 15, 'B+', 'Semester 2, 2023'], ['BM310', 'Entrepreneurship', 15, 'A', 'Semester 2, 2024'], ['BM320', 'Final Year Project', 30, 'A', 'Semester 2, 2024']]
    .forEach(c => course('200742', c[0], c[1], c[2], c[3], c[4], i2));
  [['IS301', 'Systems Analysis', 15, 'B+', 'Semester 1, 2025'], ['IS305', 'Information Security', 15, 'B', 'Semester 1, 2025'], ['IS210', 'Databases', 15, 'A-', 'Semester 2, 2024']]
    .forEach(c => course('220091', c[0], c[1], c[2], c[3], c[4], i1));
  [['CT101', 'Introduction to Programming', 15, 'A', 'Semester 1, 2025'], ['MA101', 'Calculus', 12, 'A-', 'Semester 1, 2025']]
    .forEach(c => course('240317', c[0], c[1], c[2], c[3], c[4], i1));

  /* ----- achievements ----- */
  const addAch = (owner, a) => {
    const d = { title: a.title, categories: [a.category], category: a.category, date: a.date, level: a.level || 'National', role: '', description: a.description || 'Added from the university record.',
      preUni: false, files: a.files || [], file: (a.files || [])[0] || '—', verifier: a.verifier || 'Academic Records Office', tier: a.tier || '', status: a.status, submitted: a.submitted || a.date,
      history: [{ when: a.submitted || a.date, text: 'Submitted for verification' }], id: null };
    if (a.status === 'verified') { d.verifiedBy = a.by || 'Academic Records Office'; d.verifiedAt = now - 5 * day; d.history.push({ when: a.date, text: 'Verified by ' + d.verifiedBy }); }
    if (a.status === 'rejected') { d.reason = a.reason; d.history.push({ when: a.date, text: 'Rejected: ' + a.reason }); }
    const id = store.insertRec('achievements', owner, null, d); d.id = id; store.saveRec(id, d); return { id, d };
  };
  const T = U.tendai, A = {};
  A.deans = addAch(T, { title: 'Dean’s List — Semester 2', category: 'Dean’s List', date: '2025-06-14', tier: 'Major', status: 'verified', files: ['deans-list.pdf'] });
  A.zim = addAch(T, { title: 'ZIM ICT Student Innovation Challenge', category: 'Academic Awards', date: '2025-05-22', tier: 'Major', status: 'verified', by: 'Dr. N. Dube', files: ['innovation-award.pdf'] });
  A.google = addAch(T, { title: 'Google Data Analytics Certificate', category: 'Certifications', date: '2025-04-08', tier: '', status: 'pending', files: ['certificate.pdf'], description: 'Completed the eight-course professional certificate.' });
  A.cs = addAch(T, { title: 'Computer Science Society Treasurer', category: 'Leadership', date: '2025-03-12', tier: 'Moderate', status: 'verified', by: 'Department head', files: ['appointment-letter.pdf'] });
  addAch(T, { title: 'Harare Code for Good Hackathon', category: 'Conferences & Seminars', date: '2024-11-16', status: 'rejected', files: ['event-photo.jpg'], reason: 'Please add an official certificate for Harare Code for Good Hackathon. A photo alone is not enough evidence.' });
  A.tutor = addAch(T, { title: 'Peer Programming Tutor', category: 'Volunteering', date: '2024-09-02', tier: 'Minor', status: 'verified', by: 'Chaplaincy', files: ['service-letter.pdf'] });
  addAch(T, { title: 'AU Interfaculty Debate', category: 'Debate & Public Speaking', date: '2024-07-20', tier: 'Moderate', status: 'verified', by: 'Dr. N. Dube', files: ['debate-certificate.pdf'] });
  A.excel = addAch(T, { title: 'Academic Excellence Award — Year 2', category: 'Academic Awards', date: '2024-05-10', tier: 'Moderate', status: 'verified', files: ['academic-excellence-award.pdf'] });
  A.merit = addAch(T, { title: 'Merit Scholarship — Faculty of Science', category: 'Scholarships & Bursaries', date: '2024-02-12', tier: 'Major', status: 'verified', files: ['merit-scholarship-letter.pdf'] });
  store.submitted({ owner: T }, A.google.id, A.google.d, false);

  const R = U.rudo;
  const r1 = addAch(R, { title: 'Faculty Debate Champion', category: 'Debate & Public Speaking', date: '2023-09-15', tier: 'Moderate', status: 'verified', by: 'Dr. N. Dube' });
  const r2 = addAch(R, { title: 'Student Council Treasurer', category: 'Leadership', date: '2023-11-02', tier: 'Moderate', status: 'verified', by: 'Department head' });
  const r3 = addAch(R, { title: 'Best Final-Year Project — Commerce', category: 'Academic Awards', date: '2024-05-20', tier: 'Major', status: 'verified' });
  const rw = addAch(R, { title: 'Women in Tech Mentorship', category: 'Volunteering', date: '2025-04-07', status: 'pending', verifier: 'Chaplaincy', files: ['mentorship-letter.pdf', 'mentorship-photo.jpg'], description: 'Mentored first-year women in technology for two semesters.' });
  store.submitted({ owner: R }, rw.id, rw.d, false);

  const addOther = (owner, list) => list.map(a => addAch(owner, Object.assign({ status: 'verified' }, a)));
  addOther(U.tatenda, [{ title: 'Faculty Hackathon Winner', category: 'Academic Awards', date: '2024-10-12', tier: 'Moderate', by: 'Dr. N. Dube' }, { title: 'IS Society Secretary', category: 'Leadership', date: '2024-03-01', tier: 'Minor', by: 'Department head' }]);
  const tf = addOther(U.tafadzwa, [{ title: 'Dean’s List — Semester 1', category: 'Dean’s List', date: '2025-01-30', tier: 'Major' }, { title: 'Peer Mentor Programme', category: 'Volunteering', date: '2024-11-05', tier: 'Minor', by: 'Chaplaincy' }]);

  /* ----- documents (sample entries with no stored file) ----- */
  const doc = (owner, name, linked, type, date, status) => store.insertRec('documents', owner, null, { name, linked, type, date, status });
  doc(T, 'deans-list.pdf', 'Dean’s List — Semester 2', 'PDF', '2025-04-08', 'verified'); doc(T, 'innovation-award.pdf', 'ZIM ICT Student Innovation Challenge', 'PDF', '2025-04-09', 'verified');
  doc(T, 'certificate.pdf', 'Google Data Analytics Certificate', 'PDF', '2025-04-10', 'pending'); doc(T, 'appointment-letter.pdf', 'Computer Science Society Treasurer', 'PDF', '2025-04-11', 'verified');
  doc(T, 'event-photo.jpg', 'Harare Code for Good Hackathon', 'JPG', '2025-04-12', 'rejected'); doc(T, 'service-letter.pdf', 'Peer Programming Tutor', 'PDF', '2025-04-13', 'verified');

  /* ----- who may see what, and letter requests ----- */
  const grant = (owner, lec, name, initials, dept, sections, purpose, days) => store.insertRec('access', owner, lec, { lecturerId: lec, name: name || 'Dr. N. Dube', initials: initials || 'ND', dept: dept || 'Department of Computer Science', sections, purpose, expiresISO: store.addDays(t, days), expires: store.fmtDate(store.addDays(t, days)) });
  grant(T, U.dube, 'Dr. N. Dube', 'ND', 'Department of Computer Science', ['Achievements', 'Academic Record'], 'Scholarship support letter', 60);
  grant(T, U.phiri, 'Mrs. R. Phiri', 'RP', 'Econet Wireless / Industrial Partner', ['Achievements', 'Documents'], 'Industrial attachment supervision & assessment', 90);
  grant(R, U.dube, 'Dr. N. Dube', 'ND', 'Department of Computer Science', ['Selected achievements'], 'Employment support letter', 21);
  grant(U.tatenda, U.dube, 'Dr. N. Dube', 'ND', 'Department of Computer Science', ['Achievements'], 'Reference', 45);
  grant(U.tafadzwa, U.dube, 'Dr. N. Dube', 'ND', 'Department of Computer Science', ['Achievements'], 'Postgraduate recommendation', 30);
  const request = (owner, who, o, lId, lName) => {
    const idStaff = lId || U.dube, nameStaff = lName || 'Dr. N. Dube';
    const d = Object.assign({ letterId: '', student: who.name, sid: who.sid, lecturerId: idStaff, lecturer: nameStaff, official: false }, o);
    const id = store.insertRec('lecturerRequests', owner, idStaff, d); d.letterId = 'L' + id; store.saveRec(id, d, idStaff); return id;
  };
  request(T, { name: 'Tendai Moyo', sid: '230184' }, { type: 'Scholarship support', deadline: store.addDays(t, 14), status: 'progress', purpose: 'Merit scholarship application',
    achievementIds: [A.deans.id, A.zim.id, A.cs.id, A.excel.id, A.merit.id], keyPoints: 'Please highlight my Dean’s List results and the ZIM ICT innovation win.' });
  request(T, { name: 'Tendai Moyo', sid: '230184' }, { type: 'Attachment assessment', deadline: store.addDays(t, 25), status: 'progress', purpose: 'Industrial attachment performance evaluation',
    achievementIds: [A.zim.id, A.cs.id], keyPoints: 'Software engineering intern at Econet Wireless.' }, U.phiri, 'Mrs. R. Phiri');
  request(R, { name: 'Rudo Chikwanha', sid: '200742' }, { type: 'Employment support', deadline: store.addDays(t, 10), status: 'sent', purpose: 'Graduate trainee application',
    achievementIds: [r1.id, r2.id, r3.id], keyPoints: 'Mention my leadership and public speaking experience.' });
  request(U.tafadzwa, { name: 'Tafadzwa Ncube', sid: '240317' }, { type: 'Recommendation', deadline: store.addDays(t, 20), status: 'accepted', purpose: 'Postgraduate programme application',
    achievementIds: tf.map(x => x.id), keyPoints: '' });

  /* ----- a few notifications so the first screen is not empty ----- */
  const note = (uid, ic, tone, title, desc, agoMin, unread) => store.insertRec('notifications', uid, null, { icon: ic, tone, title, desc, at: now - agoMin * 60000, unread });
  note(T, 'check', 'green', 'Achievement verified', 'Dean’s List — Semester 2 has been verified and is now visible on your shared profile.', 40, true);
  note(T, 'x', 'red', 'More evidence required', 'Please add an official certificate for Harare Code for Good Hackathon.', 1200, true);
  note(T, 'bell', 'grey', 'Letter request accepted', 'Dr. N. Dube accepted your scholarship support letter request.', 60 * 24 * 40, false);
  note(T, 'bell', 'grey', 'Profile access granted', 'You granted Dr. N. Dube access to your profile.', 60 * 24 * 42, false);
  note(U.dube, 'inbox', 'amber', 'New letter request', 'Rudo Chikwanha asked for an employment support letter.', 90, true);
  note(U.phiri, 'inbox', 'amber', 'New assessment request', 'Tendai Moyo requested an industrial attachment assessment.', 45, true);
  note(U.chipo, 'clock', 'amber', 'Verification queue', 'Two achievements are waiting for review.', 30, true);

  store.insertRec('accessLog', T, null, { ts: store.isoOf(now - 6 * day) + 'T10:14', who: 'Dr. N. Dube', what: 'Viewed profile', sections: 'Achievements, Academic Record' });
  store.kvSet(T, 'skills', [{ name: 'English', type: 'Language' }, { name: 'Shona', type: 'Language' }, { name: 'Python', type: 'Technical' }, { name: 'SQL', type: 'Technical' }, { name: 'Web development', type: 'Technical' }]);
  store.kvSet(T, 'contact', { phone: '+263 77 ••• ••45', backup: '' });
  store.kvSet(R, 'skills', [{ name: 'English', type: 'Language' }, { name: 'Shona', type: 'Language' }, { name: 'Ndebele', type: 'Language' }, { name: 'Excel', type: 'Technical' }, { name: 'Project management', type: 'Technical' }]);
  store.kvSet(R, 'contact', { phone: '+263 71 ••• ••92', backup: 'rudo.chikwanha@gmail.com' });
  audit(null, 'Chipo Nyathi', 'Data imported', 'semester-1-2025-results.csv', '2,184 academic records');
  audit(null, 'Dr. N. Dube', 'Verified', 'ZIM ICT Student Innovation Challenge', 'Tier set to Major');
  ensureTendaiPremium();
}

module.exports = { ensureSeed, seedAll, PASSWORD };
if (require.main === module) { console.log(ensureSeed() ? 'Seeded demo data.' : 'Database already has users, nothing seeded.'); }
