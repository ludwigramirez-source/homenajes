// SSR del display digital. HTML estatico pensado para pantallas con motores
// WebKit/Chromium antiguos (pre-2015). Nada de flexbox, grid, css variables,
// backdrop-filter, transitions complejas, ni JS moderno.
// Layout con <table> + vertical-align. CSS con float donde corresponda.

var fs = require('fs');
var path = require('path');

// Logo Los Olivos (blanco). Se carga UNA vez al cargar el modulo y se embebe
// como data URI: cero requests adicionales (ideal para WebKit antiguo) y evita
// configurar una ruta estatica nueva. Si falla la lectura, el footer cae a
// texto "LOS OLIVOS" como fallback.
var LOGO_DATA_URI = (function () {
  try {
    var p = path.join(__dirname, '..', 'assets', 'logo-los-olivos-blanco.png');
    var buf = fs.readFileSync(p);
    return 'data:image/png;base64,' + buf.toString('base64');
  } catch (e) {
    console.error('[displayScreen] No se pudo cargar el logo:', e.message);
    return '';
  }
})();

// Pequeno helper de escape HTML para evitar inyeccion.
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

var SPANISH_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
var SPANISH_MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatDateTime(iso) {
  if (!iso) return { date: '', time: '' };
  var d = new Date(iso);
  if (isNaN(d.getTime())) return { date: '', time: '' };
  var date = SPANISH_DAYS[d.getDay()] + ' ' + d.getDate() + ' de ' +
             SPANISH_MONTHS[d.getMonth()] + ' de ' + d.getFullYear();
  var hour = d.getHours();
  var minute = d.getMinutes();
  if (minute < 10) minute = '0' + minute;
  var ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return { date: date, time: hour + ':' + minute + ' ' + ampm };
}

// CSS comun. Sin flexbox, sin variables, sin grid. Usa table y absolute positioning.
function commonCss() {
  return [
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    'html, body { width: 100%; height: 100%; overflow: hidden; ',
    '  background-color: #155f5d; ',
    '  background-image: -webkit-gradient(linear, left top, right bottom, ',
    '    from(#1a9490), color-stop(0.35, #1a7472), color-stop(0.7, #155f5d), to(#0f4a48)); ',
    '  background-image: linear-gradient(160deg, #1a9490 0%, #1a7472 35%, #155f5d 70%, #0f4a48 100%); ',
    '  color: #ffffff; font-family: "Hind Vadodara", Arial, Helvetica, sans-serif; }',
    '.font-title { font-family: "Comfortaa", "Trebuchet MS", Arial, sans-serif; font-weight: bold; }',
    '.layout { width: 100%; height: 100%; }',
    '.layout-table { width: 100%; height: 100%; border-collapse: collapse; }',
    '.col-left, .col-right { vertical-align: middle; padding: 30px 30px; }',
    '.col-left { width: 44%; text-align: center; }',
    '.col-right { width: 56%; padding-right: 50px; }',
    // Foto del difunto: usamos background-image en lugar de <img> para que se
    // centre y recorte bien (background-size:cover + background-position:center)
    // sin depender de object-fit (no fiable en WebKit antiguo). El border-radius
    // recorta organicamente; si el motor no lo soporta queda rectangulo.
    '.photo-frame { display: inline-block; width: 400px; height: 500px; ',
    '  border-radius: 40% 40% 50% 50% / 30% 30% 50% 50%; ',
    '  border: 6px solid rgba(255,255,255,0.30); ',
    '  background-color: rgba(255,255,255,0.10); ',
    '  background-position: center center; ',
    '  background-repeat: no-repeat; ',
    '  background-size: cover; ',
    '  overflow: hidden; }',
    // Foto un poco mas pequena para pantalla del servicio (alt)
    '.photo-frame-md { width: 360px; height: 450px; }',
    // Tipografias: +3-4 px a casi todo
    '.name { font-size: 60px; line-height: 1.05; text-shadow: 0 3px 12px rgba(0,0,0,0.18); }',
    '.dates { font-size: 26px; opacity: 0.85; margin-top: 8px; font-weight: 300; }',
    '.divider { display: inline-block; width: 50px; height: 1px; background: #ffffff; opacity: 0.5; vertical-align: middle; margin: 0 12px; }',
    '.intro { font-size: 26px; line-height: 1.55; opacity: 0.92; margin-top: 28px; margin-bottom: 28px; font-weight: 300; }',
    '.emotional-message { font-size: 28px; line-height: 1.7; opacity: 0.92; font-weight: 300; }',
    '.subtitle { font-size: 24px; opacity: 0.8; font-weight: 300; }',
    '.section-title { font-size: 26px; font-weight: 300; opacity: 0.75; margin-bottom: 6px; }',
    // Cards (servicio y mensajes). Sin backdrop-filter; fondo solido translucido.
    '.card { background: #0f4a48; background: rgba(15,74,72,0.55); ',
    '  border: 1px solid rgba(255,255,255,0.18); border-radius: 12px; padding: 16px 20px; ',
    '  vertical-align: top; }',
    '.card-label { font-size: 16px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.78; ',
    '  font-family: "Comfortaa", "Trebuchet MS", Arial, sans-serif; }',
    '.card-value { font-size: 26px; font-weight: bold; line-height: 1.2; margin-top: 6px; ',
    '  font-family: "Comfortaa", "Trebuchet MS", Arial, sans-serif; ',
    '  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
    '.card-value.missing { opacity: 0.6; font-style: italic; font-weight: normal; }',
    '.card-date { font-size: 19px; opacity: 0.88; margin-top: 8px; font-weight: 300; }',
    '.dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; ',
    '  background: #f0c040; margin-right: 10px; vertical-align: middle; }',
    // Grid 2x2 servicio
    '.svc-grid { width: 100%; border-collapse: separate; border-spacing: 14px; margin-top: 12px; }',
    '.svc-grid td { width: 50%; }',
    // Grid 3x2 mensajes
    '.msg-grid { width: 100%; border-collapse: separate; border-spacing: 16px; }',
    '.msg-grid td { width: 33.33%; vertical-align: top; }',
    '.msg-card { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.22); ',
    '  border-radius: 14px; padding: 18px; min-height: 230px; }',
    '.msg-avatar { display: inline-block; width: 54px; height: 54px; border-radius: 50%; ',
    '  background: #f0c040; color: #1a4a48; text-align: center; line-height: 54px; ',
    '  font-size: 26px; font-weight: bold; vertical-align: middle; margin-right: 12px; }',
    '.msg-avatar img { width: 100%; height: 100%; border-radius: 50%; display: block; }',
    '.msg-name { display: inline-block; vertical-align: middle; font-weight: bold; font-size: 20px; ',
    '  font-family: "Comfortaa", "Trebuchet MS", Arial, sans-serif; }',
    '.msg-text { margin-top: 14px; font-size: 19px; line-height: 1.5; opacity: 0.92; ',
    '  font-weight: 300; }',
    '.msg-empty { text-align: center; padding: 80px 30px; opacity: 0.7; font-size: 26px; ',
    '  font-weight: 300; }',
    // QR mas grande
    '.qr-box { display: inline-block; padding: 22px; background: #ffffff; border-radius: 28px; ',
    '  border: 6px solid rgba(255,255,255,0.30); }',
    '.qr-box svg { display: block; width: 360px; height: 360px; }',
    // Header centrado pantalla mensajes
    '.header-center { text-align: center; padding: 40px 40px 24px; }',
    '.header-center .name-md { font-size: 42px; }',
    // Footer fijo. Altura 100px: aloja el logo (180x~62), la tagline debajo y
    // deja respiro vertical para el texto del horario a la izquierda.
    '.footer { position: absolute; left: 0; right: 0; bottom: 0; ',
    '  background: rgba(0,0,0,0.25); padding: 10px 36px; height: 100px; }',
    '.footer-table { width: 100%; height: 100%; border-collapse: collapse; }',
    '.footer-table td { vertical-align: middle; color: #ffffff; }',
    // Horario a la izquierda, alineado a la izquierda y centrado verticalmente.
    '.footer-left { width: 33%; font-size: 19px; opacity: 0.78; text-align: left; }',
    '.footer-center { width: 34%; text-align: center; }',
    '.footer-center .brand { font-weight: bold; font-size: 18px; letter-spacing: 3px; ',
    '  font-family: "Comfortaa", "Trebuchet MS", Arial, sans-serif; }',
    // Tagline 2px mas pequena y explicitamente centrada bajo el logo.
    '.footer-center .tagline { font-size: 13px; opacity: 0.75; margin-top: 4px; ',
    '  text-align: center; }',
    // Logo en el centro del footer: sutil pero reconocible (opacidad 0.55,
    // ancho 180px). Recomendado por el diseno para reemplazar el texto del brand.
    '.footer-logo { display: inline-block; width: 180px; height: auto; opacity: 0.55; ',
    '  vertical-align: middle; }',
    '.footer-right { width: 33%; text-align: right; }',
    '.dot-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; ',
    '  background: rgba(255,255,255,0.4); margin-left: 6px; vertical-align: middle; }',
    '.dot-indicator.active { background: #f0c040; width: 26px; border-radius: 6px; }',
    // Indicador de paginacion dentro de la pantalla de mensajes
    '.page-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; ',
    '  background: rgba(255,255,255,0.35); margin: 0 4px; }',
    '.page-dot.active { background: #f0c040; width: 22px; border-radius: 5px; }',
    // Body wrapper para reservar espacio del footer
    '.viewport { position: relative; width: 100%; height: 100%; padding-bottom: 100px; ',
    '  -webkit-box-sizing: border-box; box-sizing: border-box; }'
  ].join('\n');
}

function renderShell(opts) {
  // opts: { title, screen, nextUrl, body, totalScreens }
  var dots = '';
  for (var i = 1; i <= opts.totalScreens; i++) {
    dots += '<span class="dot-indicator' + (i === opts.screen ? ' active' : '') + '"></span>';
  }

  var refresh = '';
  if (opts.nextUrl) {
    // Meta refresh: cambia a siguiente vista cada 25s. Cada request al backend
    // trae datos frescos automaticamente.
    refresh = '<meta http-equiv="refresh" content="25; url=' + escapeHtml(opts.nextUrl) + '">';
  }

  return '<!DOCTYPE html>\n' +
    '<html lang="es">\n' +
    '<head>\n' +
    '<meta http-equiv="content-type" content="text/html; charset=utf-8">\n' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<meta http-equiv="cache-control" content="no-cache, no-store, must-revalidate">\n' +
    '<meta http-equiv="pragma" content="no-cache">\n' +
    '<meta http-equiv="expires" content="0">\n' +
    refresh + '\n' +
    '<title>' + escapeHtml(opts.title) + '</title>\n' +
    '<style type="text/css">\n' + commonCss() + '\n</style>\n' +
    '</head>\n' +
    '<body>\n' +
    '<div class="viewport">\n' +
    opts.body + '\n' +
    '</div>\n' +
    renderFooter(opts.screen, opts.totalScreens, opts.scheduleStart, opts.scheduleEnd) + '\n' +
    '</body>\n' +
    '</html>';
}

function renderFooter(currentScreen, totalScreens, scheduleStart, scheduleEnd) {
  var dots = '';
  for (var i = 1; i <= totalScreens; i++) {
    dots += '<span class="dot-indicator' + (i === currentScreen ? ' active' : '') + '"></span>';
  }
  return '<div class="footer">\n' +
    '  <table class="footer-table"><tr>\n' +
    '    <td class="footer-left">Salas habilitadas de <b>' +
        escapeHtml(scheduleStart || '08:00 a.m') + '</b> a <b>' +
        escapeHtml(scheduleEnd || '11:00 p.m') + '</b></td>\n' +
    '    <td class="footer-center">\n' +
         (LOGO_DATA_URI
           ? '      <img class="footer-logo" src="' + LOGO_DATA_URI + '" alt="Los Olivos">\n'
           : '      <div class="brand">LOS OLIVOS</div>\n') +
    '      <div class="tagline">Un homenaje al amor</div>\n' +
    '    </td>\n' +
    '    <td class="footer-right">' + dots + '</td>\n' +
    '  </tr></table>\n' +
    '</div>';
}

// =========== SCREEN 1: Info del servicio ===========
function renderScreenService(m) {
  var photo = m.photoUrl || '';
  var ingreso = formatDateTime(m.scheduleStart);
  var salida = formatDateTime(m.scheduleEnd);
  var exequias = formatDateTime(m.exequiasDatetime);
  var destino = formatDateTime(m.finalDestinationDatetime);

  function eventCard(label, placeName, dt, missing) {
    var nameClass = 'card-value' + (missing ? ' missing' : '');
    var html = '<div class="card">' +
      '<div class="card-label"><span class="dot"></span>' + escapeHtml(label) + '</div>' +
      '<div class="' + nameClass + '">' + escapeHtml(placeName || 'Por confirmar') + '</div>';
    if (dt && dt.date) {
      html += '<div class="card-date">' + escapeHtml(dt.date) + ' &middot; ' + escapeHtml(dt.time) + '</div>';
    }
    html += '</div>';
    return html;
  }

  var photoStyle = photo ? ' style="background-image:url(\'' + escapeHtml(photo) + '\');"' : '';
  var body = '<table class="layout-table">' +
    '<tr>' +
      '<td class="col-left">' +
        '<div class="photo-frame"' + photoStyle + '></div>' +
      '</td>' +
      '<td class="col-right" style="text-align:center;">' +
        '<div class="font-title name">' + escapeHtml(m.name) + '</div>' +
        '<div class="dates">' +
          '<span class="divider"></span>' +
          escapeHtml(m.birthYear || '') + ' &mdash; ' + escapeHtml(m.deathYear || '') +
          '<span class="divider"></span>' +
        '</div>' +
        '<div class="intro">' +
          'Hoy nos reunimos para honrar una vida inolvidable.<br>' +
          'Conmemorando cada recuerdo como el m&aacute;s sincero homenaje de amor.' +
        '</div>' +
        '<table class="svc-grid"><tr>' +
          '<td>' + eventCard('Ingreso', m.roomName, ingreso, false) + '</td>' +
          '<td>' + eventCard('Salida', m.roomName, salida, false) + '</td>' +
        '</tr><tr>' +
          '<td>' + eventCard('Exequias', m.exequiasVenue, exequias, !m.exequiasVenue) + '</td>' +
          '<td>' + eventCard('Destino Final', m.finalDestinationVenue, destino, !m.finalDestinationVenue) + '</td>' +
        '</tr></table>' +
      '</td>' +
    '</tr></table>';
  return body;
}

// =========== SCREEN 2: Foto + mensaje emocional ===========
function renderScreenEmotional(m) {
  var photo = m.photoUrl || '';
  var firstName = (m.name || '').split(' ')[0] || '';
  var photoStyle = photo ? ' style="background-image:url(\'' + escapeHtml(photo) + '\');"' : '';
  return '<table class="layout-table">' +
    '<tr>' +
      '<td class="col-left">' +
        '<div class="photo-frame"' + photoStyle + '></div>' +
        '<div class="font-title" style="font-size:42px;margin-top:22px;">' + escapeHtml(m.name) + '</div>' +
        '<div class="dates">' + escapeHtml(m.birthYear) + ' &mdash; ' + escapeHtml(m.deathYear) + '</div>' +
      '</td>' +
      '<td class="col-right">' +
        '<div class="subtitle">En memoria de</div>' +
        '<div class="font-title" style="font-size:80px;line-height:1;margin:8px 0;">' +
           escapeHtml(firstName) +
        '</div>' +
        '<div class="subtitle" style="margin-bottom:32px;">siempre en nuestro coraz&oacute;n</div>' +
        '<div class="emotional-message">' + escapeHtml(m.emotionalMessage || '') + '</div>' +
      '</td>' +
    '</tr></table>';
}

// =========== SCREEN 3: Mensajes recibidos (grid 3x2 con paginacion) ===========
// condolences viene ya pre-paginado desde el controller (LIMIT 6 OFFSET page*6).
// page/totalPages se reciben para mostrar indicador "Pagina X de Y".
function renderScreenMessages(m, condolences, totalCount, page, totalPages) {
  var count = (typeof totalCount === 'number') ? totalCount : condolences.length;
  if (count === 0) {
    return '<div class="header-center">' +
      '<div class="subtitle">Mensajes para</div>' +
      '<div class="font-title name-md" style="margin-top:6px;">' + escapeHtml(m.name) + '</div>' +
      '</div>' +
      '<div class="msg-empty">' +
      'A&uacute;n no hay mensajes.<br>S&eacute; el primero en dejar un recuerdo.' +
      '</div>';
  }

  // condolences ya viene paginado del controller (max 6).
  var visible = condolences.slice(0, 6);

  // Layout 3x2 con table. Si hay menos de 6 en la pagina, las celdas vacias quedan en blanco.
  var rows = '';
  for (var r = 0; r < 2; r++) {
    var tr = '<tr>';
    for (var c = 0; c < 3; c++) {
      var idx = r * 3 + c;
      var item = visible[idx];
      tr += '<td>';
      if (item) {
        var initial = (item.sender_name || '?').charAt(0).toUpperCase();
        var avatar = item.file1_url
          ? '<span class="msg-avatar"><img src="' + escapeHtml(item.file1_url) + '" alt=""></span>'
          : '<span class="msg-avatar">' + escapeHtml(initial) + '</span>';
        tr += '<div class="msg-card">' +
          avatar +
          '<span class="msg-name">' + escapeHtml(item.sender_name) + '</span>' +
          '<div class="msg-text">' + escapeHtml(item.message || '') + '</div>' +
        '</div>';
      }
      tr += '</td>';
    }
    tr += '</tr>';
    rows += tr;
  }

  // Indicador de paginacion: solo si hay mas de una pagina
  var pageIndicator = '';
  if (totalPages > 1) {
    var dots = '';
    for (var p = 0; p < totalPages; p++) {
      dots += '<span class="page-dot' + (p === page ? ' active' : '') + '"></span>';
    }
    pageIndicator = '<div style="text-align:center;margin-top:18px;">' + dots + '</div>';
  }

  return '<div class="header-center">' +
    '<div class="subtitle">Mensajes para</div>' +
    '<div class="font-title name-md" style="margin-top:6px;">' + escapeHtml(m.name) + '</div>' +
    '<div class="subtitle" style="margin-top:4px;font-size:18px;">' +
      count + ' ' + (count === 1 ? 'mensaje recibido' : 'mensajes recibidos') +
      (totalPages > 1 ? ' &middot; P&aacute;gina ' + (page + 1) + ' de ' + totalPages : '') +
    '</div>' +
    '</div>' +
    '<div style="padding:0 40px;">' +
      '<table class="msg-grid">' + rows + '</table>' +
      pageIndicator +
    '</div>';
}

// =========== SCREEN 4: QR ===========
function renderScreenQr(m, qrSvg) {
  var firstName = (m.name || '').split(' ')[0] || '';
  return '<table class="layout-table">' +
    '<tr>' +
      '<td class="col-left">' +
        '<div class="qr-box">' + (qrSvg || '') + '</div>' +
        '<div style="margin-top:26px;font-size:24px;font-weight:bold;">' +
        'Escanea el c&oacute;digo QR</div>' +
      '</td>' +
      '<td class="col-right">' +
        '<div class="subtitle">En memoria de</div>' +
        '<div class="font-title" style="font-size:72px;line-height:1;margin:8px 0;">' +
        escapeHtml(firstName) + '</div>' +
        '<div class="subtitle" style="margin-bottom:32px;">estamos a su lado</div>' +
        '<div style="font-size:28px;font-weight:600;line-height:1.5;">' +
        'Hazte presente dejando un mensaje</div>' +
        '<div style="font-size:22px;opacity:0.85;margin-top:14px;font-weight:300;line-height:1.5;">' +
        'que proviene desde todo el amor que hay al recordar con el coraz&oacute;n</div>' +
      '</td>' +
    '</tr></table>';
}

// =========== Sala disponible (sin homenaje activo) ===========
function renderEmptyRoom(message) {
  return '<!DOCTYPE html>\n<html lang="es"><head>' +
    '<meta http-equiv="content-type" content="text/html; charset=utf-8">' +
    '<meta http-equiv="refresh" content="60">' +
    '<title>Sala disponible</title>' +
    '<style type="text/css">' + commonCss() +
    '.center-box { position: absolute; top: 50%; left: 0; right: 0; margin-top: -80px; text-align: center; padding: 0 40px; }' +
    '</style></head><body>' +
    '<div class="center-box">' +
    '<div class="font-title" style="font-size:64px;">Sala disponible</div>' +
    '<div style="font-size:24px;opacity:0.85;margin-top:14px;font-weight:300;">' +
    escapeHtml(message || 'No hay homenaje activo en esta sala en este momento') + '</div>' +
    '<div style="font-size:16px;opacity:0.6;margin-top:40px;">SERCOFUN &middot; Funerario Los Olivos</div>' +
    '</div></body></html>';
}

// =========== Render principal ===========
// Devuelve el HTML de la vista solicitada.
function render(opts) {
  // opts: { memorial, condolences, totalMessages, screen (1..4), page,
  //         totalPages, roomId, baseUrl, qrSvg }
  var TOTAL = 4;
  var screen = parseInt(opts.screen, 10);
  if (isNaN(screen) || screen < 1 || screen > TOTAL) screen = 1;

  var page = parseInt(opts.page, 10);
  if (isNaN(page) || page < 0) page = 0;
  var totalPages = Math.max(1, opts.totalPages || 1);
  if (page >= totalPages) page = 0;

  var nextScreen = screen + 1;
  if (nextScreen > TOTAL) nextScreen = 1;

  // Avanzamos la pagina de mensajes JUSTO al salir de la pantalla 3 (screen=3 -> 4).
  // Asi cuando vuelva el ciclo a la pantalla 3 (despues de 4 y 1 y 2), mostrara la
  // siguiente "tanda" de 6. Wraparound al final.
  var nextPage = page;
  if (screen === 3 && totalPages > 1) {
    nextPage = (page + 1) % totalPages;
  }

  // URL siguiente: mantiene page si toca; en screen=1 conserva ?page para no perder
  // el contexto del ciclo. Si nextPage es 0 y nextScreen es 1, URL limpio.
  var qsParts = [];
  if (nextScreen !== 1) qsParts.push('screen=' + nextScreen);
  if (nextPage > 0) qsParts.push('page=' + nextPage);
  var qs = qsParts.length ? '?' + qsParts.join('&') : '';
  var nextUrl = '/digital-display-screen/' + encodeURIComponent(opts.roomId) + qs;

  var m = opts.memorial;
  var body;
  if (screen === 1) body = renderScreenService(m);
  else if (screen === 2) body = renderScreenEmotional(m);
  else if (screen === 3) body = renderScreenMessages(m, opts.condolences || [], opts.totalMessages, page, totalPages);
  else body = renderScreenQr(m, opts.qrSvg);

  // Horario para footer; tomamos el HH:MM puro de schedule_start_time/end_time
  var schedStart = m.scheduleStartTime ? m.scheduleStartTime + ' a.m' : '08:00 a.m';
  var schedEnd = m.scheduleEndTime ? m.scheduleEndTime + ' p.m' : '11:00 p.m';

  return renderShell({
    title: 'Memorial Digital - ' + (m.name || ''),
    screen: screen,
    totalScreens: TOTAL,
    nextUrl: nextUrl,
    body: body,
    scheduleStart: schedStart,
    scheduleEnd: schedEnd
  });
}

module.exports = { render: render, renderEmptyRoom: renderEmptyRoom };
