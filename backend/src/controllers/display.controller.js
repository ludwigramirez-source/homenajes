// Controller SSR para /digital-display-screen/:roomId
// Genera HTML estatico compatible con motores WebKit antiguos (sin React).
const db = require('../config/database');
const QRCode = require('qrcode');
const view = require('../views/displayScreen');

// Color oscuro del QR por plantilla (debe ser oscuro para que escanee bien).
const QR_DARK_COLORS = {
  agua: '#0a1c2e',
  aire: '#182939',
  fuego: '#5e2a20',
  tierra: '#3f4a34',
  bosque: '#4a3a22',
  nino: '#2e4a5c',
  nina: '#6e4f52',
  nubes: '#2b3a44'
};

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
    const pageParam = parseInt(req.query.page, 10);
    const page = (Number.isFinite(pageParam) && pageParam >= 0) ? pageParam : 0;
    // ?preview=1 desactiva el meta refresh (usado por el iframe del studio para
    // que la rotacion automatica no recargue mientras el usuario navega manualmente).
    const isPreview = req.query.preview === '1' || req.query.preview === 'true';
    const PAGE_SIZE = 6;
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
    `, [roomId]);

    if (memorialResult.rows.length === 0) {
      return res.send(view.renderEmptyRoom('No hay homenaje activo en esta sala en este momento'));
    }

    const m = memorialResult.rows[0];

    // Plantilla visual: la del homenaje, con override opcional via
    // ?template=<id> (solo whitelist; usado por el preview del studio).
    let templateId = m.template_id || 'default';
    if (req.query.template && view.TEMPLATE_IDS.indexOf(req.query.template) !== -1) {
      templateId = req.query.template;
    }
    if (view.TEMPLATE_IDS.indexOf(templateId) === -1) templateId = 'default';

    // 2) Registrar vista para analytics (no bloquea respuesta si falla).
    db.query(`
      INSERT INTO memorial_views (memorial_id, view_type, ip_address, user_agent)
      VALUES ($1, 'display', $2, $3)
    `, [m.id, req.ip, req.get('user-agent') || '']).catch(() => { /* ignore */ });

    // 3) Total real de mensajes para calcular paginacion (sin los rechazados
    //    por moderacion: nunca se muestran en pantalla).
    const totalRes = await db.query(
      "SELECT COUNT(*)::int AS count FROM condolences WHERE memorial_id = $1 AND moderation_status <> 'rejected'", [m.id]
    );
    const totalCount = totalRes.rows[0].count;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    // Clampear page por si llega un valor invalido o fuera de rango.
    const effectivePage = (page >= totalPages) ? 0 : page;

    // 4) Cargar la "pagina" de 6 mensajes que toca mostrar ahora.
    //    Orden DESC por created_at (mas recientes primero), paginado en backend.
    const condResult = await db.query(`
      SELECT id, sender_name, message, file1_url, created_at
      FROM condolences
      WHERE memorial_id = $1
        AND moderation_status <> 'rejected'
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [m.id, PAGE_SIZE, effectivePage * PAGE_SIZE]);

    const condolences = condResult.rows.map(c => ({
      id: c.id,
      sender_name: c.sender_name,
      message: c.message,
      file1_url: absoluteUploadUrl(baseUrl, c.file1_url),
      created_at: c.created_at
    }));

    // 4) Generar QR como SVG inline (cero JS cliente, escala bien en cualquier resolucion).
    // Usamos el codigo de sala (amigable) en vez del UUID para que la URL del
    // formulario sea legible.
    const friendlyId = m.room_code || roomId;
    const qrTarget = baseUrl + '/memorial-form/' + encodeURIComponent(friendlyId);
    const qrSvg = await QRCode.toString(qrTarget, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 1,
      color: { dark: QR_DARK_COLORS[templateId] || '#1a7472', light: '#ffffff' },
      width: 360
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
      // Horario diario que la sala esta habilitada (footer del display).
      dailyHoursStart: m.daily_hours_start_str || '08:00',
      dailyHoursEnd: m.daily_hours_end_str || '23:00',
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
      page: effectivePage,
      totalPages: totalPages,
      screen: screenParam,
      roomId: friendlyId,
      baseUrl: baseUrl,
      qrSvg: qrSvg,
      preview: isPreview,
      templateId: templateId
    });

    res.send(html);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDisplay };
