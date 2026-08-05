import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { booksService } from '../../services/booksService';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/AppIcon';
import MetricCard from '../../components/analytics/MetricCard';
import { cn } from '../../utils/cn';
import SendBookModal from './components/SendBookModal';

const PAGE_SIZE = 20;

const formatDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// Numeros de pagina a mostrar alrededor de la actual, con "…" para saltos.
const getPageNumbers = (current, total) => {
  const delta = 1;
  const pages = [];
  const rangeStart = Math.max(2, current - delta);
  const rangeEnd = Math.min(total - 1, current + delta);
  pages.push(1);
  if (rangeStart > 2) pages.push('…');
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
  if (rangeEnd < total - 1) pages.push('…');
  if (total > 1) pages.push(total);
  return pages;
};

// Estado de envio por homenaje. La regla vigente (ver jobs/bookScheduler.js):
// el cron intenta el envio automatico UNA sola vez por homenaje, send_delay_days
// despues de schedule_end; si ese intento falla, NO reintenta solo.
const STATUS_META = {
  scheduled: { label: 'Programado', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: 'CalendarClock' },
  awaiting_run: { label: 'Por enviar hoy', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: 'Clock' },
  blocked_no_smtp: { label: 'SMTP no configurado', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', icon: 'AlertTriangle' },
  auto_failed: { label: 'Auto-envío falló', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', icon: 'XCircle' },
  manual_failed: { label: 'Envío falló', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', icon: 'XCircle' },
  sent_auto: { label: 'Enviado (automático)', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500', icon: 'CheckCircle2' },
  sent_manual: { label: 'Enviado (manual)', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500', icon: 'CheckCircle2' },
  pending_send: { label: 'Procesando...', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', icon: 'Loader' },
  no_schedule: { label: 'Sin fecha de fin', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', icon: 'HelpCircle' }
};

const STATUS_GROUPS = [
  { key: '', label: 'Todos', match: () => true },
  { key: 'sent', label: 'Enviados', match: (s) => s === 'sent_auto' || s === 'sent_manual' },
  { key: 'scheduled', label: 'Programados', match: (s) => s === 'scheduled' },
  {
    key: 'action_needed',
    label: 'Necesitan acción',
    match: (s) => s === 'auto_failed' || s === 'manual_failed' || s === 'blocked_no_smtp' || s === 'awaiting_run'
  }
];

const BooksPage = () => {
  const { user } = useAuth();
  const role = user?.role;
  const canSend = role === 'admin' || role === 'supervisor' || role === 'operator';

  const [tributes, setTributes] = useState([]);
  const [meta, setMeta] = useState({ send_delay_days: 1, smtp_configured: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('');
  const [range, setRange] = useState({ from: '', to: '' });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  const [actingId, setActingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [sendModalFor, setSendModalFor] = useState(null); // fila (tribute) o null
  const [historyFor, setHistoryFor] = useState(null); // fila (tribute) o null
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
      const res = await booksService.getAll(params);
      setTributes(res?.data || []);
      setMeta(res?.meta || { send_delay_days: 1, smtp_configured: false });
      setCurrentPage(1);
    } catch (e) {
      setError(e.response?.data?.error || 'Error cargando los homenajes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [range.from, range.to, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const kpis = useMemo(() => {
    const total = tributes.length;
    let sent = 0, scheduled = 0, actionNeeded = 0;
    tributes.forEach((t) => {
      if (t.book_status === 'sent_auto' || t.book_status === 'sent_manual') sent += 1;
      else if (t.book_status === 'scheduled') scheduled += 1;
      else if (['auto_failed', 'manual_failed', 'blocked_no_smtp', 'awaiting_run'].includes(t.book_status)) actionNeeded += 1;
    });
    return { total, sent, scheduled, actionNeeded };
  }, [tributes]);

  const filteredTributes = useMemo(() => {
    const group = STATUS_GROUPS.find((g) => g.key === statusFilter) || STATUS_GROUPS[0];
    return tributes.filter((t) => group.match(t.book_status));
  }, [tributes, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTributes.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const visible = filteredTributes.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = statusFilter || range.from || range.to || search;

  const applyPreset = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    const fmt = (d) => d.toISOString().slice(0, 10);
    setRange({ from: fmt(from), to: fmt(to) });
  };
  const clearRange = () => setRange({ from: '', to: '' });

  const handlePreview = async (t) => {
    try {
      setActingId(t.memorial_id);
      setActionError(null);
      const safeName = (t.deceased_name || 'homenaje').trim().replace(/[^a-zA-Z0-9]+/g, '_');
      await booksService.preview(t.memorial_id, `libro_condolencias_${safeName}.pdf`);
    } catch (e) {
      setActionError(e.message || 'Error generando el book');
    } finally {
      setActingId(null);
    }
  };

  const handleDownloadLast = async (t) => {
    try {
      setActingId(t.memorial_id);
      setActionError(null);
      const safeName = (t.deceased_name || 'homenaje').trim().replace(/[^a-zA-Z0-9]+/g, '_');
      await booksService.download(t.last_send_id, `libro_condolencias_${safeName}.pdf`);
    } catch (e) {
      setActionError(e.message || 'Error descargando el PDF');
    } finally {
      setActingId(null);
    }
  };

  const openHistory = async (t) => {
    setHistoryFor(t);
    setHistoryLoading(true);
    try {
      const res = await booksService.history(t.memorial_id);
      setHistoryRows(res?.data || []);
    } catch (e) {
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Books | SERCOFUN</title></Helmet>
      <div className="min-h-screen bg-background">
        {/* Header + KPIs + Filtros: fijos juntos al hacer scroll */}
        <div className="sticky top-0 z-40">
          <div className="relative overflow-hidden"
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
                    <p className="text-xs text-white/70 font-body">Estado y envío del libro de condolencias por homenaje</p>
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

          <div className="bg-background border-b border-border shadow-elevation-md">
            <div className="max-w-[1920px] mx-auto px-6 py-4 space-y-4">
              {!loading && !meta.smtp_configured && (
                <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  <Icon name="AlertTriangle" size={16} className="flex-shrink-0" />
                  El correo SMTP no está configurado: el envío automático no podrá ejecutarse hasta que se configure.
                  {role === 'admin' && (
                    <Link to="/configuracion-correo" className="ml-auto underline font-medium hover:text-amber-900">
                      Configurar ahora
                    </Link>
                  )}
                </div>
              )}

              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total homenajes" value={loading ? '…' : kpis.total} icon="Mail" hint="Según los filtros actuales" />
                <MetricCard label="Enviados" value={loading ? '…' : kpis.sent} icon="CheckCircle2" accent="#16a34a" />
                <MetricCard label="Programados" value={loading ? '…' : kpis.scheduled} icon="CalendarClock" accent="#2563eb" />
                <MetricCard label="Necesitan acción" value={loading ? '…' : kpis.actionNeeded} icon="AlertTriangle" accent="#e11d48" />
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
                      {STATUS_GROUPS.map((g, i) => {
                        const count = tributes.filter((t) => g.match(t.book_status)).length;
                        return (
                          <button
                            key={g.key || 'all'}
                            onClick={() => { setStatusFilter(g.key); setCurrentPage(1); }}
                            className={cn(
                              "px-3 py-2 text-sm transition-colors flex items-center gap-1.5",
                              statusFilter === g.key
                                ? "bg-primary text-white"
                                : "bg-transparent text-foreground hover:bg-muted",
                              i > 0 && "border-l border-border"
                            )}
                          >
                            {g.label}
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded-full",
                              statusFilter === g.key ? "bg-white/20" : "bg-muted"
                            )}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Fin del homenaje</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input type="date" value={range.from} max={range.to || undefined}
                        onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                        className="px-2 py-2 rounded-md border border-border bg-background text-sm" />
                      <span className="text-muted-foreground">—</span>
                      <input type="date" value={range.to} min={range.from || undefined}
                        onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
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
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-6 py-6">
          <div className="bg-card rounded-lg border border-border shadow-elevation-md p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Homenajes</h3>
                <p className="text-sm text-muted-foreground">
                  {loading
                    ? 'Cargando...'
                    : `${filteredTributes.length} ${filteredTributes.length === 1 ? 'homenaje' : 'homenajes'}${hasFilters ? ' con los filtros aplicados' : ''}`}
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
                <Icon name="Loader" size={28} className="animate-spin mx-auto mb-2" /> Cargando homenajes...
              </div>
            )}

            {!loading && !error && tributes.length === 0 && (
              <div className="border-2 border-dashed border-border rounded-lg p-16 text-center">
                <Icon name="Mail" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-foreground font-medium">Aún no hay homenajes registrados</p>
              </div>
            )}

            {!loading && visible.length > 0 && (
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-4 py-2.5">Difunto</th>
                      <th className="text-left font-medium px-4 py-2.5">Sede / Sala</th>
                      <th className="text-left font-medium px-4 py-2.5">Fin del homenaje</th>
                      <th className="text-right font-medium px-4 py-2.5">Mensajes</th>
                      <th className="text-right font-medium px-4 py-2.5">Imágenes</th>
                      <th className="text-left font-medium px-4 py-2.5">Estado del book</th>
                      <th className="text-right font-medium px-4 py-2.5">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((t) => {
                      const meta_ = STATUS_META[t.book_status] || STATUS_META.no_schedule;
                      const isActing = actingId === t.memorial_id;
                      const canDownloadLast = t.last_send_has_pdf === true;
                      return (
                        <tr key={t.memorial_id} className={cn(
                          "border-t border-border hover:bg-muted/20 transition-colors",
                          isActing && "opacity-50"
                        )}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{t.deceased_name || '—'}</p>
                            {t.deceased_document_id && (
                              <p className="text-xs text-muted-foreground">Doc: {t.deceased_document_id}</p>
                            )}
                            {!t.family_contact_email && (
                              <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                                <Icon name="AlertTriangle" size={11} /> Sin correo de titular
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {t.location_name || '—'}
                            {t.room_name ? <span className="text-muted-foreground"> · {t.room_name}</span> : ''}
                          </td>
                          <td className="px-4 py-3 text-foreground whitespace-nowrap">
                            {formatDateTime(t.schedule_end)}
                            {t.book_status === 'scheduled' && (
                              <p className="text-xs text-muted-foreground">Auto: {formatDateTime(t.auto_send_eta)}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground">
                            {t.approved_message_count ?? 0}
                            {t.unmoderated_message_count > 0 && (
                              <span
                                className="ml-1 inline-flex items-center gap-0.5 text-amber-600 text-xs"
                                title={`${t.unmoderated_message_count} mensaje(s) sin moderar (no se incluyen en el book)`}
                              >
                                <Icon name="Clock" size={11} />{t.unmoderated_message_count}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {t.total_photo_count > 0 ? (
                              <span
                                className="inline-flex items-center gap-1 text-foreground"
                                title={[
                                  t.has_main_photo ? '1 foto principal' : null,
                                  t.condolence_photo_count > 0 ? `${t.condolence_photo_count} en mensajes` : null
                                ].filter(Boolean).join(' + ')}
                              >
                                <Icon name="Image" size={13} className="text-muted-foreground" />
                                {t.total_photo_count}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-muted-foreground" title="Sin fotos">
                                <Icon name="ImageOff" size={13} />
                                0
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', meta_.badge)}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', meta_.dot)} />
                              {meta_.label}
                            </span>
                            {t.last_send_recipient_email && (
                              <p className="text-xs text-muted-foreground mt-1 max-w-[220px] truncate" title={t.last_send_recipient_email}>
                                a {t.last_send_recipient_email} · {formatDateTime(t.last_send_sent_at || t.last_send_created_at)}
                              </p>
                            )}
                            {(t.book_status === 'auto_failed' || t.book_status === 'manual_failed') && t.last_send_error_message && (
                              <p className="text-xs text-rose-600 mt-1 max-w-[220px] truncate" title={t.last_send_error_message}>
                                {t.last_send_error_message}
                              </p>
                            )}
                            {t.send_attempts_count > 1 && (
                              <button
                                onClick={() => openHistory(t)}
                                className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                              >
                                <Icon name="History" size={11} /> {t.send_attempts_count} intentos
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handlePreview(t)}
                                disabled={isActing}
                                className="p-2 rounded-md hover:bg-muted transition-colors text-foreground disabled:opacity-50"
                                title="Ver book (PDF) actual"
                              >
                                <Icon name="BookOpen" size={16} />
                              </button>
                              {canDownloadLast && (
                                <button
                                  onClick={() => handleDownloadLast(t)}
                                  disabled={isActing}
                                  className="p-2 rounded-md hover:bg-muted transition-colors text-foreground disabled:opacity-50"
                                  title="Descargar el PDF del último envío"
                                >
                                  <Icon name="Download" size={16} />
                                </button>
                              )}
                              {canSend && (
                                <button
                                  onClick={() => setSendModalFor(t)}
                                  disabled={isActing}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors disabled:opacity-50"
                                  title="Enviar o reenviar el book"
                                >
                                  <Icon name="Send" size={14} />
                                  {t.send_attempts_count > 0 ? 'Reenviar' : 'Enviar'}
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

            {/* Paginacion */}
            {!loading && totalPages > 1 && (
              <div className="pt-4 flex items-center justify-between gap-3 flex-wrap border-t border-border">
                <p className="text-sm text-muted-foreground">Página {safePage} de {totalPages}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
                  >
                    <Icon name="ChevronLeft" size={14} /> Anterior
                  </button>
                  {getPageNumbers(safePage, totalPages).map((p, i) => (
                    p === '…' ? (
                      <span key={`e-${i}`} className="px-2 text-sm text-muted-foreground">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={cn(
                          "min-w-[34px] px-2 py-1.5 rounded-md text-sm transition-colors",
                          p === safePage ? "bg-primary text-white" : "border border-border text-foreground hover:bg-muted"
                        )}
                      >
                        {p}
                      </button>
                    )
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
                  >
                    Siguiente <Icon name="ChevronRight" size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {sendModalFor && (
        <SendBookModal
          tribute={sendModalFor}
          onClose={() => setSendModalFor(null)}
          onSent={(res) => {
            setSendModalFor(null);
            if (!res?.success) {
              setActionError(res?.data?.error_message || res?.error || 'No se pudo enviar el correo');
            }
            load();
          }}
        />
      )}

      {historyFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setHistoryFor(null)} />
          <div className="relative bg-card rounded-lg border border-border shadow-elevation-md w-full max-w-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Historial de envíos</h3>
                <p className="text-sm text-muted-foreground">{historyFor.deceased_name}</p>
              </div>
              <button
                onClick={() => setHistoryFor(null)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {historyLoading && (
                <div className="py-8 text-center text-muted-foreground">
                  <Icon name="Loader" size={24} className="animate-spin mx-auto" />
                </div>
              )}
              {!historyLoading && historyRows.map((h) => {
                const s = h.status === 'sent' ? 'sent_auto' : h.status === 'failed' ? 'auto_failed' : 'pending_send';
                const hm = STATUS_META[s] || STATUS_META.pending_send;
                return (
                  <div key={h.id} className="border border-border rounded-md p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', hm.badge)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', hm.dot)} />
                        {h.trigger_type === 'auto' ? 'Automático' : 'Manual'} · {h.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(h.sent_at || h.created_at)}</span>
                    </div>
                    <p className="text-sm text-foreground mt-1.5">A: {h.recipient_email || '—'}</p>
                    {h.error_message && <p className="text-xs text-rose-600 mt-1">{h.error_message}</p>}
                  </div>
                );
              })}
              {!historyLoading && historyRows.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Sin intentos registrados.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BooksPage;
