import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const LocationRankingCard = ({ locations = [], type = 'top' }) => {
  const [sortBy, setSortBy] = useState('performance');

  const sortOptions = [
    { value: 'performance', label: 'Rendimiento' },
    { value: 'revenue', label: 'Ingresos' },
    { value: 'satisfaction', label: 'Satisfacción' },
    { value: 'tributes', label: 'Tributos' }
  ];

  const sortedLocations = [...locations]?.sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
        return type === 'top' 
          ? b?.revenue - a?.revenue 
          : a?.revenue - b?.revenue;
      case 'satisfaction':
        return type === 'top'
          ? b?.satisfactionScore - a?.satisfactionScore
          : a?.satisfactionScore - b?.satisfactionScore;
      case 'tributes':
        return type === 'top'
          ? b?.activeTributes - a?.activeTributes
          : a?.activeTributes - b?.activeTributes;
      default:
        return type === 'top'
          ? b?.performanceScore - a?.performanceScore
          : a?.performanceScore - b?.performanceScore;
    }
  })?.slice(0, 5);

  const getRankIcon = (index) => {
    if (type === 'top') {
      if (index === 0) return { name: 'Trophy', color: 'var(--color-accent)' };
      if (index === 1) return { name: 'Award', color: 'var(--color-accent)' };
      if (index === 2) return { name: 'Medal', color: 'var(--color-accent)' };
    }
    return { name: 'MapPin', color: 'var(--color-muted-foreground)' };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(value);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon 
            name={type === 'top' ? 'TrendingUp' : 'TrendingDown'} 
            size={20} 
            color={type === 'top' ? 'var(--color-success)' : 'var(--color-warning)'} 
          />
          <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
            {type === 'top' ? 'Mejores' : 'Requieren Atención'}
          </h3>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e?.target?.value)}
          className="px-2 py-1 bg-background border border-border rounded
            caption text-xs text-foreground transition-smooth
            focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {sortOptions?.map(option => (
            <option key={option?.value} value={option?.value}>
              {option?.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-3">
        {sortedLocations?.map((location, index) => {
          const rankIcon = getRankIcon(index);
          return (
            <div
              key={location?.id}
              className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg transition-smooth hover:bg-muted/50"
            >
              <div className="flex items-center justify-center w-8 h-8 
                bg-background rounded-lg flex-shrink-0">
                <Icon name={rankIcon?.name} size={16} color={rankIcon?.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-heading font-medium text-sm text-foreground truncate">
                    {location?.city}
                  </h4>
                  <span className="caption text-xs text-muted-foreground">
                    {location?.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="caption text-xs text-muted-foreground">
                      Rendimiento
                    </p>
                    <p className="caption text-xs font-medium text-foreground data-text">
                      {location?.performanceScore?.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="caption text-xs text-muted-foreground">
                      Ingresos
                    </p>
                    <p className="caption text-xs font-medium text-foreground data-text">
                      {formatCurrency(location?.revenue)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Icon name="Star" size={12} color="var(--color-accent)" />
                  <span className="caption text-xs font-medium text-foreground data-text">
                    {location?.satisfactionScore?.toFixed(1)}
                  </span>
                </div>
                <span className="caption text-xs text-muted-foreground">
                  {location?.activeTributes} tributos
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <button className="w-full flex items-center justify-center gap-2 py-2
          text-accent hover:text-accent/80 transition-smooth press-scale">
          <span className="caption text-xs font-medium">
            Ver ranking completo
          </span>
          <Icon name="ArrowRight" size={14} />
        </button>
      </div>
    </div>
  );
};

export default LocationRankingCard;