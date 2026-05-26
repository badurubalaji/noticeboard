const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { ROLE_PERMISSIONS } = require('../config/constants');

exports.getTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (error) {
    next(error);
  }
};

// Settings the tenant admin is allowed to change. Quota fields
// (maxFileSize, maxNotices, maxBoards) are managed by platform admins only.
const TENANT_EDITABLE_SETTINGS = new Set(['timezone', 'dateFormat']);

exports.updateTenant = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.industry !== undefined) updates.industry = req.body.industry;
    if (req.body.branding !== undefined) updates.branding = req.body.branding;
    if (req.body.settings && typeof req.body.settings === 'object') {
      const safeSettings = {};
      for (const k of Object.keys(req.body.settings)) {
        if (TENANT_EDITABLE_SETTINGS.has(k)) safeSettings[k] = req.body.settings[k];
      }
      if (Object.keys(safeSettings).length > 0) {
        // Merge instead of overwrite, so quota fields are preserved.
        const current = await Tenant.findById(req.tenantId).select('settings').lean();
        updates.settings = { ...(current?.settings || {}), ...safeSettings };
      }
    }

    const tenant = await Tenant.findByIdAndUpdate(req.tenantId, updates, {
      new: true,
      runValidators: true,
    });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    res.json(tenant);
  } catch (error) {
    next(error);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.inviteUser = async (req, res, next) => {
  try {
    const { email, name, role, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    const user = await User.create({
      tenantId: req.tenantId,
      email,
      name,
      passwordHash: password,
      role: role || 'viewer',
      permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer,
    });

    res.status(201).json(user.toJSON());
  } catch (error) {
    next(error);
  }
};

const VALID_ROLES = new Set(Object.values({ OWNER: 'owner', ADMIN: 'admin', EDITOR: 'editor', VIEWER: 'viewer' }));

exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive, name } = req.body; // `permissions` intentionally
                                                 // not exposed — derived from role.
    const updates = {};
    if (role) {
      if (!VALID_ROLES.has(role)) return res.status(400).json({ error: 'Invalid role' });
      // Only the owner can grant the owner role.
      if (role === 'owner' && req.user.role !== 'owner') {
        return res.status(403).json({ error: 'Only the workspace owner can grant the owner role.' });
      }
      // Prevent the caller from demoting themselves and losing access.
      if (String(req.params.id) === String(req.user._id) && role !== req.user.role) {
        return res.status(400).json({ error: "You can't change your own role." });
      }
      updates.role = role;
      updates.permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
    }
    if (typeof isActive === 'boolean') {
      if (String(req.params.id) === String(req.user._id) && !isActive) {
        return res.status(400).json({ error: "You can't deactivate yourself." });
      }
      updates.isActive = isActive;
    }
    if (name) updates.name = name;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      updates,
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (error) {
    next(error);
  }
};
