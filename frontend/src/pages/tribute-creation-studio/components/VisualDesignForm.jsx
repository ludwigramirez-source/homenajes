import React from 'react';
import Select from '../../../components/ui/Select';

import { cn } from '../../../utils/cn';

const VisualDesignForm = ({ formData, errors, updateFormData }) => {
  const backgroundThemes = [
    { value: 'nature', label: 'Naturaleza', description: 'Paisajes serenos' },
    { value: 'religious', label: 'Religioso', description: 'Símbolos espirituales' },
    { value: 'abstract', label: 'Abstracto', description: 'Patrones suaves' },
    { value: 'floral', label: 'Floral', description: 'Flores y jardines' },
    { value: 'sky', label: 'Cielo', description: 'Nubes y atardeceres' },
    { value: 'minimal', label: 'Minimalista', description: 'Fondo simple' }
  ];

  const colorSchemes = [
    { value: 'classic', label: 'Clásico', color: '#2C3E50' },
    { value: 'warm', label: 'Cálido', color: '#8B4513' },
    { value: 'cool', label: 'Fresco', color: '#4682B4' },
    { value: 'elegant', label: 'Elegante', color: '#1C1C1C' },
    { value: 'peaceful', label: 'Pacífico', color: '#708090' }
  ];

  const typographyOptions = [
    { value: 'elegant', label: 'Elegante (Serif)' },
    { value: 'modern', label: 'Moderno (Sans-serif)' },
    { value: 'traditional', label: 'Tradicional (Clásico)' }
  ];

  const messageTemplates = [
    { value: 'template1', label: 'En memoria de un ser querido' },
    { value: 'template2', label: 'Siempre en nuestros corazones' },
    { value: 'template3', label: 'Su legado vivirá por siempre' },
    { value: 'template4', label: 'Descansa en paz' },
    { value: 'template5', label: 'Hasta pronto, querido amigo' },
    { value: 'custom', label: 'Mensaje Personalizado' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Diseño Visual</h3>
        <p className="text-sm text-muted-foreground">Personalice la apariencia del tributo en las pantallas digitales</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Tema de Fondo"
          placeholder="Seleccione un tema"
          options={backgroundThemes}
          value={formData?.backgroundTheme}
          onChange={(value) => updateFormData('backgroundTheme', value)}
          required
        />

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Esquema de Color <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {colorSchemes?.map(scheme => (
              <button
                key={scheme?.value}
                onClick={() => updateFormData('colorScheme', scheme?.value)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                  formData?.colorScheme === scheme?.value
                    ? "border-accent bg-accent/5" :"border-border hover:border-accent/50"
                )}
              >
                <div
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: scheme?.color }}
                />
                <span className="text-sm font-medium text-foreground">{scheme?.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Select
          label="Tipografía"
          placeholder="Seleccione estilo de texto"
          options={typographyOptions}
          value={formData?.typography}
          onChange={(value) => updateFormData('typography', value)}
          required
        />

        <div className="md:col-span-2">
          <Select
            label="Plantilla de Mensaje"
            placeholder="Seleccione una plantilla"
            options={messageTemplates}
            value={formData?.messageTemplate}
            onChange={(value) => updateFormData('messageTemplate', value)}
            required
          />
        </div>

        {formData?.messageTemplate === 'custom' && (
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground block mb-2">
              Mensaje Personalizado
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Escriba su mensaje personalizado..."
              value={formData?.customMessage}
              onChange={(e) => updateFormData('customMessage', e?.target?.value)}
              rows={3}
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData?.customMessage?.length || 0} / 150 caracteres
            </p>
          </div>
        )}

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-foreground block mb-2">
            Tiempo de Rotación del Slide (segundos)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="30"
              max="90"
              step="5"
              value={formData?.slideshowTiming}
              onChange={(e) => updateFormData('slideshowTiming', parseInt(e?.target?.value))}
              className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="bg-muted px-4 py-2 rounded-md min-w-[80px] text-center">
              <span className="text-lg font-semibold text-foreground">{formData?.slideshowTiming}</span>
              <span className="text-xs text-muted-foreground ml-1">seg</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tiempo que cada tributo se mostrará en pantalla antes de rotar al siguiente
          </p>
        </div>
      </div>
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-accent/10 rounded-full p-2">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-foreground mb-1">Vista Previa en Tiempo Real</h4>
            <p className="text-xs text-muted-foreground">
              Los cambios que realice aquí se reflejarán inmediatamente en la vista previa a la derecha.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualDesignForm;