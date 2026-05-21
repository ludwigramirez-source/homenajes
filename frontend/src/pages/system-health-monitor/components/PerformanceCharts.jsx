import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';

const PerformanceCharts = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState('uptime');

  const metrics = [
    { id: 'uptime', label: 'Uptime del Sistema', icon: 'Activity', color: 'var(--color-success)' },
    { id: 'latency', label: 'Latencia de Red', icon: 'Zap', color: 'var(--color-warning)' },
    { id: 'throughput', label: 'Throughput', icon: 'TrendingUp', color: 'var(--color-accent)' },
    { id: 'errors', label: 'Tasa de Errores', icon: 'AlertCircle', color: 'var(--color-error)' }
  ];

  const currentMetric = metrics?.find(m => m?.id === selectedMetric);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-elevation-lg p-3">
          <p className="caption text-xs text-muted-foreground mb-2">{label}</p>
          {payload?.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry?.color }}
              />
              <span className="caption text-xs font-medium text-foreground">
                {entry?.name}: {entry?.value}{entry?.unit || ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-elevation-md p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            Análisis de Rendimiento Histórico
          </h3>
          <p className="caption text-xs md:text-sm text-muted-foreground mt-1">
            Últimas 24 horas
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {metrics?.map(metric => (
            <button
              key={metric?.id}
              onClick={() => setSelectedMetric(metric?.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg
                caption text-xs font-medium transition-smooth press-scale
                ${selectedMetric === metric?.id
                  ? 'bg-accent text-accent-foreground shadow-elevation-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              <Icon name={metric?.icon} size={14} />
              {metric?.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64 md:h-80 w-full" aria-label={`Gráfico de ${currentMetric?.label}`}>
        <ResponsiveContainer width="100%" height="100%">
          {selectedMetric === 'uptime' ? (
            <AreaChart data={data?.[selectedMetric]}>
              <defs>
                <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentMetric?.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={currentMetric?.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="time" 
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={currentMetric?.color}
                fillOpacity={1}
                fill="url(#colorUptime)"
                name="Uptime"
                unit="%"
              />
            </AreaChart>
          ) : selectedMetric === 'errors' ? (
            <BarChart data={data?.[selectedMetric]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="time" 
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill={currentMetric?.color}
                name="Errores"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={data?.[selectedMetric]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="time" 
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={currentMetric?.color}
                strokeWidth={2}
                dot={{ fill: currentMetric?.color, r: 3 }}
                name={currentMetric?.label}
                unit={selectedMetric === 'latency' ? 'ms' : ''}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
        <div>
          <p className="caption text-xs text-muted-foreground mb-1">Promedio</p>
          <p className="text-lg md:text-xl font-heading font-bold text-foreground data-text">
            {data?.stats?.[selectedMetric]?.avg}
            {selectedMetric === 'latency' ? 'ms' : selectedMetric === 'uptime' ? '%' : ''}
          </p>
        </div>
        <div>
          <p className="caption text-xs text-muted-foreground mb-1">Máximo</p>
          <p className="text-lg md:text-xl font-heading font-bold text-foreground data-text">
            {data?.stats?.[selectedMetric]?.max}
            {selectedMetric === 'latency' ? 'ms' : selectedMetric === 'uptime' ? '%' : ''}
          </p>
        </div>
        <div>
          <p className="caption text-xs text-muted-foreground mb-1">Mínimo</p>
          <p className="text-lg md:text-xl font-heading font-bold text-foreground data-text">
            {data?.stats?.[selectedMetric]?.min}
            {selectedMetric === 'latency' ? 'ms' : selectedMetric === 'uptime' ? '%' : ''}
          </p>
        </div>
        <div>
          <p className="caption text-xs text-muted-foreground mb-1">Desviación</p>
          <p className="text-lg md:text-xl font-heading font-bold text-foreground data-text">
            {data?.stats?.[selectedMetric]?.stdDev}
            {selectedMetric === 'latency' ? 'ms' : selectedMetric === 'uptime' ? '%' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCharts;