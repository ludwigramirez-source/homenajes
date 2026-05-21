import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis } from 'recharts';
import Icon from '../../../components/AppIcon';

const ScatterPlotChart = ({ data, xKey, yKey, zKey, xLabel, yLabel, className = '' }) => {
  const [selectedQuartile, setSelectedQuartile] = useState('all');

  const quartileColors = {
    1: 'var(--color-success)',
    2: 'var(--color-accent)',
    3: 'var(--color-warning)',
    4: 'var(--color-error)'
  };

  const filteredData = selectedQuartile === 'all' 
    ? data 
    : data?.filter(item => item?.quartile === parseInt(selectedQuartile));

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
              <span className="text-muted-foreground">{xLabel}:</span>
              <span className="font-medium text-foreground data-text">{data?.[xKey]}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{yLabel}:</span>
              <span className="font-medium text-foreground data-text">{data?.[yKey]}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Tamaño:</span>
              <span className="font-medium text-foreground data-text">{data?.[zKey]}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Cuartil:</span>
              <span className="font-medium" style={{ color: quartileColors?.[data?.quartile] }}>
                Q{data?.quartile}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h3 className="font-heading font-semibold text-base md:text-lg text-foreground">
            Análisis de Correlación de Rendimiento
          </h3>
          <p className="caption text-xs md:text-sm text-muted-foreground mt-1">
            {xLabel} vs {yLabel} por tamaño de ubicación
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="caption text-xs text-muted-foreground hidden sm:inline">Filtrar:</span>
          <select
            value={selectedQuartile}
            onChange={(e) => setSelectedQuartile(e?.target?.value)}
            className="px-3 py-1.5 bg-background border border-border rounded-lg
              caption text-xs font-medium text-foreground
              focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Todos los Cuartiles</option>
            <option value="1">Q1 - Excelente</option>
            <option value="2">Q2 - Bueno</option>
            <option value="3">Q3 - Promedio</option>
            <option value="4">Q4 - Necesita Mejora</option>
          </select>
        </div>
      </div>
      <div className="w-full h-64 md:h-80 lg:h-96" aria-label="Gráfico de dispersión de rendimiento de ubicaciones">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 40, left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              type="number" 
              dataKey={xKey} 
              name={xLabel}
              label={{ value: xLabel, position: 'bottom', offset: 20, style: { fill: 'var(--color-muted-foreground)', fontSize: 12 } }}
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
            />
            <YAxis 
              type="number" 
              dataKey={yKey} 
              name={yLabel}
              label={{ value: yLabel, angle: -90, position: 'left', offset: 10, style: { fill: 'var(--color-muted-foreground)', fontSize: 12 } }}
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
            />
            <ZAxis type="number" dataKey={zKey} range={[50, 400]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span style={{ color: 'var(--color-foreground)', fontSize: '12px' }}>{value}</span>}
            />
            {[1, 2, 3, 4]?.map(quartile => (
              <Scatter
                key={quartile}
                name={`Cuartil ${quartile}`}
                data={filteredData?.filter(d => d?.quartile === quartile)}
                fill={quartileColors?.[quartile]}
                opacity={0.7}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <Icon name="Info" size={16} color="var(--color-muted-foreground)" />
            <span className="caption text-xs text-muted-foreground">
              El tamaño de las burbujas representa {zKey}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="TrendingUp" size={16} color="var(--color-success)" />
            <span className="caption text-xs text-muted-foreground">
              {filteredData?.length} ubicaciones mostradas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScatterPlotChart;