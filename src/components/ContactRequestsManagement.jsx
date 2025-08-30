import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
const ContactRequestsManagement = ({ onUnreadCountChange }) => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminReply, setAdminReply] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'contactRequests'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("ContactRequestsManagement: Firebase suscripción - Evento recibido.");
      const fetchedRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(), // Convertir Timestamp a Date
        updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate() : doc.data().createdAt.toDate(), // Convertir Timestamp a Date
      }));
      setRequests(fetchedRequests);

      const unreadCount = fetchedRequests.filter(req => req.status === 'Abierto' || req.status === 'Pendiente').length;
      if (onUnreadCountChange) {
        onUnreadCountChange(unreadCount);
      }

      if (selectedRequest) {
        const updatedSelected = fetchedRequests.find(req => req.id === selectedRequest.id);
        setSelectedRequest(updatedSelected || null);
      }
    }, (error) => {
      console.error("Error fetching contact requests from Firebase:", error);
    });

    return () => {
      unsubscribe(); // Desuscribirse de los cambios de Firebase
    };
  }, [selectedRequest, onUnreadCountChange]);

  const handleSelectRequest = (request) => {
    setSelectedRequest(request);
    setAdminReply(''); // Limpiar la respuesta al seleccionar una nueva solicitud
  };

  const handleSendReply = async () => {
    if (!adminReply.trim() || !selectedRequest) return;

    try {
      const newConversation = [...selectedRequest.conversation, {
        sender: 'admin',
        text: adminReply,
        timestamp: new Date().toISOString(),
      }];
      const requestRef = doc(db, 'contactRequests', selectedRequest.id);
      await updateDoc(requestRef, {
        conversation: newConversation,
        status: 'Respondido',
        updatedAt: new Date(), // Usar un objeto Date para Firebase Timestamp
      });
      setAdminReply('');
    } catch (error) {
      console.error("Error al enviar respuesta:", error);
    }
  };

  const handleCloseRequest = async () => {
    if (!selectedRequest) return;
    try {
      const requestRef = doc(db, 'contactRequests', selectedRequest.id);
      await updateDoc(requestRef, {
        status: 'Cerrado',
        updatedAt: new Date(), // Usar un objeto Date para Firebase Timestamp
      });
    } catch (error) {
      console.error("Error al cerrar solicitud:", error);
    }
  };

  return (
    <div className="flex h-full bg-gray-100 text-gray-900">
      {/* Lista de Solicitudes */}
      <div className="w-1/3 bg-white p-4 border-r border-gray-200 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Solicitudes de Contacto</h2>
        {requests.length === 0 ? (
          <p className="text-gray-600">No hay solicitudes de contacto.</p>
        ) : (
          <ul>
            {requests.map(req => (
              <li
                key={req.id}
                className={`p-3 mb-2 rounded-lg cursor-pointer ${
                  selectedRequest && selectedRequest.id === req.id ? 'bg-yellow-200' : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => handleSelectRequest(req)}
              >
                <p className="font-semibold text-gray-800">{req.subject}</p>
                <p className="text-sm text-gray-600 truncate">{req.conversation[req.conversation.length - 1]?.text}</p>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-gray-500">{req.userEmail}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xxs font-semibold ${
                    req.status === 'Abierto' ? 'bg-blue-100 text-blue-800' :
                    req.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    req.status === 'Respondido' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Detalles de la Solicitud y Conversación */}
      <div className="flex-1 p-4 overflow-y-auto">
        {selectedRequest ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{selectedRequest.subject}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                selectedRequest.status === 'Abierto' ? 'bg-blue-100 text-blue-800' :
                selectedRequest.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                selectedRequest.status === 'Respondido' ? 'bg-purple-100 text-purple-800' :
                'bg-green-100 text-green-800'
              }`}>
                {selectedRequest.status}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-2">De: {selectedRequest.userEmail} - Fecha: {selectedRequest.createdAt.toLocaleDateString()}</p>

            {/* Historial de Conversación */}
            <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-4 h-64 overflow-y-auto">
              {selectedRequest.conversation.map((msg, index) => (
                <div key={index} className={`mb-3 ${msg.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block p-2 rounded-lg text-sm ${
                    msg.sender === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {msg.text}
                  </span>
                  <p className="text-xxs text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Área de Respuesta del Administrador */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Responder</h3>
              <textarea
                rows="3"
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:border-yellow-500 mb-3"
                placeholder="Escribe tu respuesta aquí..."
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
              ></textarea>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleSendReply}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md"
                >
                  Enviar Respuesta
                </button>
                <button
                  onClick={handleCloseRequest}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md"
                >
                  Cerrar Solicitud
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-lg">
            Selecciona una solicitud para ver los detalles.
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactRequestsManagement;
