const express = require('express');
const router = express.Router();
const controller = require('../controllers/pautas.controller');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Gestion de pautas (contenido de relleno cuando no hay homenaje activo en
// una sala): solo superadministrador (rol 'admin'), igual que Salas y sedes,
// Usuarios y Moderacion IA.
router.get('/', authenticate, authorize('admin'), controller.getAll);
router.post('/', authenticate, authorize('admin'), upload.uploadPauta.single('image'), controller.create);
router.put('/:id', authenticate, authorize('admin'), controller.update);
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;
