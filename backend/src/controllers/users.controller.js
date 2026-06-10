const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Roles validos que la UI puede asignar. 'supervisor' se conserva por
// compatibilidad pero no se ofrece como opcion nueva.
const ASSIGNABLE_ROLES = ['admin', 'operator', 'auditor', 'supervisor'];

// Listar usuarios con filtros: role, location_id, active, search (nombre/usuario/email).
const getAll = async (req, res, next) => {
  try {
    const { role, location_id, active, search } = req.query;
    const params = [];
    let query = `
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.location_id,
             u.active, u.last_login, u.created_at,
             l.name AS location_name, l.city AS location_city
      FROM users u
      LEFT JOIN locations l ON u.location_id = l.id
      WHERE 1=1
    `;
    if (role) { params.push(role); query += ` AND u.role = $${params.length}`; }
    if (location_id) { params.push(location_id); query += ` AND u.location_id = $${params.length}`; }
    if (active !== undefined) { params.push(active === 'true'); query += ` AND u.active = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.full_name ILIKE $${params.length} OR u.username ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }
    query += ' ORDER BY u.full_name';
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
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.location_id,
             u.active, u.last_login, u.created_at, l.name AS location_name
      FROM users u
      LEFT JOIN locations l ON u.location_id = l.id
      WHERE u.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Valida coherencia de rol + sede. El operador de sede requiere una sede.
function validateRoleLocation(role, location_id) {
  if (!ASSIGNABLE_ROLES.includes(role)) return 'Rol invalido';
  if (role === 'operator' && !location_id) return 'El operador de sede requiere una sede asignada';
  return null;
}

const create = async (req, res, next) => {
  try {
    const { username, email, password, full_name, role, location_id } = req.body;

    if (!username || !email || !password || !full_name || !role) {
      return res.status(400).json({ success: false, error: 'username, email, password, full_name y role son requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'La contrasena debe tener al menos 6 caracteres' });
    }
    const roleErr = validateRoleLocation(role, location_id);
    if (roleErr) return res.status(400).json({ success: false, error: roleErr });

    // El operador lleva sede; los demas roles no (la guardamos null).
    const loc = role === 'operator' ? location_id : null;
    const password_hash = await bcrypt.hash(password, 10);

    const result = await db.query(`
      INSERT INTO users (username, email, password_hash, full_name, role, location_id, active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, username, email, full_name, role, location_id, active, created_at
    `, [username, email, password_hash, full_name, role, loc]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'El usuario o correo ya existe' });
    }
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email, full_name, role, location_id, active, password } = req.body;

    if (role) {
      const roleErr = validateRoleLocation(role, location_id);
      if (roleErr) return res.status(400).json({ success: false, error: roleErr });
    }
    if (password && password.length < 6) {
      return res.status(400).json({ success: false, error: 'La contrasena debe tener al menos 6 caracteres' });
    }

    // Si el rol cambia a uno sin sede, limpiamos location_id.
    let loc = location_id;
    if (role && role !== 'operator') loc = null;

    // Construccion dinamica para password opcional.
    const password_hash = password ? await bcrypt.hash(password, 10) : null;

    const result = await db.query(`
      UPDATE users
      SET username = COALESCE($1, username),
          email = COALESCE($2, email),
          full_name = COALESCE($3, full_name),
          role = COALESCE($4, role),
          location_id = $5,
          active = COALESCE($6, active),
          password_hash = COALESCE($7, password_hash)
      WHERE id = $8
      RETURNING id, username, email, full_name, role, location_id, active, created_at
    `, [
      username || null, email || null, full_name || null, role || null,
      loc !== undefined ? loc : null,
      active === undefined ? null : active,
      password_hash,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'El usuario o correo ya existe' });
    }
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    // No permitir que un admin se elimine a si mismo.
    if (req.user && req.user.id === id) {
      return res.status(400).json({ success: false, error: 'No puedes eliminar tu propio usuario' });
    }
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    res.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
