const db = require('../config/database');

// Plantillas visuales validas para el display (misma whitelist que el view).
const VALID_TEMPLATE_IDS = ['default', 'nino', 'nina', 'nubes', 'naturaleza', 'adulto'];

// Extrae el año de una fecha "AAAA-MM-DD" por texto (sin pasar por Date, para
// no depender de ninguna zona horaria). birth_year/death_year son lo unico
// que se muestra en pantalla/book; se derivan siempre de birth_date/death_date.
const yearFromDate = (dateStr) => {
  if (!dateStr) return null;
  const y = parseInt(String(dateStr).slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
};

const getAll = async (req, res, next) => {
  try {
    const { active, location_id, room_id } = req.query;

    let query = `
      SELECT
        m.*,
        r.name as room_name,
        r.code as room_code,
        l.name as location_name,
        l.city as location_city,
        (SELECT COUNT(*) FROM condolences WHERE memorial_id = m.id) as condolence_count
      FROM memorials m
      JOIN rooms r ON m.room_id = r.id
      JOIN locations l ON r.location_id = l.id
      WHERE 1=1
    `;

    const params = [];
    // El operador de sede SOLO ve homenajes de su propia sede (ignora
    // cualquier location_id que venga por query string, para que no pueda
    // pedir explicitamente los de otra sede).
    if (req.user && req.user.role === 'operator') {
      params.push(req.user.location_id || '00000000-0000-0000-0000-000000000000');
      query += ` AND l.id = $${params.length}`;
    } else if (location_id) {
      params.push(location_id);
      query += ` AND l.id = $${params.length}`;
    }
    if (active !== undefined) {
      params.push(active === 'true');
      query += ` AND m.active = $${params.length}`;
    }
    if (room_id) {
      params.push(room_id);
      query += ` AND r.id = $${params.length}`;
    }

    query += ' ORDER BY m.schedule_start DESC';

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const memorialResult = await db.query(`
      SELECT
        m.*,
        r.name as room_name,
        r.code as room_code,
        l.id as location_id,
        l.name as location_name,
        l.city as location_city,
        u.full_name as created_by_name
      FROM memorials m
      JOIN rooms r ON m.room_id = r.id
      JOIN locations l ON r.location_id = l.id
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.id = $1
    `, [id]);

    if (memorialResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Homenaje no encontrado' });
    }

    // El operador de sede solo puede ver/editar homenajes de su propia sede.
    if (req.user.role === 'operator' && memorialResult.rows[0].location_id !== req.user.location_id) {
      return res.status(403).json({ success: false, error: 'No tienes acceso a homenajes de otra sede' });
    }

    const condolencesResult = await db.query(
      'SELECT * FROM condolences WHERE memorial_id = $1 ORDER BY created_at DESC',
      [id]
    );

    const viewsResult = await db.query(`
      SELECT view_type, COUNT(*) as count
      FROM memorial_views
      WHERE memorial_id = $1
      GROUP BY view_type
    `, [id]);

    res.json({
      success: true,
      data: {
        ...memorialResult.rows[0],
        condolences: condolencesResult.rows,
        analytics: viewsResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      room_id, deceased_name, birth_date, death_date, photo_url,
      emotional_message, qr_message, template_id, schedule_start, schedule_end,
      exequias_venue_name, exequias_datetime,
      final_destination_venue_name, final_destination_datetime,
      daily_hours_start, daily_hours_end,
      family_contact_name, family_contact_phone, family_contact_email, billing_address,
      deceased_document_id, family_contact_document_id, is_religious
    } = req.body;

    if (!room_id || !deceased_name || !emotional_message || !schedule_start || !schedule_end) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: room_id, deceased_name, emotional_message, schedule_start, schedule_end'
      });
    }

    if (template_id && VALID_TEMPLATE_IDS.indexOf(template_id) === -1) {
      return res.status(400).json({
        success: false,
        error: 'template_id invalido. Valores permitidos: ' + VALID_TEMPLATE_IDS.join(', ')
      });
    }

    // El operador de sede solo puede crear homenajes en salas de su propia
    // sede (evita que por error asigne el homenaje a otra sede).
    if (req.user.role === 'operator') {
      const roomCheck = await db.query('SELECT location_id FROM rooms WHERE id = $1', [room_id]);
      if (roomCheck.rows.length === 0 || roomCheck.rows[0].location_id !== req.user.location_id) {
        return res.status(403).json({ success: false, error: 'Solo puedes crear homenajes en tu sede asignada' });
      }
    }

    const result = await db.query(`
      INSERT INTO memorials (
        room_id, deceased_name, birth_year, death_year, birth_date, death_date, photo_url,
        emotional_message, qr_message, template_id, schedule_start, schedule_end,
        active, created_by,
        exequias_venue_name, exequias_datetime,
        final_destination_venue_name, final_destination_datetime,
        daily_hours_start, daily_hours_end,
        family_contact_name, family_contact_phone, family_contact_email, billing_address,
        deceased_document_id, family_contact_document_id, is_religious
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, $14, $15, $16, $17,
              COALESCE($18::time, '08:00'::time), COALESCE($19::time, '23:00'::time),
              $20, $21, $22, $23, $24, $25, $26)
      RETURNING *
    `, [
      room_id, deceased_name, yearFromDate(birth_date), yearFromDate(death_date),
      birth_date || null, death_date || null, photo_url,
      emotional_message, qr_message, template_id || 'default',
      schedule_start, schedule_end, req.user.id,
      exequias_venue_name || null,
      exequias_datetime || null,
      final_destination_venue_name || null,
      final_destination_datetime || null,
      daily_hours_start || null,
      daily_hours_end || null,
      family_contact_name || null,
      family_contact_phone || null,
      family_contact_email || null,
      billing_address || null,
      deceased_document_id || null,
      family_contact_document_id || null,
      !!is_religious
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      deceased_name, birth_date, death_date, photo_url,
      emotional_message, qr_message, template_id, schedule_start, schedule_end, active,
      exequias_venue_name, exequias_datetime,
      final_destination_venue_name, final_destination_datetime,
      daily_hours_start, daily_hours_end,
      family_contact_name, family_contact_phone, family_contact_email, billing_address,
      deceased_document_id, family_contact_document_id, is_religious
    } = req.body;

    if (template_id !== undefined && template_id !== null &&
        VALID_TEMPLATE_IDS.indexOf(template_id) === -1) {
      return res.status(400).json({
        success: false,
        error: 'template_id invalido. Valores permitidos: ' + VALID_TEMPLATE_IDS.join(', ')
      });
    }

    // El operador de sede solo puede editar homenajes de su propia sede.
    if (req.user.role === 'operator') {
      const check = await db.query(`
        SELECT r.location_id FROM memorials m JOIN rooms r ON m.room_id = r.id WHERE m.id = $1
      `, [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Homenaje no encontrado' });
      }
      if (check.rows[0].location_id !== req.user.location_id) {
        return res.status(403).json({ success: false, error: 'Solo puedes editar homenajes de tu sede asignada' });
      }
    }

    const result = await db.query(`
      UPDATE memorials
      SET deceased_name = COALESCE($1, deceased_name),
          birth_year = COALESCE($2, birth_year),
          death_year = COALESCE($3, death_year),
          birth_date = COALESCE($4, birth_date),
          death_date = COALESCE($5, death_date),
          photo_url = COALESCE($6, photo_url),
          emotional_message = COALESCE($7, emotional_message),
          qr_message = COALESCE($8, qr_message),
          template_id = COALESCE($9, template_id),
          schedule_start = COALESCE($10, schedule_start),
          schedule_end = COALESCE($11, schedule_end),
          active = COALESCE($12, active),
          exequias_venue_name = COALESCE($13, exequias_venue_name),
          exequias_datetime = COALESCE($14, exequias_datetime),
          final_destination_venue_name = COALESCE($15, final_destination_venue_name),
          final_destination_datetime = COALESCE($16, final_destination_datetime),
          daily_hours_start = COALESCE($17::time, daily_hours_start),
          daily_hours_end = COALESCE($18::time, daily_hours_end),
          family_contact_name = COALESCE($19, family_contact_name),
          family_contact_phone = COALESCE($20, family_contact_phone),
          family_contact_email = COALESCE($21, family_contact_email),
          billing_address = COALESCE($22, billing_address),
          deceased_document_id = COALESCE($23, deceased_document_id),
          family_contact_document_id = COALESCE($24, family_contact_document_id),
          is_religious = COALESCE($25, is_religious)
      WHERE id = $26
      RETURNING *
    `, [
      deceased_name, yearFromDate(birth_date), yearFromDate(death_date), birth_date, death_date, photo_url,
      emotional_message, qr_message, template_id,
      schedule_start, schedule_end, active,
      exequias_venue_name, exequias_datetime,
      final_destination_venue_name, final_destination_datetime,
      daily_hours_start, daily_hours_end,
      family_contact_name, family_contact_phone, family_contact_email, billing_address,
      deceased_document_id, family_contact_document_id,
      (is_religious === undefined ? null : !!is_religious),
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Homenaje no encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM memorials WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Homenaje no encontrado' });
    }

    res.json({ success: true, message: 'Homenaje eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
};

// Subir foto del difunto
const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se envio archivo' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, data: { photo_url: photoUrl } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove, uploadPhoto };
