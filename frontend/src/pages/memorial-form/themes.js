// Temas visuales del formulario publico de condolencias (QR).
// Cada tema replica el ambiente de su plantilla de display (template_id):
// los gradientes provienen del .stage de docs/plantillas-referencia/<id>.html.
//
// Campos:
// - background: gradiente de escena de la plantilla.
// - light:      true si el fondo es predominantemente claro. En fondos claros
//               la tarjeta usa glass OSCURO (rgba(45,60,70,0.38)) para que el
//               texto blanco del formulario siga siendo legible; en fondos
//               oscuros se mantiene el glass claro actual (rgba(255,255,255,0.10)).
// - accent / accentText: color del boton de envio (y checkbox) por tema,
//               elegidos con contraste AA (>= 4.5:1) entre accent y accentText.

const DARK_CARD_ON_LIGHT_BG = 'rgba(45,60,70,0.38)';
const LIGHT_CARD_ON_DARK_BG = 'rgba(255,255,255,0.10)';

// Convierte '#rrggbb' + alpha a 'rgba(r,g,b,a)' (para halos de foco y sombras).
const rgba = (hex, alpha) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const buildTheme = ({ background, light, accent, accentText }) => ({
  background,
  light,
  accent,
  accentText,
  cardBg: light ? DARK_CARD_ON_LIGHT_BG : LIGHT_CARD_ON_DARK_BG,
  cardBorder: light ? '1px solid rgba(255,255,255,0.30)' : '1px solid rgba(255,255,255,0.22)',
  focusRing: rgba(accent, 0.5),
  accentShadow: rgba(accent, 0.4),
  dragBg: rgba(accent, 0.12)
});

export const THEMES = {
  // Diseño teal clasico (homenajes previos al sistema de plantillas).
  default: buildTheme({
    background: 'linear-gradient(160deg, #1a9490 0%, #1a7472 35%, #155f5d 70%, #0f4a48 100%)',
    light: false,
    accent: '#f0c040',
    accentText: '#1a4a48'
  }),

  nino: buildTheme({
    background: `
      radial-gradient(ellipse at 45% 60%, rgba(255,255,255,0.92), rgba(255,255,255,0) 48%),
      radial-gradient(ellipse at 75% 35%, rgba(245,250,252,0.7), rgba(245,250,252,0) 55%),
      linear-gradient(135deg, #a7cadd 0%, #cfe4ee 30%, #eef5f8 55%, #bcd8e6 80%, #a3c5d8 100%)`,
    light: true,
    // Paleta actualizada segun la guia FINAL slides (primario/acento #182939).
    accent: '#182939',
    accentText: '#ffffff'
  }),

  nina: buildTheme({
    background: `
      radial-gradient(ellipse at 30% 55%, rgba(255,252,250,0.9), rgba(255,252,250,0) 45%),
      radial-gradient(ellipse at 70% 30%, rgba(245,228,228,0.8), rgba(245,228,228,0) 55%),
      linear-gradient(135deg, #ead7d6 0%, #f2e6e0 35%, #ecd9d6 70%, #ddc4c4 100%)`,
    light: true,
    // Color verificado por muestreo de pixel sobre el PDF de la guia: #511633
    // (no #182939, que era un error de copiar/pegar en las anotaciones).
    accent: '#511633',
    accentText: '#ffffff'
  }),

  naturaleza: buildTheme({
    background: `
      radial-gradient(ellipse at 50% 30%, rgba(200,225,190,0.35), rgba(200,225,190,0) 50%),
      radial-gradient(ellipse at 70% 75%, rgba(30,50,35,0.5), rgba(30,50,35,0) 55%),
      linear-gradient(170deg, #4a6b52 0%, #3c5c46 30%, #2e4a38 60%, #1f3a2c 100%)`,
    light: false,
    accent: '#3c5c46',
    accentText: '#ffffff'
  }),

  adulto: buildTheme({
    background: `
      radial-gradient(ellipse at 40% 40%, rgba(255,250,240,0.85), rgba(255,250,240,0) 50%),
      radial-gradient(ellipse at 75% 70%, rgba(140,110,80,0.4), rgba(140,110,80,0) 55%),
      linear-gradient(150deg, #c9b899 0%, #ddd0b5 30%, #f0e8d8 55%, #cbb896 80%, #9c8a6e 100%)`,
    light: true,
    accent: '#382b22',
    accentText: '#ffffff'
  }),

  nubes: buildTheme({
    background: `
      radial-gradient(ellipse at 42% 55%, rgba(255,255,255,0.9), rgba(255,255,255,0) 50%),
      radial-gradient(ellipse at 72% 30%, rgba(235,244,250,0.75), rgba(235,244,250,0) 55%),
      linear-gradient(150deg, #b7d3e6 0%, #d6e8f2 30%, #eef6fa 55%, #c9dfec 80%, #a9c9dd 100%)`,
    light: true,
    // Paleta actualizada segun la guia FINAL slides (primario/acento #182939).
    accent: '#182939',
    accentText: '#ffffff'
  })
};

// Devuelve el tema de una plantilla; cualquier id desconocido cae en default.
export const getTheme = (templateId) => THEMES[templateId] || THEMES.default;
