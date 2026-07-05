// Generacion y gestion en disco del "book" (PDF con los mensajes de
// condolencia aprobados) de un homenaje.
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

// Paleta por template_id del memorial (mismos colores que
// frontend/src/pages/memorial-form/themes.js) para que el book se sienta
// parte del mismo homenaje. id desconocido -> 'default'.
const TEMPLATE_COLORS = {
  default: { accent: '#f0c040', base: '#1a7472' },
  nino: { accent: '#3f7092', base: '#1a7472' },
  nina: { accent: '#96626a', base: '#1a7472' },
  agua: { accent: '#2c7d96', base: '#1a7472' },
  aire: { accent: '#3a6b8c', base: '#1a7472' },
  fuego: { accent: '#b05e22', base: '#1a7472' },
  tierra: { accent: '#7a6a35', base: '#1a7472' },
  bosque: { accent: '#5f4824', base: '#1a7472' }
};

function getTemplateColors(templateId) {
  return TEMPLATE_COLORS[templateId] || TEMPLATE_COLORS.default;
}

// Asegura que la carpeta de almacenamiento de books exista.
function ensureBooksStorageDir() {
  fs.mkdirSync(BOOKS_STORAGE_DIR, { recursive: true });
  return BOOKS_STORAGE_DIR;
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
    console.error('[BOOK] No se pudo descargar la foto del memorial:', err.message);
    return null;
  }
}

const PAGE_MARGIN = 56;

// Dibuja el pie de pagina (numero de pagina + marca) en la posicion actual.
function drawFooter(doc, colors, pageNumber) {
  const bottom = doc.page.height - 40;
  doc.fontSize(8)
    .font('Times-Roman')
    .fillColor('#888888')
    .text('Los Olivos · SERCOFUN', PAGE_MARGIN, bottom, {
      width: doc.page.width - PAGE_MARGIN * 2,
      align: 'left'
    });
  doc.fontSize(8)
    .fillColor('#888888')
    .text(String(pageNumber), PAGE_MARGIN, bottom, {
      width: doc.page.width - PAGE_MARGIN * 2,
      align: 'right'
    });
}

function formatDate(date) {
  try {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (_) {
    return '';
  }
}

// Genera el PDF del libro de condolencias. Devuelve una Promise<Buffer>.
// Filtra por moderation_status = 'approved' EL MISMO (no confia en el caller).
async function generateBookPdf(memorial, condolences) {
  const approved = (condolences || []).filter((c) => c.moderation_status === 'approved');
  const colors = getTemplateColors(memorial.template_id);

  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const donePromise = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // ---------- PORTADA ----------
  const bandHeight = doc.page.height * 0.15;
  doc.rect(0, 0, doc.page.width, bandHeight).fill(colors.accent);
  doc.fillColor('#ffffff')
    .font('Times-Bold')
    .fontSize(20)
    .text('En memoria de', 0, bandHeight / 2 - 12, {
      width: doc.page.width,
      align: 'center'
    });

  let cursorY = bandHeight + 40;

  // Foto (si existe y se puede descargar)
  const photoBuffer = await fetchImageBuffer(memorial.photo_url);
  if (photoBuffer) {
    try {
      const photoSize = 180;
      const photoX = (doc.page.width - photoSize) / 2;
      doc.save();
      doc.circle(doc.page.width / 2, cursorY + photoSize / 2, photoSize / 2).clip();
      doc.image(photoBuffer, photoX, cursorY, { width: photoSize, height: photoSize });
      doc.restore();
      cursorY += photoSize + 30;
    } catch (err) {
      console.error('[BOOK] No se pudo dibujar la foto en el PDF:', err.message);
    }
  }

  doc.fillColor('#222222')
    .font('Times-Bold')
    .fontSize(28)
    .text(memorial.deceased_name || '', PAGE_MARGIN, cursorY, {
      width: doc.page.width - PAGE_MARGIN * 2,
      align: 'center'
    });
  cursorY = doc.y + 8;

  const years = [memorial.birth_year, memorial.death_year].filter((y) => y !== null && y !== undefined && y !== '');
  if (years.length > 0) {
    doc.font('Times-Roman')
      .fontSize(16)
      .fillColor('#555555')
      .text(years.join(' — '), PAGE_MARGIN, cursorY, {
        width: doc.page.width - PAGE_MARGIN * 2,
        align: 'center'
      });
    cursorY = doc.y + 20;
  } else {
    cursorY += 20;
  }

  if (memorial.emotional_message) {
    doc.font('Times-Italic')
      .fontSize(12)
      .fillColor('#444444')
      .text(memorial.emotional_message, PAGE_MARGIN + 40, cursorY, {
        width: doc.page.width - (PAGE_MARGIN + 40) * 2,
        align: 'center'
      });
  }

  doc.font('Times-Roman')
    .fontSize(8)
    .fillColor('#888888')
    .text(
      'Los Olivos · SERCOFUN — generado el ' + formatDate(new Date()),
      PAGE_MARGIN,
      doc.page.height - 40,
      { width: doc.page.width - PAGE_MARGIN * 2, align: 'center' }
    );

  // ---------- PAGINAS DE MENSAJES ----------
  doc.addPage();
  let pageNumber = 2;

  const contentWidth = doc.page.width - PAGE_MARGIN * 2;
  const bottomLimit = doc.page.height - 70;

  function ensureSpace(neededHeight) {
    if (doc.y + neededHeight > bottomLimit) {
      drawFooter(doc, colors, pageNumber);
      doc.addPage();
      pageNumber += 1;
      drawHeaderIfNeeded();
    }
  }

  let headerDrawnOnPage = false;
  function drawHeaderIfNeeded() {
    if (headerDrawnOnPage) return;
    headerDrawnOnPage = true;
  }

  // Encabezado principal (solo primera pagina de mensajes)
  doc.font('Times-Bold')
    .fontSize(18)
    .fillColor('#222222')
    .text(`Mensajes de condolencia (${approved.length})`, PAGE_MARGIN, PAGE_MARGIN);
  const headerBottomY = doc.y + 6;
  doc.moveTo(PAGE_MARGIN, headerBottomY)
    .lineTo(PAGE_MARGIN + contentWidth, headerBottomY)
    .lineWidth(2)
    .strokeColor(colors.accent)
    .stroke();
  doc.moveDown(1.5);

  if (approved.length === 0) {
    doc.font('Times-Italic')
      .fontSize(12)
      .fillColor('#666666')
      .text('Aún no hay mensajes publicados para este homenaje.', PAGE_MARGIN, doc.y + 20, {
        width: contentWidth,
        align: 'center'
      });
  } else {
    for (const c of approved) {
      // Estimar altura necesaria antes de escribir (nombre + fecha + mensaje + separador)
      doc.font('Times-Roman').fontSize(11);
      const messageHeight = doc.heightOfString(c.message || '', { width: contentWidth });
      const neededHeight = 18 + messageHeight + 16;
      ensureSpace(neededHeight);

      const rowY = doc.y;
      doc.font('Times-Bold')
        .fontSize(12)
        .fillColor('#222222')
        .text(c.sender_name || 'Anonimo', PAGE_MARGIN, rowY, { continued: false, width: contentWidth - 120 });

      doc.font('Times-Roman')
        .fontSize(9)
        .fillColor('#999999')
        .text(formatDate(c.created_at), PAGE_MARGIN, rowY, { width: contentWidth, align: 'right' });

      doc.font('Times-Roman')
        .fontSize(11)
        .fillColor('#333333')
        .text(c.message || '', PAGE_MARGIN, doc.y + 4, { width: contentWidth });

      const sepY = doc.y + 10;
      doc.moveTo(PAGE_MARGIN, sepY)
        .lineTo(PAGE_MARGIN + contentWidth, sepY)
        .lineWidth(0.5)
        .strokeColor('#dddddd')
        .stroke();
      doc.y = sepY + 12;
    }
  }

  drawFooter(doc, colors, pageNumber);

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
