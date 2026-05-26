const router = require('express').Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');

router.use(authenticate, tenantMiddleware);

router.get('/', categoryController.list);
router.post('/', authorize('category:manage'), categoryController.create);
router.put('/:id', authorize('category:manage'), categoryController.update);
router.delete('/:id', authorize('category:manage'), categoryController.delete);

module.exports = router;
