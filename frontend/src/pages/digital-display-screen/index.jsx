import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '../../utils/cn';
import { roomsService, condolencesService, getFileUrl } from '../../services/api';

// 4 pantallas en rotacion: 0 = foto+mensaje, 1 = grid de mensajes, 2 = info de servicio, 3 = QR
const TOTAL_SCREENS = 4;
const MESSAGES_PER_PAGE = 6; // grid 3x2
// Cada cuanto refrescamos la lista de mensajes (segundos)
const MESSAGES_REFRESH_MS = 30 * 1000;

const DigitalDisplayScreen = () => {
  const { roomId } = useParams();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [fadeClass, setFadeClass] = useState('opacity-100');
  const [showElements, setShowElements] = useState(false);
  const [memorialData, setMemorialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesPage, setMessagesPage] = useState(0);

  // Cargar datos del memorial desde el backend
  useEffect(() => {
    const loadMemorial = async () => {
      try {
        setLoading(true);
        const response = await roomsService.getActiveMemorial(roomId);
        if (response.success) {
          const m = response.data;
          setMemorialData({
            id: m.id,
            name: m.deceased_name,
            birthYear: m.birth_year?.toString() || '',
            deathYear: m.death_year?.toString() || '',
            photo: getFileUrl(m.photo_url) || "/assets/images/image-1779149178458.png",
            message: m.emotional_message,
            qrMessage: m.qr_message,
            scheduleStart: m.schedule_start_time || '08:00',
            scheduleEnd: m.schedule_end_time || '23:00',
            qrUrl: `${window.location?.origin}/memorial-form/${roomId}`,
            roomName: m.room_name,
            locationName: m.location_name,
            // Datos del servicio funerario (pantalla 3 del slider)
            viewingStart: m.schedule_start,
            viewingEnd: m.schedule_end,
            exequiasVenue: m.exequias_venue_name,
            exequiasDatetime: m.exequias_datetime,
            finalDestinationVenue: m.final_destination_venue_name,
            finalDestinationDatetime: m.final_destination_datetime
          });
        }
      } catch (err) {
        console.error('Error cargando memorial:', err);
        setError(err.response?.data?.error || 'No hay homenaje activo en esta sala');
      } finally {
        setLoading(false);
      }
    };
    if (roomId) loadMemorial();
  }, [roomId]);

  // Refrescar datos cada 5 minutos (por si cambian)
  useEffect(() => {
    if (!roomId) return;
    const refreshInterval = setInterval(async () => {
      try {
        const response = await roomsService.getActiveMemorial(roomId);
        if (response.success) {
          const m = response.data;
          setMemorialData(prev => ({
            ...prev,
            name: m.deceased_name,
            birthYear: m.birth_year?.toString() || '',
            deathYear: m.death_year?.toString() || '',
            photo: getFileUrl(m.photo_url) || prev?.photo,
            message: m.emotional_message
          }));
        }
      } catch (err) {
        console.error('Error refrescando:', err);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [roomId]);

  useEffect(() => {
    if (memorialData) setShowElements(true);
  }, [memorialData]);

  useEffect(() => {
    if (!memorialData) return;
    const interval = setInterval(() => {
      setFadeClass('opacity-0');
      setShowElements(false);
      setTimeout(() => {
        setCurrentScreen((prev) => (prev + 1) % TOTAL_SCREENS);
        setFadeClass('opacity-100');
        setTimeout(() => setShowElements(true), 100);
      }, 2500);
    }, 25000);
    return () => clearInterval(interval);
  }, [memorialData]);

  // Cargar mensajes recibidos (condolencias) del homenaje activo y refrescarlos
  // periodicamente para que nuevos envios aparezcan en pantalla.
  useEffect(() => {
    const memorialId = memorialData?.id;
    if (!memorialId) return;

    let cancelled = false;

    const loadMessages = async () => {
      try {
        const response = await condolencesService.getPublic(memorialId, 60);
        if (!cancelled && response.success) {
          setMessages(response.data || []);
        }
      } catch (err) {
        // No bloqueamos el display si falla; solo lo registramos
        console.error('Error cargando mensajes:', err);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, MESSAGES_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [memorialData?.id]);

  // Paginacion interna de la pantalla de cards: cada vez que entramos en esa
  // pantalla, avanzamos a la siguiente "pagina" de 6 mensajes (si hay).
  useEffect(() => {
    if (currentScreen !== 1) return;
    if (messages.length <= MESSAGES_PER_PAGE) {
      setMessagesPage(0);
      return;
    }
    const totalPages = Math.ceil(messages.length / MESSAGES_PER_PAGE);
    setMessagesPage((prev) => (prev + 1) % totalPages);
  }, [currentScreen, messages.length]);

  // Tarjetas a renderizar en esta "pagina"
  const visibleMessages = messages.slice(
    messagesPage * MESSAGES_PER_PAGE,
    messagesPage * MESSAGES_PER_PAGE + MESSAGES_PER_PAGE
  );
  const totalPages = Math.max(1, Math.ceil(messages.length / MESSAGES_PER_PAGE));

  // Pantalla de loading
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #1a9490 0%, #155f5d 100%)' }}>
        <div className="text-white text-2xl">Cargando memorial...</div>
      </div>
    );
  }

  // Pantalla de error
  if (error || !memorialData) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center text-center px-8" style={{ background: 'linear-gradient(160deg, #1a9490 0%, #155f5d 100%)' }}>
        <div>
          <h1 className="text-white text-4xl font-light mb-4">Sala disponible</h1>
          <p className="text-white/80 text-xl">{error || 'No hay homenaje activo en este momento'}</p>
          <p className="text-white/60 text-sm mt-8">SERCOFUN - Funerario Los Olivos</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Memorial Digital - {memorialData?.name}</title>
      </Helmet>
      <div className="min-h-screen w-full relative overflow-hidden flex items-stretch" style={{ background: 'linear-gradient(160deg, #1a9490 0%, #1a7472 35%, #155f5d 70%, #0f4a48 100%)' }}>

        {/* Large decorative circles - brand style */}
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)' }}></div>
        <div className="absolute -bottom-48 -left-24 w-[480px] h-[480px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}></div>
        <div className="absolute top-1/2 -translate-y-1/2 -right-16 w-[320px] h-[320px] rounded-full opacity-10" style={{ background: 'rgba(255,255,255,0.4)' }}></div>
        {/* Small accent circles */}
        <div className="absolute top-16 left-1/3 w-16 h-16 rounded-full opacity-30" style={{ background: '#f0c040' }}></div>
        <div className="absolute bottom-24 right-1/4 w-10 h-10 rounded-full opacity-25" style={{ background: '#f0c040' }}></div>
        <div className="absolute top-1/3 right-1/3 w-6 h-6 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.8)' }}></div>

        {/* Content with fade transition */}
        <div className={cn("w-full flex transition-opacity duration-[2500ms] ease-in-out", fadeClass)}>

          {currentScreen === 1 && (
          // SCREEN 2 - Emotional Message (foto + mensaje del homenaje)
          <div className="w-full flex min-h-screen">
              {/* Left column - photo area */}
              <div className="w-[42%] flex flex-col items-center justify-center px-12 py-16 relative">
                {/* Decorative circle behind photo */}
                <div className="absolute w-[420px] h-[420px] rounded-full opacity-15" style={{ background: 'rgba(255,255,255,0.25)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></div>
                <div className="absolute w-[360px] h-[360px] rounded-full opacity-10" style={{ background: 'rgba(255,255,255,0.3)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></div>

                {/* Photo */}
                <div className={cn(
                "relative z-10 transition-all duration-700 delay-200",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}>
                  <div className="w-[300px] h-[380px] rounded-[40%_40%_50%_50%/30%_30%_50%_50%] overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 6px rgba(255,255,255,0.2)' }}>
                    <img
                    src={memorialData?.photo}
                    alt={`Fotografía de ${memorialData?.name}`}
                    className="w-full h-full object-cover object-top" />
                  
                  </div>
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-[40%_40%_50%_50%/30%_30%_50%_50%] pointer-events-none" style={{ boxShadow: '0 0 40px rgba(255,255,255,0.12)' }}></div>
                </div>

                {/* Name & years below photo */}
                <div className={cn(
                "relative z-10 text-center mt-8 transition-all duration-700 delay-400",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}>
                  <h1 className="text-[2.6rem] font-bold leading-tight text-white" style={{ fontFamily: 'Spectral, serif', textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
                    {memorialData?.name}
                  </h1>
                  <div className="flex items-center justify-center gap-3 mt-3">
                    <div className="h-[1px] w-10 bg-white opacity-50"></div>
                    <p className="text-[1.3rem] text-white opacity-80" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
                      {memorialData?.birthYear} — {memorialData?.deathYear}
                    </p>
                    <div className="h-[1px] w-10 bg-white opacity-50"></div>
                  </div>
                </div>
              </div>
              {/* Right column - text content */}
              <div className="w-[58%] flex flex-col justify-center px-16 py-16">

                {/* "En todo MOMENTO" style headline */}
                <div className={cn(
                "transition-all duration-700 delay-100",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}>
                  <p className="text-[1.4rem] font-light text-white opacity-80 mb-1" style={{ fontFamily: 'Spectral, serif' }}>
                    En memoria de
                  </p>
                  <h2 className="text-[4.5rem] font-bold text-white leading-none mb-2" style={{ fontFamily: 'Spectral, serif', textShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                    {memorialData?.name?.split(' ')?.[0]}
                  </h2>
                  <p className="text-[1.6rem] font-light text-white opacity-90 mb-10" style={{ fontFamily: 'Spectral, serif' }}>
                    siempre en nuestro corazón
                  </p>
                </div>

                {/* Divider */}
                <div className={cn(
                "w-16 h-1 rounded-full mb-10 transition-all duration-700 delay-300",
                showElements ? "opacity-100" : "opacity-0"
              )} style={{ background: 'rgba(255,255,255,0.5)' }}></div>

                {/* Message */}
                <div className={cn(
                "transition-all duration-700 delay-500",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}>
                  <p className="text-[1.45rem] leading-[1.9] text-white opacity-90" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
                    {memorialData?.message}
                  </p>
                </div>

                {/* Heart icon */}
                <div className={cn(
                "mt-12 transition-all duration-700 delay-700",
                showElements ? "opacity-100" : "opacity-0"
              )}>
                  <svg className="w-14 h-14 text-white opacity-30" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {currentScreen === 2 && (
          // SCREEN 3 - Mensajes recibidos (grid 3x2 con paginacion)
          <div className="w-full flex flex-col min-h-screen px-12 pt-14 pb-24">
              {/* Header */}
              <div className={cn(
                "text-center mb-8 transition-all duration-700 delay-100",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}>
                <p className="text-[1.1rem] font-light text-white opacity-75 mb-1" style={{ fontFamily: 'Spectral, serif' }}>
                  Mensajes para
                </p>
                <h2 className="text-[2.6rem] font-bold text-white leading-tight" style={{ fontFamily: 'Spectral, serif', textShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
                  {memorialData?.name}
                </h2>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <div className="h-[1px] w-12 bg-white opacity-40"></div>
                  <p className="text-[0.95rem] text-white opacity-70" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
                    {messages.length === 0
                      ? 'Aún no hay mensajes'
                      : `${messages.length} ${messages.length === 1 ? 'mensaje recibido' : 'mensajes recibidos'}`}
                  </p>
                  <div className="h-[1px] w-12 bg-white opacity-40"></div>
                </div>
              </div>

              {/* Grid de mensajes o estado vacio */}
              <div className="flex-1 flex items-center justify-center">
                {messages.length === 0 ? (
                  <div className={cn(
                    "text-center max-w-lg transition-all duration-700 delay-300",
                    showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  )}>
                    <svg className="w-20 h-20 mx-auto mb-6 text-white opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-[1.5rem] text-white opacity-85 font-light mb-3" style={{ fontFamily: 'Spectral, serif' }}>
                      Sé el primero en dejar un mensaje
                    </p>
                    <p className="text-[1.05rem] text-white opacity-60" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
                      Escanea el código QR de la siguiente pantalla y comparte un recuerdo con la familia.
                    </p>
                  </div>
                ) : (
                  <div className="w-full grid grid-cols-3 gap-5">
                    {visibleMessages.map((msg, idx) => {
                      // Foto adjunta (futura): si subio una imagen, la mostramos como avatar.
                      // Si no, mostramos un avatar circular con su inicial.
                      const photoUrl = getFileUrl(msg.file1_url);
                      const initial = (msg.sender_name || '?').trim().charAt(0).toUpperCase();
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "rounded-2xl p-5 flex gap-4 transition-all duration-700",
                            showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                          )}
                          style={{
                            background: 'rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(14px)',
                            border: '1px solid rgba(255,255,255,0.22)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                            transitionDelay: `${200 + idx * 80}ms`,
                            minHeight: '210px'
                          }}
                        >
                          {/* Avatar / espacio reservado para foto adjunta del visitante */}
                          <div className="flex-shrink-0">
                            <div
                              className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center"
                              style={{
                                background: photoUrl ? 'transparent' : 'rgba(240,192,64,0.85)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2), 0 0 0 2px rgba(255,255,255,0.25)',
                                color: '#1a4a48'
                              }}
                            >
                              {photoUrl ? (
                                <img src={photoUrl} alt={msg.sender_name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xl font-bold" style={{ fontFamily: 'Spectral, serif' }}>
                                  {initial}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Texto */}
                          <div className="flex-1 min-w-0 flex flex-col">
                            <p
                              className="text-white text-[0.95rem] font-semibold truncate"
                              style={{ fontFamily: 'Spectral, serif' }}
                              title={msg.sender_name}
                            >
                              {msg.sender_name}
                            </p>
                            <p
                              className="text-white opacity-85 text-[0.92rem] leading-[1.55] mt-2 overflow-hidden"
                              style={{
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 300,
                                display: '-webkit-box',
                                WebkitLineClamp: 6,
                                WebkitBoxOrient: 'vertical'
                              }}
                            >
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Indicador de pagina (cuando hay mas de una pagina) */}
              {messages.length > MESSAGES_PER_PAGE && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === messagesPage ? '24px' : '8px',
                        height: '8px',
                        background: i === messagesPage ? '#f0c040' : 'rgba(255,255,255,0.35)'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {currentScreen === 0 && (
          // SCREEN 1 - Informacion del servicio (PRIMERA pantalla del slider)
          // Layout: foto grande a la izquierda, contenido centrado a la derecha,
          // grid 2x2 compacto de eventos.
          <div className="w-full flex min-h-screen">
              {/* Columna izquierda: foto grande del difunto */}
              <div className="w-[42%] flex items-center justify-center px-12 py-16 relative">
                {/* Anillos decorativos detras de la foto */}
                <div className="absolute w-[460px] h-[460px] rounded-full opacity-15" style={{ background: 'rgba(255,255,255,0.25)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></div>
                <div className="absolute w-[380px] h-[380px] rounded-full opacity-10" style={{ background: 'rgba(255,255,255,0.3)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></div>

                <div className={cn(
                  "relative z-10 transition-all duration-700 delay-200",
                  showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}>
                  <div
                    className="w-[340px] h-[420px] rounded-[40%_40%_50%_50%/30%_30%_50%_50%] overflow-hidden"
                    style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 6px rgba(255,255,255,0.2)' }}
                  >
                    <img
                      src={memorialData?.photo}
                      alt={`Fotografía de ${memorialData?.name}`}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              </div>

              {/* Columna derecha: nombre centrado + fechas + mensaje + grid 2x2 */}
              <div className="w-[58%] flex flex-col justify-center pl-4 pr-16 py-16">
                {/* Nombre grande */}
                <div className={cn(
                  "text-center transition-all duration-700 delay-100",
                  showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}>
                  <h2
                    className="text-[4rem] font-bold text-white leading-none"
                    style={{ fontFamily: 'Spectral, serif', textShadow: '0 4px 20px rgba(0,0,0,0.18)' }}
                  >
                    {memorialData?.name}
                  </h2>
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <div className="h-[1px] w-16 bg-white opacity-50"></div>
                    <p
                      className="text-[1.4rem] text-white opacity-85"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}
                    >
                      {memorialData?.birthYear} — {memorialData?.deathYear}
                    </p>
                    <div className="h-[1px] w-16 bg-white opacity-50"></div>
                  </div>
                </div>

                {/* Mensaje introductorio centrado */}
                <div className={cn(
                  "text-center mt-7 mb-8 transition-all duration-700 delay-300",
                  showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}>
                  <p
                    className="text-[1.3rem] leading-[1.7] text-white opacity-90"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}
                  >
                    Hoy nos reunimos para honrar una vida inolvidable.
                    <br />
                    Conmemorando cada recuerdo como el más sincero homenaje de amor.
                  </p>
                </div>

                {/* Grid 2x2 compacto de eventos */}
                <div className="grid grid-cols-2 gap-4">
                  <ServiceEventCard
                    label="Ingreso"
                    icon="arrow-down"
                    placeName={memorialData?.roomName}
                    datetime={memorialData?.viewingStart}
                    delay={400}
                    visible={showElements}
                  />
                  <ServiceEventCard
                    label="Salida"
                    icon="arrow-up"
                    placeName={memorialData?.roomName}
                    datetime={memorialData?.viewingEnd}
                    delay={500}
                    visible={showElements}
                  />
                  <ServiceEventCard
                    label="Exequias"
                    icon="church"
                    placeName={memorialData?.exequiasVenue || 'Por confirmar'}
                    datetime={memorialData?.exequiasDatetime}
                    delay={600}
                    visible={showElements}
                    accentMissing={!memorialData?.exequiasVenue}
                  />
                  <ServiceEventCard
                    label="Destino Final"
                    icon="flame"
                    placeName={memorialData?.finalDestinationVenue || 'Por confirmar'}
                    datetime={memorialData?.finalDestinationDatetime}
                    delay={700}
                    visible={showElements}
                    accentMissing={!memorialData?.finalDestinationVenue}
                  />
                </div>
              </div>
            </div>
          )}

          {currentScreen === 3 && (
          // SCREEN 4 - QR Code
          <div className="w-full flex min-h-screen">
              {/* Left column - QR */}
              <div className="w-[45%] flex flex-col items-center justify-center px-12 py-16 relative">
                <div className="absolute w-[440px] h-[440px] rounded-full opacity-10" style={{ background: 'rgba(255,255,255,0.3)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></div>

                <div className={cn(
                "relative z-10 transition-all duration-700 delay-200",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}>
                  {/* QR Container */}
                  <div className="w-[340px] h-[340px] rounded-3xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 0 0 6px rgba(255,255,255,0.2)' }}>
                    <QRCodeSVG
                    value={memorialData?.qrUrl}
                    size={290}
                    level="H"
                    includeMargin={false}
                    fgColor="#1a7472" />
                  
                  </div>
                  {/* Badge */}
                  <div className="absolute -top-5 -right-5 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#f0c040', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                    <svg className="w-8 h-8" style={{ color: '#1a7472' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                <div className={cn(
                "relative z-10 text-center mt-8 transition-all duration-700 delay-400",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}>
                  <p className="text-[1.2rem] font-medium text-white opacity-80" style={{ fontFamily: 'Spectral, serif' }}>
                    Escanea el código QR
                  </p>
                </div>
              </div>
              {/* Right column - CTA text */}
              <div className="w-[55%] flex flex-col justify-center px-16 py-16">
                <div className={cn(
                "transition-all duration-700 delay-100",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}>
                  <p className="text-[1.4rem] font-light text-white opacity-80 mb-1" style={{ fontFamily: 'Spectral, serif' }}>
                    En memoria de
                  </p>
                  <h2 className="text-[4rem] font-bold text-white leading-none mb-2" style={{ fontFamily: 'Spectral, serif', textShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                    {memorialData?.name?.split(' ')?.[0]}
                  </h2>
                  <p className="text-[1.5rem] font-light text-white opacity-90 mb-10" style={{ fontFamily: 'Spectral, serif' }}>
                    estamos a su lado
                  </p>
                </div>

                <div className="w-16 h-1 rounded-full mb-10" style={{ background: 'rgba(255,255,255,0.5)' }}></div>

                <div className={cn(
                "transition-all duration-700 delay-500",
                showElements ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}>
                  <p className="text-[1.5rem] leading-[1.85] text-white opacity-90 font-semibold mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Hazte presente dejando un mensaje
                  </p>
                  <p className="text-[1.3rem] leading-[1.85] text-white opacity-75" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
                    que proviene desde todo el amor que hay al recordar con el corazón
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer bar */}
        <div className="absolute bottom-0 left-0 right-0 py-4 px-10 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)' }}>
          <p className="text-white opacity-70 text-[0.9rem]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Salas habilitadas de <span className="font-semibold opacity-100">08:00 a.m</span> a <span className="font-semibold opacity-100">11:00 p.m</span>
          </p>
          <div className="text-center">
            <p className="text-white font-bold text-[0.95rem] tracking-wider" style={{ fontFamily: 'Spectral, serif' }}>
              FUNERARIA LOS OLIVOS
            </p>
            <p className="text-white opacity-60 text-[0.8rem]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Un homenaje al amor · SERCOFUN LTDA
            </p>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_SCREENS }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === currentScreen ? '18px' : '8px',
                  height: '8px',
                  background: i === currentScreen ? '#f0c040' : 'rgba(255,255,255,0.4)'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>);

};

// ===== Helpers de presentacion =====

// Formatea fechas tipo "Sábado 23 de Mayo de 2026 · 2:00 PM"
const SPANISH_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const SPANISH_MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const formatServiceDateTime = (iso) => {
  if (!iso) return { date: 'Por confirmar', time: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: 'Por confirmar', time: '' };
  const date = `${SPANISH_DAYS[d.getDay()]} ${d.getDate()} de ${SPANISH_MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
  let hour = d.getHours();
  const minute = d.getMinutes().toString().padStart(2, '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  const time = `${hour}:${minute} ${ampm}`;
  return { date, time };
};

// Card pequena para Ingreso / Salida / Exequias / Destino Final
const ServiceEventCard = ({ label, icon, placeName, datetime, delay = 0, visible, accentMissing = false }) => {
  const { date, time } = formatServiceDateTime(datetime);

  // Iconos simples como SVG inline para mantener consistencia con el resto del componente.
  const icons = {
    'arrow-down': (
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    ),
    'arrow-up': (
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    ),
    'church': (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 0l-4 2v3m4-5l4 2v3M4 20V11l8-3 8 3v9M9 20v-5h6v5" />
    ),
    'flame': (
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.23.1-.47.04-.66-.12a.583.583 0 01-.14-.17c-1.13-1.43-1.31-3.48-.55-5.12C5.78 10 4.87 12.3 5 14.47c.06.5.12 1 .29 1.5.14.6.41 1.2.71 1.73 1.08 1.73 2.95 2.97 4.96 3.22 2.14.27 4.43-.12 6.07-1.6 1.83-1.66 2.47-4.32 1.53-6.62l-.13-.26c-.21-.46-.77-1.24-.77-1.24m-3.16 6.3c-.28.24-.74.5-1.1.6-1.12.4-2.24-.16-2.9-.82 1.19-.28 1.9-1.16 2.11-2.05.17-.8-.15-1.46-.28-2.23-.12-.74-.1-1.37.17-2.06.19.38.39.76.63 1.06.77 1 1.98 1.44 2.24 2.8.04.14.06.28.06.43.03.82-.33 1.72-.93 2.27z" />
    )
  };

  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3 flex items-start gap-3 transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{
        // Mas opaco: el texto se lee mejor sobre el fondo verde.
        background: 'rgba(15, 74, 72, 0.55)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 8px 22px rgba(0,0,0,0.20)',
        transitionDelay: `${delay}ms`
      }}
    >
      {/* Punto de color (mas compacto que el icono circular) */}
      <div
        className="flex-shrink-0 mt-1 w-2.5 h-2.5 rounded-full"
        style={{
          background: '#f0c040',
          boxShadow: '0 0 0 3px rgba(240,192,64,0.25)'
        }}
      />

      {/* Texto: etiqueta, lugar, fecha */}
      <div className="flex-1 min-w-0">
        <p
          className="text-white opacity-75 text-[0.8rem] uppercase tracking-wider"
          style={{ fontFamily: 'Spectral, serif', letterSpacing: '0.1em' }}
        >
          {label}
        </p>
        <p
          className={cn(
            "text-white font-bold text-[1.3rem] leading-tight mt-1 truncate",
            accentMissing ? 'opacity-65 italic font-medium' : ''
          )}
          style={{ fontFamily: 'Spectral, serif' }}
          title={placeName}
        >
          {placeName || 'Por confirmar'}
        </p>
        {date !== 'Por confirmar' && (
          <p
            className="text-white opacity-85 text-[1rem] mt-1.5"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}
          >
            {date}{time ? ` · ${time}` : ''}
          </p>
        )}
      </div>
    </div>
  );
};

export default DigitalDisplayScreen;