import React from 'react';
import Icon from '../../../components/AppIcon';

const SeasonalTrendIndicator = ({ trends = [] }) => {
  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return { name: 'TrendingUp', color: 'var(--color-success)' };
    if (trend === 'decreasing') return { name: 'TrendingDown', color: 'var(--color-error)' };
    return { name: 'Minus', color: 'var(--color-muted-foreground)' };
  };

  const getTrendLabel = (trend) => {
    if (trend === 'increasing') return 'Creciente';
    if (trend === 'decreasing') return 'Decreciente';
    return 'Estable';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Calendar" size={20} color="var(--color-accent)" />
        <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
          Tendencias Estacionales
        </h3>
      </div>
      <div className="space-y-3">
        {trends?.map((item, index) => {
          const trendIcon = getTrendIcon(item?.trend);
          return (
            <div
              key={index}
              className="p-3 bg-muted/30 rounded-lg transition-smooth hover:bg-muted/50"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-heading font-medium text-sm text-foreground mb-1">
                    {item?.period}
                  </h4>
                  <p className="caption text-xs text-muted-foreground">
                    {item?.description}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Icon name={trendIcon?.name} size={16} color={trendIcon?.color} />
                  <span 
                    className="caption text-xs font-medium"
                    style={{ color: trendIcon?.color }}
                  >
                    {getTrendLabel(item?.trend)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <p className="caption text-xs text-muted-foreground">
                    Promedio tributos
                  </p>
                  <p className="caption text-xs font-medium text-foreground data-text">
                    {item?.avgTributes}/mes
                  </p>
                </div>
                <div>
                  <p className="caption text-xs text-muted-foreground">
                    Variación
                  </p>
                  <p className={`caption text-xs font-medium data-text ${
                    item?.change >= 0 ? 'text-success' : 'text-error'
                  }`}>
                    {item?.change >= 0 ? '+' : ''}{item?.change?.toFixed(1)}%
                  </p>
                </div>
              </div>
              {item?.recommendation && (
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="flex items-start gap-2">
                    <Icon name="Lightbulb" size={12} color="var(--color-accent)" className="mt-0.5 flex-shrink-0" />
                    <p className="caption text-xs text-muted-foreground">
                      {item?.recommendation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="caption text-xs text-muted-foreground">
            Próxima actualización
          </span>
          <span className="caption text-xs font-medium text-foreground">
            01/02/2026
          </span>
        </div>
      </div>
    </div>
  );
};

export default SeasonalTrendIndicator;