import React, { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';

// Vista previa del tributo: muestra el display SSR real dentro de un iframe
// escalado, con botones manuales para rotar entre las 3 pantallas.
// Funciona solo en modo edicion (cuando ya existe el memorial en BD); en
// creacion, muestra un placeholder pidiendo guardar primero.
const SCREENS = [
  { n: 1, label: 'Servicio' },
  { n: 2, label: 'Mensaje' },
  { n: 3, label: 'Código QR' }
];

// Resolucion nativa del display (las pantallas LG son 1920x1080).
// Renderizamos el iframe a esta resolucion y la escalamos via CSS transform
// para que quepa en el panel lateral del studio sin perder fidelidad visual.
const NATIVE_WIDTH = 1920;
const NATIVE_HEIGHT = 1080;

const TributePreview = ({ formData }) => {
  // En edicion la URL del studio es /tribute-creation-studio/:memorialId
  // Pero el display SSR usa roomId, no memorialId. roomId esta en formData.room.
  const { memorialId } = useParams();
  const roomId = formData?.room;
  // Plantilla elegida en el wizard: se pasa como override (?template=) al SSR
  // para previsualizarla ANTES de guardar. 'default' no se envia (es el fallback).
  const templateId = formData?.templateId;

  const [currentScreen, setCurrentScreen] = useState(1);
  const containerRef = useRef(null);

  // El iframe se reinicia cuando cambia su src; con un nonce forzamos a recargar
  // cuando el usuario guarda cambios (ej. cambia la foto y queremos verla refrescada).
  const [refreshNonce, setRefreshNonce] = useState(0);

  const previewSrc = useMemo(() => {
    if (!roomId) return '';
    const parts = ['preview=1', `screen=${currentScreen}`, `_=${refreshNonce}`];
    if (templateId && templateId !== 'default') {
      parts.push(`template=${encodeURIComponent(templateId)}`);
    }
    return `/digital-display-screen/${encodeURIComponent(roomId)}?${parts.join('&')}`;
  }, [roomId, currentScreen, refreshNonce, templateId]);

  const goPrev = () => setCurrentScreen(s => (s === 1 ? 3 : s - 1));
  const goNext = () => setCurrentScreen(s => (s === 3 ? 1 : s + 1));

  // Calculamos el scale dinamicamente a partir del ancho del contenedor.
  // Usamos un estado local que se actualiza con ResizeObserver para responder
  // a cambios de tamano del panel lateral.
  const [scale, setScale] = useState(0.22);
  React.useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      const w = containerRef.current?.clientWidth || 0;
      if (w > 0) setScale(w / NATIVE_WIDTH);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const scaledHeight = NATIVE_HEIGHT * scale;

  // Si NO hay roomId / memorial guardado, mostramos placeholder.
  const canPreview = !!roomId && !!memorialId;

  return (
    <div className="bg-card rounded-lg border border-border shadow-elevation-md overflow-hidden">
      {/* Header */}
      <div className="bg-accent/10 border-b border-border px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-3 h-3 rounded-full bg-error" />
          <div className="w-3 h-3 rounded-full bg-warning" />
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="ml-1 text-xs font-medium text-muted-foreground truncate">
            Vista Previa &middot; Pantalla {currentScreen} de 3
            <span className="hidden lg:inline"> &middot; {SCREENS[currentScreen - 1].label}</span>
          </span>
        </div>
        {canPreview && (
          <button
            type="button"
            onClick={() => setRefreshNonce(n => n + 1)}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
            title="Refrescar vista previa"
          >
            <Icon name="RefreshCw" size={14} />
          </button>
        )}
      </div>

      {/* Viewport */}
      <div ref={containerRef} className="bg-gray-900 relative" style={{ height: scaledHeight }}>
        {canPreview ? (
          <iframe
            key={refreshNonce}
            src={previewSrc}
            title="Vista previa del display"
            // Necesitamos width/height nativos del display porque escalamos via transform.
            // Sin estos, el iframe arrastraria el layout original.
            style={{
              width: NATIVE_WIDTH + 'px',
              height: NATIVE_HEIGHT + 'px',
              border: 'none',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              backgroundColor: '#155f5d'
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-center p-6 text-white/80">
            <div>
              <Icon name="Monitor" size={40} className="mx-auto mb-3 opacity-60" />
              <p className="text-sm font-medium">Vista previa no disponible</p>
              <p className="text-xs mt-1 opacity-70">
                {memorialId
                  ? 'Selecciona una sala para ver la vista previa.'
                  : 'Guarda el tributo para ver cómo se verá en el display.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controles de navegacion manual entre pantallas */}
      <div className="px-3 py-2.5 bg-muted/30 border-t border-border">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canPreview}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              canPreview
                ? "border border-border hover:bg-muted text-foreground"
                : "opacity-50 cursor-not-allowed text-muted-foreground"
            )}
            title="Pantalla anterior"
          >
            <Icon name="ChevronLeft" size={14} />
            Atr&aacute;s
          </button>

          {/* Indicadores de pantalla, clickeables */}
          <div className="flex items-center gap-1.5">
            {SCREENS.map(s => (
              <button
                key={s.n}
                type="button"
                onClick={() => canPreview && setCurrentScreen(s.n)}
                disabled={!canPreview}
                className={cn(
                  "rounded-full transition-all",
                  s.n === currentScreen ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                  canPreview ? "cursor-pointer" : "cursor-not-allowed"
                )}
                style={{
                  width: s.n === currentScreen ? 22 : 8,
                  height: 8
                }}
                title={`Pantalla ${s.n}: ${s.label}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={!canPreview}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              canPreview
                ? "border border-border hover:bg-muted text-foreground"
                : "opacity-50 cursor-not-allowed text-muted-foreground"
            )}
            title="Pantalla siguiente"
          >
            Avanzar
            <Icon name="ChevronRight" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TributePreview;
