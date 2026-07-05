// Controller de configuracion y uso del LLM (moderacion automatica).
// Todas las rutas son SOLO admin (ver llm.routes.js).
const db = require('../config/database');
const llmService = require('../services/llm.service');

const VALID_PROVIDERS = ['anthropic'];

// Enmascara la API key: nunca se devuelve completa al frontend.
function maskApiKey(key) {
  if (!key) return null;
  return 'sk-ant-•••••' + String(key).slice(-4);
}

function sanitizeSettings(row) {
  if (!row) {
    return {
      provider: 'anthropic',
      model: null,
      enabled: false,
      has_key: false,
      api_key_masked: null,
      updated_at: null
    };
  }
  return {
    provider: row.provider,
    model: row.model,
    enabled: row.enabled === true,
    has_key: !!row.api_key,
    api_key_masked: maskApiKey(row.api_key),
    updated_at: row.updated_at
  };
}

// GET /api/llm/settings
const getSettings = async (req, res, next) => {
  try {
    const settings = await llmService.getSettings();
    res.json({ success: true, data: sanitizeSettings(settings) });
  } catch (error) {
    next(error);
  }
};

// PUT /api/llm/settings  body: { provider?, api_key?, model?, enabled? }
const updateSettings = async (req, res, next) => {
  try {
    const { provider, api_key, model, enabled } = req.body;

    if (provider !== undefined && !VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({
        success: false,
        error: `Proveedor invalido. Soportados: ${VALID_PROVIDERS.join(', ')}`
      });
    }
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, error: 'enabled debe ser booleano' });
    }
    if (model !== undefined && model !== null && typeof model !== 'string') {
      return res.status(400).json({ success: false, error: 'model debe ser un string' });
    }
    if (api_key !== undefined && api_key !== null && typeof api_key !== 'string') {
      return res.status(400).json({ success: false, error: 'api_key debe ser un string' });
    }

    const saved = await llmService.saveSettings({ provider, api_key, model, enabled });
    res.json({ success: true, data: sanitizeSettings(saved) });
  } catch (error) {
    next(error);
  }
};

// GET /api/llm/models?api_key=<opcional>
// Usa la key del query (para probar antes de guardar) o la guardada.
const getModels = async (req, res, next) => {
  try {
    let apiKey = req.query.api_key && String(req.query.api_key).trim();
    if (!apiKey) {
      const settings = await llmService.getSettings();
      apiKey = settings?.api_key || null;
    }
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'No hay API key: envia ?api_key=... o guarda una en la configuracion'
      });
    }

    try {
      const models = await llmService.listModels(apiKey);
      res.json({ success: true, data: models });
    } catch (llmError) {
      return res.status(400).json({ success: false, error: llmError.message });
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/llm/usage
// Totales, gasto por dia (ultimos 30 dias) y desglose por modelo.
const getUsage = async (req, res, next) => {
  try {
    const totalsRes = await db.query(`
      SELECT
        COUNT(*)::int AS calls,
        COALESCE(SUM(input_tokens), 0)::bigint AS input_tokens,
        COALESCE(SUM(output_tokens), 0)::bigint AS output_tokens,
        COALESCE(SUM(cost_usd), 0)::numeric(12,6) AS cost_usd,
        COUNT(*) FILTER (WHERE outcome = 'approved')::int AS approved,
        COUNT(*) FILTER (WHERE outcome = 'rejected')::int AS rejected,
        COUNT(*) FILTER (WHERE outcome = 'error')::int AS errors
      FROM llm_usage
    `);

    const byDayRes = await db.query(`
      SELECT
        TO_CHAR(created_at::date, 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS calls,
        COALESCE(SUM(cost_usd), 0)::numeric(12,6) AS cost_usd
      FROM llm_usage
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY created_at::date
      ORDER BY created_at::date
    `);

    const byModelRes = await db.query(`
      SELECT
        model,
        COUNT(*)::int AS calls,
        COALESCE(SUM(input_tokens), 0)::bigint AS input_tokens,
        COALESCE(SUM(output_tokens), 0)::bigint AS output_tokens,
        COALESCE(SUM(cost_usd), 0)::numeric(12,6) AS cost_usd
      FROM llm_usage
      GROUP BY model
      ORDER BY COUNT(*) DESC
    `);

    const totals = totalsRes.rows[0];
    res.json({
      success: true,
      data: {
        totals: {
          calls: totals.calls,
          input_tokens: Number(totals.input_tokens),
          output_tokens: Number(totals.output_tokens),
          cost_usd: Number(totals.cost_usd),
          approved: totals.approved,
          rejected: totals.rejected,
          errors: totals.errors
        },
        by_day: byDayRes.rows.map((r) => ({
          date: r.date,
          calls: r.calls,
          cost_usd: Number(r.cost_usd)
        })),
        by_model: byModelRes.rows.map((r) => ({
          model: r.model,
          calls: r.calls,
          input_tokens: Number(r.input_tokens),
          output_tokens: Number(r.output_tokens),
          cost_usd: Number(r.cost_usd)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings, getModels, getUsage };
