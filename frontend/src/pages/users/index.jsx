import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { usersService, locationsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/AppIcon';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { cn } from '../../utils/cn';
import Modal from '../rooms-management/components/Modal';
import { useTableSort, SortTh } from '../../components/ui/sortable';

// Roles que la UI permite asignar, con etiqueta legible.
const ROLES = [
  { value: 'admin', label: 'Superadministrador', desc: 'Acceso total al sistema' },
  { value: 'operator', label: 'Operador de sede', desc: 'Crea tributos y ve datos de su sede' },
  { value: 'auditor', label: 'Auditor', desc: 'Solo consulta de análisis' }
];
const roleLabel = (r) => ROLES.find(x => x.value === r)?.label || r;
const roleBadge = (r) => ({
  admin: 'bg-purple-100 text-purple-700',
  operator: 'bg-blue-100 text-blue-700',
  auditor: 'bg-amber-100 text-amber-700',
  supervisor: 'bg-gray-100 text-gray-600'
}[r] || 'bg-gray-100 text-gray-600');

const SORT_ACCESSORS = {
  full_name: (u) => u.full_name,
  username: (u) => u.username,
  role: (u) => u.role,
  location_name: (u) => u.location_name || '',
  active: (u) => (u.active ? 1 : 0)
};

const emptyForm = { full_name: '', username: '', email: '', password: '', role: '', location_id: '', active: true };

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [u, l] = await Promise.all([usersService.getAll(), locationsService.getAll()]);
      setUsers(u?.data || []);
      setLocations(l?.data || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Error cargando usuarios');
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
    const q = query.trim().toLowerCase();
    return users.filter(u => {
      if (filterRole && u.role !== filterRole) return false;
      if (q && !(
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [users, query, filterRole]);

  const { sorted, sort, toggle } = useTableSort(filtered, SORT_ACCESSORS);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };
  const openEdit = (u) => {
    setEditing(u);
    setForm({
      full_name: u.full_name || '',
      username: u.username || '',
      email: u.email || '',
      password: '',
      role: u.role || '',
      location_id: u.location_id || '',
      active: u.active
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { setFormError('El nombre es obligatorio'); return; }
    if (!form.username.trim()) { setFormError('El usuario es obligatorio'); return; }
    if (!form.email.trim()) { setFormError('El correo es obligatorio'); return; }
    if (!form.role) { setFormError('Selecciona un rol'); return; }
    if (!editing && form.password.length < 6) { setFormError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (form.role === 'operator' && !form.location_id) { setFormError('El operador de sede requiere una sede'); return; }

    setSaving(true);
    setFormError(null);
    const payload = {
      full_name: form.full_name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      role: form.role,
      location_id: form.role === 'operator' ? form.location_id : null,
      active: form.active
    };
    if (form.password) payload.password = form.password;

    try {
      if (editing) await usersService.update(editing.id, payload);
      else await usersService.create(payload);
      setModalOpen(false);
      await load();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Error guardando el usuario');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    try { await usersService.update(u.id, { active: !u.active }); await load(); }
    catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)); }
  };

  const handleDelete = async (u) => {
    if (u.id === currentUser?.id) { alert('No puedes eliminar tu propio usuario'); return; }
    if (!window.confirm(`¿Eliminar el usuario "${u.full_name}"? Esta acción no se puede deshacer.`)) return;
    try { await usersService.remove(u.id); await load(); }
    catch (e) { alert('Error eliminando: ' + (e.response?.data?.error || e.message)); }
  };

  return (
    <>
      <Helmet><title>Usuarios | SERCOFUN</title></Helmet>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="relative overflow-hidden sticky top-0 z-40"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
          <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Icon name="Users" size={20} color="#ffffff" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Usuarios</h1>
                  <p className="text-xs text-white/70 font-body">Gestión de accesos y privilegios</p>
                </div>
              </div>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-bold text-sm transition-smooth hover-lift press-scale text-primary"
                style={{ background: '#ffffff' }}
              >
                <Icon name="Plus" size={16} color="#1a7472" />
                Nuevo usuario
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-6 py-6">
          <div className="bg-card rounded-lg border border-border shadow-elevation-md p-6 space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Usuarios del sistema</h3>
                <p className="text-sm text-muted-foreground">
                  {loading ? 'Cargando...' : `${filtered.length} de ${users.length} ${users.length === 1 ? 'usuario' : 'usuarios'}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar nombre, usuario o correo..."
                    className="pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 rounded-md border border-border bg-background text-sm">
                  <option value="">Todos los roles</option>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>

            {error && (
              <div className="text-destructive text-sm flex items-center gap-2"><Icon name="AlertCircle" size={16} /> {error}</div>
            )}

            {loading && (
              <div className="py-12 text-center text-muted-foreground">
                <Icon name="Loader" size={28} className="animate-spin mx-auto mb-2" /> Cargando usuarios...
              </div>
            )}

            {!loading && (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <SortTh label="Nombre" sortKey="full_name" sort={sort} onSort={toggle} />
                    <SortTh label="Usuario" sortKey="username" sort={sort} onSort={toggle} />
                    <SortTh label="Rol" sortKey="role" sort={sort} onSort={toggle} />
                    <SortTh label="Sede" sortKey="location_name" sort={sort} onSort={toggle} />
                    <SortTh label="Estado" sortKey="active" sort={sort} onSort={toggle} />
                    <th className="text-right font-medium px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No hay usuarios que coincidan.</td></tr>
                  )}
                  {sorted.map(u => (
                    <tr key={u.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{u.full_name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 text-foreground font-mono text-xs">{u.username}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex px-2 py-1 rounded-full text-xs font-medium', roleBadge(u.role))}>{roleLabel(u.role)}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{u.location_name || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                          u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', u.active ? 'bg-green-500' : 'bg-gray-400')} />
                          {u.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(u)} className="p-2 rounded-md hover:bg-muted transition-colors text-primary" title="Editar">
                            <Icon name="Edit3" size={16} />
                          </button>
                          <button onClick={() => toggleActive(u)} className="p-2 rounded-md hover:bg-muted transition-colors" title={u.active ? 'Desactivar' : 'Activar'}>
                            <Icon name={u.active ? 'PowerOff' : 'Power'} size={16} />
                          </button>
                          <button onClick={() => handleDelete(u)} className="p-2 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground" title="Eliminar">
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
          </div>
        </div>

        <Modal
          open={modalOpen}
          title={editing ? 'Editar usuario' : 'Nuevo usuario'}
          onClose={() => !saving && setModalOpen(false)}
          footer={
            <>
              <button onClick={() => setModalOpen(false)} disabled={saving}
                className="px-4 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors" style={{ background: '#1a7472' }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {formError && (
              <div className="text-destructive text-sm flex items-center gap-2"><Icon name="AlertCircle" size={16} /> {formError}</div>
            )}
            <Input label="Nombre completo" required value={form.full_name}
              onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Ej: María Gómez" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Usuario" required value={form.username}
                onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))} placeholder="ej: mgomez" />
              <Input label="Correo" type="email" required value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@sercofun.co" />
            </div>
            <Input
              label={editing ? 'Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
              type="password" value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder={editing ? '••••••' : 'Mínimo 6 caracteres'} />
            <Select
              label="Rol" required
              placeholder="Selecciona un rol"
              options={ROLES.map(r => ({ value: r.value, label: r.label, description: r.desc }))}
              value={form.role}
              onChange={(v) => setForm(f => ({ ...f, role: v }))}
            />
            {form.role === 'operator' && (
              <Select
                label="Sede asignada" required
                placeholder="Selecciona la sede del operador"
                options={locationOptions}
                value={form.location_id}
                onChange={(v) => setForm(f => ({ ...f, location_id: v }))}
                searchable
              />
            )}
          </div>
        </Modal>
      </div>
    </>
  );
};

export default UsersPage;
