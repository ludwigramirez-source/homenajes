import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { llmService } from '../../services/api';
import Icon from '../../components/AppIcon';
import MetricCard from '../../components/analytics/MetricCard';
import Select from '../../components/ui/Select';
import { cn } from '../../utils/cn';

const PROVIDER_OPTIONS = [
  { value: 'anthropic', label: 'Anthropic (Claude)' }
];

const fmtInt = (n) => Number(n || 0).toLocaleString('es-CO');
const fmtUsd = (n) => `$${Number(n || 0).toFixed(4)}`;
const fmtDay = (iso) => {
  if (!iso) return '—';
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

const LlmSettingsPage = () => {
  // Configuracion
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState(null);

  const [provider, setProvider] = useState('anthropic');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [model, setModel] = useState('');
  const [enabled, setEnabled] = useState(false);

  // Modelos disponibles
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState(null);

  // Guardado
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);

  // Uso / gasto
  const [usage, setUsage] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [usageError, setUsageError] = useState(null);

  const loadSettings = async () => {
    try {
      setLoadingSettings(true);
      setSettingsError(null);
      const res = await llmService.getSettings();
      const data = res?.data || {};
      setSettings(data);
      setProvider(data.provider || 'anthropic');
      setModel(data.model || '');
      setEnabled(!!data.enabled);
    } catch (e) {
      setSettingsError(e.response?.data?.error || 'Error cargando la configuración');
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadUsage = async () => {
    try {
      setLoadingUsage(true);
      setUsageError(null);
      const res = await llmService.getUsage();
      setUsage(res?.data || null);
    } catch (e) {
      setUsageError(e.response?.data?.error || 'Error cargando el gasto acumulado');
    } finally {
      setLoadingUsage(false);
    }
  };

  useEffect(() => { loadSettings(); loadUsage(); }, []);

  const loadModels = async () => {
    try {
      setLoadingModels(true);
      setModelsError(null);
      // Si el usuario escribio una key nueva, validamos esa; si no, el backend usa la guardada.
      const res = await llmService.getModels(apiKeyInput.trim() || undefined);
      const list = [...(res?.data || [])].sort((a, b) =>
        new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setModels(list);
      if (list.length === 0) setModelsError('No se encontraron modelos disponibles.');
    } catch (e) {
      const status = e.response?.status;
      setModels([]);
      setModelsError(
        status === 401 || status === 400
          ? (e.response?.data?.error || 'La API key no es válida. Verifica e intenta de nuevo.')
          : (e.response?.data?.error || 'Error consultando los modelos disponibles.')
      );
    } finally {
      setLoadingModels(false);
    }
  };

  const modelOptions = useMemo(() => {
    const opts = models.map(m => ({
      value: m.id,
      label: m.display_name ? `${m.display_name} (${m.id})` : m.id
    }));
    // Conserva el modelo guardado aunque aun no se haya consultado la lista.
    if (model && !opts.some(o => o.value === model)) {
      opts.unshift({ value: model, label: model });
    }
    return opts;
  }, [models, model]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const payload = { provider, model: model || null, enabled };
      if (apiKeyInput.trim()) payload.api_key = apiKeyInput.trim();
      const res = await llmService.saveSettings(payload);
      if (res?.data) {
        setSettings(res.data);
        setProvider(res.data.provider || 'anthropic');
        setModel(res.data.model || '');
        setEnabled(!!res.data.enabled);
      }
      setApiKeyInput('');
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setSaveError(e.response?.data?.error || 'Error guardando la configuración');
    } finally {
      setSaving(false);
    }
  };

  const totals = usage?.totals || {};
  const byModel = usage?.by_model || [];
  const byDay = (usage?.by_day || []).slice(-30);
  const maxDayCost = Math.max(...byDay.map(d => Number(d.cost_usd) || 0), 0);

  return (
    <>
      <Helmet><title>Moderación con IA | SERCOFUN</title></Helmet>
      <div className="min-h-screen bg-background">
        {/* Header teal */}
        <div className="relative overflow-hidden sticky top-0 z-40"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
          <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Icon name="Sparkles" size={20} color="#ffffff" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Moderación con IA</h1>
                <p className="text-xs text-white/70 font-body">Proveedor, modelo y gasto acumulado</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-6 py-6 space-y-6">
          {/* Card 1: Configuracion */}
          <div className="bg-card rounded-lg border border-border shadow-elevation-md p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Configuración</h3>
              <p className="text-sm text-muted-foreground">
                Los mensajes de condolencia se evalúan automáticamente antes de mostrarse en la pantalla de la sala.
              </p>
            </div>

            {settingsError && (
              <div className="text-destructive text-sm flex items-center gap-2">
                <Icon name="AlertCircle" size={16} /> {settingsError}
              </div>
            )}

            {loadingSettings ? (
              <div className="py-8 text-center text-muted-foreground">
                <Icon name="Loader" size={24} className="animate-spin mx-auto mb-2" /> Cargando configuración...
              </div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                <Select
                  label="Proveedor"
                  options={PROVIDER_OPTIONS}
                  value={provider}
                  onChange={(v) => setProvider(v || 'anthropic')}
                />

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">API Key</label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={settings?.has_key ? (settings.api_key_masked || '••••••••') : 'sk-ant-...'}
                    autoComplete="new-password"
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {settings?.has_key && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Ya hay una API key guardada. Deja en blanco para conservar la actual.
                    </p>
                  )}
                </div>

                <div className="flex items-end gap-3 flex-wrap">
                  <div className="flex-1 min-w-[260px]">
                    <Select
                      label="Modelo"
                      options={modelOptions}
                      value={model}
                      onChange={(v) => setModel(v || '')}
                      placeholder={modelOptions.length ? 'Selecciona un modelo' : 'Carga los modelos disponibles'}
                      searchable={modelOptions.length > 6}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={loadModels}
                    disabled={loadingModels}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors text-foreground disabled:opacity-60"
                  >
                    <Icon name={loadingModels ? 'Loader' : 'Download'} size={15}
                      className={loadingModels ? 'animate-spin' : ''} />
                    {loadingModels ? 'Consultando...' : 'Cargar modelos disponibles'}
                  </button>
                </div>
                {modelsError && (
                  <p className="text-destructive text-sm flex items-center gap-2">
                    <Icon name="AlertCircle" size={15} /> {modelsError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Icon name="Lightbulb" size={13} className="mt-0.5 flex-shrink-0" />
                  Para moderación de mensajes recomendamos un modelo Haiku: es el más económico y suficiente para esta tarea.
                </p>

                {/* Toggle habilitado */}
                <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    onClick={() => setEnabled(v => !v)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0',
                      enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                  >
                    <span className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </button>
                  <span className="text-sm font-medium text-foreground">Moderación automática activada</span>
                </label>

                {/* Nota informativa */}
                <div className="flex items-start gap-2.5 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  <Icon name="Info" size={16} className="mt-0.5 flex-shrink-0" />
                  <p>
                    Si la moderación está apagada o falla, los mensajes se publican y quedan marcados
                    como <strong>Sin moderar</strong> para revisión manual en el Tablón de mensajes.
                  </p>
                </div>

                {saveError && (
                  <p className="text-destructive text-sm flex items-center gap-2">
                    <Icon name="AlertCircle" size={15} /> {saveError}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white transition-colors disabled:opacity-60"
                    style={{ background: '#1a7472' }}
                  >
                    <Icon name={saving ? 'Loader' : 'Save'} size={15} className={saving ? 'animate-spin' : ''} color="#ffffff" />
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  {saved && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                      <Icon name="CheckCircle2" size={16} /> Configuración guardada
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Gasto acumulado */}
          <div className="bg-card rounded-lg border border-border shadow-elevation-md p-6 space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Gasto acumulado</h3>
                <p className="text-sm text-muted-foreground">Consumo y costo de las evaluaciones automáticas.</p>
              </div>
              <button
                type="button"
                onClick={loadUsage}
                disabled={loadingUsage}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors text-foreground disabled:opacity-60"
              >
                <Icon name="RefreshCw" size={14} className={loadingUsage ? 'animate-spin' : ''} />
                Refrescar
              </button>
            </div>

            {usageError && (
              <div className="text-destructive text-sm flex items-center gap-2">
                <Icon name="AlertCircle" size={16} /> {usageError}
              </div>
            )}

            {loadingUsage && (
              <div className="py-8 text-center text-muted-foreground">
                <Icon name="Loader" size={24} className="animate-spin mx-auto mb-2" /> Cargando datos de uso...
              </div>
            )}

            {!loadingUsage && !usageError && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <MetricCard label="Costo total" value={fmtUsd(totals.cost_usd)} icon="DollarSign" hint="USD" />
                  <MetricCard label="Evaluaciones" value={fmtInt(totals.calls)} icon="Sparkles" />
                  <MetricCard label="Tokens entrada" value={fmtInt(totals.input_tokens)} icon="ArrowDownToLine" />
                  <MetricCard label="Tokens salida" value={fmtInt(totals.output_tokens)} icon="ArrowUpFromLine" />
                  <MetricCard label="Aprobados" value={fmtInt(totals.approved)} icon="CheckCircle2" accent="#16a34a" />
                  <MetricCard label="Rechazados" value={fmtInt(totals.rejected)} icon="XCircle" accent="#e11d48"
                    hint={Number(totals.errors) > 0 ? `${fmtInt(totals.errors)} errores` : undefined} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tabla por modelo */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Por modelo</h4>
                    {byModel.length === 0 ? (
                      <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-6 text-center">
                        Aún no hay evaluaciones registradas.
                      </p>
                    ) : (
                      <div className="overflow-x-auto border border-border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40 text-muted-foreground">
                            <tr>
                              <th className="text-left font-medium px-4 py-2.5">Modelo</th>
                              <th className="text-right font-medium px-4 py-2.5">Llamadas</th>
                              <th className="text-right font-medium px-4 py-2.5">Tokens in</th>
                              <th className="text-right font-medium px-4 py-2.5">Tokens out</th>
                              <th className="text-right font-medium px-4 py-2.5">Costo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {byModel.map(m => (
                              <tr key={m.model} className="border-t border-border hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-2.5 font-mono text-xs text-foreground">{m.model}</td>
                                <td className="px-4 py-2.5 text-right text-foreground">{fmtInt(m.calls)}</td>
                                <td className="px-4 py-2.5 text-right text-foreground">{fmtInt(m.input_tokens)}</td>
                                <td className="px-4 py-2.5 text-right text-foreground">{fmtInt(m.output_tokens)}</td>
                                <td className="px-4 py-2.5 text-right text-foreground">{fmtUsd(m.cost_usd)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Barras por dia */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Por día (últimos 30)</h4>
                    {byDay.length === 0 ? (
                      <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-6 text-center">
                        Sin actividad en los últimos días.
                      </p>
                    ) : (
                      <div className="border border-border rounded-lg p-4 space-y-1.5 max-h-96 overflow-y-auto">
                        {byDay.map(d => {
                          const cost = Number(d.cost_usd) || 0;
                          const pct = maxDayCost > 0 ? Math.max((cost / maxDayCost) * 100, 2) : 2;
                          return (
                            <div key={d.date} className="flex items-center gap-3 text-xs">
                              <span className="w-14 flex-shrink-0 text-muted-foreground">{fmtDay(d.date)}</span>
                              <div className="flex-1 h-4 rounded bg-muted/40 overflow-hidden">
                                <div className="h-full rounded" style={{ width: `${pct}%`, background: '#1a7472' }} />
                              </div>
                              <span className="w-20 flex-shrink-0 text-right text-foreground">{fmtUsd(cost)}</span>
                              <span className="w-16 flex-shrink-0 text-right text-muted-foreground">
                                {fmtInt(d.calls)} {Number(d.calls) === 1 ? 'llamada' : 'llamadas'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LlmSettingsPage;
