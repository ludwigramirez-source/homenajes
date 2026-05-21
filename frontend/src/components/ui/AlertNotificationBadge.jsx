import React from 'react';
import Icon from '../AppIcon';

const AlertNotificationBadge = ({ count = 0, severity = 'info', onClick }) => {
  if (count === 0) return null;

  const severityConfig = {
    critical: {
      bg: 'bg-error',
      text: 'text-error-foreground',
      icon: 'AlertCircle',
      pulse: true
    },
    warning: {
      bg: 'bg-warning',
      text: 'text-warning-foreground',
      icon: 'AlertTriangle',
      pulse: false
    },
    info: {
      bg: 'bg-accent',
      text: 'text-accent-foreground',
      icon: 'Info',
      pulse: false
    }
  };

  const config = severityConfig?.[severity] || severityConfig?.info;

  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center justify-center
        transition-smooth hover-lift press-scale focus-ring"
      aria-label={`${count} alertas ${severity}`}
    >
      <div className={`
        flex items-center justify-center
        min-w-[24px] h-6 px-2 rounded-full
        ${config?.bg} ${config?.text}
        shadow-elevation-sm
        ${config?.pulse ? 'animate-pulse' : ''}
      `}>
        <Icon name={config?.icon} size={12} className="mr-1" />
        <span className="text-xs font-medium data-text">
          {count > 99 ? '99+' : count}
        </span>
      </div>
    </button>
  );
};

export default AlertNotificationBadge;