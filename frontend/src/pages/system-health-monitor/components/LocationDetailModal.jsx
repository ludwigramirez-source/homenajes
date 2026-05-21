import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const LocationDetailModal = ({ location, onClose }) => {
  if (!location) return null;

  const getHealthColor = (status) => {
    const colors = {
      healthy: 'text-success',
      warning: 'text-warning',
      critical: 'text-error',
      offline: 'text-muted-foreground'
    };
    return colors?.[status] || colors?.offline;
  };

  const getHealthBg = (status) => {
    const colors = {
      healthy: 'bg-success/10',
      warning: 'bg-warning/10',
      critical: 'bg-error/10',
      offline: 'bg-muted'
    };
    return colors?.[status] || colors?.offline;
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-card border border-border rounded-lg shadow-elevation-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e?.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border p-4 md:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
              {location?.name}
            </h2>
            <p className="caption text-sm text-muted-foreground mt-1">
              {location?.city} - {location?.region}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-smooth press-scale"
            aria-label="Cerrar"
          >
            <Icon name="X" size={24} />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <div className={`p-4 rounded-lg border ${getHealthBg(location?.status)} border-border`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-4 h-4 rounded-full
                ${location?.status === 'healthy' ? 'bg-success' : 
                  location?.status === 'warning' ? 'bg-warning' : 
                  location?.status === 'critical' ? 'bg-error' : 'bg-muted-foreground'}
                ${location?.status === 'healthy' ? 'animate-pulse' : ''}`}
              />
              <span className={`font-heading font-semibold text-lg ${getHealthColor(location?.status)}`}>
                {location?.statusText}
              </span>
            </div>
            <p className="caption text-sm text-foreground">
              Última actualización: {new Date(location.lastUpdate)?.toLocaleString('es-CO', {
                dateStyle: 'short',
                timeStyle: 'short',
                timeZone: 'America/Bogota'
              })} UTC-5
            </p>
          </div>

          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
              Métricas del Sistema
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-background border border-border rounded-lg p-4">
                <p className="caption text-xs text-muted-foreground mb-2">Pantallas Activas</p>
                <p className="text-2xl font-heading font-bold text-foreground data-text">
                  {location?.activeScreens}/{location?.totalScreens}
                </p>
              </div>
              <div className="bg-background border border-border rounded-lg p-4">
                <p className="caption text-xs text-muted-foreground mb-2">Uptime</p>
                <p className="text-2xl font-heading font-bold text-success data-text">
                  {location?.uptime}%
                </p>
              </div>
              <div className="bg-background border border-border rounded-lg p-4">
                <p className="caption text-xs text-muted-foreground mb-2">Latencia</p>
                <p className="text-2xl font-heading font-bold text-foreground data-text">
                  {location?.latency}ms
                </p>
              </div>
              <div className="bg-background border border-border rounded-lg p-4">
                <p className="caption text-xs text-muted-foreground mb-2">Throughput</p>
                <p className="text-2xl font-heading font-bold text-foreground data-text">
                  {location?.throughput} Mbps
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
              Estado de Componentes
            </h3>
            <div className="space-y-3">
              {location?.components?.map((component, index) => (
                <div key={index} className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Icon name={component?.icon} size={20} color="var(--color-foreground)" />
                      <span className="font-heading font-medium text-sm text-foreground">
                        {component?.name}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded caption text-xs font-medium
                      ${component?.status === 'operational' ? 'bg-success/10 text-success' : 
                        component?.status === 'degraded'? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'}`}>
                      {component?.status === 'operational' ? 'Operacional' : 
                       component?.status === 'degraded' ? 'Degradado' : 'Fuera de Línea'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {component?.metrics?.map((metric, idx) => (
                      <div key={idx}>
                        <p className="caption text-xs text-muted-foreground mb-1">
                          {metric?.label}
                        </p>
                        <p className="caption text-sm font-medium text-foreground data-text">
                          {metric?.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
              Alertas Recientes
            </h3>
            <div className="space-y-2">
              {location?.recentAlerts?.map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg border
                  ${alert?.severity === 'critical' ? 'bg-error/10 border-error/20' : 
                    alert?.severity === 'warning'? 'bg-warning/10 border-warning/20' : 'bg-accent/10 border-accent/20'}`}>
                  <div className="flex items-start gap-3">
                    <Icon 
                      name={alert?.severity === 'critical' ? 'AlertCircle' : 
                            alert?.severity === 'warning' ? 'AlertTriangle' : 'Info'} 
                      size={16}
                      color={alert?.severity === 'critical' ? 'var(--color-error)' : 
                             alert?.severity === 'warning' ? 'var(--color-warning)' : 
                             'var(--color-accent)'}
                      className="flex-shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="caption text-sm font-medium text-foreground">
                        {alert?.message}
                      </p>
                      <p className="caption text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp)?.toLocaleString('es-CO', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                          timeZone: 'America/Bogota'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <Button variant="default" iconName="RefreshCw" iconPosition="left">
              Actualizar Datos
            </Button>
            <Button variant="outline" iconName="Settings" iconPosition="left">
              Configurar
            </Button>
            <Button variant="outline" iconName="Download" iconPosition="left">
              Exportar Reporte
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDetailModal;