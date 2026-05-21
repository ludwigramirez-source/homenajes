import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const TopTemplatesCard = ({ templates, className = '' }) => {
  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 
      shadow-elevation-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Plantillas Más Usadas
        </h3>
        <Icon name="Award" size={18} color="var(--color-accent)" />
      </div>
      <div className="space-y-3">
        {templates?.map((template, index) => (
          <div 
            key={template?.id}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-smooth"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden">
              <Image 
                src={template?.thumbnail}
                alt={template?.thumbnailAlt}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`
                  w-6 h-6 rounded-full flex items-center justify-center
                  caption text-xs font-medium
                  ${index === 0 ? 'bg-accent text-accent-foreground' : 
                    index === 1 ? 'bg-primary/20 text-primary': 'bg-muted text-muted-foreground'}
                `}>
                  {index + 1}
                </span>
                <h4 className="caption text-sm font-medium text-foreground truncate">
                  {template?.name}
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <span className="caption text-xs text-muted-foreground">
                  {template?.usage} usos
                </span>
                <span className="caption text-xs text-success">
                  {template?.satisfaction}% satisfacción
                </span>
              </div>
            </div>
            <Icon name="ChevronRight" size={16} color="var(--color-muted-foreground)" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopTemplatesCard;