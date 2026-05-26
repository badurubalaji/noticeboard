const Tenant = require('../models/Tenant');

/**
 * Tenant middleware - ensures tenantId is available on every request
 * and the tenant exists and is active
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    // tenantId is set by auth middleware from JWT
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required.' });
    }

    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant || !tenant.isActive) {
      return res.status(404).json({ error: 'Tenant not found or inactive.' });
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { tenantMiddleware };
