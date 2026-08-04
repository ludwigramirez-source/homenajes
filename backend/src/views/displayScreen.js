// SSR del display digital. HTML estatico pensado para pantallas con motores
// WebKit/Chromium antiguos (pre-2015). Nada de flexbox, grid, css variables,
// backdrop-filter, transitions complejas, ni JS moderno.
// Layout con <table> + vertical-align. CSS con float donde corresponda.
//
// PLANTILLAS: ademas del diseno teal original ('default'), este modulo soporta
// 5 plantillas tematicas definidas en el objeto TEMPLATES (naturaleza, nubes,
// nino, nina, adulto), segun la "Guia FINAL slides" de Los Olivos. Cualquier
// template_id desconocido cae al camino legacy para no romper homenajes
// existentes. Los disenos "4 elementos" previos (agua/aire/fuego/tierra/
// bosque) se retiraron por completo del codigo: no cumplian el manual de
// marca y no quedaban homenajes activos usandolos.
// Las 5 plantillas vigentes comparten: fondo fotografico (bgPhoto, logo Los
// Olivos ya incluido en el arte, ver hideLogo), layout de servicio V2
// (serviceLayout:'v2') y tarjeta centrada en pantallas 2/3
// (emotionalLayout:'centered'). Cada una admite variante religiosa
// (memorial.isReligious): agrega "Descansa en la paz del senor" en la
// pantalla 1 y una cruz (en vez de guion) entre los anios.
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

// Solo la hora ("2:00 p.m") de un datetime ISO, reutilizando format12h.
function timeOnly12h(iso) {
  if (!iso) return '';
  var d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  var hh = d.getHours();
  var mm = d.getMinutes();
  var hhmm = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
  return format12h(hhmm);
}

// '#rrggbb' -> 'rgba(r,g,b,alpha)'. Usado para las cajas de mensaje con
// transparencia del 65% especificadas por tema en la guia de diseno.
function hexToRgba(hex, alpha) {
  var h = String(hex || '').replace('#', '');
  if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
  var r = parseInt(h.substring(0, 2), 16) || 0;
  var g = parseInt(h.substring(2, 4), 16) || 0;
  var b = parseInt(h.substring(4, 6), 16) || 0;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

// Fuente con glifo de cruz latina (U+271D) para la variante religiosa: se pide
// explicitamente que la cruz sea TEXTO (no una imagen/SVG), con una fuente que
// incluya el simbolo. Noto Sans Symbols 2 lo cubre; el span se aisla en su
// propia font-family para no afectar el resto del texto (Raleway).
// Comillas simples (no dobles): este valor se inyecta dentro de un atributo
// style="..." con comillas dobles; comillas dobles aqui romperian el HTML.
var RELIGIOUS_CROSS_FONT = "'Noto Sans Symbols 2', 'Noto Sans Symbols', Arial, sans-serif";

// Separador entre anios de nacimiento/fallecimiento: cruz (religiosa) o guion.
function yearsSeparator(isReligious) {
  return isReligious
    ? ' <span style="font-family:' + RELIGIOUS_CROSS_FONT + ';">&#x271D;</span> '
    : ' - ';
}

function yearsHtml(m) {
  return escapeHtml(m.birthYear || '') + yearsSeparator(!!m.isReligious) + escapeHtml(m.deathYear || '');
}

// Divide el nombre completo en 2 lineas repartiendo las palabras a la mitad
// (ej. "Ana Maria Neira Mosquera" -> "Ana Maria" / "Neira Mosquera"), tal como
// muestra la guia de diseno para el nombre de la pantalla 1 de los temas V2.
function nameTwoLines(name) {
  var words = String(name || '').trim().split(/\s+/).filter(function (w) { return w; });
  if (words.length <= 1) return [words.join(' '), ''];
  var mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
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
    '  padding: 10px 36px; height: 100px; }',
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
    '  -webkit-box-sizing: border-box; box-sizing: border-box; }',
    // Lienzo virtual fijo 1920x1080: todo el layout (px absolutos, tamanos de
    // fuente) se disena asumiendo esta resolucion exacta. html/body son 100%
    // fluido (llenan el viewport real), pero si ese viewport real no es
    // exactamente 1920x1080 (TV/monitor con otra resolucion, escalado del SO,
    // ventana de navegador no maximizada) el contenido en px absolutos se
    // desborda o queda mal ubicado. fitStageJs() escala .stage completo para
    // que siempre quepa, sin afectar las mediciones de fitScriptJs (scrollWidth/
    // clientWidth no cambian con transform, solo su representacion visual).
    '.stage { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; ',
    '  -webkit-transform-origin: 0 0; transform-origin: 0 0; }'
  ].join('\n');
}

