import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { booksService } from '../../services/booksService';
import Icon from '../../components/AppIcon';
import { cn } from '../../utils/cn';

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

  const [form, setForm] = useState(emptySettingsForm);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);

  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok: bool, message: string }

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
    } catch (e) {
      setLoadError(e.response?.data?.error || 'Error cargando la configuración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
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
      if (form.smtp_password.trim()) payload.smtp_password = form.smtp_password.trim();

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
        <div className="space-y-4 max-w-2xl">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Servidor SMTP</label>
              <input
                type="text"
                value={form.smtp_host}
                onChange={(e) => handleField('smtp_host', e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Puerto</label>
              <input
                type="number"
                value={form.smtp_port}
                onChange={(e) => handleField('smtp_port', e.target.value)}
                placeholder="587"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={form.smtp_secure}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Usuario SMTP</label>
              <input
                type="text"
                value={form.smtp_user}
                onChange={(e) => handleField('smtp_user', e.target.value)}
                placeholder="notificaciones@sercofun.com"
                autoComplete="off"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Contraseña</label>
              <input
                type="password"
                value={form.smtp_password}
                onChange={(e) => handleField('smtp_password', e.target.value)}
                placeholder={settings?.has_password ? 'Dejar en blanco para no cambiar' : 'Contraseña o app password'}
                autoComplete="new-password"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
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
