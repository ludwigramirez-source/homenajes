import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SeasonalTrendChart = ({ data, className = '' }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevation-lg">
          <p className="caption text-xs font-medium text-foreground mb-2">{label}</p>
          {payload?.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <span className="caption text-xs" style={{ color: entry?.color }}>
                {entry?.name}:
              </span>
              <span className="caption text-xs font-medium data-text text-foreground">
                {entry?.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 
      shadow-elevation-sm ${className}`}>
      <h3 className="font-heading text-base md:text-lg font-semibold text-foreground mb-4">
        Análisis de Tendencias Estacionales
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis 
            dataKey="month" 
            stroke="var(--color-muted-foreground)"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="var(--color-muted-foreground)"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="rect"
          />
          <Bar 
            dataKey="tributos" 
            fill="var(--color-primary)" 
            radius={[4, 4, 0, 0]}
            name="Tributos Creados"
          />
          <Bar 
            dataKey="condolencias" 
            fill="var(--color-accent)" 
            radius={[4, 4, 0, 0]}
            name="Total Condolencias"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SeasonalTrendChart;