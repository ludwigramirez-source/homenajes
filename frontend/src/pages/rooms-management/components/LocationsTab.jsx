import React, { useEffect, useState } from 'react';
import { locationsService } from '../../../services/api';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';
import Modal from './Modal';

const emptyForm = { name: '', city: '', address: '', phone: '' };

const LocationsTab = ({ registerCreate }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="space-y-4">
      {/* Toolbar SIEMPRE visible (no depende del estado de carga) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Sedes / Funerarias</h3>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Cargando...' : `${locations.length} ${locations.length === 1 ? 'sede registrada' : 'sedes registradas'}`}
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
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-3">Sede</th>
              <th className="text-left font-medium px-4 py-3">Ciudad</th>
              <th className="text-left font-medium px-4 py-3">Dirección</th>
              <th className="text-left font-medium px-4 py-3">Salas</th>
              <th className="text-left font-medium px-4 py-3">Estado</th>
              <th className="text-right font-medium px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No hay sedes. Crea la primera.</td></tr>
            )}
            {locations.map(loc => (
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
