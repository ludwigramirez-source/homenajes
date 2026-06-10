const express = require('express');
const router = express.Router();
const controller = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');

router.get('/executive', authenticate, controller.executive);
router.get('/by-location', authenticate, controller.byLocation);
router.get('/operations', authenticate, controller.operations);
router.get('/detailed', authenticate, controller.detailed);
router.get('/health', authenticate, controller.systemHealth);

module.exports = router;
