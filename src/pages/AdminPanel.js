import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import MinerManagement from '../components/MinerManagement';
import PoolConfiguration from '../components/PoolConfiguration';
import UserManagement from '../components/UserManagement';
import ProfitabilitySettings from '../components/ProfitabilitySettings';
import PoolArbitrage from '../components/PoolArbitrage';
import Backup from '../components/Backup';
import NewsManagement from '../components/NewsManagement';
import ContentManagement from '../components/ContentManagement';
import ContactRequestsManagement from '../components/ContactRequestsManagement';
import WithdrawalRequestsManagement from '../components/WithdrawalRequestsManagement';
import BalanceManagement from '../components/BalanceManagement';
import SiteSettingsContent from '../components/SiteSettingsContent'; // Importar el nuevo componente

const AdminPanel = () => {
  const location = useLocation();
  const [unreadContactRequests, setUnreadContactRequests] = useState(0);
  const [unreadWithdrawalRequests, setUnreadWithdrawalRequests] = useState(0);
  const [unreadMinersCount, setUnreadMinersCount] = useState(0); // Nuevo estado para notificaciones de mineros

  const handleUnreadContactRequestsChange = (count) => {
    setUnreadContactRequests(count);
  };

  const handleUnreadWithdrawalRequestsChange = (count) => {
    setUnreadWithdrawalRequests(count);
  };

  const handleNewMinerNotification = (count) => {
    setUnreadMinersCount(prevCount => {
      const newCount = prevCount + count;
      console.log("AdminPanel: handleNewMinerNotification llamado. Nuevos mineros:", count, "Total no leídos:", newCount);
      return newCount;
    });
  };

  const handleClearMinerNotification = () => {
    console.log("AdminPanel: Limpiando notificación de mineros.");
    setUnreadMinersCount(0);
  };

  console.log("AdminPanel: Renderizando. unreadMinersCount:", unreadMinersCount);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar de Navegación */}
      <aside className="w-64 bg-gray-800 p-2 shadow-lg">
        <div className="text-xl font-bold text-yellow-500 mb-6">Admin Dashboard (Actualizado)</div> {/* Título actualizado */}
        <nav>
          <ul>
            <li className="mb-0.5">
              <Link 
                to="/admin/miners" 
                className={`flex items-center py-1.5 rounded-lg text-sm font-medium ${
                  location.pathname === '/admin/miners' ? 'bg-yellow-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
                onClick={handleClearMinerNotification} // Limpiar notificación al hacer clic
              >
                Gestión de Mineros
                {unreadMinersCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {unreadMinersCount}
                  </span>
                )}
              </Link>
            </li>
            <li className="mb-0.5">
              <Link 
                to="/admin/pool-config" 
                className={`flex items-center py-1.5 rounded-lg text-sm font-medium ${
                  location.pathname === '/admin/pool-config' ? 'bg-yellow-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Configuración del Pool
              </Link>
            </li>
            <li className="mb-0.5">
              <Link 
                to="/admin/users" 
                className={`flex items-center py-1.5 rounded-lg text-sm font-medium ${
                  location.pathname === '/admin/users' ? 'bg-yellow-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Gestión de Usuarios
              </Link>
            </li>
            <li className="mb-0.5">
              <Link 
                to="/admin/profitability-settings" 
                className={`flex items-center py-1.5 rounded-lg text-sm font-medium ${
                  location.pathname === '/admin/profitability-settings' ? 'bg-yellow-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Configuración de Rentabilidad
              </Link>
            </li>
            <li className="mb-0.5">
              <Link 
                to="/admin/pool-arbitrage" 
                className={`flex items-center py-1.5 rounded-lg text-sm font-medium ${
                  location.pathname === '/admin/pool-arbitrage' ? 'bg-yellow-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Arbitraje de Pools
              </Link>
            </li>
            <li className="mb-0.5">
              <Link 
                to="/admin/backup" 
                className={`flex items-center py-1.5 rounded-lg text-sm font-medium ${
                  location.pathname === '/admin/backup' ? 'bg-yellow-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Respaldo de Datos
              </Link>
            </li>
            <li className="mb-0.5">
              <Link 
                to="/admin/news" 
                className={`flex items-center py-1.5 rounded-lg text-sm font-medium ${
                  location.pathname === '/admin/news' ? 'bg-yellow-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Gestión de Noticias
              </Link>
            </li>
            <li className="mb-0.5">
              <Link 
                to="/admin/content" 
                className={`flex items-center py-1.5 rounded-lg text-sm font-medium ${
                  location.pathname === '/admin/content' ? 'bg-yellow-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Gestión de Contenido
              </Link>
            </li>
            <li className="mb-0.5">
              <Link 
                to="/admin/contact-requests" 
                className={`flex items-center py-1.5 rounded-lg text-sm font-medium ${
                  location.pathname === '/admin/contact-requests' ? 'bg-yellow-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Solicitudes de Contacto
                {unreadContactRequests > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {unreadContactRequests}
                  </span>
                )}
              </Link>
            </li>
            <li className="mb-0.5"> {/* Nuevo enlace para Solicitudes de Pago */}
              <Link 
                to="/admin/withdrawal-requests" 
                className={`flex items-center py-1.5 rounded-lg text-sm font-medium ${
                  location.pathname === '/admin/withdrawal-requests' ? 'bg-yellow-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Solicitudes de Pago
                {unreadWithdrawalRequests > 0 && ( // Añadir notificación numérica
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {unreadWithdrawalRequests}
                  </span>
                )}
              </Link>
            </li>
            <li className="mb-0.5"> {/* Nuevo enlace para Gestión de Balance */}
              <Link 
                to="/admin/balance-management" 
                className={`flex items-center py-1.5 rounded-lg text-sm font-medium ${
                  location.pathname === '/admin/balance-management' ? 'bg-yellow-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Gestión de Balance
              </Link>
            </li>
            <li className="mb-0.5"> {/* Nuevo enlace para Configuración del Sitio */}
              <Link 
                to="/admin/site-settings" 
                className={`flex items-center py-1.5 rounded-lg text-sm font-medium ${
                  location.pathname === '/admin/site-settings' ? 'bg-yellow-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Configuración del Sitio
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-4xl font-bold mb-8">Panel de Administración</h1>
        <Routes>
          <Route 
            path="miners" 
            element={<MinerManagement onNewMinerAdded={handleNewMinerNotification} />} 
          />
          <Route path="pool-config" element={<PoolConfiguration />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="profitability-settings" element={<ProfitabilitySettings />} />
          <Route path="pool-arbitrage" element={<PoolArbitrage />} />
          <Route path="backup" element={<Backup />} />
          <Route path="news" element={<NewsManagement />} />
          <Route path="content" element={<ContentManagement />} />
          <Route 
            path="contact-requests" 
            element={<ContactRequestsManagement onUnreadCountChange={handleUnreadContactRequestsChange} />} 
          />
          <Route 
            path="withdrawal-requests" 
            element={<WithdrawalRequestsManagement onUnreadCountChange={handleUnreadWithdrawalRequestsChange} />} 
          />
          <Route path="balance-management" element={<BalanceManagement />} />
          <Route path="site-settings" element={<SiteSettingsContent />} /> {/* Nueva ruta para Configuración del Sitio */}
          {/* Ruta por defecto o dashboard overview */}
          <Route path="/" element={
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Bienvenido al Panel de Administración</h2>
              <p className="text-gray-300">Selecciona una opción del menú lateral para empezar a administrar el sitio.</p>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default AdminPanel;
