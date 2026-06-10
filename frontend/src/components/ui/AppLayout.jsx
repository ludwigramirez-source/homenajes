import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Icon from '../AppIcon';
import Sidebar from './Sidebar';

// Layout principal de las rutas autenticadas: sidebar fijo a la izquierda +
// area de contenido. En movil el sidebar es off-canvas con boton hamburguesa.
const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Boton hamburguesa (solo movil, oculto cuando el menu esta abierto) */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-3 left-3 z-[55] w-10 h-10 rounded-md flex items-center justify-center shadow-md"
          style={{ background: '#1a7472' }}
          aria-label="Abrir menú"
        >
          <Icon name="Menu" size={20} color="#ffffff" />
        </button>
      )}

      {/* Contenido: deja espacio para el sidebar en desktop */}
      <div className="lg:pl-64">
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
