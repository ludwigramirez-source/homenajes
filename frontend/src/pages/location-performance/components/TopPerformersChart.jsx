import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Icon from '../../../components/AppIcon';

const TopPerformersChart = ({ data, metric, title, showTop = true, className = '' }) => {
  const sortedData = [...data]?.sort((a, b) => 
    showTop ? b?.[metric] - a?.[metric] : a?.[metric] - b?.[metric]
  )?.slice(0, 10);

  const getBarColor = (index) => {
    if (showTop) {
      if (index === 0) return 'var(--color-success)';
      if (index === 1) return 'var(--color-accent)';
      if (index === 2) return 'var(--color-warning)';
      return 'var(--color-primary)';
    } else {
      if (index === 0) return 'var(--color-error)';
      if (index === 1) return 'var(--color-warning)';
      return 'var(--color-muted)';
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload?.length) {
      const data = payload?.[0]?.payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevation-lg">
          <div className="font-heading font-semibold text-sm text-foreground mb-2">
            {data?.name}
          </div>
          <div className="space-y-1 caption text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-medium text-foreground data-text">
                {data?.[metric]?.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Ranking:</span>
              <span className="font-medium text-foreground data-text">
                #{data?.rank}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Región:</span>
              <span className="font-medium text-foreground">{data?.region}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm ${className}`}>
      <div className="flex items-start justify-between mb-4 md:mb-6">
        <div>
          <h3 className="font-heading font-semibold text-base md:text-lg text-foreground">
            {title}
          </h3>
          <p className="caption text-xs md:text-sm text-muted-foreground mt-1">
            Top 10 ubicaciones por rendimiento
          </p>
        </div>
        <div className={`p-2 rounded-lg ${showTop ? 'bg-success/10' : 'bg-error/10'}`}>
          <Icon 
            name={showTop ? 'TrendingUp' : 'TrendingDown'} 
            size={20} 
            color={showTop ? 'var(--color-success)' : 'var(--color-error)'} 
          />
        </div>
      </div>
      <div className="w-full h-64 md:h-80" aria-label={`Gráfico de barras de ${title?.toLowerCase()}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={sortedData} 
            layout="vertical"
            margin={{ top: 5, right: 20, bottom: 5, left: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
            <XAxis 
              type="number"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
            />
            <YAxis 
              type="category" 
              dataKey="name"
              tick={{ fill: 'var(--color-foreground)', fontSize: 11 }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={metric} radius={[0, 4, 4, 0]}>
              {sortedData?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${showTop ? 'bg-success' : 'bg-error'}`}></div>
            <span className="caption text-xs text-muted-foreground">
              {showTop ? 'Mejor rendimiento' : 'Necesita mejora'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="BarChart3" size={16} color="var(--color-muted-foreground)" />
            <span className="caption text-xs text-muted-foreground">
              Datos del último trimestre
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopPerformersChart;