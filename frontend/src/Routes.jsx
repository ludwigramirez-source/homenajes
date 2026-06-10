import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import { AuthProvider, ProtectedRoute } from "./context/AuthContext";
import AppLayout from "./components/ui/AppLayout";
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
import UsersPage from './pages/users';
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

            {/* Rutas protegidas (requieren login) — comparten el AppLayout con sidebar */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<ExecutiveOverview />} />
              <Route path="/executive-overview" element={<ExecutiveOverview />} />
              <Route path="/analytics-hub" element={<AnalyticsHub />} />
              <Route path="/system-health-monitor" element={<SystemHealthMonitor />} />
              <Route path="/location-performance" element={<LocationPerformance />} />
              <Route path="/operations-control-center" element={<OperationsControlCenter />} />
              <Route path="/tribute-creation-studio" element={<ProtectedRoute roles={['admin', 'operator']}><TributeCreationStudio /></ProtectedRoute>} />
              <Route path="/tribute-creation-studio/:memorialId" element={<ProtectedRoute roles={['admin', 'operator']}><TributeCreationStudio /></ProtectedRoute>} />
              <Route path="/memorials" element={<MemorialsPage />} />
              <Route path="/memorials/:id" element={<MemorialDetail />} />
              <Route path="/salas" element={<ProtectedRoute roles={['admin']}><RoomsManagement /></ProtectedRoute>} />
              {/* Sistema: solo superadministrador */}
              <Route path="/usuarios" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
