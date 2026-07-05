import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { booksService } from '../../services/booksService';
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

// Configuracion visual por estado de envio.
const STATUS_META = {
  sent: { label: 'Enviado', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500', icon: 'CheckCircle2' },
  pending: { label: 'Pendiente', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: 'Clock' },
  failed: { label: 'Fallido', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', icon: 'XCircle' }
};

const statusOf = (b) => STATUS_META[b.status] ? b.status : 'pending';

const BooksPage = () => {
  const { user } = useAuth();
  const role = user?.role;
  const canSend = role === 'admin' || role === 'supervisor' || role === 'operator';

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('');
  const [range, setRange] = useState({ from: '', to: '' });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Paginacion en cliente
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Accion en curso (enviar/descargar) por id
  const [actingId, setActingId] = useState(null);
  const [actionError, setActionError] = useState(null);

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
      if (statusFilter) params.status = statusFilter;
      if (range.from) params.from = range.from;
      if (range.to) params.to = range.to;
      if (search) params.search = search;
      const res = await booksService.getAll(params);
      setBooks(res?.data || []);
      setVisibleCount(PAGE_SIZE);
    } catch (e) {
      setError(e.response?.data?.error || 'Error cargando los envíos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter, range.from, range.to, search]); // eslint-disable-line react-hooks/exhaustive-deps

  // KPIs sobre el universo completo cargado (los filtros de fecha/busqueda ya se aplican en el servidor,
  // pero el segmento de estado activo no debe afectar los contadores del segmentado).
  const kpis = useMemo(() => {
    const total = books.length;
    let sent = 0, pending = 0, failed = 0;
    books.forEach(b => {
      const s = statusOf(b);
      if (s === 'sent') sent += 1;
      else if (s === 'failed') failed += 1;
      else pending += 1;
    });
    return { total, sent, pending, failed };
  }, [books]);

  const statusButtons = [
    { key: '', label: 'Todos', count: kpis.total },
    { key: 'sent', label: 'Enviados', count: kpis.sent },
    { key: 'pending', label: 'Pendientes', count: kpis.pending },
    { key: 'failed', label: 'Fallidos', count: kpis.failed }
  ];

  const visible = books.slice(0, visibleCount);
  const hasFilters = statusFilter || range.from || range.to || search;

  const applyPreset = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    const fmt = (d) => d.toISOString().slice(0, 10);
    setRange({ from: fmt(from), to: fmt(to) });
  };
  const clearRange = () => setRange({ from: '', to: '' });

  const handleSend = async (b) => {
    const ok = window.confirm(`¿Enviar el libro de condolencias de ${b.deceased_name} al correo ${b.recipient_email || 'registrado'}?`);
    if (!ok) return;
    try {
      setActingId(b.id);
      setActionError(null);
      const res = await booksService.send(b.memorial_id);
      if (!res.success) {
        setActionError(res.error || 'No se pudo enviar el correo');
      }
      await load();
    } catch (e) {
      setActionError(e.response?.data?.error || 'Error enviando el correo');
    } finally {
      setActingId(null);
    }
  };

  const handleDownload = async (b) => {
    try {
      setActingId(b.id);
      setActionError(null);
      const safeName = (b.deceased_name || 'homenaje').trim().replace(/[^a-zA-Z0-9]+/g, '_');
      await booksService.download(b.id, `libro_condolencias_${safeName}.pdf`);
    } catch (e) {
      setActionError(e.message || 'Error descargando el PDF');
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <Helmet><title>Books | SERCOFUN</title></Helmet>
      <div className="min-h-screen bg-background">
        {/* Header teal */}
        <div className="relative overflow-hidden sticky top-0 z-40"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
          <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Icon name="Mail" size={20} color="#ffffff" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Books</h1>
                  <p className="text-xs text-white/70 font-body">Envío del libro de condolencias en PDF a los familiares</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {role === 'admin' && (
                  <Link
                    to="/configuracion-correo"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/90 hover:text-white border border-white/25 hover:bg-white/10 transition-colors"
                  >
                    <Icon name="Settings" size={15} />
                    Configurar correo
                  </Link>
                )}
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
        </div>

        <div className="max-w-[1920px] mx-auto px-6 py-6 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total envíos" value={loading ? '…' : kpis.total} icon="Mail" hint="Según los filtros actuales" />
            <MetricCard label="Enviados" value={loading ? '…' : kpis.sent} icon="CheckCircle2" accent="#16a34a" />
            <MetricCard label="Pendientes" value={loading ? '…' : kpis.pending} icon="Clock" accent="#d97706" />
            <MetricCard label="Fallidos" value={loading ? '…' : kpis.failed} icon="XCircle" accent="#e11d48" />
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
                    placeholder="Difunto, documento o correo del titular..."
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

          {/* Listado */}
          <div className="bg-card rounded-lg border border-border shadow-elevation-md p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Envíos</h3>
                <p className="text-sm text-muted-foreground">
                  {loading
                    ? 'Cargando...'
                    : `${books.length} ${books.length === 1 ? 'envío' : 'envíos'}${hasFilters ? ' con los filtros aplicados' : ''}`}
                </p>
              </div>
            </div>

            {error && (
              <div className="text-destructive text-sm flex items-center gap-2">
                <Icon name="AlertCircle" size={16} /> {error}
              </div>
            )}

            {actionError && (
              <div className="text-destructive text-sm flex items-center gap-2 bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
                <Icon name="AlertCircle" size={16} className="flex-shrink-0" /> {actionError}
                <button onClick={() => setActionError(null)} className="ml-auto text-muted-foreground hover:text-foreground">
                  <Icon name="X" size={14} />
                </button>
              </div>
            )}

            {loading && (
              <div className="py-12 text-center text-muted-foreground">
                <Icon name="Loader" size={28} className="animate-spin mx-auto mb-2" /> Cargando envíos...
              </div>
            )}

            {!loading && !error && books.length === 0 && (
              <div className="border-2 border-dashed border-border rounded-lg p-16 text-center">
                <Icon name="Mail" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-foreground font-medium">
                  {hasFilters ? 'No hay envíos que coincidan con los filtros' : 'Aún no hay envíos registrados'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasFilters
                    ? 'Ajusta los filtros o limpia la búsqueda para ver más resultados.'
                    : 'El libro de condolencias se envía automáticamente días después de finalizar cada homenaje.'}
                </p>
              </div>
            )}

            {!loading && visible.length > 0 && (
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-4 py-2.5">Difunto</th>
                      <th className="text-left font-medium px-4 py-2.5">Sede</th>
                      <th className="text-left font-medium px-4 py-2.5">Destinatario</th>
                      <th className="text-left font-medium px-4 py-2.5">Estado</th>
                      <th className="text-right font-medium px-4 py-2.5">Mensajes</th>
                      <th className="text-left font-medium px-4 py-2.5">Fecha</th>
                      <th className="text-right font-medium px-4 py-2.5">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(b => {
                      const s = statusOf(b);
                      const meta = STATUS_META[s];
                      const isActing = actingId === b.id;
                      // El PDF se genera y guarda ANTES de intentar el envio SMTP,
                      // asi que tambien existe cuando el envio fallo por SMTP (util
                      // para que el staff verifique si el problema fue el PDF o el
                      // correo). has_pdf cubre el caso raro en que ni el PDF se pudo generar.
                      const canDownload = b.has_pdf === true;
                      return (
                        <tr key={b.id} className={cn(
                          "border-t border-border hover:bg-muted/20 transition-colors",
                          isActing && "opacity-50"
                        )}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{b.deceased_name || '—'}</p>
                            {b.deceased_document_id && (
                              <p className="text-xs text-muted-foreground">Doc: {b.deceased_document_id}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {b.location_name || '—'}
                            {b.room_name ? <span className="text-muted-foreground"> · {b.room_name}</span> : ''}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {b.recipient_email
                              ? <a href={`mailto:${b.recipient_email}`} className="hover:text-primary">{b.recipient_email}</a>
                              : <span className="text-muted-foreground">Sin correo</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', meta.badge)}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
                              {meta.label}
                            </span>
                            {s === 'failed' && b.error_message && (
                              <p className="text-xs text-rose-600 mt-1 max-w-[220px]" title={b.error_message}>
                                {b.error_message}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground">{b.message_count ?? '—'}</td>
                          <td className="px-4 py-3 text-foreground whitespace-nowrap">
                            {formatDateTime(b.sent_at || b.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {canDownload && (
                                <button
                                  onClick={() => handleDownload(b)}
                                  disabled={isActing}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-foreground border border-border hover:bg-muted transition-colors disabled:opacity-50"
                                  title="Descargar el PDF enviado"
                                >
                                  <Icon name="Download" size={14} />
                                  Descargar
                                </button>
                              )}
                              {canSend && (
                                <button
                                  onClick={() => handleSend(b)}
                                  disabled={isActing}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors disabled:opacity-50"
                                  title="Generar el PDF con los mensajes aprobados y reenviarlo"
                                >
                                  <Icon name={isActing ? 'Loader' : 'Send'} size={14} className={isActing ? 'animate-spin' : ''} />
                                  Reenviar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cargar mas */}
            {!loading && books.length > visibleCount && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors text-foreground"
                >
                  <Icon name="ChevronDown" size={16} />
                  Cargar más ({books.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BooksPage;
