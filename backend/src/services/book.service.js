// Generacion y gestion en disco del "book" (PDF conmemorativo) de un homenaje.
//
// Diseno segun `GUIA BOOK - Proyecto Tributo.pdf`: 4 secciones, cada una a
// tamano media carta (5.5 x 8.5 in = 396 x 612 pt a 72ppi, igual que los PNG
// de fondo suministrados, asi que se dibujan a escala 1:1):
//   1. Obituario (foto + nombre + anios) sobre plantilla-obituario-bg.png
//   2. Mensaje de la familia sobre plantilla-mensaje-familia-bg.png
//   3. Mensajes de allegados (con hasta 2 fotos c/u) sobre plantilla-general-bg.png,
//      paginados dinamicamente segun el contenido de cada mensaje
//   4. Panel institucional de Alivia sobre plantilla-general-bg.png
// Los colores/fondos son fijos de marca (Alivia + Los Olivos): ya NO varian
// por template_id del homenaje (el libro no representa el mismo tema visual
// que la pantalla TV, es un documento de marca aparte).
//
// El PDF NUNCA se guarda bajo UPLOAD_DIR (esa carpeta se sirve publicamente
// via express.static sin auth) sino en BOOKS_STORAGE_DIR, una carpeta nueva
// que solo se lee desde books.controller.js#download tras verificar auth.
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const PDFDocument = require('pdfkit');
const db = require('../config/database');
const emailService = require('./email.service');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const BOOKS_STORAGE_DIR = process.env.BOOKS_STORAGE_DIR || path.join(__dirname, '../../storage/books');
const ASSETS_DIR = path.join(__dirname, '../assets/book');
const FONTS_DIR = path.join(__dirname, '../assets/fonts');

// ---------- Paleta y tipografia (fijas, marca Alivia/Los Olivos) ----------
const TEAL = '#337D7C';
const TEXT_DARK = '#3C3C3B';
const WHITE = '#FFFFFF';
const MESSAGE_BOX_OPACITY = 0.25;

// Texto institucional definitivo (de `Texto final.docx`, tomado como fuente
// de verdad segun el brief aunque el mockup visual diga "Unidad de Apoyo al
// Duelo" en vez de "Unidad de Apoyo Emocional" - pendiente de confirmar con
// quien aprobo el copy). Se deja tal cual, incluido el probable typo
// "intension" (por "intencion"), sin corregir unilateralmente.
const ALIVIA_PARAGRAPHS = [
  'Cuando la vida pueda tornarse frágil, lo más valioso es contar con un apoyo que nos pueda aliviar en medio de la adversidad.',
  'Por eso en nuestra Unidad de Apoyo Emocional, queremos ser ese apoyo que guía con intensión y profundo respeto.'
];

// ---------- Geometria de pagina (media carta, igual que los PNG de fondo) ----------
const PAGE_WIDTH = 396;
const PAGE_HEIGHT = 612;
const CONTENT_MARGIN = 30;
const CONTENT_WIDTH = PAGE_WIDTH - CONTENT_MARGIN * 2;

// Columnas del bloque de cada mensaje de condolencia (seccion 3)
const LEFT_COL_WIDTH = 195;
const COL_GAP = 12;
const RIGHT_COL_WIDTH = CONTENT_WIDTH - LEFT_COL_WIDTH - COL_GAP;
const PHOTO_SIZE = 61;
const PHOTO_GAP = 6;
const MSG_BOX_PADDING = 10;
const MSG_TOP_START = 40;
const MSG_BLOCK_GAP = 20;
// Deja libre la franja de olas teal del pie de plantilla-general-bg.png.
const MSG_BOTTOM_SAFE = 46;

function assetPath(name) {
  return path.join(ASSETS_DIR, name);
}

function registerFonts(doc) {
  doc.registerFont('Raleway-Medium', path.join(FONTS_DIR, 'Raleway-Medium.ttf'));
  doc.registerFont('Raleway-Bold', path.join(FONTS_DIR, 'Raleway-Bold.ttf'));
}

function drawBackground(doc, filename) {
  doc.image(assetPath(filename), 0, 0, { width: PAGE_WIDTH, height: PAGE_HEIGHT });
}

