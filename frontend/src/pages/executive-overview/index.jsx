import React, { useState, useEffect } from 'react';
import LocationContextSelector from '../../components/ui/LocationContextSelector';
import UserRoleIndicator from '../../components/ui/UserRoleIndicator';
import DataRefreshStatus from '../../components/ui/DataRefreshStatus';
import AlertNotificationBadge from '../../components/ui/AlertNotificationBadge';
import KPICard from './components/KPICard';
import ColombiaMap from './components/ColombiaMap';
import LocationRankingCard from './components/LocationRankingCard';
import SeasonalTrendIndicator from './components/SeasonalTrendIndicator';
import ComparativeBarChart from './components/ComparativeBarChart';
import DateRangePicker from './components/DateRangePicker';
import Icon from '../../components/AppIcon';
import { analyticsService } from '../../services/api';

const ExecutiveOverview = () => {
  const [selectedLocations, setSelectedLocations] = useState(['all']);
  const [dateRange, setDateRange] = useState('last-quarter');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [alertCount, setAlertCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [locationStats, setLocationStats] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [executiveRes, locationsRes] = await Promise.all([
          analyticsService.executive(),
          analyticsService.byLocation()
        ]);
        if (executiveRes.success) setStats(executiveRes.data);
        if (locationsRes.success) setLocationStats(locationsRes.data);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    // Refrescar cada 60 segundos
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const kpiData = stats ? [
    {
      title: 'Total Homenajes',
      value: stats.total_memorials,
      change: 0,
      trend: [stats.total_memorials],
      icon: 'FileText',
      iconColor: 'var(--color-accent)'
    },
    {
      title: 'Homenajes Activos Ahora',
      value: stats.active_memorials,
      unit: 'en curso',
      change: 0,
      trend: [stats.active_memorials],
      icon: 'Heart',
      iconColor: 'var(--color-success)'
    },
    {
      title: 'Total Condolencias',
      value: stats.total_condolences,
      unit: 'mensajes',
      change: 0,
      trend: [stats.total_condolences],
      icon: 'MessageCircle',
      iconColor: 'var(--color-accent)'
    },
    {
      title: 'Contactos Marketing',
      value: stats.marketing_contacts,
      unit: 'autorizados',
      change: 0,
      trend: [stats.marketing_contacts],
      icon: 'Users',
      iconColor: 'var(--color-success)'
    }
  ] : [];

  // KPI data legacy (placeholder/fallback)
  const kpiDataLegacy = [
    {
      title: 'Total Tributos Creados',
      value: 8547,
      change: 12.3,
      trend: [65, 72, 68, 75, 82, 78, 85],
      icon: 'FileText',
      iconColor: 'var(--color-accent)'
    },
    {
      title: 'Promedio Condolencias',
      value: 127,
      unit: 'por tributo',
      change: 8.7,
      trend: [95, 102, 98, 115, 120, 118, 127],
      icon: 'Heart',
      iconColor: 'var(--color-success)'
    },
    {
      title: 'Satisfacción Familiar',
      value: '4.7',
      unit: '/5.0',
      change: 3.2,
      trend: [4.3, 4.4, 4.5, 4.6, 4.6, 4.7, 4.7],
      icon: 'Star',
      iconColor: 'var(--color-accent)'
    },
    {
      title: 'Ingreso por Tributo',
      value: '285.000',
      unit: 'COP',
      change: 15.8,
      trend: [220, 235, 245, 260, 270, 275, 285],
      icon: 'DollarSign',
      iconColor: 'var(--color-primary)'
    }
  ];

  const locationData = [
    {
      id: 1,
      city: 'Bogotá',
      name: 'Norte',
      region: 'andina',
      activeTributes: 1247,
      satisfactionScore: 4.8,
      performanceScore: 92,
      revenue: 356890000
    },
    {
      id: 2,
      city: 'Medellín',
      name: 'El Poblado',
      region: 'andina',
      activeTributes: 987,
      satisfactionScore: 4.7,
      performanceScore: 89,
      revenue: 281495000
    },
    {
      id: 3,
      city: 'Cali',
      name: 'Norte',
      region: 'pacifica',
      activeTributes: 856,
      satisfactionScore: 4.6,
      performanceScore: 85,
      revenue: 243960000
    },
    {
      id: 4,
      city: 'Barranquilla',
      name: 'Centro',
      region: 'caribe',
      activeTributes: 734,
      satisfactionScore: 4.5,
      performanceScore: 82,
      revenue: 209190000
    },
    {
      id: 5,
      city: 'Cartagena',
      name: 'Histórico',
      region: 'caribe',
      activeTributes: 623,
      satisfactionScore: 4.7,
      performanceScore: 87,
      revenue: 177555000
    },
    {
      id: 6,
      city: 'Bucaramanga',
      name: 'Cabecera',
      region: 'andina',
      activeTributes: 545,
      satisfactionScore: 4.6,
      performanceScore: 84,
      revenue: 155325000
    },
    {
      id: 7,
      city: 'Pereira',
      name: 'Centro',
      region: 'andina',
      activeTributes: 478,
      satisfactionScore: 4.4,
      performanceScore: 78,
      revenue: 136230000
    },
    {
      id: 8,
      city: 'Manizales',
      name: 'Cable',
      region: 'andina',
      activeTributes: 412,
      satisfactionScore: 4.5,
      performanceScore: 80,
      revenue: 117420000
    },
    {
      id: 9,
      city: 'Ibagué',
      name: 'Norte',
      region: 'andina',
      activeTributes: 389,
      satisfactionScore: 4.3,
      performanceScore: 75,
      revenue: 110865000
    },
    {
      id: 10,
      city: 'Cúcuta',
      name: 'Centro',
      region: 'andina',
      activeTributes: 356,
      satisfactionScore: 4.2,
      performanceScore: 72,
      revenue: 101460000
    },
    {
      id: 11,
      city: 'Santa Marta',
      name: 'Rodadero',
      region: 'caribe',
      activeTributes: 334,
      satisfactionScore: 4.6,
      performanceScore: 83,
      revenue: 95190000
    },
    {
      id: 12,
      city: 'Villavicencio',
      name: 'Centro',
      region: 'orinoquia',
      activeTributes: 312,
      satisfactionScore: 4.4,
      performanceScore: 77,
      revenue: 88920000
    }
  ];

  const seasonalTrends = [
    {
      period: 'Enero - Marzo 2026',
      description: 'Temporada alta post-festividades',
      trend: 'increasing',
      avgTributes: 745,
      change: 18.5,
      recommendation: 'Aumentar capacidad de personal en ubicaciones principales'
    },
    {
      period: 'Abril - Junio 2026',
      description: 'Período estable primavera',
      trend: 'stable',
      avgTributes: 687,
      change: -2.3,
      recommendation: 'Mantener operaciones estándar y optimizar costos'
    },
    {
      period: 'Julio - Septiembre 2026',
      description: 'Temporada media verano',
      trend: 'stable',
      avgTributes: 698,
      change: 1.6,
      recommendation: 'Implementar campañas de engagement familiar'
    },
    {
      period: 'Octubre - Diciembre 2026',
      description: 'Temporada alta fin de año',
      trend: 'increasing',
      avgTributes: 756,
      change: 8.3,
      recommendation: 'Preparar recursos adicionales para demanda festiva'
    }
  ];

  const chartData = locationData?.map(loc => ({
    city: loc?.city,
    tributes: loc?.activeTributes,
    satisfaction: loc?.satisfactionScore * 10,
    revenueScaled: loc?.revenue / 1000000,
    revenue: loc?.revenue
  }));

  const handleLocationClick = (location) => {
    console.log('Location clicked:', location);
  };

  const handleCityClick = (data) => {
    console.log('City clicked:', data);
  };

  const handleRefresh = () => {
    setLastUpdate(new Date());
    console.log('Data refreshed');
  };

  const handleAlertClick = () => {
    console.log('Alerts clicked');
  };

  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Brand page header banner */}
        <div className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #a7c9d2, transparent)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #477a7b, transparent)', transform: 'translate(-30%, 30%)' }} />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full opacity-5 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #ffffff, transparent)', transform: 'translateY(-50%)' }} />

          <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10 relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                    style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <Icon name="LayoutDashboard" size={20} color="#ffffff" />
                  </div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-white">
                    Resumen Ejecutivo
                  </h1>
                </div>
                <p className="text-sm md:text-base text-white/70 font-body ml-13">
                  Vista estratégica general del rendimiento en todas las ubicaciones
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <AlertNotificationBadge
                  count={alertCount}
                  severity="warning"
                  onClick={handleAlertClick}
                />
                <UserRoleIndicator
                  role="executive"
                  userName="Carlos Mendoza"
                />
                <DataRefreshStatus
                  lastUpdate={lastUpdate}
                  isConnected={true}
                  autoRefresh={true}
                  refreshInterval={3600000}
                  onRefresh={handleRefresh}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-6 md:mb-8
            p-4 md:p-6 bg-card border border-border rounded-lg shadow-elevation-sm">
            <div className="flex-1 w-full lg:w-auto">
              <LocationContextSelector
                value={selectedLocations}
                onChange={setSelectedLocations}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />

              <button className="flex items-center gap-2 px-4 py-2 text-white
                rounded-lg font-heading font-medium text-sm transition-smooth
                hover-lift press-scale shadow-elevation-sm hover:shadow-elevation-md"
                style={{ background: 'linear-gradient(135deg, #1a7472, #234b50)' }}>
                <Icon name="Download" size={16} color="#ffffff" />
                <span className="hidden sm:inline">Exportar PDF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {kpiData?.map((kpi, index) => (
              <KPICard
                key={index}
                title={kpi?.title}
                value={kpi?.value}
                unit={kpi?.unit}
                change={kpi?.change}
                trend={kpi?.trend}
                icon={kpi?.icon}
                iconColor={kpi?.iconColor}
                loading={loading}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="lg:col-span-8">
              <ColombiaMap
                locations={locationData}
                onLocationClick={handleLocationClick}
              />
            </div>

            <div className="lg:col-span-4 space-y-4 md:space-y-6">
              <LocationRankingCard
                locations={locationData}
                type="top"
              />

              <SeasonalTrendIndicator
                trends={seasonalTrends}
              />
            </div>
          </div>

          <div className="mb-6 md:mb-8">
            <ComparativeBarChart
              data={chartData}
              onCityClick={handleCityClick}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <LocationRankingCard
              locations={locationData}
              type="bottom"
            />

            <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1a7472, #234b50)' }}>
                  <Icon name="TrendingUp" size={16} color="#ffffff" />
                </div>
                <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
                  Insights Estratégicos
                </h3>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Icon name="CheckCircle" size={18} color="var(--color-success)" className="flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-medium text-sm text-foreground mb-1">
                        Crecimiento Sostenido
                      </h4>
                      <p className="caption text-xs text-muted-foreground leading-relaxed">
                        Las ubicaciones en Bogotá y Medellín muestran un crecimiento del 15% en satisfacción familiar durante el último trimestre.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Icon name="AlertTriangle" size={18} color="var(--color-warning)" className="flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-medium text-sm text-foreground mb-1">
                        Oportunidad de Mejora
                      </h4>
                      <p className="caption text-xs text-muted-foreground leading-relaxed">
                        Las ubicaciones en Cúcuta e Ibagué requieren atención en engagement de condolencias (promedio 78 vs 127 nacional).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg border"
                  style={{ background: 'rgba(26,116,114,0.08)', borderColor: 'rgba(26,116,114,0.2)' }}>
                  <div className="flex items-start gap-3">
                    <Icon name="Lightbulb" size={18} color="#1a7472" className="flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-medium text-sm text-foreground mb-1">
                        Recomendación Estratégica
                      </h4>
                      <p className="caption text-xs text-muted-foreground leading-relaxed">
                        Implementar programa de capacitación en ubicaciones de bajo rendimiento basado en mejores prácticas de Bogotá Norte.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExecutiveOverview;