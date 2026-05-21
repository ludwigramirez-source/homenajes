import React from 'react';
import Icon from '../../../components/AppIcon';

const CriticalStatusStrip = ({ metrics }) => {
  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds?.healthy) return 'text-success';
    if (value >= thresholds?.warning) return 'text-warning';
    return 'text-error';
  };

  const getStatusBg = (value, thresholds) => {
    if (value >= thresholds?.healthy) return 'bg-success/10';
    if (value >= thresholds?.warning) return 'bg-warning/10';
    return 'bg-error/10';
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-elevation-md p-3 md:p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {metrics?.map((metric, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${getStatusBg(metric?.value, metric?.thresholds)}`}>
                <Icon 
                  name={metric?.icon} 
                  size={16} 
                  color={metric?.value >= metric?.thresholds?.healthy ? 'var(--color-success)' : 
                         metric?.value >= metric?.thresholds?.warning ? 'var(--color-warning)': 'var(--color-error)'}
                />
              </div>
              <span className="caption text-xs text-muted-foreground">
                {metric?.label}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl md:text-2xl font-heading font-bold data-text
                ${getStatusColor(metric?.value, metric?.thresholds)}`}>
                {metric?.value}{metric?.unit}
              </span>
              {metric?.sla && (
                <span className="caption text-xs text-muted-foreground">
                  SLA: {metric?.sla}%
                </span>
              )}
            </div>
            {metric?.trend && (
              <div className="flex items-center gap-1">
                <Icon 
                  name={metric?.trend > 0 ? 'TrendingUp' : 'TrendingDown'} 
                  size={12} 
                  color={metric?.trend > 0 ? 'var(--color-success)' : 'var(--color-error)'}
                />
                <span className={`caption text-xs font-medium
                  ${metric?.trend > 0 ? 'text-success' : 'text-error'}`}>
                  {Math.abs(metric?.trend)}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CriticalStatusStrip;