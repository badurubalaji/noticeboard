const Category = require('../models/Category');

exports.list = async (req, res, next) => {
  try {
    const categories = await Category.find({ tenantId: req.tenantId, isActive: true })
      .sort({ order: 1, name: 1 })
      .lean();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const category = await Category.create({
      ...req.body,
      tenantId: req.tenantId,
    });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { tenantId, _id, createdAt, updatedAt, ...safe } = req.body;
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      safe,
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