// Descarga una imagen a Buffer. Soporta rutas relativas locales
// (/uploads/...) leyendolas directo de disco, y URLs absolutas via http(s).
// Nunca lanza: devuelve null si algo falla (el PDF se genera igual, sin foto).
async function fetchImageBuffer(photoUrl) {
  if (!photoUrl) return null;

  try {
    if (/^https?:\/\//i.test(photoUrl)) {
      return await new Promise((resolve) => {
        const client = photoUrl.startsWith('https://') ? https : http;
        const req = client.get(photoUrl, (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            resolve(null);
            return;
          }
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        });
        req.on('error', () => resolve(null));
        req.setTimeout(8000, () => {
          req.destroy();
          resolve(null);
        });
      });
    }

    // Ruta relativa tipo /uploads/xxx.jpg -> resolver contra UPLOAD_DIR local.
    const relative = photoUrl.replace(/^\/?uploads\//, '');
    const localPath = path.join(UPLOAD_DIR, relative);
    if (!fs.existsSync(localPath)) return null;
    return fs.readFileSync(localPath);
  } catch (err) {
    console.error('[BOOK] No se pudo descargar una imagen del book:', err.message);
    return null;
  }
}

// Asegura que la carpeta de almacenamiento de books exista.
function ensureBooksStorageDir() {
  fs.mkdirSync(BOOKS_STORAGE_DIR, { recursive: true });
  return BOOKS_STORAGE_DIR;
}

function formatYears(memorial) {
  const b = memorial.birth_year;
  const d = memorial.death_year;
  if (b && d) return `${b} - ${d}`;
  if (b) return `${b}`;
  if (d) return `${d}`;
  return '';
}

// Dibuja una imagen recortada tipo "cover" (llena el rectangulo destino
// manteniendo proporcion, recortando el sobrante) dentro de un rectangulo
// con esquinas redondeadas. valign 'top' prioriza la parte superior de la
// foto (donde tipicamente esta la cara), igual que el recorte usado en la
// pantalla TV.
function drawCoverImage(doc, buffer, x, y, w, h, radius, valign) {
  doc.save();
  if (radius) doc.roundedRect(x, y, w, h, radius).clip();
  else doc.rect(x, y, w, h).clip();
  doc.image(buffer, x, y, { cover: [w, h], align: 'center', valign: valign || 'center' });
  doc.restore();
}

// ---------- Seccion 1: Obituario ----------
async function drawObituarioPage(doc, memorial) {
  drawBackground(doc, 'plantilla-obituario-bg.png');

  doc.font('Raleway-Bold').fontSize(15).fillColor(WHITE)
    .text('En memoria de', 0, 96, { width: PAGE_WIDTH, align: 'center' });

  doc.font('Raleway-Medium').fontSize(19).fillColor(WHITE)
    .text(memorial.deceased_name || '', CONTENT_MARGIN, 124, {
      width: CONTENT_WIDTH, align: 'center'
    });

  const photoW = 210;
  const photoH = 256;
  const photoX = (PAGE_WIDTH - photoW) / 2;
  const photoY = 190;
  const photoBuffer = await fetchImageBuffer(memorial.photo_url);
  if (photoBuffer) {
    try {
      drawCoverImage(doc, photoBuffer, photoX, photoY, photoW, photoH, 6, 'top');
    } catch (err) {
      console.error('[BOOK] No se pudo dibujar la foto del obituario:', err.message);
    }
  }

  const years = formatYears(memorial);
  if (years) {
    doc.font('Raleway-Medium').fontSize(13).fillColor(WHITE)
      .text(years, 0, photoY + photoH + 16, { width: PAGE_WIDTH, align: 'center' });
  }
}

// ---------- Seccion 2: Mensaje de la familia ----------
function drawFamilyMessagePage(doc, memorial) {
  drawBackground(doc, 'plantilla-mensaje-familia-bg.png');

  const leafW = 42;
  const leafH = 37;
  doc.image(assetPath('decoracion-hoja.png'), (PAGE_WIDTH - leafW) / 2, 92, {
    width: leafW, height: leafH
  });

  const textMargin = 55;
  doc.font('Raleway-Medium').fontSize(11).fillColor(TEXT_DARK)
    .text(memorial.emotional_message || '', textMargin, 150, {
      width: PAGE_WIDTH - textMargin * 2,
      align: 'center'
    });
}

// ---------- Seccion 3: Mensajes de allegados (con fotos) ----------

// Precalcula la altura que ocupara el bloque de un mensaje, sin dibujarlo,
// para decidir si cabe en la pagina actual antes de escribir nada.
function measureCondolenceBlock(doc, c) {
  const lineGap = 3;
  doc.font('Raleway-Bold').fontSize(9);
  const labelLineH = doc.currentLineHeight() + lineGap;
  let leftH = labelLineH * 3; // Nombre / Correo / Numero
  leftH += labelLineH; // "Mensaje:"

  doc.font('Raleway-Medium').fontSize(9);
  const textWidth = LEFT_COL_WIDTH - MSG_BOX_PADDING * 2;
  const msgTextHeight = doc.heightOfString(c.message || '', { width: textWidth });
  const boxHeight = msgTextHeight + MSG_BOX_PADDING * 2;
  leftH += 4 + boxHeight;

  const photos = [c.file1_url, c.file2_url].filter(Boolean);
  let rightH = 0;
  if (photos.length > 0) {
    rightH = doc.currentLineHeight() + 4 + PHOTO_SIZE;
  }

  return { height: Math.max(leftH, rightH), boxHeight, photos };
}

