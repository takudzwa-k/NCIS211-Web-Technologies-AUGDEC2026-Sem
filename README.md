# AU Student Achievement & Recommendation Profile (prototype)

A clickable prototype built with plain HTML, CSS and JavaScript. There is no backend: everything you do is kept in the browser tab, so the roles connect to each other (a student submits something, the admin sees it, the student is notified).

## Run it

1. Open this folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

Needs an internet connection only for the font (Plus Jakarta Sans). Without it the page falls back to a system font.

## Sign in

Pick a role in "View prototype as". The email and password are filled in. Click **Sign in**, then **Verify and sign in** (the two-step code `123456` is already filled in).

| Role | Name | Starts on |
|---|---|---|
| Student | Tendai Moyo | My Profile |
| Alumni | Rudo Chikwanha | My Profile |
| Lecturer | Dr. N. Dube | Find Students |
| Admin | Chipo Nyathi | Verification Queue |

Switch roles any time from the profile menu (top right). The same menu has **Demo mailbox** and **Reset demo data**.

## A 10-minute demo, step by step

**1. Student logs an achievement (Student)**
1. Achievements, then **Add Achievement**. Click **Submit** with nothing filled in to show the highlighted missing fields.
2. Fill in: title "Inter-varsity Football Captain", category Sports, a date, level Local, a description, and send to **Sports Director**. Submit.
3. It appears as **Pending**. Click it to show the history.

**2. Staff without accounts confirm it by email (no login)**
1. Profile menu, **Demo mailbox**. The email to the Sports Director is there.
2. **Open the link**. This is a standalone page with no portal and no login. Confirm it as Major.
3. Open the same link again to show it only works once.
4. Back as the student: the achievement is **Verified**, and its details say who confirmed it and that it was by email link.

**3. Admin reviews and flags (Admin)**
1. As the student, add another achievement and send it to the **Academic Records Office**.
2. Switch to Admin. Open it in the Verification Queue. Click **Flag for explanation** with a note.
3. Switch to Student: the item shows **Needs explanation**. Open it and send an explanation.
4. Back as Admin: the item shows **Explained** with the student's reply. Verify it.

**4. Student asks for a letter (Student, then Lecturer)**
1. Letter Requests, **New request**: type Recommendation, lecturer Dr. N. Dube, purpose, deadline, key points, and tick only some achievements.
2. Switch to Lecturer, Letter Requests: **Accept**, then **Start letter**.
3. The lecturer sees only the ticked achievements. A draft is built from verified information. Edit it, **Save draft** (see Drafts), then **Approve and complete**.
4. Switch to Student: the request is **Completed**, and Sharing & Privacy shows who viewed the profile.

**5. Student controls privacy (Student)**
Sharing & Privacy: switch off Academic Record, create and cancel a **share link**, **Grant access** with a purpose and end date, **Revoke** a lecturer. In Find Students the lecturer loses the student straight away.

**6. Documents (Student)**
Documents, **Upload document**: drop in a PDF and an image, choose what it is for, upload. Preview, download and remove them.

**7. Proof for other institutions (Student)**
1. My Profile, **Export verified record**. A printable record opens with a verification code.
2. Open the **verify** page (Sharing & Privacy, "Check online"). The code is shown as genuine.
3. **Withdraw** the record and check again: it now says withdrawn.

**8. Records Office imports grades (Admin)**
Academic Data Import: **Download a sample CSV**, then **Import .CSV**, map the columns, confirm. Then show the **Audit Log** (every step above is in it) and **Export log**.

## Where each workshop requirement is covered

| Requirement | Where |
|---|---|
| One central profile, verified achievements | My Profile, Achievements |
| Evidence upload, Pending / Verified / Rejected with reason | Add Achievement, Documents, Verification Queue |
| Verified by the right person, recorded | "Send to" choice, email link, achievement details |
| Staff without accounts can verify | Demo mailbox, email approval page |
| Flag suspicious evidence, student explains | Verification Queue, Achievements |
| Edit pending items; verified items need approval | Achievement details (Request change / deletion) |
| Duplicate warning, missing information blocked | Add Achievement |
| Pre-university and past achievements, tiers | Add Achievement, Verification Queue |
| Letter requests with purpose and key points | New request |
| Lecturer sees only what the student chose | Student profile (lecturer view) |
| Draft from verified data, lecturer stays the author | Letter draft, Drafts |
| Student controls access, time-limited, notified | Sharing & Privacy |
| Official grades read-only, imported by the Records Office | Academic Record, Academic Data Import |
| Two-step sign-in, password reset, login history | Login, Sharing & Privacy |
| Skills, contact details, CV | My Profile |
| Verified record with a code anyone can check | Export verified record, verify page |
| Audit trail | Audit Log |

## Not built

- The attachment supervisor module (attendance, tasks, assessment). It also conflicts with the decision to leave attendance out.
- Trusted helpers, separate logins for each kind of verifier, messaging and complaints.
- Real security, storage and email. A real build needs a backend and database (encryption, real sign-in, file storage, a mail service).
- Downloading finished letters, and who may receive them, are open questions in the workshop findings.

## Good to know

- Everything lives in the browser tab. Closing the tab or using **Reset demo data** clears it.
- Print and CV windows are pop-ups. Allow pop-ups if nothing opens.
- **For anyone editing the code:** never write a closing body tag as text inside a script. Live Server inserts its reload snippet at the first one it finds and breaks the page.

## Files

```
index.html          sign in, two-step code, password reset
css/style.css       the whole theme
js/data.js          sample data and session saving
js/app.js           shared code: menus, popups, uploads, notifications
pages/              one file per screen (student, lecturer, admin and standalone pages)
```
