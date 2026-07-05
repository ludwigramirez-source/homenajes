// Servicio LLM (Anthropic Claude) para moderacion automatica de condolencias.
//
// REGLA DE ORO: moderateMessage() NUNCA lanza ni rechaza; cualquier fallo
// (config ausente, red, 4xx/5xx, timeout, parse) resuelve con
// { status: 'unmoderated', published: true } para que el submit del visitante
// jamas se caiga por culpa de la moderacion.
//
// Uso de fetch global (Node 20) via HTTP crudo contra la API de Anthropic;
// no se agregan dependencias nuevas.
const db = require('../config/database');

const ANTHROPIC_BASE_URL = 'https://api.anthropic.com';
const ANTHROPIC_VERSION = '2023-06-01';
const MODERATION_TIMEOUT_MS = 12000;
const MODERATION_MAX_TOKENS = 200;

// Precios USD por millon de tokens: [substring del id de modelo, input, output].
// El ORDEN importa: se usa el primer substring que matchee.
const MODEL_PRICES = [
  ['haiku-4-5', 1, 5],
  ['3-5-haiku', 0.8, 4],
  ['haiku', 0.25, 1.25],
  ['opus-4-5', 5, 25],
  ['opus', 15, 75],
  ['sonnet', 3, 15]
];

// Prompt de sistema del moderador (en espanol, contexto funeraria).
const MODERATION_SYSTEM_PROMPT = [
  'Eres el moderador de mensajes de condolencia que se muestran en pantallas publicas',
  'dentro de las salas de velacion de una funeraria.',
  'APRUEBA los mensajes normales de condolencia, recuerdo, afecto o religiosos,',
  'aunque tengan errores de ortografia o sean informales.',
  'RECHAZA solo: insultos o groserias; burlas o faltas de respeto al difunto o la familia;',
  'contenido sexual; odio o discriminacion; spam o publicidad; datos personales sensibles',
  'de terceros; o texto totalmente fuera de contexto (ej. gibberish, promociones).',
  'Responde SOLO un JSON: {"aprobado": true|false, "motivo": "breve razon en espanol"}.'
].join(' ');

// Calcula el costo en USD para un modelo y cantidad de tokens.
// Devuelve 0 si el modelo no matchea ningun precio conocido.
function costUsd(model, inputTokens, outputTokens) {
  if (!model) return 0;
  const id = String(model).toLowerCase();
  for (const [needle, inPrice, outPrice] of MODEL_PRICES) {
    if (id.includes(needle)) {
      const inTok = Number(inputTokens) || 0;
      const outTok = Number(outputTokens) || 0;
      return (inTok * inPrice + outTok * outPrice) / 1e6;
    }
  }
  return 0;
}

// Lee la configuracion actual (la fila mas reciente si hubiera varias).
async function getSettings() {
  const result = await db.query(`
    SELECT id, provider, api_key, model, enabled, updated_at
    FROM llm_settings
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 1
  `);
  return result.rows[0] || null;
}

// Upsert de UNA sola fila. api_key solo se actualiza si viene no-vacia
// (asi la UI puede guardar cambios sin re-escribir la key cada vez).
async function saveSettings({ provider, api_key, model, enabled }) {
  const current = await getSettings();

  if (!current) {
    const result = await db.query(`
      INSERT INTO llm_settings (provider, api_key, model, enabled)
      VALUES ($1, $2, $3, $4)
      RETURNING id, provider, api_key, model, enabled, updated_at
    `, [
      provider || 'anthropic',
      (api_key && String(api_key).trim()) || null,
      model || null,
      enabled === true
    ]);
    return result.rows[0];
  }

  const result = await db.query(`
    UPDATE llm_settings
    SET provider = COALESCE($1, provider),
        api_key = CASE WHEN $2::text IS NOT NULL AND length(trim($2::text)) > 0
                       THEN $2::text ELSE api_key END,
        model = COALESCE($3, model),
        enabled = COALESCE($4, enabled)
    WHERE id = $5
    RETURNING id, provider, api_key, model, enabled, updated_at
  `, [
    provider || null,
    api_key !== undefined && api_key !== null ? String(api_key) : null,
    model !== undefined && model !== null ? String(model) : null,
    typeof enabled === 'boolean' ? enabled : null,
    current.id
  ]);
  return result.rows[0];
}

// Lista los modelos disponibles en Anthropic para una API key.
// Lanza Error con mensaje claro si la key es invalida (401) u otro fallo.
async function listModels(apiKey) {
  if (!apiKey) {
    throw new Error('No hay API key configurada');
  }

  let response;
  try {
    response = await fetch(ANTHROPIC_BASE_URL + '/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION
      }
    });
  } catch (err) {
    throw new Error('No se pudo conectar con Anthropic: ' + err.message);
  }

  if (response.status === 401) {
    throw new Error('API key invalida o revocada (401). Verifica la key de Anthropic.');
  }
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error?.message ? ': ' + body.error.message : '';
    } catch (_) { /* ignore */ }
    throw new Error(`Error de Anthropic (HTTP ${response.status})${detail}`);
  }

  const body = await response.json();
  const models = Array.isArray(body.data) ? body.data : [];
  return models.map((m) => ({
    id: m.id,
    display_name: m.display_name,
    created_at: m.created_at
  }));
}

// Registra una fila en llm_usage. Nunca lanza (la contabilidad no debe
// romper la moderacion ni el submit). Devuelve el id de la fila o null.
async function recordUsage({ provider, model, inputTokens, outputTokens, outcome }) {
  try {
    const result = await db.query(`
      INSERT INTO llm_usage (provider, model, purpose, input_tokens, output_tokens, cost_usd, outcome)
      VALUES ($1, $2, 'moderation', $3, $4, $5, $6)
      RETURNING id
    `, [
      provider || 'anthropic',
      model || null,
      Number(inputTokens) || 0,
      Number(outputTokens) || 0,
      costUsd(model, inputTokens, outputTokens),
      outcome
    ]);
    return result.rows[0]?.id || null;
  } catch (err) {
    console.error('[LLM] No se pudo registrar el uso:', err.message);
    return null;
  }
}

// Vincula una fila de llm_usage con la condolencia insertada. Nunca lanza.
async function linkUsageToCondolence(usageId, condolenceId) {
  if (!usageId || !condolenceId) return;
  try {
    await db.query('UPDATE llm_usage SET condolence_id = $1 WHERE id = $2', [condolenceId, usageId]);
  } catch (err) {
    console.error('[LLM] No se pudo vincular llm_usage con la condolencia:', err.message);
  }
}

// Extrae el primer objeto JSON { ... } de un texto. Devuelve el objeto
// parseado o lanza si no hay JSON valido.
function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('la respuesta no contiene JSON');
  }
  return JSON.parse(text.slice(start, end + 1));
}

// Modera un mensaje de condolencia. SIEMPRE resuelve con:
// { status: 'approved'|'rejected'|'unmoderated', reason, published, model?, usageId? }
async function moderateMessage({ message, senderName }) {
  let settings = null;
  try {
    settings = await getSettings();
  } catch (err) {
    console.error('[LLM] No se pudo leer llm_settings:', err.message);
    return { status: 'unmoderated', reason: 'error de moderacion: configuracion inaccesible', published: true };
  }

  if (!settings || !settings.enabled || !settings.api_key || !settings.model) {
    return { status: 'unmoderated', reason: 'moderacion no configurada', published: true };
  }

  const model = settings.model;
  const provider = settings.provider || 'anthropic';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODERATION_TIMEOUT_MS);

  try {
    const response = await fetch(ANTHROPIC_BASE_URL + '/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.api_key,
        'anthropic-version': ANTHROPIC_VERSION
      },
      body: JSON.stringify({
        model: model,
        max_tokens: MODERATION_MAX_TOKENS,
        system: MODERATION_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: 'Nombre del remitente: ' + (senderName || '') + '\nMensaje:\n' + (message || '')
        }]
      })
    });

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const body = await response.json();
        if (body?.error?.message) detail = `HTTP ${response.status} ${String(body.error.message).slice(0, 120)}`;
      } catch (_) { /* ignore */ }
      const usageId = await recordUsage({ provider, model, inputTokens: 0, outputTokens: 0, outcome: 'error' });
      return { status: 'unmoderated', reason: 'error de moderacion: ' + detail, published: true, model, usageId };
    }

    const data = await response.json();
    const inputTokens = data?.usage?.input_tokens || 0;
    const outputTokens = data?.usage?.output_tokens || 0;

    let verdict;
    try {
      const text = (data.content || [])
        .filter((b) => b && b.type === 'text')
        .map((b) => b.text)
        .join('\n');
      verdict = extractJson(text);
      if (typeof verdict.aprobado !== 'boolean') {
        throw new Error('el campo "aprobado" no es booleano');
      }
    } catch (parseErr) {
      const usageId = await recordUsage({ provider, model, inputTokens, outputTokens, outcome: 'error' });
      return {
        status: 'unmoderated',
        reason: 'error de moderacion: respuesta no interpretable (' + parseErr.message + ')',
        published: true,
        model,
        usageId
      };
    }

    const status = verdict.aprobado ? 'approved' : 'rejected';
    const usageId = await recordUsage({ provider, model, inputTokens, outputTokens, outcome: status });

    return {
      status,
      reason: typeof verdict.motivo === 'string' ? verdict.motivo.slice(0, 500) : null,
      published: status !== 'rejected',
      model,
      usageId
    };
  } catch (err) {
    const detail = err.name === 'AbortError' ? 'timeout (12s)' : String(err.message).slice(0, 120);
    const usageId = await recordUsage({ provider, model, inputTokens: 0, outputTokens: 0, outcome: 'error' });
    return { status: 'unmoderated', reason: 'error de moderacion: ' + detail, published: true, model, usageId };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  getSettings,
  saveSettings,
  listModels,
  costUsd,
  moderateMessage,
  linkUsageToCondolence
};
