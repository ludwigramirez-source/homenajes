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
    accent: '#3f7092',
    accentText: '#ffffff'
  }),

  nina: buildTheme({
    background: `
      radial-gradient(ellipse at 30% 55%, rgba(255,252,250,0.9), rgba(255,252,250,0) 45%),
      radial-gradient(ellipse at 70% 30%, rgba(245,228,228,0.8), rgba(245,228,228,0) 55%),
      linear-gradient(135deg, #ead7d6 0%, #f2e6e0 35%, #ecd9d6 70%, #ddc4c4 100%)`,
    light: true,
    accent: '#96626a',
    accentText: '#ffffff'
  }),

  agua: buildTheme({
    background: `
      radial-gradient(ellipse at 45% 38%, rgba(225,245,250,0.85), rgba(225,245,250,0) 50%),
      radial-gradient(ellipse at 75% 70%, rgba(60,150,170,0.5), rgba(60,150,170,0) 55%),
      linear-gradient(180deg, #cdeaf2 0%, #8fcad9 28%, #4ea3bb 60%, #2c7d96 85%, #1c6178 100%)`,
    light: true,
    accent: '#2c7d96',
    accentText: '#ffffff'
  }),

  aire: buildTheme({
    background: `
      radial-gradient(ellipse at 45% 50%, rgba(255,255,255,0.95), rgba(255,255,255,0) 52%),
      radial-gradient(ellipse at 78% 28%, rgba(232,243,250,0.7), rgba(232,243,250,0) 55%),
      linear-gradient(150deg, #b3d0e2 0%, #d2e6f1 30%, #f3f9fc 55%, #c6dded 80%, #aacadd 100%)`,
    light: true,
    accent: '#3a6b8c',
    accentText: '#ffffff'
  }),

  fuego: buildTheme({
    background: `
      radial-gradient(ellipse at 50% 92%, rgba(255,180,70,0.55), rgba(255,180,70,0) 45%),
      radial-gradient(ellipse at 45% 50%, rgba(255,225,180,0.35), rgba(255,225,180,0) 50%),
      radial-gradient(ellipse at 78% 30%, rgba(200,80,40,0.4), rgba(200,80,40,0) 55%),
      linear-gradient(180deg, #3a1a18 0%, #5e2a20 40%, #94472a 70%, #c8722f 100%)`,
    light: false,
    // #c8722f (referencia) solo alcanza 3.6:1 con blanco; se oscurece a #b05e22
    // para cumplir AA manteniendo el caracter calido del tema.
    accent: '#b05e22',
    accentText: '#ffffff'
  }),

  tierra: buildTheme({
    background: `
      radial-gradient(ellipse at 42% 55%, rgba(248,244,228,0.92), rgba(248,244,228,0) 50%),
      radial-gradient(ellipse at 75% 30%, rgba(226,216,180,0.7), rgba(226,216,180,0) 55%),
      linear-gradient(150deg, #b9b083 0%, #d8cfa0 28%, #efe9cf 52%, #cdbf90 78%, #a89a6a 100%)`,
    // La escena de tierra es beige claro (#efe9cf al centro): con glass claro
    // el texto blanco seria ilegible, por eso se trata como tema CLARO.
    light: true,
    accent: '#7a6a35',
    accentText: '#ffffff'
  }),

  bosque: buildTheme({
    background: `
      radial-gradient(ellipse at 62% 30%, rgba(255,236,180,0.9), rgba(255,236,180,0) 45%),
      radial-gradient(ellipse at 40% 70%, rgba(120,95,50,0.5), rgba(120,95,50,0) 55%),
      linear-gradient(170deg, #7a5e30 0%, #a07d3e 25%, #c9a155 48%, #9c7838 72%, #5f4824 100%)`,
    light: false,
    accent: '#5f4824',
    accentText: '#ffffff'
  }),

  nubes: buildTheme({
    background: `
      radial-gradient(ellipse at 42% 55%, rgba(255,255,255,0.9), rgba(255,255,255,0) 50%),
      radial-gradient(ellipse at 72% 30%, rgba(235,244,250,0.75), rgba(235,244,250,0) 55%),
      linear-gradient(150deg, #b7d3e6 0%, #d6e8f2 30%, #eef6fa 55%, #c9dfec 80%, #a9c9dd 100%)`,
    light: true,
    // #3c5a6e sobre blanco da ~7.3:1, cumple AA (>=4.5:1) sin ajuste.
    accent: '#3c5a6e',
    accentText: '#ffffff'
  })
};

// Devuelve el tema de una plantilla; cualquier id desconocido cae en default.
export const getTheme = (templateId) => THEMES[templateId] || THEMES.default;
