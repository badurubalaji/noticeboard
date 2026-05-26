const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  color: { type: String, default: '#3B82F6' },
  icon: { type: String, default: 'folder' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

categorySchema.index({ tenantId: 1, name: 1 }, { unique: true });
categorySchema.index({ tenantId: 1, order: 1 });

module.exports = mongoose.model('Category', categorySchema);
