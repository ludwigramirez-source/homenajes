import React from 'react';
import Icon from '../../../components/AppIcon';

const KPICard = ({ 
  title, 
  value, 
  unit = '', 
  change, 
  changeType = 'percentage',
  trend = [],
  icon,
  iconColor = 'var(--color-accent)',
  loading = false 
}) => {
  const isPositive = change >= 0;
  const changeColor = isPositive ? 'text-success' : 'text-error';
  const changeIcon = isPositive ? 'TrendingUp' : 'TrendingDown';

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val?.toLocaleString('es-CO');
    }
    return val;
  };

  const formatChange = (val) => {
    const prefix = val >= 0 ? '+' : '';
    if (changeType === 'percentage') {
      return `${prefix}${val?.toFixed(1)}%`;
    }
    return `${prefix}${val?.toLocaleString('es-CO')}`;
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded skeleton-pulse w-1/2"></div>
          <div className="h-8 bg-muted rounded skeleton-pulse w-3/4"></div>
          <div className="h-3 bg-muted rounded skeleton-pulse w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm 
      transition-smooth hover:shadow-elevation-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="caption text-xs text-muted-foreground mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-heading font-semibold text-foreground data-text">
              {formatValue(value)}
            </h3>
            {unit && (
              <span className="text-sm md:text-base text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className="p-2 md:p-3 bg-accent/10 rounded-lg">
            <Icon name={icon} size={20} color={iconColor} />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1 ${changeColor}`}>
          <Icon name={changeIcon} size={14} />
          <span className="caption text-xs font-medium data-text">
            {formatChange(change)}
          </span>
          <span className="caption text-xs text-muted-foreground ml-1">
            vs mes anterior
          </span>
        </div>

        {trend?.length > 0 && (
          <div className="flex items-end gap-0.5 h-6">
            {trend?.map((value, index) => {
              const maxValue = Math.max(...trend);
              const height = (value / maxValue) * 100;
              return (
                <div
                  key={index}
                  className={`w-1 rounded-t transition-smooth ${
                    isPositive ? 'bg-success/60' : 'bg-error/60'
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;