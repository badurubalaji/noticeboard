const DataSource = require('../models/DataSource');
const { fetchOnce, applyDataPath } = require('../services/fetchDataSource');

const MAX_JSON_BYTES = 5 * 1024 * 1024;   // 5 MB upload cap

exports.uploadJson = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (req.file.size > MAX_JSON_BYTES) {
      return res.status(400).json({ error: `File too large (max ${MAX_JSON_BYTES / 1024 / 1024} MB)` });
    }
    let parsed;
    try {
      parsed = JSON.parse(req.file.buffer.toString('utf-8'));
    } catch (e) {
      return res.status(400).json({ error: `Invalid JSON: ${e.message}` });
    }
    // Only objects or arrays at the root — primitives (string/number/null)
    // aren't useful as a "data source" and complicate downstream rendering.
    if (parsed === null || (typeof parsed !== 'object')) {
      return res.status(400).json({ error: 'JSON must be an object or an array at the top level.' });
    }
    res.json({
      data: parsed,
      filename: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    next(err);
  }
};

const ALLOWED_FIELDS = ['name', 'description', 'sourceType', 'url', 'method', 'headers', 'body', 'refreshInterval', 'dataPath', 'isActive', 'data'];

function pickAllowed(body) {
  const out = {};
  for (const k of ALLOWED_FIELDS) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

exports.list = async (req, res, next) => {
  try {
    const sources = await DataSource.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(sources);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const ds = await DataSource.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!ds) return res.status(404).json({ error: 'Data source not found' });
    res.json(ds);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const payload = pickAllowed(req.body);
    // JSON sources don't go through the poller, so mark them "fetched now".
    if (payload.sourceType === 'json') {
      payload.lastFetchedAt = new Date();
      payload.lastFetchStatus = payload.data != null ? 'success' : 'never';
      payload.lastError = '';
    }
    const ds = await DataSource.create({
      ...payload,
      tenantId: req.tenantId,
      createdBy: req.user?._id || null,
    });
    res.status(201).json(ds);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const payload = pickAllowed(req.body);
    if (payload.sourceType === 'json' && payload.data !== undefined) {
      payload.lastFetchedAt = new Date();
      payload.lastFetchStatus = payload.data != null ? 'success' : 'never';
      payload.lastError = '';
    }
    const ds = await DataSource.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      payload,
      { new: true, runValidators: true }
    );
    if (!ds) return res.status(404).json({ error: 'Data source not found' });
    res.json(ds);
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const ds = await DataSource.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!ds) return res.status(404).json({ error: 'Data source not found' });
    res.json({ message: 'Data source deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * Test a configuration without saving — used by the "Test" button so the
 * admin can preview the response before storing it.
 */
exports.test = async (req, res, next) => {
  try {
    const cfg = pickAllowed(req.body);
    if (!cfg.url) return res.status(400).json({ error: 'URL is required' });
    const result = await fetchOnce(cfg);
    const preview = applyDataPath(result.data, cfg.dataPath || '');
    res.json({ ...result, preview });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger a fetch right now (admin clicked "Refresh") — persists the result.
 */
exports.refresh = async (req, res, next) => {
  try {
    const ds = await DataSource.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!ds) return res.status(404).json({ error: 'Data source not found' });
    if (ds.sourceType === 'json') {
      return res.status(400).json({ error: 'JSON sources are static and do not need refreshing.' });
    }

    const result = await fetchOnce(ds);
    ds.lastFetchedAt = new Date();
    ds.lastFetchStatus = result.status;
    ds.lastError = result.error || '';
    if (result.status === 'success') ds.data = result.data;
    await ds.save();
    res.json(ds);
  } catch (error) {
    next(error);
  }
};
