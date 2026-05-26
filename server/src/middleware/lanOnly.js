const ipaddr = require('ipaddr.js');

/**
 * Reject requests whose client IP is not on a private/local network.
 * Defends against accidental public exposure (e.g. someone port-forwards
 * the dev port to the internet by mistake).
 *
 * Disable with LAN_ONLY=false in .env if needed.
 */
function lanOnlyMiddleware(req, res, next) {
  if (process.env.LAN_ONLY === 'false') return next();

  const raw = req.ip || req.connection?.remoteAddress || '';
  if (!raw) return next();

  // Express reports IPv4-mapped IPv6 as ::ffff:10.0.0.1 — strip the prefix.
  const ip = raw.replace(/^::ffff:/, '');
  let parsed;
  try { parsed = ipaddr.parse(ip); } catch { return reject(res); }

  const allowed = new Set([
    'loopback', 'private', 'linkLocal', 'uniqueLocal', 'carrierGradeNat',
  ]);
  const range = parsed.range();
  if (allowed.has(range)) return next();
  return reject(res);

  function reject(r) {
    r.status(403).json({
      error: 'This server only accepts requests from the same network. ' +
             'External access is blocked by policy.',
    });
  }
}

module.exports = { lanOnlyMiddleware };
