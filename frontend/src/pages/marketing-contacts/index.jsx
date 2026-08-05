import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { condolencesService, locationsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/AppIcon';
import MetricCard from '../../components/analytics/MetricCard';
import { cn } from '../../utils/cn';
import { usePagination, Pagination } from '../../components/ui/pagination';
import EditContactModal from './components/EditContactModal';

// Limite generoso: esta vista no pagina en el servidor (igual que Tablon/Books),
// trae todo lo que matchee el filtro de fecha/sede/busqueda y pagina en cliente.
const FETCH_LIMIT = 5000;

const formatDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const MarketingContactsPage = () => {
  const { user } = useAuth();
  const role = user?.role;
  const canDelete = role === 'admin' || role === 'supervisor';

  const [contacts, setContacts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [range, setRange] = useState({ from: '', to: '' });
  const [locationFilter, setLocationFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [editingContact, setEditingContact] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const debounceRef = useRef(null);
  useEffect(() => {
    debounceRef.current = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  useEffect(() => {
    locationsService.getAll().then((r) => setLocations(r?.data || [])).catch(() => {});
  }, []);

  const buildParams = () => {
    const params = { marketing_consent: 'true', limit: FETCH_LIMIT };
    if (range.from) params.from = range.from;
    if (range.to) params.to = range.to;
    if (search) params.search = search;
    if (locationFilter) params.location_id = locationFilter;
    return params;
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await condolencesService.getAll(buildParams());
      setContacts(res?.data || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Error cargando los contactos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [range.from, range.to, search, locationFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const { page, setPage, totalPages, pageItems } = usePagination(contacts);

  const kpis = useMemo(() => {
    const total = contacts.length;
    const withPhone = contacts.filter((c) => c.sender_phone).length;
    const uniqueEmails = new Set(contacts.map((c) => (c.sender_email || '').toLowerCase()).filter(Boolean)).size;
    const uniqueLocations = new Set(contacts.map((c) => c.location_name).filter(Boolean)).size;
    return { total, withPhone, uniqueEmails, uniqueLocations };
  }, [contacts]);

  const hasFilters = range.from || range.to || search || locationFilter;

  const applyPreset = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    const fmt = (d) => d.toISOString().slice(0, 10);
    setRange({ from: fmt(from), to: fmt(to) });
  };
  const clearRange = () => setRange({ from: '', to: '' });

  const handleDelete = async (c) => {
    const ok = window.confirm(
      `¿Eliminar por completo el mensaje de ${c.sender_name}? Esto borra también su condolencia del homenaje y del libro de condolencias, no solo el registro de marketing. Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
      setActingId(c.id);
      setActionError(null);
      await condolencesService.remove(c.id);
      await load();
    } catch (e) {
      setActionError(e.response?.data?.error || 'Error eliminando el contacto');
    } finally {
      setActingId(null);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setActionError(null);
      const params = buildParams();
      delete params.limit;
      delete params.marketing_consent; // el backend siempre fuerza autorizados en este endpoint
      const blob = await condolencesService.exportMarketing(params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contactos_marketing_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setActionError(e.response?.data?.error || 'Error exportando a Excel');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Helmet><title>Contactos de Marketing | SERCOFUN</title></Helmet>
      <div className="min-h-screen bg-background">
        {/* Header + KPIs + Filtros: fijos juntos al hacer scroll, igual que Tablón/Books. */}
        <div className="sticky top-0 z-40">
          <div className="relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
            <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                    style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <Icon name="Contact" size={20} color="#ffffff" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Contactos de Marketing</h1>
                    <p className="text-xs text-white/70 font-body">
                      Base de datos recopilada desde los formularios públicos (QR) para campañas posteriores
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting || loading || contacts.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-bold text-sm transition-smooth hover-lift press-scale text-white disabled:opacity-60"
                    style={{ background: '#1f9c3f' }}
                  >
                    <Icon name={exporting ? 'Loader' : 'FileSpreadsheet'} size={16} color="#ffffff" className={exporting ? 'animate-spin' : ''} />
                    {exporting ? 'Exportando...' : 'Exportar Excel'}
                  </button>
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
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total contactos" value={loading ? '…' : kpis.total} icon="Contact" hint="Autorizaron marketing, según filtros" />
                <MetricCard label="Con teléfono" value={loading ? '…' : kpis.withPhone} icon="Phone" accent="#337d7c" />
                <MetricCard label="Correos únicos" value={loading ? '…' : kpis.uniqueEmails} icon="Mail" accent="#16a34a" />
                <MetricCard label="Sedes representadas" value={loading ? '…' : kpis.uniqueLocations} icon="Building2" accent="#d97706" />
              </div>

              {/* Filtros */}
              <div className="bg-card rounded-lg border border-border shadow-elevation-md p-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                  <Icon name="Filter" size={16} className="text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">Filtros</h4>
                </div>
                <div className="flex items-end gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Fecha del mensaje</p>
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

                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Sede</p>
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="px-3 py-2 rounded-md border border-border bg-background text-sm"
                    >
                      <option value="">Todas las sedes</option>
                      {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
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
                        placeholder="Nombre, correo, teléfono, difunto, sede o titular..."
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
                <h3 className="text-lg font-semibold text-foreground">Contactos</h3>
                <p className="text-sm text-muted-foreground">
                  {loading
                    ? 'Cargando...'
                    : `${contacts.length} ${contacts.length === 1 ? 'contacto' : 'contactos'} que autorizaron marketing${hasFilters ? ' con los filtros aplicados' : ''}`}
                </p>
              </div>
            </div>

            {(error || actionError) && (
              <div className="text-destructive text-sm flex items-center gap-2">
                <Icon name="AlertCircle" size={16} /> {error || actionError}
              </div>
            )}

            {loading && (
              <div className="py-12 text-center text-muted-foreground">
                <Icon name="Loader" size={28} className="animate-spin mx-auto mb-2" /> Cargando contactos...
              </div>
            )}

            {!loading && !error && contacts.length === 0 && (
              <div className="border-2 border-dashed border-border rounded-lg p-16 text-center">
                <Icon name="Contact" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-foreground font-medium">
                  {hasFilters ? 'No hay contactos que coincidan con los filtros' : 'Aún no hay contactos que autorizaron marketing'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasFilters
                    ? 'Ajusta los filtros o limpia la búsqueda para ver más resultados.'
                    : 'Cuando alguien deje un mensaje desde el formulario público y marque la casilla de autorización, aparecerá aquí.'}
                </p>
              </div>
            )}

            {!loading && pageItems.length > 0 && (
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Contacto</th>
                      <th className="text-left font-medium px-4 py-3">Homenaje / Sede</th>
                      <th className="text-left font-medium px-4 py-3">Titular de cuenta</th>
                      <th className="text-left font-medium px-4 py-3">Fecha</th>
                      <th className="text-right font-medium px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((c) => {
                      const isActing = actingId === c.id;
                      return (
                        <tr key={c.id} className={cn("border-t border-border hover:bg-muted/20 transition-colors", isActing && "opacity-50")}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{c.sender_name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Icon name="Mail" size={11} />
                              <a href={`mailto:${c.sender_email}`} className="hover:text-primary truncate max-w-[200px]">{c.sender_email}</a>
                            </div>
                            {c.sender_phone && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Icon name="Phone" size={11} />
                                <a href={`tel:${c.sender_phone}`} className="hover:text-primary">{c.sender_phone}</a>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Link to={`/memorials/${c.memorial_id}`} className="text-foreground hover:text-primary transition-colors">
                              {c.deceased_name}
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              {c.location_name}{c.room_name ? ` · ${c.room_name}` : ''}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {c.family_contact_name ? (
                              <>
                                <div className="text-foreground">{c.family_contact_name}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {c.family_contact_email || '—'}
                                </div>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin información</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-foreground whitespace-nowrap">{formatDateTime(c.created_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditingContact(c)}
                                disabled={isActing}
                                className="p-2 rounded-md hover:bg-muted transition-colors text-primary disabled:opacity-50"
                                title="Editar contacto"
                              >
                                <Icon name="Edit3" size={16} />
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(c)}
                                  disabled={isActing}
                                  className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                  title="Eliminar mensaje y contacto"
                                >
                                  <Icon name={isActing ? 'Loader' : 'Trash2'} size={16} className={isActing ? 'animate-spin' : ''} />
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

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      </div>

      {editingContact && (
        <EditContactModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSaved={() => { setEditingContact(null); load(); }}
        />
      )}
    </>
  );
};

export default MarketingContactsPage;
