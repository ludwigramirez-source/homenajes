const db = require('../config/database');

const getAll = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        l.*,
        COUNT(r.id) as room_count,
        COUNT(r.id) FILTER (WHERE r.active = true) as active_rooms
      FROM locations l
      LEFT JOIN rooms r ON l.id = r.location_id
      GROUP BY l.id
      ORDER BY l.name
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const locationResult = await db.query('SELECT * FROM locations WHERE id = $1', [id]);
    
    if (locationResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Sede no encontrada' });
    }

    const roomsResult = await db.query(
      'SELECT * FROM rooms WHERE location_id = $1 ORDER BY name',
      [id]
    );

    res.json({
      success: true,
      data: { ...locationResult.rows[0], rooms: roomsResult.rows }
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, city, address, phone } = req.body;

    if (!name || !city) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y ciudad son requeridos'
      });
    }

    const result = await db.query(`
      INSERT INTO locations (name, city, address, phone, active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `, [name, city, address, phone]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, city, address, phone, active } = req.body;

    const result = await db.query(`
      UPDATE locations
      SET name = COALESCE($1, name),
          city = COALESCE($2, city),
          address = COALESCE($3, address),
          phone = COALESCE($4, phone),
          active = COALESCE($5, active)
      WHERE id = $6
      RETURNING *
    `, [name, city, address, phone, active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Sede no encontrada' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM locations WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Sede no encontrada' });
    }

    res.json({ success: true, message: 'Sede eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
