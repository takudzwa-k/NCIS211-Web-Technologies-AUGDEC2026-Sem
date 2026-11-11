'use strict';
// A small SMTP client (sends email through any normal mail account). Only Node's net and tls.
const net = require('net'), tls = require('tls'), os = require('os'), crypto = require('crypto');

function settings() {
  const host = process.env.AU_SMTP_HOST; if (!host) return null;
  const port = +process.env.AU_SMTP_PORT || (String(process.env.AU_SMTP_SECURE || 'ssl').toLowerCase() === 'starttls' ? 587 : 465);
  const mode = String(process.env.AU_SMTP_SECURE || (port === 465 ? 'ssl' : 'starttls')).toLowerCase();   // ssl | starttls | none
  const user = process.env.AU_SMTP_USER || '', pass = process.env.AU_SMTP_PASS || '';
  const from = process.env.AU_SMTP_FROM || user;
  return { host, port, mode, user, pass, from };
}
const bare = a => (/<([^>]+)>/.exec(a) || [null, a])[1].trim();
const clean = s => String(s).replace(/[\r\n]+/g, ' ').trim();
const b64lines = s => Buffer.from(s, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n');
const enc = s => (/^[\x20-\x7e]*$/.test(s) ? s : '=?UTF-8?B?' + Buffer.from(s, 'utf8').toString('base64') + '?=');

function buildMessage({ from, to, subject, text, html }) {
  const boundary = 'au' + crypto.randomBytes(12).toString('hex');
  const host = (bare(from).split('@')[1] || os.hostname());
  return [
    'From: ' + clean(from), 'To: ' + clean(to), 'Subject: ' + enc(clean(subject)), 'Date: ' + new Date().toUTCString(),
    'Message-ID: <' + crypto.randomBytes(12).toString('hex') + '@' + host + '>', 'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' + boundary + '"', '',
    '--' + boundary, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64lines(text),
    '--' + boundary, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64lines(html),
    '--' + boundary + '--', ''
  ].join('\r\n');
}

function send(msg, cfg) {
  cfg = cfg || settings();
  return new Promise((resolve, reject) => {
    let sock, buf = '', waiting = null, done = false;
    const fail = e => { if (!done) { done = true; try { sock.destroy(); } catch (_) {} reject(e instanceof Error ? e : new Error(String(e))); } };
    const wire = s => {
      sock = s; s.setEncoding('utf8'); s.setTimeout(20000, () => fail(new Error('The mail server did not answer in time.')));
      s.on('error', fail); s.on('data', d => { buf += d; pump(); });
    };
    function pump() {                                           // a reply is complete when a line is "250 text" (not "250-text")
      const lines = buf.split('\r\n'); if (lines.length < 2) return;
      const last = lines[lines.length - 2];
      if (/^\d{3} /.test(last) || /^\d{3}$/.test(last)) { const reply = lines.slice(0, -1); buf = ''; if (waiting) { const w = waiting; waiting = null; w(reply); } }
    }
    const reply = () => new Promise(res => { waiting = res; pump(); });
    const cmd = async (line, ok) => {
      if (line !== null) sock.write(line + '\r\n');
      const r = await reply(); const code = +r[r.length - 1].slice(0, 3);
      if (!ok.includes(code)) throw new Error('Mail server said: ' + r.join(' ').slice(0, 200));
      return r;
    };
    (async () => {
      const hello = 'EHLO ' + (os.hostname() || 'localhost');
      if (cfg.mode === 'ssl') { wire(tls.connect({ host: cfg.host, port: cfg.port, servername: cfg.host })); }
      else { wire(net.connect({ host: cfg.host, port: cfg.port })); }
      await cmd(null, [220]);
      let caps = await cmd(hello, [250]);
      if (cfg.mode === 'starttls') {
        await cmd('STARTTLS', [220]);
        sock.removeAllListeners('data'); sock.removeAllListeners('error'); sock.removeAllListeners('timeout');
        const plain = sock; buf = ''; wire(tls.connect({ socket: plain, servername: cfg.host }));
        caps = await cmd(hello, [250]);
      }
      if (cfg.user) {
        const advertised = caps.join(' ').toUpperCase();
        if (/AUTH[^\r]*PLAIN/.test(advertised) || !/AUTH/.test(advertised)) {
          await cmd('AUTH PLAIN ' + Buffer.from('\0' + cfg.user + '\0' + cfg.pass).toString('base64'), [235]);
        } else {
          await cmd('AUTH LOGIN', [334]); await cmd(Buffer.from(cfg.user).toString('base64'), [334]); await cmd(Buffer.from(cfg.pass).toString('base64'), [235]);
        }
      }
      await cmd('MAIL FROM:<' + bare(cfg.from) + '>', [250]);
      await cmd('RCPT TO:<' + bare(msg.to) + '>', [250, 251]);
      await cmd('DATA', [354]);
      const body = buildMessage({ from: cfg.from, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html }).replace(/^\./gm, '..');
      sock.write(body + '\r\n.\r\n'); const r = await reply();
      if (+r[r.length - 1].slice(0, 3) !== 250) throw new Error('Mail server said: ' + r.join(' ').slice(0, 200));
      try { sock.write('QUIT\r\n'); sock.end(); } catch (_) {}
      done = true; resolve(true);
    })().catch(fail);
  });
}
module.exports = { settings, send, buildMessage };
