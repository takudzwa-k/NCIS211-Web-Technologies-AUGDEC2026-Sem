/* Mock data for the prototype. Edit freely. */

/* Which view is active (set by the login page or the profile menu) */
let CURRENT_ROLE = 'Student';
try { CURRENT_ROLE = sessionStorage.getItem('au_role') || 'Student'; } catch (e) {}
if (['Student', 'Alumni', 'Lecturer'].indexOf(CURRENT_ROLE) === -1) CURRENT_ROLE = 'Student';

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
    { lecturer: 'Dr. N. Dube',     type: 'Scholarship support', deadline: '2025-04-30', status: 'progress',  label: 'In progress', purpose: 'Merit scholarship application' },
    { lecturer: 'Prof. T. Marume', type: 'Reference',           deadline: '2025-03-18', status: 'completed', label: 'Completed',   purpose: 'Internship application' },
    { lecturer: 'Dr. S. Chuma',    type: 'Recommendation',      deadline: '2025-02-12', status: 'declined',  label: 'Declined',    purpose: 'Postgraduate programme application' }
  ],

  access: [
    { name: 'Dr. N. Dube', initials: 'ND', dept: 'Department of Computer Science', sections: 'Achievements, Academic Record', expires: '30 Jun 2025' }
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
    { student: 'Tendai Moyo',     type: 'Scholarship support', deadline: '2025-04-30', status: 'progress', purpose: 'Merit scholarship application' },
    { student: 'Rudo Chikwanha',  type: 'Employment support',  deadline: '2025-04-22', status: 'sent',     purpose: 'Graduate trainee application' },
    { student: 'Tafadzwa Ncube',  type: 'Recommendation',      deadline: '2025-05-08', status: 'accepted', purpose: 'Postgraduate programme application' }
  ],

  /* Students who have shared their profile with this lecturer, or sent a request */
  sharedStudents: [
    { name: 'Tendai Moyo',    initials: 'TM', programme: 'BSc Computer Science',     level: 'Year 3',                id: 'AU-CS-230184', access: ['Achievements', 'Academic Record'] },
    { name: 'Tatenda Chari',  initials: 'TC', programme: 'BSc Information Systems',  level: 'Year 4',                id: 'AU-IS-220091', access: ['Achievements'] },
    { name: 'Rudo Chikwanha', initials: 'RC', programme: 'BCom Business Management', level: 'Alumna · Class of 2024', id: 'AU-BM-200742', access: ['Achievements', 'Academic Record'] },
    { name: 'Tafadzwa Ncube', initials: 'TN', programme: 'BSc Computer Science',     level: 'Year 2',                id: 'AU-CS-240317', access: ['Achievements'] }
  ],

  unreadBadge: 3
};
