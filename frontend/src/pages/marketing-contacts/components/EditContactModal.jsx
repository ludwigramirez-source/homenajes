import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { condolencesService } from '../../../services/api';
import { cn } from '../../../utils/cn';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Editar los datos de contacto de una condolencia (util para corregir un
// correo/telefono mal escrito) y su consentimiento de marketing. Desmarcar
// el consentimiento es la forma segura de "excluir" a alguien de futuras
// campañas sin borrar su mensaje de condolencia.
const EditContactModal = ({ contact, onClose, onSaved }) => {
  const [name, setName] = useState(contact?.sender_name || '');
  const [email, setEmail] = useState(contact?.sender_email || '');
  const [phone, setPhone] = useState(contact?.sender_phone || '');
  const [consent, setConsent] = useState(!!contact?.marketing_consent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) { setError('El nombre es obligatorio'); return; }
    if (!EMAIL_RE.test(email.trim())) { setError('El correo no parece válido'); return; }
    try {
      setSaving(true);
      const res = await condolencesService.updateContact(contact.id, {
        sender_name: name.trim(),
        sender_email: email.trim(),
        sender_phone: phone.trim() || null,
        marketing_consent: consent
      });
      onSaved?.(res?.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Error guardando los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => !saving && onClose()} />
      <div className="relative bg-card rounded-lg border border-border shadow-elevation-md w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Editar contacto</h3>
            <p className="text-sm text-muted-foreground">
              {contact?.deceased_name ? `Mensaje para ${contact.deceased_name}` : 'Datos del contacto'}
            </p>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Teléfono</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Opcional"
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-sm text-foreground">
              Autoriza el uso de sus datos para marketing
              <span className="block text-xs text-muted-foreground mt-0.5">
                Desmarcar excluye este contacto de la lista y de las próximas exportaciones, sin borrar su mensaje.
              </span>
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
              <Icon name="AlertCircle" size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <button
            onClick={() => !saving && onClose()}
            disabled={saving}
            className="px-4 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors text-foreground disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-60",
              "bg-primary hover:bg-primary/90"
            )}
          >
            <Icon name={saving ? 'Loader' : 'Check'} size={15} className={saving ? 'animate-spin' : ''} />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditContactModal;
