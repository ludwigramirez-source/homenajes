import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import { memorialsService, condolencesService, getFileUrl } from '../../services/api';
import { cn } from '../../utils/cn';
import MessagesTab from './components/MessagesTab';
import SummaryTab from './components/SummaryTab';

const TABS = [
  { id: 'summary', label: 'Resumen', icon: 'FileText' },
  { id: 'messages', label: 'Mensajes', icon: 'MessageCircle' }
];

const MemorialDetail = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.some(t => t.id === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'summary';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [memorial, setMemorial] = useState(null);
  const [condolences, setCondolences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carga inicial: GET /memorials/:id ya trae condolencias y analytics embebidos.
  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await memorialsService.getById(id);
      if (r?.success) {
        setMemorial(r.data);
        setCondolences(r.data.condolences || []);
      } else {
        setError(r?.error || 'Error cargando homenaje');
      }
    } catch (e) {
      console.error('Error cargando homenaje:', e);
      setError(e.response?.data?.error || 'Error cargando homenaje');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // Recargar SOLO los mensajes (usado tras eliminar uno)
  const reloadMessages = async () => {
    try {
      const r = await condolencesService.getByMemorial(id);
      if (r?.success) setCondolences(r.data || []);
    } catch (e) {
      console.error('Error recargando mensajes:', e);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const activeCount = useMemo(
    () => (condolences || []).length,
    [condolences]
  );

  return (
    <>
      <Helmet>
        <title>{memorial?.deceased_name ? `${memorial.deceased_name} | Homenaje` : 'Homenaje'}</title>
      </Helmet>
      <Header />
      <div className="min-h-screen bg-background">
        {/* Brand header con datos del difunto */}
        <div
          className="relative overflow-hidden sticky top-16 z-40"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #a7c9d2, transparent)', transform: 'translate(30%, -30%)' }} />

          <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 min-w-0">
                <Link
                  to="/memorials"
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30 hover:bg-white/10 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                  title="Volver al listado"
                >
                  <Icon name="ArrowLeft" size={18} color="#ffffff" />
                </Link>

                {/* Foto pequena */}
                {memorial?.photo_url && (
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid rgba(255,255,255,0.4)' }}>
                    <img
                      src={getFileUrl(memorial.photo_url) || memorial.photo_url}
                      alt={memorial.deceased_name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                )}

                <div className="min-w-0">
                  <h1 className="text-xl md:text-2xl font-heading font-bold text-white truncate">
                    {memorial?.deceased_name || 'Cargando...'}
                  </h1>
                  <p className="text-xs text-white/70 font-body truncate">
                    {memorial?.birth_year && memorial?.death_year && `${memorial.birth_year} — ${memorial.death_year}`}
                    {memorial?.location_name && ` · ${memorial.location_name}`}
                    {memorial?.room_name && ` · ${memorial.room_name}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {memorial?.room_id && (
                  <>
                    <a
                      href={`/digital-display-screen/${memorial.room_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg font-heading font-medium text-sm
                        transition-smooth hover-lift press-scale border border-white/30 text-white hover:bg-white/10"
                    >
                      <Icon name="Monitor" size={14} color="#ffffff" />
                      Ver display
                    </a>
                    <a
                      href={`/memorial-form/${memorial.room_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg font-heading font-medium text-sm
                        transition-smooth hover-lift press-scale border border-white/30 text-white hover:bg-white/10"
                    >
                      <Icon name="ExternalLink" size={14} color="#ffffff" />
                      Formulario público
                    </a>
                  </>
                )}
                <Link
                  to={`/tribute-creation-studio/${id}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-bold text-sm
                    transition-smooth hover-lift press-scale text-primary"
                  style={{ background: '#ffffff' }}
                >
                  <Icon name="Edit3" size={14} color="#1a7472" />
                  Editar
                </Link>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-[1920px] mx-auto px-6 relative z-10">
            <div className="flex">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                    activeTab === tab.id
                      ? "border-white text-white"
                      : "border-transparent text-white/60 hover:text-white"
                  )}
                >
                  <Icon name={tab.icon} size={14} />
                  {tab.label}
                  {tab.id === 'messages' && activeCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-[1.4rem] px-1.5 h-5 text-[0.7rem] rounded-full bg-white/20">
                      {activeCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-w-[1920px] mx-auto px-6 py-6">
          {loading && (
            <div className="bg-card rounded-lg border border-border p-12 text-center text-muted-foreground">
              <Icon name="Loader" size={32} className="animate-spin mx-auto mb-3" />
              Cargando homenaje...
            </div>
          )}

          {error && !loading && (
            <div className="bg-card rounded-lg border border-destructive p-12 text-center text-destructive">
              <Icon name="AlertCircle" size={32} className="mx-auto mb-3" />
              {error}
            </div>
          )}

          {!loading && !error && memorial && (
            <div className="bg-card rounded-lg border border-border shadow-elevation-md p-6">
              {activeTab === 'summary' && <SummaryTab memorial={memorial} />}
              {activeTab === 'messages' && (
                <MessagesTab
                  memorial={memorial}
                  condolences={condolences}
                  onChange={reloadMessages}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MemorialDetail;
