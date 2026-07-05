const db = require('../config/database');
const llmService = require('../services/llm.service');

// Limite de caracteres del mensaje publico (debe ser legible en la pantalla del display)
const MESSAGE_MAX_LENGTH = 480;

// PUBLICO - Sin auth, desde el formulario
const submit = async (req, res, next) => {
  try {
    const { memorial_id, sender_name, sender_email, sender_phone, message, marketing_consent } = req.body;

    // Validacion
    if (!memorial_id || !sender_name || !sender_email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: memorial_id, sender_name, sender_email, message'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sender_email)) {
      return res.status(400).json({ success: false, error: 'Email invalido' });
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'El mensaje no puede estar vacio' });
    }

    if (message.length > MESSAGE_MAX_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `El mensaje supera el limite de ${MESSAGE_MAX_LENGTH} caracteres`
      });
    }

    // Verificar que el memorial exista y este activo
    const memorialCheck = await db.query(
      'SELECT id FROM memorials WHERE id = $1 AND active = true',
      [memorial_id]
    );

    if (memorialCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Homenaje no encontrado o inactivo'
      });
    }

    // Procesar archivos subidos (max 2)
    let file1_url = null;
    let file2_url = null;
    
    if (req.files && req.files.length > 0) {
      if (req.files[0]) file1_url = `/uploads/${req.files[0].filename}`;
      if (req.files[1]) file2_url = `/uploads/${req.files[1].filename}`;
    }

    // Moderacion automatica con IA (nunca tumba el submit: ante error o
    // configuracion ausente devuelve status 'unmoderated' y published=true).
    const mod = await llmService.moderateMessage({ message, senderName: sender_name });

    // Insertar condolencia con el resultado de la moderacion
    const result = await db.query(`
      INSERT INTO condolences (
        memorial_id, sender_name, sender_email, sender_phone,
        message, file1_url, file2_url, marketing_consent, ip_address,
        moderation_status, moderation_reason, moderation_model, moderated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id, created_at
    `, [
      memorial_id, sender_name, sender_email, sender_phone,
      message, file1_url, file2_url,
      marketing_consent === true || marketing_consent === 'true',
      req.ip,
      mod.status, mod.reason || null, mod.model || null
    ]);

    // Vincular el registro de gasto LLM con la condolencia creada
    if (mod.usageId) {
      llmService.linkUsageToCondolence(mod.usageId, result.rows[0].id).catch(() => { /* ignore */ });
    }

    // Registrar vista para analytics
    await db.query(`
      INSERT INTO memorial_views (memorial_id, view_type, ip_address, user_agent)
      VALUES ($1, 'form_open', $2, $3)
    `, [memorial_id, req.ip, req.get('user-agent')]);

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        created_at: result.rows[0].created_at,
        published: mod.published !== false,
        message: mod.published !== false
          ? 'Condolencia enviada exitosamente'
          : 'Mensaje recibido; no sera publicado en pantalla'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Tablon / admin - Listar condolencias con filtros.
// Filtros: memorial_id, status (approved|rejected|unmoderated), from, to
// (YYYY-MM-DD sobre created_at), search (nombre/correo/mensaje), marketing_consent.
// Scope por rol: el operador de sede SOLO ve mensajes de su sede.
const getAll = async (req, res, next) => {
  try {
    const {
      memorial_id, marketing_consent, status, from, to, search,
      limit = 200, offset = 0
    } = req.query;

    let query = `
      SELECT
        c.*,
        m.deceased_name as memorial_name,
        m.deceased_name,
        m.template_id,
        r.name as room_name,
        l.name as location_name
      FROM condolences c
      JOIN memorials m ON c.memorial_id = m.id
      JOIN rooms r ON m.room_id = r.id
      JOIN locations l ON r.location_id = l.id
      WHERE 1=1
    `;

    const params = [];
    if (req.user && req.user.role === 'operator') {
      params.push(req.user.location_id || '00000000-0000-0000-0000-000000000000');
      query += ` AND r.location_id = $${params.length}`;
    }
    if (memorial_id) {
      params.push(memorial_id);
      query += ` AND c.memorial_id = $${params.length}`;
    }
    if (status && ['approved', 'rejected', 'unmoderated'].includes(status)) {
      params.push(status);
      query += ` AND c.moderation_status = $${params.length}`;
    }
    if (from) {
      params.push(from + ' 00:00:00');
      query += ` AND c.created_at >= $${params.length}`;
    }
    if (to) {
      params.push(to + ' 23:59:59');
      query += ` AND c.created_at <= $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.sender_name ILIKE $${params.length} OR c.sender_email ILIKE $${params.length} OR c.message ILIKE $${params.length})`;
    }
    if (marketing_consent !== undefined) {
      params.push(marketing_consent === 'true');
      query += ` AND c.marketing_consent = $${params.length}`;
    }

    params.push(parseInt(limit));
    query += ` ORDER BY c.created_at DESC LIMIT $${params.length}`;
    params.push(parseInt(offset));
    query += ` OFFSET $${params.length}`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

// Override manual de moderacion desde el Tablon.
// admin/supervisor: cualquier mensaje. operator: solo mensajes de su sede.
const moderate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'action debe ser approve o reject' });
    }

    if (req.user.role === 'operator') {
      const check = await db.query(`
        SELECT c.id FROM condolences c
        JOIN memorials m ON c.memorial_id = m.id
        JOIN rooms r ON m.room_id = r.id
        WHERE c.id = $1 AND r.location_id = $2
      `, [id, req.user.location_id || '00000000-0000-0000-0000-000000000000']);
      if (check.rows.length === 0) {
        return res.status(403).json({ success: false, error: 'No puedes moderar mensajes de otra sede' });
      }
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const result = await db.query(`
      UPDATE condolences
      SET moderation_status = $1,
          moderation_reason = 'revision manual',
          moderation_model = 'manual',
          moderated_at = NOW()
      WHERE id = $2
      RETURNING id, moderation_status
    `, [newStatus, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Condolencia no encontrada' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const getByMemorial = async (req, res, next) => {
  try {
    const { memorialId } = req.params;

    const result = await db.query(`
      SELECT * FROM condolences
      WHERE memorial_id = $1
      ORDER BY created_at DESC
    `, [memorialId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM condolences WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Condolencia no encontrada' });
    }

    res.json({ success: true, message: 'Condolencia eliminada' });
  } catch (error) {
    next(error);
  }
};

// PUBLICO - Mensajes de un homenaje, sanitizados para mostrar en la pantalla del display.
// Devuelve solo: id, sender_name, message, file1_url, file2_url, created_at.
// Excluye email, telefono e IP por privacidad.
const getPublicByMemorial = async (req, res, next) => {
  try {
    const { memorialId } = req.params;
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = Math.min(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 60, 200);

    // Verificar que el memorial exista y este activo (no exponemos mensajes de homenajes inactivos)
    const memorialCheck = await db.query(
      'SELECT id FROM memorials WHERE id = $1 AND active = true',
      [memorialId]
    );

    if (memorialCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Homenaje no encontrado o inactivo'
      });
    }

    const result = await db.query(`
      SELECT id, sender_name, message, file1_url, file2_url, created_at
      FROM condolences
      WHERE memorial_id = $1
        AND moderation_status <> 'rejected'
      ORDER BY created_at DESC
      LIMIT $2
    `, [memorialId, limit]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

module.exports = { submit, getAll, getByMemorial, getPublicByMemorial, moderate, remove };
