import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';

const AutoRefreshControl = ({ onRefresh, className = '' }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [interval, setInterval] = useState('300000');
  const [countdown, setCountdown] = useState(300);

  const intervalOptions = [
    { value: '60000', label: '1 minuto' },
    { value: '300000', label: '5 minutos' },
    { value: '600000', label: '10 minutos' }
  ];

  useEffect(() => {
    if (!isEnabled) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onRefresh?.();
          return parseInt(interval) / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isEnabled, interval, onRefresh]);

  const handleManualRefresh = () => {
    onRefresh?.();
    setCountdown(parseInt(interval) / 1000);
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs?.toString()?.padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <button
        onClick={() => setIsEnabled(!isEnabled)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          transition-smooth press-scale
          ${isEnabled 
            ? 'bg-success/10 text-success hover:bg-success/20' :'bg-muted text-muted-foreground hover:bg-muted/80'
          }
        `}
        aria-label={isEnabled ? 'Desactivar auto-refresco' : 'Activar auto-refresco'}
      >
        <Icon name={isEnabled ? 'Play' : 'Pause'} size={16} />
        <span className="caption text-xs font-medium hidden sm:inline">
          {isEnabled ? 'Activo' : 'Pausado'}
        </span>
      </button>

      <Select
        options={intervalOptions}
        value={interval}
        onChange={setInterval}
        disabled={!isEnabled}
        className="w-32"
      />

      {isEnabled && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
          <Icon name="Clock" size={14} color="var(--color-muted-foreground)" />
          <span className="caption text-xs font-medium data-text text-foreground">
            {formatCountdown(countdown)}
          </span>
        </div>
      )}

      <button
        onClick={handleManualRefresh}
        className="p-2 rounded-lg bg-primary text-primary-foreground
          transition-smooth hover-lift press-scale hover:shadow-elevation-sm"
        aria-label="Refrescar ahora"
      >
        <Icon name="RefreshCw" size={16} />
      </button>
    </div>
  );
};

export default AutoRefreshControl;