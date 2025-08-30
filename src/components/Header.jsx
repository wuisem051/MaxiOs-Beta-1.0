import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db } from '../firebase/firebase'; // Importar Firebase Firestore
import { doc, getDoc } from 'firebase/firestore';
const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Obtener la ubicación actual
  const [isOpen, setIsOpen] = useState(false); // Estado para el menú móvil
  const [siteName, setSiteName] = useState('BitcoinPool'); // Estado para el nombre del sitio

  useEffect(() => {
    const fetchSiteName = async () => {
      try {
        const docRef = doc(db, 'settings', 'siteConfig');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSiteName(data.siteName || 'BitcoinPool');
        } else {
          setSiteName('BitcoinPool');
        }
      } catch (err) {
        console.error("Error fetching site name for Header from Firebase:", err);
        setSiteName('BitcoinPool'); // Fallback en caso de error
      }
    };
    fetchSiteName();
  }, []);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch {
      console.error("Fallo al cerrar sesión");
    }
  }

  return (
    <header className="bg-light_card shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y botón de modo dev */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 text-dark_text text-xl font-bold mr-4">
              <span className="text-accent">{siteName.charAt(0)}</span>{siteName.substring(1)}
            </Link>
            <Link 
              to="/admin-login" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                location.pathname === '/admin-login' ? 'bg-blue_link text-white' : 'text-blue_link hover:bg-gray_border hover:text-dark_text'
              }`}
            >
              Iniciar Modo Dev
            </Link>
          </div>

          {/* Navegación principal (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1"> {/* Reducir espacio entre elementos */}
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                location.pathname === '/' && location.hash === '' ? 'bg-accent text-white' : 'text-gray_text hover:bg-gray_border hover:text-dark_text'
              }`}
            >
              Estadísticas
            </Link>
            {currentUser ? (
              <>
                <Link 
                  to="/user/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    location.pathname.startsWith('/user') ? 'bg-accent text-white' : 'text-gray_text hover:bg-gray_border hover:text-dark_text'
                  }`}
                >
                  Panel de Usuario
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray_text hover:bg-gray_border hover:text-dark_text transition-colors duration-200"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/signup" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    location.pathname === '/signup' ? 'bg-accent text-white' : 'text-gray_text hover:bg-gray_border hover:text-dark_text'
                  }`}
                >
                  Registrarse
                </Link>
                <Link 
                  to="/login" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    location.pathname === '/login' ? 'bg-accent text-white' : 'text-gray_text hover:bg-gray_border hover:text-dark_text'
                  }`}
                >
                  Iniciar Sesión
                </Link>
              </>
            )}
          </nav>

          {/* Botón de menú móvil */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray_text hover:text-dark_text hover:bg-gray_border focus:outline-none focus:ring-2 focus:ring-inset focus:ring-dark_text"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menú principal</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                location.pathname === '/' && location.hash === '' ? 'bg-accent text-white' : 'text-gray_text hover:bg-gray_border hover:text-dark_text'
              }`}
            >
              Estadísticas
            </Link>
            {currentUser ? (
              <>
                <Link 
                  to="/user/dashboard" 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    location.pathname.startsWith('/user') ? 'bg-accent text-white' : 'text-gray_text hover:bg-gray_border hover:text-dark_text'
                  }`}
                >
                  Panel de Usuario
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="block px-3 py-2 rounded-md text-base font-medium w-full text-left text-gray_text hover:bg-gray_border hover:text-dark_text transition-colors duration-200"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/signup" 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    location.pathname === '/signup' ? 'bg-accent text-white' : 'text-gray_text hover:bg-gray_border hover:text-dark_text'
                  }`}
                >
                  Registrarse
                </Link>
                <Link 
                  to="/login" 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    location.pathname === '/login' ? 'bg-accent text-white' : 'text-gray_text hover:bg-gray_border hover:text-dark_text'
                  }`}
                >
                  Iniciar Sesión
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
