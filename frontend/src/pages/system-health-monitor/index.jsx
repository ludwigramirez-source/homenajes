import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { analyticsService } from '../../services/api';
import Icon from '../../components/AppIcon';
import MetricCard from '../../components/analytics/MetricCard';

const REFRESH_MS = 30 * 1000;
const ROLE_LABEL = { admin: 'Superadministrador', operator: 'Operador de sede', auditor: 'Auditor', supervisor: 'Supervisor' };

const fmtUptime = (s) => {
  if (!s && s !== 0) return '—';
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};
const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const SystemHealthMonitor = () => {
  const [data, setData] = useState(null);
  const [healthy, setHealthy] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await analyticsService.health();
        if (!cancelled) { setData(r.data); setHealthy(r.success && r.data?.status === 'healthy'); }
      } catch (e) {
        if (!cancelled) { setHealthy(false); setData(e.response?.data?.data || null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const s = data?.statistics || {};
  const stats = [
    { label: 'Sedes', value: s.locations, icon: 'Building2' },
    { label: 'Salas', value: s.rooms, icon: 'LayoutGrid' },
    { label: 'Homenajes', value: s.memorials, icon: 'BookOpen' },
    { label: 'Mensajes', value: s.condolences, icon: 'MessageCircle' },
    { label: 'Vistas registradas', value: s.memorial_views, icon: 'Eye' },
    { label: 'Usuarios activos', value: s.users, icon: 'Users' }
  ];

  return (
    <>
      <Helmet><title>Monitoreo técnico | SERCOFUN</title></Helmet>
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden sticky top-0 z-40"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
          <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Icon name="Server" size={20} color="#ffffff" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Monitoreo técnico</h1>
                <p className="text-xs text-white/70 font-body">Estado del sistema en tiempo real</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-6 py-6 space-y-6">
          {loading && !data && <div className="py-16 text-center text-muted-foreground"><Icon name="Loader" size={28} className="animate-spin mx-auto mb-2" /> Cargando...</div>}

          {data && (
            <>
              {/* Estado general */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: healthy ? 'rgba(34,197,94,0.12)' : 'rgba(220,38,38,0.12)' }}>
                    <Icon name={healthy ? 'CheckCircle' : 'AlertTriangle'} size={22} color={healthy ? '#16a34a' : '#dc2626'} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Sistema</p>
                    <p className="text-lg font-heading font-semibold text-foreground">{healthy ? 'Operativo' : 'Con fallas'}</p>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(26,116,114,0.10)' }}>
                    <Icon name="Database" size={22} color="#1a7472" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Base de datos</p>
                    <p className="text-lg font-heading font-semibold text-foreground">{data.database === 'connected' ? 'Conectada' : 'Desconectada'}</p>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(26,116,114,0.10)' }}>
                    <Icon name="Clock" size={22} color="#1a7472" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Tiempo activo</p>
                    <p className="text-lg font-heading font-semibold text-foreground">{fmtUptime(data.uptime_seconds)}</p>
                  </div>
                </div>
              </div>

              {/* Conteos */}
              <div>
                <h3 className="text-lg font-heading font-semibold text-foreground mb-3">Registros en base de datos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {stats.map(st => <MetricCard key={st.label} label={st.label} value={st.value ?? '—'} icon={st.icon} />)}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Usuarios por rol */}
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Usuarios por rol</h3>
                  {(!data.users_by_role || data.users_by_role.length === 0) ? <p className="text-sm text-muted-foreground">Sin datos.</p> : (
                    <div className="divide-y divide-border">
                      {data.users_by_role.map(u => (
                        <div key={u.role} className="py-2.5 flex items-center justify-between">
                          <span className="text-sm text-foreground">{ROLE_LABEL[u.role] || u.role}</span>
                          <span className="text-sm font-medium text-foreground">{u.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ultima actividad */}
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Última actividad</h3>
                  <div className="divide-y divide-border">
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Último homenaje creado</span>
                      <span className="text-sm text-foreground">{fmtDateTime(data.last_activity?.last_memorial)}</span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Último mensaje recibido</span>
                      <span className="text-sm text-foreground">{fmtDateTime(data.last_activity?.last_condolence)}</span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Último inicio de sesión</span>
                      <span className="text-sm text-foreground">{fmtDateTime(data.last_activity?.last_login)}</span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Hora del servidor</span>
                      <span className="text-sm text-foreground">{fmtDateTime(data.server_time)}</span>
                    </div>
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

export default SystemHealthMonitor;
