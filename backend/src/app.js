const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Rutas
const authRoutes = require('./routes/auth.routes');
const locationsRoutes = require('./routes/locations.routes');
const roomsRoutes = require('./routes/rooms.routes');
const memorialsRoutes = require('./routes/memorials.routes');
const condolencesRoutes = require('./routes/condolences.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const ceremonyVenuesRoutes = require('./routes/ceremonyVenues.routes');
const usersRoutes = require('./routes/users.routes');
const displayRoutes = require('./routes/display.routes');

const app = express();

// IMPORTANTE: el SSR del display se registra ANTES de helmet global porque
// las pantallas LG con WebKit antiguo no respetan CSP y la CSP estricta
// bloqueaba inline <style>. Esta ruta es publica de solo-lectura (sin
// inputs del usuario) y el HTML escapa todo con escapeHtml.
app.use('/digital-display-screen', displayRoutes);

// Seguridad y middlewares basicos
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const corsOrigins = process.env.CORS_ORIGIN === '*' 
  ? '*' 
  : process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || '*';

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Servir archivos estaticos (imagenes subidas)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(UPLOAD_DIR));

// Health check raiz
app.get('/', (req, res) => {
  res.json({
    name: 'SERCOFUN Homenajes API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/docs',
    health: '/api/health'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/memorials', memorialsRoutes);
app.use('/api/condolences', condolencesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ceremony-venues', ceremonyVenuesRoutes);
app.use('/api/users', usersRoutes);

// (la ruta /digital-display-screen se registra arriba, antes de helmet,
// para que el SSR no quede sujeto a CSP estricta)

// Endpoint de informacion (lista todas las rutas)
app.get('/api/docs', (req, res) => {
  res.json({
    api: 'SERCOFUN Homenajes Digitales',
    version: '1.0.0',
    base_url: process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`,
    endpoints: {
      auth: {
        'POST /api/auth/login': 'Iniciar sesion (publico)',
        'GET /api/auth/me': 'Datos del usuario actual (auth)',
        'POST /api/auth/register': 'Crear usuario (admin only)'
      },
      locations: {
        'GET /api/locations': 'Listar sedes (auth)',
        'GET /api/locations/:id': 'Detalle de sede (auth)',
        'POST /api/locations': 'Crear sede (admin/supervisor)',
        'PUT /api/locations/:id': 'Actualizar sede (admin/supervisor)',
        'DELETE /api/locations/:id': 'Eliminar sede (admin)'
      },
      rooms: {
        'GET /api/rooms/:id/active-memorial': 'Memorial activo (PUBLICO - para display)',
        'GET /api/rooms': 'Listar salas (auth)',
        'GET /api/rooms/:id': 'Detalle sala (auth)',
        'POST /api/rooms': 'Crear sala (admin/supervisor)',
        'PUT /api/rooms/:id': 'Actualizar sala (admin/supervisor)',
        'DELETE /api/rooms/:id': 'Eliminar sala (admin)'
      },
      memorials: {
        'GET /api/memorials': 'Listar homenajes (auth)',
        'GET /api/memorials/:id': 'Detalle homenaje (auth)',
        'POST /api/memorials': 'Crear homenaje (auth)',
        'PUT /api/memorials/:id': 'Actualizar homenaje (auth)',
        'DELETE /api/memorials/:id': 'Eliminar homenaje (admin/supervisor)',
        'POST /api/memorials/upload-photo': 'Subir foto (auth)'
      },
      condolences: {
        'POST /api/condolences/submit': 'Enviar condolencia (PUBLICO - formulario)',
        'GET /api/condolences': 'Listar todas (auth)',
        'GET /api/condolences/memorial/:memorialId': 'Por memorial (auth)',
        'DELETE /api/condolences/:id': 'Eliminar (admin/supervisor)'
      },
      analytics: {
        'GET /api/analytics/executive': 'KPIs ejecutivos (auth)',
        'GET /api/analytics/by-location': 'Por sede (auth)',
        'GET /api/analytics/operations': 'Operaciones (auth)',
        'GET /api/analytics/health': 'Estado sistema (publico)'
      }
    }
  });
});

// Error handlers (deben ir al final)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
