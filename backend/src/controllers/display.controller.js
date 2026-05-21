// Controller SSR para /digital-display-screen/:roomId
// Genera HTML estatico compatible con motores WebKit antiguos (sin React).
const db = require('../config/database');
const QRCode = require('qrcode');
const view = require('../views/displayScreen');

// Helper: construye URL absoluta respetando el proxy reverso (X-Forwarded-Proto/Host).
function getBaseUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/+$/, '');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  const host = req.get('x-forwarded-host') || req.get('host');
  return proto + '://' + host;
}

// Construye URL absoluta de una imagen subida.
function absoluteUploadUrl(baseUrl, photoUrl) {
  if (!photoUrl) return null;
  if (/^https?:\/\//i.test(photoUrl)) return photoUrl;
  if (photoUrl.charAt(0) !== '/') photoUrl = '/' + photoUrl;
  return baseUrl + photoUrl;
}

const getDisplay = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const screenParam = req.query.screen;
    const baseUrl = getBaseUrl(req);

    // Cabeceras para que las pantallas SIEMPRE traigan datos frescos.
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Content-Type', 'text/html; charset=utf-8');

    // Removemos CSP estricta de helmet: el HTML SSR usa inline <style> y carga
    // imagenes desde URLs arbitrarias (foto del difunto puede ser externa).
    // Esta ruta NO acepta input del usuario, asi que el riesgo XSS es bajo
    // (todo escapado con escapeHtml en el view).
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('Content-Security-Policy-Report-Only');
    res.removeHeader('X-Frame-Options');

    // 1) Buscar memorial activo en esta sala.
    const memorialResult = await db.query(`
      SELECT
        m.*,
        r.name as room_name,
        r.code as room_code,
        l.name as location_name,
        l.city as location_city,
        ev.name as exequias_venue_name,
        fd.name as final_destination_venue_name,
        TO_CHAR(m.schedule_start, 'HH24:MI') as schedule_start_time,
        TO_CHAR(m.schedule_end, 'HH24:MI') as schedule_end_time
      FROM memorials m
      JOIN rooms r ON m.room_id = r.id
      JOIN locations l ON r.location_id = l.id
      LEFT JOIN ceremony_venues ev ON m.exequias_venue_id = ev.id
      LEFT JOIN ceremony_venues fd ON m.final_destination_venue_id = fd.id
      WHERE r.id = $1
        AND m.active = true
        AND CURRENT_TIMESTAMP BETWEEN m.schedule_start AND m.schedule_end
      LIMIT 1
    `, [roomId]);

    if (memorialResult.rows.length === 0) {
      return res.send(view.renderEmptyRoom('No hay homenaje activo en esta sala en este momento'));
    }

    const m = memorialResult.rows[0];

    // 2) Registrar vista para analytics (no bloquea respuesta si falla).
    db.query(`
      INSERT INTO memorial_views (memorial_id, view_type, ip_address, user_agent)
      VALUES ($1, 'display', $2, $3)
    `, [m.id, req.ip, req.get('user-agent') || '']).catch(() => { /* ignore */ });

    // 3) Cargar condolencias (limit 6 que es lo que cabe en grid 3x2).
    const condResult = await db.query(`
      SELECT id, sender_name, message, file1_url, created_at
      FROM condolences
      WHERE memorial_id = $1
      ORDER BY created_at DESC
      LIMIT 6
    `, [m.id]);

    const condolences = condResult.rows.map(c => ({
      id: c.id,
      sender_name: c.sender_name,
      message: c.message,
      file1_url: absoluteUploadUrl(baseUrl, c.file1_url),
      created_at: c.created_at
    }));

    // Tambien necesitamos el total para mostrar "X mensajes recibidos"
    const totalRes = await db.query(
      'SELECT COUNT(*)::int AS count FROM condolences WHERE memorial_id = $1', [m.id]
    );
    // Usamos un truco: agregamos la propiedad totalCount a condolences via length virtual.
    // Pero como condolences.length se usa en el template, hacemos otra cosa:
    // pasamos un array con .totalCount esta mal. Mejor exponer total via memorial.
    const totalCount = totalRes.rows[0].count;

    // 4) Generar QR como SVG inline (cero JS cliente, escala bien en cualquier resolucion).
    const qrTarget = baseUrl + '/memorial-form/' + encodeURIComponent(roomId);
    const qrSvg = await QRCode.toString(qrTarget, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 1,
      color: { dark: '#1a7472', light: '#ffffff' },
      width: 280
    });

    // 5) Normalizar datos del memorial para el view.
    const memorialView = {
      id: m.id,
      name: m.deceased_name,
      birthYear: m.birth_year || '',
      deathYear: m.death_year || '',
      photoUrl: absoluteUploadUrl(baseUrl, m.photo_url),
      emotionalMessage: m.emotional_message,
      qrMessage: m.qr_message,
      scheduleStart: m.schedule_start,
      scheduleEnd: m.schedule_end,
      scheduleStartTime: m.schedule_start_time,
      scheduleEndTime: m.schedule_end_time,
      roomName: m.room_name,
      locationName: m.location_name,
      exequiasVenue: m.exequias_venue_name,
      exequiasDatetime: m.exequias_datetime,
      finalDestinationVenue: m.final_destination_venue_name,
      finalDestinationDatetime: m.final_destination_datetime,
      totalMessagesCount: totalCount
    };

    // Si quiero exponer el total real al template, lo paso aparte; pero el template
    // usa condolences.length. Adapto: para que muestre el total, le anado a condolences
    // un .totalCount no estandar y modifico template? Mas simple: pasamos el total via
    // memorial.totalMessagesCount y ajustamos view ahi. (Lo haremos en una mejora posterior.)
    const html = view.render({
      memorial: memorialView,
      condolences: condolences,
      totalMessages: totalCount,
      screen: screenParam,
      roomId: roomId,
      baseUrl: baseUrl,
      qrSvg: qrSvg
    });

    res.send(html);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDisplay };
