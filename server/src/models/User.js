const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, ROLE_PERMISSIONS } = require('../config/constants');

const userSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
    select: false,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  avatar: { type: String, default: '' },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.VIEWER,
  },
  permissions: {
    type: [String],
    default: function () {
      return ROLE_PERMISSIONS[this.role] || ROLE_PERMISSIONS.viewer;
    },
  },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
}, {
  timestamps: true,
});

// Compound unique: same email can exist in different tenants
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1 });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Check permission
userSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

// Remove sensitive fields from JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
