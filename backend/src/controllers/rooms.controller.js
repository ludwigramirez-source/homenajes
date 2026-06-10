const db = require('../config/database');

const getAll = async (req, res, next) => {
  try {
    const { location_id, active } = req.query;
    
    let query = `
      SELECT 
        r.*,
        l.name as location_name,
        l.city as location_city,
        (
          SELECT row_to_json(m) FROM (
            SELECT id, deceased_name, photo_url, schedule_start, schedule_end
            FROM memorials
            WHERE room_id = r.id 
              AND active = true 
              AND CURRENT_TIMESTAMP BETWEEN schedule_start AND schedule_end
            LIMIT 1
          ) m
        ) as active_memorial
      FROM rooms r
      JOIN locations l ON r.location_id = l.id
      WHERE 1=1
    `;
    
    const params = [];
    if (location_id) {
      params.push(location_id);
      query += ` AND r.location_id = $${params.length}`;
    }
    if (active !== undefined) {
      params.push(active === 'true');
      query += ` AND r.active = $${params.length}`;
    }

    query += ' ORDER BY l.name, r.name';

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT 
        r.*,
        l.name as location_name,
        l.city as location_city,
        l.address as location_address
      FROM rooms r
      JOIN locations l ON r.location_id = l.id
      WHERE r.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Sala no encontrada' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Obtener memorial activo de una sala (publico, sin auth)
const getActiveMemorial = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT
        m.*,
        r.name as room_name,
        r.code as room_code,
        l.name as location_name,
        l.city as location_city,
        ev.name as exequias_venue_name,
        fd.name as final_destination_venue_name,
        TO_CHAR(m.daily_hours_start, 'HH24:MI') as daily_hours_start_str,
        TO_CHAR(m.daily_hours_end, 'HH24:MI') as daily_hours_end_str
      FROM memorials m
      JOIN rooms r ON m.room_id = r.id
      JOIN locations l ON r.location_id = l.id
      LEFT JOIN ceremony_venues ev ON m.exequias_venue_id = ev.id
      LEFT JOIN ceremony_venues fd ON m.final_destination_venue_id = fd.id
      WHERE (r.code = UPPER($1) OR r.id::text = $1)
        AND m.active = true
        AND CURRENT_TIMESTAMP BETWEEN m.schedule_start AND m.schedule_end
      LIMIT 1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No hay homenaje activo en esta sala en este momento'
      });
    }

    // Registrar vista para analytics
    await db.query(`
      INSERT INTO memorial_views (memorial_id, view_type, ip_address)
      VALUES ($1, 'display', $2)
    `, [result.rows[0].id, req.ip]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Tipos de sala validos.
const VALID_ROOM_TYPES = ['ejecutiva', 'presidencial', 'vip'];

const create = async (req, res, next) => {
  try {
    const { location_id, name, code, capacity, room_type } = req.body;

    if (!location_id || !name || !code) {
      return res.status(400).json({
        success: false,
        error: 'location_id, nombre y codigo son requeridos'
      });
    }

    if (room_type && !VALID_ROOM_TYPES.includes(room_type)) {
      return res.status(400).json({ success: false, error: 'Tipo de sala invalido' });
    }

    const result = await db.query(`
      INSERT INTO rooms (location_id, name, code, capacity, room_type, active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `, [location_id, name, code, capacity || null, room_type || null]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    // 23505 = unique_violation (codigo de sala duplicado)
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'Ya existe una sala con ese codigo' });
    }
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, capacity, room_type, active } = req.body;

    if (room_type && !VALID_ROOM_TYPES.includes(room_type)) {
      return res.status(400).json({ success: false, error: 'Tipo de sala invalido' });
    }

    const result = await db.query(`
      UPDATE rooms
      SET name = COALESCE($1, name),
          code = COALESCE($2, code),
          capacity = COALESCE($3, capacity),
          room_type = COALESCE($4, room_type),
          active = COALESCE($5, active)
      WHERE id = $6
      RETURNING *
    `, [name, code, capacity, room_type, active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Sala no encontrada' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'Ya existe una sala con ese codigo' });
    }
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM rooms WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Sala no encontrada' });
    }

    res.json({ success: true, message: 'Sala eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, getActiveMemorial, create, update, remove };
