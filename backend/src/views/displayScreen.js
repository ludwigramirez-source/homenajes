// SSR del display digital. HTML estatico pensado para pantallas con motores
// WebKit/Chromium antiguos (pre-2015). Nada de flexbox, grid, css variables,
// backdrop-filter, transitions complejas, ni JS moderno.
// Layout con <table> + vertical-align. CSS con float donde corresponda.
//
// PLANTILLAS: ademas del diseno teal original ('default'), este modulo soporta
// 8 plantillas tematicas (agua, aire, fuego, tierra, bosque, nino, nina, nubes)
// definidas en el objeto TEMPLATES. Cualquier template_id desconocido cae al
// camino legacy para no romper homenajes existentes.
//
// COMPATIBILIDAD del HTML emitido (TVs LG WebKit pre-2015):
// - JS solo ES5 (var, function, concatenacion).
// - CSS sin variables, sin inset, sin mix-blend-mode, sin backdrop-filter,
//   sin flex/grid estructural, sin clamp(), sin filter:blur().
// - Gradientes con fallback de color solido + version -webkit- prefijada.
// - Animaciones con @keyframes duplicadas como @-webkit-keyframes y
//   transform siempre acompanado de -webkit-transform.

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

// Convierte "HH:MM" 24h a "H:MM a.m"/"H:MM p.m" 12h.
function format12h(hhmm) {
  if (!hhmm) return '';
  var parts = String(hhmm).split(':');
  var h = parseInt(parts[0], 10);
  var m = parts[1] || '00';
  if (isNaN(h)) return hhmm;
  var ampm = h >= 12 ? 'p.m' : 'a.m';
  var h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return h12 + ':' + m + ' ' + ampm;
}

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

// Formato de la guia de estilo: "Sabado 03 de Enero de 2026" (dia con cero).
function formatDateLong(iso) {
  if (!iso) return '';
  var d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  var day = d.getDate();
  if (day < 10) day = '0' + day;
  return SPANISH_DAYS[d.getDay()] + ' ' + day + ' de ' +
         SPANISH_MONTHS[d.getMonth()] + ' de ' + d.getFullYear();
}

// CSS comun (diseno teal legacy). Sin flexbox, sin variables, sin grid.
function commonCss() {
  return [
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    'html, body { width: 100%; height: 100%; overflow: hidden; ',
    '  background-color: #155f5d; ',
    '  background-image: -webkit-gradient(linear, left top, right bottom, ',
    '    from(#1a9490), color-stop(0.35, #1a7472), color-stop(0.7, #155f5d), to(#0f4a48)); ',
    '  background-image: linear-gradient(160deg, #1a9490 0%, #1a7472 35%, #155f5d 70%, #0f4a48 100%); ',
    '  color: #ffffff; font-family: "Inter", Arial, Helvetica, sans-serif; }',
    '.font-title { font-family: "Spectral", Georgia, "Times New Roman", serif; font-weight: bold; }',
    '.layout { width: 100%; height: 100%; }',
    '.layout-table { width: 100%; height: 100%; border-collapse: collapse; }',
    '.col-left, .col-right { vertical-align: middle; padding: 30px 30px; }',
    '.col-left { width: 44%; text-align: center; }',
    '.col-right { width: 56%; padding-right: 50px; }',
    // Foto del difunto: background-image (no <img>) para evitar object-fit que
    // no es fiable en WebKit antiguo. background-size:cover recorta para llenar
    // el marco vertical sin deformar; background-position:center top hace que
    // la cara (tipicamente en el tercio superior de un retrato) quede visible
    // en lugar del torso/cuerpo. Mismo comportamiento que el React previo con
    // object-cover object-top.
    '.photo-frame { display: inline-block; width: 400px; height: 500px; ',
    '  border-radius: 40% 40% 50% 50% / 30% 30% 50% 50%; ',
    '  border: 6px solid rgba(255,255,255,0.30); ',
    '  background-color: rgba(255,255,255,0.10); ',
    '  background-position: center top; ',
    '  background-repeat: no-repeat; ',
    '  background-size: cover; ',
    '  overflow: hidden; }',
    // Foto un poco mas pequena para pantalla del servicio (alt)
    '.photo-frame-md { width: 360px; height: 450px; }',
    // Tipografias: +3-4 px a casi todo
    '.name { font-size: 78px; line-height: 1.05; text-shadow: 0 3px 12px rgba(0,0,0,0.18); }',
    '.dates { font-size: 32px; opacity: 0.85; margin-top: 10px; font-weight: 300; }',
    '.divider { display: inline-block; width: 50px; height: 1px; background: #ffffff; opacity: 0.5; vertical-align: middle; margin: 0 12px; }',
    '.intro { font-size: 32px; line-height: 1.55; opacity: 0.92; margin-top: 32px; margin-bottom: 34px; font-weight: 300; }',
    '.emotional-message { font-size: 36px; line-height: 1.7; opacity: 0.92; font-weight: 300; }',
    '.subtitle { font-size: 30px; opacity: 0.8; font-weight: 300; }',
    '.section-title { font-size: 32px; font-weight: 300; opacity: 0.75; margin-bottom: 6px; }',
    // Cards (servicio y mensajes). Sin backdrop-filter; fondo solido translucido.
    '.card { background: #0f4a48; background: rgba(15,74,72,0.55); ',
    '  border: 1px solid rgba(255,255,255,0.18); border-radius: 12px; padding: 22px 26px; ',
    '  vertical-align: top; }',
    '.card-label { font-size: 20px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.78; ',
    '  font-family: "Spectral", Georgia, "Times New Roman", serif; }',
    '.card-value { font-size: 34px; font-weight: bold; line-height: 1.2; margin-top: 8px; ',
    '  font-family: "Spectral", Georgia, "Times New Roman", serif; ',
    '  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
    '.card-value.missing { opacity: 0.6; font-style: italic; font-weight: normal; }',
    '.card-date { font-size: 24px; opacity: 0.88; margin-top: 10px; font-weight: 300; }',
    '.dot { display: inline-block; width: 15px; height: 15px; border-radius: 50%; ',
    '  background: #f0c040; margin-right: 10px; vertical-align: middle; }',
    // Grid 2x2 servicio
    '.svc-grid { width: 100%; border-collapse: separate; border-spacing: 18px; margin-top: 16px; }',
    '.svc-grid td { width: 50%; }',
    // Grid 3x2 mensajes
    '.msg-grid { width: 100%; border-collapse: separate; border-spacing: 16px; }',
    '.msg-grid td { width: 33.33%; vertical-align: top; }',
    '.msg-card { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.22); ',
    '  border-radius: 14px; padding: 22px; min-height: 250px; }',
    '.msg-avatar { display: inline-block; width: 64px; height: 64px; border-radius: 50%; ',
    '  background: #f0c040; color: #1a4a48; text-align: center; line-height: 64px; ',
    '  font-size: 30px; font-weight: bold; vertical-align: middle; margin-right: 14px; }',
    '.msg-avatar img { width: 100%; height: 100%; border-radius: 50%; display: block; }',
    '.msg-name { display: inline-block; vertical-align: middle; font-weight: bold; font-size: 26px; ',
    '  font-family: "Spectral", Georgia, "Times New Roman", serif; }',
    '.msg-text { margin-top: 16px; font-size: 24px; line-height: 1.5; opacity: 0.92; ',
    '  font-weight: 300; }',
    '.msg-empty { text-align: center; padding: 80px 30px; opacity: 0.7; font-size: 34px; ',
    '  font-weight: 300; }',
    // QR mas grande
    '.qr-box { display: inline-block; padding: 22px; background: #ffffff; border-radius: 28px; ',
    '  border: 6px solid rgba(255,255,255,0.30); }',
    '.qr-box svg { display: block; width: 420px; height: 420px; }',
    // Header centrado pantalla mensajes
    '.header-center { text-align: center; padding: 40px 40px 24px; }',
    '.header-center .name-md { font-size: 54px; }',
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
    '  font-family: "Spectral", Georgia, "Times New Roman", serif; }',
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
  var refresh = '';
  // En modo preview (iframe del studio) NO emitimos meta refresh: el usuario
  // navega manualmente con botones avanzar/retroceder, y la rotacion automatica
  // recargaria el iframe y perderia el contexto.
  if (opts.nextUrl && !opts.preview) {
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
    // Fuentes de marca: Spectral (titulos) + Inter (cuerpo). Los navegadores
    // antiguos de las LG que no las soporten caen al fallback serif/sans-serif.
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">\n' +
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

// =========== SCREEN 1 (legacy): Info del servicio ===========
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

// =========== SCREEN 2 (legacy): Foto + mensaje emocional ===========
function renderScreenEmotional(m) {
  var photo = m.photoUrl || '';
  var firstName = (m.name || '').split(' ')[0] || '';
  var photoStyle = photo ? ' style="background-image:url(\'' + escapeHtml(photo) + '\');"' : '';
  return '<table class="layout-table">' +
    '<tr>' +
      '<td class="col-left">' +
        '<div class="photo-frame"' + photoStyle + '></div>' +
        '<div class="font-title" style="font-size:52px;margin-top:24px;">' + escapeHtml(m.name) + '</div>' +
        '<div class="dates">' + escapeHtml(m.birthYear) + ' &mdash; ' + escapeHtml(m.deathYear) + '</div>' +
      '</td>' +
      '<td class="col-right">' +
        '<div class="subtitle">En memoria de</div>' +
        '<div class="font-title" style="font-size:100px;line-height:1;margin:8px 0;">' +
           escapeHtml(firstName) +
        '</div>' +
        '<div class="subtitle" style="margin-bottom:32px;">siempre en nuestro coraz&oacute;n</div>' +
        '<div class="emotional-message">' + escapeHtml(m.emotionalMessage || '') + '</div>' +
      '</td>' +
    '</tr></table>';
}

// =========== SCREEN 3 (legacy): Mensajes recibidos (grid 3x2 con paginacion) ===========
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
    '<div class="subtitle" style="margin-top:6px;font-size:22px;">' +
      count + ' ' + (count === 1 ? 'mensaje recibido' : 'mensajes recibidos') +
      (totalPages > 1 ? ' &middot; P&aacute;gina ' + (page + 1) + ' de ' + totalPages : '') +
    '</div>' +
    '</div>' +
    '<div style="padding:0 40px;">' +
      '<table class="msg-grid">' + rows + '</table>' +
      pageIndicator +
    '</div>';
}

// =========== SCREEN 4 (legacy): QR ===========
function renderScreenQr(m, qrSvg) {
  var firstName = (m.name || '').split(' ')[0] || '';
  return '<table class="layout-table">' +
    '<tr>' +
      '<td class="col-left">' +
        '<div class="qr-box">' + (qrSvg || '') + '</div>' +
        '<div style="margin-top:30px;font-size:30px;font-weight:bold;">' +
        'Escanea el c&oacute;digo QR</div>' +
      '</td>' +
      '<td class="col-right">' +
        '<div class="subtitle">En memoria de</div>' +
        '<div class="font-title" style="font-size:92px;line-height:1;margin:8px 0;">' +
        escapeHtml(firstName) + '</div>' +
        '<div class="subtitle" style="margin-bottom:32px;">estamos a su lado</div>' +
        '<div style="font-size:36px;font-weight:600;line-height:1.5;">' +
        'Hazte presente dejando un mensaje</div>' +
        '<div style="font-size:28px;opacity:0.85;margin-top:16px;font-weight:300;line-height:1.5;">' +
        'que proviene desde todo el amor que hay al recordar con el coraz&oacute;n</div>' +
      '</td>' +
    '</tr></table>';
}

// =========== Sala disponible (sin homenaje activo) ===========
// Se mantiene siempre con el diseno teal, independiente de las plantillas.
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

// ====================================================================
// ===================== SISTEMA DE PLANTILLAS ========================
// ====================================================================

// Whitelist compartida con los controllers (validacion de template_id).
var TEMPLATE_IDS = ['default', 'nino', 'nina', 'agua', 'aire', 'fuego', 'tierra', 'bosque', 'nubes'];

// --- Helpers de CSS animado compatible (duplica @keyframes con prefijo) ---
function kfDual(name, frames) {
  return '@-webkit-keyframes ' + name + ' { ' + frames + ' }\n' +
         '@keyframes ' + name + ' { ' + frames + ' }';
}

// Destellos genericos (twinkle). color: centro del radial.
function sparkleCss(color) {
  return '.fx-sparkle { position:absolute; width:5px; height:5px; border-radius:50%; opacity:0; ' +
    'background: ' + color + '; ' +
    'background: -webkit-radial-gradient(center, circle, ' + color + ', rgba(255,255,255,0)); ' +
    'background: radial-gradient(circle, ' + color + ', rgba(255,255,255,0)); ' +
    '-webkit-animation: fxTwinkle 7s ease-in-out infinite; animation: fxTwinkle 7s ease-in-out infinite; }\n' +
    kfDual('fxTwinkle',
      '0%,100% { opacity:0; -webkit-transform:scale(0.5); transform:scale(0.5); } ' +
      '50% { opacity:0.8; -webkit-transform:scale(1); transform:scale(1); }');
}

function sparkleJs(count) {
  return 'fxSpawn("fx-sparkle", ' + count + ', function (d) {' +
    'd.style.left = (Math.random() * 100) + "%";' +
    'd.style.top = (Math.random() * 100) + "%";' +
    'fxAnim(d, 5 + Math.random() * 4, -Math.random() * 8);' +
    '});';
}

// Helpers ES5 emitidos una sola vez por pagina para generar particulas.
var FX_HELPERS_JS =
  'function fxSpawn(cls, n, fn) {' +
    'var layer = document.getElementById("fxLayer");' +
    'if (!layer) return;' +
    'for (var i = 0; i < n; i++) {' +
      'var d = document.createElement("div");' +
      'd.className = cls;' +
      'if (fn) fn(d, i);' +
      'layer.appendChild(d);' +
    '}' +
  '}\n' +
  'function fxAnim(el, dur, delay) {' +
    'el.style.webkitAnimationDuration = dur + "s";' +
    'el.style.animationDuration = dur + "s";' +
    'el.style.webkitAnimationDelay = delay + "s";' +
    'el.style.animationDelay = delay + "s";' +
  '}';

// Hojas cayendo (compartido por tierra y bosque; cambian los colores en el JS).
var LEAF_FX_CSS =
  '.fx-leaf { position:absolute; top:-60px; width:22px; height:18px; opacity:0; ' +
  '-webkit-animation: fxLeafFall 32s linear infinite; animation: fxLeafFall 32s linear infinite; }\n' +
  '.fx-leaf svg { width:100%; height:100%; display:block; }\n' +
  kfDual('fxLeafFall',
    '0% { -webkit-transform:translate(0,0) rotate(0deg); transform:translate(0,0) rotate(0deg); opacity:0; } ' +
    '8% { opacity:0.9; } 92% { opacity:0.85; } ' +
    '100% { -webkit-transform:translate(-90px,1250px) rotate(380deg); transform:translate(-90px,1250px) rotate(380deg); opacity:0.1; }');

// Funcion emitida que genera el SVG de una hoja (colores por parametro).
var FX_LEAF_FN =
  "function fxLeafSvg(c) {" +
  " return '<svg viewBox=\"0 0 40 32\" xmlns=\"http://www.w3.org/2000/svg\">' +" +
  " '<path d=\"M2 16 C 12 2, 30 2, 38 16 C 30 30, 12 30, 2 16 Z\" fill=\"' + c[0] + '\" stroke=\"' + c[1] + '\" stroke-width=\"1\"/>' +" +
  " '<path d=\"M5 16 L 35 16\" stroke=\"' + c[1] + '\" stroke-width=\"1\" fill=\"none\"/>' +" +
  " '</svg>';" +
  "}";

function leafJs(count, colorsLiteral) {
  return 'var fxLeafCols = ' + colorsLiteral + ';' +
    FX_LEAF_FN +
    'fxSpawn("fx-leaf", ' + count + ', function (d, i) {' +
    'd.innerHTML = fxLeafSvg(fxLeafCols[i % fxLeafCols.length]);' +
    'd.style.left = (Math.random() * 100) + "%";' +
    'var s = 14 + Math.random() * 14;' +
    'd.style.width = s + "px"; d.style.height = (s * 0.8) + "px";' +
    'fxAnim(d, 26 + Math.random() * 16, -Math.random() * 40);' +
    '});';
}

// --- SVG estaticos generados en Node (una vez por proceso) ---

// Diente de leon: tallo + corona radial de semillas. partial=true deja un
// hueco (semillas que ya volaron), como en la escena de referencia.
function buildDandelionSvg(stemPath, cx, cy, count, radius, partial) {
  var lines = '';
  for (var i = 0; i < count; i++) {
    var ang = (i / count) * Math.PI * 2;
    if (partial && ang > 5.9) continue;
    if (partial && ang < 1.4) continue;
    var len = radius * (0.85 + Math.random() * 0.3);
    var x2 = Math.round((cx + Math.cos(ang) * len) * 10) / 10;
    var y2 = Math.round((cy + Math.sin(ang) * len) * 10) / 10;
    lines += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x2 + '" y2="' + y2 + '"/>' +
             '<circle cx="' + x2 + '" cy="' + y2 + '" r="2.2" fill="#cdd9e0" stroke="none"/>';
  }
  return '<svg viewBox="0 0 200 520" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="' + stemPath + '" stroke="#6f8a99" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<g stroke="#7c97a6" stroke-width="1.3">' + lines + '</g>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="#6f8a99"/>' +
    '</svg>';
}

var DANDELION_SVG_A = buildDandelionSvg('M100 520 C 88 400, 96 300, 100 212', 100, 208, 34, 34, false);
var DANDELION_SVG_B = buildDandelionSvg('M100 520 C 92 410, 100 320, 104 246', 104, 242, 30, 30, true);

// Rama de cerezo de nina.html (estatica; el "bloom" animado del original usa
// transform-box sobre <g>, no fiable en WebKit antiguo, se omite).
var NINA_BRANCH_SVG =
  '<svg viewBox="0 0 400 800" xmlns="http://www.w3.org/2000/svg">' +
  '<g stroke="#9a7d72" fill="none" stroke-linecap="round">' +
  '<path d="M400 40 C 320 120, 300 240, 250 380 C 220 470, 210 560, 240 700" stroke-width="7"/>' +
  '<path d="M300 200 C 240 250, 210 330, 180 430" stroke-width="5"/>' +
  '<path d="M260 360 C 210 400, 190 470, 175 560" stroke-width="5"/>' +
  '<path d="M330 300 C 300 380, 300 470, 320 600" stroke-width="5"/>' +
  '<path d="M250 380 C 300 420, 340 470, 360 560" stroke-width="4"/>' +
  '</g>' +
  '<g fill="#f3b9c6" stroke="#e89bb0" stroke-width="1">' +
  '<g><circle cx="250" cy="380" r="9"/><circle cx="262" cy="372" r="7"/>' +
  '<circle cx="240" cy="372" r="7"/><circle cx="256" cy="392" r="7"/>' +
  '<circle cx="244" cy="392" r="7"/><circle cx="251" cy="380" r="3" fill="#fff5d6"/></g>' +
  '<g><circle cx="180" cy="430" r="8"/><circle cx="191" cy="423" r="6"/>' +
  '<circle cx="170" cy="423" r="6"/><circle cx="186" cy="441" r="6"/>' +
  '<circle cx="174" cy="441" r="6"/></g>' +
  '<g><circle cx="320" cy="500" r="9"/><circle cx="332" cy="492" r="7"/>' +
  '<circle cx="308" cy="492" r="7"/><circle cx="326" cy="513" r="7"/>' +
  '<circle cx="314" cy="513" r="7"/><circle cx="321" cy="500" r="3" fill="#fff5d6"/></g>' +
  '<g><circle cx="175" cy="560" r="8"/><circle cx="186" cy="553" r="6"/>' +
  '<circle cx="165" cy="553" r="6"/><circle cx="181" cy="571" r="6"/>' +
  '<circle cx="169" cy="571" r="6"/></g>' +
  '<g><circle cx="360" cy="560" r="8"/><circle cx="371" cy="553" r="6"/>' +
  '<circle cx="350" cy="553" r="6"/><circle cx="366" cy="571" r="6"/>' +
  '<circle cx="354" cy="571" r="6"/></g>' +
  '<g><circle cx="300" cy="180" r="8"/><circle cx="311" cy="173" r="6"/>' +
  '<circle cx="290" cy="173" r="6"/><circle cx="306" cy="191" r="6"/>' +
  '<circle cx="294" cy="191" r="6"/></g>' +
  '</g></svg>';

// Mariposa: un solo SVG; el aleteo se hace con scaleX sobre el contenedor
// (rotateY no es confiable en WebKit antiguo).
function butterflySvg(fill) {
  return '<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M60 50 C 10 0, 0 60, 55 60 C 40 80, 50 95, 60 70 Z" fill="' + fill + '" stroke="#b98e92" stroke-width="1.5"/>' +
    '<path d="M60 50 C 110 0, 120 60, 65 60 C 80 80, 70 95, 60 70 Z" fill="' + fill + '" stroke="#b98e92" stroke-width="1.5"/>' +
    '<line x1="60" y1="40" x2="60" y2="78" stroke="#9a7d72" stroke-width="2"/>' +
    '</svg>';
}

// --- CSS y JS de particulas por tema ---

var AGUA_FX_CSS =
  '.fx-bubble { position:absolute; bottom:-60px; border-radius:50%; ' +
  'border:1px solid rgba(255,255,255,0.4); opacity:0; ' +
  'background: rgba(255,255,255,0.35); ' +
  'background: -webkit-radial-gradient(35% 30%, circle, rgba(255,255,255,0.9), rgba(255,255,255,0.15) 55%, rgba(255,255,255,0.05) 100%); ' +
  'background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0.15) 55%, rgba(255,255,255,0.05) 100%); ' +
  '-webkit-animation: fxRise 18s linear infinite; animation: fxRise 18s linear infinite; }\n' +
  kfDual('fxRise',
    '0% { -webkit-transform:translate(0,0); transform:translate(0,0); opacity:0; } ' +
    '10% { opacity:0.85; } 85% { opacity:0.7; } ' +
    '100% { -webkit-transform:translate(40px,-1250px); transform:translate(40px,-1250px); opacity:0; }') + '\n' +
  sparkleCss('#ffffff');

var AGUA_FX_JS =
  'fxSpawn("fx-bubble", 16, function (d) {' +
  'var s = 6 + Math.random() * 20;' +
  'd.style.width = s + "px"; d.style.height = s + "px";' +
  'd.style.left = (Math.random() * 100) + "%";' +
  'fxAnim(d, 14 + Math.random() * 12, -Math.random() * 24);' +
  '});' +
  sparkleJs(12);

var AIRE_FX_CSS =
  '.fx-cloud { position:absolute; left:-640px; opacity:0; ' +
  '-webkit-animation: fxCross 60s linear infinite; animation: fxCross 60s linear infinite; }\n' +
  kfDual('fxCross',
    '0% { -webkit-transform:translateX(0); transform:translateX(0); opacity:0; } ' +
    '12% { opacity:0.8; } 88% { opacity:0.8; } ' +
    '100% { -webkit-transform:translateX(2750px); transform:translateX(2750px); opacity:0; }') + '\n' +
  '.fx-feather { position:absolute; top:-80px; width:30px; height:48px; opacity:0; ' +
  '-webkit-animation: fxFeatherFall 30s linear infinite; animation: fxFeatherFall 30s linear infinite; }\n' +
  '.fx-feather svg { width:100%; height:100%; display:block; }\n' +
  kfDual('fxFeatherFall',
    '0% { -webkit-transform:translate(0,0) rotate(-10deg); transform:translate(0,0) rotate(-10deg); opacity:0; } ' +
    '10% { opacity:0.9; } 90% { opacity:0.85; } ' +
    '100% { -webkit-transform:translate(140px,1250px) rotate(40deg); transform:translate(140px,1250px) rotate(40deg); opacity:0.1; }') + '\n' +
  '.fx-gust { position:absolute; height:2px; border-radius:2px; opacity:0; ' +
  'background: rgba(255,255,255,0.6); ' +
  'background: -webkit-linear-gradient(left, rgba(255,255,255,0), rgba(255,255,255,0.8), rgba(255,255,255,0)); ' +
  'background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.8), rgba(255,255,255,0)); ' +
  '-webkit-animation: fxGust 16s linear infinite; animation: fxGust 16s linear infinite; }\n' +
  kfDual('fxGust',
    '0% { -webkit-transform:translateX(-420px) scaleX(0.6); transform:translateX(-420px) scaleX(0.6); opacity:0; } ' +
    '30% { opacity:0.7; } 70% { opacity:0.7; } ' +
    '100% { -webkit-transform:translateX(1300px) scaleX(1.2); transform:translateX(1300px) scaleX(1.2); opacity:0; }');

var FX_CLOUD_FN =
  "function fxCloudSvg(w) {" +
  " return '<svg width=\"' + Math.round(w) + '\" height=\"' + Math.round(w * 0.5) + '\" viewBox=\"0 0 200 100\" xmlns=\"http://www.w3.org/2000/svg\">' +" +
  " '<g fill=\"#ffffff\" opacity=\"0.85\">' +" +
  " '<ellipse cx=\"60\" cy=\"65\" rx=\"55\" ry=\"30\"/><ellipse cx=\"110\" cy=\"55\" rx=\"50\" ry=\"35\"/>' +" +
  " '<ellipse cx=\"150\" cy=\"68\" rx=\"45\" ry=\"26\"/><ellipse cx=\"95\" cy=\"72\" rx=\"60\" ry=\"24\"/>' +" +
  " '</g></svg>';" +
  "}";

var FX_FEATHER_FN =
  "function fxFeatherSvg(t) {" +
  " return '<svg viewBox=\"0 0 40 64\" xmlns=\"http://www.w3.org/2000/svg\">' +" +
  " '<path d=\"M20 2 C 33 18, 33 44, 22 62 C 21 50, 21 30, 20 2 Z\" fill=\"' + t + '\" stroke=\"#a9c0d2\" stroke-width=\"1\"/>' +" +
  " '<path d=\"M20 2 C 7 18, 7 44, 18 62 C 19 50, 19 30, 20 2 Z\" fill=\"' + t + '\" stroke=\"#a9c0d2\" stroke-width=\"1\"/>' +" +
  " '<line x1=\"20\" y1=\"4\" x2=\"20\" y2=\"60\" stroke=\"#9bb4c8\" stroke-width=\"1.4\"/>' +" +
  " '</svg>';" +
  "}";

var AIRE_FX_JS =
  FX_CLOUD_FN + FX_FEATHER_FN +
  'fxSpawn("fx-cloud", 4, function (d) {' +
  'var w = 220 + Math.random() * 200;' +
  'd.innerHTML = fxCloudSvg(w);' +
  'd.style.top = (5 + Math.random() * 55) + "%";' +
  'fxAnim(d, 48 + Math.random() * 30, -Math.random() * 70);' +
  '});' +
  'var fxTints = ["#ffffff", "#eaf2f8", "#dcebf4"];' +
  'fxSpawn("fx-feather", 6, function (d, i) {' +
  'd.innerHTML = fxFeatherSvg(fxTints[i % 3]);' +
  'd.style.left = (Math.random() * 90) + "%";' +
  'var s = 20 + Math.random() * 14;' +
  'd.style.width = s + "px"; d.style.height = (s * 1.6) + "px";' +
  'fxAnim(d, 24 + Math.random() * 14, -Math.random() * 34);' +
  '});' +
  'fxSpawn("fx-gust", 4, function (d) {' +
  'd.style.top = (10 + Math.random() * 75) + "%";' +
  'd.style.left = (Math.random() * 30) + "%";' +
  'd.style.width = (140 + Math.random() * 200) + "px";' +
  'fxAnim(d, 15 + Math.random() * 9, -Math.random() * 20);' +
  '});';

var FUEGO_FX_CSS =
  // Resplandor inferior pulsante: solo anima opacity (sin blur, barato en TV).
  '.fx-glow { position:absolute; left:0; right:0; bottom:0; height:50%; opacity:0.7; ' +
  'background: rgba(255,150,50,0.18); ' +
  'background: -webkit-radial-gradient(50% 100%, ellipse, rgba(255,170,60,0.5), rgba(255,120,40,0.16) 45%, rgba(255,120,40,0) 70%); ' +
  'background: radial-gradient(ellipse at 50% 100%, rgba(255,170,60,0.5), rgba(255,120,40,0.16) 45%, rgba(255,120,40,0) 70%); ' +
  '-webkit-animation: fxPulse 7s ease-in-out infinite; animation: fxPulse 7s ease-in-out infinite; }\n' +
  kfDual('fxPulse', '0%,100% { opacity:0.55; } 50% { opacity:0.95; }') + '\n' +
  '.fx-ember { position:absolute; bottom:-40px; width:7px; height:7px; border-radius:50%; opacity:0; ' +
  'background: #ff8a2e; ' +
  'background: -webkit-radial-gradient(center, circle, #ffe7a8, #ff8a2e 60%, rgba(255,90,30,0) 100%); ' +
  'background: radial-gradient(circle, #ffe7a8, #ff8a2e 60%, rgba(255,90,30,0) 100%); ' +
  '-webkit-animation: fxEmberRise 20s linear infinite; animation: fxEmberRise 20s linear infinite; }\n' +
  kfDual('fxEmberRise',
    '0% { -webkit-transform:translate(0,0); transform:translate(0,0); opacity:0; } ' +
    '10% { opacity:1; } 80% { opacity:0.9; } ' +
    '100% { -webkit-transform:translate(60px,-1250px); transform:translate(60px,-1250px); opacity:0; }');

var FUEGO_FX_JS =
  'fxSpawn("fx-ember", 24, function (d) {' +
  'var s = 4 + Math.random() * 5;' +
  'd.style.width = s + "px"; d.style.height = s + "px";' +
  'd.style.left = (Math.random() * 100) + "%";' +
  'fxAnim(d, 14 + Math.random() * 12, -Math.random() * 26);' +
  '});';

var TIERRA_FX_CSS = LEAF_FX_CSS + '\n' + sparkleCss('#fff6da');

var TIERRA_FX_JS =
  leafJs(12, '[["#7d9b58","#5e7a3e"],["#a8b566","#86994a"],["#c79a4e","#a87b35"],["#9cba73","#7a9550"],["#b6884a","#946a2f"]]') +
  sparkleJs(10);

var BOSQUE_FX_CSS =
  LEAF_FX_CSS + '\n' +
  // Rayos de luz: linear-gradient rotado, solo anima opacity (sin blur ni
  // mix-blend-mode; la suavidad la da el propio gradiente).
  '.fx-ray { position:absolute; top:-20%; width:12%; height:150%; opacity:0.35; ' +
  '-webkit-transform-origin:50% 0; transform-origin:50% 0; ' +
  'background: rgba(255,240,190,0.2); ' +
  'background: -webkit-linear-gradient(top, rgba(255,240,190,0.4), rgba(255,235,180,0.1) 55%, rgba(255,235,180,0) 85%); ' +
  'background: linear-gradient(180deg, rgba(255,240,190,0.4), rgba(255,235,180,0.1) 55%, rgba(255,235,180,0) 85%); ' +
  '-webkit-animation: fxRayPulse 10s ease-in-out infinite; animation: fxRayPulse 10s ease-in-out infinite; }\n' +
  kfDual('fxRayPulse', '0%,100% { opacity:0.22; } 50% { opacity:0.5; }') + '\n' +
  '.fx-bmote { position:absolute; width:6px; height:6px; border-radius:50%; opacity:0; ' +
  'background: rgba(255,245,210,0.9); ' +
  'background: -webkit-radial-gradient(center, circle, rgba(255,245,210,0.95), rgba(255,235,180,0) 70%); ' +
  'background: radial-gradient(circle, rgba(255,245,210,0.95), rgba(255,235,180,0) 70%); ' +
  '-webkit-animation: fxMoteUp 22s linear infinite; animation: fxMoteUp 22s linear infinite; }\n' +
  kfDual('fxMoteUp',
    '0% { -webkit-transform:translate(0,0); transform:translate(0,0); opacity:0; } ' +
    '15% { opacity:0.9; } 85% { opacity:0.7; } ' +
    '100% { -webkit-transform:translate(40px,-750px); transform:translate(40px,-750px); opacity:0; }');

var BOSQUE_FX_HTML =
  '<div class="fx-ray" style="left:52%; -webkit-transform:rotate(15deg); transform:rotate(15deg); -webkit-animation-duration:10s; animation-duration:10s;"></div>' +
  '<div class="fx-ray" style="left:68%; -webkit-transform:rotate(18deg); transform:rotate(18deg); -webkit-animation-duration:13s; animation-duration:13s; -webkit-animation-delay:-4s; animation-delay:-4s;"></div>' +
  '<div class="fx-ray" style="left:84%; -webkit-transform:rotate(21deg); transform:rotate(21deg); -webkit-animation-duration:11s; animation-duration:11s; -webkit-animation-delay:-7s; animation-delay:-7s;"></div>';

var BOSQUE_FX_JS =
  leafJs(10, '[["#c79a4e","#a87b35"],["#b6884a","#946a2f"],["#a87a3a","#865e26"],["#cf9d52","#a8782f"],["#9c7a3c","#7a5c28"]]') +
  'fxSpawn("fx-bmote", 18, function (d) {' +
  'd.style.left = (35 + Math.random() * 60) + "%";' +
  'd.style.top = (15 + Math.random() * 70) + "%";' +
  'fxAnim(d, 16 + Math.random() * 14, -Math.random() * 28);' +
  '});';

var NINO_FX_CSS =
  // El vaiven se aplica al contenedor HTML (no al <g> del SVG) porque los
  // transforms CSS sobre elementos SVG no son fiables en WebKit antiguo.
  '.fx-dande { position:absolute; bottom:-10px; left:2%; width:190px; height:500px; ' +
  '-webkit-transform-origin:50% 100%; transform-origin:50% 100%; ' +
  '-webkit-animation: fxSway 9s ease-in-out infinite; animation: fxSway 9s ease-in-out infinite; }\n' +
  '.fx-dande svg { width:100%; height:100%; display:block; }\n' +
  '.fx-dande-b { left:9%; width:170px; height:460px; ' +
  '-webkit-animation-duration:11s; animation-duration:11s; ' +
  '-webkit-animation-delay:-2s; animation-delay:-2s; }\n' +
  kfDual('fxSway',
    '0%,100% { -webkit-transform:rotate(-2deg); transform:rotate(-2deg); } ' +
    '50% { -webkit-transform:rotate(2.5deg); transform:rotate(2.5deg); }') + '\n' +
  '.fx-seed { position:absolute; width:26px; height:26px; opacity:0; ' +
  '-webkit-animation: fxSeedFly 22s linear infinite; animation: fxSeedFly 22s linear infinite; }\n' +
  '.fx-seed svg { width:100%; height:100%; display:block; }\n' +
  kfDual('fxSeedFly',
    '0% { -webkit-transform:translate(0,0) rotate(0deg); transform:translate(0,0) rotate(0deg); opacity:0; } ' +
    '10% { opacity:0.85; } 90% { opacity:0.7; } ' +
    '100% { -webkit-transform:translate(1150px,-480px) rotate(220deg); transform:translate(1150px,-480px) rotate(220deg); opacity:0; }') + '\n' +
  sparkleCss('#ffffff');

var NINO_FX_HTML =
  '<div class="fx-dande">' + DANDELION_SVG_A + '</div>' +
  '<div class="fx-dande fx-dande-b">' + DANDELION_SVG_B + '</div>';

var FX_SEED_FN =
  "function fxSeedSvg() {" +
  " return '<svg viewBox=\"0 0 40 40\" xmlns=\"http://www.w3.org/2000/svg\">' +" +
  " '<g stroke=\"#6f8a99\" stroke-width=\"1\" fill=\"none\" stroke-linecap=\"round\">' +" +
  " '<line x1=\"20\" y1=\"40\" x2=\"20\" y2=\"18\"/><line x1=\"20\" y1=\"18\" x2=\"20\" y2=\"4\"/>' +" +
  " '<line x1=\"20\" y1=\"18\" x2=\"8\" y2=\"6\"/><line x1=\"20\" y1=\"18\" x2=\"32\" y2=\"6\"/>' +" +
  " '<line x1=\"20\" y1=\"18\" x2=\"11\" y2=\"2\"/><line x1=\"20\" y1=\"18\" x2=\"29\" y2=\"2\"/>' +" +
  " '<line x1=\"20\" y1=\"18\" x2=\"3\" y2=\"14\"/><line x1=\"20\" y1=\"18\" x2=\"37\" y2=\"14\"/>' +" +
  " '</g><ellipse cx=\"20\" cy=\"38\" rx=\"1.6\" ry=\"3\" fill=\"#6f8a99\"/></svg>';" +
  "}";

var NINO_FX_JS =
  FX_SEED_FN +
  'fxSpawn("fx-seed", 10, function (d) {' +
  'd.innerHTML = fxSeedSvg();' +
  'd.style.left = (3 + Math.random() * 12) + "%";' +
  'd.style.top = (55 + Math.random() * 30) + "%";' +
  'var s = 14 + Math.random() * 14;' +
  'd.style.width = s + "px"; d.style.height = s + "px";' +
  'fxAnim(d, 18 + Math.random() * 12, -Math.random() * 28);' +
  '});' +
  sparkleJs(10);

var NINA_FX_CSS =
  '.fx-branch { position:absolute; right:-2%; top:-2%; width:42%; height:104%; }\n' +
  '.fx-branch svg { width:100%; height:100%; display:block; }\n' +
  '.fx-petal { position:absolute; top:-40px; width:18px; height:14px; opacity:0; ' +
  'background: #f0b7c6; ' +
  'background: -webkit-radial-gradient(30% 30%, circle, #f7c9d4, #e89bb0); ' +
  'background: radial-gradient(circle at 30% 30%, #f7c9d4, #e89bb0); ' +
  'border-radius: 60% 0 60% 0; ' +
  '-webkit-animation: fxPetalFall 18s linear infinite; animation: fxPetalFall 18s linear infinite; }\n' +
  kfDual('fxPetalFall',
    '0% { -webkit-transform:translate(0,0) rotate(0deg); transform:translate(0,0) rotate(0deg); opacity:0; } ' +
    '8% { opacity:0.9; } ' +
    '100% { -webkit-transform:translate(-60px,1250px) rotate(420deg); transform:translate(-60px,1250px) rotate(420deg); opacity:0.15; }') + '\n' +
  // Mariposas: flotan (translate en el div externo) y aletean (scaleX en el
  // div interno; rotateY no es confiable en estas TVs).
  '.fx-bfly { position:absolute; }\n' +
  '.fx-flap { width:100%; height:100%; ' +
  '-webkit-animation: fxFlap 1.6s ease-in-out infinite; animation: fxFlap 1.6s ease-in-out infinite; }\n' +
  '.fx-flap svg { width:100%; height:100%; display:block; }\n' +
  kfDual('fxFlap',
    '0%,100% { -webkit-transform:scaleX(1); transform:scaleX(1); } ' +
    '50% { -webkit-transform:scaleX(0.3); transform:scaleX(0.3); }') + '\n' +
  '.fx-float1 { -webkit-animation: fxFloat1 18s ease-in-out infinite; animation: fxFloat1 18s ease-in-out infinite; }\n' +
  '.fx-float2 { -webkit-animation: fxFloat2 22s ease-in-out infinite; animation: fxFloat2 22s ease-in-out infinite; }\n' +
  '.fx-float3 { -webkit-animation: fxFloat3 16s ease-in-out infinite; animation: fxFloat3 16s ease-in-out infinite; }\n' +
  kfDual('fxFloat1',
    '0%,100% { -webkit-transform:translate(0,0) rotate(-4deg); transform:translate(0,0) rotate(-4deg); } ' +
    '50% { -webkit-transform:translate(14px,-18px) rotate(4deg); transform:translate(14px,-18px) rotate(4deg); }') + '\n' +
  kfDual('fxFloat2',
    '0%,100% { -webkit-transform:translate(0,0) rotate(3deg); transform:translate(0,0) rotate(3deg); } ' +
    '50% { -webkit-transform:translate(-12px,-14px) rotate(-5deg); transform:translate(-12px,-14px) rotate(-5deg); }') + '\n' +
  kfDual('fxFloat3',
    '0%,100% { -webkit-transform:translate(0,0) rotate(0deg); transform:translate(0,0) rotate(0deg); } ' +
    '50% { -webkit-transform:translate(8px,-22px) rotate(6deg); transform:translate(8px,-22px) rotate(6deg); }') + '\n' +
  sparkleCss('#ffffff');

var NINA_FX_HTML =
  '<div class="fx-branch">' + NINA_BRANCH_SVG + '</div>' +
  '<div class="fx-bfly fx-float1" style="left:16%; top:58%; width:110px; height:92px;">' +
  '<div class="fx-flap">' + butterflySvg('#f7d4dc') + '</div></div>' +
  '<div class="fx-bfly fx-float2" style="left:7%; top:70%; width:90px; height:75px;">' +
  '<div class="fx-flap" style="-webkit-animation-delay:-0.4s; animation-delay:-0.4s;">' + butterflySvg('#f5c8d2') + '</div></div>' +
  '<div class="fx-bfly fx-float3" style="left:30%; top:63%; width:64px; height:54px;">' +
  '<div class="fx-flap" style="-webkit-animation-delay:-0.7s; animation-delay:-0.7s;">' + butterflySvg('#fae0e6') + '</div></div>';

var NINA_FX_JS =
  'fxSpawn("fx-petal", 12, function (d) {' +
  'd.style.left = (Math.random() * 100) + "%";' +
  'var s = 12 + Math.random() * 10;' +
  'd.style.width = s + "px"; d.style.height = (s * 0.78) + "px";' +
  'fxAnim(d, 14 + Math.random() * 10, -Math.random() * 18);' +
  '});' +
  sparkleJs(12);

// Nubes: 3 capas de "franjas de nube" (lejos/media/cerca) que se desplazan
// verticalmente en loop infinito, con un leve balanceo horizontal ("mecer")
// integrado en el MISMO @keyframes (varios waypoints de translateX a lo largo
// del recorrido), mas un resplandor calido pulsante arriba. Sin filter:blur ni
// mix-blend-mode: la suavidad la da el propio radial-gradient (ultimo stop en
// rgba(255,255,255,0) con corte generoso), igual que fx-ray de BOSQUE y
// fx-bubble de AGUA. Se usan divs estaticos (como BOSQUE_FX_HTML) con
// animation-delay negativo para desincronizar las 3 capas.
var NUBES_FX_CSS =
  '.fx-nube-glow { position:absolute; left:0; right:0; top:0; height:42%; opacity:0.6; ' +
  'background: rgba(228,211,168,0.18); ' +
  'background: -webkit-radial-gradient(50% 0%, ellipse, rgba(228,211,168,0.55), rgba(228,211,168,0.14) 45%, rgba(228,211,168,0) 75%); ' +
  'background: radial-gradient(ellipse at 50% 0%, rgba(228,211,168,0.55), rgba(228,211,168,0.14) 45%, rgba(228,211,168,0) 75%); ' +
  '-webkit-animation: fxNubeGlowPulse 9s ease-in-out infinite; animation: fxNubeGlowPulse 9s ease-in-out infinite; }\n' +
  kfDual('fxNubeGlowPulse', '0%,100% { opacity:0.45; } 50% { opacity:0.8; }') + '\n' +
  '.fx-nube { position:absolute; left:-20%; width:140%; height:420px; opacity:0; }\n' +
  '.fx-nube-far { top:-360px; ' +
  'background: rgba(255,255,255,0.4); ' +
  'background: -webkit-radial-gradient(30% 45%, ellipse, rgba(255,255,255,0.8), rgba(255,255,255,0.3) 45%, rgba(255,255,255,0) 70%), ' +
  '-webkit-radial-gradient(72% 55%, ellipse, rgba(255,255,255,0.7), rgba(255,255,255,0.25) 42%, rgba(255,255,255,0) 68%); ' +
  'background: radial-gradient(ellipse at 30% 45%, rgba(255,255,255,0.8), rgba(255,255,255,0.3) 45%, rgba(255,255,255,0) 70%), ' +
  'radial-gradient(ellipse at 72% 55%, rgba(255,255,255,0.7), rgba(255,255,255,0.25) 42%, rgba(255,255,255,0) 68%); ' +
  '-webkit-animation: fxNubeDriftFar 68s linear infinite; animation: fxNubeDriftFar 68s linear infinite; }\n' +
  kfDual('fxNubeDriftFar',
    '0% { -webkit-transform:translate(0,0); transform:translate(0,0); opacity:0; } ' +
    '10% { opacity:0.28; } ' +
    '30% { -webkit-transform:translate(12px,320px); transform:translate(12px,320px); } ' +
    '55% { -webkit-transform:translate(-10px,590px); transform:translate(-10px,590px); } ' +
    '80% { -webkit-transform:translate(14px,860px); transform:translate(14px,860px); opacity:0.28; } ' +
    '100% { -webkit-transform:translate(0,1080px); transform:translate(0,1080px); opacity:0; }') + '\n' +
  '.fx-nube-mid { top:-420px; ' +
  'background: rgba(255,255,255,0.5); ' +
  'background: -webkit-radial-gradient(38% 50%, ellipse, rgba(255,255,255,0.85), rgba(255,255,255,0.32) 38%, rgba(255,255,255,0) 64%), ' +
  '-webkit-radial-gradient(78% 45%, ellipse, rgba(255,255,255,0.75), rgba(255,255,255,0.28) 36%, rgba(255,255,255,0) 62%); ' +
  'background: radial-gradient(ellipse at 38% 50%, rgba(255,255,255,0.85), rgba(255,255,255,0.32) 38%, rgba(255,255,255,0) 64%), ' +
  'radial-gradient(ellipse at 78% 45%, rgba(255,255,255,0.75), rgba(255,255,255,0.28) 36%, rgba(255,255,255,0) 62%); ' +
  '-webkit-animation: fxNubeDriftMid 50s linear infinite; animation: fxNubeDriftMid 50s linear infinite; }\n' +
  kfDual('fxNubeDriftMid',
    '0% { -webkit-transform:translate(0,0); transform:translate(0,0); opacity:0; } ' +
    '12% { opacity:0.4; } ' +
    '35% { -webkit-transform:translate(-14px,340px); transform:translate(-14px,340px); } ' +
    '60% { -webkit-transform:translate(16px,620px); transform:translate(16px,620px); } ' +
    '85% { -webkit-transform:translate(-12px,900px); transform:translate(-12px,900px); opacity:0.4; } ' +
    '100% { -webkit-transform:translate(0,1080px); transform:translate(0,1080px); opacity:0; }') + '\n' +
  '.fx-nube-near { top:-480px; ' +
  'background: rgba(255,255,255,0.6); ' +
  'background: -webkit-radial-gradient(45% 55%, ellipse, rgba(255,255,255,0.95), rgba(255,255,255,0.4) 32%, rgba(255,255,255,0) 58%), ' +
  '-webkit-radial-gradient(82% 40%, ellipse, rgba(255,255,255,0.85), rgba(255,255,255,0.35) 30%, rgba(255,255,255,0) 56%); ' +
  'background: radial-gradient(ellipse at 45% 55%, rgba(255,255,255,0.95), rgba(255,255,255,0.4) 32%, rgba(255,255,255,0) 58%), ' +
  'radial-gradient(ellipse at 82% 40%, rgba(255,255,255,0.85), rgba(255,255,255,0.35) 30%, rgba(255,255,255,0) 56%); ' +
  '-webkit-animation: fxNubeDriftNear 30s linear infinite; animation: fxNubeDriftNear 30s linear infinite; }\n' +
  kfDual('fxNubeDriftNear',
    '0% { -webkit-transform:translate(0,0); transform:translate(0,0); opacity:0; } ' +
    '15% { opacity:0.55; } ' +
    '38% { -webkit-transform:translate(15px,360px); transform:translate(15px,360px); } ' +
    '62% { -webkit-transform:translate(-15px,650px); transform:translate(-15px,650px); } ' +
    '85% { -webkit-transform:translate(15px,900px); transform:translate(15px,900px); opacity:0.55; } ' +
    '100% { -webkit-transform:translate(0,1080px); transform:translate(0,1080px); opacity:0; }');

var NUBES_FX_HTML =
  '<div class="fx-nube-glow"></div>' +
  '<div class="fx-nube fx-nube-far" style="-webkit-animation-delay:-14s; animation-delay:-14s;"></div>' +
  '<div class="fx-nube fx-nube-mid" style="-webkit-animation-delay:-22s; animation-delay:-22s;"></div>' +
  '<div class="fx-nube fx-nube-near" style="-webkit-animation-delay:-6s; animation-delay:-6s;"></div>';

// Sin spawn dinamico: los 3 divs ya vienen fijos en NUBES_FX_HTML.
var NUBES_FX_JS = '';

// --- Definicion de temas ---
// Cada tema define fuentes, colores, fondo, logo de pantalla 1 y particulas.
var RALEWAY_FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Raleway:wght@500;600;700;800&display=swap';
var NINA_FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Raleway:wght@500;600;700;800&family=Tangerine:wght@400;700&family=Cormorant+Garamond:wght@400;500;600&display=swap';
var NUBES_FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;500;600&family=Cormorant+Garamond:wght@400;500;600;700&family=EB+Garamond:wght@400;500;600&display=swap';
var RALEWAY_STACK = '"Raleway", Arial, Helvetica, sans-serif';

var TEMPLATES = {
  agua: {
    id: 'agua',
    fontsHref: RALEWAY_FONTS_HREF,
    fontName: RALEWAY_STACK,
    fontBody: RALEWAY_STACK,
    nameWeight: 800, nameSize1: 186, nameUppercase: true, name2Size: 85, name2Weight: 600,
    titulo: '#0a1c2e', texto: '#1f364d', eyebrow: '#1f364d',
    divider: 'rgba(31,54,77,0.4)', titleShadow: false,
    cardBg: 'rgba(255,255,255,0.55)', cardBorder: 'rgba(255,255,255,0.7)', cardText: '#1f364d',
    avatarBg: '#1f364d', avatarText: '#ffffff',
    fallback: '#4ea3bb', bgType: 'png',
    logo1: 'infinito',
    particlesCss: AGUA_FX_CSS, particlesHtml: '', particlesJs: AGUA_FX_JS
  },
  aire: {
    id: 'aire',
    fontsHref: RALEWAY_FONTS_HREF,
    fontName: RALEWAY_STACK,
    fontBody: RALEWAY_STACK,
    nameWeight: 800, nameSize1: 186, nameUppercase: true, name2Size: 85, name2Weight: 600,
    titulo: '#182939', texto: '#2e3a46', eyebrow: '#2e3a46',
    divider: 'rgba(46,58,70,0.4)', titleShadow: false,
    cardBg: 'rgba(255,255,255,0.55)', cardBorder: 'rgba(255,255,255,0.7)', cardText: '#2e3a46',
    avatarBg: '#2e3a46', avatarText: '#ffffff',
    fallback: '#d2e6f1', bgType: 'png',
    logo1: 'infinito',
    particlesCss: AIRE_FX_CSS, particlesHtml: '', particlesJs: AIRE_FX_JS
  },
  fuego: {
    id: 'fuego',
    fontsHref: RALEWAY_FONTS_HREF,
    fontName: RALEWAY_STACK,
    fontBody: RALEWAY_STACK,
    nameWeight: 800, nameSize1: 186, nameUppercase: true, name2Size: 85, name2Weight: 600,
    titulo: '#ffffff', texto: '#fdf5e6', eyebrow: '#fdf5e6',
    divider: 'rgba(255,255,255,0.4)', titleShadow: true,
    cardBg: 'rgba(0,0,0,0.28)', cardBorder: 'rgba(255,255,255,0.25)', cardText: '#fdf5e6',
    avatarBg: '#ffffff', avatarText: '#94472a',
    fallback: '#4a231d', bgType: 'png',
    logo1: 'infinito',
    particlesCss: FUEGO_FX_CSS, particlesHtml: '<div class="fx-glow"></div>', particlesJs: FUEGO_FX_JS
  },
  tierra: {
    id: 'tierra',
    fontsHref: RALEWAY_FONTS_HREF,
    fontName: RALEWAY_STACK,
    fontBody: RALEWAY_STACK,
    nameWeight: 800, nameSize1: 186, nameUppercase: true, name2Size: 85, name2Weight: 600,
    titulo: '#ffffff', texto: '#e8f0ea', eyebrow: '#e8f0ea',
    divider: 'rgba(255,255,255,0.4)', titleShadow: true,
    cardBg: 'rgba(0,0,0,0.28)', cardBorder: 'rgba(255,255,255,0.25)', cardText: '#e8f0ea',
    avatarBg: '#ffffff', avatarText: '#5a6a48',
    fallback: '#5c5340', bgType: 'png',
    logo1: 'infinito',
    particlesCss: TIERRA_FX_CSS, particlesHtml: '', particlesJs: TIERRA_FX_JS
  },
  bosque: {
    id: 'bosque',
    fontsHref: RALEWAY_FONTS_HREF,
    fontName: RALEWAY_STACK,
    fontBody: RALEWAY_STACK,
    nameWeight: 800, nameSize1: 186, nameUppercase: true, name2Size: 85, name2Weight: 600,
    // bosque no esta en la guia: se eligen blancos calidos coherentes con la
    // escena dorada de referencia.
    titulo: '#ffffff', texto: '#f3e8cf', eyebrow: '#f3e8cf',
    divider: 'rgba(255,255,255,0.4)', titleShadow: true,
    cardBg: 'rgba(0,0,0,0.28)', cardBorder: 'rgba(255,255,255,0.25)', cardText: '#f3e8cf',
    avatarBg: '#ffffff', avatarText: '#7a5e30',
    fallback: '#9c7838', bgType: 'css',
    bgWebkit: '-webkit-radial-gradient(62% 30%, ellipse, rgba(255,236,180,0.9), rgba(255,236,180,0) 45%), ' +
      '-webkit-radial-gradient(40% 70%, ellipse, rgba(120,95,50,0.5), rgba(120,95,50,0) 55%), ' +
      '-webkit-linear-gradient(top, #7a5e30 0%, #a07d3e 25%, #c9a155 48%, #9c7838 72%, #5f4824 100%)',
    bgStd: 'radial-gradient(ellipse at 62% 30%, rgba(255,236,180,0.9), rgba(255,236,180,0) 45%), ' +
      'radial-gradient(ellipse at 40% 70%, rgba(120,95,50,0.5), rgba(120,95,50,0) 55%), ' +
      'linear-gradient(170deg, #7a5e30 0%, #a07d3e 25%, #c9a155 48%, #9c7838 72%, #5f4824 100%)',
    logo1: 'infinito',
    particlesCss: BOSQUE_FX_CSS, particlesHtml: BOSQUE_FX_HTML, particlesJs: BOSQUE_FX_JS
  },
  nino: {
    id: 'nino',
    fontsHref: RALEWAY_FONTS_HREF,
    fontName: RALEWAY_STACK,
    fontBody: RALEWAY_STACK,
    nameWeight: 800, nameSize1: 186, nameUppercase: true, name2Size: 85, name2Weight: 600,
    titulo: '#1f364d', texto: '#2e4a5c', eyebrow: '#2e4a5c',
    divider: 'rgba(46,74,92,0.4)', titleShadow: false,
    cardBg: 'rgba(255,255,255,0.55)', cardBorder: 'rgba(255,255,255,0.7)', cardText: '#2e4a5c',
    avatarBg: '#2e4a5c', avatarText: '#ffffff',
    fallback: '#cfe4ee', bgType: 'css',
    bgWebkit: '-webkit-radial-gradient(45% 60%, ellipse, rgba(255,255,255,0.92), rgba(255,255,255,0) 48%), ' +
      '-webkit-radial-gradient(75% 35%, ellipse, rgba(245,250,252,0.7), rgba(245,250,252,0) 55%), ' +
      '-webkit-linear-gradient(top left, #a7cadd 0%, #cfe4ee 30%, #eef5f8 55%, #bcd8e6 80%, #a3c5d8 100%)',
    bgStd: 'radial-gradient(ellipse at 45% 60%, rgba(255,255,255,0.92), rgba(255,255,255,0) 48%), ' +
      'radial-gradient(ellipse at 75% 35%, rgba(245,250,252,0.7), rgba(245,250,252,0) 55%), ' +
      'linear-gradient(135deg, #a7cadd 0%, #cfe4ee 30%, #eef5f8 55%, #bcd8e6 80%, #a3c5d8 100%)',
    logo1: 'infinito',
    particlesCss: NINO_FX_CSS, particlesHtml: NINO_FX_HTML, particlesJs: NINO_FX_JS
  },
  nina: {
    id: 'nina',
    fontsHref: NINA_FONTS_HREF,
    fontName: '"Tangerine", "Brush Script MT", cursive',
    fontBody: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
    nameWeight: 700, nameSize1: 200, nameUppercase: false, name2Size: 110, name2Weight: 700,
    titulo: '#6e4f52', texto: '#7a5a5c', eyebrow: '#a07e6e',
    divider: 'rgba(160,126,110,0.5)', titleShadow: false,
    cardBg: 'rgba(255,255,255,0.55)', cardBorder: 'rgba(255,255,255,0.7)', cardText: '#7a5a5c',
    avatarBg: '#a07e6e', avatarText: '#ffffff',
    fallback: '#ead7d6', bgType: 'css',
    bgWebkit: '-webkit-radial-gradient(30% 55%, ellipse, rgba(255,252,250,0.9), rgba(255,252,250,0) 45%), ' +
      '-webkit-radial-gradient(70% 30%, ellipse, rgba(245,228,228,0.8), rgba(245,228,228,0) 55%), ' +
      '-webkit-linear-gradient(top left, #ead7d6 0%, #f2e6e0 35%, #ecd9d6 70%, #ddc4c4 100%)',
    bgStd: 'radial-gradient(ellipse at 30% 55%, rgba(255,252,250,0.9), rgba(255,252,250,0) 45%), ' +
      'radial-gradient(ellipse at 70% 30%, rgba(245,228,228,0.8), rgba(245,228,228,0) 55%), ' +
      'linear-gradient(135deg, #ead7d6 0%, #f2e6e0 35%, #ecd9d6 70%, #ddc4c4 100%)',
    logo1: 'infinito',
    particlesCss: NINA_FX_CSS, particlesHtml: NINA_FX_HTML, particlesJs: NINA_FX_JS
  },
  nubes: {
    id: 'nubes',
    fontsHref: NUBES_FONTS_HREF,
    fontName: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
    fontBody: '"EB Garamond", Georgia, serif',
    nameWeight: 600, nameSize1: 160, nameUppercase: false, name2Size: 96, name2Weight: 600,
    titulo: '#2b3a44', texto: '#3c5a6e', eyebrow: '#3c5a6e',
    divider: 'rgba(201,168,106,0.6)', titleShadow: false,
    cardBg: 'rgba(255,255,255,0.55)', cardBorder: 'rgba(255,255,255,0.7)', cardText: '#3c5a6e',
    avatarBg: '#3c5a6e', avatarText: '#ffffff',
    fallback: '#7fa9c4', bgType: 'css',
    // Foto real de cielo con nubes (no un gradiente): bgPhoto guarda solo el
    // nombre de archivo porque la URL absoluta requiere baseUrl, que no existe
    // todavia cuando este modulo se carga (ver themedBgCss).
    bgPhoto: 'nubes-fondo.jpg',
    logo1: 'infinito',
    particlesCss: NUBES_FX_CSS, particlesHtml: NUBES_FX_HTML, particlesJs: NUBES_FX_JS
  }
};

// Fondo del body segun tema y pantalla. Siempre con color solido de fallback.
// Para temas PNG el arte NO va en el body: va en la capa .bg-art que termina
// justo donde empieza el footer (100px), de modo que la cinta infinito y el
// isotipo que vienen DIBUJADOS en el arte oficial queden visibles completos.
function themedBgCss(theme, screen, baseUrl) {
  if (theme.bgType === 'png') {
    return 'background-color: ' + theme.fallback + ';';
  }
  // Temas 'css' con foto de fondo real (ej. nubes): la URL absoluta solo se
  // puede construir aqui, en tiempo de request, porque bgPhoto guarda nada
  // mas el nombre de archivo (el objeto TEMPLATES se arma una sola vez al
  // cargar el modulo, antes de conocer baseUrl). No hay funcion prefijada
  // -webkit- que aplicar: url()/center/cover/no-repeat y el color de fallback
  // final del shorthand "background" son universales.
  if (theme.bgPhoto) {
    var photoUrl = baseUrl + '/api/template-assets/' + theme.bgPhoto;
    return 'background-color: ' + theme.fallback + '; ' +
      'background: url(' + photoUrl + ') center/cover no-repeat, ' + theme.fallback + ';';
  }
  return 'background-color: ' + theme.fallback + '; ' +
    'background-image: ' + theme.bgWebkit + '; ' +
    'background-image: ' + theme.bgStd + ';';
}

// Capa del arte oficial (solo temas PNG). Anclada al borde inferior del area
// util (encima del footer) para que la cinta/isotipo del arte no queden tapados.
function themedArtCss(theme, screen, baseUrl) {
  if (theme.bgType !== 'png') return '';
  var file = theme.id + '-' + (screen === 1 ? '1' : '2') + '.png';
  return '.bg-art { position: absolute; left: 0; top: 0; right: 0; bottom: 100px; z-index: 0; ' +
    'background-image: url(' + baseUrl + '/api/template-assets/' + file + '); ' +
    'background-repeat: no-repeat; background-position: center bottom; ' +
    '-webkit-background-size: cover; background-size: cover; }';
}

// CSS base de las plantillas tematicas (mismas restricciones que commonCss).
function themedCss(theme, screen, baseUrl) {
  var shadow = theme.titleShadow ? ' text-shadow: 0 3px 14px rgba(0,0,0,0.35);' : '';
  return [
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    'html, body { width: 100%; height: 100%; overflow: hidden; ',
    '  color: ' + theme.texto + '; font-family: ' + theme.fontBody + '; }',
    'body { ' + themedBgCss(theme, screen, baseUrl) + ' }',
    // Capa de particulas detras del contenido
    '.fx-layer { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: hidden; z-index: 1; }',
    '.viewport { position: relative; z-index: 2; width: 100%; height: 100%; padding-bottom: 100px; ',
    '  -webkit-box-sizing: border-box; box-sizing: border-box; }',
    '.layout-table { width: 100%; height: 100%; border-collapse: collapse; }',
    // ---- Pantalla 1: servicio (layout por bandas) ----
    // La linea horizontal del arte oficial cae a ~37% del area util (980px en
    // 1080p) = ~363px desde arriba. El nombre vive ARRIBA de esa linea y el
    // resto del contenido DEBAJO. En temas CSS (sin arte) dibujamos nuestra
    // propia linea en la misma posicion para mantener el mismo layout.
    // La linea del arte cae a ~294px en 1080p (36.8% del arte anclado abajo):
    // la banda del nombre termina ahi para que el nombre quede SOBRE la linea.
    '.t-band-name { position: absolute; left: 7%; right: 7%; top: 0; height: 282px; z-index: 3; }',
    '.t-band-name table { width: 100%; height: 100%; border-collapse: collapse; }',
    '.t-band-name td { vertical-align: bottom; text-align: center; padding-bottom: 8px; }',
    '.t-name1 { font-family: ' + theme.fontName + '; font-weight: ' + theme.nameWeight + '; ',
    '  font-size: ' + theme.nameSize1 + 'px; line-height: 1.05; color: ' + theme.titulo + '; ',
    '  ' + (theme.nameUppercase ? 'text-transform: uppercase; letter-spacing: 1px; ' : '') +
    '  white-space: nowrap; overflow: hidden;' + shadow + ' }',
    // Linea propia solo para temas sin arte (css): misma posicion que la del arte
    '.t-artline { position: absolute; left: 12%; right: 12%; top: 294px; height: 1px; ',
    '  background: ' + theme.divider + '; z-index: 3; }',
    // Banda de contenido: area reservada para el mensaje + datos del servicio.
    '.t-band-body { position: absolute; left: 7%; right: 7%; top: 336px; bottom: 118px; ',
    '  z-index: 3; text-align: center; }',
    '.t-intro { font-weight: 600; font-size: 54px; line-height: 1.4; color: ' + theme.texto + '; ',
    '  height: 250px; overflow: hidden; }',
    // table-layout fixed: las celdas respetan el 50% aunque el contenido nowrap
    // sea mas ancho (sin esto la tabla se expande y el texto se sale de pantalla;
    // ademas el auto-ajuste necesita un clientWidth estable para medir).
    '.t-svc { width: 100%; border-collapse: collapse; margin-top: 26px; table-layout: fixed; }',
    '.t-svc td { width: 50%; padding: 14px 28px; text-align: center; overflow: hidden; }',
    '.t-svc-line { font-size: 46px; font-weight: 600; color: ' + theme.texto + '; ',
    '  white-space: nowrap; overflow: hidden; }',
    '.t-lbl { font-weight: 700; color: ' + theme.titulo + '; }',
    // ---- Logos de esquina (solo temas CSS: en los PNG el arte ya los trae) ----
    '.t-cinta { position: absolute; right: 0; bottom: 100px; z-index: 4; }',
    '.t-cinta img { display: block; height: 96px; width: auto; }',
    '.t-iso { position: absolute; right: 36px; bottom: 120px; width: 72px; height: 72px; ',
    '  background: #ffffff; border-radius: 50%; text-align: center; line-height: 72px; z-index: 4; ',
    '  -webkit-box-shadow: 0 2px 10px rgba(0,0,0,0.25); box-shadow: 0 2px 10px rgba(0,0,0,0.25); }',
    '.t-iso img { max-width: 50px; max-height: 50px; vertical-align: middle; }',
    // ---- Pantallas 2 y 4 ----
    '.t-col-l { width: 44%; vertical-align: middle; text-align: center; padding: 30px; }',
    '.t-col-r { width: 56%; vertical-align: middle; padding: 30px 90px 30px 20px; }',
    // Foto rectangular con esquinas redondeadas (la guia abandona el ovalo teal)
    '.t-photo { display: inline-block; width: 400px; height: 480px; border-radius: 18px; ',
    '  border: 6px solid rgba(255,255,255,0.65); background-color: rgba(255,255,255,0.25); ',
    '  background-position: center top; background-repeat: no-repeat; ',
    '  -webkit-background-size: cover; background-size: cover; }',
    '.t-name2 { font-family: ' + theme.fontName + '; font-weight: ' + theme.name2Weight + '; ',
    '  font-size: ' + theme.name2Size + 'px; line-height: 1.1; margin-top: 26px; color: ' + theme.titulo + ';' + shadow + ' }',
    '.t-years { font-weight: 500; font-size: 68px; margin-top: 8px; color: ' + theme.texto + '; }',
    '.t-eyebrow { font-weight: 600; font-size: 85px; line-height: 1.15; color: ' + theme.eyebrow + '; margin-bottom: 28px; }',
    '.t-emsg { font-weight: 600; font-size: 72px; line-height: 1.45; color: ' + theme.texto + '; ',
    '  max-height: 640px; overflow: hidden; }',
    '.t-qrtext { font-weight: 600; font-size: 72px; line-height: 1.45; color: ' + theme.texto + '; margin-top: 30px; }',
    '.qr-box2 { display: inline-block; padding: 22px; background: #ffffff; border-radius: 28px; }',
    '.qr-box2 svg { display: block; width: 420px; height: 420px; }',
    '.t-scan { margin-top: 28px; font-size: 34px; font-weight: 700; color: ' + theme.titulo + '; }',
    // ---- Pantalla 3: mensajes ----
    '.t-msg-head { text-align: center; padding: 36px 40px 20px; }',
    '.t-msg-eyebrow { font-size: 36px; font-weight: 600; color: ' + theme.eyebrow + '; }',
    '.t-msg-title { font-weight: 700; font-size: 64px; margin-top: 6px; color: ' + theme.titulo + ';' + shadow + ' }',
    '.t-msg-count { font-size: 26px; margin-top: 8px; color: ' + theme.texto + '; opacity: 0.85; }',
    '.msg-grid { width: 100%; border-collapse: separate; border-spacing: 16px; }',
    '.msg-grid td { width: 33.33%; vertical-align: top; }',
    '.t-msg-card { background: ' + theme.cardBg + '; border: 1px solid ' + theme.cardBorder + '; ',
    '  border-radius: 14px; padding: 22px; min-height: 250px; color: ' + theme.cardText + '; }',
    '.t-msg-avatar { display: inline-block; width: 64px; height: 64px; border-radius: 50%; ',
    '  background: ' + theme.avatarBg + '; color: ' + theme.avatarText + '; text-align: center; ',
    '  line-height: 64px; font-size: 30px; font-weight: 700; vertical-align: middle; margin-right: 14px; }',
    '.t-msg-avatar img { width: 100%; height: 100%; border-radius: 50%; display: block; }',
    '.t-msg-name { display: inline-block; vertical-align: middle; font-weight: 700; font-size: 26px; }',
    '.t-msg-text { margin-top: 16px; font-size: 24px; line-height: 1.5; }',
    '.t-msg-empty { text-align: center; padding: 80px 30px; font-size: 34px; color: ' + theme.texto + '; opacity: 0.85; }',
    '.page-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; ',
    '  background: ' + theme.divider + '; margin: 0 4px; }',
    '.page-dot.active { background: ' + theme.titulo + '; width: 22px; border-radius: 5px; }',
    // ---- Footer (identico al legacy, banda oscura translucida) ----
    '.footer { position: absolute; left: 0; right: 0; bottom: 0; ',
    '  background: rgba(0,0,0,0.30); padding: 10px 36px; height: 100px; z-index: 5; }',
    '.footer-table { width: 100%; height: 100%; border-collapse: collapse; }',
    '.footer-table td { vertical-align: middle; color: #ffffff; }',
    '.footer-left { width: 33%; font-size: 19px; opacity: 0.85; text-align: left; font-weight: 500; }',
    '.footer-center { width: 34%; text-align: center; }',
    '.footer-center .brand { font-weight: bold; font-size: 18px; letter-spacing: 3px; }',
    '.footer-center .tagline { font-size: 13px; opacity: 0.8; margin-top: 4px; text-align: center; }',
    '.footer-logo { display: inline-block; width: 180px; height: auto; opacity: 0.7; vertical-align: middle; }',
    '.footer-right { width: 33%; text-align: right; }',
    '.dot-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; ',
    '  background: rgba(255,255,255,0.4); margin-left: 6px; vertical-align: middle; }',
    '.dot-indicator.active { background: #f0c040; width: 26px; border-radius: 6px; }'
  ].join('\n') + '\n' + themedArtCss(theme, screen, baseUrl) + '\n' + theme.particlesCss;
}

// Logo de esquina inferior derecha segun tema/pantalla.
// Los temas con arte PNG NO llevan overlay: la cinta (pantalla 1) y el
// isotipo (pantallas 2-4) ya vienen dibujados en el arte oficial.
function themedLogoHtml(theme, screen, baseUrl) {
  if (theme.bgType === 'png') return '';
  if (screen === 1 && theme.logo1 === 'infinito') {
    return '<div class="t-cinta"><img src="' + baseUrl + '/api/template-assets/infinito-' +
      theme.id + '.png" alt="Los Olivos"></div>';
  }
  return '<div class="t-iso"><img src="' + baseUrl + '/api/template-assets/isotipo.png" alt="Los Olivos"></div>';
}

// Footer tematico: banda con horario + indicadores, SIN el logo central
// (la marca ya esta presente en la cinta/isotipo de cada pantalla).
function renderThemedFooter(screen, totalScreens, scheduleStart, scheduleEnd) {
  var dots = '';
  for (var i = 1; i <= totalScreens; i++) {
    dots += '<span class="dot-indicator' + (i === screen ? ' active' : '') + '"></span>';
  }
  return '<div class="footer">\n' +
    '<table class="footer-table"><tr>\n' +
    '  <td class="footer-left">Salas habilitadas de <b>' + escapeHtml(scheduleStart) +
    '</b> a <b>' + escapeHtml(scheduleEnd) + '</b></td>\n' +
    '  <td class="footer-center"></td>\n' +
    '  <td class="footer-right">' + dots + '</td>\n' +
    '</tr></table>\n' +
    '</div>';
}

// =========== Pantalla 1 tematica: servicio ===========
function renderThemedService(m, theme) {
  var ingreso = formatDateLong(m.scheduleStart);
  var salida = formatDateLong(m.scheduleEnd);
  var exequias = formatDateLong(m.exequiasDatetime);
  var destino = formatDateLong(m.finalDestinationDatetime);

  // Valor de cada dato: fecha en formato guia; si no hay fecha cae al nombre
  // del lugar y por ultimo a "Por confirmar".
  function svcVal(dateStr, venue) {
    if (dateStr) return escapeHtml(dateStr);
    if (venue) return escapeHtml(venue);
    return 'Por confirmar';
  }

  function svcCell(id, label, value) {
    return '<div class="t-svc-line" id="' + id + '">' +
      '<span class="t-lbl">' + label + ':</span> ' + value + '</div>';
  }

  // Layout por bandas: nombre ARRIBA de la linea (del arte o propia), y
  // debajo un area reservada para el mensaje (con ajuste dinamico) + datos.
  var artline = theme.bgType === 'png' ? '' : '<div class="t-artline"></div>';

  return '<div class="t-band-name"><table><tr><td>' +
    '<div class="t-name1" id="tName">' + escapeHtml(m.name) + '</div>' +
    '</td></tr></table></div>' +
    artline +
    '<div class="t-band-body">' +
    '<div class="t-intro" id="tIntro">' +
      'Hoy nos reunimos para honrar una vida inolvidable, ' +
      'conmemorando cada recuerdo como el m&aacute;s sincero homenaje al amor.' +
    '</div>' +
    '<table class="t-svc"><tr>' +
      '<td>' + svcCell('tSvc1', 'Ingreso', svcVal(ingreso, m.roomName)) + '</td>' +
      '<td>' + svcCell('tSvc2', 'Salida', svcVal(salida, m.roomName)) + '</td>' +
    '</tr><tr>' +
      '<td>' + svcCell('tSvc3', 'Exequias', svcVal(exequias, m.exequiasVenue)) + '</td>' +
      '<td>' + svcCell('tSvc4', 'Destino Final', svcVal(destino, m.finalDestinationVenue)) + '</td>' +
    '</tr></table>' +
    '</div>';
}

// =========== Pantalla 2 tematica: memorial (foto + mensaje) ===========
function renderThemedEmotional(m, theme) {
  var photo = m.photoUrl || '';
  var photoStyle = photo ? ' style="background-image:url(\'' + escapeHtml(photo) + '\');"' : '';
  return '<table class="layout-table"><tr>' +
    '<td class="t-col-l">' +
      '<div class="t-photo"' + photoStyle + '></div>' +
      '<div class="t-name2">' + escapeHtml(m.name) + '</div>' +
      '<div class="t-years">' + escapeHtml(m.birthYear || '') + ' &mdash; ' + escapeHtml(m.deathYear || '') + '</div>' +
    '</td>' +
    '<td class="t-col-r">' +
      '<div class="t-eyebrow">En memoria de</div>' +
      '<div class="t-emsg" id="tFitMsg">' + escapeHtml(m.emotionalMessage || '') + '</div>' +
    '</td>' +
    '</tr></table>';
}

// =========== Pantalla 3 tematica: mensajes del publico ===========
function renderThemedMessages(m, theme, condolences, totalCount, page, totalPages) {
  var count = (typeof totalCount === 'number') ? totalCount : condolences.length;
  var head = '<div class="t-msg-head">' +
    '<div class="t-msg-eyebrow">Mensajes para</div>' +
    '<div class="t-msg-title">' + escapeHtml(m.name) + '</div>';

  if (count === 0) {
    return head + '</div>' +
      '<div class="t-msg-empty">' +
      'A&uacute;n no hay mensajes.<br>S&eacute; el primero en dejar un recuerdo.' +
      '</div>';
  }

  head += '<div class="t-msg-count">' +
    count + ' ' + (count === 1 ? 'mensaje recibido' : 'mensajes recibidos') +
    (totalPages > 1 ? ' &middot; P&aacute;gina ' + (page + 1) + ' de ' + totalPages : '') +
    '</div></div>';

  var visible = condolences.slice(0, 6);
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
          ? '<span class="t-msg-avatar"><img src="' + escapeHtml(item.file1_url) + '" alt=""></span>'
          : '<span class="t-msg-avatar">' + escapeHtml(initial) + '</span>';
        tr += '<div class="t-msg-card">' +
          avatar +
          '<span class="t-msg-name">' + escapeHtml(item.sender_name) + '</span>' +
          '<div class="t-msg-text">' + escapeHtml(item.message || '') + '</div>' +
        '</div>';
      }
      tr += '</td>';
    }
    tr += '</tr>';
    rows += tr;
  }

  var pageIndicator = '';
  if (totalPages > 1) {
    var dots = '';
    for (var p = 0; p < totalPages; p++) {
      dots += '<span class="page-dot' + (p === page ? ' active' : '') + '"></span>';
    }
    pageIndicator = '<div style="text-align:center;margin-top:18px;">' + dots + '</div>';
  }

  return head +
    '<div style="padding:0 40px;">' +
      '<table class="msg-grid">' + rows + '</table>' +
      pageIndicator +
    '</div>';
}

// =========== Pantalla 4 tematica: QR ===========
function renderThemedQr(m, theme, qrSvg) {
  return '<table class="layout-table"><tr>' +
    '<td class="t-col-l">' +
      '<div class="qr-box2">' + (qrSvg || '') + '</div>' +
      '<div class="t-scan">Escanea el c&oacute;digo QR</div>' +
    '</td>' +
    '<td class="t-col-r">' +
      '<div class="t-eyebrow">En memoria de</div>' +
      '<div class="t-name2" style="margin-top:0;">' + escapeHtml(m.name) + '</div>' +
      '<div class="t-years">' + escapeHtml(m.birthYear || '') + ' &mdash; ' + escapeHtml(m.deathYear || '') + '</div>' +
      '<div class="t-qrtext">Hazte presente dejando un mensaje que proviene desde todo el amor ' +
      'que hay al recordar con el coraz&oacute;n.</div>' +
    '</td>' +
    '</tr></table>';
}

// Script ES5 de auto-ajuste de textos: reduce font-size mientras el texto
// desborda. fits: array de [id, sizeInicial, sizeMinimo, paso, modo].
// Modos: 'w' = ancho (nowrap), 'h' = alto, 'b' = caja (ancho O alto).
// Se re-ejecuta varias veces porque las webfonts (Raleway/Tangerine) cargan
// asincronas: si se mide antes del swap, el texto real desborda. Cada corrida
// resetea al tamano inicial y vuelve a medir con la fuente ya activa.
function fitScriptJs(fits) {
  if (!fits || !fits.length) return '';
  return 'var FIT = ' + JSON.stringify(fits) + ';\n' +
    'function runFits() {\n' +
    '  for (var fi = 0; fi < FIT.length; fi++) {\n' +
    '    (function (cfg) {\n' +
    '      var el = document.getElementById(cfg[0]);\n' +
    '      if (!el) return;\n' +
    '      var size = cfg[1];\n' +
    '      el.style.fontSize = size + "px";\n' +
    '      var guard = 0;\n' +
    '      function overflows() {\n' +
    '        if (cfg[4] === "w") return el.scrollWidth > el.clientWidth;\n' +
    '        if (cfg[4] === "h") return el.scrollHeight > el.clientHeight;\n' +
    '        return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;\n' +
    '      }\n' +
    '      while (overflows() && size > cfg[2] && guard < 120) {\n' +
    '        size -= cfg[3]; guard++;\n' +
    '        el.style.fontSize = size + "px";\n' +
    '      }\n' +
    '    })(FIT[fi]);\n' +
    '  }\n' +
    '}\n' +
    'runFits();\n' +
    'window.onload = runFits;\n' +
    'setTimeout(runFits, 400);\n' +
    'setTimeout(runFits, 1200);\n' +
    'setTimeout(runFits, 2600);';
}

