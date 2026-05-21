import React from 'react';
import Icon from '../../../components/AppIcon';

const AlertFeedItem = ({ alert, onClick }) => {
  const severityConfig = {
    critical: {
      bg: 'bg-error/10',
      border: 'border-error/30',
      text: 'text-error',
      icon: 'AlertCircle',
      iconBg: 'bg-error'
    },
    warning: {
      bg: 'bg-warning/10',
      border: 'border-warning/30',
      text: 'text-warning',
      icon: 'AlertTriangle',
      iconBg: 'bg-warning'
    },
    info: {
      bg: 'bg-accent/10',
      border: 'border-accent/30',
      text: 'text-accent',
      icon: 'Info',
      iconBg: 'bg-accent'
    },
    success: {
      bg: 'bg-success/10',
      border: 'border-success/30',
      text: 'text-success',
      icon: 'CheckCircle2',
      iconBg: 'bg-success'
    }
  };

  const config = severityConfig?.[alert?.severity] || severityConfig?.info;

  return (
    <div
      onClick={onClick}
      className={`
        p-3 md:p-4 rounded-lg border-2 transition-smooth
        ${config?.bg} ${config?.border}
        ${onClick ? 'cursor-pointer hover-lift press-scale hover:shadow-elevation-sm' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg
          ${config?.iconBg} flex items-center justify-center
        `}>
          <Icon name={config?.icon} size={18} color="white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h5 className={`
              font-heading font-semibold text-sm md:text-base
              ${config?.text} line-clamp-2
            `}>
              {alert?.title}
            </h5>
            {alert?.isNew && (
              <span className="flex-shrink-0 w-2 h-2 bg-error rounded-full animate-pulse" />
            )}
          </div>

          <p className="caption text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2">
            {alert?.message}
          </p>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div className="flex items-center gap-1 caption text-xs text-muted-foreground">
              <Icon name="Clock" size={12} />
              <span>{alert?.timestamp}</span>
            </div>
            {alert?.location && (
              <div className="flex items-center gap-1 caption text-xs text-muted-foreground">
                <Icon name="MapPin" size={12} />
                <span className="line-clamp-1">{alert?.location}</span>
              </div>
            )}
            {alert?.tributeId && (
              <div className="flex items-center gap-1 caption text-xs text-muted-foreground">
                <Icon name="Hash" size={12} />
                <span>Tributo {alert?.tributeId}</span>
              </div>
            )}
          </div>

          {alert?.actionRequired && (
            <div className="mt-2 pt-2 border-t border-border">
              <button className={`
                caption text-xs font-medium ${config?.text}
                hover:underline transition-smooth
              `}>
                Tomar acción →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertFeedItem;