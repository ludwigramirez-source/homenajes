const express = require('express');
const router = express.Router();
const controller = require('../controllers/condolences.controller');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// PUBLICO - Envio desde el formulario (acepta hasta 2 archivos)
router.post('/submit', upload.array('files', 2), controller.submit);

// PUBLICO - Lista de mensajes por memorial (para pantalla del display).
// Devuelve solo campos no sensibles (sin email/telefono/IP).
router.get('/public/:memorialId', controller.getPublicByMemorial);

// PROTEGIDOS
router.get('/', authenticate, controller.getAll);
router.get('/memorial/:memorialId', authenticate, controller.getByMemorial);
// Moderacion manual (Tablon): admin/supervisor cualquier mensaje; operator solo su sede.
router.patch('/:id/moderation', authenticate, authorize('admin', 'supervisor', 'operator'), controller.moderate);
router.delete('/:id', authenticate, authorize('admin', 'supervisor'), controller.remove);

module.exports = router;
