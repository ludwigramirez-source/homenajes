import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import { AuthProvider, ProtectedRoute } from "./context/AuthContext";
import NotFound from "pages/NotFound";
import Login from "./pages/login";
import AnalyticsHub from './pages/analytics-hub';
import SystemHealthMonitor from './pages/system-health-monitor';
import ExecutiveOverview from './pages/executive-overview';
import LocationPerformance from './pages/location-performance';
import OperationsControlCenter from './pages/operations-control-center';
import TributeCreationStudio from './pages/tribute-creation-studio';
import MemorialsPage from './pages/memorials';
import MemorialDetail from './pages/memorial-detail';
import RoomsManagement from './pages/rooms-management';
import DigitalDisplayScreen from './pages/digital-display-screen';
import MemorialForm from './pages/memorial-form';

const Routes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <RouterRoutes>
            {/* Rutas publicas (sin auth) */}
            <Route path="/login" element={<Login />} />
            <Route path="/digital-display-screen/:roomId" element={<DigitalDisplayScreen />} />
            <Route path="/memorial-form/:roomId" element={<MemorialForm />} />

            {/* Rutas protegidas (requieren login) */}
            <Route path="/" element={<ProtectedRoute><ExecutiveOverview /></ProtectedRoute>} />
            <Route path="/executive-overview" element={<ProtectedRoute><ExecutiveOverview /></ProtectedRoute>} />
            <Route path="/analytics-hub" element={<ProtectedRoute><AnalyticsHub /></ProtectedRoute>} />
            <Route path="/system-health-monitor" element={<ProtectedRoute><SystemHealthMonitor /></ProtectedRoute>} />
            <Route path="/location-performance" element={<ProtectedRoute><LocationPerformance /></ProtectedRoute>} />
            <Route path="/operations-control-center" element={<ProtectedRoute><OperationsControlCenter /></ProtectedRoute>} />
            <Route path="/tribute-creation-studio" element={<ProtectedRoute><TributeCreationStudio /></ProtectedRoute>} />
            <Route path="/tribute-creation-studio/:memorialId" element={<ProtectedRoute><TributeCreationStudio /></ProtectedRoute>} />
            <Route path="/memorials" element={<ProtectedRoute><MemorialsPage /></ProtectedRoute>} />
            <Route path="/memorials/:id" element={<ProtectedRoute><MemorialDetail /></ProtectedRoute>} />
            <Route path="/salas" element={<ProtectedRoute><RoomsManagement /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
