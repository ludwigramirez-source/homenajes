const fs = require('fs');
const path = require('path');
const db = require('../config/database');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

const getAll = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT p.*, u.full_name as created_by_name
      FROM pautas p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se envio ninguna imagen' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const title = (req.body.title || '').trim() || null;

    const result = await db.query(`
      INSERT INTO pautas (image_url, title, active, created_by)
      VALUES ($1, $2, true, $3)
      RETURNING *
    `, [imageUrl, title, req.user.id]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active, title } = req.body;

    const result = await db.query(`
      UPDATE pautas
      SET active = COALESCE($1, active),
          title = COALESCE($2, title)
      WHERE id = $3
      RETURNING *
    `, [active === undefined ? null : !!active, title, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pauta no encontrada' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM pautas WHERE id = $1 RETURNING image_url', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pauta no encontrada' });
    }

    // Best-effort: borra el archivo del disco (no bloquea la respuesta si falla).
    const imageUrl = result.rows[0].image_url;
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(UPLOAD_DIR, path.basename(imageUrl));
      fs.unlink(filePath, () => { /* ignore */ });
    }

    res.json({ success: true, message: 'Pauta eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, update, remove };
