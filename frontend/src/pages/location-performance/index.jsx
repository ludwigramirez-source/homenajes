import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import LocationContextSelector from '../../components/ui/LocationContextSelector';
import UserRoleIndicator from '../../components/ui/UserRoleIndicator';
import DataRefreshStatus from '../../components/ui/DataRefreshStatus';
import AlertNotificationBadge from '../../components/ui/AlertNotificationBadge';
import PerformanceMetricCard from './components/PerformanceMetricCard';
import ScatterPlotChart from './components/ScatterPlotChart';
import TopPerformersChart from './components/TopPerformersChart';
import LocationSpotlight from './components/LocationSpotlight';
import PerformanceDataTable from './components/PerformanceDataTable';
import InsightsPanel from './components/InsightsPanel';
import PeriodSelector from './components/PeriodSelector';
import Icon from '../../components/AppIcon';

const LocationPerformance = () => {
  const [selectedLocations, setSelectedLocations] = useState(['all']);
  const [selectedPeriod, setSelectedPeriod] = useState('quarterly');
  const [normalizeMetrics, setNormalizeMetrics] = useState(false);

  const locationData = [
  {
    id: 1,
    name: "Bogotá Norte Premium",
    city: "Bogotá",
    region: "Bogotá",
    tributesPerMonth: 45,
    engagementRate: 87.5,
    satisfaction: 4.8,
    revenueEfficiency: 2850000,
    quartile: 1,
    rank: 1,
    screenCount: 4,
    image: "https://images.unsplash.com/photo-1645718170599-69bb9d271d75",
    imageAlt: "Modern funeral home interior with elegant wooden furnishings and soft ambient lighting in Bogotá",
    bestPractices: [
    "Respuesta inmediata a familias (< 2 horas)",
    "Seguimiento personalizado post-servicio",
    "Capacitación continua del personal"],

    successFactors: "Ubicación estratégica en zona residencial premium, equipo altamente capacitado con enfoque en atención personalizada, y tecnología de última generación para tributos digitales."
  },
  {
    id: 2,
    name: "Medellín El Poblado",
    city: "Medellín",
    region: "Antioquia",
    tributesPerMonth: 42,
    engagementRate: 85.2,
    satisfaction: 4.7,
    revenueEfficiency: 2720000,
    quartile: 1,
    rank: 2,
    screenCount: 3
  },
  {
    id: 3,
    name: "Cali Norte Elite",
    city: "Cali",
    region: "Valle del Cauca",
    tributesPerMonth: 38,
    engagementRate: 82.8,
    satisfaction: 4.6,
    revenueEfficiency: 2580000,
    quartile: 1,
    rank: 3,
    screenCount: 3
  },
  {
    id: 4,
    name: "Bogotá Centro",
    city: "Bogotá",
    region: "Bogotá",
    tributesPerMonth: 35,
    engagementRate: 79.5,
    satisfaction: 4.5,
    revenueEfficiency: 2420000,
    quartile: 2,
    rank: 4,
    screenCount: 2
  },
  {
    id: 5,
    name: "Barranquilla Centro",
    city: "Barranquilla",
    region: "Atlántico",
    tributesPerMonth: 33,
    engagementRate: 77.2,
    satisfaction: 4.4,
    revenueEfficiency: 2310000,
    quartile: 2,
    rank: 5,
    screenCount: 2
  },
  {
    id: 6,
    name: "Cartagena Histórico",
    city: "Cartagena",
    region: "Bolívar",
    tributesPerMonth: 31,
    engagementRate: 75.8,
    satisfaction: 4.3,
    revenueEfficiency: 2190000,
    quartile: 2,
    rank: 6,
    screenCount: 2
  },
  {
    id: 7,
    name: "Bucaramanga Centro",
    city: "Bucaramanga",
    region: "Santander",
    tributesPerMonth: 29,
    engagementRate: 73.5,
    satisfaction: 4.2,
    revenueEfficiency: 2080000,
    quartile: 2,
    rank: 7,
    screenCount: 2
  },
  {
    id: 8,
    name: "Pereira Centro",
    city: "Pereira",
    region: "Risaralda",
    tributesPerMonth: 27,
    engagementRate: 71.2,
    satisfaction: 4.1,
    revenueEfficiency: 1950000,
    quartile: 2,
    rank: 8,
    screenCount: 2
  },
  {
    id: 9,
    name: "Medellín Laureles",
    city: "Medellín",
    region: "Antioquia",
    tributesPerMonth: 26,
    engagementRate: 69.8,
    satisfaction: 4.0,
    revenueEfficiency: 1870000,
    quartile: 3,
    rank: 9,
    screenCount: 2
  },
  {
    id: 10,
    name: "Manizales Centro",
    city: "Manizales",
    region: "Caldas",
    tributesPerMonth: 24,
    engagementRate: 67.5,
    satisfaction: 3.9,
    revenueEfficiency: 1760000,
    quartile: 3,
    rank: 10,
    screenCount: 1
  },
  {
    id: 11,
    name: "Ibagué Centro",
    city: "Ibagué",
    region: "Tolima",
    tributesPerMonth: 23,
    engagementRate: 65.2,
    satisfaction: 3.8,
    revenueEfficiency: 1680000,
    quartile: 3,
    rank: 11,
    screenCount: 1
  },
  {
    id: 12,
    name: "Cúcuta Centro",
    city: "Cúcuta",
    region: "Norte de Santander",
    tributesPerMonth: 21,
    engagementRate: 63.8,
    satisfaction: 3.7,
    revenueEfficiency: 1590000,
    quartile: 3,
    rank: 12,
    screenCount: 1
  },
  {
    id: 13,
    name: "Santa Marta Centro",
    city: "Santa Marta",
    region: "Magdalena",
    tributesPerMonth: 20,
    engagementRate: 61.5,
    satisfaction: 3.6,
    revenueEfficiency: 1510000,
    quartile: 3,
    rank: 13,
    screenCount: 1
  },
  {
    id: 14,
    name: "Villavicencio Centro",
    city: "Villavicencio",
    region: "Meta",
    tributesPerMonth: 19,
    engagementRate: 59.2,
    satisfaction: 3.5,
    revenueEfficiency: 1420000,
    quartile: 3,
    rank: 14,
    screenCount: 1
  },
  {
    id: 15,
    name: "Pasto Centro",
    city: "Pasto",
    region: "Nariño",
    tributesPerMonth: 17,
    engagementRate: 56.8,
    satisfaction: 3.4,
    revenueEfficiency: 1340000,
    quartile: 4,
    rank: 15,
    screenCount: 1
  },
  {
    id: 16,
    name: "Neiva Centro",
    city: "Neiva",
    region: "Huila",
    tributesPerMonth: 16,
    engagementRate: 54.5,
    satisfaction: 3.3,
    revenueEfficiency: 1250000,
    quartile: 4,
    rank: 16,
    screenCount: 1
  },
  {
    id: 17,
    name: "Armenia Centro",
    city: "Armenia",
    region: "Quindío",
    tributesPerMonth: 15,
    engagementRate: 52.2,
    satisfaction: 3.2,
    revenueEfficiency: 1170000,
    quartile: 4,
    rank: 17,
    screenCount: 1
  },
  {
    id: 18,
    name: "Bogotá Sur",
    city: "Bogotá",
    region: "Bogotá",
    tributesPerMonth: 14,
    engagementRate: 49.8,
    satisfaction: 3.1,
    revenueEfficiency: 1080000,
    quartile: 4,
    rank: 18,
    screenCount: 1
  },
  {
    id: 19,
    name: "Cali Sur",
    city: "Cali",
    region: "Valle del Cauca",
    tributesPerMonth: 13,
    engagementRate: 47.5,
    satisfaction: 3.0,
    revenueEfficiency: 990000,
    quartile: 4,
    rank: 19,
    screenCount: 1
  },
  {
    id: 20,
    name: "Medellín Bello",
    city: "Medellín",
    region: "Antioquia",
    tributesPerMonth: 12,
    engagementRate: 45.2,
    satisfaction: 2.9,
    revenueEfficiency: 910000,
    quartile: 4,
    rank: 20,
    screenCount: 1
  }];


  const insights = [
  {
    type: 'success',
    title: 'Rendimiento Excepcional en Bogotá',
    description: 'Las ubicaciones en Bogotá superan el promedio nacional en un 32% en engagement y 28% en satisfacción familiar.',
    action: 'Ver análisis detallado'
  },
  {
    type: 'trend',
    title: 'Correlación Positiva Detectada',
    description: 'Ubicaciones con 3+ pantallas digitales muestran 45% más engagement. Considerar expansión de infraestructura.',
    action: 'Explorar oportunidades'
  },
  {
    type: 'warning',
    title: 'Brecha de Rendimiento Regional',
    description: 'Ubicaciones en ciudades intermedias muestran 23% menos eficiencia. Requiere análisis de causas raíz.',
    action: 'Iniciar investigación'
  },
  {
    type: 'info',
    title: 'Patrón Estacional Identificado',
    description: 'Q4 muestra incremento del 18% en tributos. Optimizar recursos para temporada alta.',
    action: 'Ver proyecciones'
  }];


  const scatterData = locationData?.map((loc) => ({
    name: loc?.name,
    tributesPerMonth: loc?.tributesPerMonth,
    engagementRate: loc?.engagementRate,
    screenCount: loc?.screenCount,
    quartile: loc?.quartile,
    region: loc?.region
  }));

  const handleRefresh = () => {
    console.log('Refreshing data...');
  };

  const handleAlertClick = () => {
    console.log('Alert clicked');
  };

  return (
    <>
      <Helmet>
        <title>Rendimiento por Ubicación - FuneralTribute Dashboard</title>
        <meta name="description" content="Comparación de rendimiento operacional y mejores prácticas entre ubicaciones de FuneralTribute en Colombia" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-16">
          {/* Brand page header banner */}
          <div className="relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #a7c9d2, transparent)', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #477a7b, transparent)', transform: 'translate(-30%, 30%)' }} />

            <div className="px-4 md:px-6 lg:px-8 py-8 md:py-10 max-w-[1920px] mx-auto relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                      style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Icon name="MapPin" size={20} color="#ffffff" />
                    </div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-white">
                      Rendimiento por Ubicación
                    </h1>
                  </div>
                  <p className="caption text-sm md:text-base text-white/70 font-body">
                    Análisis comparativo y benchmarking de 20 ubicaciones en Colombia
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <AlertNotificationBadge count={3} severity="info" onClick={handleAlertClick} />
                  <DataRefreshStatus
                    lastUpdate={new Date()}
                    isConnected={true}
                    autoRefresh={true}
                    onRefresh={handleRefresh} />
                  <UserRoleIndicator role="administrator" userName="Administrador" />
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-[1920px] mx-auto">
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 md:gap-4 p-4 bg-card border border-border rounded-lg shadow-elevation-sm">
                <LocationContextSelector
                  value={selectedLocations}
                  onChange={setSelectedLocations}
                  className="flex-1 w-full lg:w-auto" />

                <PeriodSelector
                  value={selectedPeriod}
                  onChange={setSelectedPeriod} />

                <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                  <input
                    type="checkbox"
                    id="normalize"
                    checked={normalizeMetrics}
                    onChange={(e) => setNormalizeMetrics(e?.target?.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  <label htmlFor="normalize" className="caption text-xs text-foreground cursor-pointer">
                    Normalizar métricas
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <PerformanceMetricCard
                title="Tributos Promedio/Mes"
                value="25.8"
                unit="tributos"
                change={8.5}
                rank={1}
                quartile={1}
                icon="FileText"
                trend="up" />

              <PerformanceMetricCard
                title="Engagement Promedio"
                value="67.3"
                unit="%"
                change={5.2}
                rank={2}
                quartile={2}
                icon="Heart"
                trend="up" />

              <PerformanceMetricCard
                title="Satisfacción Promedio"
                value="3.9"
                unit="/5.0"
                change={3.1}
                rank={3}
                quartile={2}
                icon="Star"
                trend="up" />

              <PerformanceMetricCard
                title="Eficiencia Promedio"
                value="1.850.000"
                unit="COP"
                change={-2.3}
                rank={4}
                quartile={3}
                icon="DollarSign"
                trend="down" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="lg:col-span-9 space-y-4 md:space-y-6">
                <ScatterPlotChart
                  data={scatterData}
                  xKey="tributesPerMonth"
                  yKey="engagementRate"
                  zKey="screenCount"
                  xLabel="Tributos por Mes"
                  yLabel="Tasa de Engagement (%)" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <TopPerformersChart
                    data={locationData}
                    metric="engagementRate"
                    title="Top Performers - Engagement"
                    showTop={true} />

                  <TopPerformersChart
                    data={locationData}
                    metric="satisfaction"
                    title="Necesitan Mejora - Satisfacción"
                    showTop={false} />
                </div>
              </div>

              <div className="lg:col-span-3 space-y-4 md:space-y-6">
                <LocationSpotlight location={locationData?.[0]} />
                <InsightsPanel insights={insights} />
              </div>
            </div>

            <PerformanceDataTable data={locationData} />

            <div className="mt-6 md:mt-8 p-4 md:p-6 bg-card border border-border rounded-lg shadow-elevation-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg"
                    style={{ background: 'linear-gradient(135deg, #1a7472, #234b50)' }}>
                    <Icon name="Download" size={20} color="#ffffff" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-base text-foreground mb-1">
                      Exportar Reporte Completo
                    </h3>
                    <p className="caption text-xs md:text-sm text-muted-foreground">
                      Descarga análisis detallado con gráficos y recomendaciones
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 text-white rounded-lg
                    font-heading font-medium text-sm transition-smooth hover-lift press-scale
                    flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #1a7472, #234b50)' }}>
                    <Icon name="FileText" size={16} color="#ffffff" />
                    PDF
                  </button>
                  <button className="px-4 py-2 bg-success text-success-foreground rounded-lg
                    font-heading font-medium text-sm transition-smooth hover-lift press-scale
                    flex items-center gap-2">
                    <Icon name="Table" size={16} />
                    Excel
                  </button>
                  <button className="px-4 py-2 text-white rounded-lg
                    font-heading font-medium text-sm transition-smooth hover-lift press-scale
                    flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #8b3a5a, #7a4f8c)' }}>
                    <Icon name="Mail" size={16} color="#ffffff" />
                    Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>);

};

export default LocationPerformance;