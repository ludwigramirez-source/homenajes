import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricsCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon, 
  description,
  significance = 'neutral',
  className = '' 
}) => {
  const getTrendColor = () => {
    if (trend === 'up') return change >= 0 ? 'text-success' : 'text-error';
    if (trend === 'down') return change <= 0 ? 'text-success' : 'text-error';
    return 'text-muted-foreground';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return 'TrendingUp';
    if (trend === 'down') return 'TrendingDown';
    return 'Minus';
  };

  const getSignificanceBadge = () => {
    const badges = {
      high: { label: 'Alta significancia', color: 'bg-accent/10 text-accent' },
      medium: { label: 'Significancia media', color: 'bg-warning/10 text-warning' },
      low: { label: 'Baja significancia', color: 'bg-muted text-muted-foreground' },
      neutral: { label: '', color: '' }
    };
    return badges?.[significance] || badges?.neutral;
  };

  const badge = getSignificanceBadge();

  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 
      shadow-elevation-sm hover:shadow-elevation-md transition-smooth ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg 
            flex items-center justify-center">
            <Icon name={icon} size={20} color="var(--color-primary)" />
          </div>
          <div>
            <h3 className="caption text-xs text-muted-foreground mb-1">
              {title}
            </h3>
            <div className="font-heading text-xl md:text-2xl lg:text-3xl font-semibold 
              text-foreground data-text">
              {value}
            </div>
          </div>
        </div>
        {badge?.label && (
          <div className={`px-2 py-1 rounded caption text-xs font-medium ${badge?.color}`}>
            {badge?.label}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1 ${getTrendColor()}`}>
          <Icon name={getTrendIcon()} size={16} />
          <span className="caption text-sm font-medium data-text">
            {change > 0 ? '+' : ''}{change}%
          </span>
        </div>
        <span className="caption text-xs text-muted-foreground">
          {description}
        </span>
      </div>
    </div>
  );
};

export default MetricsCard;