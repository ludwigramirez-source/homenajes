const express = require('express');
const router = express.Router();
const controller = require('../controllers/display.controller');

// PUBLICO - SSR del display para pantallas LG con motor antiguo.
// Esta ruta vive en /digital-display-screen/:roomId (sin prefijo /api) y
// Nginx la rutea al backend en lugar del frontend SPA.
router.get('/:roomId', controller.getDisplay);

// PUBLICO - JSON liviano que consulta por XHR el JS de rotacion de pautas
// (ver renderPauta en displayScreen.js) para saber si ya hay un homenaje
// activo o si cambio la lista de pautas, sin recargar toda la pagina.
router.get('/:roomId/status', controller.getStatus);

module.exports = router;
