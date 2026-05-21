import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/ui/Header';

import Icon from '../../components/AppIcon';
import DeceasedInfoForm from './components/DeceasedInfoForm';
import LocationDetailsForm from './components/LocationDetailsForm';
import VisualDesignForm from './components/VisualDesignForm';
import AccountHolderForm from './components/AccountHolderForm';
import TributePreview from './components/TributePreview';
import TributesList from './components/TributesList';
import { memorialsService, getFileUrl } from '../../services/api';
import { cn } from '../../utils/cn';

// Convierte un ISO/Date a formato datetime-local ("YYYY-MM-DDTHH:mm") en hora local
const toLocalDatetimeInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toLocalDateInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const TributeCreationStudio = () => {
  // memorialId presente = modo edicion; ausente = modo creacion.
  const { memorialId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!memorialId;

  const [activeTab, setActiveTab] = useState('deceased');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [loadingMemorial, setLoadingMemorial] = useState(isEditMode);
  const [formData, setFormData] = useState({
    // Información del difunto
    fullName: '',
    birthDate: '',
    deathDate: '',
    biography: '',
    photo: null,
    photoPreview: null,
    
    // Ubicación
    funeralHome: '',
    room: '',
    serviceStartDate: '',
    serviceEndDate: '',

    // Ceremonias y destino final (catalogos en BD: ceremony_venues)
    exequiasVenueId: '',
    exequiasDatetime: '',
    finalDestinationVenueId: '',
    finalDestinationDatetime: '',

    // Diseño visual
    backgroundTheme: 'nature',
    colorScheme: 'classic',
    typography: 'elegant',
    messageTemplate: 'template1',
    customMessage: '',
    slideshowTiming: 45,
    
    // Titular de cuenta
    familyContactName: '',
    familyContactPhone: '',
    familyContactEmail: '',
    billingAddress: '',
    accessPermissions: 'family'
  });

  const [errors, setErrors] = useState({});

  // Cargar datos del memorial al entrar en modo edicion.
  // El backend devuelve el memorial con room/location anidadas; necesitamos:
  // - location_id (para que el select de funeraria precargue y dispare la cascada de salas)
  // - room_id (para preseleccionar la sala)
  useEffect(() => {
    if (!memorialId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingMemorial(true);
        const r = await memorialsService.getById(memorialId);
        if (cancelled || !r?.success) return;
        const m = r.data;
        // Necesitamos location_id; getById no lo trae directo (solo location_name).
        // Workaround: traer la sala y de ahi sacar location_id.
        // GET /api/rooms/:id devuelve location_id.
        let locationId = m.location_id || '';
        if (!locationId && m.room_id) {
          try {
            const roomRes = await import('../../services/api').then(mod => mod.roomsService.getById(m.room_id));
            if (roomRes?.success) locationId = roomRes.data.location_id || '';
          } catch (_) { /* ignore */ }
        }

        setFormData(prev => ({
          ...prev,
          fullName: m.deceased_name || '',
          birthDate: m.birth_year ? `${m.birth_year}-01-01` : '',
          deathDate: m.death_year ? `${m.death_year}-01-01` : '',
          biography: m.emotional_message || '',
          photo: null, // no reasignamos File; conservamos URL existente abajo
          photoPreview: m.photo_url ? (getFileUrl(m.photo_url) || m.photo_url) : null,
          existingPhotoUrl: m.photo_url || null,

          funeralHome: locationId,
          room: m.room_id || '',
          serviceStartDate: toLocalDatetimeInput(m.schedule_start),
          serviceEndDate: toLocalDatetimeInput(m.schedule_end),

          exequiasVenueId: m.exequias_venue_id || '',
          exequiasDatetime: toLocalDatetimeInput(m.exequias_datetime),
          finalDestinationVenueId: m.final_destination_venue_id || '',
          finalDestinationDatetime: toLocalDatetimeInput(m.final_destination_datetime),

          messageTemplate: m.template_id || 'default'
        }));
      } catch (e) {
        console.error('Error cargando memorial:', e);
        alert('Error cargando homenaje: ' + (e.response?.data?.error || e.message));
      } finally {
        if (!cancelled) setLoadingMemorial(false);
      }
    })();
    return () => { cancelled = true; };
  }, [memorialId]);

  const tabs = [
    { id: 'deceased', label: 'Información del Difunto', icon: 'User' },
    { id: 'location', label: 'Ubicación y Servicio', icon: 'MapPin' },
    { id: 'design', label: 'Diseño Visual', icon: 'Palette' },
    { id: 'account', label: 'Titular de Cuenta', icon: 'Users' },
    { id: 'tributes', label: 'Mis tributos', icon: 'List' }
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando se actualiza
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validaciones básicas
    if (!formData?.fullName?.trim()) newErrors.fullName = 'El nombre completo es requerido';
    if (!formData?.birthDate) newErrors.birthDate = 'La fecha de nacimiento es requerida';
    if (!formData?.deathDate) newErrors.deathDate = 'La fecha de fallecimiento es requerida';
    if (!formData?.funeralHome) newErrors.funeralHome = 'Debe seleccionar una funeraria';
    if (!formData?.room) newErrors.room = 'Debe seleccionar una sala';
    if (!formData?.familyContactName?.trim()) newErrors.familyContactName = 'El nombre del contacto es requerido';
    if (!formData?.familyContactEmail?.trim()) newErrors.familyContactEmail = 'El email es requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  // Convierte un input datetime-local (sin TZ) o vacio a ISO string / null.
  const toIsoOrNull = (val) => (val ? new Date(val).toISOString() : null);

  const handleSave = async (isDraft = false) => {
    if (!isDraft && !validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      // 1) Subir foto si el usuario eligio una nueva. Si en modo edicion
      //    no toco la foto, mantenemos la URL existente.
      let photoUrl = formData?.existingPhotoUrl || null;
      if (formData?.photo) {
        const uploadResp = await memorialsService.uploadPhoto(formData.photo);
        photoUrl = uploadResp?.data?.photo_url || null;
      }

      // 2) Calcular birth_year / death_year a partir de las fechas del form.
      const birthYear = formData?.birthDate ? new Date(formData.birthDate).getFullYear() : null;
      const deathYear = formData?.deathDate ? new Date(formData.deathDate).getFullYear() : null;

      // 3) Si el usuario no especifico horarios del display, usamos ingreso/salida
      //    como ventana del homenaje. Si tampoco hay ingreso/salida, usamos 30 dias.
      const now = new Date();
      const scheduleStart = formData?.serviceStartDate
        ? toIsoOrNull(formData.serviceStartDate)
        : new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      const scheduleEnd = formData?.serviceEndDate
        ? toIsoOrNull(formData.serviceEndDate)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const payload = {
        room_id: formData?.room,
        deceased_name: formData?.fullName,
        birth_year: birthYear,
        death_year: deathYear,
        photo_url: photoUrl,
        emotional_message: formData?.biography || formData?.customMessage
          || 'En memoria de un ser querido. Su vida y su amor permanecen con nosotros.',
        template_id: formData?.messageTemplate || 'default',
        schedule_start: scheduleStart,
        schedule_end: scheduleEnd,
        exequias_venue_id: formData?.exequiasVenueId || null,
        exequias_datetime: toIsoOrNull(formData?.exequiasDatetime),
        final_destination_venue_id: formData?.finalDestinationVenueId || null,
        final_destination_datetime: toIsoOrNull(formData?.finalDestinationDatetime)
      };

      // En modo edicion: PUT; en modo creacion: POST.
      const resp = isEditMode
        ? await memorialsService.update(memorialId, payload)
        : await memorialsService.create(payload);

      if (resp?.success) {
        if (isEditMode) {
          alert('Cambios guardados correctamente');
          navigate(`/memorials/${memorialId}`);
        } else {
          alert(isDraft ? 'Borrador guardado exitosamente' : 'Tributo creado exitosamente');
          setActiveTab('tributes');
        }
      } else {
        throw new Error(resp?.error || 'Error desconocido');
      }
    } catch (e) {
      console.error('Error guardando tributo:', e);
      const msg = e.response?.data?.error || e.message || 'Error guardando el tributo';
      alert('No se pudo guardar: ' + msg);
    } finally {
      setIsSaving(false);
    }
  };

  const getTabValidationStatus = (tabId) => {
    const tabErrors = {
      deceased: ['fullName', 'birthDate', 'deathDate'],
      location: ['funeralHome', 'room'],
      design: [],
      account: ['familyContactName', 'familyContactEmail']
    };
    
    const hasErrors = tabErrors?.[tabId]?.some(field => errors?.[field]);
    const hasData = tabErrors?.[tabId]?.some(field => formData?.[field]);
    
    if (hasErrors) return 'error';
    if (hasData) return 'success';
    return 'neutral';
  };

  // En modo edicion mostrar loader mientras carga el memorial.
  if (loadingMemorial) {
    return (
      <>
        <Helmet><title>Cargando tributo... | SERCOFUN</title></Helmet>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Icon name="Loader" size={32} className="animate-spin mx-auto mb-3" />
            Cargando tributo...
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {isEditMode ? 'Editar Tributo' : 'Estudio de Creación de Tributos'} | Sistema Funerario
        </title>
      </Helmet>
      <Header />
      <div className="min-h-screen bg-background">
        {/* Brand header del estudio */}
        <div className="relative overflow-hidden sticky top-16 z-40"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #a7c9d2, transparent)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #477a7b, transparent)', transform: 'translate(-30%, 30%)' }} />

          <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Icon name="Heart" size={20} color="#ffffff" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-heading font-bold text-white">
                    {isEditMode ? 'Editar Tributo' : 'Estudio de Creación de Tributos'}
                  </h1>
                  <p className="text-xs text-white/70 font-body">
                    {isEditMode
                      ? 'Modifica los datos del homenaje y guarda los cambios'
                      : 'Crea homenajes personalizados para servicios funerarios'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {activeTab !== 'tributes' && (
                  <>
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-medium text-sm
                        transition-smooth hover-lift press-scale border border-white/30 text-white hover:bg-white/10"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Icon name={showPreview ? 'EyeOff' : 'Eye'} size={16} color="#ffffff" />
                      {showPreview ? 'Ocultar' : 'Mostrar'} Vista Previa
                    </button>

                    {!isEditMode && (
                      <button
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-medium text-sm
                          transition-smooth hover-lift press-scale border border-white/30 text-white hover:bg-white/10"
                        onClick={() => handleSave(true)}
                        disabled={isSaving}
                      >
                        <Icon name="Save" size={16} color="#ffffff" />
                        Guardar Borrador
                      </button>
                    )}

                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-bold text-sm
                        transition-smooth hover-lift press-scale text-primary"
                      style={{ background: '#ffffff' }}
                      onClick={() => handleSave(false)}
                      disabled={isSaving}
                    >
                      <Icon name="Check" size={16} color="#1a7472" />
                      {isSaving
                        ? 'Guardando...'
                        : (isEditMode ? 'Guardar Cambios' : 'Crear Tributo')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-[1920px] mx-auto px-6 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Área de formulario */}
            <div className={cn(
              "transition-all duration-300",
              showPreview && activeTab !== 'tributes' ? "col-span-12 lg:col-span-8" : "col-span-12"
            )}>
              <div className="bg-card rounded-lg border border-border shadow-elevation-md">
                {/* Tabs */}
                <div className="border-b border-border">
                  <div className="flex overflow-x-auto">
                    {tabs?.map(tab => {
                      const status = getTabValidationStatus(tab?.id);
                      return (
                        <button
                          key={tab?.id}
                          onClick={() => setActiveTab(tab?.id)}
                          className={cn(
                            "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                            activeTab === tab?.id
                              ? "border-primary text-primary" :"border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                          )}
                        >
                          <Icon name={tab?.icon} size={16} />
                          <span>{tab?.label}</span>
                          {status === 'error' && (
                            <Icon name="AlertCircle" size={14} className="text-error" />
                          )}
                          {status === 'success' && (
                            <Icon name="CheckCircle" size={14} color="#1a7472" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contenido del formulario */}
                <div className="p-6">
                  {activeTab === 'deceased' && (
                    <DeceasedInfoForm
                      formData={formData}
                      errors={errors}
                      updateFormData={updateFormData}
                    />
                  )}
                  
                  {activeTab === 'location' && (
                    <LocationDetailsForm
                      formData={formData}
                      errors={errors}
                      updateFormData={updateFormData}
                    />
                  )}
                  
                  {activeTab === 'design' && (
                    <VisualDesignForm
                      formData={formData}
                      errors={errors}
                      updateFormData={updateFormData}
                    />
                  )}
                  
                  {activeTab === 'account' && (
                    <AccountHolderForm
                      formData={formData}
                      errors={errors}
                      updateFormData={updateFormData}
                    />
                  )}

                  {activeTab === 'tributes' && (
                    <TributesList />
                  )}
                </div>

                {/* Navegación entre tabs (no aplica en el listado) */}
                {activeTab !== 'tributes' && (
                <div className="border-t border-border px-6 py-4 flex justify-between">
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-medium text-sm
                      transition-smooth hover-lift press-scale border border-border text-foreground hover:bg-muted"
                    onClick={() => {
                      // El tab 'tributes' es un listado, no parte del wizard
                      const wizardTabs = tabs?.filter(t => t?.id !== 'tributes');
                      const currentIndex = wizardTabs?.findIndex(t => t?.id === activeTab);
                      if (currentIndex > 0) {
                        setActiveTab(wizardTabs?.[currentIndex - 1]?.id);
                      }
                    }}
                    disabled={activeTab === tabs?.[0]?.id}
                  >
                    <Icon name="ChevronLeft" size={16} />
                    Anterior
                  </button>

                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-position text-sm
                      transition-smooth hover-lift press-scale border border-border text-foreground hover:bg-muted"
                    onClick={() => {
                      const wizardTabs = tabs?.filter(t => t?.id !== 'tributes');
                      const currentIndex = wizardTabs?.findIndex(t => t?.id === activeTab);
                      if (currentIndex < wizardTabs?.length - 1) {
                        setActiveTab(wizardTabs?.[currentIndex + 1]?.id);
                      }
                    }}
                    disabled={activeTab === tabs?.filter(t => t?.id !== 'tributes')?.slice(-1)?.[0]?.id}
                  >
                    Siguiente
                  </button>
                </div>
                )}
              </div>
            </div>

            {/* Vista previa en vivo (no aplica en el tab de listado) */}
            {showPreview && activeTab !== 'tributes' && (
              <div className="col-span-12 lg:col-span-4">
                <div className="sticky top-24">
                  <TributePreview formData={formData} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TributeCreationStudio;