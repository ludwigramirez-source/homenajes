import React, { useState } from 'react';
import AlertNotificationBadge from '../../components/ui/AlertNotificationBadge';
import UserRoleIndicator from '../../components/ui/UserRoleIndicator';
import DataRefreshStatus from '../../components/ui/DataRefreshStatus';
import MetricsCard from './components/MetricsCard';
import EngagementLineChart from './components/EngagementLineChart';
import CondolenceHeatmap from './components/CondolenceHeatmap';
import SeasonalTrendChart from './components/SeasonalTrendChart';
import TopTemplatesCard from './components/TopTemplatesCard';
import PeakEngagementCard from './components/PeakEngagementCard';
import PredictiveAnalyticsCard from './components/PredictiveAnalyticsCard';
import ConversionFunnelChart from './components/ConversionFunnelChart';
import FilterPanel from './components/FilterPanel';
import ExportPanel from './components/ExportPanel';
import Icon from '../../components/AppIcon';

const AnalyticsHub = () => {
  const [activeTab, setActiveTab] = useState('engagement');
  const [lastUpdate] = useState(new Date('2026-01-28T17:45:00'));

  const metricsData = [
  {
    title: 'Condolencias Promedio',
    value: '127',
    change: 15.3,
    trend: 'up',
    icon: 'MessageSquare',
    description: 'vs mes anterior',
    significance: 'high'
  },
  {
    title: 'Puntuación de Sentimiento',
    value: '8.4/10',
    change: 5.2,
    trend: 'up',
    icon: 'Heart',
    description: 'análisis IA',
    significance: 'medium'
  },
  {
    title: 'Conversión QR',
    value: '68.5%',
    change: -2.1,
    trend: 'down',
    icon: 'QrCode',
    description: 'escaneo a condolencia',
    significance: 'medium'
  },
  {
    title: 'Satisfacción Familiar',
    value: '92%',
    change: 3.8,
    trend: 'up',
    icon: 'Star',
    description: 'encuestas completadas',
    significance: 'high'
  }];


  const engagementTrendData = [
  { month: 'Jul', condolencias: 98, satisfaccion: 88, conversion: 65 },
  { month: 'Ago', condolencias: 112, satisfaccion: 90, conversion: 67 },
  { month: 'Sep', condolencias: 105, satisfaccion: 89, conversion: 64 },
  { month: 'Oct', condolencias: 118, satisfaccion: 91, conversion: 69 },
  { month: 'Nov', condolencias: 124, satisfaccion: 92, conversion: 70 },
  { month: 'Dic', condolencias: 135, satisfaccion: 93, conversion: 72 },
  { month: 'Ene', condolencias: 127, satisfaccion: 92, conversion: 68 }];


  const heatmapData = [
  { day: 'Lunes', values: [15, 25, 45, 75, 85, 60] },
  { day: 'Martes', values: [20, 30, 50, 80, 90, 65] },
  { day: 'Miércoles', values: [18, 28, 48, 78, 88, 62] },
  { day: 'Jueves', values: [22, 32, 52, 82, 92, 68] },
  { day: 'Viernes', values: [25, 35, 55, 85, 95, 70] },
  { day: 'Sábado', values: [30, 40, 60, 90, 98, 75] },
  { day: 'Domingo', values: [28, 38, 58, 88, 96, 72] }];


  const seasonalData = [
  { month: 'Ene', tributos: 145, condolencias: 18400 },
  { month: 'Feb', tributos: 132, condolencias: 16800 },
  { month: 'Mar', tributos: 128, condolencias: 16300 },
  { month: 'Abr', tributos: 135, condolencias: 17200 },
  { month: 'May', tributos: 142, condolencias: 18100 },
  { month: 'Jun', tributos: 138, condolencias: 17600 },
  { month: 'Jul', tributos: 140, condolencias: 17800 },
  { month: 'Ago', tributos: 148, condolencias: 18900 },
  { month: 'Sep', tributos: 136, condolencias: 17300 },
  { month: 'Oct', tributos: 152, condolencias: 19400 },
  { month: 'Nov', tributos: 158, condolencias: 20100 },
  { month: 'Dic', tributos: 165, condolencias: 21000 }];


  const topTemplates = [
  {
    id: 1,
    name: 'Elegancia Clásica',
    thumbnail: "https://images.unsplash.com/photo-1595013723023-e01213870518",
    thumbnailAlt: 'Elegant memorial template with white roses and soft lighting on dark background',
    usage: 342,
    satisfaction: 94
  },
  {
    id: 2,
    name: 'Serenidad Natural',
    thumbnail: "https://images.unsplash.com/photo-1620923739829-2778742fe4b0",
    thumbnailAlt: 'Peaceful nature-themed template with green foliage and soft sunlight filtering through trees',
    usage: 298,
    satisfaction: 92
  },
  {
    id: 3,
    name: 'Recuerdo Religioso',
    thumbnail: "https://images.unsplash.com/photo-1683567503582-0e60339beb4b",
    thumbnailAlt: 'Religious memorial template featuring ornate church interior with stained glass windows and candles',
    usage: 276,
    satisfaction: 91
  },
  {
    id: 4,
    name: 'Moderno Minimalista',
    thumbnail: "https://images.unsplash.com/photo-1685970521365-a74eecb12b19",
    thumbnailAlt: 'Contemporary minimalist design with clean lines and subtle gray tones on white background',
    usage: 254,
    satisfaction: 89
  }];


  const peakTimes = [
  { day: 'Viernes', timeRange: '18:00-20:00', percentage: 95 },
  { day: 'Sábado', timeRange: '16:00-18:00', percentage: 88 },
  { day: 'Domingo', timeRange: '14:00-16:00', percentage: 82 },
  { day: 'Jueves', timeRange: '19:00-21:00', percentage: 75 }];


  const predictions = [
  { period: 'Próxima semana', estimated: 38, change: 12, trend: 'up', confidence: 87 },
  { period: 'Próximo mes', estimated: 152, change: 8, trend: 'up', confidence: 82 },
  { period: 'Próximo trimestre', estimated: 445, change: -3, trend: 'down', confidence: 75 }];


  const funnelStages = [
  {
    name: 'Escaneo QR',
    value: 12450,
    icon: 'QrCode',
    description: 'Familias que escanearon'
  },
  {
    name: 'Vista de Tributo',
    value: 10890,
    icon: 'Eye',
    description: 'Tributos visualizados'
  },
  {
    name: 'Inicio de Formulario',
    value: 9234,
    icon: 'FileText',
    description: 'Formularios iniciados'
  },
  {
    name: 'Formulario Completo',
    value: 7456,
    icon: 'CheckCircle',
    description: 'Formularios completados'
  },
  {
    name: 'Condolencia Enviada',
    value: 8532,
    icon: 'Send',
    description: 'Condolencias publicadas'
  }];


  const handleFilterChange = (filters) => {
    console.log('Filters applied:', filters);
  };

  const handleRefresh = () => {
    console.log('Refreshing data...');
  };

  const handleAlertClick = () => {
    console.log('Opening alerts panel...');
  };

  const tabs = [
  { id: 'engagement', label: 'Tendencia de Engagement', icon: 'TrendingUp' },
  { id: 'heatmap', label: 'Mapa de Calor', icon: 'Grid' },
  { id: 'seasonal', label: 'Análisis Estacional', icon: 'Calendar' }];


  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Brand page header banner */}
        <div className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #a7c9d2, transparent)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #477a7b, transparent)', transform: 'translate(-30%, 30%)' }} />

          <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                    style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <Icon name="BarChart3" size={20} color="#ffffff" />
                  </div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-white">
                    Analytics Hub
                  </h1>
                </div>
                <p className="text-sm md:text-base text-white/70 font-body">
                  Análisis comprensivo de engagement y rendimiento de tributos
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <AlertNotificationBadge
                  count={3}
                  severity="warning"
                  onClick={handleAlertClick} />

                <DataRefreshStatus
                  lastUpdate={lastUpdate}
                  isConnected={true}
                  autoRefresh={true}
                  refreshInterval={300000}
                  onRefresh={handleRefresh} />

                <UserRoleIndicator
                  role="marketing"
                  userName="María González" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <FilterPanel onFilterChange={handleFilterChange} className="mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {metricsData?.map((metric, index) =>
            <MetricsCard key={index} {...metric} />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="lg:col-span-8">
              <div className="bg-card border border-border rounded-lg shadow-elevation-sm">
                <div className="border-b border-border">
                  <div className="flex overflow-x-auto">
                    {tabs?.map((tab) =>
                    <button
                      key={tab?.id}
                      onClick={() => setActiveTab(tab?.id)}
                      className={`
                          flex items-center gap-2 px-4 md:px-6 py-3 md:py-4
                          font-heading font-medium text-sm whitespace-nowrap
                          transition-smooth border-b-2 flex-shrink-0
                          ${activeTab === tab?.id ?
                      'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}
                        `
                      }>

                        <Icon name={tab?.icon} size={18} />
                        <span className="hidden sm:inline">{tab?.label}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  {activeTab === 'engagement' &&
                  <EngagementLineChart data={engagementTrendData} />
                  }
                  {activeTab === 'heatmap' &&
                  <CondolenceHeatmap data={heatmapData} />
                  }
                  {activeTab === 'seasonal' &&
                  <SeasonalTrendChart data={seasonalData} />
                  }
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4 md:space-y-6">
              <TopTemplatesCard templates={topTemplates} />
              <PeakEngagementCard peakTimes={peakTimes} />
              <PredictiveAnalyticsCard predictions={predictions} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            <div className="lg:col-span-8">
              <ConversionFunnelChart stages={funnelStages} />
            </div>

            <div className="lg:col-span-4">
              <ExportPanel />
            </div>
          </div>
        </div>
      </main>
    </div>);

};

export default AnalyticsHub;