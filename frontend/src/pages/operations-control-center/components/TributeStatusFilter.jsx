import React from 'react';
import Icon from '../../../components/AppIcon';

const TributeStatusFilter = ({ selected = 'all', onChange, counts = {} }) => {
  const filters = [
    { 
      id: 'all', 
      label: 'Todos', 
      icon: 'LayoutGrid',
      count: counts?.all || 0
    },
    { 
      id: 'active', 
      label: 'Activos', 
      icon: 'CheckCircle2',
      count: counts?.active || 0,
      color: 'text-success'
    },
    { 
      id: 'pending', 
      label: 'Pendientes', 
      icon: 'Clock',
      count: counts?.pending || 0,
      color: 'text-warning'
    },
    { 
      id: 'completed', 
      label: 'Completados', 
      icon: 'Archive',
      count: counts?.completed || 0,
      color: 'text-muted-foreground'
    },
    { 
      id: 'expired', 
      label: 'Expirados', 
      icon: 'XCircle',
      count: counts?.expired || 0,
      color: 'text-error'
    }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters?.map(filter => (
        <button
          key={filter?.id}
          onClick={() => onChange(filter?.id)}
          className={`
            flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg
            font-heading font-medium text-sm transition-smooth
            hover-lift press-scale
            ${selected === filter?.id
              ? 'bg-accent text-accent-foreground shadow-elevation-sm'
              : 'bg-card text-foreground hover:bg-muted border border-border'
            }
          `}
        >
          <Icon 
            name={filter?.icon} 
            size={16} 
            className={selected === filter?.id ? '' : filter?.color}
          />
          <span className="hidden sm:inline">{filter?.label}</span>
          <span className={`
            px-1.5 py-0.5 rounded caption text-xs font-medium data-text
            ${selected === filter?.id 
              ? 'bg-accent-foreground/20' 
              : 'bg-muted'
            }
          `}>
            {filter?.count}
          </span>
        </button>
      ))}
    </div>
  );
};

export default TributeStatusFilter;