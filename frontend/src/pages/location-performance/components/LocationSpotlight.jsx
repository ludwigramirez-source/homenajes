import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const LocationSpotlight = ({ location, className = '' }) => {
  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-accent/10 rounded-lg">
          <Icon name="Award" size={20} color="var(--color-accent)" />
        </div>
        <h3 className="font-heading font-semibold text-base md:text-lg text-foreground">
          Ubicación Destacada
        </h3>
      </div>
      <div className="space-y-4">
        <div className="relative h-32 md:h-40 rounded-lg overflow-hidden">
          <Image
            src={location?.image}
            alt={location?.imageAlt}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 px-2 py-1 bg-success text-success-foreground
            rounded caption text-xs font-medium">
            Q1 - Excelente
          </div>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-base text-foreground mb-1">
            {location?.name}
          </h4>
          <div className="flex items-center gap-2 caption text-xs text-muted-foreground">
            <Icon name="MapPin" size={14} />
            <span>{location?.city}, {location?.region}</span>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="caption text-xs text-muted-foreground">Tributos/Mes:</span>
            <span className="font-heading font-semibold text-sm text-foreground data-text">
              {location?.tributesPerMonth}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="caption text-xs text-muted-foreground">Engagement:</span>
            <span className="font-heading font-semibold text-sm text-success data-text">
              {location?.engagementRate}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="caption text-xs text-muted-foreground">Satisfacción:</span>
            <div className="flex items-center gap-1">
              <Icon name="Star" size={14} color="var(--color-accent)" />
              <span className="font-heading font-semibold text-sm text-foreground data-text">
                {location?.satisfaction}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="caption text-xs text-muted-foreground">Eficiencia:</span>
            <span className="font-heading font-semibold text-sm text-accent data-text">
              ${location?.revenueEfficiency}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-start gap-2 mb-3">
            <Icon name="Lightbulb" size={16} color="var(--color-accent)" className="mt-0.5" />
            <div>
              <h5 className="font-heading font-medium text-sm text-foreground mb-1">
                Mejores Prácticas
              </h5>
              <ul className="space-y-1 caption text-xs text-muted-foreground">
                {location?.bestPractices?.map((practice, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-accent mt-0.5">•</span>
                    <span>{practice}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-start gap-2">
            <Icon name="Target" size={16} color="var(--color-primary)" className="mt-0.5" />
            <div>
              <h5 className="font-heading font-medium text-sm text-foreground mb-1">
                Factores de Éxito
              </h5>
              <p className="caption text-xs text-muted-foreground leading-relaxed">
                {location?.successFactors}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSpotlight;