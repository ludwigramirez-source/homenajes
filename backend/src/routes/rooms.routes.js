const express = require('express');
const router = express.Router();
const controller = require('../controllers/rooms.controller');
const { authenticate, authorize } = require('../middleware/auth');

// PUBLICO - Para que el display lea el memorial activo
router.get('/:id/active-memorial', controller.getActiveMemorial);

// PROTEGIDOS
router.get('/', authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);
router.post('/', authenticate, authorize('admin', 'supervisor'), controller.create);
router.put('/:id', authenticate, authorize('admin', 'supervisor'), controller.update);
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;
