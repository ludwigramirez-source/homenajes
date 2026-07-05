const express = require('express');
const router = express.Router();
const controller = require('../controllers/llm.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Toda la configuracion/uso del LLM es SOLO admin.
router.use(authenticate, authorize('admin'));

router.get('/settings', controller.getSettings);
router.put('/settings', controller.updateSettings);
router.get('/models', controller.getModels);
router.get('/usage', controller.getUsage);

module.exports = router;
