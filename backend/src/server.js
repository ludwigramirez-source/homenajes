const app = require('./app');

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('=========================================');
  console.log('SERCOFUN Homenajes Digitales - Backend');
  console.log('=========================================');
  console.log(`Servidor corriendo en puerto: ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`URL: ${process.env.PUBLIC_URL || `http://localhost:${PORT}`}`);
  console.log(`Documentacion: ${process.env.PUBLIC_URL || `http://localhost:${PORT}`}/api/docs`);
  console.log('=========================================');
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM recibido. Cerrando servidor...');
  server.close(() => {
    console.log('[SERVER] Servidor cerrado.');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('[SERVER] Excepcion no capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[SERVER] Promise rechazada sin manejar:', reason);
});
