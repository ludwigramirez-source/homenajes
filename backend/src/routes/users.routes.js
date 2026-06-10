const express = require('express');
const router = express.Router();
const controller = require('../controllers/users.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Gestion de usuarios: solo superadministrador (rol 'admin').
router.get('/', authenticate, authorize('admin'), controller.getAll);
router.get('/:id', authenticate, authorize('admin'), controller.getById);
router.post('/', authenticate, authorize('admin'), controller.create);
router.put('/:id', authenticate, authorize('admin'), controller.update);
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;
