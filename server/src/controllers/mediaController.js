const Media = require('../models/Media');
const fs = require('fs');
const path = require('path');

exports.upload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    const media = await Media.create({
      tenantId: req.tenantId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      type: isVideo ? 'video' : 'image',
      uploadedBy: req.user._id,
    });

    res.status(201).json(media);
  } catch (error) {
    next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const filter = { tenantId: req.tenantId };
    if (req.query.type) filter.type = req.query.type;

    const media = await Media.find(filter)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email')
      .lean();
    res.json(media);
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const media = await Media.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!media) return res.status(404).json({ error: 'Media not found' });

    // Delete file from disk
    const filePath = path.join(process.env.UPLOAD_DIR || './uploads', media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    next(error);
  }
};
