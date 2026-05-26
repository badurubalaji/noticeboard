/**
 * Refuses to start the server with insecure default secrets, weak secrets,
 * or missing required env values. Called from app.js before listen().
 */
const KNOWN_DEFAULT_SECRETS = new Set([
  'noticeboard-dev-secret-change-in-production-2026',
  'noticeboard-refresh-secret-change-in-production-2026',
  'your-jwt-secret-change-in-production',
  'your-refresh-secret-change-in-production',
  'changeme',
  'secret',
]);

function die(msg) {
  console.error('\n❌ Startup blocked:', msg);
  console.error(
    '\n   Fix this by running ./setup.sh (one-click setup), or edit server/.env manually.\n' +
    '   Generate a strong secret with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64\'))"\n'
  );
  process.exit(1);
}

function checkSecret(name, value) {
  if (!value) die(`${name} is not set in .env`);
  if (KNOWN_DEFAULT_SECRETS.has(value)) die(`${name} is the documented placeholder value — generate a real one.`);
  if (value.length < 32) die(`${name} is too short (${value.length} chars) — needs at least 32.`);
}

function validateEnv() {
  if (!process.env.MONGODB_URI) die('MONGODB_URI is not set in .env');
  checkSecret('JWT_SECRET', process.env.JWT_SECRET);
  checkSecret('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET);
  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    die('JWT_SECRET and JWT_REFRESH_SECRET must be different.');
  }
}

module.exports = { validateEnv };
