const db = require('../config/database');

// Resuelve el alcance de sede del usuario:
// - operador: SIEMPRE su sede (no puede ver otras).
// - admin/auditor: la sede del query (location_id) o todas (null).
function resolveLocationScope(req) {
  if (req.user && req.user.role === 'operator') {
    return req.user.location_id || '00000000-0000-0000-0000-000000000000';
  }
  return req.query.location_id || null;
}

// Normaliza el rango de fechas. Default: ultimos 30 dias.
function resolveRange(req) {
  const to = req.query.to ? new Date(req.query.to) : new Date();
  let from;
  if (req.query.from) {
    from = new Date(req.query.from);
  } else {
    from = new Date(to);
    from.setDate(from.getDate() - 30);
  }
  // Normalizar a limites de dia.
  const fromStr = from.toISOString().slice(0, 10) + ' 00:00:00';
  const toStr = to.toISOString().slice(0, 10) + ' 23:59:59';
  return { fromStr, toStr };
}

// KPIs ejecutivos para el dashboard principal
const executive = async (req, res, next) => {
  try {
    const locationId = resolveLocationScope(req);
    const { fromStr, toStr } = resolveRange(req);

    // memorials con scope opcional de sede (via rooms) + rango por created_at.
    const memJoin = locationId ? 'JOIN rooms r ON m.room_id = r.id' : '';
    const memLoc = locationId ? 'AND r.location_id = $3' : '';
    const memParams = locationId ? [fromStr, toStr, locationId] : [fromStr, toStr];

    // condolences con scope (via memorials->rooms) + rango por created_at.
    const condJoin = locationId ? 'JOIN memorials m ON c.memorial_id = m.id JOIN rooms r ON m.room_id = r.id' : '';
    const condLoc = locationId ? 'AND r.location_id = $3' : '';
    const condParams = locationId ? [fromStr, toStr, locationId] : [fromStr, toStr];

    const [
      totalMemorials,
      activeMemorials,
      totalCondolences,
      totalContacts,
      totalLocations,
      totalRooms,
      condolencesPerDay
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) AS count FROM memorials m ${memJoin}
                WHERE m.created_at BETWEEN $1 AND $2 ${memLoc}`, memParams),
      db.query(`SELECT COUNT(*) AS count FROM memorials m ${locationId ? 'JOIN rooms r ON m.room_id=r.id' : ''}
                WHERE m.active = true AND CURRENT_TIMESTAMP BETWEEN m.schedule_start AND m.schedule_end
                ${locationId ? 'AND r.location_id = $1' : ''}`, locationId ? [locationId] : []),
      db.query(`SELECT COUNT(*) AS count FROM condolences c ${condJoin}
                WHERE c.created_at BETWEEN $1 AND $2 ${condLoc}`, condParams),
      db.query(`SELECT COUNT(DISTINCT c.sender_email) AS count FROM condolences c ${condJoin}
                WHERE c.marketing_consent = true AND c.created_at BETWEEN $1 AND $2 ${condLoc}`, condParams),
      db.query(locationId
        ? `SELECT COUNT(*) AS count FROM locations WHERE active = true AND id = $1`
        : `SELECT COUNT(*) AS count FROM locations WHERE active = true`, locationId ? [locationId] : []),
      db.query(locationId
        ? `SELECT COUNT(*) AS count FROM rooms WHERE active = true AND location_id = $1`
        : `SELECT COUNT(*) AS count FROM rooms WHERE active = true`, locationId ? [locationId] : []),
      db.query(`
        SELECT TO_CHAR(DATE(c.created_at), 'YYYY-MM-DD') AS date, COUNT(*) AS count
        FROM condolences c ${condJoin}
        WHERE c.created_at BETWEEN $1 AND $2 ${condLoc}
        GROUP BY DATE(c.created_at)
        ORDER BY date ASC
      `, condParams)
    ]);

    const totMem = parseInt(totalMemorials.rows[0].count);
    const totCond = parseInt(totalCondolences.rows[0].count);

    res.json({
      success: true,
      data: {
        total_memorials: totMem,
        active_memorials: parseInt(activeMemorials.rows[0].count),
        total_condolences: totCond,
        marketing_contacts: parseInt(totalContacts.rows[0].count),
        total_locations: parseInt(totalLocations.rows[0].count),
        total_rooms: parseInt(totalRooms.rows[0].count),
        condolences_trend: condolencesPerDay.rows.map(r => ({ date: r.date, count: parseInt(r.count) })),
        avg_condolences_per_memorial: totMem > 0 ? (totCond / totMem).toFixed(1) : '0',
        range: { from: fromStr.slice(0, 10), to: toStr.slice(0, 10) },
        scoped_to_location: !!locationId
      }
    });
  } catch (error) {
    next(error);
  }
};

// Performance por ubicacion (con ocupacion de salas). El operador solo ve su sede.
const byLocation = async (req, res, next) => {
  try {
    const locationId = resolveLocationScope(req);
    const result = await db.query(`
      SELECT
        l.id,
        l.name,
        l.city,
        COUNT(DISTINCT r.id) as total_rooms,
        COUNT(DISTINCT r.id) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM memorials mm
            WHERE mm.room_id = r.id AND mm.active = true
              AND CURRENT_TIMESTAMP BETWEEN mm.schedule_start AND mm.schedule_end
          )
        ) as occupied_rooms,
        COUNT(DISTINCT m.id) as total_memorials,
        COUNT(DISTINCT m.id) FILTER (
          WHERE m.active = true
          AND CURRENT_TIMESTAMP BETWEEN m.schedule_start AND m.schedule_end
        ) as active_memorials,
        COUNT(c.id) as total_condolences
      FROM locations l
      LEFT JOIN rooms r ON l.id = r.location_id
      LEFT JOIN memorials m ON r.id = m.room_id
      LEFT JOIN condolences c ON m.id = c.memorial_id
      WHERE l.active = true AND ($1::uuid IS NULL OR l.id = $1)
      GROUP BY l.id
      ORDER BY total_condolences DESC, l.name
    `, [locationId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

// Centro de control operativo (tiempo real). El operador solo ve su sede.
const operations = async (req, res, next) => {
  try {
    const locationId = resolveLocationScope(req);

    const activeMemorials = await db.query(`
      SELECT
        m.id, m.deceased_name, m.schedule_start, m.schedule_end,
        r.name as room_name, r.code as room_code,
        l.name as location_name, l.city,
        (SELECT COUNT(*) FROM condolences WHERE memorial_id = m.id) as condolence_count,
        (SELECT COUNT(*) FROM memorial_views WHERE memorial_id = m.id AND view_type = 'display') as display_views
      FROM memorials m
      JOIN rooms r ON m.room_id = r.id
      JOIN locations l ON r.location_id = l.id
      WHERE m.active = true
        AND CURRENT_TIMESTAMP BETWEEN m.schedule_start AND m.schedule_end
        AND ($1::uuid IS NULL OR r.location_id = $1)
      ORDER BY m.schedule_start ASC
    `, [locationId]);

    const upcomingMemorials = await db.query(`
      SELECT
        m.id, m.deceased_name, m.schedule_start, m.schedule_end,
        r.name as room_name, l.name as location_name, l.city
      FROM memorials m
      JOIN rooms r ON m.room_id = r.id
      JOIN locations l ON r.location_id = l.id
      WHERE m.active = true
        AND m.schedule_start > CURRENT_TIMESTAMP
        AND m.schedule_start <= CURRENT_TIMESTAMP + INTERVAL '3 days'
        AND ($1::uuid IS NULL OR r.location_id = $1)
      ORDER BY m.schedule_start ASC
    `, [locationId]);

    const recentCondolences = await db.query(`
      SELECT
        c.id, c.sender_name, c.message, c.created_at,
        m.deceased_name, r.name as room_name, l.name as location_name
      FROM condolences c
      JOIN memorials m ON c.memorial_id = m.id
      JOIN rooms r ON m.room_id = r.id
      JOIN locations l ON r.location_id = l.id
      WHERE ($1::uuid IS NULL OR r.location_id = $1)
      ORDER BY c.created_at DESC
      LIMIT 20
    `, [locationId]);

    res.json({
      success: true,
      data: {
        active_memorials: activeMemorials.rows,
        upcoming_memorials: upcomingMemorials.rows,
        recent_condolences: recentCondolences.rows,
        scoped_to_location: !!locationId
      }
    });
  } catch (error) {
    next(error);
  }
};

// Analisis detallado: embudo de interaccion + distribuciones. Scope por sede.
const detailed = async (req, res, next) => {
  try {
    const locationId = resolveLocationScope(req);
    const { fromStr, toStr } = resolveRange(req);

    const [funnel, byType, photos, consent, trend] = await Promise.all([
      // Embudo: eventos de memorial_views + mensajes enviados, en rango y scope.
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE mv.view_type = 'display') AS display_views,
          COUNT(*) FILTER (WHERE mv.view_type = 'qr_scan') AS qr_scans,
          COUNT(*) FILTER (WHERE mv.view_type = 'form_open') AS form_opens
        FROM memorial_views mv
        JOIN memorials m ON mv.memorial_id = m.id
        JOIN rooms r ON m.room_id = r.id
        WHERE mv.created_at BETWEEN $1 AND $2 AND ($3::uuid IS NULL OR r.location_id = $3)
      `, [fromStr, toStr, locationId]),
      // Homenajes y mensajes por tipo de sala.
      db.query(`
        SELECT COALESCE(r.room_type, 'sin_tipo') AS room_type,
               COUNT(DISTINCT m.id) AS memorials,
               COUNT(c.id) AS messages
        FROM rooms r
        LEFT JOIN memorials m ON m.room_id = r.id AND m.created_at BETWEEN $1 AND $2
        LEFT JOIN condolences c ON c.memorial_id = m.id
        WHERE ($3::uuid IS NULL OR r.location_id = $3)
        GROUP BY COALESCE(r.room_type, 'sin_tipo')
        ORDER BY messages DESC
      `, [fromStr, toStr, locationId]),
      // Mensajes con / sin foto adjunta.
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE c.file1_url IS NOT NULL OR c.file2_url IS NOT NULL) AS with_photo,
          COUNT(*) FILTER (WHERE c.file1_url IS NULL AND c.file2_url IS NULL) AS without_photo
        FROM condolences c
        JOIN memorials m ON c.memorial_id = m.id
        JOIN rooms r ON m.room_id = r.id
        WHERE c.created_at BETWEEN $1 AND $2 AND ($3::uuid IS NULL OR r.location_id = $3)
      `, [fromStr, toStr, locationId]),
      // Consentimiento de marketing en los mensajes.
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE c.marketing_consent = true) AS yes,
          COUNT(*) FILTER (WHERE c.marketing_consent = false) AS no
        FROM condolences c
        JOIN memorials m ON c.memorial_id = m.id
        JOIN rooms r ON m.room_id = r.id
        WHERE c.created_at BETWEEN $1 AND $2 AND ($3::uuid IS NULL OR r.location_id = $3)
      `, [fromStr, toStr, locationId]),
      // Tendencia de mensajes por dia (para grafico).
      db.query(`
        SELECT TO_CHAR(DATE(c.created_at), 'YYYY-MM-DD') AS date, COUNT(*) AS count
        FROM condolences c
        JOIN memorials m ON c.memorial_id = m.id
        JOIN rooms r ON m.room_id = r.id
        WHERE c.created_at BETWEEN $1 AND $2 AND ($3::uuid IS NULL OR r.location_id = $3)
        GROUP BY DATE(c.created_at) ORDER BY date ASC
      `, [fromStr, toStr, locationId])
    ]);

    const f = funnel.rows[0];
    const submitted = trend.rows.reduce((acc, r) => acc + parseInt(r.count), 0);

    res.json({
      success: true,
      data: {
        funnel: {
          display_views: parseInt(f.display_views) || 0,
          qr_scans: parseInt(f.qr_scans) || 0,
          form_opens: parseInt(f.form_opens) || 0,
          submitted
        },
        by_room_type: byType.rows.map(r => ({
          room_type: r.room_type,
          memorials: parseInt(r.memorials) || 0,
          messages: parseInt(r.messages) || 0
        })),
        photos: {
          with_photo: parseInt(photos.rows[0].with_photo) || 0,
          without_photo: parseInt(photos.rows[0].without_photo) || 0
        },
        consent: {
          yes: parseInt(consent.rows[0].yes) || 0,
          no: parseInt(consent.rows[0].no) || 0
        },
        trend: trend.rows.map(r => ({ date: r.date, count: parseInt(r.count) })),
        range: { from: fromStr.slice(0, 10), to: toStr.slice(0, 10) },
        scoped_to_location: !!locationId
      }
    });
  } catch (error) {
    next(error);
  }
};

// Estado del sistema (monitoreo tecnico).
const systemHealth = async (req, res, next) => {
  try {
    const dbCheck = await db.query('SELECT NOW() as time');

    const stats = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM locations) as locations,
        (SELECT COUNT(*) FROM rooms) as rooms,
        (SELECT COUNT(*) FROM memorials) as memorials,
        (SELECT COUNT(*) FROM condolences) as condolences,
        (SELECT COUNT(*) FROM memorial_views) as memorial_views,
        (SELECT COUNT(*) FROM users WHERE active = true) as users
    `);

    const usersByRole = await db.query(`
      SELECT role, COUNT(*) AS count FROM users WHERE active = true GROUP BY role ORDER BY role
    `);

    const lastActivity = await db.query(`
      SELECT
        (SELECT MAX(created_at) FROM memorials) as last_memorial,
        (SELECT MAX(created_at) FROM condolences) as last_condolence,
        (SELECT MAX(last_login) FROM users) as last_login
    `);

    res.json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        server_time: dbCheck.rows[0].time,
        statistics: stats.rows[0],
        users_by_role: usersByRole.rows,
        last_activity: lastActivity.rows[0],
        uptime_seconds: Math.floor(process.uptime())
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: { status: 'unhealthy', database: 'disconnected', error: error.message }
    });
  }
};

module.exports = { executive, byLocation, operations, detailed, systemHealth };
