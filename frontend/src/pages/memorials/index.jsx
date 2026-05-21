import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import TributesList from '../tribute-creation-studio/components/TributesList';

// Pagina dedicada para listar todos los homenajes (activos e inactivos).
// Reusa el componente TributesList que tambien vive en el studio como tab.
const MemorialsPage = () => {
  return (
    <>
      <Helmet>
        <title>Homenajes | SERCOFUN</title>
      </Helmet>
      <Header />
      <div className="min-h-screen bg-background">
        {/* Brand header de la seccion */}
        <div
          className="relative overflow-hidden sticky top-16 z-40"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #a7c9d2, transparent)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #477a7b, transparent)', transform: 'translate(-30%, 30%)' }} />

          <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  <Icon name="BookOpen" size={20} color="#ffffff" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Homenajes</h1>
                  <p className="text-xs text-white/70 font-body">
                    Listado de todos los homenajes creados, activos e inactivos
                  </p>
                </div>
              </div>

              <Link
                to="/tribute-creation-studio"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-bold text-sm
                  transition-smooth hover-lift press-scale text-primary"
                style={{ background: '#ffffff' }}
              >
                <Icon name="Plus" size={16} color="#1a7472" />
                Crear Homenaje
              </Link>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-w-[1920px] mx-auto px-6 py-6">
          <div className="bg-card rounded-lg border border-border shadow-elevation-md p-6">
            <TributesList />
          </div>
        </div>
      </div>
    </>
  );
};

export default MemorialsPage;
