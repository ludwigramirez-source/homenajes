import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const DataRefreshStatus = ({ 
  lastUpdate = new Date(), 
  isConnected = true, 
  autoRefresh = true,
  refreshInterval = 300000,
  onRefresh,
  className = '' 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const diff = Math.floor((now - new Date(lastUpdate)) / 1000);
      
      if (diff < 60) {
        setTimeAgo('Hace un momento');
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        setTimeAgo(`Hace ${minutes} min`);
      } else {
        const hours = Math.floor(diff / 3600);
        setTimeAgo(`Hace ${hours}h`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const formatTime = (date) => {
    return new Date(date)?.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  const getStatusColor = () => {
    if (!isConnected) return 'bg-error';
    if (autoRefresh) return 'bg-success';
    return 'bg-warning';
  };

  const getStatusIcon = () => {
    if (!isConnected) return 'WifiOff';
    if (autoRefresh) return 'RefreshCw';
    return 'Pause';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Desconectado';
    if (autoRefresh) return 'Sincronizando';
    return 'Pausado';
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg transition-smooth hover:bg-muted/80 press-scale"
        aria-label="Estado de actualización de datos"
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} 
          ${isConnected && autoRefresh ? 'animate-pulse' : ''}`}
        />
        <span className="caption text-xs text-muted-foreground hidden sm:inline">
          {timeAgo}
        </span>
        <Icon 
          name={showDetails ? 'ChevronUp' : 'ChevronDown'} 
          size={14} 
          color="var(--color-muted-foreground)"
        />
      </button>

      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-72 p-4
          bg-popover border border-border rounded-lg shadow-elevation-lg
          z-[110] animate-slide-in">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name={getStatusIcon()} size={16} color="var(--color-foreground)" />
                <span className="font-heading font-medium text-sm text-foreground">
                  Estado de Datos
                </span>
              </div>
              <div className={`px-2 py-1 rounded caption text-xs font-medium
                ${isConnected ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                {getStatusText()}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="caption text-xs text-muted-foreground">
                  Última actualización:
                </span>
                <span className="caption text-xs font-medium text-foreground data-text">
                  {formatTime(lastUpdate)} UTC-5
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="caption text-xs text-muted-foreground">
                  Intervalo de refresco:
                </span>
                <span className="caption text-xs font-medium text-foreground data-text">
                  {refreshInterval / 60000} minutos
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="caption text-xs text-muted-foreground">
                  Conexión WebSocket:
                </span>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-success' : 'bg-error'}`} />
                  <span className="caption text-xs font-medium text-foreground">
                    {isConnected ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
            </div>

            {onRefresh && (
              <button
                onClick={() => {
                  onRefresh();
                  setShowDetails(false);
                }}
                className="w-full mt-3 px-4 py-2 bg-primary text-primary-foreground
                  rounded-lg font-heading font-medium text-sm
                  transition-smooth hover-lift press-scale hover:shadow-elevation-sm
                  flex items-center justify-center gap-2"
              >
                <Icon name="RefreshCw" size={16} />
                Actualizar Ahora
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataRefreshStatus;