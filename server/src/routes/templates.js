const router = require('express').Router();
const templateController = require('../controllers/templateController');
const { authenticate, authorize } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');

router.use(authenticate, tenantMiddleware);

router.get('/', templateController.list);
router.get('/:id', templateController.getById);
router.post('/', authorize('template:manage'), templateController.create);
router.put('/:id', authorize('template:manage'), templateController.update);
router.delete('/:id', authorize('template:manage'), templateController.delete);
router.post('/:id/instantiate', authorize('notice:create'), templateController.instantiate);

module.exports = router;
