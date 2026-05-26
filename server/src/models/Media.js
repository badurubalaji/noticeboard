const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  thumbnail: { type: String, default: '' },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true,
  },
  tags: [{ type: String, trim: true }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

mediaSchema.index({ tenantId: 1, type: 1 });
mediaSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('Media', mediaSchema);
