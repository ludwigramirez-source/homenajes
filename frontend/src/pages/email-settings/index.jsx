import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { booksService } from '../../services/booksService';
import Icon from '../../components/AppIcon';
import { cn } from '../../utils/cn';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Presets de proveedor: autocompletan host/puerto/seguridad para que un
// administrador sin conocimientos tecnicos no tenga que saber que es SMTP.
// "locked" = host/puerto/seguro se autocompletan y no se pueden editar a mano;
// para 'other' (SMTP personalizado) todo queda editable.
const PROVIDER_PRESETS = [
  {
    id: 'gmail',
    label: 'Gmail / Google Workspace',
    icon: 'Mail',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_secure: false,
    locked: true,
    userLabel: 'Correo de Gmail',
    userPlaceholder: 'nombre@gmail.com',
    passwordLabel: 'Contraseña de aplicación',
    passwordPlaceholder: 'Código de 16 caracteres',
    passwordHelp: 'No es tu contraseña normal de Gmail: Google exige una "contraseña de aplicación" generada especialmente para esto.',
    helpLink: 'https://myaccount.google.com/apppasswords',
    helpLinkLabel: 'Abrir contraseñas de aplicación de Google',
    instructions: [
      'Entra a myaccount.google.com/security con la cuenta de Gmail que vas a usar para enviar los correos.',
      'Activa "Verificación en 2 pasos" si todavía no la tienes (Google la exige para el siguiente paso).',
      'Busca "Contraseñas de aplicaciones", crea una nueva y ponle un nombre como "SERCOFUN Homenajes".',
      'Copia el código de 16 caracteres que te muestra Google y pégalo aquí abajo en "Contraseña de aplicación" (no hace falta quitar los espacios, lo hacemos automáticamente).'
    ]
  },
  {
    id: 'outlook',
    label: 'Outlook / Microsoft 365',
    icon: 'Mail',
    smtp_host: 'smtp.office365.com',
    smtp_port: 587,
    smtp_secure: false,
    locked: true,
    userLabel: 'Correo de Outlook / Microsoft 365',
    userPlaceholder: 'nombre@tudominio.com',
    passwordLabel: 'Contraseña de aplicación',
    passwordPlaceholder: 'Contraseña de aplicación',
    passwordHelp: 'Si la cuenta tiene verificación en 2 pasos, Microsoft también exige una "contraseña de aplicación" en vez de la contraseña normal.',
    helpLink: 'https://account.microsoft.com/security',
    helpLinkLabel: 'Abrir seguridad de la cuenta Microsoft',
    instructions: [
      'Entra a account.microsoft.com/security con la cuenta que vas a usar para enviar los correos.',
      'Si tiene verificación en 2 pasos activada, busca "Opciones de seguridad avanzadas" → "Contraseñas de aplicación" y crea una nueva.',
      'Si es una cuenta de Microsoft 365 empresarial, puede que un administrador deba habilitar "SMTP autenticado" para ese buzón desde el centro de administración de Exchange.',
      'Copia la contraseña generada y pégala aquí abajo en "Contraseña de aplicación".'
    ]
  },
  {
    id: 'sendgrid',
    label: 'SendGrid (transaccional)',
    icon: 'Send',
    smtp_host: 'smtp.sendgrid.net',
    smtp_port: 587,
    smtp_secure: false,
    locked: true,
    lockUser: true,
    fixedUser: 'apikey',
    userLabel: 'Usuario SMTP',
    passwordLabel: 'API Key de SendGrid',
    passwordPlaceholder: 'SG.xxxxxxxxxxxxxxxx',
    passwordHelp: 'Genera una API Key con permiso "Mail Send" desde tu cuenta de SendGrid; esa clave va aquí como contraseña.',
    helpLink: 'https://app.sendgrid.com/settings/api_keys',
    helpLinkLabel: 'Abrir API Keys de SendGrid',
    instructions: [
      'Crea una cuenta en sendgrid.com (tiene un plan gratuito para bajo volumen de envíos).',
      'Ve a Settings → API Keys → Create API Key, con permiso de "Mail Send".',
      'El usuario SMTP siempre es la palabra apikey (ya viene puesto, no lo cambies).',
      'Copia la API Key generada y pégala aquí abajo en "API Key de SendGrid".'
    ]
  },
  {
    id: 'other',
    label: 'Otro servidor SMTP',
    icon: 'Server',
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: false,
    locked: false,
    userLabel: 'Usuario SMTP',
    userPlaceholder: 'usuario@tudominio.com',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Contraseña',
    passwordHelp: '',
    helpLink: null,
    instructions: [
      'Solicita a tu proveedor de correo o de hosting los datos de conexión SMTP: servidor (host), puerto, y si requiere conexión segura (SSL/TLS).',
      'Completa esos datos manualmente en los campos de abajo.'
    ]
  }
];

const detectProvider = (host) => {
  const h = (host || '').trim().toLowerCase();
  if (!h) return 'gmail';
  const match = PROVIDER_PRESETS.find(p => p.locked && p.smtp_host === h);
  return match ? match.id : 'other';
};

const emptySettingsForm = {
  smtp_host: '',
  smtp_port: 587,
  smtp_secure: false,
  smtp_user: '',
  smtp_password: '',
  from_name: '',
  from_email: '',
  send_delay_days: 1
};

const EmailSettingsPage = () => {
  return (
    <>
      <Helmet><title>Configuración de correo | SERCOFUN</title></Helmet>
      <div className="min-h-screen bg-background">
        {/* Header teal */}
        <div className="relative overflow-hidden sticky top-0 z-40"
          style={{ background: 'linear-gradient(135deg, #1a7472 0%, #234b50 60%, #182e39 100%)' }}>
          <div className="max-w-[1920px] mx-auto px-6 py-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Icon name="Mail" size={20} color="#ffffff" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Configuración de correo</h1>
                <p className="text-xs text-white/70 font-body">Cuenta SMTP para el envío automático del libro de condolencias</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-6 py-6 space-y-6">
          <SmtpSettingsPanel />
        </div>
      </div>
    </>
  );
};

// Panel de configuracion SMTP. La ruta que la aloja ya esta restringida a admin
// (ver Routes.jsx: /configuracion-correo con ProtectedRoute roles={['admin']}).
const SmtpSettingsPanel = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [providerId, setProviderId] = useState('gmail');
  const [showHelp, setShowHelp] = useState(true);

  const [form, setForm] = useState(emptySettingsForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwordWarning, setPasswordWarning] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);

  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok: bool, message: string }

  const preset = useMemo(() => PROVIDER_PRESETS.find(p => p.id === providerId) || PROVIDER_PRESETS[0], [providerId]);

  const load = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await booksService.getSettings();
      const data = res?.data || {};
      setSettings(data);
      setForm({
        smtp_host: data.smtp_host || '',
        smtp_port: data.smtp_port ?? 587,
        smtp_secure: !!data.smtp_secure,
        smtp_user: data.smtp_user || '',
        smtp_password: '',
        from_name: data.from_name || '',
        from_email: data.from_email || '',
        send_delay_days: data.send_delay_days ?? 1
      });
      setProviderId(detectProvider(data.smtp_host));
    } catch (e) {
      setLoadError(e.response?.data?.error || 'Error cargando la configuración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleField = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setFieldErrors(errs => ({ ...errs, [field]: undefined }));
  };

  const handleProviderChange = (id) => {
    setProviderId(id);
    setShowHelp(true);
    const next = PROVIDER_PRESETS.find(p => p.id === id);
    setForm(f => ({
      ...f,
      smtp_host: next.locked ? next.smtp_host : f.smtp_host,
      smtp_port: next.locked ? next.smtp_port : f.smtp_port,
      smtp_secure: next.locked ? next.smtp_secure : f.smtp_secure,
      smtp_user: next.lockUser ? next.fixedUser : f.smtp_user
    }));
    setFieldErrors({});
    setPasswordWarning(null);
  };

  const validate = () => {
    const errors = {};
    if (!form.smtp_host.trim()) errors.smtp_host = 'El servidor SMTP es obligatorio.';
    if (!form.smtp_user.trim()) errors.smtp_user = 'El usuario SMTP es obligatorio.';
    if (preset.lockUser && form.smtp_user.trim() !== preset.fixedUser) {
      errors.smtp_user = `Para ${preset.label}, el usuario SMTP debe ser exactamente "${preset.fixedUser}".`;
    }
    if (form.from_email.trim() && !EMAIL_RE.test(form.from_email.trim())) {
      errors.from_email = 'Ese correo no parece válido.';
    }
    return errors;
  };

  const handleSave = async () => {
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const cleanPassword = form.smtp_password.replace(/\s+/g, '');
    setPasswordWarning(null);
    if (providerId === 'gmail' && cleanPassword && cleanPassword.length !== 16) {
      setPasswordWarning('Las contraseñas de aplicación de Google normalmente tienen 16 caracteres. Verifica que la copiaste completa.');
    }

    try {
      setSaving(true);
      setSaveError(null);
      setSaved(false);
      const payload = {
        smtp_host: form.smtp_host.trim(),
        smtp_port: Number(form.smtp_port) || 0,
        smtp_secure: !!form.smtp_secure,
        smtp_user: form.smtp_user.trim(),
        from_name: form.from_name.trim(),
        from_email: form.from_email.trim(),
        send_delay_days: Number(form.send_delay_days) || 0
      };
      if (cleanPassword) payload.smtp_password = cleanPassword;

      const res = await booksService.updateSettings(payload);
      const data = res?.data || {};
      setSettings(data);
      setForm(f => ({ ...f, smtp_password: '' }));
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setSaveError(e.response?.data?.error || 'Error guardando la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail.trim()) return;
    try {
      setTesting(true);
      setTestResult(null);
      const res = await booksService.testSettings(testEmail.trim());
      if (res.success) {
        setTestResult({ ok: true, message: `Correo de prueba enviado a ${testEmail.trim()}.` });
      } else {
        setTestResult({ ok: false, message: res.error || 'No se pudo enviar el correo de prueba' });
      }
    } catch (e) {
      setTestResult({ ok: false, message: e.response?.data?.error || 'Error enviando el correo de prueba' });
    } finally {
      setTesting(false);
    }
  };

  const fromMismatchesGmailUser = providerId === 'gmail'
    && form.from_email.trim()
    && form.smtp_user.trim()
    && form.from_email.trim().toLowerCase() !== form.smtp_user.trim().toLowerCase();

  return (
    <div className="bg-card rounded-lg border border-border shadow-elevation-md p-6 space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Configuración de correo (SMTP)</h3>
        <p className="text-sm text-muted-foreground">
          Se usa para enviar el libro de condolencias en PDF al correo de la familia tras finalizar cada homenaje.
        </p>
      </div>

      {loadError && (
        <div className="text-destructive text-sm flex items-center gap-2">
          <Icon name="AlertCircle" size={16} /> {loadError}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">
          <Icon name="Loader" size={24} className="animate-spin mx-auto mb-2" /> Cargando configuración...
        </div>
      ) : (
        <div className="space-y-5 max-w-2xl">
          {settings && (
            <div className={cn(
              "flex items-center gap-2.5 p-3 rounded-md text-sm border",
              settings.configured
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            )}>
              <Icon name={settings.configured ? 'CheckCircle2' : 'AlertTriangle'} size={16} className="flex-shrink-0" />
              {settings.configured
                ? 'El envío de correo está configurado y listo para usarse.'
                : 'Falta completar la configuración (servidor, usuario o contraseña) para poder enviar correos.'}
            </div>
          )}

          {/* Selector de proveedor */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">¿Qué cuenta de correo vas a usar?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PROVIDER_PRESETS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderChange(p.id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 text-center transition-colors',
                    providerId === p.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  )}
                >
                  <Icon name={p.icon} size={18} className={providerId === p.id ? 'text-primary' : 'text-muted-foreground'} />
                  <span className={cn('text-xs font-medium leading-tight', providerId === p.id ? 'text-primary' : 'text-foreground')}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Instrucciones por proveedor */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHelp(v => !v)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <Icon name="Lightbulb" size={15} className="text-amber-600 flex-shrink-0" />
                {preset.id === 'sendgrid' ? '¿Cómo obtengo la API Key?' : '¿Cómo obtengo la contraseña de aplicación?'}
              </span>
              <Icon name={showHelp ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground flex-shrink-0" />
            </button>
            {showHelp && (
              <div className="px-4 py-3 space-y-2 text-sm text-muted-foreground bg-background">
                <ol className="list-decimal list-inside space-y-1.5">
                  {preset.instructions.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
                {preset.helpLink && (
                  <a
                    href={preset.helpLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm font-medium pt-1"
                  >
                    <Icon name="ExternalLink" size={14} />
                    {preset.helpLinkLabel}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Host / Puerto (autocompletados o manuales segun el proveedor) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Servidor SMTP</label>
              <input
                type="text"
                value={form.smtp_host}
                onChange={(e) => handleField('smtp_host', e.target.value)}
                placeholder="smtp.tudominio.com"
                disabled={preset.locked}
                className={cn(
                  "w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
                  preset.locked && "bg-muted/40 text-muted-foreground cursor-not-allowed"
                )}
              />
              {fieldErrors.smtp_host && <p className="text-destructive text-xs mt-1">{fieldErrors.smtp_host}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Puerto</label>
              <input
                type="number"
                value={form.smtp_port}
                onChange={(e) => handleField('smtp_port', e.target.value)}
                placeholder="587"
                disabled={preset.locked}
                className={cn(
                  "w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
                  preset.locked && "bg-muted/40 text-muted-foreground cursor-not-allowed"
                )}
              />
            </div>
          </div>
          {preset.locked && (
            <p className="text-xs text-muted-foreground -mt-3">
              Estos datos se completan automáticamente para {preset.label}.
            </p>
          )}

          <label className={cn("flex items-center gap-3 select-none", preset.locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer")}>
            <button
              type="button"
              role="switch"
              aria-checked={form.smtp_secure}
              disabled={preset.locked}
              onClick={() => handleField('smtp_secure', !form.smtp_secure)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0',
                form.smtp_secure ? 'bg-primary' : 'bg-muted-foreground/30'
              )}
            >
              <span className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                form.smtp_secure ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
            <span className="text-sm font-medium text-foreground">Conexión segura (SSL/TLS)</span>
          </label>

          {/* Usuario / contraseña (etiquetas segun el proveedor) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{preset.userLabel}</label>
              <input
                type="text"
                value={form.smtp_user}
                onChange={(e) => handleField('smtp_user', e.target.value)}
                placeholder={preset.userPlaceholder || ''}
                autoComplete="off"
                disabled={!!preset.lockUser}
                className={cn(
                  "w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
                  preset.lockUser && "bg-muted/40 text-muted-foreground cursor-not-allowed"
                )}
              />
              {fieldErrors.smtp_user && <p className="text-destructive text-xs mt-1">{fieldErrors.smtp_user}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{preset.passwordLabel}</label>
              <input
                type="password"
                value={form.smtp_password}
                onChange={(e) => handleField('smtp_password', e.target.value)}
                placeholder={settings?.has_password ? 'Dejar en blanco para no cambiar' : preset.passwordPlaceholder}
                autoComplete="new-password"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {preset.passwordHelp && (
                <p className="text-xs text-muted-foreground mt-1.5">{preset.passwordHelp}</p>
              )}
              {passwordWarning && (
                <p className="text-amber-700 text-xs mt-1.5 flex items-center gap-1.5">
                  <Icon name="AlertTriangle" size={13} className="flex-shrink-0" /> {passwordWarning}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nombre del remitente</label>
              <input
                type="text"
                value={form.from_name}
                onChange={(e) => handleField('from_name', e.target.value)}
                placeholder="Sercofun Homenajes"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Correo del remitente</label>
              <input
                type="email"
                value={form.from_email}
                onChange={(e) => handleField('from_email', e.target.value)}
                placeholder="notificaciones@sercofun.com"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {fieldErrors.from_email && <p className="text-destructive text-xs mt-1">{fieldErrors.from_email}</p>}
              {!fieldErrors.from_email && fromMismatchesGmailUser && (
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                  <Icon name="Info" size={13} className="flex-shrink-0" />
                  Gmail normalmente exige que el correo del remitente coincida con la cuenta autenticada, salvo que tengas un alias de envío configurado.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Días de espera para el envío automático</label>
            <input
              type="number"
              min="0"
              value={form.send_delay_days}
              onChange={(e) => handleField('send_delay_days', e.target.value)}
              className="w-full sm:w-40 px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Días después de finalizar el homenaje en que se enviará automáticamente el libro de condolencias.
            </p>
          </div>

          {saveError && (
            <p className="text-destructive text-sm flex items-center gap-2">
              <Icon name="AlertCircle" size={15} /> {saveError}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white transition-colors disabled:opacity-60"
              style={{ background: '#1a7472' }}
            >
              <Icon name={saving ? 'Loader' : 'Save'} size={15} className={saving ? 'animate-spin' : ''} color="#ffffff" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                <Icon name="CheckCircle2" size={16} /> Configuración guardada
              </span>
            )}
          </div>

          {/* Correo de prueba */}
          <div className="pt-4 mt-4 border-t border-border space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Enviar correo de prueba</h4>
            <p className="text-xs text-muted-foreground">
              Usa la configuración ya guardada (guarda los cambios primero) para enviar un correo de prueba.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="flex-1 min-w-[220px] px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !testEmail.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors text-foreground disabled:opacity-60"
              >
                <Icon name={testing ? 'Loader' : 'Send'} size={15} className={testing ? 'animate-spin' : ''} />
                {testing ? 'Enviando...' : 'Enviar correo de prueba'}
              </button>
            </div>
            {testResult && (
              <p className={cn(
                "text-sm flex items-center gap-2",
                testResult.ok ? "text-green-700" : "text-destructive"
              )}>
                <Icon name={testResult.ok ? 'CheckCircle2' : 'AlertCircle'} size={15} />
                {testResult.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSettingsPage;
