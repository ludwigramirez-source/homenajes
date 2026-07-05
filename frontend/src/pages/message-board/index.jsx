import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { condolencesService, getFileUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/AppIcon';
import MetricCard from '../../components/analytics/MetricCard';
import { cn } from '../../utils/cn';

const PAGE_SIZE = 30;

const formatDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// Devuelve {from, to} YYYY-MM-DD de los ultimos N dias.
const lastDays = (n) => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - n);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
};

// Configuracion visual por estado de moderacion.
const STATUS_META = {
  approved: { label: 'Publicado', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500', icon: 'CheckCircle2' },
  rejected: { label: 'Rechazado', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', icon: 'XCircle' },
  unmoderated: { label: 'Sin moderar', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: 'Clock' }
};

const statusOf = (c) => {
  if (c.moderation_status === 'approved') return 'approved';
  if (c.moderation_status === 'rejected') return 'rejected';
  return 'unmoderated';
};

const MessageBoardPage = () => {
  const { user } = useAuth();
  const role = user?.role;
  const canModerate = role !== 'auditor';
  const canDelete = role === 'admin' || role === 'supervisor';

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('');
  const [range, setRange] = useState({ from: '', to: '' });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Paginacion en cliente
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Accion en curso (aprobar/rechazar/eliminar) por id
  const [actingId, setActingId] = useState(null);

  // Debounce 400ms para la busqueda
  const debounceRef = useRef(null);
  useEffect(() => {
    debounceRef.current = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (range.from) params.from = range.from;
      if (range.to) params.to = range.to;
      if (search) params.search = search;
      const res = await condolencesService.getAll(params);
      setMessages(res?.data || []);
      setVisibleCount(PAGE_SIZE);
    } catch (e) {
      setError(e.response?.data?.error || 'Error cargando los mensajes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [range.from, range.to, search]); // eslint-disable-line react-hooks/exhaustive-deps

  // KPIs calculados sobre el universo completo (fecha/busqueda), sin importar el segmento activo.
  const kpis = useMemo(() => {
    const total = messages.length;
    let approved = 0, rejected = 0, unmoderated = 0;
    messages.forEach(c => {
      const s = statusOf(c);
      if (s === 'approved') approved += 1;
      else if (s === 'rejected') rejected += 1;
      else unmoderated += 1;
    });
    return { total, approved, rejected, unmoderated };
  }, [messages]);

  // Filtrado por estado en el cliente (sin pedidos extra al servidor).
  const filteredMessages = useMemo(() => (
    statusFilter ? messages.filter(c => statusOf(c) === statusFilter) : messages
  ), [messages, statusFilter]);

  const statusButtons = [
    { key: '', label: 'Todos', count: kpis.total },
    { key: 'approved', label: 'Publicados', count: kpis.approved },
    { key: 'rejected', label: 'Rechazados', count: kpis.rejected },
    { key: 'unmoderated', label: 'Sin moderar', count: kpis.unmoderated }
  ];

  const visible = filteredMessages.slice(0, visibleCount);
  const hasFilters = statusFilter || range.from || range.to || search;

  const applyPreset = (days) => setRange(lastDays(days));
  const clearRange = () => setRange({ from: '', to: '' });

  const handleModerate = async (c, action) => {
    try {
      setActingId(c.id);
      await condolencesService.moderate(c.id, action);
      await load();
    } catch (e) {
      alert('Error al moderar: ' + (e.response?.data?.error || e.message));
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (c) => {
    const ok = window.confirm(`¿Eliminar el mensaje de ${c.sender_name}? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      setActingId(c.id);
      await condolencesService.remove(c.id);
      await load();
    } catch (e) {
      alert('Error eliminando mensaje: ' + (e.response?.data?.error || e.message));
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <Helmet><title>Tablón de mensajes | SERCOFUN</title></Helmet>
      <div className="min-h-screen bg-background">
        {/* Header teal */}
        <div className="relative overflow-hidden sticky top-0 z-40"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
          <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Icon name="MessageSquare" size={20} color="#ffffff" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Tablón de mensajes</h1>
                  <p className="text-xs text-white/70 font-body">Moderación y consulta de condolencias</p>
                </div>
              </div>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-bold text-sm transition-smooth hover-lift press-scale text-primary disabled:opacity-60"
                style={{ background: '#ffffff' }}
              >
                <Icon name="RefreshCw" size={16} color="#1a7472" className={loading ? 'animate-spin' : ''} />
                Refrescar
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-6 py-6 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total mensajes" value={loading ? '…' : kpis.total} icon="MessageSquare" hint="Según los filtros actuales" />
            <MetricCard label="Publicados" value={loading ? '…' : kpis.approved} icon="CheckCircle2" accent="#16a34a" />
            <MetricCard label="Rechazados" value={loading ? '…' : kpis.rejected} icon="XCircle" accent="#e11d48" />
            <MetricCard label="Sin moderar" value={loading ? '…' : kpis.unmoderated} icon="Clock" accent="#d97706" />
          </div>

          {/* Filtros */}
          <div className="bg-card rounded-lg border border-border shadow-elevation-md p-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <Icon name="Filter" size={16} className="text-muted-foreground" />
              <h4 className="text-sm font-semibold text-foreground">Filtros</h4>
            </div>
            <div className="flex items-end gap-3 flex-wrap">
              {/* Estado: segmentado con contadores */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Estado</p>
                <div className="flex items-center rounded-md border border-border overflow-hidden">
                  {statusButtons.map((b, i) => (
                    <button
                      key={b.key}
                      onClick={() => { setStatusFilter(b.key); setVisibleCount(PAGE_SIZE); }}
                      className={cn(
                        "px-3 py-2 text-sm transition-colors flex items-center gap-1.5",
                        statusFilter === b.key
                          ? "bg-primary text-white"
                          : "bg-transparent text-foreground hover:bg-muted",
                        i > 0 && "border-l border-border"
                      )}
                    >
                      {b.label}
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        statusFilter === b.key ? "bg-white/20" : "bg-muted"
                      )}>
                        {b.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rango de fechas con presets */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Fechas</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <input type="date" value={range.from} max={range.to || undefined}
                    onChange={(e) => setRange(r => ({ ...r, from: e.target.value }))}
                    className="px-2 py-2 rounded-md border border-border bg-background text-sm" />
                  <span className="text-muted-foreground">—</span>
                  <input type="date" value={range.to} min={range.from || undefined}
                    onChange={(e) => setRange(r => ({ ...r, to: e.target.value }))}
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

              {/* Busqueda con debounce */}
              <div className="flex-1 min-w-[220px]">
                <p className="text-sm font-semibold text-foreground mb-2">Búsqueda</p>
                <div className="relative">
                  <Icon name="Search" size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Nombre, correo, mensaje, difunto o documento..."
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

          {/* Lista */}
          <div className="bg-card rounded-lg border border-border shadow-elevation-md p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Mensajes</h3>
                <p className="text-sm text-muted-foreground">
                  {loading
                    ? 'Cargando...'
                    : `${filteredMessages.length} ${filteredMessages.length === 1 ? 'mensaje' : 'mensajes'}${hasFilters ? ' con los filtros aplicados' : ''}`}
                </p>
              </div>
            </div>

            {error && (
              <div className="text-destructive text-sm flex items-center gap-2">
                <Icon name="AlertCircle" size={16} /> {error}
              </div>
            )}

            {loading && (
              <div className="py-12 text-center text-muted-foreground">
                <Icon name="Loader" size={28} className="animate-spin mx-auto mb-2" /> Cargando mensajes...
              </div>
            )}

            {!loading && !error && filteredMessages.length === 0 && (
              <div className="border-2 border-dashed border-border rounded-lg p-16 text-center">
                <Icon name="Inbox" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-foreground font-medium">
                  {hasFilters ? 'No hay mensajes que coincidan con los filtros' : 'Aún no hay mensajes'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasFilters
                    ? 'Ajusta los filtros o limpia la búsqueda para ver más resultados.'
                    : 'Los mensajes que dejen los familiares y amigos a través del formulario aparecerán aquí.'}
                </p>
              </div>
            )}

            {!loading && visible.length > 0 && (
              <div className="space-y-3">
                {visible.map(c => {
                  const s = statusOf(c);
                  const meta = STATUS_META[s];
                  const initial = (c.sender_name || '?').trim().charAt(0).toUpperCase();
                  const photo1 = c.file1_url ? getFileUrl(c.file1_url) : null;
                  const photo2 = c.file2_url ? getFileUrl(c.file2_url) : null;
                  const isActing = actingId === c.id;
                  const contextName = c.deceased_name || c.memorial_name;

                  return (
                    <article
                      key={c.id}
                      className={cn(
                        'border border-border rounded-lg p-5 transition-all',
                        isActing ? 'opacity-50' : 'hover:border-primary/30 hover:bg-muted/10'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {photo1 ? (
                            <img src={photo1} alt={c.sender_name}
                              className="w-12 h-12 rounded-full object-cover border border-border" />
                          ) : (
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                              style={{ background: 'rgba(240,192,64,0.85)', color: '#1a4a48' }}>
                              {initial}
                            </div>
                          )}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-foreground">{c.sender_name}</h4>
                                <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', meta.badge)}>
                                  <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
                                  {meta.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-muted-foreground">
                                {c.sender_email && (
                                  <span className="inline-flex items-center gap-1">
                                    <Icon name="Mail" size={12} />
                                    <a href={`mailto:${c.sender_email}`} className="hover:text-primary truncate max-w-[200px]">
                                      {c.sender_email}
                                    </a>
                                  </span>
                                )}
                                {c.sender_phone && (
                                  <span className="inline-flex items-center gap-1">
                                    <Icon name="Phone" size={12} />
                                    <a href={`tel:${c.sender_phone}`} className="hover:text-primary">{c.sender_phone}</a>
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1">
                                  <Icon name="Clock" size={12} />
                                  {formatDateTime(c.created_at)}
                                </span>
                                {contextName && (
                                  <span className="inline-flex items-center gap-1">
                                    <Icon name="BookOpen" size={12} />
                                    para {contextName}
                                    {c.deceased_document_id ? ` (Doc: ${c.deceased_document_id})` : ''}
                                    {c.location_name ? ` · ${c.location_name}` : ''}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {canModerate && s !== 'approved' && (
                                <button
                                  onClick={() => handleModerate(c, 'approve')}
                                  disabled={isActing}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 transition-colors disabled:opacity-50"
                                  title="Aprobar y publicar el mensaje"
                                >
                                  <Icon name="Check" size={14} />
                                  Aprobar
                                </button>
                              )}
                              {canModerate && s !== 'rejected' && (
                                <button
                                  onClick={() => handleModerate(c, 'reject')}
                                  disabled={isActing}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
                                  title="Rechazar el mensaje (no se muestra en pantalla)"
                                >
                                  <Icon name="X" size={14} />
                                  Rechazar
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(c)}
                                  disabled={isActing}
                                  className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                  title="Eliminar mensaje"
                                >
                                  <Icon name="Trash2" size={16} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Motivo de moderacion */}
                          {s !== 'approved' && c.moderation_reason && (
                            <p className="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
                              <Icon name="Info" size={13} className="mt-0.5 flex-shrink-0" />
                              <span>
                                {c.moderation_reason}
                                {c.moderation_model && (
                                  <span className="opacity-70"> · {c.moderation_model}</span>
                                )}
                              </span>
                            </p>
                          )}

                          {/* Mensaje */}
                          <p className="mt-3 text-foreground leading-relaxed whitespace-pre-wrap">
                            {c.message}
                          </p>

                          {/* Foto 2 (la 1 va en el avatar) */}
                          {photo2 && (
                            <div className="mt-3">
                              <a href={photo2} target="_blank" rel="noopener noreferrer" className="inline-block">
                                <img src={photo2} alt="Adjunto" className="max-h-40 rounded-md border border-border" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Cargar mas */}
            {!loading && filteredMessages.length > visibleCount && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors text-foreground"
                >
                  <Icon name="ChevronDown" size={16} />
                  Cargar más ({filteredMessages.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageBoardPage;
