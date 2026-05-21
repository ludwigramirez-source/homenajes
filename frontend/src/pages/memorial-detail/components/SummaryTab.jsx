import React from 'react';
import Icon from '../../../components/AppIcon';
import { getFileUrl } from '../../../services/api';

const formatDateTime = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// Bloque clave/valor reutilizable
const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2">
    <Icon name={icon} size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm text-foreground mt-0.5">
        {value || <span className="italic text-muted-foreground">Sin información</span>}
      </p>
    </div>
  </div>
);

const SummaryTab = ({ memorial }) => {
  const photo = memorial?.photo_url ? (getFileUrl(memorial.photo_url) || memorial.photo_url) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna izquierda: foto y datos del difunto */}
      <div className="lg:col-span-1 space-y-4">
        <div className="rounded-lg overflow-hidden border border-border bg-muted/20">
          {photo ? (
            <img
              src={photo}
              alt={memorial.deceased_name}
              className="w-full h-64 object-cover object-top"
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
              <Icon name="UserCircle" size={64} />
            </div>
          )}
        </div>

        <div>
          <h3 className="text-2xl font-bold text-foreground">{memorial?.deceased_name}</h3>
          {memorial?.birth_year && memorial?.death_year && (
            <p className="text-sm text-muted-foreground mt-1">
              {memorial.birth_year} — {memorial.death_year}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              memorial?.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${memorial?.active ? 'bg-green-500' : 'bg-gray-400'}`} />
              {memorial?.active ? 'Activo' : 'Inactivo'}
            </span>
            {memorial?.condolence_count !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                <Icon name="MessageCircle" size={12} />
                {memorial.condolence_count} mensajes
              </span>
            )}
          </div>
        </div>

        {memorial?.emotional_message && (
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Mensaje emocional</p>
            <p className="text-sm text-foreground leading-relaxed italic">
              "{memorial.emotional_message}"
            </p>
          </div>
        )}
      </div>

      {/* Columna derecha: ubicación y datos del servicio */}
      <div className="lg:col-span-2 space-y-6">
        {/* Ubicación */}
        <div>
          <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Icon name="MapPin" size={14} />
            Ubicación
          </h4>
          <div className="bg-muted/20 border border-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <InfoRow icon="Building2" label="Funeraria" value={memorial?.location_name} />
            <InfoRow icon="Home" label="Sala" value={memorial?.room_name && `${memorial.room_name} (${memorial.room_code})`} />
            <InfoRow icon="MapPin" label="Ciudad" value={memorial?.location_city} />
          </div>
        </div>

        {/* Servicio funerario */}
        <div>
          <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Icon name="Calendar" size={14} />
            Servicio Funerario
          </h4>
          <div className="bg-muted/20 border border-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <InfoRow icon="LogIn" label="Ingreso" value={formatDateTime(memorial?.schedule_start)} />
            <InfoRow icon="LogOut" label="Salida" value={formatDateTime(memorial?.schedule_end)} />
            <InfoRow
              icon="Church"
              label="Exequias"
              value={memorial?.exequias_venue_name ? `${memorial.exequias_venue_name}${memorial.exequias_datetime ? ' · ' + formatDateTime(memorial.exequias_datetime) : ''}` : null}
            />
            <InfoRow
              icon="Flame"
              label="Destino Final"
              value={memorial?.final_destination_venue_name ? `${memorial.final_destination_venue_name}${memorial.final_destination_datetime ? ' · ' + formatDateTime(memorial.final_destination_datetime) : ''}` : null}
            />
          </div>
        </div>

        {/* Metadata */}
        <div>
          <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Icon name="Info" size={14} />
            Registro
          </h4>
          <div className="bg-muted/20 border border-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <InfoRow icon="User" label="Creado por" value={memorial?.created_by_name} />
            <InfoRow icon="Clock" label="Fecha de creación" value={formatDateTime(memorial?.created_at)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryTab;
