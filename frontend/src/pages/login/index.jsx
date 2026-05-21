import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(credentials.username, credentials.password);
      if (response.success) {
        window.location.href = '/executive-overview';
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  return (
    <>
      <Helmet>
        <title>Login - SERCOFUN Homenajes</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a9490 0%, #155f5d 100%)' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a9490 0%, #155f5d 100%)' }}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">SERCOFUN</h1>
            <p className="text-sm text-gray-500 mt-1">Sistema de Homenajes Digitales</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario o Email
              </label>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contrasena
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white font-medium rounded-lg transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #1a9490 0%, #155f5d 100%)' }}
            >
              {loading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400 tracking-wider">
              DESARROLLADO PARA SERCOFUN POR IPTEGRA SAS &copy; 2026
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
