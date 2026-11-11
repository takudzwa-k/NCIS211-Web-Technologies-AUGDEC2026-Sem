'use strict';
// Checks your email settings:   node server/test-mail.js you@example.com
require('./env');
const smtp = require('./smtp');
const to = process.argv[2], cfg = smtp.settings();
if (!cfg) { console.error('No mail account is set up. Copy .env.example to .env and fill in the AU_SMTP_ lines.'); process.exit(1); }
if (!to) { console.error('Usage: node server/test-mail.js you@example.com'); process.exit(1); }
console.log(`Sending a test message to ${to} through ${cfg.host}:${cfg.port} (${cfg.mode}) ...`);
smtp.send({ to, subject: 'Test from the AU portal', text: 'If you can read this, the portal can send email.', html: '<p>If you can read this, <b>the portal can send email</b>.</p>' }, cfg)
  .then(() => console.log('Sent. Check the inbox (and the spam folder).'))
  .catch(e => { console.error('Failed: ' + e.message); process.exit(1); });
