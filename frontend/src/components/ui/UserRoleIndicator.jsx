import React, { useState } from 'react';
import Icon from '../AppIcon';

const UserRoleIndicator = ({ role = 'administrator', userName = 'Usuario', className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const roleConfig = {
    executive: {
      label: 'Ejecutivo',
      icon: 'Briefcase',
      color: 'var(--color-accent)',
      bgColor: 'bg-accent/10',
      description: 'Acceso a vistas estratégicas y métricas de alto nivel'
    },
    operations: {
      label: 'Operaciones',
      icon: 'Activity',
      color: 'var(--color-primary)',
      bgColor: 'bg-primary/10',
      description: 'Monitoreo en tiempo real y gestión operativa'
    },
    marketing: {
      label: 'Marketing',
      icon: 'TrendingUp',
      color: 'var(--color-success)',
      bgColor: 'bg-success/10',
      description: 'Análisis de engagement y métricas de cliente'
    },
    administrator: {
      label: 'Administrador',
      icon: 'Shield',
      color: 'var(--color-accent)',
      bgColor: 'bg-accent/10',
      description: 'Acceso completo al sistema y configuración'
    },
    technical: {
      label: 'Técnico',
      icon: 'Server',
      color: 'var(--color-secondary)',
      bgColor: 'bg-secondary/10',
      description: 'Monitoreo de infraestructura y salud del sistema'
    }
  };

  const config = roleConfig?.[role] || roleConfig?.administrator;

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg
        ${config?.bgColor} transition-smooth hover:shadow-elevation-sm
        cursor-pointer
      `}>
        <Icon name={config?.icon} size={16} color={config?.color} />
        <div className="hidden sm:block">
          <div className="caption text-xs font-medium" style={{ color: config?.color }}>
            {config?.label}
          </div>
        </div>
      </div>
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 w-64 p-3
          bg-popover border border-border rounded-lg shadow-elevation-lg
          z-[110] animate-fade-in">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${config?.bgColor}`}>
              <Icon name={config?.icon} size={20} color={config?.color} />
            </div>
            <div className="flex-1">
              <div className="font-heading font-medium text-sm text-foreground mb-1">
                {userName}
              </div>
              <div className="caption text-xs font-medium mb-2" style={{ color: config?.color }}>
                Rol: {config?.label}
              </div>
              <div className="caption text-xs text-muted-foreground leading-relaxed">
                {config?.description}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoleIndicator;