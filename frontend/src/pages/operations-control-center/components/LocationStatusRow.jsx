import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const LocationStatusRow = ({ location, onViewDetails, onQuickAction }) => {
  const getStatusColor = (status) => {
    const colors = {
      operational: 'text-success',
      warning: 'text-warning',
      critical: 'text-error',
      offline: 'text-muted-foreground'
    };
    return colors?.[status] || colors?.operational;
  };

  const getStatusIcon = (status) => {
    const icons = {
      operational: 'CheckCircle2',
      warning: 'AlertTriangle',
      critical: 'AlertCircle',
      offline: 'XCircle'
    };
    return icons?.[status] || icons?.operational;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-5
      transition-smooth hover:shadow-elevation-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-3">
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              ${location?.status === 'operational' ? 'bg-success/10' : 
                location?.status === 'warning' ? 'bg-warning/10' : 
                location?.status === 'critical' ? 'bg-error/10' : 'bg-muted'}
            `}>
              <Icon 
                name={getStatusIcon(location?.status)} 
                size={20} 
                className={getStatusColor(location?.status)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-heading font-semibold text-sm md:text-base text-foreground line-clamp-1">
                {location?.name}
              </h4>
              <p className="caption text-xs text-muted-foreground line-clamp-1">
                {location?.city}
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 text-center">
          <p className="text-lg md:text-xl font-heading font-bold text-foreground data-text">
            {location?.activeTributes}
          </p>
          <p className="caption text-xs text-muted-foreground">Tributos activos</p>
        </div>

        <div className="md:col-span-2 text-center">
          <p className="text-lg md:text-xl font-heading font-bold text-foreground data-text">
            {location?.screenUptime}%
          </p>
          <p className="caption text-xs text-muted-foreground">Uptime pantallas</p>
        </div>

        <div className="md:col-span-2 text-center">
          <p className="text-lg md:text-xl font-heading font-bold text-foreground data-text">
            {location?.todayCondolences}
          </p>
          <p className="caption text-xs text-muted-foreground">Condolencias hoy</p>
        </div>

        <div className="md:col-span-3 flex flex-wrap gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            iconName="Eye"
            onClick={() => onViewDetails(location)}
          >
            Ver detalles
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconName="MoreVertical"
            onClick={() => onQuickAction(location)}
          />
        </div>
      </div>
      {location?.alerts > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Icon name="Bell" size={14} color="var(--color-warning)" />
            <span className="caption text-xs text-warning font-medium">
              {location?.alerts} alerta{location?.alerts > 1 ? 's' : ''} pendiente{location?.alerts > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationStatusRow;