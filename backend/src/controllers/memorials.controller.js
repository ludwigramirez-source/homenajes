const db = require('../config/database');

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
        ev.name as exequias_venue_name,
        fd.name as final_destination_venue_name,
        (SELECT COUNT(*) FROM condolences WHERE memorial_id = m.id) as condolence_count
      FROM memorials m
      JOIN rooms r ON m.room_id = r.id
      JOIN locations l ON r.location_id = l.id
      LEFT JOIN ceremony_venues ev ON m.exequias_venue_id = ev.id
      LEFT JOIN ceremony_venues fd ON m.final_destination_venue_id = fd.id
      WHERE 1=1
    `;

    const params = [];
    if (active !== undefined) {
      params.push(active === 'true');
      query += ` AND m.active = $${params.length}`;
    }
    if (location_id) {
      params.push(location_id);
      query += ` AND l.id = $${params.length}`;
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
        l.name as location_name,
        l.city as location_city,
        ev.name as exequias_venue_name,
        fd.name as final_destination_venue_name,
        u.full_name as created_by_name
      FROM memorials m
      JOIN rooms r ON m.room_id = r.id
      JOIN locations l ON r.location_id = l.id
      LEFT JOIN ceremony_venues ev ON m.exequias_venue_id = ev.id
      LEFT JOIN ceremony_venues fd ON m.final_destination_venue_id = fd.id
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.id = $1
    `, [id]);

    if (memorialResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Homenaje no encontrado' });
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
      room_id, deceased_name, birth_year, death_year, photo_url,
      emotional_message, qr_message, template_id, schedule_start, schedule_end,
      exequias_venue_id, exequias_datetime,
      final_destination_venue_id, final_destination_datetime,
      daily_hours_start, daily_hours_end,
      family_contact_name, family_contact_phone, family_contact_email, billing_address
    } = req.body;

    if (!room_id || !deceased_name || !emotional_message || !schedule_start || !schedule_end) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: room_id, deceased_name, emotional_message, schedule_start, schedule_end'
      });
    }

    const result = await db.query(`
      INSERT INTO memorials (
        room_id, deceased_name, birth_year, death_year, photo_url,
        emotional_message, qr_message, template_id, schedule_start, schedule_end,
        active, created_by,
        exequias_venue_id, exequias_datetime,
        final_destination_venue_id, final_destination_datetime,
        daily_hours_start, daily_hours_end,
        family_contact_name, family_contact_phone, family_contact_email, billing_address
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12, $13, $14, $15,
              COALESCE($16::time, '08:00'::time), COALESCE($17::time, '23:00'::time),
              $18, $19, $20, $21)
      RETURNING *
    `, [
      room_id, deceased_name, birth_year, death_year, photo_url,
      emotional_message, qr_message, template_id || 'default',
      schedule_start, schedule_end, req.user.id,
      exequias_venue_id || null,
      exequias_datetime || null,
      final_destination_venue_id || null,
      final_destination_datetime || null,
      daily_hours_start || null,
      daily_hours_end || null,
      family_contact_name || null,
      family_contact_phone || null,
      family_contact_email || null,
      billing_address || null
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
      deceased_name, birth_year, death_year, photo_url,
      emotional_message, qr_message, template_id, schedule_start, schedule_end, active,
      exequias_venue_id, exequias_datetime,
      final_destination_venue_id, final_destination_datetime,
      daily_hours_start, daily_hours_end,
      family_contact_name, family_contact_phone, family_contact_email, billing_address
    } = req.body;

    const result = await db.query(`
      UPDATE memorials
      SET deceased_name = COALESCE($1, deceased_name),
          birth_year = COALESCE($2, birth_year),
          death_year = COALESCE($3, death_year),
          photo_url = COALESCE($4, photo_url),
          emotional_message = COALESCE($5, emotional_message),
          qr_message = COALESCE($6, qr_message),
          template_id = COALESCE($7, template_id),
          schedule_start = COALESCE($8, schedule_start),
          schedule_end = COALESCE($9, schedule_end),
          active = COALESCE($10, active),
          exequias_venue_id = COALESCE($11, exequias_venue_id),
          exequias_datetime = COALESCE($12, exequias_datetime),
          final_destination_venue_id = COALESCE($13, final_destination_venue_id),
          final_destination_datetime = COALESCE($14, final_destination_datetime),
          daily_hours_start = COALESCE($15::time, daily_hours_start),
          daily_hours_end = COALESCE($16::time, daily_hours_end),
          family_contact_name = COALESCE($17, family_contact_name),
          family_contact_phone = COALESCE($18, family_contact_phone),
          family_contact_email = COALESCE($19, family_contact_email),
          billing_address = COALESCE($20, billing_address)
      WHERE id = $21
      RETURNING *
    `, [
      deceased_name, birth_year, death_year, photo_url,
      emotional_message, qr_message, template_id,
      schedule_start, schedule_end, active,
      exequias_venue_id, exequias_datetime,
      final_destination_venue_id, final_destination_datetime,
      daily_hours_start, daily_hours_end,
      family_contact_name, family_contact_phone, family_contact_email, billing_address,
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
