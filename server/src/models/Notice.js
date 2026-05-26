const mongoose = require('mongoose');
const { NOTICE_STATUS, NOTICE_TYPES, NOTICE_SIZES, RECURRENCE_TYPES, TRANSITIONS } = require('../config/constants');

const mediaItemSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video'], required: true },
  thumbnail: { type: String, default: '' },
  filename: { type: String, default: '' },
  size: { type: Number, default: 0 },
}, { _id: false });

const noticeSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Notice title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  content: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: NOTICE_TYPES,
    default: 'text',
  },
  media: [mediaItemSchema],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },
  tags: [{ type: String, trim: true }],
  displayConfig: {
    size: { type: String, enum: NOTICE_SIZES, default: 'medium' },
    gridSpan: {
      cols: { type: Number, default: 1, min: 1, max: 6 },
      rows: { type: Number, default: 1, min: 1, max: 4 },
    },
    bgColor: { type: String, default: '' },
    textColor: { type: String, default: '' },
    animation: { type: String, enum: TRANSITIONS, default: 'none' },
  },
  schedule: {
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    recurrence: { type: String, enum: RECURRENCE_TYPES, default: 'none' },
    timeSlots: [{
      start: { type: String }, // "09:00"
      end: { type: String },   // "17:00"
      _id: false,
    }],
  },
  sharing: {
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPublic: { type: Boolean, default: false },
    shareLink: { type: String, default: '' },
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    default: null,
  },
  status: {
    type: String,
    enum: Object.values(NOTICE_STATUS),
    default: NOTICE_STATUS.DRAFT,
  },
  viewCount: { type: Number, default: 0 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for common queries
noticeSchema.index({ tenantId: 1, status: 1, priority: 1 });
noticeSchema.index({ tenantId: 1, category: 1 });
noticeSchema.index({ tenantId: 1, createdAt: -1 });
noticeSchema.index({ tenantId: 1, 'schedule.startDate': 1, 'schedule.endDate': 1 });
noticeSchema.index({ tenantId: 1, tags: 1 });

module.exports = mongoose.model('Notice', noticeSchema);
