import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import AlertNotificationBadge from '../../components/ui/AlertNotificationBadge';
import LocationContextSelector from '../../components/ui/LocationContextSelector';
import UserRoleIndicator from '../../components/ui/UserRoleIndicator';
import DataRefreshStatus from '../../components/ui/DataRefreshStatus';
import MetricCard from './components/MetricCard';
import TributeStatusCard from './components/TributeStatusCard';
import AlertFeedItem from './components/AlertFeedItem';
import LocationStatusRow from './components/LocationStatusRow';
import AutoRefreshControl from './components/AutoRefreshControl';
import TributeStatusFilter from './components/TributeStatusFilter';
import Icon from '../../components/AppIcon';

const OperationsControlCenter = () => {
  const [selectedLocations, setSelectedLocations] = useState(['all']);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const [selectedTribute, setSelectedTribute] = useState(null);

  const mockMetrics = [
  {
    title: 'Tributos Activos',
    value: '47',
    icon: 'Heart',
    status: 'success',
    trend: { direction: 'up', value: '+3' }
  },
  {
    title: 'Condolencias Pendientes',
    value: '128',
    icon: 'MessageSquare',
    status: 'warning',
    trend: { direction: 'up', value: '+15' }
  },
  {
    title: 'Uptime Pantallas',
    value: '98.7',
    unit: '%',
    icon: 'Monitor',
    status: 'success',
    trend: { direction: 'neutral', value: '0.0%' }
  },
  {
    title: 'Escaneos QR Hoy',
    value: '342',
    icon: 'QrCode',
    status: 'neutral',
    trend: { direction: 'up', value: '+28' }
  },
  {
    title: 'Productividad Staff',
    value: '94',
    unit: '%',
    icon: 'Users',
    status: 'success',
    trend: { direction: 'up', value: '+2%' }
  },
  {
    title: 'Alertas Críticas',
    value: '3',
    icon: 'AlertCircle',
    status: 'error',
    trend: { direction: 'down', value: '-1' }
  }];


  const mockTributes = [
  {
    id: 'TRB-2847',
    deceasedName: 'María Elena Rodríguez García',
    deceasedImage: "https://img.rocket.new/generatedImages/rocket_gen_img_150cb708e-1763295912781.png",
    deceasedImageAlt: 'Retrato profesional de mujer mayor con cabello gris corto y sonrisa cálida vistiendo blusa azul claro',
    status: 'active',
    location: 'Bogotá Norte',
    date: '28/01/2026',
    condolencesReceived: 87,
    condolencesTarget: 150,
    qrScans: 124,
    pdfDownloads: 23,
    screenStatus: 'Online'
  },
  {
    id: 'TRB-2846',
    deceasedName: 'Carlos Alberto Mendoza Pérez',
    deceasedImage: "https://img.rocket.new/generatedImages/rocket_gen_img_112193a91-1763294779964.png",
    deceasedImageAlt: 'Retrato profesional de hombre de mediana edad con cabello oscuro peinado hacia atrás vistiendo traje gris',
    status: 'pending',
    location: 'Medellín - El Poblado',
    date: '28/01/2026',
    condolencesReceived: 12,
    condolencesTarget: 100,
    qrScans: 45,
    pdfDownloads: 8,
    screenStatus: 'Online'
  },
  {
    id: 'TRB-2845',
    deceasedName: 'Ana Lucía Vargas Moreno',
    deceasedImage: "https://img.rocket.new/generatedImages/rocket_gen_img_103b528db-1763293982935.png",
    deceasedImageAlt: 'Retrato profesional de mujer joven con cabello castaño largo y sonrisa amable vistiendo blusa blanca',
    status: 'active',
    location: 'Cali Norte',
    date: '27/01/2026',
    condolencesReceived: 156,
    condolencesTarget: 200,
    qrScans: 289,
    pdfDownloads: 45,
    screenStatus: 'Online'
  },
  {
    id: 'TRB-2844',
    deceasedName: 'Jorge Enrique Sánchez López',
    deceasedImage: "https://img.rocket.new/generatedImages/rocket_gen_img_150d9e1ab-1763294307533.png",
    deceasedImageAlt: 'Retrato profesional de hombre mayor con cabello gris y barba corta vistiendo camisa azul marino',
    status: 'completed',
    location: 'Barranquilla',
    date: '26/01/2026',
    condolencesReceived: 203,
    condolencesTarget: 150,
    qrScans: 412,
    pdfDownloads: 67,
    screenStatus: 'Offline'
  },
  {
    id: 'TRB-2843',
    deceasedName: 'Patricia Isabel Gómez Ruiz',
    deceasedImage: "https://img.rocket.new/generatedImages/rocket_gen_img_142d3c9bf-1763301932985.png",
    deceasedImageAlt: 'Retrato profesional de mujer de mediana edad con cabello rubio ondulado y sonrisa radiante vistiendo suéter beige',
    status: 'active',
    location: 'Bogotá Sur',
    date: '27/01/2026',
    condolencesReceived: 64,
    condolencesTarget: 120,
    qrScans: 98,
    pdfDownloads: 19,
    screenStatus: 'Online'
  },
  {
    id: 'TRB-2842',
    deceasedName: 'Luis Fernando Torres Castro',
    deceasedImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1ae0f3431-1763296290027.png",
    deceasedImageAlt: 'Retrato profesional de hombre joven con barba oscura y cabello corto vistiendo camisa blanca',
    status: 'pending',
    location: 'Cartagena',
    date: '28/01/2026',
    condolencesReceived: 8,
    condolencesTarget: 80,
    qrScans: 23,
    pdfDownloads: 3,
    screenStatus: 'Online'
  }];


  const mockAlerts = [
  {
    id: 'ALT-001',
    severity: 'critical',
    title: 'Pantalla fuera de línea',
    message: 'La pantalla digital en Bogotá Norte ha estado desconectada durante 45 minutos',
    timestamp: 'Hace 45 min',
    location: 'Bogotá Norte',
    isNew: true,
    actionRequired: true
  },
  {
    id: 'ALT-002',
    severity: 'warning',
    title: 'Tributo próximo a expirar',
    message: 'El tributo TRB-2840 expirará en 2 horas sin alcanzar el objetivo de condolencias',
    timestamp: 'Hace 1 hora',
    tributeId: 'TRB-2840',
    location: 'Medellín - Laureles',
    isNew: true,
    actionRequired: true
  },
  {
    id: 'ALT-003',
    severity: 'info',
    title: 'Milestone alcanzado',
    message: 'El tributo TRB-2845 ha superado las 150 condolencias',
    timestamp: 'Hace 2 horas',
    tributeId: 'TRB-2845',
    location: 'Cali Norte',
    isNew: false,
    actionRequired: false
  },
  {
    id: 'ALT-004',
    severity: 'warning',
    title: 'Baja tasa de escaneo QR',
    message: 'El tributo TRB-2842 tiene solo 23 escaneos en las últimas 24 horas',
    timestamp: 'Hace 3 horas',
    tributeId: 'TRB-2842',
    location: 'Cartagena',
    isNew: false,
    actionRequired: true
  },
  {
    id: 'ALT-005',
    severity: 'success',
    title: 'Sistema restaurado',
    message: 'La conectividad en Bucaramanga ha sido completamente restaurada',
    timestamp: 'Hace 4 horas',
    location: 'Bucaramanga',
    isNew: false,
    actionRequired: false
  }];


  const mockLocations = [
  {
    id: 'LOC-001',
    name: 'Funeraria Norte',
    city: 'Bogotá Norte',
    status: 'operational',
    activeTributes: 8,
    screenUptime: 99.2,
    todayCondolences: 47,
    alerts: 0
  },
  {
    id: 'LOC-002',
    name: 'Memorial El Poblado',
    city: 'Medellín',
    status: 'warning',
    activeTributes: 6,
    screenUptime: 95.8,
    todayCondolences: 32,
    alerts: 1
  },
  {
    id: 'LOC-003',
    name: 'Jardines del Valle',
    city: 'Cali Norte',
    status: 'operational',
    activeTributes: 9,
    screenUptime: 98.5,
    todayCondolences: 56,
    alerts: 0
  },
  {
    id: 'LOC-004',
    name: 'Paz Eterna',
    city: 'Barranquilla',
    status: 'critical',
    activeTributes: 4,
    screenUptime: 87.3,
    todayCondolences: 18,
    alerts: 2
  },
  {
    id: 'LOC-005',
    name: 'Recuerdos del Sur',
    city: 'Bogotá Sur',
    status: 'operational',
    activeTributes: 7,
    screenUptime: 99.8,
    todayCondolences: 41,
    alerts: 0
  }];


  const statusCounts = {
    all: mockTributes?.length,
    active: mockTributes?.filter((t) => t?.status === 'active')?.length,
    pending: mockTributes?.filter((t) => t?.status === 'pending')?.length,
    completed: mockTributes?.filter((t) => t?.status === 'completed')?.length,
    expired: mockTributes?.filter((t) => t?.status === 'expired')?.length
  };

  const filteredTributes = mockTributes?.filter((tribute) => {
    if (selectedStatus !== 'all' && tribute?.status !== selectedStatus) return false;
    if (!selectedLocations?.includes('all') && !selectedLocations?.includes(tribute?.location)) return false;
    return true;
  });

  const criticalAlerts = mockAlerts?.filter((a) => a?.severity === 'critical')?.length;

  const handleRefresh = () => {
    setLastUpdate(new Date());
  };

  const handleTributeClick = (tribute) => {
    setSelectedTribute(tribute);
  };

  const handleAlertClick = (alert) => {
    setShowAlertDetails(true);
  };

  const handleLocationDetails = (location) => {
    console.log('Ver detalles de ubicación:', location);
  };

  const handleQuickAction = (location) => {
    console.log('Acción rápida para ubicación:', location);
  };

  return (
    <>
      <Helmet>
        <title>Centro de Control de Operaciones | FuneralTribute Dashboard</title>
        <meta name="description" content="Monitoreo en tiempo real de tributos, condolencias y operaciones de pantallas digitales en todas las ubicaciones de funerarias" />
      </Helmet>
      <div className="min-h-screen bg-background">

        <main>
          {/* Brand page header banner */}
          <div className="relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #a7c9d2, transparent)', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #477a7b, transparent)', transform: 'translate(-30%, 30%)' }} />

            <div className="px-4 md:px-6 lg:px-8 py-8 md:py-10 max-w-[1920px] mx-auto relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                      style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Icon name="Activity" size={20} color="#ffffff" />
                    </div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-white">
                      Centro de Control de Operaciones
                    </h1>
                  </div>
                  <p className="text-sm md:text-base text-white/70 font-body">
                    Monitoreo en tiempo real de tributos y operaciones en todas las ubicaciones
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <AlertNotificationBadge
                    count={criticalAlerts}
                    severity="critical"
                    onClick={() => setShowAlertDetails(true)} />

                  <DataRefreshStatus
                    lastUpdate={lastUpdate}
                    isConnected={isConnected}
                    autoRefresh={true}
                    refreshInterval={300000}
                    onRefresh={handleRefresh} />

                  <UserRoleIndicator
                    role="operations"
                    userName="Administrador de Operaciones" />
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-[1920px] mx-auto">
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col lg:flex-row gap-4 p-4 md:p-5 bg-card border border-border rounded-lg shadow-elevation-sm">
                <div className="flex-1">
                  <LocationContextSelector
                    value={selectedLocations}
                    onChange={setSelectedLocations} />
                </div>
                <div className="flex-1">
                  <AutoRefreshControl onRefresh={handleRefresh} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-5 lg:gap-6 mb-6 md:mb-8">
              {mockMetrics?.map((metric, index) =>
              <MetricCard key={index} {...metric} />
              )}
            </div>

            <div className="mb-6 md:mb-8">
              <TributeStatusFilter
                selected={selectedStatus}
                onChange={setSelectedStatus}
                counts={statusCounts} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
              <div className="xl:col-span-2">
                <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
                      Estado de Tributos en Vivo
                    </h2>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                      style={{ background: 'rgba(26,116,114,0.08)', borderColor: 'rgba(26,116,114,0.2)' }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#1a7472' }} />
                      <span className="caption text-xs font-medium" style={{ color: '#1a7472' }}>
                        En vivo
                      </span>
                    </div>
                  </div>

                  {filteredTributes?.length === 0 ?
                  <div className="text-center py-12">
                      <Icon name="Search" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No se encontraron tributos con los filtros seleccionados
                      </p>
                    </div> :

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-h-[800px] overflow-y-auto pr-2">
                      {filteredTributes?.map((tribute) =>
                    <TributeStatusCard
                      key={tribute?.id}
                      tribute={tribute}
                      onClick={() => handleTributeClick(tribute)} />
                    )}
                    </div>
                  }
                </div>
              </div>

              <div className="xl:col-span-1">
                <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm sticky top-20">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
                      Alertas y Notificaciones
                    </h2>
                    <AlertNotificationBadge
                      count={mockAlerts?.filter((a) => a?.isNew)?.length}
                      severity="warning"
                      onClick={() => setShowAlertDetails(true)} />
                  </div>

                  <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
                    {mockAlerts?.map((alert) =>
                    <AlertFeedItem
                      key={alert?.id}
                      alert={alert}
                      onClick={() => handleAlertClick(alert)} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
                  Estado por Ubicación
                </h2>
                <div className="flex items-center gap-2">
                  <Icon name="MapPin" size={20} color="#1a7472" />
                  <span className="caption text-sm font-medium" style={{ color: '#1a7472' }}>
                    {mockLocations?.length} ubicaciones
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {mockLocations?.map((location) =>
                <LocationStatusRow
                  key={location?.id}
                  location={location}
                  onViewDetails={handleLocationDetails}
                  onQuickAction={handleQuickAction} />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>);

};

export default OperationsControlCenter;