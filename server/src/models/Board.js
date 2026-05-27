const mongoose = require('mongoose');
const { DISPLAY_MODES, TRANSITIONS, SCROLL_DIRECTIONS } = require('../config/constants');

const boardSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Board name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  description: { type: String, default: '' },
  displayMode: {
    type: String,
    enum: DISPLAY_MODES,
    default: 'carousel',
  },
  layout: {
    columns: { type: Number, default: 3, min: 1, max: 6 },
    rows: { type: Number, default: 2, min: 1, max: 4 },
    gap: { type: Number, default: 16, min: 0, max: 64 },
  },
  carousel: {
    autoPlay: { type: Boolean, default: true },
    interval: { type: Number, default: 8, min: 3, max: 120 },
    transition: { type: String, enum: TRANSITIONS, default: 'slide' },
    pauseOnHover: { type: Boolean, default: true },
    showIndicators: { type: Boolean, default: true },
    showNavigation: { type: Boolean, default: false },
  },
  autoScroll: {
    enabled: { type: Boolean, default: false },
    speed: { type: Number, default: 30, min: 10, max: 200 },
    direction: { type: String, enum: SCROLL_DIRECTIONS, default: 'up' },
    pauseOnHover: { type: Boolean, default: true },
  },
  filters: {
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    priorities: [{ type: Number, min: 1, max: 5 }],
    tags: [{ type: String }],
    statuses: [{ type: String }],
  },
  theme: {
    // Background
    bgType:         { type: String, enum: ['color', 'image', 'video', 'gradient'], default: 'color' },
    bgColor:        { type: String, default: '#0F172A' },
    bgImage:        { type: String, default: '' },           // PNG/JPG/WebP/GIF URL
    bgVideo:        { type: String, default: '' },           // MP4/WebM URL — autoplays muted, looped
    bgGradient:     { type: String, default: '' },           // any valid CSS gradient value
    bgFit:          { type: String, enum: ['cover', 'contain', 'fill'], default: 'cover' },
    bgOpacity:      { type: Number, default: 100, min: 0, max: 100 },  // % opacity of the background itself
    bgOverlay:      { type: Number, default: 0, min: 0, max: 100 },    // % opacity of the overlay layer on top
    bgOverlayColor: { type: String, default: '#000000' },
    // Header / chrome
    headerVisible: { type: Boolean, default: true },
    headerText:    { type: String,  default: '' },
    clockVisible:  { type: Boolean, default: true },
    dateVisible:   { type: Boolean, default: true },
    logoVisible:   { type: Boolean, default: true },
    fontFamily:    { type: String,  default: '' },
    fontSize:      { type: String,  default: 'medium' },
  },
  externalDataSources: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    method: { type: String, enum: ['GET', 'POST'], default: 'GET' },
    headers: { type: mongoose.Schema.Types.Mixed, default: {} },
    body: { type: mongoose.Schema.Types.Mixed, default: null },
    refreshInterval: { type: Number, default: 300, min: 30 },
    fieldMapping: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
  }],
  pages: [{
    id: { type: String, required: true },
    name: { type: String, default: 'Page 1' },
    order: { type: Number, default: 0 },
    widgets: [{
      id: { type: String, required: true },
      type: { type: String, enum: ['chart', 'table', 'image', 'template', 'notice', 'section'], required: true },
      title: { type: String, default: '' },
      gridCol: { type: Number, default: 1, min: 1 },
      gridRow: { type: Number, default: 1, min: 1 },
      colSpan: { type: Number, default: 1, min: 1 },
      rowSpan: { type: Number, default: 1, min: 1 },
      config: {
        chartType: { type: String, enum: ['bar', 'line', 'pie', 'doughnut'] },
        chartData: {
          labels: [{ type: String }],
          values: [{ type: Number }],
          colors: [{ type: String }],
        },
        tableHeaders: [{ type: String }],
        tableRows: { type: [[String]], default: undefined },
        tableShowRowTotals: { type: Boolean, default: false },
        tableShowColumnTotals: { type: Boolean, default: false },
        tableRowTotalLabel: { type: String, default: 'Total' },
        tableColumnTotalLabel: { type: String, default: 'Total' },
        imageUrl: { type: String },
        imageFit: { type: String, enum: ['cover', 'contain', 'fill', 'none'], default: 'cover' },
        imageEdgeToEdge: { type: Boolean, default: false },
        imageWidthPct: { type: Number, default: 100, min: 10, max: 100 },
        imageHeightPct: { type: Number, default: 100, min: 10, max: 100 },
        imagePosition: { type: String, enum: ['center', 'top', 'bottom', 'left', 'right'], default: 'center' },
        imageBgColor: { type: String, default: '' },
        templateId: { type: String },
        templateData: { type: mongoose.Schema.Types.Mixed, default: {} },
        noticeId: { type: String },
        // ---- Data source binding ----
        dataSourceId: { type: String, default: '' },
        dataSourcePath: { type: String, default: '' },    // override DataSource.dataPath
        // Column mapping for tables: which keys of each item become columns
        dataSourceColumns: [{
          _id: false,
          key: { type: String, required: true },          // e.g. "name", "metrics.sales"
          label: { type: String, default: '' },           // header label (defaults to key)
        }],
        dataSourceRowLimit: { type: Number, default: 0, min: 0 },  // 0 = all
        // Chart mapping
        dataSourceLabelKey: { type: String, default: '' },
        dataSourceValueKey: { type: String, default: '' },
        // Text widget: simple template like "{{count}} active"
        dataSourceTextTemplate: { type: String, default: '' },
        // ---- Section widget (heading / divider) ----
        sectionTitle:     { type: String, default: '' },
        sectionSubtitle:  { type: String, default: '' },
        sectionIcon:      { type: String, default: '' },   // emoji or short text
        sectionCategoryId:{ type: String, default: '' },   // optional link to a Category
        sectionAlign:     { type: String, enum: ['left', 'center', 'right'], default: 'left' },
        sectionSize:      { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
        sectionStyle:     { type: String, enum: ['filled', 'outlined', 'underlined', 'plain'], default: 'filled' },
        sectionTextColor: { type: String, default: '' },   // empty = use theme default
        sectionBgColor:   { type: String, default: '' },
      },
      style: {
        bgColor: { type: String, default: '' },
        textColor: { type: String, default: '' },
        borderRadius: { type: Number, default: 16 },
        padding: { type: Number, default: 24 },
      },
    }],
  }],
  accessCode: { type: String, default: '' }, // Optional PIN for board access
  isActive: { type: Boolean, default: true },
  lastAccessedAt: { type: Date, default: null },
}, {
  timestamps: true,
});

boardSchema.index({ tenantId: 1, isActive: 1 });

module.exports = mongoose.model('Board', boardSchema);
