const mongoose = require('mongoose');
const { INDUSTRIES } = require('../config/constants');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tenant name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  industry: {
    type: String,
    enum: INDUSTRIES,
    default: 'Other',
  },
  branding: {
    logo: { type: String, default: '' },
    primaryColor: { type: String, default: '#3B82F6' },
    secondaryColor: { type: String, default: '#1E40AF' },
    accentColor: { type: String, default: '#F59E0B' },
    fontFamily: { type: String, default: 'Inter' },
    darkMode: { type: Boolean, default: false },
    customCSS: { type: String, default: '' },
    /**
     * How the company brand is shown across the app and on kiosks:
     *   'logo+text'  → logo image followed by the company name
     *   'text-only'  → just the company name (no logo)
     *   'logo-only'  → just the logo / image (no text)
     */
    brandStyle: { type: String, enum: ['logo+text', 'text-only', 'logo-only'], default: 'logo+text' },
    displayScreens: {
      showLogo: { type: Boolean, default: true },
      loadingTitle: { type: String, default: 'Loading board…' },
      loadingSubtitle: { type: String, default: 'Please wait a moment' },
      unavailableTitle: { type: String, default: 'Board not available' },
      unavailableSubtitle: { type: String, default: 'Please check the board URL or contact your administrator.' },
      emptyTitle: { type: String, default: 'No notices yet' },
      emptySubtitle: { type: String, default: 'Notices will appear here once published.' },
    },
    customFonts: [{
      _id: false,
      family: { type: String, required: true },
      url: { type: String, required: true },
    }],
  },
  subscription: {
    plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
    expiresAt: { type: Date, default: null },
  },
  settings: {
    timezone: { type: String, default: 'UTC' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    maxFileSize: { type: Number, default: 52428800 }, // 50MB
    maxNotices: { type: Number, default: 100 },
    maxBoards: { type: Number, default: 5 },
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

tenantSchema.index({ industry: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);
