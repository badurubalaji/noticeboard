const router = require('express').Router();
const noticeController = require('../controllers/noticeController');
const { authenticate, authorize } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');

// All routes require authentication + tenant context
router.use(authenticate, tenantMiddleware);

router.get('/', authorize('notice:view'), noticeController.list);
router.get('/:id', authorize('notice:view'), noticeController.getById);
router.post('/', authorize('notice:create'), noticeController.create);
router.put('/:id', authorize('notice:edit'), noticeController.update);
router.delete('/:id', authorize('notice:delete'), noticeController.delete);
router.patch('/:id/status', authorize('notice:edit'), noticeController.updateStatus);
router.post('/:id/share', authorize('notice:edit'), noticeController.share);

// Public board display endpoint (no auth needed for kiosk/TV)
// Mounted separately in app.js

module.exports = router;
