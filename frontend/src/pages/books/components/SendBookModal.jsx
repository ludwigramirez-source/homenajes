import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { booksService } from '../../../services/booksService';
import { cn } from '../../../utils/cn';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mismo texto por defecto que backend/src/services/book.service.js#defaultEmailMessage,
// para que lo que ve el staff al abrir el modal coincida con lo que se enviaria
// si no tocan nada.
const defaultMessage = (name) =>
  `Estimada familia,\n\nAdjuntamos el libro de condolencias con los mensajes de cariño y apoyo recibidos durante el homenaje de ${name || ''}.\n\nCon nuestro más sentido acompañamiento,\nLos Olivos · SERCOFUN`;

// Modal de envio manual del book. Permite editar asunto/mensaje del correo y
// agregar destinatarios ademas del correo de titular guardado en el homenaje
// (util cuando el titular no tiene correo cargado, o cuando hay que copiar a
// alguien mas de la familia).
const SendBookModal = ({ tribute, onClose, onSent }) => {
  const [primaryEmail, setPrimaryEmail] = useState(tribute?.family_contact_email || '');
  const [extraEmails, setExtraEmails] = useState([]);
  const [extraInput, setExtraInput] = useState('');
  const [subject, setSubject] = useState(`Libro de condolencias — ${tribute?.deceased_name || ''}`);
  const [message, setMessage] = useState(defaultMessage(tribute?.deceased_name));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const addExtraEmail = () => {
    const value = extraInput.trim().replace(/,$/, '');
    if (!value) return;
    if (!EMAIL_RE.test(value)) {
      setError(`"${value}" no parece un correo válido`);
      return;
    }
    if (value === primaryEmail || extraEmails.includes(value)) {
      setExtraInput('');
      return;
    }
    setExtraEmails((prev) => [...prev, value]);
    setExtraInput('');
    setError(null);
  };

  const removeExtraEmail = (email) => {
    setExtraEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleExtraKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addExtraEmail();
    }
  };

  const recipients = [primaryEmail.trim(), ...extraEmails].filter(Boolean);

  const handleSend = async () => {
    setError(null);
    if (primaryEmail.trim() && !EMAIL_RE.test(primaryEmail.trim())) {
      setError('El correo del titular no parece válido');
      return;
    }
    if (recipients.length === 0) {
      setError('Indica al menos un correo destinatario');
      return;
    }
    try {
      setSending(true);
      const res = await booksService.send(tribute.memorial_id, {
        recipient_emails: recipients,
        subject: subject.trim(),
        message: message.trim()
      });
      onSent?.(res);
    } catch (e) {
      setError(e.response?.data?.error || 'Error enviando el book');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => !sending && onClose()} />
      <div className="relative bg-card rounded-lg border border-border shadow-elevation-md w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Enviar libro de condolencias</h3>
            <p className="text-sm text-muted-foreground">{tribute?.deceased_name}</p>
          </div>
          <button
            onClick={() => !sending && onClose()}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {!tribute?.family_contact_email && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <Icon name="AlertTriangle" size={16} className="flex-shrink-0 mt-0.5" />
              Este homenaje no tiene correo de titular guardado. Indica al menos un destinatario abajo.
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Correo del titular
            </label>
            <input
              type="email"
              value={primaryEmail}
              onChange={(e) => setPrimaryEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Correos adicionales
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={extraInput}
                onChange={(e) => setExtraInput(e.target.value)}
                onKeyDown={handleExtraKeyDown}
                placeholder="otro-correo@ejemplo.com y Enter"
                className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={addExtraEmail}
                className="px-3 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors text-foreground"
              >
                Agregar
              </button>
            </div>
            {extraEmails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {extraEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs"
                  >
                    {email}
                    <button onClick={() => removeExtraEmail(email)} className="hover:text-destructive">
                      <Icon name="X" size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Asunto</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Mensaje</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={7}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
              <Icon name="AlertCircle" size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <button
            onClick={() => !sending && onClose()}
            disabled={sending}
            className="px-4 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors text-foreground disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-60",
              "bg-primary hover:bg-primary/90"
            )}
          >
            <Icon name={sending ? 'Loader' : 'Send'} size={15} className={sending ? 'animate-spin' : ''} />
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendBookModal;
