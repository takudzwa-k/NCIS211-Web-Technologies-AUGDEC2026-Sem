markdown
# AU Student Achievement & Recommendation Profile

A working portal with a real server and database. Students and alumni record achievements, staff verify them, lecturers write letters, and the Records Office imports official grades. Sign-in, permissions, files, and the audit trail are enforced on the server. 

*No packages to install. It uses only what comes with Node.*

---

## 🚀 Run it

1. You need **Node.js 22.5 or newer**. Check with `node --version`. If it is older, install a current version from nodejs.org (or with `nvm install 22`).
2. In this folder run:

   ```bash
   node server/server.js
Open http://localhost:3000 in your browser.

The first start creates the database in the data/ folder and fills it with demo accounts. Do not open the pages with VS Code Live Server any more. It only serves files, so there would be no server to sign in to.

🔐 Sign in & Create Account
The sign-in page lists demo accounts in development mode. Click one to fill in the email and the shared demo password (Demo-Passw0rd!), then press Sign in.

Every sign-in sends a one-time code by email. Real email is not connected yet, so open the Demo mailbox (link on the sign-in page and in the profile menu) and type the 6-digit code from the newest message.

Role	Name	Email
Student	Tendai Moyo	t.moyo@students.africau.edu
Alumni	Rudo Chikwanha	r.chikwanha@alumni.africau.edu
Lecturer	Dr. N. Dube	n.dube@africau.edu
Admin	Chipo Nyathi	c.nyathi@africau.edu
Create account on the sign-in page makes a real student or alumni account. It needs a university email address (name@africau.edu) and a six-digit student ID, and the account only works after the emailed link is opened. Lecturers and staff are invited by an administrator (Users & Permissions).

💼 Business Strategy, Scalability & Sustainability
The Business Problem Solved:
Universities struggle with fragmented student records, slow manual verification, and lecturers spending excessive time writing repetitive reference letters. This system centralizes the workflow into one secure, auditable platform. To ensure long-term success, the system is designed to be financially and operationally sustainable:

1. Scalability & Lecturer Workflow
How will lecturers benefit?
Lecturers are currently burdened with administrative tasks that eat into their teaching and research time. The system scales for them by:

Zero-effort drafting: Lecturers don't start from a blank page. The system uses verified achievements to generate a structured draft. The lecturer simply reviews, edits, and approves.

Data filtering: Lecturers only see exactly what the student has shared (e.g., specific verified awards), eliminating the need to search through years of academic records.

Scalability: As the university grows, the system handles the volume. Instead of emailing Word documents back and forth, all requests, drafts, and approvals are queued in a single dashboard.

2. Financial Sustainability (Maintenance & Cash Flow)
How is the system maintained with no initial cash flow?
If deployed as an internal university tool, maintenance is funded by the institution's existing IT budget (as it replaces the labor costs of manual filing and lost paperwork). However, to generate revenue or offset hosting costs, a Freemium/Micro-transaction Model is proposed:

Free Tier (Basic): Students can store verified achievements, export basic verified records, and request standard recommendation letters at no cost. Hosting costs are minimal as the system runs on Node.js and SQLite.

Premium Tier (The Cash Flow): Students can pay a small fee for "Premium Career Services." This includes:

Expedited Processing: Letters are prioritized in the lecturer's queue.

Final Proofreading & Formatting: The system (or an outsourced university staff member) proofreads the final draft and formats it as a polished, professional PDF with the university seal.

Tailored Letters: The student can generate multiple versions of the letter tailored to specific industries (e.g., one for Engineering, one for Management).

3. Tailored vs. Standardized Letters
Should students pay for a fully drafted, proofread letter, or should it tailor to their needs?
The business answer is: Both, but under the paid tier.
A generic letter has low value. A tailored letter (e.g., "Tendai demonstrated leadership in XYZ project") is highly valuable to employers. The system auto-generates tailored versions based on the student selecting different clusters of achievements. We charge for this personalization. Furthermore, human oversight is vital for institutional reputation, so the "Final Polish" service allows the Records Office to do a final proofread and apply the official digital seal.

4. Maintenance & Operational Costs
To keep the system running with minimal cost:

Low Infrastructure Cost: The current architecture (Node.js + SQLite) is incredibly cheap to host.

Self-Service: Most maintenance is handled by Administrators using the built-in "Users & Permissions" module.

Scalable Database: If the user base grows to hundreds of thousands, the database can be migrated from SQLite to PostgreSQL without changing the front-end code.

🛡️ Security Architecture & Risk Mitigation (Security Audit)
This system is built on a "Zero-Trust" architecture. The server acts as the ultimate authority, meaning the front-end browser is never trusted with sensitive logic. This protects the institution from data leaks, fraud, and unauthorized access.

1. Identity & Access Management (IAM)
Credential Protection: Passwords are never stored in plain text. They are secured using salted scrypt hashes. The system actively refuses weak or common passwords.

Brute-Force Prevention: Accounts are automatically locked for 15 minutes after five consecutive failed login attempts.

Mandatory Two-Step Sign-In (2FA): All logins require a one-time emailed code. This is mandatory for all staff accounts. If a code is entered incorrectly five times, the challenge is "burned" (destroyed).

Account Enumeration Prevention: Sign-up and password-reset responses are identical whether an email exists in the database or not, preventing attackers from guessing valid accounts.

2. Session Management & Anti-Forgery
Secure Sessions: Sessions are managed using a random cookie that JavaScript cannot read (HTTP-Only). The cookie is restricted to the same site (SameSite). Sessions end automatically after 1 hour of inactivity or 12 hours total.

Instant Revocation: Changing a password instantly invalidates the session hash, signing the user out of all other devices immediately.

CSRF Protection: Every data change requires a secret token tied to the user's active session. Requests originating from external websites are strictly refused.

3. Role-Based Access Control (RBAC) & Data Leakage
Server-Side Enforcement: A student's page can only ever receive that specific student's records.

Privacy Controls: Lecturers only receive the specific achievements a student has explicitly chosen to share, for the timeframe allowed.

Administrative Lockdown: Critical actions (verifying achievements, importing grades, managing users) require Administrator privileges, enforced on the server.

4. Data Integrity & Immutable Auditing
Honest Records: Statuses, verification tiers, and notifications are written entirely by the server logic. A user cannot manipulate the browser to fake an approval.

The Immutable Audit Log: The database is designed so that the audit log is append-only. The database physically refuses to allow anyone (even administrators) to change or delete an audit log entry, providing a tamper-proof paper trail for compliance.

5. Secure File Handling (Malware & Data Theft)
Strict Validation: The system only accepts real PDF, JPG, or PNG files up to 5 MB. It checks the actual file content, not just the extension.

Secure Storage: Uploaded files are renamed randomly and stored outside the public web folder. Only the file owner and administrators can open them.

6. Browser & Infrastructure Protections
Content Security Policy (CSP): A strict CSP only allows scripts explicitly marked by the server to run, mitigating Cross-Site Scripting (XSS).

Anti-Framing: The system refuses to be embedded in iframes (preventing Clickjacking).

No Content-Type Guessing: The browser is forbidden from guessing file types, preventing MIME-sniffing attacks.

🗄️ Database Setup Details
This project uses SQLite, meaning the database is created automatically upon the first run. You do not need to install MySQL or PostgreSQL.

Database Creation:
Upon running the server, a data/ folder is generated automatically. This contains the SQLite database file and uploaded files. The tables are generated by server/db.js, and demo accounts are injected by server/seed.js.

🗺️ A 10-Minute Tour
Create an account from the sign-in page. Open the confirmation link from the Demo mailbox, then sign in.

Student: Sign in as Tendai. Add an achievement and send it to the Sports Director. The email appears in the Demo mailbox.

Staff (without an account): Open that link in a private window. No login. Confirm it. Back as Tendai, it is Verified and says who confirmed it.

Admin: Sign in as Chipo. Open the queue, Flag for explanation on another item. As Tendai, explain it. As Chipo, verify it. Open the Audit Log.

Letters: As Tendai, New request to Dr. Dube and tick two achievements. As Dr. Dube, accept it, open the profile (only those two are visible), edit the draft and approve it.

Privacy: As Tendai, Sharing & Privacy: turn off Academic Record, create a share link, revoke Dr. Dube. As Dr. Dube, Tendai disappears at once.

Documents: Upload a PDF and an image, preview and download them.

Proof for other institutions: Export verified record, then check its code on the verify page without signing in. Withdraw it and check again.

Grades: As Chipo, Academic Data Import: download the sample CSV, import it, and watch the student's GPA change (it is worked out from the grades).

Account & security: Change a password, see devices and sign-in history.

📁 Project Structure & Files
text
server/server.js         web server, sign-in, sessions, files, admin actions
server/store.js          what each person may see and change
server/auth.js           passwords, sessions, codes, rate limits
server/db.js             database tables (the audit table is append-only)
server/mail.js           outgoing email (stored, not sent)
server/seed.js           demo accounts and sample data
server/create-admin.js   first administrator for a fresh install
index.html, js/auth-page.js   sign in, create account, reset password
pages/                   one file per screen
js/data.js, js/app.js    load data from the server, save changes, shared screen code
css/style.css            the theme
data/                    created at start: database and uploaded files (back this up)
🗺️ Project Development Roadmap
Phase 1: Core System (Completed)
☑ Implement secure user authentication (Two-step sign-in, scrypt hashing).
☑ Build SQLite database with immutable audit logging.
☑ Develop role-based access control (Students, Lecturers, Admins).
☑ Enable secure file uploads (PDF/JPG validation).
☑ Implement achievement tracking and verification workflows.
Phase 2: Automation & Analytics (In Progress)
□ Automate the GPA calculation from imported Records Office CSVs.
□ Implement the "Premium Tier" payment gateway for tailored recommendation letters.
□ Build the attachment supervisor module (attendance, tasks, assessments).
Phase 3: Scalability & Integration (Future Scope)
□ Migrate database from SQLite to PostgreSQL for high-traffic scalability.
□ Integrate real SMTP email servers for automated one-time passcodes.
□ Develop a public API for third-party employer verification.
⚙️ Settings (Environment Variables)
Variable	Meaning	Default
PORT	Port to listen on	3000
HOST	Address to listen on. Anything other than 127.0.0.1 turns the development tools off	127.0.0.1
AU_DEV	0 turns off the demo mailbox and demo-account list. Set 1 to force them on	on only for 127.0.0.1
AU_NO_SEED	1 starts with an empty database (no demo accounts)	off
AU_DATA_DIR	Where the database and uploaded files live	data/
AU_SECURE	1 marks the cookie Secure (use behind HTTPS)	off
AU_MAIL_LOG	1 prints outgoing email to the console when dev tools are off	off
🛠️ Before Real Use (Production Notes)
This is a working system, but these steps are still yours to do:

Real email: server/mail.js stores messages instead of sending them. Replace send() with your SMTP or email service. Nothing else changes.

HTTPS: Put it behind HTTPS (a reverse proxy such as Nginx or Caddy) and set AU_SECURE=1. Never expose it over plain HTTP.

No demo accounts: Start with AU_NO_SEED=1, then create the first administrator: node server/create-admin.js you@africau.edu "Your Name". It prints a one-time link for choosing a password.

Back up the data/ folder (database and files) regularly.

Link grades to students: Grades attach to students by student ID. Make sure the Records Office export uses the same IDs that students sign up with.

Decisions from the workshop that are still open: whether finished letters can be downloaded, who may receive them, and whether disciplinary records are ever stored (they are not here).

For many users, move from SQLite to a server database and add monitoring. The code that talks to the database is in server/store.js.

🚧 Not Built Yet
The attachment supervisor module (attendance, tasks, assessment), trusted helpers, and separate logins for each kind of external verifier (they use the email link).
```

For anyone editing the code: never write a closing body tag as text inside a script.
