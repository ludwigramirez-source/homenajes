// Controller de "Books" (libro de condolencias en PDF): configuracion SMTP,
// listado/envio manual/descarga. Ver contrato completo en books.routes.js.
const fs = require('fs');
const db = require('../config/database');
const emailService = require('../services/email.service');
const bookService = require('../services/book.service');

// ---------- Configuracion SMTP ----------

// Nunca se expone smtp_password en texto plano, solo has_password (bool).
function sanitizeSettings(row) {
  if (!row) {
    return {
      configured: false,
      smtp_host: null,
      smtp_port: 587,
      smtp_secure: false,
      smtp_user: null,
      from_name: 'SERCOFUN Los Olivos',
      from_email: null,
      send_delay_days: 1,
      has_password: false,
      updated_at: null
    };
  }
  return {
    configured: !!(row.smtp_host && row.smtp_user && row.smtp_password),
    smtp_host: row.smtp_host,
    smtp_port: row.smtp_port,
    smtp_secure: row.smtp_secure === true,
    smtp_user: row.smtp_user,
    from_name: row.from_name,
    from_email: row.from_email,
    send_delay_days: row.send_delay_days,
    has_password: !!row.smtp_password,
    updated_at: row.updated_at
  };
}

// GET /api/books/settings
const getSettings = async (req, res, next) => {
  try {
    const settings = await emailService.getSettings();
    res.json({ success: true, data: sanitizeSettings(settings) });
  } catch (error) {
    next(error);
  }
};

// PUT /api/books/settings
const updateSettings = async (req, res, next) => {
  try {
    const {
      smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password,
      from_name, from_email, send_delay_days
    } = req.body;

    if (smtp_port !== undefined && smtp_port !== null && !Number.isFinite(Number(smtp_port))) {
      return res.status(400).json({ success: false, error: 'smtp_port debe ser numerico' });
    }
    if (smtp_secure !== undefined && typeof smtp_secure !== 'boolean') {
      return res.status(400).json({ success: false, error: 'smtp_secure debe ser booleano' });
    }
    if (send_delay_days !== undefined && send_delay_days !== null) {
      const n = Number(send_delay_days);
      if (!Number.isInteger(n) || n < 0) {
        return res.status(400).json({ success: false, error: 'send_delay_days debe ser un entero >= 0' });
      }
    }

    const saved = await emailService.saveSettings({
      smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password,
      from_name, from_email, send_delay_days,
      updated_by: req.user.id
    });
    res.json({ success: true, data: sanitizeSettings(saved) });
  } catch (error) {
    next(error);
  }
};

// POST /api/books/settings/test  body: { to_email }
const testSettings = async (req, res, next) => {
  try {
    const { to_email } = req.body;
    if (!to_email) {
      return res.status(400).json({ success: false, error: 'to_email es requerido' });
    }

    try {
      await emailService.sendTestMail(to_email);
      res.json({ success: true });
    } catch (mailErr) {
      res.json({ success: false, error: mailErr.message });
    }
  } catch (error) {
    next(error);
  }
};

// ---------- Books (envios) ----------

const BOOK_SENDS_SELECT = `
  SELECT
    bs.id, bs.memorial_id, m.deceased_name, m.deceased_document_id,
    r.name as room_name, l.name as location_name,
    bs.recipient_email, bs.status, bs.message_count, bs.trigger_type,
    bs.error_message, bs.attempt_count, bs.sent_at, bs.created_at,
    (bs.pdf_path IS NOT NULL) as has_pdf
  FROM book_sends bs
  JOIN memorials m ON bs.memorial_id = m.id
  JOIN rooms r ON m.room_id = r.id
  JOIN locations l ON r.location_id = l.id
  WHERE 1=1
`;

// GET /api/books
const getAll = async (req, res, next) => {
  try {
    const { search, status, from, to } = req.query;

    let query = BOOK_SENDS_SELECT;
    const params = [];

    if (req.user && req.user.role === 'operator') {
      params.push(req.user.location_id || '00000000-0000-0000-0000-000000000000');
      query += ` AND r.location_id = $${params.length}`;
    }
    if (status && ['pending', 'sent', 'failed'].includes(status)) {
      params.push(status);
      query += ` AND bs.status = $${params.length}`;
    }
    if (from) {
      params.push(from + ' 00:00:00');
      query += ` AND bs.created_at >= $${params.length}`;
    }
    if (to) {
      params.push(to + ' 23:59:59');
      query += ` AND bs.created_at <= $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (m.deceased_name ILIKE $${params.length} OR m.deceased_document_id ILIKE $${params.length} OR bs.recipient_email ILIKE $${params.length})`;
    }

    query += ' ORDER BY bs.created_at DESC';

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

// POST /api/books/:memorialId/send
const send = async (req, res, next) => {
  try {
    const { memorialId } = req.params;

    const memorialResult = await db.query(`
      SELECT m.*, r.location_id
      FROM memorials m
      JOIN rooms r ON m.room_id = r.id
      WHERE m.id = $1
    `, [memorialId]);

    if (memorialResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Homenaje no encontrado' });
    }

    const memorial = memorialResult.rows[0];

    if (req.user.role === 'operator' && memorial.location_id !== req.user.location_id) {
      return res.status(403).json({ success: false, error: 'No puedes enviar el libro de un homenaje de otra sede' });
    }

    if (!memorial.family_contact_email) {
      return res.status(400).json({
        success: false,
        error: 'El homenaje no tiene correo de titular configurado (family_contact_email)'
      });
    }

    const condolencesResult = await db.query(
      `SELECT * FROM condolences WHERE memorial_id = $1 AND moderation_status = 'approved' ORDER BY created_at DESC`,
      [memorialId]
    );

    const bookSend = await bookService.processAndSendBook(memorial, condolencesResult.rows, {
      triggerType: 'manual',
      triggeredBy: req.user.id
    });

    const rowResult = await db.query(BOOK_SENDS_SELECT + ' AND bs.id = $1', [bookSend.id]);

    res.json({ success: bookSend.status !== 'failed', data: rowResult.rows[0] });
  } catch (error) {
    next(error);
  }
};

// GET /api/books/:id/download
const download = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT bs.id, bs.pdf_path, m.deceased_name, r.location_id
      FROM book_sends bs
      JOIN memorials m ON bs.memorial_id = m.id
      JOIN rooms r ON m.room_id = r.id
      WHERE bs.id = $1
    `;
    const params = [id];

    const result = await db.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Envio no encontrado' });
    }

    const row = result.rows[0];
    if (req.user.role === 'operator' && row.location_id !== req.user.location_id) {
      return res.status(403).json({ success: false, error: 'No puedes descargar el libro de un homenaje de otra sede' });
    }

    if (!row.pdf_path || !fs.existsSync(row.pdf_path)) {
      return res.status(404).json({ success: false, error: 'El archivo PDF no existe' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="libro-condolencias-${row.id}.pdf"`);
    fs.createReadStream(row.pdf_path).pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings, testSettings, getAll, send, download };