// JS ES5 compartido (legacy y tematico): escala #stage (lienzo virtual fijo de
// 1920x1080) para que quepa completo en el viewport real, sin importar la
// resolucion/escalado real del dispositivo. Centrado si la proporcion no calza
// exacto. Se re-ejecuta en resize (defensivo; en un kiosco fijo no deberia
// disparar, pero no tiene costo dejarlo).
var STAGE_FIT_JS =
  'function fitStage() {' +
  'var stage = document.getElementById("stage");' +
  'if (!stage) return;' +
  'var sx = window.innerWidth / 1920;' +
  'var sy = window.innerHeight / 1080;' +
  'var s = sx < sy ? sx : sy;' +
  'if (!s || s <= 0) s = 1;' +
  'var tx = Math.round((window.innerWidth - 1920 * s) / 2);' +
  'var ty = Math.round((window.innerHeight - 1080 * s) / 2);' +
  'var t = "translate(" + tx + "px," + ty + "px) scale(" + s + ")";' +
  'stage.style.webkitTransform = t;' +
  'stage.style.transform = t;' +
  '}\n' +
  'fitStage();\n' +
  'window.onresize = fitStage;';

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
    '<div class="stage" id="stage">\n' +
    '<div class="viewport">\n' +
    opts.body + '\n' +
    '</div>\n' +
    renderFooter(opts.screen, opts.totalScreens, opts.scheduleStart, opts.scheduleEnd) + '\n' +
    '</div>\n' +
    '<script type="text/javascript">\n' + STAGE_FIT_JS + '\n</scr' + 'ipt>\n' +
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
    '    <td class="footer-left"></td>\n' +
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
        'Tu presencia y tus recuerdos mantienen viva su memoria.</div>' +
        '<div style="font-size:28px;opacity:0.85;margin-top:16px;font-weight:300;line-height:1.5;">' +
        'Escanea este c&oacute;digo para compartir tus palabras y fotos con la familia.</div>' +
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
var TEMPLATE_IDS = ['default', 'nino', 'nina', 'nubes', 'naturaleza', 'adulto'];

// --- Helpers de CSS animado compatible (duplica @keyframes con prefijo) ---
function kfDual(name, frames) {
  return '@-webkit-keyframes ' + name + ' { ' + frames + ' }\n' +
         '@keyframes ' + name + ' { ' + frames + ' }';
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

// Nubes: 3 capas de "franjas de nube" (lejos/media/cerca) que se desplazan
// verticalmente en loop infinito, con un leve balanceo horizontal ("mecer")
// integrado en el MISMO @keyframes (varios waypoints de translateX a lo largo
// del recorrido), mas un resplandor calido pulsante arriba. Sin filter:blur ni
// mix-blend-mode: la suavidad la da el propio radial-gradient (ultimo stop en
// rgba(255,255,255,0) con corte generoso). Se usan divs estaticos con
// animation-delay negativo para desincronizar las 3 capas.
// Optimizaciones de rendimiento (TVs LG con motores WebKit viejos y GPU
// debil): 1) .fx-nube/.fx-nube-glow se promueven a capa de composicion propia
// con translateZ(0)+backface-visibility:hidden, para que el motor las trate
// como bitmaps trasladados en vez de repintar el gradiente en cada frame;
// 2) cada @keyframes de deriva baja de 5-6 waypoints a solo 3 (0/50/100%),
// conservando el fade de opacity al inicio/fin y el mismo pico de opacity de
// antes, con un solo desplazamiento horizontal intermedio (menos interpolacion
// por frame); 3) cada capa usa UN solo radial-gradient (antes dos apilados),
// con mas stops de opacidad para mantener cobertura visual similar (mitad del
// costo de pintado); 4) .fx-nube baja de 140% a 120% de ancho (menos area
// pintada mientras el vaiven horizontal sigue siendo de apenas ~15px).
var NUBES_FX_CSS =
  '.fx-nube-glow { position:absolute; left:0; right:0; top:0; height:42%; opacity:0.6; ' +
  '-webkit-transform: translateZ(0); transform: translateZ(0); -webkit-backface-visibility: hidden; backface-visibility: hidden; ' +
  'background: rgba(228,211,168,0.18); ' +
  'background: -webkit-radial-gradient(50% 0%, ellipse, rgba(228,211,168,0.55), rgba(228,211,168,0.14) 45%, rgba(228,211,168,0) 75%); ' +
  'background: radial-gradient(ellipse at 50% 0%, rgba(228,211,168,0.55), rgba(228,211,168,0.14) 45%, rgba(228,211,168,0) 75%); ' +
  '-webkit-animation: fxNubeGlowPulse 9s ease-in-out infinite; animation: fxNubeGlowPulse 9s ease-in-out infinite; }\n' +
  kfDual('fxNubeGlowPulse', '0%,100% { opacity:0.45; } 50% { opacity:0.8; }') + '\n' +
  '.fx-nube { position:absolute; left:-10%; width:120%; height:420px; opacity:0; ' +
  '-webkit-transform: translateZ(0); transform: translateZ(0); -webkit-backface-visibility: hidden; backface-visibility: hidden; }\n' +
  '.fx-nube-far { top:-360px; ' +
  'background: rgba(255,255,255,0.4); ' +
  'background: -webkit-radial-gradient(50% 50%, ellipse, rgba(255,255,255,0.85), rgba(255,255,255,0.32) 40%, rgba(255,255,255,0.12) 62%, rgba(255,255,255,0) 78%); ' +
  'background: radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.85), rgba(255,255,255,0.32) 40%, rgba(255,255,255,0.12) 62%, rgba(255,255,255,0) 78%); ' +
  '-webkit-animation: fxNubeDriftFar 68s linear infinite; animation: fxNubeDriftFar 68s linear infinite; }\n' +
  kfDual('fxNubeDriftFar',
    '0% { -webkit-transform:translate(0,0); transform:translate(0,0); opacity:0; } ' +
    '50% { -webkit-transform:translate(12px,540px); transform:translate(12px,540px); opacity:0.28; } ' +
    '100% { -webkit-transform:translate(0,1080px); transform:translate(0,1080px); opacity:0; }') + '\n' +
  '.fx-nube-mid { top:-420px; ' +
  'background: rgba(255,255,255,0.5); ' +
  'background: -webkit-radial-gradient(50% 50%, ellipse, rgba(255,255,255,0.9), rgba(255,255,255,0.35) 36%, rgba(255,255,255,0.14) 58%, rgba(255,255,255,0) 74%); ' +
  'background: radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.9), rgba(255,255,255,0.35) 36%, rgba(255,255,255,0.14) 58%, rgba(255,255,255,0) 74%); ' +
  '-webkit-animation: fxNubeDriftMid 50s linear infinite; animation: fxNubeDriftMid 50s linear infinite; }\n' +
  kfDual('fxNubeDriftMid',
    '0% { -webkit-transform:translate(0,0); transform:translate(0,0); opacity:0; } ' +
    '50% { -webkit-transform:translate(-14px,540px); transform:translate(-14px,540px); opacity:0.4; } ' +
    '100% { -webkit-transform:translate(0,1080px); transform:translate(0,1080px); opacity:0; }') + '\n' +
  '.fx-nube-near { top:-480px; ' +
  'background: rgba(255,255,255,0.6); ' +
  'background: -webkit-radial-gradient(50% 50%, ellipse, rgba(255,255,255,0.97), rgba(255,255,255,0.42) 32%, rgba(255,255,255,0.16) 54%, rgba(255,255,255,0) 70%); ' +
  'background: radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.97), rgba(255,255,255,0.42) 32%, rgba(255,255,255,0.16) 54%, rgba(255,255,255,0) 70%); ' +
  '-webkit-animation: fxNubeDriftNear 30s linear infinite; animation: fxNubeDriftNear 30s linear infinite; }\n' +
  kfDual('fxNubeDriftNear',
    '0% { -webkit-transform:translate(0,0); transform:translate(0,0); opacity:0; } ' +
    '50% { -webkit-transform:translate(15px,540px); transform:translate(15px,540px); opacity:0.55; } ' +
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
var RALEWAY_STACK = '"Raleway", Arial, Helvetica, sans-serif';

// Pesos completos de Raleway (Medium/Semibold/Bold/Black) + Noto Sans Symbols 2
// (glifo de cruz para la variante religiosa) para los 5 temas vigentes de la
// guia FINAL: naturaleza, nubes, nino, nina, adulto.
var RALEWAY_FULL_HREF = 'https://fonts.googleapis.com/css2?family=Raleway:wght@500;600;700;900&family=Noto+Sans+Symbols+2&display=swap';

var TEMPLATES = {
  // ---- Linea vigente ("Guia FINAL slides"): fondo fotografico con logo Los
  // Olivos ya incluido en el arte (hideLogo), layout de servicio V2
  // (serviceLayout) y tarjeta centrada en pantallas 2/3 (emotionalLayout).
  // Todas usan Raleway (Medium/Semibold/Bold/Black) segun la guia.
  naturaleza: {
    id: 'naturaleza',
    fontsHref: RALEWAY_FULL_HREF,
    fontName: RALEWAY_STACK,
    fontBody: RALEWAY_STACK,
    nameWeight: 500, nameSize1: 150, nameUppercase: true, name2Size: 80, name2Weight: 600,
    titulo: '#ffffff', texto: '#ffffff', eyebrow: '#fcf0c0',
    divider: 'rgba(255,255,255,0.3)', titleShadow: true,
    cardBg: 'rgba(0,0,0,0.28)', cardBorder: 'rgba(255,255,255,0.3)', cardText: '#ffffff',
    avatarBg: '#649378', avatarText: '#ffffff',
    fallback: '#3c5c46', bgType: 'css',
    bgPhoto: 'naturaleza-fondo.jpg',
    religiousColor: '#fcf0c0',
    msgBoxColor: '#649378', msgBoxBorder: 'rgba(255,255,255,0.5)',
    hideLogo: true,
    serviceLayout: 'v2',
    emotionalLayout: 'centered',
    particlesCss: '', particlesHtml: '', particlesJs: ''
  },
  nino: {
    id: 'nino',
    fontsHref: RALEWAY_FULL_HREF,
    fontName: RALEWAY_STACK,
    fontBody: RALEWAY_STACK,
    nameWeight: 500, nameSize1: 150, nameUppercase: true, name2Size: 80, name2Weight: 600,
    titulo: '#182939', texto: '#182939', eyebrow: '#182939',
    divider: 'rgba(24,41,57,0.3)', titleShadow: false,
    cardBg: 'rgba(255,255,255,0.55)', cardBorder: 'rgba(255,255,255,0.7)', cardText: '#182939',
    avatarBg: '#182939', avatarText: '#ffffff',
    fallback: '#cfe4ee', bgType: 'css',
    bgPhoto: 'nino-fondo.jpg',
    religiousColor: '#182939',
    msgBoxColor: '#a1ccde', msgBoxBorder: 'rgba(255,255,255,0.7)',
    hideLogo: true,
    serviceLayout: 'v2',
    emotionalLayout: 'centered',
    particlesCss: '', particlesHtml: '', particlesJs: ''
  },
  nina: {
    id: 'nina',
    fontsHref: RALEWAY_FULL_HREF,
    fontName: RALEWAY_STACK,
    fontBody: RALEWAY_STACK,
    nameWeight: 500, nameSize1: 150, nameUppercase: true, name2Size: 80, name2Weight: 600,
    // Color verificado por muestreo de pixel directo sobre el PDF (ver notas
    // de la sesion): el color real de TODO el texto de nina es #511633; las
    // anotaciones de flecha del PDF que marcan #182939 son un error de
    // copiar/pegar heredado de las plantillas de nino/nubes.
    titulo: '#511633', texto: '#511633', eyebrow: '#511633',
    divider: 'rgba(81,22,51,0.3)', titleShadow: false,
    cardBg: 'rgba(255,255,255,0.55)', cardBorder: 'rgba(96,26,58,0.5)', cardText: '#511633',
    avatarBg: '#511633', avatarText: '#ffffff',
    fallback: '#e8c3cd', bgType: 'css',
    bgPhoto: 'nina-fondo.jpg',
    religiousColor: '#511633',
    msgBoxColor: '#edc5cf', msgBoxBorder: '#601a3a',
    hideLogo: true,
    serviceLayout: 'v2',
    emotionalLayout: 'centered',
    particlesCss: '', particlesHtml: '', particlesJs: ''
  },
  nubes: {
    id: 'nubes',
    fontsHref: RALEWAY_FULL_HREF,
    fontName: RALEWAY_STACK,
    fontBody: RALEWAY_STACK,
    nameWeight: 500, nameSize1: 150, nameUppercase: true, name2Size: 80, name2Weight: 600,
    titulo: '#182939', texto: '#182939', eyebrow: '#182939',
    divider: 'rgba(24,41,57,0.3)', titleShadow: false,
    cardBg: 'rgba(255,255,255,0.55)', cardBorder: 'rgba(255,255,255,0.7)', cardText: '#182939',
    avatarBg: '#182939', avatarText: '#ffffff',
    fallback: '#7fa9c4', bgType: 'css',
    // Foto real de cielo con nubes (no un gradiente): bgPhoto guarda solo el
    // nombre de archivo porque la URL absoluta requiere baseUrl, que no existe
    // todavia cuando este modulo se carga (ver themedBgCss).
    bgPhoto: 'nubes-fondo.jpg',
    religiousColor: '#182939',
    msgBoxColor: '#7dadc7', msgBoxBorder: 'rgba(255,255,255,0.7)',
    hideLogo: true,
    serviceLayout: 'v2',
    emotionalLayout: 'centered',
    // Se conserva la animacion de nubes (capas fx-nube) sobre la foto: bonus
    // visual ya optimizado para WebKit de LG en una sesion anterior.
    particlesCss: NUBES_FX_CSS, particlesHtml: NUBES_FX_HTML, particlesJs: NUBES_FX_JS
  },
  adulto: {
    id: 'adulto',
    fontsHref: RALEWAY_FULL_HREF,
    fontName: RALEWAY_STACK,
    fontBody: RALEWAY_STACK,
    nameWeight: 500, nameSize1: 150, nameUppercase: true, name2Size: 80, name2Weight: 600,
    titulo: '#382b22', texto: '#382b22', eyebrow: '#42342a',
    divider: 'rgba(56,43,34,0.3)', titleShadow: false,
    cardBg: 'rgba(255,255,255,0.45)', cardBorder: 'rgba(255,255,255,0.6)', cardText: '#382b22',
    avatarBg: '#382b22', avatarText: '#ffffff',
    fallback: '#9c8a6e', bgType: 'css',
    bgPhoto: 'adulto-fondo.jpg',
    religiousColor: '#382b22',
    msgBoxColor: '#d5cbb8', msgBoxBorder: 'rgba(255,255,255,0.6)',
    hideLogo: true,
    serviceLayout: 'v2',
    emotionalLayout: 'centered',
    particlesCss: '', particlesHtml: '', particlesJs: ''
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
    // line-height: 1.05 es el default de todos los temas (Raleway). 'nubes'
    // define nameLineHeight:1.22 porque Cormorant Garamond tiene ascendentes
    // mas altos y a 1.05 el glifo superior se recorta contra overflow:hidden.
    '  font-size: ' + theme.nameSize1 + 'px; line-height: ' + (theme.nameLineHeight || 1.05) + '; color: ' + theme.titulo + '; ',
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
    // Columna derecha de la pantalla QR de 'nubes': SOLO el mensaje (sin
    // eyebrow/nombre/anios, que se movieron a la izquierda junto al QR), asi
    // que se puede centrar el texto en vez de alinearlo a la izquierda.
    '.t-qr-r-centered { width: 56%; vertical-align: middle; text-align: center; padding: 30px 90px; }',
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
    // ---- Pantalla 2 alternativa: tarjeta centrada (naturaleza, nubes, nino,
    // nina, adulto - ver emotionalLayout:"centered" y renderThemedEmotional) ----
    '.t-card2 { position: absolute; left: 0; right: 0; top: 24px; bottom: 118px; text-align: center; z-index: 3; }',
    // display:block + margin:0 auto (no inline-block) para que la foto quede
    // SIEMPRE en su propia linea, con la etiqueta/nombre/anos/mensaje debajo
    // (si fuera inline-block quedaria en la misma linea que la etiqueta,
    // lado a lado, en vez de apilada).
    // Foto 260 (no 300): con el mensaje ahora dinamico (biografia real de la
    // familia, no un texto fijo corto) hace falta mas margen vertical para
    // mensajes largos antes de que el auto-ajuste tenga que reducir la fuente
    // al minimo; este recorte + margenes mas chicos abajo liberan ~70px.
    '.t-card2-photo { display: block; margin: 0 auto; width: 260px; height: 260px; border-radius: 16px; ',
    '  border: 5px solid rgba(255,255,255,0.7); background-color: rgba(255,255,255,0.3); ',
    '  background-position: center top; background-repeat: no-repeat; ',
    '  -webkit-background-size: cover; background-size: cover; }',
    '.t-card2-eyebrow { display: inline-block; margin-top: 14px; padding: 8px 26px; ',
    '  background: rgba(255,255,255,0.6); border-radius: 6px; ',
    '  font-family: ' + theme.fontBody + '; font-size: 26px; font-weight: 600; letter-spacing: 2px; ',
    '  text-transform: uppercase; color: ' + theme.eyebrow + '; }',
    '.t-card2-name { margin-top: 18px; font-family: ' + theme.fontName + '; font-weight: ' + theme.nameWeight + '; ',
    '  font-size: 88px; line-height: 1.2; color: ' + theme.titulo + '; }',
    '.t-card2-years { margin-top: 8px; font-family: ' + theme.fontBody + '; font-style: italic; ',
    '  font-size: 40px; color: ' + theme.texto + '; }',
    // max-height 400 (antes 330): el mensaje ahora es la biografia libre que
    // escribe la familia (antes era un texto fijo corto de la guia), asi que
    // necesita mas margen antes de que el auto-ajuste (fits: tFitMsg) tenga
    // que reducir el tamano de fuente al minimo.
    '.t-card2-msg { display: inline-block; margin-top: 20px; max-width: 1150px; max-height: 400px; ',
    '  overflow: hidden; padding: 26px 46px; background: rgba(255,255,255,0.55); ',
    '  border: 1px solid rgba(255,255,255,0.7); border-radius: 12px; ',
    '  font-family: ' + theme.fontBody + '; font-size: 40px; line-height: 1.5; color: ' + theme.texto + '; }',
    // max-height + overflow:hidden: le dan al auto-ajuste (modo 'h', id tQrMsg)
    // un limite real contra el cual medir antes de reducir el tamano de fuente.
    // La celda vertical-align:middle tiene ~980px utiles (viewport completo
    // menos el footer), asi que 700px deja margen de sobra sin forzar el
    // texto al tamano minimo.
    '.t-qrtext { font-weight: 600; font-size: 72px; line-height: 1.45; color: ' + theme.texto + '; ',
    '  margin-top: 30px; max-height: 700px; overflow: hidden; }',
    '.qr-box2 { display: inline-block; padding: 22px; background: #ffffff; border-radius: 28px; }',
    '.qr-box2 svg { display: block; width: 420px; height: 420px; }',
    '.t-scan { margin-top: 28px; font-size: 34px; font-weight: 700; color: ' + theme.titulo + '; }',
    // ---- Pantalla 1 V2 (guia FINAL slides): portada/homenaje, ver
    // renderThemedServiceV2. Solo la usan los temas con serviceLayout:'v2'. ----
    '.t-v2-wrap { position: absolute; left: 6%; right: 6%; top: 0; bottom: 118px; z-index: 3; text-align: center; }',
    '.t-v2-relig { font-weight: 600; font-size: 32px; margin-bottom: 22px; color: ' + (theme.religiousColor || theme.eyebrow) + '; }',
    '.t-v2-name-line { font-weight: 900; font-size: 112px; line-height: 1.18; ',
    '  text-transform: uppercase; letter-spacing: 1px; color: ' + theme.titulo + '; white-space: nowrap; overflow: hidden; }',
    '.t-v2-sub { font-weight: 500; font-size: 34px; line-height: 1.5; margin-top: 28px; color: ' + theme.eyebrow + '; }',
    '.t-v2-grid { width: 100%; max-width: 1500px; margin: 40px auto 0; border-collapse: collapse; table-layout: fixed; }',
    '.t-v2-col { width: 50%; vertical-align: top; padding: 0 30px; text-align: left; }',
    '.t-v2-row { font-size: 30px; line-height: 1.7; color: ' + theme.titulo + '; white-space: nowrap; overflow: hidden; }',
    '.t-v2-lbl { font-weight: 700; }',
    '.t-v2-val { font-weight: 500; }',
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
    // ---- Footer (identico al legacy; sin capa oscura, footer transparente) ----
    '.footer { position: absolute; left: 0; right: 0; bottom: 0; ',
    '  padding: 10px 36px; height: 100px; z-index: 5; }',
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
    '.dot-indicator.active { background: #f0c040; width: 26px; border-radius: 6px; }',
    // Lienzo virtual fijo 1920x1080 (ver comentario en commonCss/.stage y
    // STAGE_FIT_JS): mismo mecanismo para las plantillas tematicas.
    '.stage { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; ',
    '  -webkit-transform-origin: 0 0; transform-origin: 0 0; }'
  ].join('\n') + '\n' + themedArtCss(theme, screen, baseUrl) + '\n' + theme.particlesCss;
}

// Logo de esquina inferior derecha segun tema/pantalla.
// Los temas con arte PNG NO llevan overlay: la cinta (pantalla 1) y el
// isotipo (pantallas 2-4) ya vienen dibujados en el arte oficial.
function themedLogoHtml(theme, screen, baseUrl) {
  // hideLogo: temas cuyo arte (bgPhoto) ya trae el logo Los Olivos compuesto
  // en la esquina inferior derecha (extraido directo de la guia de diseno);
  // dibujar la cinta/isotipo encima duplicaria el logo.
  if (theme.bgType === 'png' || theme.hideLogo) return '';
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
    '  <td class="footer-left"></td>\n' +
    '  <td class="footer-center"></td>\n' +
    '  <td class="footer-right">' + dots + '</td>\n' +
    '</tr></table>\n' +
    '</div>';
}

// =========== Pantalla 1 V2: portada/homenaje (guia FINAL slides) ===========
// Usada por los temas con serviceLayout:'v2' (naturaleza, nubes, nino, nina,
// adulto). Reemplaza el layout de banda+nombre gigante+grid 2x2 de
// renderThemedService (que se mantiene intacto para agua/aire/fuego/tierra/
// bosque) por: header religioso opcional, nombre en 2 lineas mayusculas,
// subtitulo fijo, y bloque Homenaje/Exequias | Despedida/Destino Final.
function renderThemedServiceV2(m, theme) {
  var isReligious = !!m.isReligious;
  var lines = nameTwoLines(m.name);

  var relig = isReligious
    ? '<div class="t-v2-relig">Descansa en la paz del se&ntilde;or</div>'
    : '';

  var exqTime = timeOnly12h(m.exequiasDatetime);
  var destTime = timeOnly12h(m.finalDestinationDatetime);
  var homenaje = formatDateLong(m.scheduleStart) || 'Por confirmar';
  var despedida = formatDateLong(m.scheduleEnd) || 'Por confirmar';
  var exequias = escapeHtml(m.exequiasVenue || 'Por confirmar') + (exqTime ? ' ' + exqTime : '');
  var destino = escapeHtml(m.finalDestinationVenue || 'Por confirmar') + (destTime ? ' ' + destTime : '');

  return '<div class="t-v2-wrap"><table style="width:100%;height:100%;border-collapse:collapse;"><tr><td style="vertical-align:middle;">' +
    relig +
    '<div class="t-v2-name-line" id="tV2Name1">' + escapeHtml(lines[0]) + '</div>' +
    (lines[1] ? '<div class="t-v2-name-line" id="tV2Name2">' + escapeHtml(lines[1]) + '</div>' : '') +
    '<div class="t-v2-sub">Cada vida deja una huella &uacute;nica.<br>' +
      'Gracias por acompa&ntilde;arnos a honrar, recordar y agradecer su historia.</div>' +
    '<table class="t-v2-grid"><tr>' +
      '<td class="t-v2-col">' +
        '<div class="t-v2-row"><span class="t-v2-lbl">Homenaje:</span> <span class="t-v2-val">' + escapeHtml(homenaje) + '</span></div>' +
        '<div class="t-v2-row"><span class="t-v2-lbl">Exequias:</span> <span class="t-v2-val">' + exequias + '</span></div>' +
      '</td>' +
      '<td class="t-v2-col">' +
        '<div class="t-v2-row"><span class="t-v2-lbl">Despedida:</span> <span class="t-v2-val">' + escapeHtml(despedida) + '</span></div>' +
        '<div class="t-v2-row"><span class="t-v2-lbl">Destino Final:</span> <span class="t-v2-val">' + destino + '</span></div>' +
      '</td>' +
    '</tr></table>' +
  '</td></tr></table></div>';
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
  var artline = (theme.bgType === 'png' || theme.hideArtline) ? '' : '<div class="t-artline"></div>';

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

  // Temas con emotionalLayout:'centered' (naturaleza, nubes, nino, nina,
  // adulto) usan una tarjeta unica centrada (foto+etiqueta+nombre+anos+
  // mensaje en una sola columna) en vez del layout de dos columnas legacy.
  // El mensaje de la caja es el emotionalMessage/biografia que escribe la
  // familia en el wizard (campo obligatorio) — NO texto fijo: el mockup de
  // la guia mostraba un mensaje de ejemplo ahi, no copy universal (corregido
  // tras observacion del cliente: el mensaje mostrado no coincidia con el
  // que la familia dejo). La caja usa el color de acento del tema al 65%.
  if (theme.emotionalLayout === 'centered') {
    var boxBg = theme.msgBoxColor ? hexToRgba(theme.msgBoxColor, 0.65) : 'rgba(255,255,255,0.55)';
    var boxBorder = theme.msgBoxBorder || 'rgba(255,255,255,0.7)';
    return '<div class="t-card2">' +
      '<div class="t-card2-photo"' + photoStyle + '></div>' +
      '<div class="t-card2-eyebrow">En memoria de</div>' +
      '<div class="t-card2-name">' + escapeHtml(m.name) + '</div>' +
      '<div class="t-card2-years">' + yearsHtml(m) + '</div>' +
      '<div class="t-card2-msg" id="tFitMsg" style="background:' + boxBg + ';border-color:' + boxBorder + ';">' +
      escapeHtml(m.emotionalMessage || '') + '</div>' +
      '</div>';
  }

  // --- Layout existente de dos columnas (SIN CAMBIOS, para los otros 7 temas) ---
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
  // Temas con emotionalLayout:'centered' (naturaleza, nubes, nino, nina,
  // adulto) agrupan eyebrow+QR+nombre+anios en la columna izquierda y dejan
  // el mensaje SOLO en la derecha, lo que permite centrarlo; se quita el
  // rotulo "Escanea el codigo QR" (redundante: el mensaje ya invita a
  // escanear). Titulo y texto son los definitivos de la guia FINAL slides.
  // Los demas temas conservan el layout/copy de siempre (sin tocar).
  if (theme.emotionalLayout === 'centered') {
    return '<table class="layout-table"><tr>' +
      '<td class="t-col-l">' +
        '<div class="t-eyebrow" style="font-size:40px;margin-bottom:14px;">Hazte presente</div>' +
        '<div class="qr-box2">' + (qrSvg || '') + '</div>' +
        '<div class="t-name2" style="margin-top:20px;">' + escapeHtml(m.name) + '</div>' +
        '<div class="t-years">' + yearsHtml(m) + '</div>' +
      '</td>' +
      '<td class="t-qr-r-centered">' +
        '<div class="t-qrtext" id="tQrMsg" style="margin-top:0;">Brinda un mensaje que proviene desde todo el amor ' +
        'que hay al recordar con el coraz&oacute;n.</div>' +
      '</td>' +
      '</tr></table>';
  }

  return '<table class="layout-table"><tr>' +
    '<td class="t-col-l">' +
      '<div class="qr-box2">' + (qrSvg || '') + '</div>' +
      '<div class="t-scan">Escanea el c&oacute;digo QR</div>' +
    '</td>' +
    '<td class="t-col-r">' +
      '<div class="t-eyebrow">En memoria de</div>' +
      '<div class="t-name2" style="margin-top:0;">' + escapeHtml(m.name) + '</div>' +
      '<div class="t-years">' + escapeHtml(m.birthYear || '') + ' &mdash; ' + escapeHtml(m.deathYear || '') + '</div>' +
      '<div class="t-qrtext" id="tQrMsg">Tu presencia y tus recuerdos mantienen viva su memoria. ' +
      'Escanea este c&oacute;digo para compartir tus palabras y fotos con la familia.</div>' +
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

  var script = STAGE_FIT_JS + '\n' +
    FX_HELPERS_JS + '\n' +
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
    '<div class="stage" id="stage">\n' +
    (theme.bgType === 'png' ? '<div class="bg-art"></div>\n' : '') +
    '<div class="fx-layer" id="fxLayer">' + (theme.particlesHtml || '') + '</div>\n' +
    '<div class="viewport">\n' +
    opts.body + '\n' +
    themedLogoHtml(theme, opts.screen, opts.baseUrl) + '\n' +
    '</div>\n' +
    renderThemedFooter(opts.screen, opts.totalScreens, opts.scheduleStart, opts.scheduleEnd) + '\n' +
    '</div>\n' +
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
    if (theme.serviceLayout === 'v2') {
      body = renderThemedServiceV2(m, theme);
      // Auto-ajuste: cada linea del nombre (ancho, sin partir linea).
      fits = [
        ['tV2Name1', 112, 60, 4, 'w'],
        ['tV2Name2', 112, 60, 4, 'w']
      ];
    } else {
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
    }
  } else if (cyc.screen === 2) {
    body = renderThemedEmotional(m, theme);
    fits = [['tFitMsg', 72, 40, 4, 'h']];
  } else {
    body = renderThemedQr(m, theme, opts.qrSvg);
    // tQrMsg solo existe en el layout 'centered' de nubes (mensaje solo en la
    // columna derecha); en los demas temas el id no existe y fitScriptJs lo
    // ignora sin error, asi que es seguro incluirlo siempre.
    fits = [['tQrMsg', 72, 40, 4, 'h']];
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