// Shell HTML de las plantillas tematicas. Mantiene meta refresh, footer,
// preview y rotacion identicos al legacy.
function renderThemedShell(opts) {
  // opts: { title, screen, nextUrl, body, totalScreens, scheduleStart,
  //         scheduleEnd, preview, theme, baseUrl, fits }
  var theme = opts.theme;
  var refresh = '';
  if (opts.nextUrl && !opts.preview) {
    refresh = '<meta http-equiv="refresh" content="25; url=' + escapeHtml(opts.nextUrl) + '">';
  }

  var script = FX_HELPERS_JS + '\n' +
    '(function () {\n' + (theme.particlesJs || '') + '\n})();\n' +
    fitScriptJs(opts.fits);

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
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link href="' + theme.fontsHref + '" rel="stylesheet">\n' +
    '<style type="text/css">\n' + themedCss(theme, opts.screen, opts.baseUrl) + '\n</style>\n' +
    '</head>\n' +
    '<body>\n' +
    (theme.bgType === 'png' ? '<div class="bg-art"></div>\n' : '') +
    '<div class="fx-layer" id="fxLayer">' + (theme.particlesHtml || '') + '</div>\n' +
    '<div class="viewport">\n' +
    opts.body + '\n' +
    themedLogoHtml(theme, opts.screen, opts.baseUrl) + '\n' +
    '</div>\n' +
    renderThemedFooter(opts.screen, opts.totalScreens, opts.scheduleStart, opts.scheduleEnd) + '\n' +
    '<script type="text/javascript">\n' + script + '\n</scr' + 'ipt>\n' +
    '</body>\n' +
    '</html>';
}

// =========== Rotacion de pantallas (compartida legacy/tematico) ===========
function computeCycle(opts) {
  var TOTAL = 3;
  var screen = parseInt(opts.screen, 10);
  if (isNaN(screen) || screen < 1 || screen > TOTAL) screen = 1;

  var nextScreen = screen + 1;
  if (nextScreen > TOTAL) nextScreen = 1;

  var qs = nextScreen !== 1 ? '?screen=' + nextScreen : '';
  var nextUrl = '/digital-display-screen/' + encodeURIComponent(opts.roomId) + qs;

  return { total: TOTAL, screen: screen, nextUrl: nextUrl };
}

// =========== Render tematico ===========
function renderThemed(opts, theme) {
  var cyc = computeCycle(opts);
  var m = opts.memorial;
  var baseUrl = opts.baseUrl || '';

  var body;
  var fits = [];
  if (cyc.screen === 1) {
    body = renderThemedService(m, theme);
    // Auto-ajuste: nombre gigante (ancho), area del mensaje (caja: ancho+alto)
    // y las 4 lineas de datos del servicio (ancho, sin partir linea).
    fits = [
      ['tName', theme.nameSize1, 80, 6, 'w'],
      ['tIntro', 54, 28, 2, 'b'],
      ['tSvc1', 46, 26, 2, 'w'],
      ['tSvc2', 46, 26, 2, 'w'],
      ['tSvc3', 46, 26, 2, 'w'],
      ['tSvc4', 46, 26, 2, 'w']
    ];
  } else if (cyc.screen === 2) {
    body = renderThemedEmotional(m, theme);
    fits = [['tFitMsg', 72, 40, 4, 'h']];
  } else {
    body = renderThemedQr(m, theme, opts.qrSvg);
    fits = [];
  }

  var schedStart = format12h(m.dailyHoursStart || '08:00');
  var schedEnd = format12h(m.dailyHoursEnd || '23:00');

  return renderThemedShell({
    title: 'Memorial Digital - ' + (m.name || ''),
    screen: cyc.screen,
    totalScreens: cyc.total,
    nextUrl: cyc.nextUrl,
    body: body,
    scheduleStart: schedStart,
    scheduleEnd: schedEnd,
    preview: opts.preview,
    theme: theme,
    baseUrl: baseUrl,
    fits: fits
  });
}

// =========== Render legacy (diseno teal 'default') ===========
function renderLegacy(opts) {
  var cyc = computeCycle(opts);
  var m = opts.memorial;
  var body;
  if (cyc.screen === 1) body = renderScreenService(m);
  else if (cyc.screen === 2) body = renderScreenEmotional(m);
  else body = renderScreenQr(m, opts.qrSvg);

  // Horario diario que la sala esta habilitada (footer). Convertimos 24h a 12h
  // con a.m/p.m correcto (antes hardcodeaba "a.m" en start y "p.m" en end,
  // lo cual era incorrecto si el horario estaba fuera del rango 08-23).
  var schedStart = format12h(m.dailyHoursStart || '08:00');
  var schedEnd = format12h(m.dailyHoursEnd || '23:00');

  return renderShell({
    title: 'Memorial Digital - ' + (m.name || ''),
    screen: cyc.screen,
    totalScreens: cyc.total,
    nextUrl: cyc.nextUrl,
    body: body,
    scheduleStart: schedStart,
    scheduleEnd: schedEnd,
    preview: opts.preview
  });
}

// =========== Render principal ===========
// Devuelve el HTML de la vista solicitada. opts.templateId selecciona la
// plantilla; 'default' o cualquier valor desconocido usa el diseno teal legacy.
function render(opts) {
  // opts: { memorial, condolences, totalMessages, screen (1..3), page,
  //         totalPages, roomId, baseUrl, qrSvg, preview, templateId }
  var theme = TEMPLATES[opts.templateId];
  if (theme) return renderThemed(opts, theme);
  return renderLegacy(opts);
}

module.exports = {
  render: render,
  renderEmptyRoom: renderEmptyRoom,
  TEMPLATE_IDS: TEMPLATE_IDS
};
