const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const slugify = require('slugify');
const { ROLES, ROLE_PERMISSIONS } = require('../config/constants');

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { accessToken, refreshToken };
};

/**
 * Register a new tenant and owner user
 */
exports.register = async (req, res, next) => {
  try {
    const { companyName, industry, name, email, password } = req.body;

    if (!companyName || !name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required: companyName, name, email, password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Create tenant
    let slug = slugify(companyName, { lower: true, strict: true });
    const existingSlug = await Tenant.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const tenant = await Tenant.create({
      name: companyName,
      slug,
      industry: industry || 'Other',
    });

    // Create owner user
    const user = await User.create({
      tenantId: tenant._id,
      email,
      passwordHash: password,
      name,
      role: ROLES.OWNER,
      permissions: ROLE_PERMISSIONS.owner,
    });

    const tokens = generateTokens(user._id);

    res.status(201).json({
      message: 'Registration successful',
      user: user.toJSON(),
      tenant,
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const tenant = await Tenant.findById(user.tenantId);
    const tokens = generateTokens(user._id);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      tenant,
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    // Tenant must still exist and be active — otherwise long-lived refresh
    // tokens keep working after the tenant is deactivated.
    const tenant = await Tenant.findById(user.tenantId).select('isActive').lean();
    if (!tenant || !tenant.isActive) {
      return res.status(401).json({ error: 'Tenant deactivated' });
    }

    const tokens = generateTokens(user._id);
    res.json(tokens);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

/**
 * Get current user
 */
exports.getMe = async (req, res, next) => {
  try {
    // Explicit projection — never lean to JSON anything we didn't ask for.
    const user = await User.findById(req.user._id).select('email name avatar role permissions isActive lastLogin tenantId');
    const tenant = await Tenant.findById(req.tenantId).select('name slug industry branding settings isActive');
    res.json({ user, tenant });
  } catch (error) {
    next(error);
  }
};
