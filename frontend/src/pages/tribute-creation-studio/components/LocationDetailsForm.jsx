import React, { useEffect, useState, useMemo } from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../context/AuthContext';
import {
  locationsService,
  roomsService
} from '../../../services/api';

const LocationDetailsForm = ({ formData, errors, updateFormData }) => {
  const { user } = useAuth();
  // El operador de sede solo puede crear/editar homenajes en su propia sede
  // (el backend tambien lo valida; esto evita que ni siquiera intente
  // elegir otra sede en el formulario).
  const isOperator = user?.role === 'operator';
  const operatorLocationId = user?.location_id || '';

  const [locations, setLocations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Cargar funerarias (locations) una sola vez.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const locs = await locationsService.getAll();
        if (cancelled) return;
        setLocations(locs?.data || []);
      } catch (e) {
        console.error('Error cargando funerarias:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Si es operador de sede, precargar automaticamente su sede asignada
  // (solo si el formulario aun no tiene una funeraria elegida, ej. al crear).
  useEffect(() => {
    if (isOperator && operatorLocationId && !formData?.funeralHome) {
      updateFormData('funeralHome', operatorLocationId);
    }
  }, [isOperator, operatorLocationId, formData?.funeralHome]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cuando cambia la funeraria, cargar las salas correspondientes (cascada).
  useEffect(() => {
    let cancelled = false;
    if (!formData?.funeralHome) {
      setRooms([]);
      return;
    }
    setLoadingRooms(true);
    (async () => {
      try {
        const r = await roomsService.getAll({ location_id: formData.funeralHome, active: true });
        if (!cancelled) setRooms(r?.data || []);
      } catch (e) {
        console.error('Error cargando salas:', e);
      } finally {
        if (!cancelled) setLoadingRooms(false);
      }
    })();
    return () => { cancelled = true; };
  }, [formData?.funeralHome]);

  // Si cambian la funeraria, limpiar la sala seleccionada para evitar inconsistencias.
  useEffect(() => {
    if (!formData?.funeralHome && formData?.room) {
      updateFormData('room', '');
    }
  }, [formData?.funeralHome]); // eslint-disable-line react-hooks/exhaustive-deps

  const locationOptions = useMemo(() => {
    const visible = isOperator ? locations.filter(l => l.id === operatorLocationId) : locations;
    return visible.map(l => ({ value: l.id, label: `${l.name} (${l.city})` }));
  }, [locations, isOperator, operatorLocationId]);
  const roomTypeLabel = (t) => ({
    ejecutiva: 'Ejecutiva', presidencial: 'Presidencial', vip: 'VIP'
  }[t] || '');
  const roomOptions = useMemo(
    () => rooms.map(r => {
      const tipo = r.room_type ? ` · ${roomTypeLabel(r.room_type)}` : '';
      return { value: r.id, label: `${r.name}${tipo}` };
    }),
    [rooms]
  );
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Ubicación y Servicio</h3>
        <p className="text-sm text-muted-foreground">Configure la sede, sala, horarios e información del servicio funerario</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Funeraria"
          placeholder="Seleccione una funeraria"
          options={locationOptions}
          value={formData?.funeralHome}
          onChange={(value) => updateFormData('funeralHome', value)}
          error={errors?.funeralHome}
          required
          searchable={!isOperator}
          disabled={isOperator}
          description={isOperator ? 'Tu usuario solo puede crear/editar homenajes en esta sede' : undefined}
        />

        <Select
          label="Sala / Capilla"
          placeholder={loadingRooms ? 'Cargando salas...' : 'Seleccione una sala'}
          options={roomOptions}
          value={formData?.room}
          onChange={(value) => updateFormData('room', value)}
          error={errors?.room}
          required
          disabled={!formData?.funeralHome || loadingRooms}
          description={!formData?.funeralHome ? 'Primero seleccione una funeraria' : ''}
        />

        <Input
          type="datetime-local"
          label="Fecha y Hora de Ingreso"
          value={formData?.serviceStartDate}
          onChange={(e) => updateFormData('serviceStartDate', e?.target?.value)}
          error={errors?.serviceStartDate}
          description="Entrada del cuerpo a la sala"
        />

        <Input
          type="datetime-local"
          label="Fecha y Hora de Salida"
          value={formData?.serviceEndDate}
          onChange={(e) => updateFormData('serviceEndDate', e?.target?.value)}
          error={errors?.serviceEndDate}
          description="Salida del cuerpo de la sala"
        />
      </div>

      {/* Horario diario que la sala esta habilitada (aparece en el footer del display) */}
      <div className="pt-2">
        <h4 className="text-sm font-semibold text-foreground mb-1">Horario de la Sala</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Hora del dia en que la sala esta habilitada al publico. Se muestra en el footer
          de la pantalla del display.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            type="time"
            label="Sala habilitada desde"
            value={formData?.dailyHoursStart || '08:00'}
            onChange={(e) => updateFormData('dailyHoursStart', e?.target?.value)}
            description="Hora de apertura (por defecto 08:00)"
          />
          <Input
            type="time"
            label="Sala habilitada hasta"
            value={formData?.dailyHoursEnd || '23:00'}
            onChange={(e) => updateFormData('dailyHoursEnd', e?.target?.value)}
            description="Hora de cierre (por defecto 23:00)"
          />
        </div>
      </div>

      {/* Exequias y Destino Final */}
      <div className="pt-2">
        <h4 className="text-sm font-semibold text-foreground mb-3">Ceremonias y Destino Final</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            type="text"
            label="Lugar de Exequias"
            placeholder="Ej: Capilla San José, Iglesia La Merced..."
            value={formData?.exequiasVenue}
            onChange={(e) => updateFormData('exequiasVenue', e?.target?.value)}
            error={errors?.exequiasVenue}
            description="Capilla, iglesia u oratorio donde se realiza la ceremonia"
          />

          <Input
            type="datetime-local"
            label="Fecha y Hora de Exequias"
            value={formData?.exequiasDatetime}
            onChange={(e) => updateFormData('exequiasDatetime', e?.target?.value)}
            error={errors?.exequiasDatetime}
          />

          <Input
            type="text"
            label="Destino Final"
            placeholder="Ej: Cementerio Jardines de Paz, Crematorio Los Olivos..."
            value={formData?.finalDestinationVenue}
            onChange={(e) => updateFormData('finalDestinationVenue', e?.target?.value)}
            error={errors?.finalDestinationVenue}
            description="Crematorio o cementerio"
          />

          <Input
            type="datetime-local"
            label="Fecha y Hora del Destino Final"
            value={formData?.finalDestinationDatetime}
            onChange={(e) => updateFormData('finalDestinationDatetime', e?.target?.value)}
            error={errors?.finalDestinationDatetime}
          />
        </div>
      </div>

      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-accent/10 rounded-full p-2">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-foreground mb-1">Información sobre Pantallas Digitales</h4>
            <p className="text-xs text-muted-foreground">
              Al crear el tributo, la pantalla digital de la sala mostrará automáticamente los datos del homenaje,
              los mensajes recibidos, la información del servicio y el código QR para que los asistentes
              dejen sus condolencias.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDetailsForm;
