import React from 'react';
import Icon from '../../../components/AppIcon';

const PeakEngagementCard = ({ peakTimes, className = '' }) => {
  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 
      shadow-elevation-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Horarios Pico de Engagement
        </h3>
        <Icon name="Clock" size={18} color="var(--color-accent)" />
      </div>
      <div className="space-y-4">
        {peakTimes?.map((time, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="Calendar" size={14} color="var(--color-primary)" />
                <span className="caption text-sm font-medium text-foreground">
                  {time?.day}
                </span>
              </div>
              <span className="caption text-xs text-muted-foreground">
                {time?.percentage}% del total
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent rounded-full transition-smooth"
                  style={{ width: `${time?.percentage}%` }}
                />
              </div>
              <span className="caption text-xs font-medium text-foreground data-text whitespace-nowrap">
                {time?.timeRange}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon name="TrendingUp" size={14} />
          <span className="caption text-xs">
            Mayor actividad: Viernes 18:00-20:00
          </span>
        </div>
      </div>
    </div>
  );
};

export default PeakEngagementCard;