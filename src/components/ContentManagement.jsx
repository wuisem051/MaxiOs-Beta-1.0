import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { doc, getDocs, setDoc, query, collection, where } from 'firebase/firestore';
const ContentManagement = () => {
  const [aboutContent, setAboutContent] = useState('');
  const [termsContent, setTermsContent] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const q = query(collection(db, 'settings'), where('key', '==', 'content'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const record = querySnapshot.docs[0].data();
          setAboutContent(record.about || '');
          setTermsContent(record.terms || '');
          setPrivacyContent(record.privacy || '');
        }
      } catch (err) {
        console.error("Error fetching content from Firebase:", err);
        setError('Error al cargar el contenido.');
      }
    };
    fetchContent();
  }, []);

  const handleSaveContent = async () => {
    setMessage('');
    setError('');
    try {
      const contentData = {
        key: 'content',
        about: aboutContent,
        terms: termsContent,
        privacy: privacyContent,
        updatedAt: new Date(),
      };

      const q = query(collection(db, 'settings'), where('key', '==', 'content'));
      const querySnapshot = await getDocs(q);
      let docId;

      if (!querySnapshot.empty) {
        docId = querySnapshot.docs[0].id;
      } else {
        // Si no existe, Firebase creará un ID automáticamente con setDoc si no se especifica
        // Para mantener la consistencia, podemos usar un ID fijo o dejar que Firebase lo genere.
        // Aquí, asumimos que 'content' es un documento único y podemos usar un ID fijo si lo deseamos,
        // o simplemente dejar que setDoc lo cree si no existe.
        // Para este caso, buscaremos el documento y si no existe, lo crearemos con un ID específico 'content_settings'
        // o simplemente lo actualizaremos si ya existe.
        // Usaremos 'content_settings' como ID fijo para el documento de configuración de contenido.
        docId = 'content_settings'; 
      }
      
      await setDoc(doc(db, 'settings', docId), contentData, { merge: true });
      setMessage('Contenido guardado exitosamente.');
    } catch (err) {
      console.error("Error saving content to Firebase:", err);
      setError(`Error al guardar el contenido: ${err.message}`);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Gestión de Contenido</h1>
      {message && <div className="bg-green-500 text-white p-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>}

      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Gestión de Contenido</h2>
        
        <div className="mb-6">
          <label htmlFor="aboutContent" className="block text-gray-300 text-sm font-medium mb-1">Sección "Acerca de"</label>
          <textarea
            id="aboutContent"
            rows="6"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-yellow-500"
            value={aboutContent}
            onChange={(e) => setAboutContent(e.target.value)}
            placeholder="Escribe aquí el contenido de la sección 'Acerca de'..."
          ></textarea>
        </div>

        <div className="mb-6">
          <label htmlFor="termsContent" className="block text-gray-300 text-sm font-medium mb-1">Términos y Condiciones</label>
          <textarea
            id="termsContent"
            rows="6"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-yellow-500"
            value={termsContent}
            onChange={(e) => setTermsContent(e.target.value)}
            placeholder="Términos y condiciones del servicio..."
          ></textarea>
        </div>

        <div className="mb-6">
          <label htmlFor="privacyContent" className="block text-gray-300 text-sm font-medium mb-1">Política de Privacidad</label>
          <textarea
            id="privacyContent"
            rows="6"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-yellow-500"
            value={privacyContent}
            onChange={(e) => setPrivacyContent(e.target.value)}
            placeholder="Política de privacidad..."
          ></textarea>
        </div>

        <button
          onClick={handleSaveContent}
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md w-full"
        >
          Guardar Contenido
        </button>
      </div>
    </div>
  );
};

export default ContentManagement;
