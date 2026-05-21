import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricCard = ({ 
  title, 
  value, 
  unit = '', 
  icon, 
  trend = null, 
  status = 'neutral',
  loading = false,
  onClick 
}) => {
  const statusColors = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-error/10 text-error border-error/20',
    neutral: 'bg-muted text-foreground border-border'
  };

  const trendColors = {
    up: 'text-success',
    down: 'text-error',
    neutral: 'text-muted-foreground'
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-4 md:p-5 lg:p-6 rounded-lg border-2 transition-smooth
        ${statusColors?.[status]}
        ${onClick ? 'cursor-pointer hover-lift press-scale hover:shadow-elevation-md' : ''}
        ${loading ? 'skeleton-pulse' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="flex-1">
          <p className="caption text-xs md:text-sm text-muted-foreground mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground data-text">
              {loading ? '---' : value}
            </h3>
            {unit && (
              <span className="text-sm md:text-base text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className={`
            p-2 md:p-3 rounded-lg
            ${status === 'neutral' ? 'bg-primary/10' : 'bg-background/50'}
          `}>
            <Icon 
              name={icon} 
              size={20} 
              color={status === 'neutral' ? 'var(--color-primary)' : 'currentColor'} 
            />
          </div>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-2">
          <Icon 
            name={trend?.direction === 'up' ? 'TrendingUp' : trend?.direction === 'down' ? 'TrendingDown' : 'Minus'} 
            size={16} 
            className={trendColors?.[trend?.direction]}
          />
          <span className={`caption text-xs md:text-sm font-medium ${trendColors?.[trend?.direction]}`}>
            {trend?.value}
          </span>
          <span className="caption text-xs text-muted-foreground">
            vs. ayer
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;