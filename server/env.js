'use strict';
// Reads settings from .env, .env.demo, or .env.live in the project folder. Real environment variables win.
const fs = require('fs'), path = require('path');

const args = process.argv;
const isDemo = args.includes('--demo') || args.includes('-d') || process.env.AU_MODE === 'demo';
const isLive = args.includes('--live') || args.includes('-l') || process.env.AU_MODE === 'live';

function parseEnv(filePath, override) {
  try {
    const full = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '..', filePath);
    if (!fs.existsSync(full)) return false;
    fs.readFileSync(full, 'utf8').split(/\r?\n/).forEach(line => {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (m && !line.trim().startsWith('#')) {
        if (override || process.env[m[1]] === undefined) {
          process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
        }
      }
    });
    return true;
  } catch (e) {
    return false;
  }
}

const initialPort = process.env.PORT;

if (isDemo) {
  // Demo mode: read .env.demo (with override), fall back to defaults
  parseEnv('.env.demo', true);
  process.env.AU_DEV = '1';
  if (initialPort) process.env.PORT = initialPort;
  else if (!process.env.PORT || process.env.PORT === '3000') process.env.PORT = '3001';
  if (!process.env.AU_DATA_DIR || process.env.AU_DATA_DIR === 'data') process.env.AU_DATA_DIR = 'data-demo';
  process.env.AU_BASE_URL = process.env.AU_BASE_URL || ('http://localhost:' + process.env.PORT);
} else if (isLive) {
  // Live mode: read .env.live (with override)
  parseEnv('.env.live', true);
  process.env.AU_DEV = '0';
  if (initialPort) process.env.PORT = initialPort;
  else if (!process.env.PORT || process.env.PORT === '3001') process.env.PORT = '3000';
  if (!process.env.AU_DATA_DIR || process.env.AU_DATA_DIR === 'data-demo') process.env.AU_DATA_DIR = 'data';
  process.env.AU_BASE_URL = process.env.AU_BASE_URL || 'http://localhost:' + process.env.PORT;
} else {
  // Default mode: read .env
  if (!parseEnv('.env', false)) {
    parseEnv('.env.demo', false);
  }
}

module.exports = { isDemo, isLive };
