const rateLimit = require('express-rate-limit');

const baseOpts = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Use the client IP (already validated by trust-proxy + LAN allowlist).
  message: { error: 'Too many requests — please slow down and try again in a minute.' },
};

// Tight limit on login attempts to block credential brute-force.
const loginLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 1000,
  max: 8, // 8 attempts per minute per IP
});

// Refresh is fine to call more often, but still cap it.
const refreshLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 1000,
  max: 30,
});

// Registration: aggressive cap (anti-spam in multi-tenant deployments).
const registerLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
});

module.exports = { loginLimiter, refreshLimiter, registerLimiter };
