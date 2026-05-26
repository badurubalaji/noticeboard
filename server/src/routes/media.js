const router = require('express').Router();
const mediaController = require('../controllers/mediaController');
const { authenticate, authorize } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');
const { upload } = require('../middleware/upload');

router.use(authenticate, tenantMiddleware);

router.post('/upload', authorize('media:upload'), upload.single('file'), mediaController.upload);
router.get('/', mediaController.list);
router.delete('/:id', authorize('media:delete'), mediaController.delete);

module.exports = router;
