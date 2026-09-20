const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
// Las pautas son imagenes de fondo a pantalla completa (1920x1080 o mas) que
// se suben en alta resolucion para no perder calidad en el TV; a diferencia
// de la foto del difunto o los adjuntos de condolencias (fotos de celular,
// mostradas chicas), necesitan un limite bastante mas alto.
const MAX_PAUTA_FILE_SIZE = parseInt(process.env.MAX_PAUTA_FILE_SIZE) || 20 * 1024 * 1024;

// Crear directorio si no existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imagenes (jpg, png, gif, webp) y PDFs'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

const uploadPauta = multer({
  storage,
  limits: { fileSize: MAX_PAUTA_FILE_SIZE },
  fileFilter
});

module.exports = upload;
module.exports.uploadPauta = uploadPauta;
