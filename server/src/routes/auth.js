const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, refreshLimiter, registerLimiter } = require('../middleware/rateLimit');

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', refreshLimiter, authController.refreshToken);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
