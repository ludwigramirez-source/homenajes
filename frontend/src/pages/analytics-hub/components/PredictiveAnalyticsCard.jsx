import React from 'react';
import Icon from '../../../components/AppIcon';

const PredictiveAnalyticsCard = ({ predictions, className = '' }) => {
  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 
      shadow-elevation-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Pronóstico de Demanda
        </h3>
        <Icon name="Brain" size={18} color="var(--color-accent)" />
      </div>
      <div className="space-y-4">
        {predictions?.map((prediction, index) => (
          <div key={index} className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="caption text-sm font-medium text-foreground">
                {prediction?.period}
              </span>
              <div className={`px-2 py-1 rounded caption text-xs font-medium
                ${prediction?.trend === 'up' ? 'bg-success/10 text-success' : 
                  prediction?.trend === 'down'? 'bg-error/10 text-error' : 'bg-muted text-muted-foreground'}`}>
                {prediction?.change > 0 ? '+' : ''}{prediction?.change}%
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="caption text-xs text-muted-foreground">
                Tributos estimados:
              </span>
              <span className="caption text-sm font-medium text-foreground data-text">
                {prediction?.estimated}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="caption text-xs text-muted-foreground">
                Confianza:
              </span>
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${prediction?.confidence}%` }}
                  />
                </div>
                <span className="caption text-xs font-medium text-foreground data-text">
                  {prediction?.confidence}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-accent">
          <Icon name="Lightbulb" size={14} />
          <span className="caption text-xs">
            Recomendación: Aumentar capacidad en diciembre
          </span>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsCard;