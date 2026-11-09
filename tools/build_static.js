// Runs the SQLite -> static JSON export in an isolated child process.
// better-sqlite3 is a native addon that requires Node >= 22 and can hard-crash
// (segfault) on older runtimes. A crash there must not fail the whole build:
// the repo already contains a committed snapshot in public/api, so we fall back to it.
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const result = spawnSync(process.execPath, [path.join(__dirname, 'export_static.js')], {
  stdio: 'inherit',
  cwd: root
});

if (result.status !== 0) {
  const reason = result.signal ? 'signal ' + result.signal : 'exit code ' + result.status;
  console.warn(`[build] Static catalog export failed (${reason}) on Node ${process.version}.`);
  const snapshot = path.join(root, 'public', 'api', 'products.json');
  if (!fs.existsSync(snapshot)) {
    console.error('[build] No committed public/api snapshot found; cannot continue.');
    process.exit(1);
  }
  console.warn('[build] Using the committed public/api catalog snapshot instead.');

  const homeBuild = path.join(root, 'public', 'build', 'home.html');
  if (fs.existsSync(homeBuild)) {
    fs.copyFileSync(homeBuild, path.join(root, 'public', 'index.html'));
    console.log('Synchronized public/index.html with public/build/home.html');
  }
}
