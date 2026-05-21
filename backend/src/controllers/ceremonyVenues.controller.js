const db = require('../config/database');

// Listar venues con filtros opcionales por kind y location_id.
// Devuelve venues globales (location_id IS NULL) + los de la sede si se pasa location_id.
const getAll = async (req, res, next) => {
  try {
    const { kind, location_id } = req.query;

    const params = [];
    let query = `
      SELECT v.id, v.name, v.kind, v.location_id, v.active,
             l.name AS location_name
      FROM ceremony_venues v
      LEFT JOIN locations l ON v.location_id = l.id
      WHERE v.active = true
    `;

    if (kind) {
      params.push(kind);
      // 'both' tambien aplica si piden 'exequias' o 'destino_final'
      if (kind === 'exequias' || kind === 'destino_final') {
        query += ` AND v.kind IN ($${params.length}, 'both')`;
      } else {
        query += ` AND v.kind = $${params.length}`;
      }
    }

    if (location_id) {
      params.push(location_id);
      // Venues globales (location_id IS NULL) + venues de la sede pedida
      query += ` AND (v.location_id IS NULL OR v.location_id = $${params.length})`;
    }

    query += ' ORDER BY v.kind, v.name';

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, kind, location_id } = req.body;
    if (!name || !kind) {
      return res.status(400).json({ success: false, error: 'name y kind son requeridos' });
    }
    if (!['exequias', 'destino_final', 'both'].includes(kind)) {
      return res.status(400).json({ success: false, error: 'kind invalido' });
    }
    const result = await db.query(`
      INSERT INTO ceremony_venues (name, kind, location_id, active)
      VALUES ($1, $2, $3, true)
      RETURNING *
    `, [name, kind, location_id || null]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Soft delete: marcar inactivo para no romper FKs en memorials existentes.
    const result = await db.query(
      'UPDATE ceremony_venues SET active = false WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Venue no encontrado' });
    }
    res.json({ success: true, message: 'Venue desactivado' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, remove };
