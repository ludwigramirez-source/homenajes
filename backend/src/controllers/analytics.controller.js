const db = require('../config/database');

// KPIs ejecutivos para el dashboard principal
const executive = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    
    const dateFilter = from && to ? `AND created_at BETWEEN '${from}' AND '${to}'` : '';

    const [
      totalMemorials,
      activeMemorials,
      totalCondolences,
      totalContacts,
      totalLocations,
      totalRooms,
      condolencesPerDay
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) as count FROM memorials WHERE 1=1 ${dateFilter}`),
      db.query(`
        SELECT COUNT(*) as count FROM memorials 
        WHERE active = true 
          AND CURRENT_TIMESTAMP BETWEEN schedule_start AND schedule_end
      `),
      db.query(`SELECT COUNT(*) as count FROM condolences WHERE 1=1 ${dateFilter}`),
      db.query(`SELECT COUNT(DISTINCT sender_email) as count FROM condolences WHERE marketing_consent = true`),
      db.query('SELECT COUNT(*) as count FROM locations WHERE active = true'),
      db.query('SELECT COUNT(*) as count FROM rooms WHERE active = true'),
      db.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM condolences
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `)
    ]);

    res.json({
      success: true,
      data: {
        total_memorials: parseInt(totalMemorials.rows[0].count),
        active_memorials: parseInt(activeMemorials.rows[0].count),
        total_condolences: parseInt(totalCondolences.rows[0].count),
        marketing_contacts: parseInt(totalContacts.rows[0].count),
        total_locations: parseInt(totalLocations.rows[0].count),
        total_rooms: parseInt(totalRooms.rows[0].count),
        condolences_last_30_days: condolencesPerDay.rows,
        avg_condolences_per_memorial: totalMemorials.rows[0].count > 0
          ? (parseInt(totalCondolences.rows[0].count) / parseInt(totalMemorials.rows[0].count)).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Performance por ubicacion
const byLocation = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        l.id,
        l.name,
        l.city,
        COUNT(DISTINCT r.id) as total_rooms,
        COUNT(DISTINCT m.id) as total_memorials,
        COUNT(DISTINCT m.id) FILTER (
          WHERE m.active = true 
          AND CURRENT_TIMESTAMP BETWEEN m.schedule_start AND m.schedule_end
        ) as active_memorials,
        COUNT(c.id) as total_condolences,
        ROUND(AVG(condolence_counts.count), 2) as avg_condolences_per_memorial
      FROM locations l
      LEFT JOIN rooms r ON l.id = r.location_id
      LEFT JOIN memorials m ON r.id = m.room_id
      LEFT JOIN condolences c ON m.id = c.memorial_id
      LEFT JOIN (
        SELECT memorial_id, COUNT(*) as count
        FROM condolences
        GROUP BY memorial_id
      ) condolence_counts ON m.id = condolence_counts.memorial_id
      WHERE l.active = true
      GROUP BY l.id
      ORDER BY total_condolences DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

// Centro de control operativo
const operations = async (req, res, next) => {
  try {
    const activeMemorials = await db.query(`
      SELECT 
        m.id,
        m.deceased_name,
        m.schedule_start,
        m.schedule_end,
        r.name as room_name,
        r.code as room_code,
        l.name as location_name,
        l.city,
        (SELECT COUNT(*) FROM condolences WHERE memorial_id = m.id) as condolence_count,
        (SELECT COUNT(*) FROM memorial_views WHERE memorial_id = m.id AND view_type = 'display') as display_views
      FROM memorials m
      JOIN rooms r ON m.room_id = r.id
      JOIN locations l ON r.location_id = l.id
      WHERE m.active = true
        AND CURRENT_TIMESTAMP BETWEEN m.schedule_start AND m.schedule_end
      ORDER BY m.schedule_start ASC
    `);

    const upcomingMemorials = await db.query(`
      SELECT 
        m.id,
        m.deceased_name,
        m.schedule_start,
        m.schedule_end,
        r.name as room_name,
        l.name as location_name,
        l.city
      FROM memorials m
      JOIN rooms r ON m.room_id = r.id
      JOIN locations l ON r.location_id = l.id
      WHERE m.active = true
        AND m.schedule_start > CURRENT_TIMESTAMP
        AND m.schedule_start <= CURRENT_TIMESTAMP + INTERVAL '3 days'
      ORDER BY m.schedule_start ASC
    `);

    const recentCondolences = await db.query(`
      SELECT 
        c.id, c.sender_name, c.message, c.created_at,
        m.deceased_name, r.name as room_name, l.name as location_name
      FROM condolences c
      JOIN memorials m ON c.memorial_id = m.id
      JOIN rooms r ON m.room_id = r.id
      JOIN locations l ON r.location_id = l.id
      ORDER BY c.created_at DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      data: {
        active_memorials: activeMemorials.rows,
        upcoming_memorials: upcomingMemorials.rows,
        recent_condolences: recentCondolences.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// Estado del sistema
const systemHealth = async (req, res, next) => {
  try {
    const dbCheck = await db.query('SELECT NOW() as time');
    
    const stats = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM locations) as locations,
        (SELECT COUNT(*) FROM rooms) as rooms,
        (SELECT COUNT(*) FROM memorials) as memorials,
        (SELECT COUNT(*) FROM condolences) as condolences,
        (SELECT COUNT(*) FROM users) as users
    `);

    res.json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        server_time: dbCheck.rows[0].time,
        statistics: stats.rows[0],
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

module.exports = { executive, byLocation, operations, systemHealth };
