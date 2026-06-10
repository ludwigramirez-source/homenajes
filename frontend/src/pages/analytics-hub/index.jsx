import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { analyticsService } from '../../services/api';
import Icon from '../../components/AppIcon';
import DateRangeControl, { presetRange } from '../../components/analytics/DateRangeControl';

const fmtShortDate = (s) => { const p = (s || '').split('-'); return p.length === 3 ? `${p[2]}/${p[1]}` : s; };
const TYPE_LABEL = { ejecutiva: 'Ejecutiva', presidencial: 'Presidencial', vip: 'VIP', sin_tipo: 'Sin tipo' };

const AnalyticsHub = () => {
  const [range, setRange] = useState(presetRange(30));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const r = await analyticsService.detailed({ from: range.from, to: range.to });
        if (!cancelled && r.success) setData(r.data);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'Error cargando el análisis');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [range.from, range.to]);

  const funnelSteps = data ? [
    { label: 'Vistas en pantalla', value: data.funnel.display_views, icon: 'Monitor' },
    { label: 'Escaneos de QR', value: data.funnel.qr_scans, icon: 'QrCode' },
    { label: 'Aperturas de formulario', value: data.funnel.form_opens, icon: 'FileText' },
    { label: 'Mensajes enviados', value: data.funnel.submitted, icon: 'Send' }
  ] : [];
  const funnelMax = Math.max(1, ...funnelSteps.map(s => s.value));
  const maxType = data ? Math.max(1, ...data.by_room_type.map(t => t.messages)) : 1;
  const photoTotal = data ? data.photos.with_photo + data.photos.without_photo : 0;
  const consentTotal = data ? data.consent.yes + data.consent.no : 0;

  return (
    <>
      <Helmet><title>Análisis detallado | SERCOFUN</title></Helmet>
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden sticky top-0 z-40"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
          <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Icon name="BarChart3" size={20} color="#ffffff" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Análisis detallado</h1>
                  <p className="text-xs text-white/70 font-body">
                    {data?.scoped_to_location ? 'Tu sede' : 'Todas las sedes'}
                    {data?.range && ` · ${data.range.from} a ${data.range.to}`}
                  </p>
                </div>
              </div>
              <DateRangeControl value={range} onChange={setRange} variant="onDark" />
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-6 py-6 space-y-6">
          {error && <div className="text-destructive text-sm flex items-center gap-2"><Icon name="AlertCircle" size={16} /> {error}</div>}
          {loading && <div className="py-16 text-center text-muted-foreground"><Icon name="Loader" size={28} className="animate-spin mx-auto mb-2" /> Cargando...</div>}

          {!loading && data && (
            <>
              {/* Embudo de interaccion */}
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-lg font-heading font-semibold text-foreground mb-1">Embudo de interacción del público</h3>
                <p className="text-xs text-muted-foreground mb-4">Del display a dejar un mensaje</p>
                <div className="space-y-4">
                  {funnelSteps.map(s => {
                    const pct = data.funnel.display_views > 0
                      ? Math.round((s.value / data.funnel.display_views) * 100)
                      : null;
                    return (
                      <div key={s.label} className="flex items-center gap-3">
                        <div className="w-44 shrink-0 flex items-center gap-2 text-sm text-foreground">
                          <Icon name={s.icon} size={16} className="text-muted-foreground" /> {s.label}
                        </div>
                        <div className="flex-1 h-9 rounded-md bg-muted overflow-hidden">
                          <div className="h-full rounded-md" style={{ width: `${s.value > 0 ? Math.max(2, (s.value / funnelMax) * 100) : 0}%`, background: '#1a7472' }} />
                        </div>
                        <div className="w-24 shrink-0 text-right">
                          <span className="text-lg font-semibold text-foreground">{s.value}</span>
                          {pct !== null && <span className="text-xs text-muted-foreground ml-1">{pct}%</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tendencia */}
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Mensajes por día</h3>
                {data.trend.length === 0 ? <div className="py-10 text-center text-muted-foreground text-sm">No hay mensajes en este período.</div> : (
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <AreaChart data={data.trend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                        <defs>
                          <linearGradient id="tealFill2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1a7472" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#1a7472" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={fmtShortDate} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} width={32} />
                        <Tooltip labelFormatter={(l) => `Fecha: ${l}`} formatter={(v) => [v, 'Mensajes']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                        <Area type="monotone" dataKey="count" stroke="#1a7472" strokeWidth={2} fill="url(#tealFill2)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Por tipo de sala */}
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Mensajes por tipo de sala</h3>
                  {data.by_room_type.length === 0 ? <p className="text-sm text-muted-foreground">Sin datos.</p> : (
                    <div className="space-y-3">
                      {data.by_room_type.map(t => (
                        <div key={t.room_type} className="flex items-center gap-3">
                          <div className="w-28 shrink-0 text-sm text-foreground">{TYPE_LABEL[t.room_type] || t.room_type}</div>
                          <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(t.messages / maxType) * 100}%`, background: '#1a7472' }} />
                          </div>
                          <div className="w-10 text-right text-sm font-medium text-foreground">{t.messages}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fotos + consentimiento */}
                <div className="bg-card border border-border rounded-lg p-5 space-y-5">
                  <div>
                    <h3 className="text-lg font-heading font-semibold text-foreground mb-3">Mensajes con foto</h3>
                    {photoTotal === 0 ? <p className="text-sm text-muted-foreground">Sin mensajes en el período.</p> : (
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-4 rounded-full overflow-hidden flex">
                          <div style={{ width: `${(data.photos.with_photo / photoTotal) * 100}%`, background: '#1a7472' }} />
                          <div style={{ width: `${(data.photos.without_photo / photoTotal) * 100}%`, background: '#cbd5e1' }} />
                        </div>
                      </div>
                    )}
                    {photoTotal > 0 && (
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#1a7472' }} /> Con foto: {data.photos.with_photo}</span>
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#cbd5e1' }} /> Sin foto: {data.photos.without_photo}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-semibold text-foreground mb-3">Consentimiento de marketing</h3>
                    {consentTotal === 0 ? <p className="text-sm text-muted-foreground">Sin mensajes en el período.</p> : (
                      <div className="flex-1 h-4 rounded-full overflow-hidden flex">
                        <div style={{ width: `${(data.consent.yes / consentTotal) * 100}%`, background: '#f0c040' }} />
                        <div style={{ width: `${(data.consent.no / consentTotal) * 100}%`, background: '#cbd5e1' }} />
                      </div>
                    )}
                    {consentTotal > 0 && (
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#f0c040' }} /> Autoriza: {data.consent.yes}</span>
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#cbd5e1' }} /> No: {data.consent.no}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AnalyticsHub;
