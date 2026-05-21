import React from 'react';
import Icon from '../../../components/AppIcon';

const ConversionFunnelChart = ({ stages, className = '' }) => {
  const maxValue = Math.max(...stages?.map(s => s?.value));

  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 
      shadow-elevation-sm ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading text-base md:text-lg font-semibold text-foreground">
          Embudo de Conversión - Familia a Condolencia
        </h3>
        <div className="flex items-center gap-2">
          <Icon name="Filter" size={18} color="var(--color-accent)" />
          <span className="caption text-xs text-muted-foreground hidden md:inline">
            Últimos 30 días
          </span>
        </div>
      </div>
      <div className="space-y-4">
        {stages?.map((stage, index) => {
          const widthPercentage = (stage?.value / maxValue) * 100;
          const conversionRate = index > 0 
            ? ((stage?.value / stages?.[index - 1]?.value) * 100)?.toFixed(1)
            : 100;

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name={stage?.icon} size={16} color="var(--color-primary)" />
                  <span className="caption text-sm font-medium text-foreground">
                    {stage?.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="caption text-xs text-muted-foreground">
                    {conversionRate}% conversión
                  </span>
                  <span className="caption text-sm font-medium text-foreground data-text">
                    {stage?.value?.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className="h-12 bg-muted rounded-lg overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent 
                      flex items-center justify-between px-4 transition-smooth"
                    style={{ width: `${widthPercentage}%` }}
                  >
                    <span className="caption text-xs font-medium text-white">
                      {stage?.description}
                    </span>
                  </div>
                </div>
                {index < stages?.length - 1 && (
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                    <Icon name="ChevronDown" size={16} color="var(--color-muted-foreground)" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="caption text-xs text-muted-foreground mb-1">
            Tasa de Conversión Total
          </div>
          <div className="font-heading text-xl font-semibold text-accent data-text">
            {((stages?.[stages?.length - 1]?.value / stages?.[0]?.value) * 100)?.toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="caption text-xs text-muted-foreground mb-1">
            Mayor Abandono
          </div>
          <div className="font-heading text-xl font-semibold text-error data-text">
            Formulario
          </div>
        </div>
        <div className="text-center">
          <div className="caption text-xs text-muted-foreground mb-1">
            Oportunidad de Mejora
          </div>
          <div className="font-heading text-xl font-semibold text-success data-text">
            +23%
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionFunnelChart;