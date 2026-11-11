'use strict';
// Outgoing email. Every message is saved to the "outbox" table (the demo mailbox shows it in development).
// If AU_SMTP_HOST is set, it is also sent for real through that mail account. See .env.example.
const { db } = require('./db');
const smtp = require('./smtp');
const DEV = process.env.AU_DEV !== '0';
try { db.exec('ALTER TABLE outbox ADD COLUMN status TEXT'); } catch (e) { /* already there */ }

const baseUrl = () => (process.env.AU_BASE_URL || 'http://localhost:' + (process.env.PORT || 3000)).replace(/\/$/, '');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function htmlOf(subject, body, link) {
  const code = /code is (\d{6})/.exec(body);
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#111827">
    <div style="font-size:13px;color:#C8102E;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:0 0 14px">Africa University · Achievement Portal</div>
    <h2 style="margin:0 0 14px;font-size:20px">${esc(subject)}</h2>
    <p style="line-height:1.6;margin:0 0 20px">${esc(body)}</p>
    ${code ? `<div style="font-size:30px;font-weight:700;letter-spacing:.2em;background:#FDECEE;color:#C8102E;border-radius:10px;text-align:center;padding:16px;margin:0 0 20px">${code[1]}</div>` : ''}
    ${link ? `<p style="margin:0 0 20px"><a href="${esc(link)}" style="background:#C8102E;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;display:inline-block">Open the link</a></p>
    <p style="font-size:12px;color:#6B7280;word-break:break-all;margin:0 0 20px">If the button does not work, copy this address into your browser:<br>${esc(link)}</p>` : ''}
    <p style="font-size:12px;color:#6B7280;margin:24px 0 0">If you did not expect this message, you can ignore it.</p></div>`;
}

function send(to, subject, body, link, kind) {
  const cfg = smtp.settings();
  const keep = DEV || !cfg;                    // when real email is on and dev tools are off, secrets are not kept in the database
  const r = db.prepare('INSERT INTO outbox (to_email, subject, body, link, kind, at, status) VALUES (?,?,?,?,?,?,?)')
    .run(to, subject, keep ? body : '(sent by email)', keep ? (link || '') : '', kind || '', Date.now(), cfg ? 'sending' : 'not sent (no mail account set up)');
  const id = Number(r.lastInsertRowid);
  if ((DEV || process.env.AU_MAIL_LOG === '1') && process.env.AU_QUIET !== '1') console.log(`[mail] to ${to}: ${subject}${link ? '\n       ' + link : ''}`);
  if (!cfg) return;
  const abs = link ? (/^https?:/.test(link) ? link : baseUrl() + link) : '';
  const text = body + (abs ? '\n\nOpen this link: ' + abs : '') + '\n\nIf you did not expect this message, you can ignore it.\n— Africa University Achievement Portal';
  const mark = s => db.prepare('UPDATE outbox SET status = ? WHERE id = ?').run(s, id);
  smtp.send({ to, subject, text, html: htmlOf(subject, body, abs) }, cfg)
    .then(() => mark('sent'))
    .catch(e => { mark('FAILED: ' + e.message.slice(0, 160)); console.error('[mail] could not send to ' + to + ': ' + e.message); });
}
module.exports = { send, DEV };
