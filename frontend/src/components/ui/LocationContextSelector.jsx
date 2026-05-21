import React, { useState } from 'react';
import Select from './Select';
import Icon from '../AppIcon';

const LocationContextSelector = ({ value = [], onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const colombianLocations = [
    { value: 'all', label: 'Todas las ubicaciones', region: 'Nacional' },
    { value: 'bogota-norte', label: 'Bogotá Norte', region: 'Bogotá' },
    { value: 'bogota-sur', label: 'Bogotá Sur', region: 'Bogotá' },
    { value: 'bogota-centro', label: 'Bogotá Centro', region: 'Bogotá' },
    { value: 'medellin-poblado', label: 'Medellín - El Poblado', region: 'Antioquia' },
    { value: 'medellin-laureles', label: 'Medellín - Laureles', region: 'Antioquia' },
    { value: 'cali-norte', label: 'Cali Norte', region: 'Valle del Cauca' },
    { value: 'cali-sur', label: 'Cali Sur', region: 'Valle del Cauca' },
    { value: 'barranquilla', label: 'Barranquilla', region: 'Atlántico' },
    { value: 'cartagena', label: 'Cartagena', region: 'Bolívar' },
    { value: 'bucaramanga', label: 'Bucaramanga', region: 'Santander' },
    { value: 'pereira', label: 'Pereira', region: 'Risaralda' },
    { value: 'manizales', label: 'Manizales', region: 'Caldas' },
    { value: 'ibague', label: 'Ibagué', region: 'Tolima' },
    { value: 'cucuta', label: 'Cúcuta', region: 'Norte de Santander' },
    { value: 'santa-marta', label: 'Santa Marta', region: 'Magdalena' },
    { value: 'villavicencio', label: 'Villavicencio', region: 'Meta' },
    { value: 'pasto', label: 'Pasto', region: 'Nariño' },
    { value: 'neiva', label: 'Neiva', region: 'Huila' },
    { value: 'armenia', label: 'Armenia', region: 'Quindío' }
  ];

  const groupedOptions = colombianLocations?.reduce((acc, location) => {
    if (!acc?.[location?.region]) {
      acc[location.region] = [];
    }
    acc?.[location?.region]?.push({
      value: location?.value,
      label: location?.label
    });
    return acc;
  }, {});

  const formattedOptions = Object.entries(groupedOptions)?.flatMap(([region, locations]) => [
    { value: `region-${region}`, label: region, disabled: true },
    ...locations
  ]);

  const handleChange = (selectedValues) => {
    if (selectedValues?.includes('all')) {
      onChange(['all']);
    } else {
      onChange(selectedValues?.filter(v => !v?.startsWith('region-')));
    }
  };

  const getDisplayText = () => {
    if (!value || value?.length === 0 || value?.includes('all')) {
      return 'Todas las ubicaciones';
    }
    if (value?.length === 1) {
      const location = colombianLocations?.find(loc => loc?.value === value?.[0]);
      return location ? location?.label : 'Seleccionar ubicación';
    }
    return `${value?.length} ubicaciones seleccionadas`;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border
        rounded-lg shadow-elevation-sm transition-smooth hover:shadow-elevation-md">
        <Icon name="MapPin" size={18} color="var(--color-accent)" />
        <Select
          options={formattedOptions}
          value={value}
          onChange={handleChange}
          placeholder="Seleccionar ubicación"
          searchable
          multiple
          clearable
          className="flex-1"
        />
      </div>
      
      <div className="mt-2 caption text-xs text-muted-foreground px-4">
        {getDisplayText()}
      </div>
    </div>
  );
};

export default LocationContextSelector;