import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { analyticsService } from '../../services/api';
import Icon from '../../components/AppIcon';
import MetricCard from '../../components/analytics/MetricCard';
import { useTableSort, SortTh } from '../../components/ui/sortable';

const SORT = {
  name: (r) => r.name,
  city: (r) => r.city,
  total_rooms: (r) => Number(r.total_rooms) || 0,
  occupancy: (r) => (Number(r.total_rooms) ? (Number(r.occupied_rooms) / Number(r.total_rooms)) : 0),
  total_memorials: (r) => Number(r.total_memorials) || 0,
  active_memorials: (r) => Number(r.active_memorials) || 0,
  total_condolences: (r) => Number(r.total_condolences) || 0
};

const LocationPerformance = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await analyticsService.byLocation();
        if (!cancelled && r.success) setRows(r.data || []);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'Error cargando rendimiento');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const { sorted, sort, toggle } = useTableSort(rows, SORT);

  const totals = useMemo(() => {
    const t = { rooms: 0, occupied: 0, memorials: 0, condolences: 0 };
    rows.forEach(r => {
      t.rooms += Number(r.total_rooms) || 0;
      t.occupied += Number(r.occupied_rooms) || 0;
      t.memorials += Number(r.total_memorials) || 0;
      t.condolences += Number(r.total_condolences) || 0;
    });
    return t;
  }, [rows]);

  const maxCond = Math.max(1, ...rows.map(r => Number(r.total_condolences) || 0));
  const occPct = (r) => Number(r.total_rooms) ? Math.round((Number(r.occupied_rooms) / Number(r.total_rooms)) * 100) : 0;

  return (
    <>
      <Helmet><title>Rendimiento por sede | SERCOFUN</title></Helmet>
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden sticky top-0 z-40"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
          <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Icon name="MapPin" size={20} color="#ffffff" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Rendimiento por sede</h1>
                <p className="text-xs text-white/70 font-body">Comparativo de ocupación, homenajes y mensajes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-6 py-6 space-y-6">
          {error && <div className="text-destructive text-sm flex items-center gap-2"><Icon name="AlertCircle" size={16} /> {error}</div>}
          {loading && <div className="py-16 text-center text-muted-foreground"><Icon name="Loader" size={28} className="animate-spin mx-auto mb-2" /> Cargando...</div>}

          {!loading && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Sedes" value={rows.length} icon="Building2" />
                <MetricCard label="Salas" value={totals.rooms} icon="LayoutGrid" hint={`${totals.occupied} ocupadas`} />
                <MetricCard label="Homenajes" value={totals.memorials} icon="BookOpen" />
                <MetricCard label="Mensajes" value={totals.condolences} icon="MessageCircle" />
              </div>

              {/* Mensajes por sede */}
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Mensajes por sede</h3>
                {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sin datos.</p> : (
                  <div className="space-y-3">
                    {[...rows].sort((a, b) => (Number(b.total_condolences) || 0) - (Number(a.total_condolences) || 0)).map(r => (
                      <div key={r.id} className="flex items-center gap-3">
                        <div className="w-40 shrink-0 text-sm text-foreground truncate" title={r.name}>{r.name}</div>
                        <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${((Number(r.total_condolences) || 0) / maxCond) * 100}%`, background: '#1a7472' }} />
                        </div>
                        <div className="w-10 text-right text-sm font-medium text-foreground">{r.total_condolences}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabla detallada */}
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Detalle por sede</h3>
                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-muted-foreground">
                      <tr>
                        <SortTh label="Sede" sortKey="name" sort={sort} onSort={toggle} />
                        <SortTh label="Ciudad" sortKey="city" sort={sort} onSort={toggle} />
                        <SortTh label="Salas" sortKey="total_rooms" sort={sort} onSort={toggle} />
                        <SortTh label="Ocupación" sortKey="occupancy" sort={sort} onSort={toggle} />
                        <SortTh label="Homenajes" sortKey="total_memorials" sort={sort} onSort={toggle} />
                        <SortTh label="Activos" sortKey="active_memorials" sort={sort} onSort={toggle} />
                        <SortTh label="Mensajes" sortKey="total_condolences" sort={sort} onSort={toggle} />
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Sin datos.</td></tr>}
                      {sorted.map(r => (
                        <tr key={r.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.city}</td>
                          <td className="px-4 py-3 text-foreground">{r.total_rooms}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${occPct(r)}%`, background: occPct(r) >= 80 ? '#d97706' : '#1a7472' }} />
                              </div>
                              <span className="text-xs text-foreground w-16">{r.occupied_rooms}/{r.total_rooms} ({occPct(r)}%)</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-foreground">{r.total_memorials}</td>
                          <td className="px-4 py-3 text-foreground">{r.active_memorials}</td>
                          <td className="px-4 py-3 text-foreground">{r.total_condolences}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default LocationPerformance;
