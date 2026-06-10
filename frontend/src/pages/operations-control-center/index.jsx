import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { analyticsService } from '../../services/api';
import Icon from '../../components/AppIcon';
import MetricCard from '../../components/analytics/MetricCard';

const REFRESH_MS = 30 * 1000;

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};
const fmtRelative = (iso) => {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'hace instantes';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
};

const OperationsControlCenter = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await analyticsService.operations();
        if (!cancelled && r.success) { setData(r.data); setError(null); }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'Error cargando operaciones');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const active = data?.active_memorials || [];
  const upcoming = data?.upcoming_memorials || [];
  const recent = data?.recent_condolences || [];

  return (
    <>
      <Helmet><title>Centro de operaciones | SERCOFUN</title></Helmet>
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden sticky top-0 z-40"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
          <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Icon name="Activity" size={20} color="#ffffff" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Centro de operaciones</h1>
                  <p className="text-xs text-white/70 font-body">
                    {data?.scoped_to_location ? 'Tu sede' : 'Todas las sedes'} · en tiempo real
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 text-xs text-white/80">
                <span className="w-2 h-2 rounded-full" style={{ background: '#4ade80' }} />
                Actualiza cada 30s
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-6 py-6 space-y-6">
          {error && <div className="text-destructive text-sm flex items-center gap-2"><Icon name="AlertCircle" size={16} /> {error}</div>}
          {loading && !data && (
            <div className="py-16 text-center text-muted-foreground"><Icon name="Loader" size={28} className="animate-spin mx-auto mb-2" /> Cargando...</div>
          )}

          {data && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard label="Homenajes activos ahora" value={active.length} icon="Monitor" />
                <MetricCard label="Próximos 3 días" value={upcoming.length} icon="Calendar" />
                <MetricCard label="Mensajes recientes" value={recent.length} icon="MessageCircle" hint="últimos 20" />
              </div>

              {/* Homenajes activos */}
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Homenajes activos</h3>
                {active.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No hay homenajes activos en este momento.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {active.map(m => (
                      <div key={m.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-heading font-semibold text-foreground truncate">{m.deceased_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{m.location_name} · {m.room_name}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Activo
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="inline-flex items-center gap-1 text-foreground"><Icon name="MessageCircle" size={14} className="text-muted-foreground" /> {m.condolence_count}</span>
                          <span className="inline-flex items-center gap-1 text-foreground"><Icon name="Eye" size={14} className="text-muted-foreground" /> {m.display_views}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Hasta {fmtDateTime(m.schedule_end)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Proximos */}
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Próximos servicios (3 días)</h3>
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No hay servicios programados próximamente.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {upcoming.map(m => (
                        <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{m.deceased_name}</p>
                            <p className="text-xs text-muted-foreground">{m.location_name} · {m.room_name}</p>
                          </div>
                          <span className="text-sm text-foreground flex-shrink-0">{fmtDateTime(m.schedule_start)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mensajes recientes */}
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Últimos mensajes</h3>
                  {recent.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">Aún no hay mensajes.</p>
                  ) : (
                    <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
                      {recent.map(c => (
                        <div key={c.id} className="py-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-foreground text-sm truncate">{c.sender_name}</p>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{fmtRelative(c.created_at)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.message}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">para {c.deceased_name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default OperationsControlCenter;
