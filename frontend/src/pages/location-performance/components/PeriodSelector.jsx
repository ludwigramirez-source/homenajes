import React from 'react';
import Icon from '../../../components/AppIcon';

const PeriodSelector = ({ value, onChange, className = '' }) => {
  const periods = [
    { value: 'monthly', label: 'Mensual', icon: 'Calendar' },
    { value: 'quarterly', label: 'Trimestral', icon: 'CalendarRange' },
    { value: 'yearly', label: 'Anual', icon: 'CalendarDays' }
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="caption text-xs text-muted-foreground hidden sm:inline">
        Período:
      </span>
      <div className="flex items-center bg-muted rounded-lg p-1">
        {periods?.map((period) => (
          <button
            key={period?.value}
            onClick={() => onChange(period?.value)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md
              caption text-xs font-medium transition-smooth
              ${value === period?.value
                ? 'bg-accent text-accent-foreground shadow-elevation-sm'
                : 'text-foreground hover:bg-background'
              }
            `}
          >
            <Icon name={period?.icon} size={14} />
            <span className="hidden sm:inline">{period?.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PeriodSelector;