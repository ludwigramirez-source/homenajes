import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const TributeStatusCard = ({ tribute, onClick }) => {
  const statusConfig = {
    active: {
      label: 'Activo',
      color: 'bg-success text-success-foreground',
      icon: 'CheckCircle2'
    },
    pending: {
      label: 'Pendiente',
      color: 'bg-warning text-warning-foreground',
      icon: 'Clock'
    },
    completed: {
      label: 'Completado',
      color: 'bg-muted text-muted-foreground',
      icon: 'Archive'
    },
    expired: {
      label: 'Expirado',
      color: 'bg-error text-error-foreground',
      icon: 'XCircle'
    }
  };

  const config = statusConfig?.[tribute?.status] || statusConfig?.pending;
  const progressPercentage = (tribute?.condolencesReceived / tribute?.condolencesTarget) * 100;

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-4 md:p-5
        transition-smooth hover-lift press-scale hover:shadow-elevation-md
        cursor-pointer"
    >
      <div className="flex items-start gap-3 md:gap-4 mb-4">
        <div className="relative flex-shrink-0">
          <Image
            src={tribute?.deceasedImage}
            alt={tribute?.deceasedImageAlt}
            className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover"
          />
          <div className={`
            absolute -bottom-1 -right-1 w-6 h-6 md:w-7 md:h-7 rounded-full
            ${config?.color} flex items-center justify-center shadow-elevation-sm
          `}>
            <Icon name={config?.icon} size={14} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-heading font-semibold text-sm md:text-base text-foreground mb-1 line-clamp-1">
            {tribute?.deceasedName}
          </h4>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`
              px-2 py-0.5 rounded caption text-xs font-medium
              ${config?.color}
            `}>
              {config?.label}
            </span>
            <span className="caption text-xs text-muted-foreground">
              ID: {tribute?.id}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs caption text-muted-foreground">
            <div className="flex items-center gap-1">
              <Icon name="MapPin" size={12} />
              <span className="line-clamp-1">{tribute?.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="Calendar" size={12} />
              <span className="whitespace-nowrap">{tribute?.date}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs md:text-sm">
          <span className="caption text-muted-foreground">Condolencias</span>
          <span className="font-medium data-text text-foreground">
            {tribute?.condolencesReceived} / {tribute?.condolencesTarget}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-accent transition-smooth"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Icon name="QrCode" size={14} color="var(--color-muted-foreground)" />
            </div>
            <p className="text-xs md:text-sm font-medium data-text text-foreground">
              {tribute?.qrScans}
            </p>
            <p className="caption text-xs text-muted-foreground">Escaneos</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Icon name="FileText" size={14} color="var(--color-muted-foreground)" />
            </div>
            <p className="text-xs md:text-sm font-medium data-text text-foreground">
              {tribute?.pdfDownloads}
            </p>
            <p className="caption text-xs text-muted-foreground">PDFs</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Icon name="Monitor" size={14} color="var(--color-muted-foreground)" />
            </div>
            <p className="text-xs md:text-sm font-medium data-text text-foreground">
              {tribute?.screenStatus}
            </p>
            <p className="caption text-xs text-muted-foreground">Pantalla</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TributeStatusCard;