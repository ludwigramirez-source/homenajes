import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { pautasService, getFileUrl } from '../../services/api';
import Icon from '../../components/AppIcon';
import { cn } from '../../utils/cn';

// Formatea fecha legible en espanol, zona horaria Bogota (mismo patron que
// el resto del panel admin).
const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Bogota'
  });
};

const PautasPage = () => {
  const [pautas, setPautas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const fileInputRef = useRef(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await pautasService.getAll();
      setPautas(r?.data || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Error cargando las pautas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activeCount = pautas.filter(p => p.active).length;

  const uploadFile = async (file) => {
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      setUploadError('Por favor selecciona un archivo de imagen válido');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen no debe superar 5MB');
      return;
    }
    setUploadError(null);
    try {
      setUploading(true);
      await pautasService.create(file);
      await load();
    } catch (e) {
      setUploadError(e.response?.data?.error || 'Error subiendo la imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleActive = async (p) => {
    try {
      setBusyId(p.id);
      await pautasService.update(p.id, { active: !p.active });
      await load();
    } catch (e) {
      alert('Error actualizando la pauta: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusyId(null);
    }
  };

  const deletePauta = async (p) => {
    if (!window.confirm('¿Eliminar esta pauta? Esta acción no se puede deshacer.')) return;
    try {
      setBusyId(p.id);
      await pautasService.remove(p.id);
      await load();
    } catch (e) {
      alert('Error eliminando la pauta: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Helmet><title>Pautas | SERCOFUN</title></Helmet>
      <div className="min-h-screen bg-background">
        {/* Header teal */}
        <div className="relative overflow-hidden sticky top-0 z-40"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
          <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Icon name="MonitorPlay" size={20} color="#ffffff" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Pautas</h1>
                <p className="text-xs text-white/70 font-body">
                  Contenido que rota en las pantallas de sala cuando no hay homenaje activo
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-6 py-6 space-y-6">
          {/* Card 1: explicacion + subida */}
          <div className="bg-card rounded-lg border border-border shadow-elevation-md p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Cómo funciona</h3>
              <p className="text-sm text-muted-foreground max-w-3xl">
                Mientras una sala no tenga un homenaje activo, en vez de mostrar "Sala disponible" la pantalla
                rota las imágenes marcadas como <strong>Activa</strong> aquí abajo, 20 segundos cada una. Si hay
                una sola activa, se repite ella sola. En cuanto se active un homenaje en esa sala, la rotación se
                pausa sola; al desactivarse el homenaje, vuelve a retomar las pautas activas automáticamente — no
                hace falta pausar ni reanudar nada a mano.
              </p>
            </div>

            {uploadError && (
              <p className="text-destructive text-sm flex items-center gap-2">
                <Icon name="AlertCircle" size={15} /> {uploadError}
              </p>
            )}

            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                uploadFile(e.dataTransfer?.files?.[0]);
              }}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors max-w-xl',
                uploading ? 'opacity-60 cursor-wait' : 'cursor-pointer',
                isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent hover:bg-accent/5'
              )}
            >
              <Icon name={uploading ? 'Loader' : 'Upload'} size={32}
                className={cn('mx-auto mb-3 text-muted-foreground', uploading && 'animate-spin')} />
              <p className="text-sm font-medium text-foreground mb-1">
                {uploading ? 'Subiendo...' : 'Haz clic o arrastra una imagen aquí'}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG o WEBP (máx. 5MB) · Recomendado 1920×1080px (16:9), igual que la pantalla del TV.
                Si subes otra proporción, se ajusta centrada sin recortar ni deformar.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => uploadFile(e.target.files?.[0])}
                className="hidden"
              />
            </div>
          </div>

          {/* Card 2: listado */}
          <div className="bg-card rounded-lg border border-border shadow-elevation-md p-6 space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Pautas cargadas</h3>
                <p className="text-sm text-muted-foreground">
                  {pautas.length} {pautas.length === 1 ? 'imagen' : 'imágenes'} · {activeCount} {activeCount === 1 ? 'activa' : 'activas'} rotando ahora
                </p>
              </div>
              <button
                onClick={load}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors"
              >
                <Icon name="RefreshCw" size={14} />
                Refrescar
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-muted-foreground">
                <Icon name="Loader" size={32} className="animate-spin mx-auto mb-3" />
                Cargando pautas...
              </div>
            ) : error ? (
              <div className="py-12 text-center text-destructive">
                <Icon name="AlertCircle" size={32} className="mx-auto mb-3" />
                {error}
              </div>
            ) : pautas.length === 0 ? (
              <div className="py-16 text-center">
                <Icon name="ImageOff" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-1">Aún no hay pautas cargadas</h3>
                <p className="text-sm text-muted-foreground">
                  Sube la primera imagen arriba para que empiece a mostrarse en las salas sin homenaje activo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pautas.map((p) => (
                  <div key={p.id} className="border border-border rounded-lg overflow-hidden bg-background">
                    <div className="aspect-video bg-muted/40 relative">
                      <img
                        src={getFileUrl(p.image_url)}
                        alt={p.title || 'Pauta'}
                        className="w-full h-full object-contain"
                      />
                      <span className={cn(
                        'absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                        p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', p.active ? 'bg-green-500' : 'bg-gray-400')} />
                        {p.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Subida {formatDate(p.created_at)}
                        {p.created_by_name ? ` · ${p.created_by_name}` : ''}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(p)}
                          disabled={busyId === p.id}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50',
                            p.active
                              ? 'bg-muted text-foreground hover:bg-muted/70'
                              : 'text-white hover:opacity-90'
                          )}
                          style={!p.active ? { background: '#1a7472' } : undefined}
                        >
                          <Icon name={p.active ? 'PowerOff' : 'Power'} size={14} />
                          {p.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => deletePauta(p)}
                          disabled={busyId === p.id}
                          className="p-2 rounded-md hover:bg-destructive/10 transition-colors text-destructive disabled:opacity-50"
                          title="Eliminar pauta"
                        >
                          <Icon name={busyId === p.id ? 'Loader' : 'Trash2'} size={16}
                            className={busyId === p.id ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PautasPage;
