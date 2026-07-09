import React from 'react';
import Icon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';

// Selector visual de plantilla del homenaje. La plantilla (template_id)
// define el ambiente visual del display en sala y del formulario QR de
// condolencias. Las miniaturas viven en frontend/public/templates/.
const TEMPLATE_GROUPS = [
  {
    id: 'infantil',
    label: 'Infantil',
    templates: [
      { id: 'nino', label: 'Niño' },
      { id: 'nina', label: 'Niña' }
    ]
  },
  {
    id: 'adulto',
    label: 'Adulto',
    templates: [
      { id: 'agua', label: 'Agua' },
      { id: 'aire', label: 'Aire' },
      { id: 'fuego', label: 'Fuego' },
      { id: 'tierra', label: 'Tierra' },
      { id: 'bosque', label: 'Bosque' },
      { id: 'nubes', label: 'Nubes' }
    ]
  }
];

// Gradiente teal del diseño clásico (homenajes creados antes de las plantillas).
const LEGACY_GRADIENT = 'linear-gradient(160deg, #1a9490, #0f4a48)';

const TemplateCard = ({ id, label, selected, onSelect, children }) => (
  <button
    type="button"
    onClick={() => onSelect(id)}
    aria-pressed={selected}
    className={cn(
      'group text-left rounded-lg overflow-hidden bg-card transition-all duration-200',
      'hover:shadow-elevation-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    )}
    style={{
      border: selected ? '2px solid #1a7472' : '2px solid transparent',
      boxShadow: selected ? '0 0 0 1px rgba(26,116,114,0.15)' : undefined
    }}
  >
    <div className="relative aspect-video bg-muted">
      {children}
      {selected && (
        <div
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
          style={{ background: '#1a7472' }}
        >
          <Icon name="Check" size={14} color="#ffffff" strokeWidth={3} />
        </div>
      )}
    </div>
    <div
      className={cn(
        'px-3 py-2 text-sm font-medium transition-colors',
        selected ? 'text-primary' : 'text-foreground group-hover:text-primary'
      )}
    >
      {label}
    </div>
  </button>
);

const TemplatePickerForm = ({ formData, errors, updateFormData }) => {
  const selectedId = formData?.templateId;
  const handleSelect = (id) => updateFormData('templateId', id);

  // Solo homenajes viejos en edicion (template_id 'default') pueden conservar
  // el diseño clásico; para homenajes nuevos no se ofrece.
  const showLegacyCard = selectedId === 'default';

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Plantilla del Homenaje</h3>
        <p className="text-sm text-muted-foreground">
          La plantilla define el ambiente visual de la pantalla en sala y del formulario de condolencias.
        </p>
        {errors?.templateId && (
          <div className="mt-3 flex items-center gap-2 text-sm text-error bg-error/10 border border-error/30 rounded-md px-3 py-2">
            <Icon name="AlertCircle" size={16} className="text-error flex-shrink-0" />
            {errors?.templateId}
          </div>
        )}
      </div>

      {showLegacyCard && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
            Diseño actual
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            <TemplateCard
              id="default"
              label="Clásica"
              selected={selectedId === 'default'}
              onSelect={handleSelect}
            >
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: LEGACY_GRADIENT }}
              >
                <Icon name="Heart" size={28} color="rgba(255,255,255,0.6)" />
              </div>
            </TemplateCard>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Este homenaje usa el diseño clásico. Puedes conservarlo o elegir una plantilla nueva.
          </p>
        </div>
      )}

      {TEMPLATE_GROUPS.map(group => (
        <div key={group.id}>
          <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
            {group.label}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.templates.map(tpl => (
              <TemplateCard
                key={tpl.id}
                id={tpl.id}
                label={tpl.label}
                selected={selectedId === tpl.id}
                onSelect={handleSelect}
              >
                <img
                  src={`/templates/thumb-${tpl.id}.png`}
                  alt={`Plantilla ${tpl.label}`}
                  className="absolute inset-0 w-full h-full object-cover rounded-none"
                  loading="lazy"
                />
              </TemplateCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TemplatePickerForm;
