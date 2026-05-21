const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);
router.post('/register', authenticate, authorize('admin'), authController.register);

module.exports = router;
