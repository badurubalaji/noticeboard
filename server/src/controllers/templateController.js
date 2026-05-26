const Template = require('../models/Template');
const Notice = require('../models/Notice');

exports.list = async (req, res, next) => {
  try {
    const filter = {
      isActive: true,
      $or: [
        { tenantId: req.tenantId },
        { isSystem: true },
      ],
    };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.industry) filter.industry = req.query.industry;

    const templates = await Template.find(filter)
      .sort({ usageCount: -1, createdAt: -1 })
      .lean();
    res.json(templates);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      $or: [{ tenantId: req.tenantId }, { isSystem: true }],
    });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const template = await Template.create({
      ...req.body,
      tenantId: req.tenantId,
      isSystem: false,
      createdBy: req.user._id,
    });
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { tenantId, _id, isSystem, createdBy, createdAt, updatedAt, ...safe } = req.body;
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, isSystem: false },
      safe,
      { new: true, runValidators: true }
    );
    if (!template) return res.status(404).json({ error: 'Template not found or cannot edit system template' });
    res.json(template);
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const template = await Template.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId,
      isSystem: false,
    });
    if (!template) return res.status(404).json({ error: 'Template not found or cannot delete system template' });
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a notice from a template
 */
exports.instantiate = async (req, res, next) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      $or: [{ tenantId: req.tenantId }, { isSystem: true }],
    });
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const { fieldValues, ...noticeOverrides } = req.body;

    // Replace placeholders in HTML
    let html = template.html;
    if (fieldValues) {
      for (const [key, value] of Object.entries(fieldValues)) {
        html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
    }

    const notice = await Notice.create({
      tenantId: req.tenantId,
      createdBy: req.user._id,
      title: noticeOverrides.title || template.name,
      content: html,
      type: 'html',
      templateId: template._id,
      ...noticeOverrides,
    });

    // Increment usage count
    template.usageCount += 1;
    await template.save();

    res.status(201).json(notice);
  } catch (error) {
    next(error);
  }
};
