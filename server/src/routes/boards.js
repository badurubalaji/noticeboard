const router = require('express').Router();
const boardController = require('../controllers/boardController');
const noticeController = require('../controllers/noticeController');
const { authenticate, authorize } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');

// Public endpoint for display boards (no auth for kiosk/TV)
router.get('/:boardId/display', noticeController.getBoardNotices);

// Admin endpoints - require auth
router.use(authenticate, tenantMiddleware);
router.get('/', authorize('board:configure'), boardController.list);
router.get('/:id', authorize('board:configure'), boardController.getById);
router.post('/', authorize('board:configure'), boardController.create);
router.put('/:id', authorize('board:configure'), boardController.update);
router.delete('/:id', authorize('board:configure'), boardController.delete);

module.exports = router;
