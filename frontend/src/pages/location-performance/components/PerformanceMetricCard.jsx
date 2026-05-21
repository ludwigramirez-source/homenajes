import React from 'react';
import Icon from '../../../components/AppIcon';

const PerformanceMetricCard = ({ 
  title, 
  value, 
  unit = '', 
  change, 
  rank, 
  quartile,
  icon,
  trend = 'neutral',
  className = '' 
}) => {
  const quartileConfig = {
    1: { bg: 'bg-success/10', text: 'text-success', label: 'Q1 - Excelente' },
    2: { bg: 'bg-accent/10', text: 'text-accent', label: 'Q2 - Bueno' },
    3: { bg: 'bg-warning/10', text: 'text-warning', label: 'Q3 - Promedio' },
    4: { bg: 'bg-error/10', text: 'text-error', label: 'Q4 - Necesita Mejora' }
  };

  const config = quartileConfig?.[quartile] || quartileConfig?.[3];

  const getTrendIcon = () => {
    if (trend === 'up') return 'TrendingUp';
    if (trend === 'down') return 'TrendingDown';
    return 'Minus';
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-success';
    if (trend === 'down') return 'text-error';
    return 'text-muted-foreground';
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 
      shadow-elevation-sm hover:shadow-elevation-md transition-smooth ${className}`}>
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`p-2 rounded-lg ${config?.bg}`}>
            <Icon name={icon} size={20} color={`var(--color-${quartile === 1 ? 'success' : quartile === 2 ? 'accent' : quartile === 3 ? 'warning' : 'error'})`} />
          </div>
          <div>
            <h3 className="font-heading font-medium text-sm md:text-base text-foreground">
              {title}
            </h3>
            <span className={`caption text-xs ${config?.text}`}>
              {config?.label}
            </span>
          </div>
        </div>
        {rank && (
          <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded">
            <Icon name="Award" size={14} color="var(--color-accent)" />
            <span className="caption text-xs font-medium data-text">#{rank}</span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl md:text-3xl lg:text-4xl font-heading font-semibold text-foreground data-text">
            {value}
          </span>
          {unit && (
            <span className="text-sm md:text-base text-muted-foreground">
              {unit}
            </span>
          )}
        </div>

        {change !== undefined && (
          <div className="flex items-center gap-2">
            <Icon name={getTrendIcon()} size={16} className={getTrendColor()} />
            <span className={`caption text-xs md:text-sm font-medium ${getTrendColor()}`}>
              {change > 0 ? '+' : ''}{change}% vs período anterior
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMetricCard;