'use strict';
/**
 * Africa University Student Profile System
 * Instant Public Tunnel & Share Generator
 * 
 * Creates shareable HTTPS links for Live mode (port 3000) and Demo mode (port 3001)
 * without requiring any paid subscriptions or account signups.
 * 
 * Usage:
 *   node server/share.js           (shares both Live and Demo)
 *   node server/share.js --demo    (shares Demo only)
 *   node server/share.js --live    (shares Live only)
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const args = process.argv.slice(2);
const shareLiveOnly = args.includes('--live');
const shareDemoOnly = args.includes('--demo');
const shareBoth = !shareLiveOnly && !shareDemoOnly;

const LIVE_PORT = 3000;
const DEMO_PORT = 3001;

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/auth-context`, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1200, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function startServer(mode) {
  const serverScript = path.join(__dirname, 'server.js');
  const child = spawn(process.execPath, [serverScript, mode === 'demo' ? '--demo' : '--live'], {
    stdio: 'ignore',
    detached: false
  });
  return child;
}

function startTunnel(port, name) {
  return new Promise((resolve) => {
    console.log(`Connecting secure tunnel for ${name} (port ${port})...`);
    
    // First try: ssh to localhost.run (zero npm install required)
    const ssh = spawn('ssh', [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ServerAliveInterval=30',
      '-o', 'ServerAliveCountMax=3',
      '-R', `80:localhost:${port}`,
      'nokey@localhost.run'
    ]);

    let urlFound = false;

    ssh.stdout.on('data', (data) => {
      const text = data.toString();
      // Match https://something.lhr.life or similar
      const m = text.match(/https:\/\/[a-zA-Z0-9\-\.]+\.lhr\.life/i) || text.match(/https:\/\/[a-zA-Z0-9\-\.]+/i);
      if (m && !urlFound) {
        urlFound = true;
        resolve({ process: ssh, url: m[0], method: 'localhost.run' });
      }
    });

    ssh.stderr.on('data', (data) => {
      const text = data.toString();
      const m = text.match(/https:\/\/[a-zA-Z0-9\-\.]+\.lhr\.life/i);
      if (m && !urlFound) {
        urlFound = true;
        resolve({ process: ssh, url: m[0], method: 'localhost.run' });
      }
    });

    ssh.on('error', (err) => {
      if (!urlFound) fallbackPinggy(port, name, resolve);
    });

    setTimeout(() => {
      if (!urlFound) fallbackPinggy(port, name, resolve);
    }, 6000);
  });
}

function fallbackPinggy(port, name, resolve) {
  const ssh = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=30',
    '-p', '443',
    '-R0:localhost:' + port,
    'a.pinggy.io'
  ]);

  let urlFound = false;
  ssh.stdout.on('data', (data) => {
    const text = data.toString();
    const m = text.match(/https:\/\/[a-zA-Z0-9\-\.]+\.a\.pinggy\.link/i);
    if (m && !urlFound) {
      urlFound = true;
      resolve({ process: ssh, url: m[0], method: 'pinggy' });
    }
  });

  ssh.stderr.on('data', (data) => {
    const text = data.toString();
    const m = text.match(/https:\/\/[a-zA-Z0-9\-\.]+\.a\.pinggy\.link/i);
    if (m && !urlFound) {
      urlFound = true;
      resolve({ process: ssh, url: m[0], method: 'pinggy' });
    }
  });

  setTimeout(() => {
    if (!urlFound) {
      resolve({ process: ssh, url: `http://localhost:${port} (Tunnel timed out - ensure internet connection)`, method: 'local' });
    }
  }, 7000);
}

async function main() {
  console.clear ? console.clear() : null;
  console.log(`\n===============================================================`);
  console.log(` AU Student Achievement & Recommendation Profile`);
  console.log(` Public Shareable Link Generator`);
  console.log(`===============================================================\n`);

  const activeProcesses = [];

  // Check if live server is running
  if (shareBoth || shareLiveOnly) {
    const isLiveUp = await checkPort(LIVE_PORT);
    if (!isLiveUp) {
      console.log(`Starting Live Mode server on port ${LIVE_PORT}...`);
      activeProcesses.push(startServer('live'));
      await new Promise(r => setTimeout(r, 1500));
    } else {
      console.log(`✓ Live Mode server is already running on port ${LIVE_PORT}.`);
    }
  }

  // Check if demo server is running
  if (shareBoth || shareDemoOnly) {
    const isDemoUp = await checkPort(DEMO_PORT);
    if (!isDemoUp) {
      console.log(`Starting Demo Mode server on port ${DEMO_PORT}...`);
      activeProcesses.push(startServer('demo'));
      await new Promise(r => setTimeout(r, 1500));
    } else {
      console.log(`✓ Demo Mode server is already running on port ${DEMO_PORT}.`);
    }
  }

  console.log(`\nEstablishing secure public HTTPS tunnels...\n`);

  let liveTunnel = null;
  let demoTunnel = null;

  if (shareBoth || shareLiveOnly) {
    liveTunnel = await startTunnel(LIVE_PORT, 'Live Portal');
    if (liveTunnel.process) activeProcesses.push(liveTunnel.process);
  }

  if (shareBoth || shareDemoOnly) {
    demoTunnel = await startTunnel(DEMO_PORT, 'Demo Portal');
    if (demoTunnel.process) activeProcesses.push(demoTunnel.process);
  }

  console.log(`\n` + `═`.repeat(70));
  console.log(`  🎉 SHAREABLE PUBLIC LINKS ARE ACTIVE!`);
  console.log(`═`.repeat(70) + `\n`);

  if (liveTunnel) {
    console.log(`  🟢 LIVE MODE (Production / Real Email Delivery):`);
    console.log(`     Link: \x1b[36m\x1b[1m${liveTunnel.url}\x1b[0m`);
    console.log(`     Purpose: Real student sign-ups, live email OTPs, genuine verification.`);
    console.log(``);
  }

  if (demoTunnel) {
    console.log(`  🧪 DEMO MODE (Presentation & Evaluation Mode):`);
    console.log(`     Link: \x1b[32m\x1b[1m${demoTunnel.url}\x1b[0m`);
    console.log(`     Purpose: Includes 1-click Demo Accounts & Demo Mailbox.`);
    console.log(`     Demo Accounts for Lecturer to Try:`);
    console.log(`       • Student (Premium):  t.moyo@students.africau.edu   (Pass: Demo-Passw0rd!)`);
    console.log(`       • Student (Free):     t.ncube@students.africau.edu  (Pass: Demo-Passw0rd!)`);
    console.log(`       • Supervisor:         r.phiri@attachment.africau.edu (Pass: Demo-Passw0rd!)`);
    console.log(`       • Lecturer:           n.dube@africau.edu            (Pass: Demo-Passw0rd!)`);
    console.log(`       • Administrator:      c.nyathi@africau.edu          (Pass: Demo-Passw0rd!)`);
    console.log(``);
  }

  console.log(`═`.repeat(70));
  console.log(`  💡 Share these HTTPS links with your lecturer or test them`);
  console.log(`     on your mobile phone or another computer.`);
  console.log(`  ⚠️  Keep this terminal window open while sharing.`);
  console.log(`     Press [Ctrl + C] to stop sharing when done.`);
  console.log(`═`.repeat(70) + `\n`);

  function cleanExit() {
    console.log(`\nStopping tunnels and services...`);
    activeProcesses.forEach(p => {
      try { p.kill('SIGINT'); } catch (e) {}
    });
    process.exit(0);
  }

  process.on('SIGINT', cleanExit);
  process.on('SIGTERM', cleanExit);
}

main().catch(err => {
  console.error('Share error:', err);
  process.exit(1);
});

