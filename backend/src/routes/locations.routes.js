const express = require('express');
const router = express.Router();
const controller = require('../controllers/locations.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);
router.post('/', authenticate, authorize('admin', 'supervisor'), controller.create);
router.put('/:id', authenticate, authorize('admin', 'supervisor'), controller.update);
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;
