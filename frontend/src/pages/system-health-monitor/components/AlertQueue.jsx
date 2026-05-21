import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const AlertQueue = ({ alerts, onResolve, onEscalate }) => {
  const [filter, setFilter] = useState('all');

  const severityConfig = {
    critical: {
      color: 'text-error',
      bg: 'bg-error/10',
      border: 'border-error/20',
      icon: 'AlertCircle'
    },
    warning: {
      color: 'text-warning',
      bg: 'bg-warning/10',
      border: 'border-warning/20',
      icon: 'AlertTriangle'
    },
    info: {
      color: 'text-accent',
      bg: 'bg-accent/10',
      border: 'border-accent/20',
      icon: 'Info'
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts?.filter(alert => alert?.severity === filter);

  const getTimeSince = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(timestamp)) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-elevation-md p-4 md:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
            Cola de Alertas
          </h3>
          <p className="caption text-xs text-muted-foreground mt-1">
            {filteredAlerts?.length} alertas activas
          </p>
        </div>
        <div className="flex gap-2">
          {['all', 'critical', 'warning', 'info']?.map(severity => (
            <button
              key={severity}
              onClick={() => setFilter(severity)}
              className={`px-2 py-1 rounded caption text-xs font-medium
                transition-smooth press-scale
                ${filter === severity
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              {severity === 'all' ? 'Todas' : severity?.charAt(0)?.toUpperCase() + severity?.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {filteredAlerts?.map(alert => {
          const config = severityConfig?.[alert?.severity];
          return (
            <div
              key={alert?.id}
              className={`border ${config?.border} ${config?.bg} rounded-lg p-3
                transition-smooth hover:shadow-elevation-sm`}
            >
              <div className="flex items-start gap-3">
                <Icon 
                  name={config?.icon} 
                  size={18} 
                  color={alert?.severity === 'critical' ? 'var(--color-error)' : 
                         alert?.severity === 'warning' ? 'var(--color-warning)' : 
                         'var(--color-accent)'}
                  className="flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className={`font-heading font-semibold text-sm ${config?.color}`}>
                      {alert?.title}
                    </h4>
                    <span className="caption text-xs text-muted-foreground whitespace-nowrap">
                      {getTimeSince(alert?.timestamp)}
                    </span>
                  </div>
                  <p className="caption text-xs text-foreground mb-2">
                    {alert?.description}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="MapPin" size={12} color="var(--color-muted-foreground)" />
                    <span className="caption text-xs text-muted-foreground">
                      {alert?.location}
                    </span>
                  </div>
                  {alert?.autoEscalateIn && (
                    <div className="flex items-center gap-2 mb-3 px-2 py-1 bg-background rounded">
                      <Icon name="Clock" size={12} color="var(--color-warning)" />
                      <span className="caption text-xs text-warning">
                        Auto-escalación en {alert?.autoEscalateIn}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onResolve(alert?.id)}
                      className="px-3 py-1.5 bg-success text-success-foreground
                        rounded caption text-xs font-medium
                        transition-smooth hover-lift press-scale"
                    >
                      Resolver
                    </button>
                    <button
                      onClick={() => onEscalate(alert?.id)}
                      className="px-3 py-1.5 bg-warning text-warning-foreground
                        rounded caption text-xs font-medium
                        transition-smooth hover-lift press-scale"
                    >
                      Escalar
                    </button>
                    <button
                      className="px-3 py-1.5 bg-muted text-muted-foreground
                        rounded caption text-xs font-medium
                        transition-smooth hover-lift press-scale"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertQueue;