# AU Student Achievement & Recommendation Profile

A working portal with a real server and database. Students and alumni record achievements, staff verify them, lecturers write letters, and the Records Office imports official grades. Sign-in, permissions, files and the audit trail are enforced on the server.

No packages to install. It uses only what comes with Node.

## Run it

1. You need **Node.js 22.5 or newer**. Check with `node --version`. If it is older, install a current version from nodejs.org (or with `nvm install 22`).
2. In this folder run:

   ```
   node server/server.js
   ```
3. Open **http://localhost:3000** in your browser.

The first start creates the database in the `data/` folder and fills it with demo accounts. **Do not open the pages with VS Code Live Server any more.** It only serves files, so there would be no server to sign in to.

## Sign in

The sign-in page lists demo accounts in development mode. Click one to fill in the email and the shared demo password (`Demo-Passw0rd!`), then press **Sign in**.

Every sign-in sends a one-time code by email. Real email is not connected yet, so open the **Demo mailbox** (link on the sign-in page and in the profile menu) and type the 6-digit code from the newest message.

| Role | Name | Email |
|---|---|---|
| Student | Tendai Moyo | t.moyo@students.africau.edu |
| Alumni | Rudo Chikwanha | r.chikwanha@alumni.africau.edu |
| Lecturer | Dr. N. Dube | n.dube@africau.edu |
| Admin | Chipo Nyathi | c.nyathi@africau.edu |

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

## Settings (environment variables)

| Variable | Meaning | Default |
|---|---|---|
| `PORT` | Port to listen on | 3000 |
| `HOST` | Address to listen on. Anything other than `127.0.0.1` turns the development tools off | 127.0.0.1 |
| `AU_DEV` | `0` turns off the demo mailbox and demo-account list. Set `1` to force them on | on only for 127.0.0.1 |
| `AU_NO_SEED` | `1` starts with an empty database (no demo accounts) | off |
| `AU_DATA_DIR` | Where the database and uploaded files live | `data/` |
| `AU_SECURE` | `1` marks the cookie Secure (use behind HTTPS) | off |
| `AU_MAIL_LOG` | `1` prints outgoing email to the console when dev tools are off | off |

## Before real use

This is a working system, but these steps are still yours to do:

1. **Real email.** `server/mail.js` stores messages instead of sending them. Replace `send()` with your SMTP or email service. Nothing else changes.
2. **HTTPS.** Put it behind HTTPS (a reverse proxy such as Nginx or Caddy) and set `AU_SECURE=1`. Never expose it over plain HTTP.
3. **No demo accounts.** Start with `AU_NO_SEED=1`, then create the first administrator: `node server/create-admin.js you@africau.edu "Your Name"`. It prints a one-time link for choosing a password.
4. **Back up** the `data/` folder (database and files) regularly.
5. **Link grades to students.** Grades attach to students by student ID. Make sure the Records Office export uses the same IDs that students sign up with.
6. **Decisions from the workshop** that are still open: whether finished letters can be downloaded, who may receive them, and whether disciplinary records are ever stored (they are not here).
7. For many users, move from SQLite to a server database and add monitoring. The code that talks to the database is in `server/store.js`.

## Not built

The attachment supervisor module (attendance, tasks, assessment), trusted helpers, and separate logins for each kind of external verifier (they use the email link).

## Files

```
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
```

For anyone editing the code: never write a closing body tag as text inside a script.
