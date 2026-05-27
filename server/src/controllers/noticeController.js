const Notice = require('../models/Notice');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT, NOTICE_STATUS } = require('../config/constants');

/**
 * List notices (paginated, filtered)
 */
exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { tenantId: req.tenantId };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.priority) filter.priority = parseInt(req.query.priority);
    if (req.query.type) filter.type = req.query.type;
    if (req.query.createdBy) filter.createdBy = req.query.createdBy;
    if (req.query.search) {
      // Escape regex metacharacters so a search like `(a+)+$` can't trigger
      // catastrophic backtracking (ReDoS) against the DB.
      const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const safe = escapeRegex(req.query.search);
      filter.$or = [
        { title:   { $regex: safe, $options: 'i' } },
        { content: { $regex: safe, $options: 'i' } },
        { tags:    { $in: [new RegExp(safe, 'i')] } },
      ];
    }
    if (req.query.tags) {
      filter.tags = { $in: req.query.tags.split(',') };
    }

    // Sort
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const [notices, total] = await Promise.all([
      Notice.find(filter)
        .populate('category', 'name color icon')
        .populate('createdBy', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Notice.countDocuments(filter),
    ]);

    res.json({
      notices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single notice
 */
exports.getById = async (req, res, next) => {
  try {
    const notice = await Notice.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate('category', 'name color icon')
      .populate('createdBy', 'name email avatar')
      .populate('sharing.sharedWith', 'name email');

    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    res.json(notice);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a notice
 */
exports.create = async (req, res, next) => {
  try {
    const noticeData = {
      ...req.body,
      tenantId: req.tenantId,
      createdBy: req.user._id,
    };

    // Auto-set status based on schedule
    if (noticeData.schedule?.startDate) {
      const startDate = new Date(noticeData.schedule.startDate);
      if (startDate > new Date()) {
        noticeData.status = NOTICE_STATUS.SCHEDULED;
      } else {
        noticeData.status = NOTICE_STATUS.ACTIVE;
      }
    }

    const notice = await Notice.create(noticeData);
    const populated = await Notice.findById(notice._id)
      .populate('category', 'name color icon')
      .populate('createdBy', 'name email avatar');

    // Emit socket event for real-time board updates
    if (req.io) {
      req.io.to(`tenant:${req.tenantId}`).emit('notice:created', populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a notice
 */
exports.update = async (req, res, next) => {
  try {
    const notice = await Notice.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    // Check ownership or admin role
    if (notice.createdBy.toString() !== req.user._id.toString()
      && !['owner', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to edit this notice' });
    }

    // Mass-assignment guard — never let the client overwrite identity fields.
    const { tenantId, _id, createdBy, createdAt, updatedAt, ...safe } = req.body;
    Object.assign(notice, safe);
    await notice.save();

    const populated = await Notice.findById(notice._id)
      .populate('category', 'name color icon')
      .populate('createdBy', 'name email avatar');

    if (req.io) {
      req.io.to(`tenant:${req.tenantId}`).emit('notice:updated', populated);
    }

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a notice
 */
exports.delete = async (req, res, next) => {
  try {
    const notice = await Notice.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    if (notice.createdBy.toString() !== req.user._id.toString()
      && !['owner', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to delete this notice' });
    }

    await notice.deleteOne();

    if (req.io) {
      req.io.to(`tenant:${req.tenantId}`).emit('notice:deleted', { id: req.params.id });
    }

    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Update notice status
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!Object.values(NOTICE_STATUS).includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const notice = await Notice.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { status },
      { new: true }
    ).populate('category', 'name color icon')
      .populate('createdBy', 'name email avatar');

    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    if (req.io) {
      req.io.to(`tenant:${req.tenantId}`).emit('notice:updated', notice);
    }

    res.json(notice);
  } catch (error) {
    next(error);
  }
};

/**
 * Share a notice
 */
exports.share = async (req, res, next) => {
  try {
    const { userIds, isPublic } = req.body;

    const notice = await Notice.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    if (userIds) notice.sharing.sharedWith = userIds;
    if (typeof isPublic === 'boolean') notice.sharing.isPublic = isPublic;

    await notice.save();
    res.json({ message: 'Notice sharing updated', sharing: notice.sharing });
  } catch (error) {
    next(error);
  }
};

/**
 * Get notices for a board display (public endpoint for kiosk/TV)
 */
exports.getBoardNotices = async (req, res, next) => {
  try {
    const Board = require('../models/Board');
    const Tenant = require('../models/Tenant');

    const mongoose = require('mongoose');
    const boardId = req.params.boardId;
    const isValidId = mongoose.isValidObjectId(boardId);
    const board = isValidId ? await Board.findById(boardId) : null;

    const pickBranding = (b) => ({
      logo: b?.logo || '',
      primaryColor: b?.primaryColor || '#3B82F6',
      secondaryColor: b?.secondaryColor || '#1E40AF',
      accentColor: b?.accentColor || '#F59E0B',
      fontFamily: b?.fontFamily || 'Inter',
      darkMode: b?.darkMode ?? false,
      brandStyle: b?.brandStyle || 'logo+text',
      customFonts: Array.isArray(b?.customFonts) ? b.customFonts.map(f => ({ family: f.family, url: f.url })) : [],
      displayScreens: {
        showLogo: b?.displayScreens?.showLogo ?? true,
        loadingTitle: b?.displayScreens?.loadingTitle || 'Loading board…',
        loadingSubtitle: b?.displayScreens?.loadingSubtitle || 'Please wait a moment',
        unavailableTitle: b?.displayScreens?.unavailableTitle || 'Board not available',
        unavailableSubtitle: b?.displayScreens?.unavailableSubtitle || 'Please check the board URL or contact your administrator.',
        emptyTitle: b?.displayScreens?.emptyTitle || 'No notices yet',
        emptySubtitle: b?.displayScreens?.emptySubtitle || 'Notices will appear here once published.',
      },
    });

    if (!board || !board.isActive) {
      // Still try to return branding so the kiosk shows a branded "unavailable" screen
      let branding = pickBranding(null);
      if (board) {
        const tenant = await Tenant.findById(board.tenantId).select('name branding').lean();
        if (tenant) branding = { ...pickBranding(tenant.branding), tenantName: tenant.name };
      }
      return res.status(404).json({ error: 'Board not available', available: false, branding });
    }

    // Build filter from board configuration
    const now = new Date();
    const filter = {
      tenantId: board.tenantId,
      status: NOTICE_STATUS.ACTIVE,
      $or: [
        { 'schedule.endDate': null },
        { 'schedule.endDate': { $gte: now } },
      ],
    };

    if (board.filters.categories?.length) {
      filter.category = { $in: board.filters.categories };
    }
    if (board.filters.priorities?.length) {
      filter.priority = { $in: board.filters.priorities };
    }
    if (board.filters.tags?.length) {
      filter.tags = { $in: board.filters.tags };
    }

    const notices = await Notice.find(filter)
      .populate('category', 'name color icon')
      .sort({ priority: 1, createdAt: -1 })
      .lean();

    // Update board last accessed
    board.lastAccessedAt = now;
    await board.save();

    const tenant = await Tenant.findById(board.tenantId).select('name branding').lean();
    const branding = tenant
      ? { ...pickBranding(tenant.branding), tenantName: tenant.name }
      : pickBranding(null);

    // Collect template + notice + data source IDs referenced by widgets so
    // the kiosk can render the real content instead of a placeholder.
    const Template = require('../models/Template');
    const DataSource = require('../models/DataSource');
    const templateIds = new Set();
    const noticeIds = new Set();
    const dataSourceIds = new Set();
    for (const page of board.pages || []) {
      for (const w of page.widgets || []) {
        if (w?.type === 'template' && w?.config?.templateId) templateIds.add(String(w.config.templateId));
        if (w?.type === 'notice' && w?.config?.noticeId) noticeIds.add(String(w.config.noticeId));
        if (w?.config?.dataSourceId) dataSourceIds.add(String(w.config.dataSourceId));
      }
    }

    const templatesMap = {};
    if (templateIds.size > 0) {
      const tpls = await Template.find({
        _id: { $in: Array.from(templateIds) },
        $or: [{ tenantId: board.tenantId }, { isSystem: true }],
      }).select('name html css fields').lean();
      for (const t of tpls) templatesMap[String(t._id)] = t;
    }

    const noticesMap = {};
    if (noticeIds.size > 0) {
      const noticeDocs = await Notice.find({
        _id: { $in: Array.from(noticeIds) },
        tenantId: board.tenantId,
      }).select('title content type media priority category').populate('category', 'name color icon').lean();
      for (const n of noticeDocs) noticesMap[String(n._id)] = n;
    }

    const dataSourcesMap = {};
    if (dataSourceIds.size > 0) {
      const sources = await DataSource.find({
        _id: { $in: Array.from(dataSourceIds) },
        tenantId: board.tenantId,
      }).select('name dataPath data lastFetchedAt lastFetchStatus lastError').lean();
      for (const s of sources) dataSourcesMap[String(s._id)] = s;
    }

    res.json({
      available: true,
      // Only the fields the kiosk actually needs are returned.
      // externalDataSources is intentionally omitted — it can carry URLs
      // and credentials that should never be exposed unauthenticated.
      board: {
        name: board.name,
        displayMode: board.displayMode,
        layout: board.layout,
        carousel: board.carousel,
        autoScroll: board.autoScroll,
        theme: board.theme,
        pages: board.pages || [],
      },
      notices,
      templates: templatesMap,
      widgetNotices: noticesMap,
      dataSources: dataSourcesMap,
      branding,
    });
  } catch (error) {
    next(error);
  }
};
