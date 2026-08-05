import React, { useEffect, useMemo, useRef, useState } from 'react';
import { locationsService } from '../../../services/api';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import MetricCard from '../../../components/analytics/MetricCard';
import { cn } from '../../../utils/cn';
import Modal from './Modal';
import { useTableSort, SortTh } from '../../../components/ui/sortable';
import { usePagination, Pagination } from '../../../components/ui/pagination';

const emptyForm = { name: '', city: '', address: '', phone: '' };

const LOC_SORT_ACCESSORS = {
  name: (l) => l.name,
  city: (l) => l.city,
  address: (l) => l.address || '',
  room_count: (l) => Number(l.room_count) || 0,
  active: (l) => (l.active ? 1 : 0)
};

const LocationsTab = ({ registerCreate }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  // Filtro rapido: 'all' | 'active' | 'inactive'
  const [filterActive, setFilterActive] = useState('all');

  // Debounce 400ms para la busqueda, igual que Tablon/Books/Tributos.
  const debounceRef = useRef(null);
  useEffect(() => {
    debounceRef.current = setTimeout(() => setQuery(searchInput.trim().toLowerCase()), 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = crear, objeto = editar
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await locationsService.getAll();
      setLocations(r?.data || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Error cargando sedes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  // Exponer openCreate al header (boton "Nueva sede" siempre visible).
  useEffect(() => {
    if (registerCreate) registerCreate(openCreate);
  });

  const openEdit = (loc) => {
    setEditing(loc);
    setForm({
      name: loc.name || '',
      city: loc.city || '',
      address: loc.address || '',
      phone: loc.phone || ''
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.city.trim()) {
      setFormError('Nombre y ciudad son obligatorios');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await locationsService.update(editing.id, form);
      } else {
        await locationsService.create(form);
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Error guardando la sede');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (loc) => {
    try {
      await locationsService.update(loc.id, { active: !loc.active });
      await load();
    } catch (e) {
      alert('Error: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleDelete = async (loc) => {
    const n = parseInt(loc.room_count, 10) || 0;
    const warn = n > 0
      ? `La sede "${loc.name}" tiene ${n} sala(s). Al eliminarla se borrarán también todas sus salas y homenajes. `
      : `Se eliminará la sede "${loc.name}". `;
    if (!window.confirm(warn + 'Esta acción no se puede deshacer. ¿Continuar?')) return;
    try {
      await locationsService.remove(loc.id);
      await load();
    } catch (e) {
      alert('Error eliminando: ' + (e.response?.data?.error || e.message));
    }
  };

  // Filtro por estado + texto (nombre, ciudad o direccion) + ordenamiento por columna.
  const filtered = useMemo(() => {
    return locations.filter(l => {
      if (filterActive === 'active' && !l.active) return false;
      if (filterActive === 'inactive' && l.active) return false;
      if (query) {
        const haystack = `${l.name || ''} ${l.city || ''} ${l.address || ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [locations, query, filterActive]);
  const { sorted, sort, toggle } = useTableSort(filtered, LOC_SORT_ACCESSORS);
  const { page, setPage, totalPages, pageItems } = usePagination(sorted);
  const activeLocationsCount = locations.filter(l => l.active).length;
  const inactiveLocationsCount = locations.length - activeLocationsCount;
  const totalRooms = useMemo(
    () => locations.reduce((sum, l) => sum + (Number(l.room_count) || 0), 0),
    [locations]
  );

  const activeButtons = [
    { key: 'all', label: 'Todas', count: locations.length },
    { key: 'active', label: 'Activas', count: activeLocationsCount },
    { key: 'inactive', label: 'Inactivas', count: inactiveLocationsCount }
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar SIEMPRE visible (no depende del estado de carga) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Sedes / Funerarias</h3>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Cargando...' : `${filtered.length} de ${locations.length} ${locations.length === 1 ? 'sede' : 'sedes'}`}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
          style={{ background: '#1a7472' }}
        >
          <Icon name="Plus" size={16} color="#ffffff" />
          Nueva sede
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total sedes" value={locations.length} icon="Building2" hint="Registradas en el sistema" />
        <MetricCard label="Activas" value={activeLocationsCount} icon="CheckCircle2" accent="#16a34a" />
        <MetricCard label="Inactivas" value={inactiveLocationsCount} icon="PowerOff" accent="#6b7280" />
        <MetricCard label="Total salas" value={totalRooms} icon="Home" accent="#337d7c" />
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
              {activeButtons.map((b, i) => (
                <button
                  key={b.key}
                  onClick={() => { setFilterActive(b.key); setPage(1); }}
                  className={cn(
                    "px-3 py-2 text-sm transition-colors flex items-center gap-1.5",
                    filterActive === b.key
                      ? "bg-primary text-white"
                      : "bg-transparent text-foreground hover:bg-muted",
                    i > 0 && "border-l border-border"
                  )}
                >
                  {b.label}
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    filterActive === b.key ? "bg-white/20" : "bg-muted"
                  )}>
                    {b.count}
                  </span>
                </button>
              ))}
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
                placeholder="Buscar sede, ciudad o dirección..."
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

      {error && (
        <div className="text-destructive text-sm flex items-center gap-2">
          <Icon name="AlertCircle" size={16} /> {error}
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-muted-foreground">
          <Icon name="Loader" size={28} className="animate-spin mx-auto mb-2" />
          Cargando sedes...
        </div>
      )}

      {!loading && (
      <>
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <SortTh label="Sede" sortKey="name" sort={sort} onSort={toggle} />
              <SortTh label="Ciudad" sortKey="city" sort={sort} onSort={toggle} />
              <SortTh label="Dirección" sortKey="address" sort={sort} onSort={toggle} />
              <SortTh label="Salas" sortKey="room_count" sort={sort} onSort={toggle} />
              <SortTh label="Estado" sortKey="active" sort={sort} onSort={toggle} />
              <th className="text-right font-medium px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                {locations.length === 0 ? 'No hay sedes. Crea la primera.' : 'No hay sedes que coincidan.'}
              </td></tr>
            )}
            {pageItems.map(loc => (
              <tr key={loc.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{loc.name}</div>
                  {loc.phone && <div className="text-xs text-muted-foreground">{loc.phone}</div>}
                </td>
                <td className="px-4 py-3 text-foreground">{loc.city}</td>
                <td className="px-4 py-3 text-muted-foreground">{loc.address || '—'}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                    <Icon name="Home" size={12} />
                    {loc.room_count || 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    loc.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", loc.active ? "bg-green-500" : "bg-gray-400")} />
                    {loc.active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(loc)} className="p-2 rounded-md hover:bg-muted transition-colors text-primary" title="Editar">
                      <Icon name="Edit3" size={16} />
                    </button>
                    <button onClick={() => toggleActive(loc)} className="p-2 rounded-md hover:bg-muted transition-colors" title={loc.active ? 'Desactivar' : 'Activar'}>
                      <Icon name={loc.active ? 'PowerOff' : 'Power'} size={16} />
                    </button>
                    <button onClick={() => handleDelete(loc)} className="p-2 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground" title="Eliminar">
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Editar sede' : 'Nueva sede'}
        onClose={() => !saving && setModalOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} iconName={saving ? 'Loader' : 'Check'}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="text-destructive text-sm flex items-center gap-2">
              <Icon name="AlertCircle" size={16} /> {formError}
            </div>
          )}
          <Input label="Nombre de la sede" required value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ej: Cali Templo" />
          <Input label="Ciudad" required value={form.city}
            onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
            placeholder="Ej: Cali" />
          <Input label="Dirección" value={form.address}
            onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
            placeholder="Ej: Calle 13 # 50-70" />
          <Input label="Teléfono" value={form.phone}
            onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="Opcional" />
        </div>
      </Modal>
    </div>
  );
};

export default LocationsTab;
