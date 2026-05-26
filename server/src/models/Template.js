const mongoose = require('mongoose');
const { INDUSTRIES } = require('../config/constants');

const templateFieldSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'textarea', 'image', 'number', 'date', 'color', 'select'], default: 'text' },
  defaultValue: { type: String, default: '' },
  options: [{ type: String }], // For select type
  required: { type: Boolean, default: false },
}, { _id: false });

const templateSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null, // null = system-wide template
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  description: { type: String, default: '', maxlength: 500 },
  thumbnail: { type: String, default: '' },
  category: {
    type: String,
    enum: ['announcement', 'alert', 'event', 'kpi', 'schedule', 'safety', 'custom'],
    default: 'custom',
  },
  industry: [{
    type: String,
    enum: INDUSTRIES,
  }],
  html: {
    type: String,
    required: [true, 'Template HTML is required'],
  },
  css: { type: String, default: '' },
  fields: [templateFieldSchema],
  isSystem: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

templateSchema.index({ tenantId: 1, category: 1 });
templateSchema.index({ isSystem: 1, industry: 1 });

module.exports = mongoose.model('Template', templateSchema);
