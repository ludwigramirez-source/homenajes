const express = require('express');
const router = express.Router();
const controller = require('../controllers/books.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Configuracion SMTP - solo admin
router.get('/settings', authenticate, authorize('admin'), controller.getSettings);
router.put('/settings', authenticate, authorize('admin'), controller.updateSettings);
router.post('/settings/test', authenticate, authorize('admin'), controller.testSettings);

// Listado - cualquier rol autenticado (operator se filtra por sede en el controller)
router.get('/', authenticate, controller.getAll);

// Envio manual - admin/supervisor/operator (operator solo su sede, validado en el controller)
router.post('/:memorialId/send', authenticate, authorize('admin', 'supervisor', 'operator'), controller.send);

// Vista previa del PDF al vuelo (sin guardar ni enviar correo) - cualquier
// rol autenticado, igual que la descarga (operator solo su sede, en el controller)
router.get('/:memorialId/preview', authenticate, controller.preview);

// Descarga del PDF ya generado - cualquier rol autenticado (mismo scoping de sede)
router.get('/:id/download', authenticate, controller.download);

module.exports = router;
