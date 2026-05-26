#!/usr/bin/env node
/**
 * Cross-platform setup for NoticeBoard.
 *
 *   node setup.js              # full setup + start
 *   node setup.js --reset      # wipe local DB, then setup
 *   node setup.js --no-seed    # skip demo data
 *   node setup.js --no-build   # skip Angular production build (dev mode)
 *   node setup.js --no-start   # do everything except `npm start`
 *
 * Wrapped by setup.sh (mac/Linux) and setup.cmd / setup.ps1 (Windows).
 * Those wrappers install Node + MongoDB first if missing, then call this.
 *
 * Assumes Node 18+ is already installed (the wrappers handle that).
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const net = require('net');

const ROOT = __dirname;
const SERVER = path.join(ROOT, 'server');
const CLIENT = path.join(ROOT, 'client');

// --- tiny logger ----------------------------------------------------------
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', cyan: '\x1b[36m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', gray: '\x1b[90m',
};
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (col, s) => useColor ? `${col}${s}${C.reset}` : s;
const step = (s) => console.log(`\n${c(C.cyan + C.bold, '▸')} ${c(C.bold, s)}`);
const ok   = (s) => console.log(`  ${c(C.green, '✔')} ${s}`);
const warn = (s) => console.log(`  ${c(C.yellow, '!')} ${s}`);
const fail = (s) => { console.error(`  ${c(C.red, '✕')} ${s}`); };

// --- args -----------------------------------------------------------------
const args = new Set(process.argv.slice(2));
const RESET    = args.has('--reset');
const NO_SEED  = args.has('--no-seed');
const NO_BUILD = args.has('--no-build');
const NO_START = args.has('--no-start');

// --- helpers --------------------------------------------------------------
function run(cmd, cmdArgs, opts = {}) {
  const res = cp.spawnSync(cmd, cmdArgs, {
    stdio: opts.silent ? 'pipe' : 'inherit',
    shell: process.platform === 'win32',
    cwd: opts.cwd || ROOT,
    env: { ...process.env, ...(opts.env || {}) },
  });
  if (res.status !== 0 && !opts.allowFail) {
    fail(`Command failed (${cmd} ${cmdArgs.join(' ')})`);
    if (opts.silent && res.stderr) console.error(res.stderr.toString());
    process.exit(res.status || 1);
  }
  return res;
}

function which(bin) {
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  const res = cp.spawnSync(cmd, [bin], { encoding: 'utf-8' });
  return res.status === 0 ? (res.stdout || '').split(/\r?\n/)[0].trim() : null;
}

function nodeMajor() {
  return parseInt(process.versions.node.split('.')[0], 10);
}

async function isMongoReachable(uri = 'mongodb://127.0.0.1:27017') {
  return new Promise((resolve) => {
    const { hostname, port } = new URL(uri.replace('mongodb://', 'http://'));
    const sock = net.createConnection({ host: hostname, port: parseInt(port || '27017'), timeout: 1200 });
    sock.once('connect', () => { sock.end(); resolve(true); });
    sock.once('error',   () => { resolve(false); });
    sock.once('timeout', () => { sock.destroy(); resolve(false); });
  });
}

function getLanIps() {
  const ips = [];
  for (const ifaces of Object.values(os.networkInterfaces() || {})) {
    for (const i of ifaces || []) if (i.family === 'IPv4' && !i.internal) ips.push(i.address);
  }
  return ips;
}

// --- banner ---------------------------------------------------------------
console.log();
console.log(c(C.bold, 'NoticeBoard — one-click setup'));
console.log(c(C.gray, '  Sets up everything to run on your local network. Nothing is exposed to the public internet.'));
console.log(c(C.gray, `  Detected platform: ${process.platform} ${process.arch}, Node ${process.version}`));

// --- step 1: Node version ------------------------------------------------
step('Checking Node.js');
if (nodeMajor() < 18) {
  fail(`Node ${process.version} is too old. Need Node 18 or newer.`);
  console.log(`  Install latest from https://nodejs.org and re-run setup.`);
  process.exit(1);
}
ok(`Node ${process.version}`);

// --- step 2: MongoDB -----------------------------------------------------
step('Checking MongoDB');
(async () => {
  const reachable = await isMongoReachable();
  if (reachable) {
    ok('MongoDB is running on localhost:27017');
  } else {
    warn('MongoDB is not reachable at mongodb://localhost:27017');
    console.log();
    if (process.platform === 'win32') {
      console.log(`  Install MongoDB Community:`);
      console.log(c(C.cyan, `      winget install MongoDB.Server`));
      console.log(`  After install, open Services and start "MongoDB Server (MongoDB)" — or restart your PC.`);
    } else if (process.platform === 'darwin') {
      console.log(`  Install MongoDB Community:`);
      console.log(c(C.cyan, `      brew tap mongodb/brew`));
      console.log(c(C.cyan, `      brew install mongodb-community`));
      console.log(c(C.cyan, `      brew services start mongodb-community`));
    } else {
      console.log(`  Install MongoDB Community: https://www.mongodb.com/docs/manual/administration/install-on-linux/`);
      console.log(`  Or with Docker:`);
      console.log(c(C.cyan, `      docker run -d --name mongo -p 27017:27017 mongo:7`));
    }
    console.log();
    console.log(c(C.yellow, '  Once MongoDB is running, re-run this setup.'));
    process.exit(1);
  }

  await runRest();
})().catch((err) => { fail(err.message); process.exit(1); });

// --- the rest of setup ---------------------------------------------------
async function runRest() {
  // 3. Generate / update .env
  step('Configuring secrets (.env)');
  const envPath = path.join(SERVER, '.env');
  const PLACEHOLDERS = [
    'noticeboard-dev-secret-change-in-production-2026',
    'noticeboard-refresh-secret-change-in-production-2026',
    'your-jwt-secret-change-in-production',
    'changeme',
  ];
  let regenerate = !fs.existsSync(envPath);
  if (!regenerate) {
    const existing = fs.readFileSync(envPath, 'utf-8');
    const m1 = existing.match(/^JWT_SECRET=(.*)$/m);
    const m2 = existing.match(/^JWT_REFRESH_SECRET=(.*)$/m);
    const weak = (m1 && PLACEHOLDERS.includes(m1[1].trim())) ||
                 (m2 && PLACEHOLDERS.includes(m2[1].trim())) ||
                 !m1 || !m2 || (m1[1] || '').length < 32 || (m2[1] || '').length < 32;
    if (weak) {
      fs.copyFileSync(envPath, envPath + '.bak');
      warn(`Existing .env had weak secrets — backed up to .env.bak and regenerating.`);
      regenerate = true;
    } else {
      ok('.env already configured — keeping it.');
    }
  }
  if (regenerate) {
    const jwt  = crypto.randomBytes(48).toString('base64');
    const jwtR = crypto.randomBytes(48).toString('base64');
    fs.writeFileSync(envPath, [
      '# NoticeBoard server configuration (generated by setup.js)',
      'PORT=3000',
      'HOST=0.0.0.0',
      'NODE_ENV=production',
      '',
      '# Restrict access to the same local network.',
      'LAN_ONLY=true',
      '',
      '# MongoDB',
      'MONGODB_URI=mongodb://localhost:27017/noticeboard',
      '',
      '# JWT — strong random values generated at setup time',
      `JWT_SECRET=${jwt}`,
      'JWT_EXPIRES_IN=7d',
      `JWT_REFRESH_SECRET=${jwtR}`,
      'JWT_REFRESH_EXPIRES_IN=30d',
      '',
      '# Uploads',
      'UPLOAD_DIR=./uploads',
      'MAX_FILE_SIZE=52428800',
      '',
      '# Dev origins (only used when running ng serve on :4200 separately)',
      'CORS_ORIGIN=http://localhost:4200',
      'SOCKET_CORS_ORIGIN=http://localhost:4200',
      '',
    ].join('\n'));
    ok(`Wrote ${envPath} with fresh random secrets.`);
  }

  // 4. Install deps
  step('Installing dependencies (this can take a minute)');
  run('npm', ['install', '--no-audit', '--no-fund'], { cwd: SERVER });
  ok('server/node_modules ready');
  run('npm', ['install', '--no-audit', '--no-fund'], { cwd: CLIENT });
  ok('client/node_modules ready');

  // 5. Optional: reset DB
  if (RESET) {
    step('Wiping local database');
    run('node', ['-e', `(async()=>{const m=require('mongoose');await m.connect(process.env.MONGODB_URI||'mongodb://localhost:27017/noticeboard');await m.connection.dropDatabase();console.log('  dropped');process.exit(0)})()`], { cwd: SERVER });
    ok('Database reset.');
  }

  // 6. Seed demo
  if (!NO_SEED) {
    step('Seeding demo data');
    run('node', ['src/scripts/seedDemo.js'], { cwd: SERVER, allowFail: true });
    ok('Seed step done.');
  }

  // 7. Build UI bundle
  if (!NO_BUILD) {
    step('Building the UI (production bundle)');
    const ng = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    run(ng, ['ng', 'build', '--configuration=production', '--no-progress'], { cwd: CLIENT });
    ok('Built to client/dist/client/browser/');
  }

  // 8. Start
  if (NO_START) {
    console.log();
    ok('Setup complete. Start manually with:');
    console.log(c(C.cyan, '      cd server && npm start'));
    return;
  }

  step('Starting NoticeBoard');
  const lanIps = getLanIps();
  console.log();
  console.log(c(C.bold, '  Once the server prints "🚀 NoticeBoard is ready", open one of these:'));
  console.log(`      • This computer:   ${c(C.cyan, 'http://localhost:3000')}`);
  for (const ip of lanIps) console.log(`      • Other devices:   ${c(C.cyan, `http://${ip}:3000`)}   ${c(C.gray, '(share with TVs/colleagues on the same network)')}`);
  console.log(c(C.gray, '\n  Press Ctrl-C to stop.\n'));

  const server = cp.spawn(process.execPath, ['src/app.js'], {
    cwd: SERVER, stdio: 'inherit',
    env: { ...process.env },
  });
  process.on('SIGINT',  () => server.kill('SIGINT'));
  process.on('SIGTERM', () => server.kill('SIGTERM'));
  server.on('exit', (code) => process.exit(code ?? 0));
}