async function drawCondolenceBlock(doc, c, y, measured) {
  const leftX = CONTENT_MARGIN;
  const rightX = CONTENT_MARGIN + LEFT_COL_WIDTH + COL_GAP;
  let ly = y;

  function labelValueLine(label, value) {
    doc.font('Raleway-Bold').fontSize(9).fillColor(TEXT_DARK)
      .text(label + ' ', leftX, ly, { continued: true, width: LEFT_COL_WIDTH });
    doc.font('Raleway-Medium').fontSize(9).fillColor(TEXT_DARK)
      .text(value || '—');
    ly = doc.y + 3;
  }

  labelValueLine('Nombre:', c.sender_name);
  labelValueLine('Correo:', c.sender_email);
  labelValueLine('Número:', c.sender_phone);

  doc.font('Raleway-Bold').fontSize(9).fillColor(TEXT_DARK)
    .text('Mensaje:', leftX, ly, { width: LEFT_COL_WIDTH });
  ly = doc.y + 4;

  doc.save();
  doc.fillOpacity(MESSAGE_BOX_OPACITY).fillColor(TEAL)
    .rect(leftX, ly, LEFT_COL_WIDTH, measured.boxHeight).fill();
  doc.restore();

  doc.font('Raleway-Medium').fontSize(9).fillColor(TEXT_DARK)
    .text(c.message || '', leftX + MSG_BOX_PADDING, ly + MSG_BOX_PADDING, {
      width: LEFT_COL_WIDTH - MSG_BOX_PADDING * 2
    });

  if (measured.photos.length > 0) {
    doc.font('Raleway-Medium').fontSize(8).fillColor(TEXT_DARK)
      .text(c.sender_name || '', rightX, y, { width: RIGHT_COL_WIDTH });
    const photoY = doc.y + 4;
    let px = rightX;
    for (const url of measured.photos) {
      const buffer = await fetchImageBuffer(url);
      if (buffer) {
        try {
          drawCoverImage(doc, buffer, px, photoY, PHOTO_SIZE, PHOTO_SIZE, 4, 'center');
        } catch (err) {
          console.error('[BOOK] No se pudo dibujar una foto de condolencia:', err.message);
        }
      }
      px += PHOTO_SIZE + PHOTO_GAP;
    }
  }
}

async function drawCondolencePages(doc, approved) {
  if (approved.length === 0) {
    doc.addPage();
    drawBackground(doc, 'plantilla-general-bg.png');
    doc.font('Raleway-Medium').fontSize(11).fillColor(TEXT_DARK)
      .text('Aún no hay mensajes de condolencia para este homenaje.', CONTENT_MARGIN,
        PAGE_HEIGHT / 2 - 8, { width: CONTENT_WIDTH, align: 'center' });
    return;
  }

  let y = 0;
  let pageOpen = false;
  for (const c of approved) {
    const measured = measureCondolenceBlock(doc, c);
    if (!pageOpen || y + measured.height > PAGE_HEIGHT - MSG_BOTTOM_SAFE) {
      doc.addPage();
      drawBackground(doc, 'plantilla-general-bg.png');
      y = MSG_TOP_START;
      pageOpen = true;
    }
    await drawCondolenceBlock(doc, c, y, measured);
    y += measured.height + MSG_BLOCK_GAP;
  }
}

// ---------- Seccion 4: Panel institucional de Alivia ----------
function drawAliviaPage(doc) {
  doc.addPage();
  drawBackground(doc, 'plantilla-general-bg.png');

  const logoW = 150;
  const logoH = 98;
  const logoY = 70;
  doc.image(assetPath('logo-alivia.png'), (PAGE_WIDTH - logoW) / 2, logoY, {
    width: logoW, height: logoH
  });

  const textMargin = 60;
  doc.font('Raleway-Medium').fontSize(10).fillColor(TEXT_DARK)
    .text(ALIVIA_PARAGRAPHS[0], textMargin, logoY + logoH + 22, {
      width: PAGE_WIDTH - textMargin * 2, align: 'center'
    });
  doc.moveDown(0.8);
  doc.font('Raleway-Medium').fontSize(10).fillColor(TEXT_DARK)
    .text(ALIVIA_PARAGRAPHS[1], textMargin, doc.y, {
      width: PAGE_WIDTH - textMargin * 2, align: 'center'
    });

  const qrW = 160;
  const qrH = Math.round(qrW * (387 / 359));
  const qrY = doc.y + 22;
  doc.image(assetPath('qr-alivia-agendamiento.png'), (PAGE_WIDTH - qrW) / 2, qrY, {
    width: qrW, height: qrH
  });
}

