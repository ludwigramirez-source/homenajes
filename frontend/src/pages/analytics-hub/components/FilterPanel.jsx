import React, { useState } from 'react';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import LocationContextSelector from '../../../components/ui/LocationContextSelector';

const FilterPanel = ({ onFilterChange, className = '' }) => {
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedLocations, setSelectedLocations] = useState(['all']);
  const [tributeCategory, setTributeCategory] = useState('all');
  const [comparisonMode, setComparisonMode] = useState('period');

  const dateRangeOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'last7days', label: 'Últimos 7 días' },
    { value: 'last30days', label: 'Últimos 30 días' },
    { value: 'last90days', label: 'Últimos 90 días' },
    { value: 'thisMonth', label: 'Este mes' },
    { value: 'lastMonth', label: 'Mes anterior' },
    { value: 'thisQuarter', label: 'Este trimestre' },
    { value: 'thisYear', label: 'Este año' },
    { value: 'custom', label: 'Rango personalizado' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'traditional', label: 'Tradicional' },
    { value: 'modern', label: 'Moderno' },
    { value: 'religious', label: 'Religioso' },
    { value: 'secular', label: 'Secular' },
    { value: 'military', label: 'Militar' },
    { value: 'youth', label: 'Joven' }
  ];

  const comparisonOptions = [
    { value: 'period', label: 'Período vs Período' },
    { value: 'location', label: 'Ubicación vs Ubicación' },
    { value: 'category', label: 'Categoría vs Categoría' }
  ];

  const handleApplyFilters = () => {
    onFilterChange?.({
      dateRange,
      locations: selectedLocations,
      category: tributeCategory,
      comparison: comparisonMode
    });
  };

  const handleResetFilters = () => {
    setDateRange('last30days');
    setSelectedLocations(['all']);
    setTributeCategory('all');
    setComparisonMode('period');
    onFilterChange?.({
      dateRange: 'last30days',
      locations: ['all'],
      category: 'all',
      comparison: 'period'
    });
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 
      shadow-elevation-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="Filter" size={20} color="var(--color-primary)" />
          <h3 className="font-heading text-base font-semibold text-foreground">
            Filtros Avanzados
          </h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          iconName="RotateCcw"
          onClick={handleResetFilters}
        >
          Restablecer
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Rango de Fechas"
          options={dateRangeOptions}
          value={dateRange}
          onChange={setDateRange}
          searchable
        />

        <LocationContextSelector
          value={selectedLocations}
          onChange={setSelectedLocations}
        />

        <Select
          label="Categoría de Tributo"
          options={categoryOptions}
          value={tributeCategory}
          onChange={setTributeCategory}
        />

        <Select
          label="Modo de Comparación"
          options={comparisonOptions}
          value={comparisonMode}
          onChange={setComparisonMode}
        />
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon name="Info" size={14} />
          <span className="caption text-xs">
            Filtros aplicados: {selectedLocations?.length === 1 && selectedLocations?.[0] === 'all' ? 'Todas las ubicaciones' : `${selectedLocations?.length} ubicaciones`}
          </span>
        </div>
        <Button 
          variant="default"
          size="sm"
          iconName="Check"
          onClick={handleApplyFilters}
        >
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;