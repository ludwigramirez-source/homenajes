const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err);

  // Error de validacion
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Error de validacion',
      details: err.errors
    });
  }

  // Error de base de datos
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Ya existe un registro con esos datos'
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Referencia a registro inexistente'
    });
  }

  // Error de multer. El limite mostrado depende del campo: 'image' (pautas)
  // usa un limite mas alto que 'photo'/'files' (foto del difunto, adjuntos
  // de condolencias), ver backend/src/middleware/upload.js.
  if (err.code === 'LIMIT_FILE_SIZE') {
    const maxMb = err.field === 'image' ? '20MB' : '5MB';
    return res.status(400).json({
      success: false,
      error: `Archivo demasiado grande (max ${maxMb})`
    });
  }

  // Error generico
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
};

module.exports = { errorHandler, notFoundHandler };
