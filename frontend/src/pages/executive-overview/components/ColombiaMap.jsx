import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const ColombiaMap = ({ locations = [], onLocationClick }) => {
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('all');

  const regions = [
    { value: 'all', label: 'Todas las regiones' },
    { value: 'andina', label: 'Región Andina' },
    { value: 'caribe', label: 'Región Caribe' },
    { value: 'pacifica', label: 'Región Pacífica' },
    { value: 'orinoquia', label: 'Región Orinoquía' }
  ];

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'bg-success';
    if (score >= 75) return 'bg-accent';
    if (score >= 60) return 'bg-warning';
    return 'bg-error';
  };

  const getPerformanceLabel = (score) => {
    if (score >= 90) return 'Excelente';
    if (score >= 75) return 'Bueno';
    if (score >= 60) return 'Regular';
    return 'Necesita atención';
  };

  const filteredLocations = selectedRegion === 'all' 
    ? locations 
    : locations?.filter(loc => loc?.region === selectedRegion);

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-1">
            Mapa de Rendimiento por Ubicación
          </h3>
          <p className="caption text-xs text-muted-foreground">
            Vista geográfica del desempeño en Colombia
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Icon name="Filter" size={16} color="var(--color-muted-foreground)" />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e?.target?.value)}
            className="px-3 py-1.5 bg-background border border-border rounded-lg
              caption text-xs text-foreground transition-smooth
              focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {regions?.map(region => (
              <option key={region?.value} value={region?.value}>
                {region?.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="relative bg-muted/30 rounded-lg p-4 md:p-8 min-h-[400px] md:min-h-[500px]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Icon name="Map" size={48} color="var(--color-muted-foreground)" className="mx-auto opacity-20" />
            <p className="caption text-sm text-muted-foreground">
              Mapa interactivo de Colombia
            </p>
          </div>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredLocations?.map((location) => (
            <button
              key={location?.id}
              onClick={() => onLocationClick && onLocationClick(location)}
              onMouseEnter={() => setHoveredLocation(location?.id)}
              onMouseLeave={() => setHoveredLocation(null)}
              className="bg-card border border-border rounded-lg p-3 md:p-4
                transition-smooth hover:shadow-elevation-md hover-lift press-scale
                text-left"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="MapPin" size={14} color="var(--color-accent)" />
                    <h4 className="font-heading font-medium text-sm text-foreground">
                      {location?.city}
                    </h4>
                  </div>
                  <p className="caption text-xs text-muted-foreground">
                    {location?.name}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${getPerformanceColor(location?.performanceScore)}`} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="caption text-xs text-muted-foreground">
                    Tributos activos:
                  </span>
                  <span className="caption text-xs font-medium text-foreground data-text">
                    {location?.activeTributes}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="caption text-xs text-muted-foreground">
                    Satisfacción:
                  </span>
                  <span className="caption text-xs font-medium text-foreground data-text">
                    {location?.satisfactionScore?.toFixed(1)}/5.0
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="caption text-xs text-muted-foreground">
                    Rendimiento:
                  </span>
                  <span className={`caption text-xs font-medium ${
                    location?.performanceScore >= 75 ? 'text-success' : 'text-warning'
                  }`}>
                    {getPerformanceLabel(location?.performanceScore)}
                  </span>
                </div>
              </div>

              {hoveredLocation === location?.id && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-accent">
                    <span className="caption text-xs font-medium">
                      Ver detalles completos
                    </span>
                    <Icon name="ArrowRight" size={12} />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="caption text-xs text-muted-foreground">
            Excelente (&gt;90%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="caption text-xs text-muted-foreground">
            Bueno (75-90%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="caption text-xs text-muted-foreground">
            Regular (60-75%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-error" />
          <span className="caption text-xs text-muted-foreground">
            Necesita atención (&lt;60%)
          </span>
        </div>
      </div>
    </div>
  );
};

export default ColombiaMap;