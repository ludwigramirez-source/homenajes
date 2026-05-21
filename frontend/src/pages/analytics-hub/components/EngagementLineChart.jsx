import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EngagementLineChart = ({ data, className = '' }) => {
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
        Tendencia de Engagement
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
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
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="condolencias" 
            stroke="var(--color-primary)" 
            strokeWidth={2}
            dot={{ fill: 'var(--color-primary)', r: 4 }}
            activeDot={{ r: 6 }}
            name="Condolencias Promedio"
          />
          <Line 
            type="monotone" 
            dataKey="satisfaccion" 
            stroke="var(--color-accent)" 
            strokeWidth={2}
            dot={{ fill: 'var(--color-accent)', r: 4 }}
            activeDot={{ r: 6 }}
            name="Satisfacción (%)"
          />
          <Line 
            type="monotone" 
            dataKey="conversion" 
            stroke="var(--color-success)" 
            strokeWidth={2}
            dot={{ fill: 'var(--color-success)', r: 4 }}
            activeDot={{ r: 6 }}
            name="Conversión QR (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EngagementLineChart;