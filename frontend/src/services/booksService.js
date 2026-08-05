import api from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============ BOOKS (envio y control de reenvio del PDF de condolencias) ============
export const booksService = {
  // Configuracion SMTP (solo admin)
  getSettings: () => api.get('/books/settings').then(r => r.data),
  // smtp_password es opcional: si se omite o va vacio, el backend conserva la guardada.
  updateSettings: (payload) => api.put('/books/settings', payload).then(r => r.data),
  testSettings: (to_email) => api.post('/books/settings/test', { to_email }).then(r => r.data),

  // Listado de envios (con scoping de sede por rol, igual que condolences)
  getAll: (params = {}) => api.get('/books', { params }).then(r => r.data),

  // Envio manual / reenvio de un homenaje puntual. payload opcional:
  // { recipient_emails: string[], subject, message } - ver modal de envio.
  send: (memorialId, payload = {}) => api.post(`/books/${memorialId}/send`, payload).then(r => r.data),

  // Historial completo de intentos de envio de un homenaje.
  history: (memorialId) => api.get(`/books/${memorialId}/history`).then(r => r.data),

  // Vista previa del book de un homenaje: genera el PDF al vuelo (sin
  // guardarlo ni enviar correo) y lo abre en una pestaña nueva usando un
  // blob autenticado (un <a href> directo no podria mandar el Bearer token).
  // El propio visor de PDF del navegador permite descargarlo si hace falta.
  //
  // window.open() se llama ANTES del await/fetch, sincrono con el click: los
  // navegadores solo permiten abrir pestañas sin bloquearlas como popup si el
  // open() ocurre en la misma tarea del gesto del usuario. Se abre una
  // pestaña en blanco de inmediato y se le asigna la URL del PDF cuando
  // termina el fetch autenticado.
  preview: async (memorialId, filename) => {
    const newTab = window.open('', '_blank');

    let response;
    try {
      const token = localStorage.getItem('sercofun_token');
      response = await fetch(`${API_URL}/api/books/${memorialId}/preview`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (err) {
      if (newTab) newTab.close();
      throw err;
    }

    if (!response.ok) {
      if (newTab) newTab.close();
      let error = 'No se pudo generar el book';
      try {
        const data = await response.json();
        error = data?.error || error;
      } catch {
        // La respuesta no era JSON; se conserva el mensaje generico.
      }
      throw new Error(error);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    if (newTab) {
      newTab.location.href = url;
    } else {
      // Bloqueado igual (algunos navegadores bloquean hasta el open() vacio): descarga directa.
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `libro-condolencias-${memorialId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    // Revocar despues de un momento: la pestaña nueva ya tiene el PDF
    // cargado en memoria; revocar de inmediato lo rompe mientras aun carga.
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  },

  // Descarga autenticada del PDF ya generado: hace fetch con el mismo Bearer token
  // que usa el resto de la app, arma un blob y dispara la descarga en el navegador.
  download: async (id, filename) => {
    const token = localStorage.getItem('sercofun_token');
    const response = await fetch(`${API_URL}/api/books/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!response.ok) {
      let error = 'No se pudo descargar el PDF';
      try {
        const data = await response.json();
        error = data?.error || error;
      } catch {
        // La respuesta no era JSON (p. ej. 404 sin body util); se conserva el mensaje generico.
      }
      throw new Error(error);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `libro-condolencias-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
};

export default booksService;
