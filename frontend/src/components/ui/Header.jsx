import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const navigationItems = [
    {
      label: 'Resumen Ejecutivo',
      path: '/executive-overview',
      icon: 'LayoutDashboard',
      description: 'Vista estratégica general'
    },
    {
      label: 'Centro de Operaciones',
      path: '/operations-control-center',
      icon: 'Activity',
      description: 'Monitoreo en tiempo real'
    },
    {
      label: 'Análisis Detallado',
      path: '/analytics-hub',
      icon: 'BarChart3',
      description: 'Análisis comprensivo'
    },
    {
      label: 'Rendimiento por Ubicación',
      path: '/location-performance',
      icon: 'MapPin',
      description: 'Comparación de ubicaciones'
    },
    {
      label: 'Homenajes',
      path: '/memorials',
      icon: 'BookOpen',
      description: 'Listado de homenajes creados'
    },
    {
      label: 'Salas',
      path: '/salas',
      icon: 'LayoutGrid',
      description: 'Gestión de sedes y salas'
    },
    {
      label: 'Crear Tributo',
      path: '/tribute-creation-studio',
      icon: 'Heart',
      description: 'Estudio de creación'
    }
  ];

  const moreItems = [
    {
      label: 'Monitoreo Técnico',
      path: '/system-health-monitor',
      icon: 'Server',
      description: 'Salud del sistema'
    }
  ];

  const isActivePath = (path) => location?.pathname === path;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 z-[100] transition-smooth"
        style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a7c9d2, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute top-0 left-1/2 w-20 h-20 rounded-full opacity-5 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)', transform: 'translate(-50%, -40%)' }} />

        <div className="h-full px-6 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-8">
            <Link
              to="/executive-overview"
              className="flex items-center gap-3 hover:opacity-80 transition-smooth"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Icon name="Heart" size={22} color="#ffffff" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-heading font-bold text-white leading-none">
                  Los Olivos
                </h1>
                <p className="text-xs text-white/70 mt-0.5 font-body">
                  Dashboard
                </p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navigationItems?.map((item) => (
                <Link
                  key={item?.path}
                  to={item?.path}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg
                    font-heading font-medium text-sm
                    transition-smooth hover-lift press-scale
                    ${isActivePath(item?.path)
                      ? 'bg-white/20 text-white shadow-sm border border-white/30'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }
                  `}
                  title={item?.description}
                >
                  <Icon name={item?.icon} size={16} color={isActivePath(item?.path) ? '#ffffff' : 'rgba(255,255,255,0.8)'} />
                  <span>{item?.label}</span>
                </Link>
              ))}

              <div className="relative group">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg
                    font-heading font-medium text-sm text-white/80
                    hover:bg-white/10 hover:text-white transition-smooth hover-lift press-scale"
                >
                  <Icon name="MoreHorizontal" size={16} color="rgba(255,255,255,0.8)" />
                  <span>Más</span>
                </button>

                <div className="absolute top-full right-0 mt-2 w-64 bg-white
                  rounded-lg shadow-elevation-lg border border-border
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-smooth origin-top-right">
                  {moreItems?.map((item) => (
                    <Link
                      key={item?.path}
                      to={item?.path}
                      className={`
                        flex items-center gap-3 px-4 py-3
                        hover:bg-muted transition-smooth
                        first:rounded-t-lg last:rounded-b-lg
                        ${isActivePath(item?.path) ? 'bg-primary/10' : ''}
                      `}
                    >
                      <Icon name={item?.icon} size={18} color="var(--color-primary)" />
                      <div className="flex-1">
                        <div className="font-heading font-medium text-sm text-foreground">
                          {item?.label}
                        </div>
                        <div className="caption text-muted-foreground text-xs mt-0.5">
                          {item?.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              <span className="text-xs text-white/80 font-body">
                Actualizado: 17:45
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Icon name="User" size={14} color="rgba(255,255,255,0.9)" />
              <span className="text-xs font-medium text-white font-body">
                {user?.full_name || user?.username || 'Usuario'}
              </span>
              <span className="text-xs text-white/60">({user?.role})</span>
            </div>

            <button
              onClick={logout}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/20 transition-smooth"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              title="Cerrar sesion"
            >
              <Icon name="LogOut" size={14} color="rgba(255,255,255,0.9)" />
              <span className="text-xs font-medium text-white font-body">Salir</span>
            </button>

            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-smooth press-scale"
              aria-label="Toggle menu"
            >
              <Icon name={mobileMenuOpen ? 'X' : 'Menu'} size={24} color="#ffffff" />
            </button>
          </div>
        </div>
      </header>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[90] lg:hidden pt-16"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 100%)' }}
          onClick={toggleMobileMenu}
        >
          <nav className="p-6 space-y-2">
            {[...navigationItems, ...moreItems]?.map((item) => (
              <Link
                key={item?.path}
                to={item?.path}
                onClick={toggleMobileMenu}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  font-heading font-medium transition-smooth
                  ${isActivePath(item?.path)
                    ? 'bg-white/20 text-white border border-white/30' :'text-white/80 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon name={item?.icon} size={20} color={isActivePath(item?.path) ? '#ffffff' : 'rgba(255,255,255,0.8)'} />
                <div className="flex-1">
                  <div>{item?.label}</div>
                  <div className="text-xs opacity-70 mt-0.5 font-body">
                    {item?.description}
                  </div>
                </div>
              </Link>
            ))}

            <div className="pt-4 mt-4 border-t border-white/20 space-y-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                <span className="text-xs text-white/80 font-body">
                  Última actualización: 17:45 UTC-5
                </span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Icon name="User" size={16} color="rgba(255,255,255,0.9)" />
                <span className="text-xs font-medium text-white font-body">
                  Rol: Administrador
                </span>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;