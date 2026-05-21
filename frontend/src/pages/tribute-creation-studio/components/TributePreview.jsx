import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '../../../utils/cn';

const TributePreview = ({ formData }) => {
  const getBackgroundGradient = () => {
    const themes = {
      nature: 'from-green-900/20 via-emerald-800/20 to-teal-900/20',
      religious: 'from-blue-900/20 via-indigo-800/20 to-purple-900/20',
      abstract: 'from-gray-900/20 via-slate-800/20 to-zinc-900/20',
      floral: 'from-pink-900/20 via-rose-800/20 to-red-900/20',
      sky: 'from-sky-900/20 via-blue-800/20 to-cyan-900/20',
      minimal: 'from-gray-50 via-gray-100 to-gray-50'
    };
    return themes?.[formData?.backgroundTheme] || themes?.nature;
  };

  const getColorSchemeClass = () => {
    const schemes = {
      classic: 'text-slate-800',
      warm: 'text-amber-900',
      cool: 'text-blue-900',
      elegant: 'text-gray-900',
      peaceful: 'text-slate-700'
    };
    return schemes?.[formData?.colorScheme] || schemes?.classic;
  };

  const getTypographyClass = () => {
    const fonts = {
      elegant: 'font-serif',
      modern: 'font-sans',
      traditional: 'font-serif'
    };
    return fonts?.[formData?.typography] || fonts?.elegant;
  };

  const getMessageText = () => {
    if (formData?.messageTemplate === 'custom') {
      return formData?.customMessage || 'Mensaje personalizado';
    }
    
    const templates = {
      template1: 'En memoria de un ser querido',
      template2: 'Siempre en nuestros corazones',
      template3: 'Su legado vivirá por siempre',
      template4: 'Descansa en paz',
      template5: 'Hasta pronto, querido amigo'
    };
    return templates?.[formData?.messageTemplate] || templates?.template1;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date?.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-elevation-md overflow-hidden">
      <div className="bg-accent/10 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-error"></div>
          <div className="w-3 h-3 rounded-full bg-warning"></div>
          <div className="w-3 h-3 rounded-full bg-success"></div>
          <span className="ml-2 text-xs font-medium text-muted-foreground">Vista Previa - Pantalla Digital</span>
        </div>
      </div>
      <div className="aspect-video bg-gray-900 relative overflow-hidden">
        {/* Fondo con gradiente */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br",
          getBackgroundGradient()
        )}>
          {/* Overlay sutil */}
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Contenido del tributo */}
        <div className="relative h-full flex flex-col items-center justify-center p-8 text-white">
          {/* Foto del difunto */}
          <div className="mb-6">
            {formData?.photoPreview ? (
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/80 shadow-2xl">
                  <img
                    src={formData?.photoPreview}
                    alt="Fotografía del difunto"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-white/10 border-4 border-white/30 flex items-center justify-center">
                <svg className="w-16 h-16 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>

          {/* Nombre */}
          <h1 className={cn(
            "text-3xl font-bold text-center mb-2 drop-shadow-lg",
            getTypographyClass()
          )}>
            {formData?.fullName || 'Nombre del Difunto'}
          </h1>

          {/* Fechas */}
          <div className="flex items-center gap-3 mb-4 text-sm opacity-90">
            <span>{formatDate(formData?.birthDate) || 'Fecha de nacimiento'}</span>
            <span className="text-2xl">✦</span>
            <span>{formatDate(formData?.deathDate) || 'Fecha de fallecimiento'}</span>
          </div>

          {/* Mensaje conmemorativo */}
          <p className={cn(
            "text-lg italic text-center mb-6 max-w-md opacity-90",
            getTypographyClass()
          )}>
            "{getMessageText()}"
          </p>

          {/* Código QR */}
          <div className="bg-white p-4 rounded-lg shadow-2xl">
            <QRCodeSVG
              value={`https://tributos.funeraria.com/${formData?.room || 'sala'}/${Date.now()}`}
              size={80}
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-xs mt-2 opacity-75">Escanea para dejar tu mensaje</p>
        </div>

        {/* Indicador de sala */}
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
          <p className="text-xs text-white/80">
            {formData?.room ? `Sala: ${formData?.room}` : 'Sin sala asignada'}
          </p>
        </div>

        {/* Tiempo de rotación */}
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
          <p className="text-xs text-white/80">
            Rotación: {formData?.slideshowTiming}s
          </p>
        </div>
      </div>
      <div className="px-4 py-3 bg-muted/30 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Esta es una representación aproximada de cómo se verá el tributo en las pantallas digitales
        </p>
      </div>
    </div>
  );
};

export default TributePreview;