// Controller de "Books" (libro de condolencias en PDF): configuracion SMTP,
// listado/envio manual/descarga. Ver contrato completo en books.routes.js.
const fs = require('fs');
const db = require('../config/database');
const emailService = require('../services/email.service');
const bookService = require('../services/book.service');

// Carga un memorial + location_id, validando el scoping de sede de 'operator'.
// Devuelve el memorial o null si ya se respondio con un error (404/403).
async function loadMemorialScoped(req, res, memorialId) {
  const result = await db.query(`
    SELECT m.*, r.location_id
    FROM memorials m
    JOIN rooms r ON m.room_id = r.id
    WHERE m.id = $1
  `, [memorialId]);

  if (result.rows.length === 0) {
    res.status(404).json({ success: false, error: 'Homenaje no encontrado' });
    return null;
  }

  const memorial = result.rows[0];
  if (req.user.role === 'operator' && memorial.location_id !== req.user.location_id) {
    res.status(403).json({ success: false, error: 'No puedes acceder al book de un homenaje de otra sede' });
    return null;
  }
  return memorial;
}

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

// Query base: UN registro por HOMENAJE (no por intento de envio), con el
// ultimo intento (si existe) embebido. Reemplaza el listado anterior que
// mostraba solo homenajes con al menos un envio ya intentado.
const MEMORIAL_BOOK_SELECT = `
  SELECT
    m.id as memorial_id,
    m.deceased_name,
    m.deceased_document_id,
    m.schedule_end,
    m.family_contact_email,
    m.active,
    r.name as room_name,
    r.code as room_code,
    l.id as location_id,
    l.name as location_name,
    COALESCE(cc.approved_count, 0) as approved_message_count,
    COALESCE(cc.unmoderated_count, 0) as unmoderated_message_count,
    COALESCE(sc.attempts, 0) as send_attempts_count,
    EXISTS(
      SELECT 1 FROM book_sends bs WHERE bs.memorial_id = m.id AND bs.trigger_type = 'auto'
    ) as auto_attempted,
    ls.id as last_send_id,
    ls.status as last_send_status,
    ls.trigger_type as last_send_trigger_type,
    ls.recipient_email as last_send_recipient_email,
    ls.sent_at as last_send_sent_at,
    ls.created_at as last_send_created_at,
    ls.error_message as last_send_error_message,
    ls.message_count as last_send_message_count,
    (ls.pdf_path IS NOT NULL) as last_send_has_pdf
  FROM memorials m
  JOIN rooms r ON m.room_id = r.id
  JOIN locations l ON r.location_id = l.id
  LEFT JOIN LATERAL (
    SELECT * FROM book_sends bs WHERE bs.memorial_id = m.id ORDER BY bs.created_at DESC LIMIT 1
  ) ls ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int as attempts FROM book_sends bs WHERE bs.memorial_id = m.id
  ) sc ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE c.moderation_status = 'approved')::int as approved_count,
      COUNT(*) FILTER (WHERE c.moderation_status = 'unmoderated')::int as unmoderated_count
    FROM condolences c WHERE c.memorial_id = m.id
  ) cc ON true
  WHERE 1=1
`;

// Clasifica el estado de envio de un homenaje. La regla vigente (ver
// jobs/bookScheduler.js) es: el cron intenta el envio automatico UNA sola
// vez por homenaje (send_delay_days despues de schedule_end), y si ese
// intento falla (SMTP caido, sin correo de titular, etc.) NO reintenta solo
// - alguien del staff debe reenviarlo manualmente.
function classifyBookStatus(row, { sendDelayDays, smtpConfigured }) {
  if (!row.last_send_id) {
    if (!row.schedule_end) return 'no_schedule';
    const eta = new Date(row.schedule_end);
    eta.setDate(eta.getDate() + sendDelayDays);
    if (eta > new Date()) return 'scheduled';
    if (!smtpConfigured) return 'blocked_no_smtp';
    return 'awaiting_run';
  }
  if (row.last_send_status === 'sent') {
    return row.last_send_trigger_type === 'auto' ? 'sent_auto' : 'sent_manual';
  }
  if (row.last_send_status === 'failed') {
    return row.last_send_trigger_type === 'auto' ? 'auto_failed' : 'manual_failed';
  }
  return 'pending_send';
}

function auto_send_eta(row, sendDelayDays) {
  if (!row.schedule_end) return null;
  const eta = new Date(row.schedule_end);
  eta.setDate(eta.getDate() + sendDelayDays);
  return eta.toISOString();
}

