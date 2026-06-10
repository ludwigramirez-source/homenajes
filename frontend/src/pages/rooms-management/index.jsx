import React, { useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import { cn } from '../../utils/cn';
import LocationsTab from './components/LocationsTab';
import RoomsTab from './components/RoomsTab';

const TABS = [
  { id: 'rooms', label: 'Salas', icon: 'Home' },
  { id: 'locations', label: 'Sedes', icon: 'Building2' }
];

// Modulo de gestion de sedes (funerarias) y salas de velacion.
const RoomsManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = TABS.some(t => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'rooms';
  const [activeTab, setActiveTab] = useState(initial);

  // El tab activo registra aqui su handler de "crear" para que el boton del
  // header (siempre visible, dentro de la barra sticky) lo dispare.
  const createRef = useRef(null);
  const triggerCreate = () => { if (createRef.current) createRef.current(); };

  const changeTab = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id }, { replace: true });
  };

  return (
    <>
      <Helmet><title>Gestión de Salas | SERCOFUN</title></Helmet>
      <Header />
      <div className="min-h-screen bg-background">
        {/* Brand header */}
        <div className="relative overflow-hidden sticky top-16 z-40"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #a7c9d2, transparent)', transform: 'translate(30%, -30%)' }} />

          <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Icon name="LayoutGrid" size={20} color="#ffffff" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Gestión de Salas</h1>
                  <p className="text-xs text-white/70 font-body">Administra las sedes y las salas de velación</p>
                </div>
              </div>

              {/* Boton crear SIEMPRE visible (dentro del header sticky) */}
              <button
                type="button"
                onClick={triggerCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-bold text-sm
                  transition-smooth hover-lift press-scale text-primary"
                style={{ background: '#ffffff' }}
              >
                <Icon name="Plus" size={16} color="#1a7472" />
                {activeTab === 'rooms' ? 'Nueva sala' : 'Nueva sede'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-[1920px] mx-auto px-6 relative z-10">
            <div className="flex">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => changeTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                    activeTab === tab.id ? "border-white text-white" : "border-transparent text-white/60 hover:text-white"
                  )}
                >
                  <Icon name={tab.icon} size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-6 py-6">
          <div className="bg-card rounded-lg border border-border shadow-elevation-md p-6">
            {activeTab === 'rooms' && <RoomsTab registerCreate={(fn) => { createRef.current = fn; }} />}
            {activeTab === 'locations' && <LocationsTab registerCreate={(fn) => { createRef.current = fn; }} />}
          </div>
        </div>
      </div>
    </>
  );
};

export default RoomsManagement;
