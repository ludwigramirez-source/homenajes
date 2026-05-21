import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';

const ComparativeBarChart = ({ data = [], onCityClick }) => {
  const [selectedMetric, setSelectedMetric] = useState('all');

  const metrics = [
    { value: 'all', label: 'Todas las métricas' },
    { value: 'tributes', label: 'Tributos' },
    { value: 'satisfaction', label: 'Satisfacción' },
    { value: 'revenue', label: 'Ingresos' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevation-lg">
          <p className="font-heading font-medium text-sm text-foreground mb-2">
            {label}
          </p>
          {payload?.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: entry?.color }}
                />
                <span className="caption text-xs text-muted-foreground">
                  {entry?.name}:
                </span>
              </div>
              <span className="caption text-xs font-medium text-foreground data-text">
                {entry?.value?.toLocaleString('es-CO')}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data) => {
    if (onCityClick) {
      onCityClick(data);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-1">
            Comparativa por Ciudad
          </h3>
          <p className="caption text-xs text-muted-foreground">
            Métricas clave de rendimiento por ubicación
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Icon name="BarChart3" size={16} color="var(--color-muted-foreground)" />
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e?.target?.value)}
            className="px-3 py-1.5 bg-background border border-border rounded-lg
              caption text-xs text-foreground transition-smooth
              focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {metrics?.map(metric => (
              <option key={metric?.value} value={metric?.value}>
                {metric?.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="w-full h-64 md:h-80 lg:h-96" aria-label="Gráfico de barras comparativo por ciudad">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            onClick={handleBarClick}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="city" 
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fill: 'var(--color-foreground)', fontSize: 12 }}
            />
            <YAxis 
              tick={{ fill: 'var(--color-foreground)', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            {(selectedMetric === 'all' || selectedMetric === 'tributes') && (
              <Bar 
                dataKey="tributes" 
                name="Tributos Activos"
                fill="var(--color-accent)" 
                radius={[8, 8, 0, 0]}
                cursor="pointer"
              />
            )}
            {(selectedMetric === 'all' || selectedMetric === 'satisfaction') && (
              <Bar 
                dataKey="satisfaction" 
                name="Satisfacción (x10)"
                fill="var(--color-success)" 
                radius={[8, 8, 0, 0]}
                cursor="pointer"
              />
            )}
            {(selectedMetric === 'all' || selectedMetric === 'revenue') && (
              <Bar 
                dataKey="revenueScaled" 
                name="Ingresos (millones COP)"
                fill="var(--color-primary)" 
                radius={[8, 8, 0, 0]}
                cursor="pointer"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg">
          <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon name="FileText" size={20} color="var(--color-accent)" />
          </div>
          <div>
            <p className="caption text-xs text-muted-foreground">
              Total Tributos
            </p>
            <p className="font-heading font-semibold text-base text-foreground data-text">
              {data?.reduce((sum, item) => sum + item?.tributes, 0)?.toLocaleString('es-CO')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
          <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon name="Star" size={20} color="var(--color-success)" />
          </div>
          <div>
            <p className="caption text-xs text-muted-foreground">
              Satisfacción Promedio
            </p>
            <p className="font-heading font-semibold text-base text-foreground data-text">
              {(data?.reduce((sum, item) => sum + item?.satisfaction, 0) / data?.length)?.toFixed(1)}/5.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon name="DollarSign" size={20} color="var(--color-primary)" />
          </div>
          <div>
            <p className="caption text-xs text-muted-foreground">
              Ingresos Totales
            </p>
            <p className="font-heading font-semibold text-sm text-foreground data-text">
              {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })?.format(data?.reduce((sum, item) => sum + item?.revenue, 0))}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center">
        <button className="flex items-center gap-2 px-4 py-2 text-accent
          hover:text-accent/80 transition-smooth press-scale">
          <Icon name="Download" size={16} />
          <span className="caption text-xs font-medium">
            Exportar datos a PDF
          </span>
        </button>
      </div>
    </div>
  );
};

export default ComparativeBarChart;