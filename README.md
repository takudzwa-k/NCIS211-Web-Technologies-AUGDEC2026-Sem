# AU Student Achievement & Recommendation Profile

A working portal with a real server and database. Students and alumni record achievements, staff verify them, lecturers write letters, and the Records Office imports official grades. Sign-in, permissions, files and the audit trail are enforced on the server.

No packages to install. It uses only what comes with Node.

## Run it

1. You need **Node.js 22.5 or newer** (uses native `node:sqlite`). Check with `node --version`. If it is older, install or switch with `nvm use 22` or `nvm use 25`.
2. Choose your run mode:

### Option A: Demo Mode (Recommended for testing & evaluation)
Pre-seeded with demo accounts, in-browser clickable quick-fill chips, and demo mailbox:
```bash
npm run demo
# or: node server/server.js --demo
```
Open **http://localhost:3001** in your browser.

### Option B: Live Mode (Production-ready)
Real SMTP email delivery, production database (`data/`), and strict security enforcement:
```bash
npm run live
# or: node server/server.js --live
```
Open **http://localhost:3000** in your browser.

### Option C: Shareable Public Links (For Lecturer Review & Live Presentation)
To create instant public HTTPS links that anyone (lecturer, reviewer, or your mobile phone) can open over the internet:
```bash
npm run share
# Or share individual modes:
# npm run share:demo
# npm run share:live
```
This automatically boots the server and generates secure public HTTPS links (via `localhost.run` / `pinggy`) without requiring any account or third-party installations.
> **Do not open the pages with VS Code Live Server.** It only serves files, so there would be no server or database to sign in to.

## Sign in

The sign-in page lists demo accounts in development mode. Click one to fill in the email and the shared demo password (`Demo-Passw0rd!`), then press **Sign in**.

Every sign-in sends a one-time code by email. Real email is not connected yet, so open the **Demo mailbox** (link on the sign-in page and in the profile menu) and type the 6-digit code from the newest message.

| Role | Name | Email | Plan / Note |
|---|---|---|---|
| Student (Premium) | Tendai Moyo | t.moyo@students.africau.edu | Premium Active (Expedited letters, tailored focus, executive CV) |
| Student (Free) | Tafadzwa Ncube | t.ncube@students.africau.edu | Standard Free Plan |
| Alumni | Rudo Chikwanha | r.chikwanha@alumni.africau.edu | Graduated Class of 2024 |
| Lecturer | Dr. N. Dube | n.dube@africau.edu | Faculty of Science & Technology |
| Supervisor | Mrs. R. Phiri | r.phiri@attachment.africau.edu | Econet Wireless / Industrial Partner |
| Admin | Chipo Nyathi | c.nyathi@africau.edu | Registry Administrator |

**Create account** on the sign-in page makes a real student or alumni account. It needs a university email address (name@africau.edu) and a six-digit student ID, and the account only works after the emailed link is opened. Lecturers and staff are invited by an administrator (Users & Permissions).

## What the server protects

- **Accounts:** passwords are stored as salted scrypt hashes. Weak and common passwords are refused. Five wrong passwords lock the account for 15 minutes.
- **Two-step sign-in:** an emailed code, always on for staff. Wrong codes burn the challenge after five tries.
- **Sessions:** a random cookie that JavaScript cannot read, same-site only, ended after one hour of inactivity or 12 hours in all. Only a hash of it is stored. Changing a password signs out every other device.
- **Forged requests:** every change needs a secret token tied to the session, and requests from other websites are refused.
- **Who can do what:** the server decides. A student's page can only ever receive that student's records. Lecturers receive only what a student has chosen to share, for the time they chose. Verifying, rejecting, importing grades and managing users need an administrator, whatever the browser sends.
- **Honest records:** statuses, tiers, who verified something, notifications and the audit log are written by the server. A page cannot invent them.
- **Files:** only real PDF, JPG or PNG files up to 5 MB are accepted, checked by content and not by name. They are stored outside the web folder under random names. Only the owner and administrators can open them.
- **Audit trail:** the database refuses to change or delete it.
- **Browser protection:** strict content security policy (only scripts the server marked may run), no framing, no content-type guessing.
- **No account guessing:** sign-up and password-reset replies are the same whether or not an email exists.

## A 10-minute tour

1. **Create an account** from the sign-in page. Open the confirmation link from the Demo mailbox, then sign in.
2. **Student:** sign in as Tendai. Add an achievement and send it to the *Sports Director*. The email appears in the Demo mailbox.
3. **Staff without an account:** open that link in a private window. No login. Confirm it. Back as Tendai, it is Verified and says who confirmed it.
4. **Admin:** sign in as Chipo. Open the queue, **Flag for explanation** on another item. As Tendai, explain it. As Chipo, verify it. Open the **Audit Log**.
5. **Letters:** as Tendai, *New request* to Dr. Dube and tick two achievements. As Dr. Dube, accept it, open the profile (only those two are visible), edit the draft and approve it.
6. **Privacy:** as Tendai, **Sharing & Privacy**: turn off Academic Record, create a share link, revoke Dr. Dube. As Dr. Dube, Tendai disappears at once.
7. **Documents:** upload a PDF and an image, preview and download them.
8. **Proof for other institutions:** **Export verified record**, then check its code on the verify page without signing in. Withdraw it and check again.
9. **Grades:** as Chipo, **Academic Data Import**: download the sample CSV, import it, and watch the student's GPA change (it is worked out from the grades).
10. **Account & security** (profile menu): change a password, see devices and sign-in history.

## Send real email

By default messages go to the Demo mailbox. To send them to real inboxes:

1. Copy `.env.example` to a new file called `.env` in the project folder.
2. Fill in the mail lines. For Gmail: turn on 2-Step Verification, create an **App password** at myaccount.google.com/apppasswords, then put your Gmail address and that 16-letter password in `AU_SMTP_USER` and `AU_SMTP_PASS`. The other Gmail lines are already filled in.
3. Test it: `node server/test-mail.js your.address@example.com` (check the spam folder the first time).
4. Restart the server. Confirmation links, sign-in codes, password resets, invitations and approval requests now arrive in real inboxes, and the demo mailbox shows whether each one was delivered.

Any mail account works (the university's mail server, Brevo, SendGrid and so on). Use the host, port and login they give you: port 465 with `AU_SMTP_SECURE=ssl`, or port 587 with `AU_SMTP_SECURE=starttls`. Set `AU_BASE_URL` to the address people use to reach the portal, because links inside emails are built from it. A link to `localhost` only works on your own computer.

## Settings (environment variables)

| Variable | Meaning | Default |
|---|---|---|
| `PORT` | Port to listen on | 3000 |
| `HOST` | Address to listen on. Anything other than `127.0.0.1` turns the development tools off | 127.0.0.1 |
| `AU_DEV` | `0` turns off the demo mailbox and demo-account list. Set `1` to force them on | on only for 127.0.0.1 |
| `AU_NO_SEED` | `1` starts with an empty database (no demo accounts) | off |
| `AU_DATA_DIR` | Where the database and uploaded files live | `data/` |
| `AU_SECURE` | `1` marks the cookie Secure (use behind HTTPS) | off |
| `AU_SMTP_HOST`, `AU_SMTP_PORT`, `AU_SMTP_SECURE`, `AU_SMTP_USER`, `AU_SMTP_PASS`, `AU_SMTP_FROM` | The mail account used to send real email (see `.env.example`) | not set: messages stay in the demo mailbox |
| `AU_BASE_URL` | Address used for links inside emails | http://localhost:PORT |
| `AU_MAIL_LOG` | `1` prints outgoing email to the console when dev tools are off | off |

## Before real use

This is a working system, but these steps are still yours to do:

1. **Real email.** See "Send real email" above. For real use, send from an address on the university's own domain (ask ICT for a mail account or relay) so messages are not marked as spam, and set `AU_DEV=0` so the demo mailbox is off.
2. **HTTPS.** Put it behind HTTPS (a reverse proxy such as Nginx or Caddy) and set `AU_SECURE=1`. Never expose it over plain HTTP.
3. **No demo accounts.** Start with `AU_NO_SEED=1`, then create the first administrator: `node server/create-admin.js you@africau.edu "Your Name"`. It prints a one-time link for choosing a password.
4. **Back up** the `data/` folder (database and files) regularly.
5. **Link grades to students.** Grades attach to students by student ID. Make sure the Records Office export uses the same IDs that students sign up with.
6. **Decisions from the workshop** that are still open: whether finished letters can be downloaded, who may receive them, and whether disciplinary records are ever stored (they are not here).
7. For many users, move from SQLite to a server database and add monitoring. The code that talks to the database is in `server/store.js`.

## Attachment Supervisor Portal

Industrial attachment supervisors (e.g. `Mrs. R. Phiri`) have dedicated access to:
- View attached students who have granted supervisory access.
- Review and generate **Industrial Attachment Evaluation & Assessment Letters** formatted with AU official letterhead.
- Add and directly verify workplace achievements, tasks, and competencies.
- Save and edit evaluation drafts before final submission.

## Premium Career Services

Students and alumni can upgrade to **Premium Career Services** (`pages/premium.html`):
- **Expedited Processing:** Letter requests appear flagged with `Expedited` at the top of lecturer and supervisor review queues.
- **Industry Tailoring:** Students can specify career tracks (Engineering, Management, NGO / Development, Research / Academia, Technology, Healthcare) to produce tailored recommendation drafts.
- **Executive PDF Letterhead:** Printable recommendation letters include AU executive letterhead, authenticity codes, and career services validation.
- **Verified CV Export:** Enhanced CVs with `PREMIUM VERIFIED` branding and online verification links.
- **Semester Payment Tracking:** Students submit payment receipts/references, and administrators verify and approve requests from the admin portal.

## Files

```
server/server.js         web server, sign-in, sessions, files, admin actions, mode banner
server/env.js            environment configuration and dual-mode flag resolver (--demo / --live)
server/mode.js           helper script to switch default mode in .env
server/store.js          what each person may see and change (students, lecturers, supervisors, admins)
server/auth.js           passwords, sessions, codes, rate limits
server/db.js             database tables and schema migrations (users, achievements, premium, audit)
server/mail.js, smtp.js  outgoing email (saved, and sent if a mail account is set up)
server/test-mail.js      checks your email settings
.env.demo, .env.live     environment templates for demo and live modes
server/seed.js           demo accounts (including Attachment Supervisor) and sample data
server/create-admin.js   first administrator for a fresh install
index.html, js/auth-page.js   sign in, demo chip picker, create account, reset password
pages/                   one file per screen (including cv-maker.html, opportunities.html, premium.html, find-students.html, reports.html, drafts.html)
js/data.js, js/app.js    load data from the server, save changes, shared navigation and styling
js/programmes.js         every programme students can choose (edit here to add or rename one)
css/style.css            the theme
data/                    live mode database and uploaded files
data-demo/               demo mode database and uploaded files
```

For anyone editing the code: never write a closing body tag as text inside a script.
