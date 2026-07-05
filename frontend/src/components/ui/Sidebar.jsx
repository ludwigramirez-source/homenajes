import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

// Navegacion lateral. Cada grupo/item puede declarar `roles` para limitar su
// visibilidad. Sin `roles` = visible para todos los autenticados.
const NAV_GROUPS = [
  {
    title: 'Operación',
    items: [
      { label: 'Homenajes', path: '/memorials', icon: 'BookOpen', match: ['/memorials'] },
      { label: 'Tablón de mensajes', path: '/tablon', icon: 'MessageSquare', match: ['/tablon'] },
      { label: 'Books', path: '/books', icon: 'Mail', match: ['/books'] },
      { label: 'Salas y sedes', path: '/salas', icon: 'LayoutGrid', match: ['/salas'], roles: ['admin'] },
      { label: 'Crear tributo', path: '/tribute-creation-studio', icon: 'Heart', match: ['/tribute-creation-studio'], roles: ['admin', 'operator'] }
    ]
  },
  {
    title: 'Análisis',
    items: [
      { label: 'Resumen ejecutivo', path: '/executive-overview', icon: 'LayoutDashboard', match: ['/executive-overview'] },
      { label: 'Centro de operaciones', path: '/operations-control-center', icon: 'Activity', match: ['/operations-control-center'] },
      { label: 'Análisis detallado', path: '/analytics-hub', icon: 'BarChart3', match: ['/analytics-hub'] },
      { label: 'Rendimiento por sede', path: '/location-performance', icon: 'MapPin', match: ['/location-performance'] },
      { label: 'Monitoreo técnico', path: '/system-health-monitor', icon: 'Server', match: ['/system-health-monitor'], roles: ['admin'] }
    ]
  },
  {
    title: 'Sistema',
    roles: ['admin'],
    items: [
      { label: 'Usuarios', path: '/usuarios', icon: 'Users', match: ['/usuarios'], roles: ['admin'] },
      { label: 'Moderación IA', path: '/llm', icon: 'Sparkles', match: ['/llm'], roles: ['admin'] },
      { label: 'Correo saliente', path: '/configuracion-correo', icon: 'Mail', match: ['/configuracion-correo'], roles: ['admin'] }
    ]
  }
];

const Sidebar = ({ mobileOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Filtra items/grupos segun el rol del usuario actual.
  const role = user?.role;
  const canSee = (entry) => !entry.roles || entry.roles.includes(role);
  const visibleGroups = NAV_GROUPS
    .filter(canSee)
    .map(g => ({ ...g, items: g.items.filter(canSee) }))
    .filter(g => g.items.length > 0);

  const isActive = (item) =>
    item.match.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const initial = (user?.full_name || user?.username || '?').trim().charAt(0).toUpperCase();

  return (
    <>
      {/* Overlay en movil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 flex flex-col transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ background: '#1a7472' }}
      >
        {/* Marca: solo el logo (ya contiene el nombre) + bajada, centrados */}
        <div className="px-5 py-5 border-b border-white/15 text-center">
          <img
            src="/logo-los-olivos-blanco.png"
            alt="Los Olivos"
            className="mx-auto w-auto"
            style={{ height: '48px', maxWidth: '170px', objectFit: 'contain' }}
          />
          <p className="text-xs text-white/65 mt-2 font-body">Homenajes web</p>
        </div>

        {/* Navegacion */}
        <nav className="flex-1 overflow-y-auto py-4">
          {visibleGroups.map(group => (
            <div key={group.title} className="mb-5">
              <p className="px-5 mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-white/45">
                {group.title}
              </p>
              <div className="space-y-0.5 px-2">
                {group.items.map(item => {
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-md text-sm font-body transition-colors relative',
                        active ? 'text-white' : 'text-white/75 hover:text-white hover:bg-white/5'
                      )}
                      style={active ? { background: 'rgba(255,255,255,0.10)' } : undefined}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r"
                          style={{ background: '#f0c040' }} />
                      )}
                      <Icon name={item.icon} size={18} color={active ? '#f0c040' : 'rgba(255,255,255,0.75)'} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Usuario + salir */}
        <div className="border-t border-white/15 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
              style={{ background: '#f0c040', color: '#1a4a48' }}>
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white font-medium truncate">{user?.full_name || user?.username || 'Usuario'}</p>
              <p className="text-xs text-white/60 truncate capitalize">{user?.role || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/75 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Icon name="LogOut" size={18} color="rgba(255,255,255,0.75)" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