// Genera el PDF del libro de condolencias. Devuelve una Promise<Buffer>.
// Filtra por moderation_status = 'approved' EL MISMO (no confia en el caller).
async function generateBookPdf(memorial, condolences) {
  const approved = (condolences || []).filter((c) => c.moderation_status === 'approved');

  const doc = new PDFDocument({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: 0, bufferPages: true });
  registerFonts(doc);

  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const donePromise = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  await drawObituarioPage(doc, memorial);
  doc.addPage();
  drawFamilyMessagePage(doc, memorial);
  await drawCondolencePages(doc, approved);
  drawAliviaPage(doc);

  doc.end();
  return donePromise;
}

// Guarda el buffer del PDF en BOOKS_STORAGE_DIR con un nombre unico y
// devuelve la ruta absoluta en disco.
function saveBookPdf(memorialId, buffer) {
  const dir = ensureBooksStorageDir();
  const filename = `book_${memorialId}_${Date.now()}.pdf`;
  const fullPath = path.join(dir, filename);
  fs.writeFileSync(fullPath, buffer);
  return fullPath;
}

// Cuerpo HTML del correo que acompana el PDF adjunto.
function buildEmailHtml(memorial) {
  const name = memorial.deceased_name || '';
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; color: #333;">
      <p>Estimada familia,</p>
      <p>
        Adjuntamos el libro de condolencias con los mensajes de cariño y apoyo
        recibidos durante el homenaje de <strong>${name}</strong>.
      </p>
      <p>
        Con nuestro más sentido acompañamiento,<br/>
        Los Olivos · SERCOFUN
      </p>
    </div>
  `;
}

// Logica compartida de generar + guardar + registrar + enviar el book de un
// memorial. La usan tanto el envio manual (books.controller.js#send) como el
// scheduler automatico (jobs/bookScheduler.js) para que el comportamiento sea
// identico en ambos casos.
//
// Precondicion: el llamador ya valido que memorial.family_contact_email existe.
// condolences: TODAS las condolencias del memorial (se filtran aqui por 'approved').
//
// Devuelve la fila final de book_sends (status 'sent' o 'failed').
async function processAndSendBook(memorial, condolences, { triggerType, triggeredBy } = {}) {
  const approved = (condolences || []).filter((c) => c.moderation_status === 'approved');
  const recipientEmail = memorial.family_contact_email;

  let pdfPath = null;
  let pdfBuffer = null;
  try {
    pdfBuffer = await generateBookPdf(memorial, approved);
    pdfPath = saveBookPdf(memorial.id, pdfBuffer);
  } catch (err) {
    // No se pudo ni generar el PDF: registrar la fila como fallida.
    const insertResult = await db.query(`
      INSERT INTO book_sends (
        memorial_id, status, recipient_email, pdf_path, message_count,
        error_message, trigger_type, triggered_by
      )
      VALUES ($1, 'failed', $2, NULL, $3, $4, $5, $6)
      RETURNING *
    `, [
      memorial.id, recipientEmail, approved.length,
      'No se pudo generar el PDF: ' + err.message,
      triggerType || 'manual', triggeredBy || null
    ]);
    return insertResult.rows[0];
  }

  const insertResult = await db.query(`
    INSERT INTO book_sends (
      memorial_id, status, recipient_email, pdf_path, message_count,
      trigger_type, triggered_by
    )
    VALUES ($1, 'pending', $2, $3, $4, $5, $6)
    RETURNING *
  `, [
    memorial.id, recipientEmail, pdfPath, approved.length,
    triggerType || 'manual', triggeredBy || null
  ]);
  const bookSend = insertResult.rows[0];

  try {
    await emailService.sendMail({
      to: recipientEmail,
      subject: `Libro de condolencias — ${memorial.deceased_name || ''}`,
      html: buildEmailHtml(memorial),
      attachments: [{
        filename: `Libro-de-condolencias-${(memorial.deceased_name || 'homenaje').replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'homenaje'}.pdf`,
        content: pdfBuffer
      }]
    });

    const updateResult = await db.query(`
      UPDATE book_sends
      SET status = 'sent', sent_at = NOW(), error_message = NULL
      WHERE id = $1
      RETURNING *
    `, [bookSend.id]);
    return updateResult.rows[0];
  } catch (err) {
    const updateResult = await db.query(`
      UPDATE book_sends
      SET status = 'failed', error_message = $2
      WHERE id = $1
      RETURNING *
    `, [bookSend.id, String(err.message).slice(0, 1000)]);
    return updateResult.rows[0];
  }
}

module.exports = {
  generateBookPdf,
  saveBookPdf,
  ensureBooksStorageDir,
  processAndSendBook,
  BOOKS_STORAGE_DIR
};
