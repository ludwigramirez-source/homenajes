import React, { useMemo, useState } from 'react';
import Icon from '../../../components/AppIcon';
import { condolencesService, getFileUrl } from '../../../services/api';
import { cn } from '../../../utils/cn';

const formatDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// Escape para CSV: si tiene comas, comillas o saltos de linea, encerrar en comillas y duplicar comillas.
const csvEscape = (val) => {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const MessagesTab = ({ memorial, condolences, onChange }) => {
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Filtrado en cliente por nombre del autor, email o contenido del mensaje
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return condolences;
    return condolences.filter(c =>
      (c.sender_name || '').toLowerCase().includes(q) ||
      (c.sender_email || '').toLowerCase().includes(q) ||
      (c.message || '').toLowerCase().includes(q)
    );
  }, [condolences, query]);

  const handleDelete = async (c) => {
    const ok = window.confirm(`¿Eliminar el mensaje de ${c.sender_name}? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      setDeletingId(c.id);
      await condolencesService.remove(c.id);
      await onChange?.();
    } catch (e) {
      alert('Error eliminando mensaje: ' + (e.response?.data?.error || e.message));
    } finally {
      setDeletingId(null);
    }
  };

  const exportCsv = () => {
    if (!filtered.length) {
      alert('No hay mensajes para exportar');
      return;
    }
    const headers = ['Fecha', 'Nombre', 'Email', 'Teléfono', 'Mensaje', 'Foto 1', 'Foto 2'];
    const rows = filtered.map(c => [
      formatDateTime(c.created_at),
      c.sender_name || '',
      c.sender_email || '',
      c.sender_phone || '',
      c.message || '',
      c.file1_url ? (window.location.origin + (getFileUrl(c.file1_url) || '').replace(window.location.origin, '')) : '',
      c.file2_url ? (window.location.origin + (getFileUrl(c.file2_url) || '').replace(window.location.origin, '')) : ''
    ]);

    // Prefijar con BOM para que Excel detecte UTF-8 con tildes correctamente.
    const csv = '﻿' + [headers, ...rows]
      .map(row => row.map(csvEscape).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (memorial?.deceased_name || 'homenaje')
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
    link.download = `mensajes_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Mensajes recibidos</h3>
          <p className="text-sm text-muted-foreground">
            {condolences.length} {condolences.length === 1 ? 'mensaje en total' : 'mensajes en total'}
            {query && filtered.length !== condolences.length && ` · ${filtered.length} coinciden`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Buscador */}
          <div className="relative">
            <Icon
              name="Search"
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, email o contenido..."
              className="pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm w-72
                focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title="Limpiar"
              >
                <Icon name="X" size={14} />
              </button>
            )}
          </div>

          <button
            onClick={exportCsv}
            disabled={!filtered.length}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-border transition-colors",
              filtered.length
                ? "hover:bg-muted text-foreground"
                : "opacity-50 cursor-not-allowed text-muted-foreground"
            )}
            title="Exportar a CSV"
          >
            <Icon name="Download" size={14} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Estado vacio */}
      {condolences.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-lg p-16 text-center">
          <Icon name="Inbox" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-foreground font-medium">Aún no hay mensajes</p>
          <p className="text-sm text-muted-foreground mt-1">
            Los mensajes que dejen los familiares y amigos a través del formulario aparecerán aquí.
          </p>
        </div>
      )}

      {condolences.length > 0 && filtered.length === 0 && (
        <div className="border border-border rounded-lg p-10 text-center text-muted-foreground text-sm">
          No hay mensajes que coincidan con "{query}".
        </div>
      )}

      {/* Lista de mensajes */}
      <div className="space-y-3">
        {filtered.map(c => {
          const initial = (c.sender_name || '?').trim().charAt(0).toUpperCase();
          const photo1 = c.file1_url ? getFileUrl(c.file1_url) : null;
          const photo2 = c.file2_url ? getFileUrl(c.file2_url) : null;
          const isDeleting = deletingId === c.id;

          return (
            <article
              key={c.id}
              className={cn(
                "border border-border rounded-lg p-5 transition-all",
                isDeleting ? "opacity-50" : "hover:border-primary/30 hover:bg-muted/10"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Avatar con inicial (o foto adjunta si existe) */}
                <div className="flex-shrink-0">
                  {photo1 ? (
                    <img
                      src={photo1}
                      alt={c.sender_name}
                      className="w-12 h-12 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{ background: 'rgba(240,192,64,0.85)', color: '#1a4a48' }}
                    >
                      {initial}
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-foreground">{c.sender_name}</h4>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-muted-foreground">
                        {c.sender_email && (
                          <span className="inline-flex items-center gap-1">
                            <Icon name="Mail" size={12} />
                            <a href={`mailto:${c.sender_email}`} className="hover:text-primary truncate max-w-[200px]">
                              {c.sender_email}
                            </a>
                          </span>
                        )}
                        {c.sender_phone && (
                          <span className="inline-flex items-center gap-1">
                            <Icon name="Phone" size={12} />
                            <a href={`tel:${c.sender_phone}`} className="hover:text-primary">
                              {c.sender_phone}
                            </a>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Icon name="Clock" size={12} />
                          {formatDateTime(c.created_at)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(c)}
                      disabled={isDeleting}
                      className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      title="Eliminar mensaje"
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>

                  {/* Mensaje */}
                  <p className="mt-3 text-foreground leading-relaxed whitespace-pre-wrap">
                    {c.message}
                  </p>

                  {/* Foto 2 si existe (la foto 1 ya esta en el avatar) */}
                  {photo2 && (
                    <div className="mt-3">
                      <a href={photo2} target="_blank" rel="noopener noreferrer" className="inline-block">
                        <img
                          src={photo2}
                          alt="Adjunto"
                          className="max-h-40 rounded-md border border-border"
                        />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default MessagesTab;
