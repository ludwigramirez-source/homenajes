const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken } = require('../utils/jwt');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Usuario y contrasena son requeridos'
      });
    }

    const result = await db.query(
      'SELECT * FROM users WHERE (username = $1 OR email = $1) AND active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales invalidas'
      });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales invalidas'
      });
    }

    // Actualizar ultimo login
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, full_name, role, last_login, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contrasena debe tener al menos 6 caracteres'
      });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userRole = ['admin', 'supervisor', 'operator'].includes(role) ? role : 'operator';

    const result = await db.query(`
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, full_name, role, created_at
    `, [username, email, password_hash, full_name, userRole]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, me, register };
