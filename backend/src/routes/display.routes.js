const express = require('express');
const router = express.Router();
const controller = require('../controllers/display.controller');

// PUBLICO - SSR del display para pantallas LG con motor antiguo.
// Esta ruta vive en /digital-display-screen/:roomId (sin prefijo /api) y
// Nginx la rutea al backend en lugar del frontend SPA.
router.get('/:roomId', controller.getDisplay);

module.exports = router;