// GET /api/books — un registro por homenaje, con su estado de envio actual.
const getAll = async (req, res, next) => {
  try {
    const { search, status, from, to } = req.query;

    let query = MEMORIAL_BOOK_SELECT;
    const params = [];

    if (req.user && req.user.role === 'operator') {
      params.push(req.user.location_id || '00000000-0000-0000-0000-000000000000');
      query += ` AND l.id = $${params.length}`;
    }
    if (from) {
      params.push(from + ' 00:00:00');
      query += ` AND m.schedule_end >= $${params.length}`;
    }
    if (to) {
      params.push(to + ' 23:59:59');
      query += ` AND m.schedule_end <= $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (m.deceased_name ILIKE $${params.length} OR m.deceased_document_id ILIKE $${params.length} OR m.family_contact_email ILIKE $${params.length})`;
    }

    query += ' ORDER BY m.schedule_end DESC';

    const [result, settings] = await Promise.all([
      db.query(query, params),
      emailService.getSettings()
    ]);

    const sendDelayDays = Number.isFinite(Number(settings?.send_delay_days)) ? Number(settings.send_delay_days) : 1;
    const smtpConfigured = !!(settings && settings.smtp_host && settings.smtp_user && settings.smtp_password);
    const ctx = { sendDelayDays, smtpConfigured };

    let data = result.rows.map((row) => ({
      ...row,
      book_status: classifyBookStatus(row, ctx),
      auto_send_eta: auto_send_eta(row, sendDelayDays)
    }));

    if (status) {
      data = data.filter((d) => d.book_status === status);
    }

    res.json({
      success: true,
      data,
      meta: { send_delay_days: sendDelayDays, smtp_configured: smtpConfigured }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/books/:memorialId/history — todos los intentos de envio de un homenaje.
const history = async (req, res, next) => {
  try {
    const { memorialId } = req.params;
    const memorial = await loadMemorialScoped(req, res, memorialId);
    if (!memorial) return;

    const result = await db.query(`
      SELECT id, status, recipient_email, message_count, trigger_type,
             error_message, attempt_count, sent_at, created_at,
             (pdf_path IS NOT NULL) as has_pdf
      FROM book_sends
      WHERE memorial_id = $1
      ORDER BY created_at DESC
    `, [memorialId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

// POST /api/books/:memorialId/send
// body opcional: { recipient_emails: string[], subject: string, message: string }
// recipient_emails permite agregar destinatarios ademas (o en lugar) del
// correo de titular guardado en el homenaje; subject/message sobreescriben
// el asunto/texto por defecto del correo (ver book.service#buildEmailHtml).
const send = async (req, res, next) => {
  try {
    const { memorialId } = req.params;
    const { recipient_emails, subject, message } = req.body || {};

    const memorial = await loadMemorialScoped(req, res, memorialId);
    if (!memorial) return;

    const recipients = Array.isArray(recipient_emails)
      ? recipient_emails.map((e) => String(e || '').trim()).filter(Boolean)
      : [];
    const hasRecipient = recipients.length > 0 || !!memorial.family_contact_email;
    if (!hasRecipient) {
      return res.status(400).json({
        success: false,
        error: 'Indica al menos un correo destinatario (el homenaje no tiene correo de titular configurado)'
      });
    }

    const condolencesResult = await db.query(
      `SELECT * FROM condolences WHERE memorial_id = $1 AND moderation_status = 'approved' ORDER BY created_at DESC`,
      [memorialId]
    );

    const bookSend = await bookService.processAndSendBook(memorial, condolencesResult.rows, {
      triggerType: 'manual',
      triggeredBy: req.user.id,
      recipientEmails: recipients,
      subject: subject || undefined,
      message: message || undefined
    });

    const rowResult = await db.query(BOOK_SENDS_SELECT + ' AND bs.id = $1', [bookSend.id]);

    res.json({ success: bookSend.status !== 'failed', data: rowResult.rows[0] });
  } catch (error) {
    next(error);
  }
};

// GET /api/books/:memorialId/preview
// Genera el PDF del book al vuelo (mismo contenido que produciria un envio:
// mensajes aprobados a la fecha) y lo devuelve inline, SIN guardarlo en disco
// ni registrar una fila en book_sends ni enviar correo - es solo para
// visualizar/descargar desde el listado de homenajes antes de que el book
// se envie automaticamente (o para revisarlo de nuevo despues).
const preview = async (req, res, next) => {
  try {
    const { memorialId } = req.params;
    const memorial = await loadMemorialScoped(req, res, memorialId);
    if (!memorial) return; // loadMemorialScoped ya respondio el error

    const condolencesResult = await db.query(
      `SELECT * FROM condolences WHERE memorial_id = $1 AND moderation_status = 'approved' ORDER BY created_at DESC`,
      [memorialId]
    );

    const pdfBuffer = await bookService.generateBookPdf(memorial, condolencesResult.rows);

    const safeName = (memorial.deceased_name || 'homenaje')
      .replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'homenaje';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Libro-${safeName}.pdf"`);
    res.send(pdfBuffer);
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

module.exports = { getSettings, updateSettings, testSettings, getAll, send, preview, history, download };
