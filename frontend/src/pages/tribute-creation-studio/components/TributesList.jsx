import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { memorialsService } from '../../../services/api';
import Icon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';
import { useTableSort, SortTh } from '../../../components/ui/sortable';

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
  // Filtro rapido: 'all' | 'active' | 'inactive'
  const [filter, setFilter] = useState('all');

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
  const filteredTributes = tributes.filter(t => {
    if (filter === 'active') return t.active;
    if (filter === 'inactive') return !t.active;
    return true;
  });
  // Ordenamiento por columna (sobre la lista ya filtrada).
  const { sorted: sortedTributes, sort, toggle } = useTableSort(filteredTributes, SORT_ACCESSORS);
  const activeCount = tributes.filter(t => t.active).length;
  const inactiveCount = tributes.length - activeCount;

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Tributos creados</h3>
          <p className="text-sm text-muted-foreground">
            {tributes.length} {tributes.length === 1 ? 'homenaje registrado' : 'homenajes registrados'}
            {activeCount > 0 && ` · ${activeCount} ${activeCount === 1 ? 'activo' : 'activos'}`}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtro segmentado */}
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            {filterButtons.map((b, i) => (
              <button
                key={b.key}
                onClick={() => setFilter(b.key)}
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

          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors"
          >
            <Icon name="RefreshCw" size={14} />
            Refrescar
          </button>
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
            {sortedTributes.map(t => {
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
    </div>
  );
};

export default TributesList;
