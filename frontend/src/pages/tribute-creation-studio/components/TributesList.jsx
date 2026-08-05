import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { memorialsService } from '../../../services/api';
import { booksService } from '../../../services/booksService';
import Icon from '../../../components/AppIcon';
import MetricCard from '../../../components/analytics/MetricCard';
import { cn } from '../../../utils/cn';
import { useTableSort, SortTh } from '../../../components/ui/sortable';
import { usePagination, Pagination } from '../../../components/ui/pagination';

// Accesores para ordenar (numericos devuelven Number; el resto texto).
const SORT_ACCESSORS = {
  deceased_name: (r) => r.deceased_name,
  location_name: (r) => r.location_name,
  schedule_start: (r) => (r.schedule_start ? new Date(r.schedule_start).getTime() : 0),
  schedule_end: (r) => (r.schedule_end ? new Date(r.schedule_end).getTime() : 0),
  condolence_count: (r) => Number(r.condolence_count) || 0,
  active: (r) => (r.active ? 1 : 0)
};

// Formatea fechas legibles en español: "20 May 2026, 14:00"
const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const TributesList = () => {
  const [tributes, setTributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [bookLoadingId, setBookLoadingId] = useState(null);
  // Filtro rapido: 'all' | 'active' | 'inactive'
  const [filter, setFilter] = useState('all');
  const [range, setRange] = useState({ from: '', to: '' });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Debounce 400ms para la busqueda, igual que Tablon/Books.
  const debounceRef = useRef(null);
  useEffect(() => {
    debounceRef.current = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await memorialsService.getAll();
      setTributes(r?.data || []);
    } catch (e) {
      console.error('Error cargando tributos:', e);
      setError(e.response?.data?.error || 'Error cargando tributos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Filtrado en cliente para tener feedback instantaneo.
  const filteredTributes = useMemo(() => tributes.filter(t => {
    if (filter === 'active' && !t.active) return false;
    if (filter === 'inactive' && t.active) return false;
    if (range.from && (!t.schedule_start || new Date(t.schedule_start) < new Date(range.from + 'T00:00:00'))) return false;
    if (range.to && (!t.schedule_start || new Date(t.schedule_start) > new Date(range.to + 'T23:59:59'))) return false;
    if (search) {
      const haystack = `${t.deceased_name || ''} ${t.deceased_document_id || ''} ${t.location_name || ''} ${t.room_name || ''}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  }), [tributes, filter, range, search]);
  // Ordenamiento por columna (sobre la lista ya filtrada).
  const { sorted: sortedTributes, sort, toggle } = useTableSort(filteredTributes, SORT_ACCESSORS);
  const { page, setPage, totalPages, pageItems } = usePagination(sortedTributes);
  const activeCount = tributes.filter(t => t.active).length;
  const inactiveCount = tributes.length - activeCount;
  const totalMessages = useMemo(
    () => tributes.reduce((sum, t) => sum + (Number(t.condolence_count) || 0), 0),
    [tributes]
  );

  const applyPreset = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    const fmt = (d) => d.toISOString().slice(0, 10);
    setRange({ from: fmt(from), to: fmt(to) });
    setPage(1);
  };
  const clearRange = () => { setRange({ from: '', to: '' }); setPage(1); };

  const copyUrl = async (url, id) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      // Fallback: prompt para que copien manualmente
      window.prompt('Copia la URL:', url);
    }
  };

  const viewBook = async (t) => {
    try {
      setBookLoadingId(t.id);
      const safeName = (t.deceased_name || 'homenaje').trim().replace(/[^a-zA-Z0-9]+/g, '_');
      await booksService.preview(t.id, `libro_condolencias_${safeName}.pdf`);
    } catch (e) {
      alert('Error generando el book: ' + (e.message || 'Error desconocido'));
    } finally {
      setBookLoadingId(null);
    }
  };

  const toggleActive = async (t) => {
    try {
      await memorialsService.update(t.id, { active: !t.active });
      await load();
    } catch (e) {
      alert('Error actualizando estado: ' + (e.response?.data?.error || e.message));
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Icon name="Loader" size={32} className="animate-spin mx-auto mb-3" />
        Cargando tributos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-destructive">
        <Icon name="AlertCircle" size={32} className="mx-auto mb-3" />
        {error}
      </div>
    );
  }

  if (tributes.length === 0) {
    return (
      <div className="py-16 text-center">
        <Icon name="Inbox" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Aún no hay tributos creados</h3>
        <p className="text-sm text-muted-foreground">
          Crea tu primer tributo desde el tab "Información del Difunto".
        </p>
      </div>
    );
  }

  const filterButtons = [
    { key: 'all', label: 'Todos', count: tributes.length },
    { key: 'active', label: 'Activos', count: activeCount },
    { key: 'inactive', label: 'Inactivos', count: inactiveCount }
  ];
  const hasFilters = filter !== 'all' || range.from || range.to || search;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Tributos creados</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTributes.length} {filteredTributes.length === 1 ? 'homenaje' : 'homenajes'}
            {hasFilters ? ' con los filtros aplicados' : ' registrados'}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors"
        >
          <Icon name="RefreshCw" size={14} />
          Refrescar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total homenajes" value={tributes.length} icon="BookOpen" hint="Registrados en el sistema" />
        <MetricCard label="Activos" value={activeCount} icon="CheckCircle2" accent="#16a34a" />
        <MetricCard label="Inactivos" value={inactiveCount} icon="PowerOff" accent="#6b7280" />
        <MetricCard label="Mensajes recibidos" value={totalMessages} icon="MessageCircle" accent="#337d7c" />
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-lg border border-border shadow-elevation-md p-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
          <Icon name="Filter" size={16} className="text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">Filtros</h4>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Estado</p>
            <div className="flex items-center rounded-md border border-border overflow-hidden">
              {filterButtons.map((b, i) => (
                <button
                  key={b.key}
                  onClick={() => { setFilter(b.key); setPage(1); }}
                  className={cn(
                    "px-3 py-2 text-sm transition-colors flex items-center gap-1.5",
                    filter === b.key
                      ? "bg-primary text-white"
                      : "bg-transparent text-foreground hover:bg-muted",
                    i > 0 && "border-l border-border"
                  )}
                >
                  {b.label}
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    filter === b.key ? "bg-white/20" : "bg-muted"
                  )}>
                    {b.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Ingreso</p>
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={range.from} max={range.to || undefined}
                onChange={(e) => { setRange(r => ({ ...r, from: e.target.value })); setPage(1); }}
                className="px-2 py-2 rounded-md border border-border bg-background text-sm" />
              <span className="text-muted-foreground">—</span>
              <input type="date" value={range.to} min={range.from || undefined}
                onChange={(e) => { setRange(r => ({ ...r, to: e.target.value })); setPage(1); }}
                className="px-2 py-2 rounded-md border border-border bg-background text-sm" />
              <div className="flex items-center rounded-md overflow-hidden border border-border">
                <button onClick={() => applyPreset(7)}
                  className="px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">7 días</button>
                <button onClick={() => applyPreset(30)}
                  className="px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors border-l border-border">30 días</button>
              </div>
              {(range.from || range.to) && (
                <button onClick={clearRange} title="Quitar filtro de fechas"
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-[220px]">
            <p className="text-sm font-semibold text-foreground mb-2">Búsqueda</p>
            <div className="relative">
              <Icon name="Search" size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
                placeholder="Difunto, documento, sede o sala..."
                className="w-full pl-9 pr-8 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} title="Limpiar"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <SortTh label="Difunto" sortKey="deceased_name" sort={sort} onSort={toggle} />
              <SortTh label="Sede / Sala" sortKey="location_name" sort={sort} onSort={toggle} />
              <SortTh label="Ingreso" sortKey="schedule_start" sort={sort} onSort={toggle} />
              <SortTh label="Salida" sortKey="schedule_end" sort={sort} onSort={toggle} />
              <SortTh label="Mensajes" sortKey="condolence_count" sort={sort} onSort={toggle} />
              <SortTh label="Estado" sortKey="active" sort={sort} onSort={toggle} />
              <th className="text-right font-medium px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedTributes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No hay homenajes que coincidan con el filtro seleccionado.
                </td>
              </tr>
            ) : null}
            {pageItems.map(t => {
              // Usamos el codigo de sala (amigable) en la URL en vez del UUID.
              const roomRef = t.room_code || t.room_id;
              const displayUrl = `${window.location.origin}/digital-display-screen/${roomRef}`;
              const formUrl = `${window.location.origin}/memorial-form/${roomRef}`;
              return (
                <tr key={t.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      to={`/memorials/${t.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {t.deceased_name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {t.birth_year} — {t.death_year}
                    </div>
                    {t.deceased_document_id && (
                      <div className="text-xs text-muted-foreground">Doc: {t.deceased_document_id}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{t.location_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.room_name} ({t.room_code})
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{formatDate(t.schedule_start)}</td>
                  <td className="px-4 py-3 text-foreground">{formatDate(t.schedule_end)}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/memorials/${t.id}?tab=messages`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
                      title="Ver mensajes"
                    >
                      <Icon name="MessageCircle" size={12} />
                      {t.condolence_count || 0}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                      t.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        t.active ? "bg-green-500" : "bg-gray-400"
                      )} />
                      {t.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/memorials/${t.id}`}
                        className="p-2 rounded-md hover:bg-muted transition-colors text-foreground"
                        title="Ver detalle del homenaje"
                      >
                        <Icon name="Eye" size={16} />
                      </Link>
                      <Link
                        to={`/tribute-creation-studio/${t.id}`}
                        className="p-2 rounded-md hover:bg-muted transition-colors text-primary"
                        title="Editar homenaje"
                      >
                        <Icon name="Edit3" size={16} />
                      </Link>
                      <a
                        href={displayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-md hover:bg-muted transition-colors"
                        title="Abrir pantalla del display"
                      >
                        <Icon name="Monitor" size={16} />
                      </a>
                      <a
                        href={formUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-md hover:bg-muted transition-colors"
                        title="Abrir formulario público"
                      >
                        <Icon name="ExternalLink" size={16} />
                      </a>
                      <button
                        onClick={() => viewBook(t)}
                        disabled={bookLoadingId === t.id}
                        className="p-2 rounded-md hover:bg-muted transition-colors text-foreground disabled:opacity-50"
                        title="Ver book (PDF) de este homenaje"
                      >
                        <Icon name={bookLoadingId === t.id ? 'Loader' : 'BookOpen'} size={16}
                          className={bookLoadingId === t.id ? 'animate-spin' : ''} />
                      </button>
                      <button
                        onClick={() => copyUrl(displayUrl, t.id)}
                        className={cn(
                          "p-2 rounded-md hover:bg-muted transition-colors",
                          copiedId === t.id ? "text-green-600" : ""
                        )}
                        title="Copiar URL del display"
                      >
                        <Icon name={copiedId === t.id ? 'Check' : 'Copy'} size={16} />
                      </button>
                      <button
                        onClick={() => toggleActive(t)}
                        className="p-2 rounded-md hover:bg-muted transition-colors"
                        title={t.active ? 'Desactivar' : 'Activar'}
                      >
                        <Icon name={t.active ? 'PowerOff' : 'Power'} size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
};

export default TributesList;
