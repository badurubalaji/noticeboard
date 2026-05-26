const Board = require('../models/Board');

exports.list = async (req, res, next) => {
  try {
    const boards = await Board.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(boards);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const board = await Board.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!board) return res.status(404).json({ error: 'Board not found' });
    res.json(board);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const board = await Board.create({
      ...req.body,
      tenantId: req.tenantId,
    });
    res.status(201).json(board);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { tenantId, _id, createdAt, updatedAt, ...payload } = req.body;
    const board = await Board.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      payload,
      { new: true, runValidators: true }
    );
    if (!board) return res.status(404).json({ error: 'Board not found' });

    if (req.io) {
      req.io.to(`board:${board._id}`).emit('board:updated', board);
    }

    res.json(board);
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const board = await Board.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!board) return res.status(404).json({ error: 'Board not found' });
    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    next(error);
  }
};
