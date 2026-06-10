import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { analyticsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/AppIcon';
import MetricCard from '../../components/analytics/MetricCard';
import DateRangeControl, { presetRange } from '../../components/analytics/DateRangeControl';

const fmtShortDate = (s) => {
  if (!s) return '';
  const parts = s.split('-');
  return `${parts[2]}/${parts[1]}`;
};

const ExecutiveOverview = () => {
  const { user } = useAuth();
  const [range, setRange] = useState(presetRange(30));
  const [data, setData] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [exec, byLoc] = await Promise.all([
          analyticsService.executive({ from: range.from, to: range.to }),
          analyticsService.byLocation()
        ]);
        if (cancelled) return;
        if (exec.success) setData(exec.data);
        if (byLoc.success) setLocations(byLoc.data || []);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'Error cargando el resumen');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [range.from, range.to]);

  const topSedes = useMemo(() => {
    const arr = [...locations]
      .map(l => ({ name: l.name, city: l.city, count: parseInt(l.total_condolences) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    const max = Math.max(1, ...arr.map(a => a.count));
    return { arr, max };
  }, [locations]);

  const kpis = data ? [
    { label: 'Homenajes (período)', value: data.total_memorials, icon: 'BookOpen' },
    { label: 'Activos ahora', value: data.active_memorials, icon: 'Activity' },
    { label: 'Mensajes (período)', value: data.total_condolences, icon: 'MessageCircle' },
    { label: 'Prom. mensajes / homenaje', value: data.avg_condolences_per_memorial, icon: 'TrendingUp' },
    { label: 'Contactos marketing', value: data.marketing_contacts, icon: 'Mail' },
    { label: data.scoped_to_location ? 'Salas de tu sede' : 'Salas activas', value: data.total_rooms, icon: 'LayoutGrid' }
  ] : [];

  return (
    <>
      <Helmet><title>Resumen ejecutivo | SERCOFUN</title></Helmet>
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden sticky top-0 z-40"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
          <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Icon name="LayoutDashboard" size={20} color="#ffffff" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Resumen ejecutivo</h1>
                  <p className="text-xs text-white/70 font-body">
                    {data?.scoped_to_location ? 'Indicadores de tu sede' : 'Indicadores generales'}
                    {data?.range && ` · ${data.range.from} a ${data.range.to}`}
                  </p>
                </div>
              </div>
              <DateRangeControl value={range} onChange={setRange} variant="onDark" />
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-6 py-6 space-y-6">
          {error && (
            <div className="text-destructive text-sm flex items-center gap-2"><Icon name="AlertCircle" size={16} /> {error}</div>
          )}
          {loading && (
            <div className="py-16 text-center text-muted-foreground">
              <Icon name="Loader" size={28} className="animate-spin mx-auto mb-2" /> Cargando indicadores...
            </div>
          )}

          {!loading && data && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {kpis.map(k => <MetricCard key={k.label} {...k} />)}
              </div>

              <div className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-heading font-semibold text-foreground">Mensajes recibidos</h3>
                  <span className="text-xs text-muted-foreground">{data.range.from} — {data.range.to}</span>
                </div>
                {data.condolences_trend.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm">No hay mensajes en este período.</div>
                ) : (
                  <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                      <AreaChart data={data.condolences_trend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                        <defs>
                          <linearGradient id="tealFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1a7472" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#1a7472" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={fmtShortDate} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} width={32} />
                        <Tooltip labelFormatter={(l) => `Fecha: ${l}`} formatter={(v) => [v, 'Mensajes']}
                          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                        <Area type="monotone" dataKey="count" stroke="#1a7472" strokeWidth={2} fill="url(#tealFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {!data.scoped_to_location && (
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Sedes con más mensajes</h3>
                  {topSedes.arr.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin datos.</p>
                  ) : (
                    <div className="space-y-3">
                      {topSedes.arr.map(s => (
                        <div key={s.name} className="flex items-center gap-3">
                          <div className="w-40 shrink-0 text-sm text-foreground truncate" title={`${s.name} (${s.city})`}>{s.name}</div>
                          <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(s.count / topSedes.max) * 100}%`, background: '#1a7472' }} />
                          </div>
                          <div className="w-10 text-right text-sm font-medium text-foreground">{s.count}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ExecutiveOverview;
