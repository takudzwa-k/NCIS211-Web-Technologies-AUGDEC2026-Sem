'use strict';
const fs = require('fs'), path = require('path');
const mode = (process.argv[2] || '').toLowerCase().replace(/^--?/, '');
const root = path.join(__dirname, '..');

if (mode === 'demo') {
  fs.copyFileSync(path.join(root, '.env.demo'), path.join(root, '.env'));
  console.log('\n  Switched to DEMO MODE (.env updated from .env.demo)');
  console.log('  AU_DEV=1, PORT=3001, AU_DATA_DIR=data-demo');
  console.log('  Start the server with: node server/server.js (or npm run demo)\n');
} else if (mode === 'live') {
  fs.copyFileSync(path.join(root, '.env.live'), path.join(root, '.env'));
  console.log('\n  Switched to LIVE MODE (.env updated from .env.live)');
  console.log('  AU_DEV=0, PORT=3000, AU_DATA_DIR=data');
  console.log('  Start the server with: node server/server.js (or npm run live)\n');
} else {
  console.log('\nUsage: node server/mode.js [demo|live]');
  console.log('  node server/mode.js demo  -> Switch .env to demo mode');
  console.log('  node server/mode.js live  -> Switch .env to live mode\n');
}

