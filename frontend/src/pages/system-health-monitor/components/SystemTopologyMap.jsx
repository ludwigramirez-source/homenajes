import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const SystemTopologyMap = ({ locations, onLocationClick }) => {
  const [selectedRegion, setSelectedRegion] = useState('all');

  const regions = [
    { id: 'all', name: 'Todas las Regiones' },
    { id: 'bogota', name: 'Bogotá' },
    { id: 'antioquia', name: 'Antioquia' },
    { id: 'valle', name: 'Valle del Cauca' },
    { id: 'atlantico', name: 'Atlántico' }
  ];

  const getHealthColor = (status) => {
    const colors = {
      healthy: 'bg-success',
      warning: 'bg-warning',
      critical: 'bg-error',
      offline: 'bg-muted'
    };
    return colors?.[status] || colors?.offline;
  };

  const getHealthIcon = (status) => {
    const icons = {
      healthy: 'CheckCircle2',
      warning: 'AlertTriangle',
      critical: 'XCircle',
      offline: 'WifiOff'
    };
    return icons?.[status] || icons?.offline;
  };

  const filteredLocations = selectedRegion === 'all' 
    ? locations 
    : locations?.filter(loc => loc?.region === selectedRegion);

  return (
    <div className="bg-card border border-border rounded-lg shadow-elevation-md p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            Mapa de Topología del Sistema
          </h3>
          <p className="caption text-xs md:text-sm text-muted-foreground mt-1">
            Estado en tiempo real de todas las ubicaciones
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {regions?.map(region => (
            <button
              key={region?.id}
              onClick={() => setSelectedRegion(region?.id)}
              className={`px-3 py-1.5 rounded-lg caption text-xs font-medium
                transition-smooth press-scale
                ${selectedRegion === region?.id
                  ? 'bg-accent text-accent-foreground shadow-elevation-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              {region?.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {filteredLocations?.map(location => (
          <button
            key={location?.id}
            onClick={() => onLocationClick(location)}
            className="bg-background border border-border rounded-lg p-4
              transition-smooth hover:shadow-elevation-md hover-lift press-scale
              text-left"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-heading font-semibold text-sm text-foreground truncate">
                  {location?.name}
                </h4>
                <p className="caption text-xs text-muted-foreground mt-0.5">
                  {location?.city}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${getHealthColor(location?.status)} flex-shrink-0
                ${location?.status === 'healthy' ? 'animate-pulse' : ''}`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="caption text-xs text-muted-foreground">Pantallas:</span>
                <span className="caption text-xs font-medium text-foreground data-text">
                  {location?.activeScreens}/{location?.totalScreens}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="caption text-xs text-muted-foreground">Uptime:</span>
                <span className="caption text-xs font-medium text-foreground data-text">
                  {location?.uptime}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="caption text-xs text-muted-foreground">Latencia:</span>
                <span className="caption text-xs font-medium text-foreground data-text">
                  {location?.latency}ms
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
              <Icon 
                name={getHealthIcon(location?.status)} 
                size={14} 
                color={location?.status === 'healthy' ? 'var(--color-success)' : 
                       location?.status === 'warning' ? 'var(--color-warning)' : 
                       location?.status === 'critical' ? 'var(--color-error)' : 
                       'var(--color-muted-foreground)'}
              />
              <span className="caption text-xs font-medium"
                style={{
                  color: location?.status === 'healthy' ? 'var(--color-success)' : 
                         location?.status === 'warning' ? 'var(--color-warning)' : 
                         location?.status === 'critical' ? 'var(--color-error)' : 
                         'var(--color-muted-foreground)'
                }}>
                {location?.statusText}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SystemTopologyMap;