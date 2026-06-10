import React, { useEffect, useMemo, useState } from 'react';
import { locationsService, roomsService } from '../../../services/api';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';
import Modal from './Modal';

const ROOM_TYPES = [
  { value: 'ejecutiva', label: 'Ejecutiva', abbr: 'EJE' },
  { value: 'presidencial', label: 'Presidencial', abbr: 'PRE' },
  { value: 'vip', label: 'VIP', abbr: 'VIP' }
];

const typeLabel = (t) => ROOM_TYPES.find(rt => rt.value === t)?.label || '—';
const typeBadgeClass = (t) => ({
  ejecutiva: 'bg-blue-100 text-blue-700',
  presidencial: 'bg-purple-100 text-purple-700',
  vip: 'bg-amber-100 text-amber-700'
}[t] || 'bg-gray-100 text-gray-600');

// Genera un slug corto de la sede para construir codigos de sala.
const sedeSlug = (name) => (name || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

const emptyForm = { location_id: '', room_type: '', name: '', code: '', capacity: '' };

const RoomsTab = () => {
  const [rooms, setRooms] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSede, setFilterSede] = useState('');
  const [filterType, setFilterType] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [r, l] = await Promise.all([
        roomsService.getAll(),
        locationsService.getAll()
      ]);
      setRooms(r?.data || []);
      setLocations(l?.data || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Error cargando salas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const locationOptions = useMemo(
    () => locations.map(l => ({ value: l.id, label: `${l.name} (${l.city})` })),
    [locations]
  );

  const filtered = useMemo(() => {
    return rooms.filter(r => {
      if (filterSede && r.location_id !== filterSede) return false;
      if (filterType && r.room_type !== filterType) return false;
      return true;
    });
  }, [rooms, filterSede, filterType]);

  // Sugiere un codigo unico: <SLUG>-<ABBR>-<NN> contando las salas existentes
  // de esa sede y tipo.
  const suggestCode = (locationId, roomType) => {
    const loc = locations.find(l => l.id === locationId);
    const meta = ROOM_TYPES.find(rt => rt.value === roomType);
    if (!loc || !meta) return '';
    const slug = sedeSlug(loc.name);
    const sameCount = rooms.filter(r => r.location_id === locationId && r.room_type === roomType).length;
    const n = String(sameCount + 1).padStart(2, '0');
    return `${slug}-${meta.abbr}-${n}`;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, location_id: filterSede || '' });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (room) => {
    setEditing(room);
    setForm({
      location_id: room.location_id || '',
      room_type: room.room_type || '',
      name: room.name || '',
      code: room.code || '',
      capacity: room.capacity != null ? String(room.capacity) : ''
    });
    setFormError(null);
    setModalOpen(true);
  };

  // Al elegir sede o tipo en modo creacion, autocompletar nombre y codigo si estan vacios.
  const onPickType = (roomType) => {
    setForm(f => {
      const next = { ...f, room_type: roomType };
      if (!editing) {
        const meta = ROOM_TYPES.find(rt => rt.value === roomType);
        const loc = locations.find(l => l.id === f.location_id);
        const sameCount = rooms.filter(r => r.location_id === f.location_id && r.room_type === roomType).length;
        if (meta) next.name = `Sala ${meta.label} ${sameCount + 1}`;
        if (loc && meta) next.code = suggestCode(f.location_id, roomType);
      }
      return next;
    });
  };

  const onPickSede = (locationId) => {
    setForm(f => {
      const next = { ...f, location_id: locationId };
      if (!editing && f.room_type) {
        next.code = suggestCode(locationId, f.room_type);
        const meta = ROOM_TYPES.find(rt => rt.value === f.room_type);
        const sameCount = rooms.filter(r => r.location_id === locationId && r.room_type === f.room_type).length;
        if (meta) next.name = `Sala ${meta.label} ${sameCount + 1}`;
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.location_id) { setFormError('Selecciona una sede'); return; }
    if (!form.name.trim()) { setFormError('El nombre es obligatorio'); return; }
    if (!form.code.trim()) { setFormError('El código es obligatorio'); return; }
    setSaving(true);
    setFormError(null);
    const payload = {
      location_id: form.location_id,
      room_type: form.room_type || null,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      capacity: form.capacity ? parseInt(form.capacity, 10) : null
    };
    try {
      if (editing) {
        await roomsService.update(editing.id, payload);
      } else {
        await roomsService.create(payload);
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Error guardando la sala');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (room) => {
    try {
      await roomsService.update(room.id, { active: !room.active });
      await load();
    } catch (e) {
      alert('Error: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Se eliminará la sala "${room.name}". Si tiene homenajes asociados también se borrarán. ¿Continuar?`)) return;
    try {
      await roomsService.remove(room.id);
      await load();
    } catch (e) {
      alert('Error eliminando: ' + (e.response?.data?.error || e.message));
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Icon name="Loader" size={28} className="animate-spin mx-auto mb-2" />
        Cargando salas...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Salas de velación</h3>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {rooms.length} {rooms.length === 1 ? 'sala' : 'salas'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterSede}
            onChange={(e) => setFilterSede(e.target.value)}
            className="px-3 py-2 rounded-md border border-border bg-background text-sm"
          >
            <option value="">Todas las sedes</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-md border border-border bg-background text-sm"
          >
            <option value="">Todos los tipos</option>
            {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <Button iconName="Plus" onClick={openCreate}>Nueva sala</Button>
        </div>
      </div>

      {error && (
        <div className="text-destructive text-sm flex items-center gap-2">
          <Icon name="AlertCircle" size={16} /> {error}
        </div>
      )}

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-3">Sala</th>
              <th className="text-left font-medium px-4 py-3">Tipo</th>
              <th className="text-left font-medium px-4 py-3">Sede</th>
              <th className="text-left font-medium px-4 py-3">Código</th>
              <th className="text-left font-medium px-4 py-3">Cap.</th>
              <th className="text-left font-medium px-4 py-3">Estado</th>
              <th className="text-right font-medium px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No hay salas que coincidan.</td></tr>
            )}
            {filtered.map(room => (
              <tr key={room.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{room.name}</td>
                <td className="px-4 py-3">
                  {room.room_type
                    ? <span className={cn("inline-flex px-2 py-1 rounded-full text-xs font-medium", typeBadgeClass(room.room_type))}>{typeLabel(room.room_type)}</span>
                    : <span className="text-muted-foreground text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-foreground">{room.location_name}<div className="text-xs text-muted-foreground">{room.location_city}</div></td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{room.code}</td>
                <td className="px-4 py-3 text-foreground">{room.capacity || '—'}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    room.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", room.active ? "bg-green-500" : "bg-gray-400")} />
                    {room.active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(room)} className="p-2 rounded-md hover:bg-muted transition-colors text-primary" title="Editar">
                      <Icon name="Edit3" size={16} />
                    </button>
                    <button onClick={() => toggleActive(room)} className="p-2 rounded-md hover:bg-muted transition-colors" title={room.active ? 'Desactivar' : 'Activar'}>
                      <Icon name={room.active ? 'PowerOff' : 'Power'} size={16} />
                    </button>
                    <button onClick={() => handleDelete(room)} className="p-2 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground" title="Eliminar">
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar sala' : 'Nueva sala'}
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
          <Select
            label="Sede"
            placeholder="Selecciona una sede"
            required
            options={locationOptions}
            value={form.location_id}
            onChange={onPickSede}
            searchable
          />
          <Select
            label="Tipo de sala"
            placeholder="Selecciona el tipo"
            options={ROOM_TYPES.map(t => ({ value: t.value, label: t.label }))}
            value={form.room_type}
            onChange={onPickType}
          />
          <Input label="Nombre de la sala" required value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ej: Sala Ejecutiva 1" />
          <Input label="Código (único)" required value={form.code}
            onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
            description="Identificador único de la sala. Se autocompleta según sede y tipo."
            placeholder="Ej: CALITEMPLO-EJE-01" />
          <Input type="number" label="Capacidad" value={form.capacity}
            onChange={(e) => setForm(f => ({ ...f, capacity: e.target.value }))}
            placeholder="Opcional (n.º de personas)" />
        </div>
      </Modal>
    </div>
  );
};

export default RoomsTab;
