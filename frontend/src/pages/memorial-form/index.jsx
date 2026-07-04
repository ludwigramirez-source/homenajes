import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { cn } from '../../utils/cn';
import { roomsService, condolencesService } from '../../services/api';
import { getTheme } from './themes';

// Limite alineado con el backend (condolences.controller.js -> MESSAGE_MAX_LENGTH).
// Asegura que cada mensaje sea legible como card en la pantalla del display.
const MESSAGE_MAX_LENGTH = 480;

const MemorialForm = () => {
  const { roomId } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [files, setFiles] = useState([]);
  const [authorized, setAuthorized] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [showElements, setShowElements] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [memorialData, setMemorialData] = useState({
    name: '',
    birthYear: '',
    deathYear: '',
    id: null,
    templateId: 'default'
  });
  const [loadingMemorial, setLoadingMemorial] = useState(true);

  // Cargar datos del memorial activo
  useEffect(() => {
    const loadMemorial = async () => {
      try {
        const response = await roomsService.getActiveMemorial(roomId);
        if (response.success) {
          setMemorialData({
            name: response.data.deceased_name,
            birthYear: response.data.birth_year?.toString() || '',
            deathYear: response.data.death_year?.toString() || '',
            id: response.data.id,
            templateId: response.data.template_id || 'default'
          });
        }
      } catch (err) {
        console.error('Error cargando memorial:', err);
        setErrors({ general: 'No hay homenaje activo en esta sala' });
      } finally {
        setLoadingMemorial(false);
      }
    };
    if (roomId) loadMemorial();
  }, [roomId]);

  React.useEffect(() => {
    setTimeout(() => setShowElements(true), 100);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors?.[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e?.target?.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    if (files?.length >= 2) {
      alert('Máximo 2 archivos permitidos');
      return;
    }
    const availableSlots = 2 - files?.length;
    const filesToAdd = newFiles?.slice(0, availableSlots);
    setFiles(prev => [...prev, ...filesToAdd]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev?.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e?.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e?.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e?.dataTransfer?.files || []);
    addFiles(droppedFiles);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData?.name?.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData?.email?.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
      newErrors.email = 'Correo electrónico inválido';
    }
    if (!formData?.message?.trim()) {
      newErrors.message = 'El mensaje es requerido';
    } else if (formData?.message?.length > MESSAGE_MAX_LENGTH) {
      newErrors.message = `El mensaje no puede superar ${MESSAGE_MAX_LENGTH} caracteres`;
    }
    if (!authorized) newErrors.authorized = 'Debe autorizar el manejo de datos';
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;
    if (!memorialData.id) {
      setErrors({ general: 'No se encontro el memorial activo' });
      return;
    }

    setSubmitting(true);
    try {
      const submitFormData = new FormData();
      submitFormData.append('memorial_id', memorialData.id);
      submitFormData.append('sender_name', formData.name);
      submitFormData.append('sender_email', formData.email);
      submitFormData.append('sender_phone', formData.phone || '');
      submitFormData.append('message', formData.message);
      submitFormData.append('marketing_consent', authorized);
      
      files.forEach((file) => {
        submitFormData.append('files', file);
      });

      const response = await condolencesService.submit(submitFormData);
      if (response.success) {
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error('Error enviando condolencia:', err);
      setErrors({ 
        general: err.response?.data?.error || 'Error al enviar el mensaje. Intenta nuevamente.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Tema visual segun la plantilla del homenaje (template_id).
  const theme = getTheme(memorialData?.templateId);
  const isDefaultTheme = !memorialData?.templateId || memorialData?.templateId === 'default';

  if (isSubmitted) {
    return (
      <>
        <Helmet>
          <title>Mensaje Enviado - Memorial {memorialData?.name}</title>
        </Helmet>

        <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-4" style={{ background: theme.background }}>
          {/* Decorative circles: completos solo en el tema clasico; sutiles en el resto */}
          {isDefaultTheme ? (
            <>
              <div className="absolute -top-24 -right-24 w-[380px] h-[380px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }}></div>
              <div className="absolute -bottom-32 -left-16 w-[320px] h-[320px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}></div>
              <div className="absolute top-12 left-1/4 w-12 h-12 rounded-full opacity-30" style={{ background: '#f0c040' }}></div>
            </>
          ) : (
            <>
              <div className="absolute -top-24 -right-24 w-[380px] h-[380px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)' }}></div>
              <div className="absolute -bottom-32 -left-16 w-[320px] h-[320px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}></div>
            </>
          )}

          <div className="relative w-full max-w-md rounded-3xl p-12 text-center" style={{ background: theme.cardBg, backdropFilter: 'blur(20px)', border: theme.cardBorder, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div className="w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center" style={{ background: theme.accent, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
              <svg className="w-14 h-14" style={{ color: theme.accentText }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-3xl font-bold mb-4 text-white" style={{ fontFamily: 'Spectral, serif' }}>
              Mensaje enviado
            </h2>
            <p className="text-lg leading-relaxed text-white opacity-85" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
              Gracias por compartir tus recuerdos. Tu mensaje y fotos serán incluidos en el libro de homenaje para la familia.
            </p>

            <div className="mt-8 flex justify-center">
              <svg className="w-12 h-12 text-white opacity-25" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>

            {/* Branding: logo Los Olivos (opacidad sutil) + tagline. Mismo
                tratamiento que el footer del display digital. */}
            <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <img
                src="/logo-los-olivos-blanco.png"
                alt="Los Olivos"
                style={{ display: 'inline-block', width: '160px', height: 'auto', opacity: 0.55 }}
              />
              <p className="text-white opacity-75 text-[0.75rem] mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Un homenaje al amor
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dejar Mensaje - Memorial {memorialData?.name}</title>
      </Helmet>

      <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center py-8 px-4" style={{ background: theme.background }}>

        {/* Decorative circles: estilo completo Los Olivos solo en el tema clasico */}
        {isDefaultTheme ? (
          <>
            <div className="absolute -top-28 -right-28 w-[460px] h-[460px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }}></div>
            <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}></div>
            <div className="absolute top-1/2 -translate-y-1/2 -right-12 w-[260px] h-[260px] rounded-full opacity-8" style={{ background: 'rgba(255,255,255,0.15)' }}></div>
            {/* Yellow accent dots */}
            <div className="absolute top-14 left-1/4 w-14 h-14 rounded-full opacity-35" style={{ background: '#f0c040' }}></div>
            <div className="absolute bottom-20 right-1/3 w-8 h-8 rounded-full opacity-25" style={{ background: '#f0c040' }}></div>
            <div className="absolute top-1/3 left-12 w-5 h-5 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.8)' }}></div>
          </>
        ) : (
          <>
            <div className="absolute -top-28 -right-28 w-[460px] h-[460px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)' }}></div>
            <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}></div>
          </>
        )}

        {/* Main card */}
        <div className="relative w-full max-w-[520px] rounded-3xl overflow-hidden" style={{ background: theme.cardBg, backdropFilter: 'blur(24px)', border: theme.cardBorder, boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>

          {/* Header section - solid teal accent */}
          <div className="relative px-8 pt-10 pb-8 text-center overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            {/* Small decorative circle in header */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.3)' }}></div>

            <div className={cn(
              "transition-all duration-700 delay-100",
              showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <p className="text-[1.1rem] font-light text-white opacity-80 mb-1" style={{ fontFamily: 'Spectral, serif' }}>
                En memoria de
              </p>
              <h1 className="text-[2.4rem] font-bold text-white leading-tight" style={{ fontFamily: 'Spectral, serif', textShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
                {memorialData?.name}
              </h1>
              <div className="flex items-center justify-center gap-3 mt-2">
                <div className="h-[1px] w-8 bg-white opacity-40"></div>
                <p className="text-[1.1rem] text-white opacity-70" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
                  {memorialData?.birthYear} — {memorialData?.deathYear}
                </p>
                <div className="h-[1px] w-8 bg-white opacity-40"></div>
              </div>
            </div>
          </div>

          {/* Form body */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Nombre */}
              <div className={cn(
                "transition-all duration-700 delay-200",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}>
                <label htmlFor="name" className="block text-sm font-semibold mb-2 text-white opacity-90" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData?.name}
                  onChange={handleInputChange}
                  placeholder="Tu nombre completo"
                  className={cn(
                    "w-full px-4 py-3.5 rounded-xl transition-all duration-300 focus:outline-none",
                    errors?.name ? "ring-2 ring-red-400" : ""
                  )}
                  style={{
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    background: 'rgba(255,255,255,0.92)',
                    color: '#1a4a48',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  onFocus={e => { e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 3px ${theme.focusRing}, 0 2px 8px rgba(0,0,0,0.1)`; }}
                  onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.92)'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                />
                {errors?.name && <p className="text-yellow-300 text-sm mt-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>{errors?.name}</p>}
              </div>

              {/* Correo */}
              <div className={cn(
                "transition-all duration-700 delay-300",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}>
                <label htmlFor="email" className="block text-sm font-semibold mb-2 text-white opacity-90" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData?.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  className={cn(
                    "w-full px-4 py-3.5 rounded-xl transition-all duration-300 focus:outline-none",
                    errors?.email ? "ring-2 ring-red-400" : ""
                  )}
                  style={{
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    background: 'rgba(255,255,255,0.92)',
                    color: '#1a4a48',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  onFocus={e => { e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 3px ${theme.focusRing}, 0 2px 8px rgba(0,0,0,0.1)`; }}
                  onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.92)'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                />
                {errors?.email && <p className="text-yellow-300 text-sm mt-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>{errors?.email}</p>}
              </div>

              {/* Número */}
              <div className={cn(
                "transition-all duration-700 delay-[400ms]",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}>
                <label htmlFor="phone" className="block text-sm font-semibold mb-2 text-white opacity-90" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Número de contacto
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData?.phone}
                  onChange={handleInputChange}
                  placeholder="Tu número de contacto (opcional)"
                  className="w-full px-4 py-3.5 rounded-xl transition-all duration-300 focus:outline-none"
                  style={{
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    background: 'rgba(255,255,255,0.92)',
                    color: '#1a4a48',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  onFocus={e => { e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 3px ${theme.focusRing}, 0 2px 8px rgba(0,0,0,0.1)`; }}
                  onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.92)'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                />
              </div>

              {/* Mensaje */}
              <div className={cn(
                "transition-all duration-700 delay-[500ms]",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}>
                <label htmlFor="message" className="block text-sm font-semibold mb-2 text-white opacity-90" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Tu mensaje *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData?.message}
                  onChange={handleInputChange}
                  placeholder="Comparte tus recuerdos y sentimientos..."
                  rows={5}
                  maxLength={MESSAGE_MAX_LENGTH}
                  className={cn(
                    "w-full px-4 py-3.5 rounded-xl transition-all duration-300 resize-none focus:outline-none",
                    errors?.message ? "ring-2 ring-red-400" : ""
                  )}
                  style={{
                    fontSize: '16px',
                    minHeight: '130px',
                    fontFamily: 'Inter, sans-serif',
                    background: 'rgba(255,255,255,0.92)',
                    color: '#1a4a48',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  onFocus={e => { e.target.style.background = '#fff'; e.target.style.boxShadow = `0 0 0 3px ${theme.focusRing}, 0 2px 8px rgba(0,0,0,0.1)`; }}
                  onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.92)'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                />
                {/* Contador de caracteres + error en una sola fila */}
                <div className="flex items-start justify-between mt-1.5 gap-2">
                  <p className="text-yellow-300 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {errors?.message || ''}
                  </p>
                  <p
                    className="text-xs flex-shrink-0 ml-auto"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: (formData?.message?.length || 0) >= MESSAGE_MAX_LENGTH
                        ? '#fde68a'
                        : 'rgba(255,255,255,0.6)'
                    }}
                  >
                    {(formData?.message?.length || 0)} / {MESSAGE_MAX_LENGTH}
                  </p>
                </div>
              </div>

              {/* Área de carga de archivos */}
              <div className={cn(
                "transition-all duration-700 delay-[600ms]",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}>
                <label className="block text-sm font-semibold mb-2 text-white opacity-90" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Adjuntar fotos o recuerdos
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-5 text-center transition-all duration-300 cursor-pointer",
                    files?.length >= 2 && "opacity-50 cursor-not-allowed"
                  )}
                  style={{
                    borderColor: isDragging ? theme.accent : 'rgba(255,255,255,0.35)',
                    background: isDragging ? theme.dragBg : 'rgba(255,255,255,0.08)',
                  }}
                  onClick={() => files?.length < 2 && document.getElementById('file-input')?.click()}
                >
                  <input
                    type="file"
                    id="file-input"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <svg className="w-9 h-9 mx-auto mb-2 text-white opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-white font-medium opacity-85 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {files?.length >= 2 ? 'Máximo alcanzado (2 archivos)' : 'Arrastra archivos aquí'}
                  </p>
                  <p className="text-white opacity-55 text-xs mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    o haz clic para seleccionar (máx. 2)
                  </p>
                </div>

                {files?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files?.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <svg className="w-5 h-5 flex-shrink-0 text-white opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm truncate text-white opacity-85" style={{ fontFamily: 'Inter, sans-serif' }}>{file?.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-2 text-white opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkbox de autorización */}
              <div className={cn(
                "transition-all duration-700 delay-[700ms]",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={authorized}
                      onChange={(e) => {
                        setAuthorized(e?.target?.checked);
                        if (errors?.authorized) {
                          setErrors(prev => ({ ...prev, authorized: '' }));
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className={cn(
                      "w-5 h-5 border-2 rounded transition-all duration-200",
                      errors?.authorized ? "border-red-400" : "border-white/50"
                    )} style={authorized ? { background: theme.accent, borderColor: theme.accent } : { background: 'rgba(255,255,255,0.15)' }}>
                      {authorized && (
                        <svg className="w-full h-full p-0.5" style={{ color: theme.accentText }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm leading-relaxed text-white opacity-80" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Autorizo el manejo de mis datos personales para ser incluidos en el libro de homenaje y compartidos con la familia del difunto.
                  </span>
                </label>
                {errors?.authorized && <p className="text-yellow-300 text-sm mt-1.5 ml-8" style={{ fontFamily: 'Inter, sans-serif' }}>{errors?.authorized}</p>}
              </div>

              {/* Botón de envío */}
              <div className={cn(
                "pt-2 transition-all duration-700 delay-[800ms]",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}>
                <button
                  type="submit"
                  className="w-full py-4 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ fontFamily: 'Spectral, serif', fontSize: '16px', background: theme.accent, color: theme.accentText, boxShadow: `0 4px 20px ${theme.accentShadow}` }}
                >
                  Enviar mensaje de homenaje
                </button>
              </div>
            </form>

            {/* Footer brand: logo + tagline (estilo consistente con el display) */}
            <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <img
                src="/logo-los-olivos-blanco.png"
                alt="Los Olivos"
                style={{ display: 'inline-block', width: '140px', height: 'auto', opacity: 0.55 }}
              />
              <p className="text-white opacity-70 text-[0.7rem] mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Un homenaje al amor
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MemorialForm;