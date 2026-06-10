import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

// Navegacion lateral. Agrupada por dominio: Operacion (uso diario) y Analisis.
const NAV_GROUPS = [
  {
    title: 'Operación',
    items: [
      { label: 'Homenajes', path: '/memorials', icon: 'BookOpen', match: ['/memorials'] },
      { label: 'Salas y sedes', path: '/salas', icon: 'LayoutGrid', match: ['/salas'] },
      { label: 'Crear tributo', path: '/tribute-creation-studio', icon: 'Heart', match: ['/tribute-creation-studio'] }
    ]
  },
  {
    title: 'Análisis',
    items: [
      { label: 'Resumen ejecutivo', path: '/executive-overview', icon: 'LayoutDashboard', match: ['/executive-overview'] },
      { label: 'Centro de operaciones', path: '/operations-control-center', icon: 'Activity', match: ['/operations-control-center'] },
      { label: 'Análisis detallado', path: '/analytics-hub', icon: 'BarChart3', match: ['/analytics-hub'] },
      { label: 'Rendimiento por sede', path: '/location-performance', icon: 'MapPin', match: ['/location-performance'] },
      { label: 'Monitoreo técnico', path: '/system-health-monitor', icon: 'Server', match: ['/system-health-monitor'] }
    ]
  }
];

const Sidebar = ({ mobileOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

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
        {/* Marca */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/15">
          <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30 flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Icon name="Heart" size={20} color="#ffffff" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-heading font-semibold text-white leading-none truncate">Los Olivos</h1>
            <p className="text-xs text-white/65 mt-1 font-body">Homenajes digitales</p>
          </div>
        </div>

        {/* Navegacion */}
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_GROUPS.map(group => (
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
