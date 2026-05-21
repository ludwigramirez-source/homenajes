const express = require('express');
const router = express.Router();
const controller = require('../controllers/ceremonyVenues.controller');
const { authenticate, authorize } = require('../middleware/auth');

// GET: cualquier usuario autenticado puede listar (necesario para el studio de tributos).
router.get('/', authenticate, controller.getAll);

// Mutaciones: solo admin/supervisor.
router.post('/', authenticate, authorize('admin', 'supervisor'), controller.create);
router.delete('/:id', authenticate, authorize('admin', 'supervisor'), controller.remove);

module.exports = router;
