const router = require('express').Router();
const tenantController = require('../controllers/tenantController');
const { authenticate, authorize, requireRole } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');

router.use(authenticate, tenantMiddleware);

router.get('/', tenantController.getTenant);
router.put('/', requireRole('owner', 'admin'), tenantController.updateTenant);
router.get('/users', requireRole('owner', 'admin'), tenantController.listUsers);
router.post('/users', requireRole('owner', 'admin'), tenantController.inviteUser);
router.put('/users/:id', requireRole('owner', 'admin'), tenantController.updateUser);

module.exports = router;
