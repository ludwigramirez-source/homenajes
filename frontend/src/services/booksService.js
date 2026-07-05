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

  // Envio manual / reenvio de un homenaje puntual
  send: (memorialId) => api.post(`/books/${memorialId}/send`).then(r => r.data),

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
