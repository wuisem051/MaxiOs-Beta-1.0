import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup'; // Importar Signup
import UserPanel from './pages/UserPanel';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin'; // Importar AdminLogin
import ProtectedRoute from './ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './AuthContext';
import './App.css';
import { db } from './firebase/firebase'; // Importar db desde firebase.js
import { doc, getDoc } from 'firebase/firestore';

function App() {
  // Efecto para cargar el favicon dinámicamente
  React.useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'siteConfig');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Actualizar favicon
          if (data.faviconUrl) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = data.faviconUrl;
          }
          // Actualizar título del documento
          if (data.siteName) {
            document.title = data.siteName;
          }
        }
      } catch (err) {
        console.error("Error fetching site settings for App component from Firebase:", err);
      }
    };
    fetchSiteSettings();
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="flex flex-col min-h-screen bg-light_bg text-dark_text">
        <Header />
        <main className="flex-grow">
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              {/* Ruta temporal para acceso de prueba a la configuración del usuario */}
              <Route 
                path="/test-user-settings/*" 
                element={
                  <ProtectedRoute>
                    <UserPanel />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/user/*" 
                element={
                  <ProtectedRoute>
                    <UserPanel />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/admin/*"
                element={<AdminPanel />}
              />
              <Route path="/admin-login" element={<AdminLogin />} /> {/* Nueva ruta para el login de administrador */}
            </Routes>
          </AuthProvider>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
