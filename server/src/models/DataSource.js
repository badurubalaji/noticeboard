const mongoose = require('mongoose');

const dataSourceSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Data source name is required'],
    trim: true,
    maxlength: [80, 'Name cannot exceed 80 characters'],
  },
  description: { type: String, default: '', maxlength: 300 },
  // 'url' = live HTTP endpoint, polled on refreshInterval.
  // 'json' = static JSON payload pasted/uploaded once; never polled.
  sourceType: { type: String, enum: ['url', 'json'], default: 'url' },
  url: {
    type: String,
    default: '',
    trim: true,
  },
  method: { type: String, enum: ['GET', 'POST'], default: 'GET' },
  headers: { type: mongoose.Schema.Types.Mixed, default: {} },
  body: { type: mongoose.Schema.Types.Mixed, default: null },
  refreshInterval: {
    type: Number,
    default: 300,           // seconds
    min: 30,
    max: 24 * 60 * 60,
  },
  dataPath: { type: String, default: '' }, // dot-path to drill into response (e.g. "result.rows")
  isActive: { type: Boolean, default: true },
  data: { type: mongoose.Schema.Types.Mixed, default: null },          // last successful payload
  lastFetchedAt: { type: Date, default: null },
  lastFetchStatus: { type: String, enum: ['success', 'error', 'never'], default: 'never' },
  lastError: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

dataSourceSchema.path('url').validate(function (value) {
  // 'json' sources don't need a URL; 'url' sources do.
  if (this.sourceType === 'json') return true;
  return !!(value && value.trim());
}, 'URL is required for URL-based data sources');

dataSourceSchema.index({ tenantId: 1, isActive: 1 });

module.exports = mongoose.model('DataSource', dataSourceSchema);
