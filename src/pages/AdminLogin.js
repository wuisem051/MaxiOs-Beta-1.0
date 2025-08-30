import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await loginAdmin(email, password);
      navigate('/admin'); // Redirigir al panel de administrador
    } catch (err) {
      setError('Fallo al iniciar sesión como administrador: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Iniciar Sesión como Administrador</h2>
        {error && <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              id="email"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-yellow-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              id="password"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-yellow-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión Admin'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
