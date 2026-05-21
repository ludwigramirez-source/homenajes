import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const DateRangePicker = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { label: 'Último mes', value: 'last-month' },
    { label: 'Último trimestre', value: 'last-quarter' },
    { label: 'Últimos 6 meses', value: 'last-6-months' },
    { label: 'Último año', value: 'last-year' },
    { label: 'Año actual', value: 'current-year' },
    { label: 'Personalizado', value: 'custom' }
  ];

  const getDateRangeLabel = () => {
    const preset = presets?.find(p => p?.value === value);
    return preset ? preset?.label : 'Seleccionar período';
  };

  const handlePresetClick = (presetValue) => {
    onChange(presetValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-card border border-border
          rounded-lg shadow-elevation-sm transition-smooth hover:shadow-elevation-md
          press-scale"
      >
        <Icon name="Calendar" size={18} color="var(--color-accent)" />
        <span className="caption text-sm font-medium text-foreground">
          {getDateRangeLabel()}
        </span>
        <Icon 
          name={isOpen ? 'ChevronUp' : 'ChevronDown'} 
          size={16} 
          color="var(--color-muted-foreground)" 
        />
      </button>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[105]" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-64 bg-popover border border-border
            rounded-lg shadow-elevation-lg z-[110] animate-slide-in">
            <div className="p-2">
              {presets?.map((preset) => (
                <button
                  key={preset?.value}
                  onClick={() => handlePresetClick(preset?.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg
                    transition-smooth hover:bg-muted
                    ${value === preset?.value ? 'bg-accent/10 text-accent' : 'text-foreground'}
                  `}
                >
                  <span className="caption text-sm font-medium">
                    {preset?.label}
                  </span>
                </button>
              ))}
            </div>

            {value === 'custom' && (
              <div className="p-4 border-t border-border">
                <div className="space-y-3">
                  <div>
                    <label className="caption text-xs text-muted-foreground mb-1 block">
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 bg-background border border-border
                        rounded-lg caption text-sm text-foreground
                        focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="caption text-xs text-muted-foreground mb-1 block">
                      Fecha fin
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 bg-background border border-border
                        rounded-lg caption text-sm text-foreground
                        focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full px-4 py-2 bg-accent text-accent-foreground
                      rounded-lg font-heading font-medium text-sm
                      transition-smooth hover-lift press-scale"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangePicker;