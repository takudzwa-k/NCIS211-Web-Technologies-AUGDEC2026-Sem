/* Sign-in page: sign in, two-step code, create account, password reset. Everything is checked again on the server. */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const panels = ['login-form', 'code-form', 'signup-form', 'sent-panel', 'reset-form'];
  let challenge = '', dev = false, demoPassword = '';

  function show(id) { panels.forEach(p => { $(p).style.display = p === id ? '' : 'none'; }); document.querySelectorAll('.devhint').forEach(e => { e.style.display = dev ? '' : 'none'; }); window.scrollTo(0, 0); }
  function say(id, text, ok) { const n = $(id); n.textContent = text; n.style.display = text ? 'block' : 'none'; n.style.background = ok ? 'var(--green-tint)' : ''; n.style.color = ok ? 'var(--green)' : ''; }
  function post(url, body) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) })
      .then(r => r.json().catch(() => ({})).then(j => ({ ok: r.ok, status: r.status, json: j })));
  }
  const busy = (btn, on, label) => { btn.disabled = on; btn.textContent = on ? 'Please wait…' : label; };

  // already signed in? go straight to the portal
  fetch('/api/session', { credentials: 'same-origin' }).then(r => r.json()).then(j => { if (j.signedIn) window.location.replace(j.home); }).catch(() => say('notice', 'Cannot reach the portal server. Start it with  node server/server.js  and open http://localhost:3000 (not Live Server).'));
  if (new URLSearchParams(location.search).get('expired')) say('notice', 'You were signed out. Please sign in again.');

  /* ----- programme search: grouped list that narrows as you type ----- */
  function drawProgrammes() {
    const q = $('su-prog-search').value.trim().toLowerCase(), words = q.split(/\s+/).filter(Boolean), chosen = $('su-prog').value;
    const hits = PROGRAMMES.filter(p => words.every(w => p.name.toLowerCase().includes(w)));
    const group = lvl => { const items = hits.filter(p => p.level === lvl); return items.length ? '<optgroup label="' + lvl + ' (' + items.length + ')">' + items.map(p => `<option value="${p.name.replace(/"/g, '&quot;')}">${p.name}</option>`).join('') + '</optgroup>' : ''; };
    $('su-prog').innerHTML = hits.length ? group('Undergraduate') + group('Postgraduate') : '<option value="" disabled>No programme matches “' + $('su-prog-search').value.trim() + '”</option>';
    if (chosen) $('su-prog').value = chosen;
    $('prog-count').textContent = hits.length + ' of ' + PROGRAMMES.length;
  }
  $('su-prog-search').addEventListener('input', drawProgrammes);
  $('su-prog').addEventListener('change', () => { $('prog-picked').innerHTML = $('su-prog').value ? 'Selected: <b style="color:var(--text)">' + $('su-prog').value + '</b>' : 'Choose one from the list'; });
  drawProgrammes();

  fetch('/api/config').then(r => { if (!r.ok) throw 0; return r.json(); }).then(cfg => {
    dev = !!cfg.dev;
    if (dev) {
      fetch('/api/dev/accounts').then(r => r.json()).then(d => {
        demoPassword = d.password;
        $('demo').style.display = '';
        $('demo-chips').innerHTML = d.accounts.map((a, i) => `<button type="button" data-i="${i}">${esc(a.label || a.role)}: ${esc(a.name)}</button>`).join('');
        $('demo-note').textContent = 'Click one to fill in the email and the shared demo password. Real accounts are made with Create account.';
        $('demo-chips').querySelectorAll('button').forEach(b => b.onclick = () => { $('email').value = d.accounts[b.dataset.i].email; $('password').value = demoPassword; });
      }).catch(() => say('notice', 'Cannot reach the portal server. Start it with  node server/server.js  and open http://localhost:' + (location.port || 3000) + ' (not Live Server).'));
    }
  });

  /* ----- sign in ----- */
  $('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const email = $('email').value.trim(), password = $('password').value, btn = e.target.querySelector('button[type=submit]');
    if (!email || !password) return say('notice', 'Enter your email address and password.');
    say('notice', ''); busy(btn, true);
    post('/api/login', { email, password }).then(r => {
      busy(btn, false, 'Sign in');
      if (!r.ok) return say('notice', r.json.error || 'Could not sign in.');
      if (r.json.step === 'otp') { challenge = r.json.challenge; $('code-email').textContent = r.json.email; $('code').value = ''; say('code-notice', ''); show('code-form'); $('code').focus(); }
      else window.location.href = r.json.home;
    });
  });
  $('code-form').addEventListener('submit', e => {
    e.preventDefault(); const btn = e.target.querySelector('button[type=submit]');
    busy(btn, true);
    post('/api/login/otp', { challenge, code: $('code').value }).then(r => {
      busy(btn, false, 'Verify and sign in');
      if (!r.ok) { say('code-notice', r.json.error || 'That code is not right.'); if (r.status === 401 && /expired|Too many/.test(r.json.error || '')) { challenge = ''; } return; }
      window.location.href = r.json.home;
    });
  });
  $('resend').addEventListener('click', e => { e.preventDefault(); post('/api/login/resend', { challenge }).then(r => say('code-notice', r.ok ? 'A new code has been sent.' : (r.json.error || 'Could not send a code.'), r.ok)); });
  $('back-login').addEventListener('click', e => { e.preventDefault(); show('login-form'); });

  /* ----- forgot password ----- */
  $('forgot').addEventListener('click', e => { e.preventDefault(); $('reset-email').value = $('email').value; say('reset-notice', ''); show('reset-form'); });
  $('reset-form').addEventListener('submit', e => {
    e.preventDefault();
    const email = $('reset-email').value.trim(); if (!/^\S+@\S+\.\S+$/.test(email)) return say('reset-notice', 'Enter a valid email address.');
    post('/api/forgot', { email }).then(r => say('reset-notice', r.ok ? 'If this address is registered, a reset link is on its way.' : (r.json.error || 'Please try again later.'), r.ok));
  });
  $('back-login-2').addEventListener('click', e => { e.preventDefault(); show('login-form'); });

  /* ----- create account ----- */
  $('to-signup').addEventListener('click', e => { e.preventDefault(); say('signup-notice', ''); show('signup-form'); });
  $('to-login').addEventListener('click', e => { e.preventDefault(); show('login-form'); });
  $('sent-back').addEventListener('click', e => { e.preventDefault(); show('login-form'); });
  const type = () => document.querySelector('[name=type]:checked').value;
  document.querySelectorAll('[name=type]').forEach(r => r.addEventListener('change', () => {
    $('grad-wrap').style.display = type() === 'Alumni' ? '' : 'none';
    $('su-email').placeholder = type() === 'Alumni' ? 'name@africau.edu' : 'name@africau.edu';
    $('su-email-hint').textContent = type() === 'Alumni' ? 'Use your university email, name@africau.edu' : 'Use your university email, name@africau.edu';
  }));
  function strength(pw) {
    let n = 0; if (pw.length >= 10) n++; if (pw.length >= 14) n++; if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) n++; if (/\d/.test(pw)) n++; if (/[^A-Za-z0-9]/.test(pw)) n++;
    return Math.min(n, 4);
  }
  $('su-pw').addEventListener('input', () => {
    const pw = $('su-pw').value, n = pw ? strength(pw) : 0;
    $('meter').style.width = (n * 25) + '%'; $('meter').style.background = ['#E5E7EB', '#C8102E', '#B45309', '#15803D', '#15803D'][n];
    $('meter-text').textContent = !pw ? 'At least 10 characters' : ['', 'Too weak', 'Getting better', 'Good', 'Strong'][n];
  });
  $('signup-form').addEventListener('submit', e => {
    e.preventDefault(); const btn = e.target.querySelector('button[type=submit]');
    const body = { type: type(), name: $('su-name').value.trim(), email: $('su-email').value.trim(), studentId: $('su-sid').value.trim(), programme: $('su-prog').value,
                   gradYear: $('su-grad').value.trim(), password: $('su-pw').value, consent: $('su-consent').checked };
    const missing = [['name', 'full name'], ['email', 'university email'], ['studentId', 'student ID'], ['programme', 'programme'], ['password', 'password']].filter(f => !body[f[0]]).map(f => f[1]);
    if (missing.length) return say('signup-notice', 'Please fill in: ' + missing.join(', ') + '.');
    if (body.password !== $('su-pw2').value) return say('signup-notice', 'The two passwords do not match.');
    if (!body.consent) return say('signup-notice', 'Please agree to how your information is used.');
    say('signup-notice', ''); busy(btn, true);
    post('/api/signup', body).then(r => {
      busy(btn, false, 'Create account');
      if (!r.ok) return say('signup-notice', r.json.error || 'Could not create the account.');
      show('sent-panel');
    });
  });
})();
