import React from 'react';
import Icon from '../../../components/AppIcon';

const CondolenceHeatmap = ({ data, className = '' }) => {
  const getIntensityColor = (value) => {
    if (value >= 80) return 'bg-accent text-accent-foreground';
    if (value >= 60) return 'bg-accent/70 text-accent-foreground';
    if (value >= 40) return 'bg-accent/50 text-foreground';
    if (value >= 20) return 'bg-accent/30 text-foreground';
    return 'bg-accent/10 text-muted-foreground';
  };

  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const hours = ['00', '04', '08', '12', '16', '20'];

  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 
      shadow-elevation-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base md:text-lg font-semibold text-foreground">
          Mapa de Calor - Condolencias por Hora
        </h3>
        <div className="flex items-center gap-2">
          <Icon name="Info" size={16} color="var(--color-muted-foreground)" />
          <span className="caption text-xs text-muted-foreground hidden md:inline">
            Intensidad de engagement
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-[80px_repeat(6,1fr)] gap-2 mb-2">
            <div></div>
            {hours?.map(hour => (
              <div key={hour} className="text-center caption text-xs text-muted-foreground">
                {hour}:00
              </div>
            ))}
          </div>

          {data?.map((row, dayIndex) => (
            <div key={dayIndex} className="grid grid-cols-[80px_repeat(6,1fr)] gap-2 mb-2">
              <div className="caption text-xs font-medium text-foreground flex items-center">
                {days?.[dayIndex]}
              </div>
              {row?.values?.map((value, hourIndex) => (
                <div
                  key={hourIndex}
                  className={`h-12 rounded flex items-center justify-center 
                    caption text-xs font-medium transition-smooth hover:scale-105 
                    cursor-pointer ${getIntensityColor(value)}`}
                  title={`${days?.[dayIndex]} ${hours?.[hourIndex]}:00 - ${value}% actividad`}
                >
                  {value}%
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <span className="caption text-xs text-muted-foreground">Baja actividad</span>
        <div className="flex items-center gap-1">
          {[10, 30, 50, 70, 90]?.map(val => (
            <div 
              key={val}
              className={`w-6 h-6 rounded ${getIntensityColor(val)}`}
            />
          ))}
        </div>
        <span className="caption text-xs text-muted-foreground">Alta actividad</span>
      </div>
    </div>
  );
};

export default CondolenceHeatmap;