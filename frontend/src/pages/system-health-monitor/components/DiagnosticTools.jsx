import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const DiagnosticTools = ({ onRunDiagnostic }) => {
  const [selectedTool, setSelectedTool] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const diagnosticTools = [
    { value: 'connectivity', label: 'Prueba de Conectividad', icon: 'Wifi', description: 'Verifica conectividad de red y latencia' },
    { value: 'performance', label: 'Análisis de Rendimiento', icon: 'Gauge', description: 'Evalúa métricas de rendimiento del sistema' },
    { value: 'logs', label: 'Análisis de Logs', icon: 'FileText', description: 'Busca patrones y errores en logs' },
    { value: 'database', label: 'Salud de Base de Datos', icon: 'Database', description: 'Verifica integridad y rendimiento de BD' },
    { value: 'api', label: 'Prueba de APIs', icon: 'Zap', description: 'Valida endpoints y tiempos de respuesta' },
    { value: 'security', label: 'Escaneo de Seguridad', icon: 'Shield', description: 'Detecta vulnerabilidades potenciales' }
  ];

  const locations = [
    { value: 'all', label: 'Todas las Ubicaciones' },
    { value: 'bogota-norte', label: 'Bogotá Norte' },
    { value: 'bogota-sur', label: 'Bogotá Sur' },
    { value: 'medellin-poblado', label: 'Medellín - El Poblado' },
    { value: 'cali-norte', label: 'Cali Norte' },
    { value: 'barranquilla', label: 'Barranquilla' }
  ];

  const handleRunDiagnostic = async () => {
    if (!selectedTool || !selectedLocation) return;

    setIsRunning(true);
    
    setTimeout(() => {
      const mockResults = {
        connectivity: {
          status: 'success',
          message: 'Todas las conexiones están operativas',
          details: [
            { metric: 'Latencia Promedio', value: '45ms', status: 'healthy' },
            { metric: 'Pérdida de Paquetes', value: '0.1%', status: 'healthy' },
            { metric: 'Ancho de Banda', value: '950 Mbps', status: 'healthy' },
            { metric: 'Jitter', value: '2ms', status: 'healthy' }
          ]
        },
        performance: {
          status: 'warning',
          message: 'Rendimiento dentro de parámetros con alertas menores',
          details: [
            { metric: 'CPU Usage', value: '68%', status: 'warning' },
            { metric: 'Memory Usage', value: '72%', status: 'warning' },
            { metric: 'Disk I/O', value: '45%', status: 'healthy' },
            { metric: 'Network Throughput', value: '82%', status: 'healthy' }
          ]
        },
        logs: {
          status: 'success',
          message: 'No se detectaron patrones críticos',
          details: [
            { metric: 'Errores Críticos', value: '0', status: 'healthy' },
            { metric: 'Advertencias', value: '12', status: 'warning' },
            { metric: 'Eventos Info', value: '1,247', status: 'healthy' },
            { metric: 'Tasa de Logs', value: '450/min', status: 'healthy' }
          ]
        },
        database: {
          status: 'success',
          message: 'Base de datos operando normalmente',
          details: [
            { metric: 'Query Response Time', value: '12ms', status: 'healthy' },
            { metric: 'Connection Pool', value: '45/100', status: 'healthy' },
            { metric: 'Cache Hit Rate', value: '94%', status: 'healthy' },
            { metric: 'Replication Lag', value: '0.2s', status: 'healthy' }
          ]
        },
        api: {
          status: 'success',
          message: 'Todos los endpoints responden correctamente',
          details: [
            { metric: 'Response Time', value: '125ms', status: 'healthy' },
            { metric: 'Success Rate', value: '99.8%', status: 'healthy' },
            { metric: 'Rate Limit Usage', value: '42%', status: 'healthy' },
            { metric: 'Error Rate', value: '0.2%', status: 'healthy' }
          ]
        },
        security: {
          status: 'success',
          message: 'No se detectaron vulnerabilidades críticas',
          details: [
            { metric: 'SSL Certificate', value: 'Válido', status: 'healthy' },
            { metric: 'Firewall Status', value: 'Activo', status: 'healthy' },
            { metric: 'Failed Login Attempts', value: '3', status: 'healthy' },
            { metric: 'Security Patches', value: 'Actualizado', status: 'healthy' }
          ]
        }
      };

      setResults(mockResults?.[selectedTool]);
      setIsRunning(false);
      
      if (onRunDiagnostic) {
        onRunDiagnostic(selectedTool, selectedLocation, mockResults?.[selectedTool]);
      }
    }, 2000);
  };

  const getStatusColor = (status) => {
    const colors = {
      healthy: 'text-success',
      warning: 'text-warning',
      critical: 'text-error'
    };
    return colors?.[status] || 'text-muted-foreground';
  };

  const getStatusBg = (status) => {
    const colors = {
      healthy: 'bg-success/10',
      warning: 'bg-warning/10',
      critical: 'bg-error/10'
    };
    return colors?.[status] || 'bg-muted';
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-elevation-md p-4 md:p-6">
      <div className="mb-6">
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-1">
          Herramientas de Diagnóstico
        </h3>
        <p className="caption text-xs md:text-sm text-muted-foreground">
          Ejecuta diagnósticos automatizados del sistema
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select
          label="Herramienta de Diagnóstico"
          placeholder="Seleccionar herramienta"
          options={diagnosticTools}
          value={selectedTool}
          onChange={setSelectedTool}
          searchable
        />
        <Select
          label="Ubicación"
          placeholder="Seleccionar ubicación"
          options={locations}
          value={selectedLocation}
          onChange={setSelectedLocation}
          searchable
        />
      </div>
      <Button
        variant="default"
        onClick={handleRunDiagnostic}
        disabled={!selectedTool || !selectedLocation || isRunning}
        loading={isRunning}
        iconName="Play"
        iconPosition="left"
        fullWidth
        className="mb-6"
      >
        {isRunning ? 'Ejecutando Diagnóstico...' : 'Ejecutar Diagnóstico'}
      </Button>
      {results && (
        <div className="space-y-4 animate-fade-in">
          <div className={`p-4 rounded-lg border
            ${results?.status === 'success' ? 'bg-success/10 border-success/20' : 
              results?.status === 'warning'? 'bg-warning/10 border-warning/20' : 'bg-error/10 border-error/20'}`}>
            <div className="flex items-start gap-3">
              <Icon 
                name={results?.status === 'success' ? 'CheckCircle2' : 
                      results?.status === 'warning' ? 'AlertTriangle' : 'XCircle'} 
                size={20}
                color={results?.status === 'success' ? 'var(--color-success)' : 
                       results?.status === 'warning' ? 'var(--color-warning)' : 
                       'var(--color-error)'}
                className="flex-shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <h4 className={`font-heading font-semibold text-sm mb-1
                  ${results?.status === 'success' ? 'text-success' : 
                    results?.status === 'warning' ? 'text-warning' : 'text-error'}`}>
                  Resultado del Diagnóstico
                </h4>
                <p className="caption text-xs text-foreground">
                  {results?.message}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results?.details?.map((detail, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getStatusBg(detail?.status)}
                border-border`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="caption text-xs text-muted-foreground">
                    {detail?.metric}
                  </span>
                  <div className={`w-2 h-2 rounded-full
                    ${detail?.status === 'healthy' ? 'bg-success' : 
                      detail?.status === 'warning' ? 'bg-warning' : 'bg-error'}`}
                  />
                </div>
                <p className={`text-base md:text-lg font-heading font-bold data-text
                  ${getStatusColor(detail?.status)}`}>
                  {detail?.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
            <Button variant="outline" iconName="Download" iconPosition="left">
              Exportar Reporte
            </Button>
            <Button variant="outline" iconName="Share2" iconPosition="left">
              Compartir Resultados
            </Button>
            <Button variant="ghost" iconName="RefreshCw" iconPosition="left">
              Ejecutar Nuevamente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticTools;