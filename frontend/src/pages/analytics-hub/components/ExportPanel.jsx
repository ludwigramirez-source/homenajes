import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const ExportPanel = ({ className = '' }) => {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportSchedule, setExportSchedule] = useState('manual');
  const [isExporting, setIsExporting] = useState(false);

  const formatOptions = [
    { value: 'pdf', label: 'PDF Report', description: 'Informe completo con gráficos' },
    { value: 'csv', label: 'CSV Data', description: 'Datos tabulares para análisis' },
    { value: 'excel', label: 'Excel Workbook', description: 'Múltiples hojas con datos' },
    { value: 'json', label: 'JSON Data', description: 'Datos estructurados para API' }
  ];

  const scheduleOptions = [
    { value: 'manual', label: 'Manual' },
    { value: 'daily', label: 'Diario (08:00)' },
    { value: 'weekly', label: 'Semanal (Lunes 08:00)' },
    { value: 'monthly', label: 'Mensual (Día 1, 08:00)' }
  ];

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`Exportando datos en formato ${exportFormat?.toUpperCase()}...`);
    }, 2000);
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 
      shadow-elevation-sm ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Download" size={20} color="var(--color-primary)" />
        <h3 className="font-heading text-base font-semibold text-foreground">
          Exportar Datos
        </h3>
      </div>

      <div className="space-y-4">
        <Select
          label="Formato de Exportación"
          options={formatOptions}
          value={exportFormat}
          onChange={setExportFormat}
        />

        <Select
          label="Programación de Exportación"
          options={scheduleOptions}
          value={exportSchedule}
          onChange={setExportSchedule}
          description="Configura exportaciones automáticas por email"
        />

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="default"
            fullWidth
            iconName="Download"
            loading={isExporting}
            onClick={handleExport}
          >
            Exportar Ahora
          </Button>
          <Button
            variant="outline"
            fullWidth
            iconName="Mail"
          >
            Enviar por Email
          </Button>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-start gap-2 text-muted-foreground">
            <Icon name="Info" size={14} className="mt-0.5 flex-shrink-0" />
            <span className="caption text-xs">
              Los informes incluyen todos los datos filtrados actualmente. 
              Las exportaciones programadas se envían a tu email registrado.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;