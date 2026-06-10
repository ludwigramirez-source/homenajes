import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import AlertNotificationBadge from '../../components/ui/AlertNotificationBadge';
import LocationContextSelector from '../../components/ui/LocationContextSelector';
import UserRoleIndicator from '../../components/ui/UserRoleIndicator';
import DataRefreshStatus from '../../components/ui/DataRefreshStatus';
import SystemTopologyMap from './components/SystemTopologyMap';
import CriticalStatusStrip from './components/CriticalStatusStrip';
import AlertQueue from './components/AlertQueue';
import PerformanceCharts from './components/PerformanceCharts';
import DiagnosticTools from './components/DiagnosticTools';
import LocationDetailModal from './components/LocationDetailModal';

import Select from '../../components/ui/Select';
import Icon from '../../components/AppIcon';


const SystemHealthMonitor = () => {
  const [selectedLocations, setSelectedLocations] = useState(['all']);
  const [environment, setEnvironment] = useState('production');
  const [monitoringScope, setMonitoringScope] = useState('all');
  const [alertThreshold, setAlertThreshold] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const mockLocations = [
    {
      id: 1,
      name: "Funeraria Jardines de Paz Norte",
      city: "Bogotá",
      region: "bogota",
      status: "healthy",
      statusText: "Operacional",
      activeScreens: 3,
      totalScreens: 3,
      uptime: 99.8,
      latency: 42,
      throughput: 850,
      lastUpdate: new Date(Date.now() - 300000),
      components: [
        {
          name: "Pantallas Digitales",
          icon: "Monitor",
          status: "operational",
          metrics: [
            { label: "Activas", value: "3/3" },
            { label: "Uptime", value: "99.8%" },
            { label: "Última Sincronización", value: "2 min" }
          ]
        },
        {
          name: "Servidor Local",
          icon: "Server",
          status: "operational",
          metrics: [
            { label: "CPU", value: "45%" },
            { label: "RAM", value: "62%" },
            { label: "Disco", value: "38%" }
          ]
        },
        {
          name: "Conectividad",
          icon: "Wifi",
          status: "operational",
          metrics: [
            { label: "Latencia", value: "42ms" },
            { label: "Ancho de Banda", value: "850 Mbps" },
            { label: "Pérdida de Paquetes", value: "0.1%" }
          ]
        }
      ],
      recentAlerts: [
        {
          severity: "info",
          message: "Actualización de contenido completada exitosamente",
          timestamp: new Date(Date.now() - 1800000)
        }
      ]
    },
    {
      id: 2,
      name: "Funeraria Memorial Sur",
      city: "Bogotá",
      region: "bogota",
      status: "warning",
      statusText: "Advertencia Menor",
      activeScreens: 2,
      totalScreens: 2,
      uptime: 98.5,
      latency: 68,
      throughput: 720,
      lastUpdate: new Date(Date.now() - 180000),
      components: [
        {
          name: "Pantallas Digitales",
          icon: "Monitor",
          status: "operational",
          metrics: [
            { label: "Activas", value: "2/2" },
            { label: "Uptime", value: "98.5%" },
            { label: "Última Sincronización", value: "5 min" }
          ]
        },
        {
          name: "Servidor Local",
          icon: "Server",
          status: "degraded",
          metrics: [
            { label: "CPU", value: "78%" },
            { label: "RAM", value: "85%" },
            { label: "Disco", value: "72%" }
          ]
        },
        {
          name: "Conectividad",
          icon: "Wifi",
          status: "operational",
          metrics: [
            { label: "Latencia", value: "68ms" },
            { label: "Ancho de Banda", value: "720 Mbps" },
            { label: "Pérdida de Paquetes", value: "0.3%" }
          ]
        }
      ],
      recentAlerts: [
        {
          severity: "warning",
          message: "Uso elevado de memoria en servidor local",
          timestamp: new Date(Date.now() - 900000)
        },
        {
          severity: "info",
          message: "Mantenimiento programado completado",
          timestamp: new Date(Date.now() - 3600000)
        }
      ]
    },
    {
      id: 3,
      name: "Capilla El Poblado",
      city: "Medellín",
      region: "antioquia",
      status: "healthy",
      statusText: "Operacional",
      activeScreens: 2,
      totalScreens: 2,
      uptime: 99.9,
      latency: 38,
      throughput: 920,
      lastUpdate: new Date(Date.now() - 240000),
      components: [
        {
          name: "Pantallas Digitales",
          icon: "Monitor",
          status: "operational",
          metrics: [
            { label: "Activas", value: "2/2" },
            { label: "Uptime", value: "99.9%" },
            { label: "Última Sincronización", value: "1 min" }
          ]
        },
        {
          name: "Servidor Local",
          icon: "Server",
          status: "operational",
          metrics: [
            { label: "CPU", value: "32%" },
            { label: "RAM", value: "48%" },
            { label: "Disco", value: "28%" }
          ]
        },
        {
          name: "Conectividad",
          icon: "Wifi",
          status: "operational",
          metrics: [
            { label: "Latencia", value: "38ms" },
            { label: "Ancho de Banda", value: "920 Mbps" },
            { label: "Pérdida de Paquetes", value: "0%" }
          ]
        }
      ],
      recentAlerts: []
    },
    {
      id: 4,
      name: "Funeraria Paz Eterna Norte",
      city: "Cali",
      region: "valle",
      status: "critical",
      statusText: "Atención Requerida",
      activeScreens: 1,
      totalScreens: 3,
      uptime: 92.3,
      latency: 145,
      throughput: 420,
      lastUpdate: new Date(Date.now() - 600000),
      components: [
        {
          name: "Pantallas Digitales",
          icon: "Monitor",
          status: "degraded",
          metrics: [
            { label: "Activas", value: "1/3" },
            { label: "Uptime", value: "92.3%" },
            { label: "Última Sincronización", value: "15 min" }
          ]
        },
        {
          name: "Servidor Local",
          icon: "Server",
          status: "degraded",
          metrics: [
            { label: "CPU", value: "92%" },
            { label: "RAM", value: "94%" },
            { label: "Disco", value: "88%" }
          ]
        },
        {
          name: "Conectividad",
          icon: "Wifi",
          status: "degraded",
          metrics: [
            { label: "Latencia", value: "145ms" },
            { label: "Ancho de Banda", value: "420 Mbps" },
            { label: "Pérdida de Paquetes", value: "2.1%" }
          ]
        }
      ],
      recentAlerts: [
        {
          severity: "critical",
          message: "2 pantallas fuera de línea - requiere intervención técnica",
          timestamp: new Date(Date.now() - 600000)
        },
        {
          severity: "warning",
          message: "Latencia de red elevada detectada",
          timestamp: new Date(Date.now() - 1200000)
        }
      ]
    },
    {
      id: 5,
      name: "Memorial Atlántico",
      city: "Barranquilla",
      region: "atlantico",
      status: "healthy",
      statusText: "Operacional",
      activeScreens: 2,
      totalScreens: 2,
      uptime: 99.6,
      latency: 52,
      throughput: 780,
      lastUpdate: new Date(Date.now() - 420000),
      components: [
        {
          name: "Pantallas Digitales",
          icon: "Monitor",
          status: "operational",
          metrics: [
            { label: "Activas", value: "2/2" },
            { label: "Uptime", value: "99.6%" },
            { label: "Última Sincronización", value: "3 min" }
          ]
        },
        {
          name: "Servidor Local",
          icon: "Server",
          status: "operational",
          metrics: [
            { label: "CPU", value: "52%" },
            { label: "RAM", value: "68%" },
            { label: "Disco", value: "45%" }
          ]
        },
        {
          name: "Conectividad",
          icon: "Wifi",
          status: "operational",
          metrics: [
            { label: "Latencia", value: "52ms" },
            { label: "Ancho de Banda", value: "780 Mbps" },
            { label: "Pérdida de Paquetes", value: "0.2%" }
          ]
        }
      ],
      recentAlerts: [
        {
          severity: "info",
          message: "Backup automático completado exitosamente",
          timestamp: new Date(Date.now() - 7200000)
        }
      ]
    }
  ];

  const mockMetrics = [
    {
      label: "Uptime Global",
      value: 98.9,
      unit: "%",
      icon: "Activity",
      thresholds: { healthy: 99, warning: 95 },
      sla: 99.5,
      trend: -0.3
    },
    {
      label: "Pantallas Conectadas",
      value: 92,
      unit: "%",
      icon: "Monitor",
      thresholds: { healthy: 95, warning: 85 },
      sla: 98,
      trend: 2.1
    },
    {
      label: "Rendimiento BD",
      value: 96,
      unit: "%",
      icon: "Database",
      thresholds: { healthy: 95, warning: 85 },
      sla: 95,
      trend: 1.5
    },
    {
      label: "Tiempo Respuesta API",
      value: 125,
      unit: "ms",
      icon: "Zap",
      thresholds: { healthy: 200, warning: 500 },
      sla: null,
      trend: -8.2
    },
    {
      label: "QR Generación",
      value: 99.2,
      unit: "%",
      icon: "QrCode",
      thresholds: { healthy: 98, warning: 95 },
      sla: 99,
      trend: 0.5
    },
    {
      label: "Entrega PDF",
      value: 97.8,
      unit: "%",
      icon: "FileText",
      thresholds: { healthy: 98, warning: 95 },
      sla: 98,
      trend: -1.2
    }
  ];

  const mockAlerts = [
    {
      id: 1,
      severity: "critical",
      title: "Pantallas Fuera de Línea",
      description: "2 pantallas digitales en Funeraria Paz Eterna Norte no responden",
      location: "Cali Norte",
      timestamp: new Date(Date.now() - 600000),
      autoEscalateIn: "15 minutos"
    },
    {
      id: 2,
      severity: "warning",
      title: "Uso Elevado de Memoria",
      description: "Servidor local en Memorial Sur alcanzó 85% de uso de RAM",
      location: "Bogotá Sur",
      timestamp: new Date(Date.now() - 900000),
      autoEscalateIn: "30 minutos"
    },
    {
      id: 3,
      severity: "warning",
      title: "Latencia de Red Elevada",
      description: "Latencia promedio superior a 100ms detectada",
      location: "Cali Norte",
      timestamp: new Date(Date.now() - 1200000),
      autoEscalateIn: null
    },
    {
      id: 4,
      severity: "info",
      title: "Actualización Disponible",
      description: "Nueva versión del software de pantallas disponible",
      location: "Todas las ubicaciones",
      timestamp: new Date(Date.now() - 3600000),
      autoEscalateIn: null
    },
    {
      id: 5,
      severity: "info",
      title: "Mantenimiento Programado",
      description: "Mantenimiento de base de datos programado para mañana 02:00",
      location: "Servidor Central",
      timestamp: new Date(Date.now() - 7200000),
      autoEscalateIn: null
    }
  ];

  const mockPerformanceData = {
    uptime: [
      { time: "00:00", value: 99.2 },
      { time: "04:00", value: 99.5 },
      { time: "08:00", value: 98.8 },
      { time: "12:00", value: 99.1 },
      { time: "16:00", value: 98.9 },
      { time: "20:00", value: 99.3 },
      { time: "Ahora", value: 98.9 }
    ],
    latency: [
      { time: "00:00", value: 45 },
      { time: "04:00", value: 42 },
      { time: "08:00", value: 68 },
      { time: "12:00", value: 72 },
      { time: "16:00", value: 58 },
      { time: "20:00", value: 52 },
      { time: "Ahora", value: 62 }
    ],
    throughput: [
      { time: "00:00", value: 820 },
      { time: "04:00", value: 780 },
      { time: "08:00", value: 850 },
      { time: "12:00", value: 920 },
      { time: "16:00", value: 880 },
      { time: "20:00", value: 840 },
      { time: "Ahora", value: 860 }
    ],
    errors: [
      { time: "00:00", value: 2 },
      { time: "04:00", value: 1 },
      { time: "08:00", value: 5 },
      { time: "12:00", value: 3 },
      { time: "16:00", value: 7 },
      { time: "20:00", value: 4 },
      { time: "Ahora", value: 6 }
    ],
    stats: {
      uptime: { avg: 99.1, max: 99.5, min: 98.8, stdDev: 0.3 },
      latency: { avg: 57, max: 72, min: 42, stdDev: 11 },
      throughput: { avg: 850, max: 920, min: 780, stdDev: 45 },
      errors: { avg: 4, max: 7, min: 1, stdDev: 2 }
    }
  };

  const environmentOptions = [
    { value: 'production', label: 'Producción' },
    { value: 'staging', label: 'Staging' },
    { value: 'development', label: 'Desarrollo' }
  ];

  const scopeOptions = [
    { value: 'all', label: 'Todo el Sistema' },
    { value: 'screens', label: 'Solo Pantallas' },
    { value: 'servers', label: 'Solo Servidores' },
    { value: 'services', label: 'Solo Servicios' }
  ];

  const thresholdOptions = [
    { value: 'all', label: 'Todas las Alertas' },
    { value: 'critical', label: 'Solo Críticas' },
    { value: 'warning', label: 'Advertencias y Críticas' }
  ];

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    setShowLocationModal(true);
  };

  const handleResolveAlert = (alertId) => {
    console.log('Resolving alert:', alertId);
  };

  const handleEscalateAlert = (alertId) => {
    console.log('Escalating alert:', alertId);
  };

  const handleRunDiagnostic = (tool, location, results) => {
    console.log('Diagnostic completed:', { tool, location, results });
  };

  const handleRefresh = () => {
    setLastUpdate(new Date());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const criticalAlertCount = mockAlerts?.filter(a => a?.severity === 'critical')?.length;

  return (
    <>
      <Helmet>
        <title>Monitor de Salud del Sistema - FuneralTribute Dashboard</title>
        <meta name="description" content="Monitoreo técnico en tiempo real de infraestructura, pantallas digitales y servicios del sistema de tributos funerarios" />
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
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                      style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Icon name="Server" size={20} color="#ffffff" />
                    </div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-white">
                      Monitor de Salud del Sistema
                    </h1>
                  </div>
                  <p className="text-sm md:text-base text-white/70 font-body">
                    Supervisión técnica en tiempo real de infraestructura y servicios
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <AlertNotificationBadge
                    count={criticalAlertCount}
                    severity="critical"
                    onClick={() => console.log('Navigate to alerts')}
                  />
                  <DataRefreshStatus
                    lastUpdate={lastUpdate}
                    isConnected={true}
                    autoRefresh={true}
                    refreshInterval={300000}
                    onRefresh={handleRefresh}
                  />
                  <UserRoleIndicator role="technical" userName="Admin Técnico" />
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-[1920px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Select
                label="Entorno"
                options={environmentOptions}
                value={environment}
                onChange={setEnvironment}
              />
              <Select
                label="Alcance de Monitoreo"
                options={scopeOptions}
                value={monitoringScope}
                onChange={setMonitoringScope}
              />
              <Select
                label="Umbral de Alertas"
                options={thresholdOptions}
                value={alertThreshold}
                onChange={setAlertThreshold}
              />
              <LocationContextSelector
                value={selectedLocations}
                onChange={setSelectedLocations}
              />
            </div>

            <div className="mb-6">
              <CriticalStatusStrip metrics={mockMetrics} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <SystemTopologyMap
                  locations={mockLocations}
                  onLocationClick={handleLocationClick}
                />
              </div>
              <div className="lg:col-span-1">
                <AlertQueue
                  alerts={mockAlerts}
                  onResolve={handleResolveAlert}
                  onEscalate={handleEscalateAlert}
                />
              </div>
            </div>

            <div className="mb-6">
              <PerformanceCharts data={mockPerformanceData} />
            </div>

            <div>
              <DiagnosticTools onRunDiagnostic={handleRunDiagnostic} />
            </div>
          </div>
        </main>

        {showLocationModal && (
          <LocationDetailModal
            location={selectedLocation}
            onClose={() => setShowLocationModal(false)}
          />
        )}
      </div>
    </>
  );
};

export default SystemHealthMonitor;