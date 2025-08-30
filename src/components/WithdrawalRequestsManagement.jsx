import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase'; // Importar la instancia de Firebase Firestore
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';

const WithdrawalRequestsManagement = ({ onUnreadCountChange }) => { // Aceptar prop
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');


  useEffect(() => {
    const q = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(), // Convertir Timestamp a Date
        }));
        setWithdrawalRequests(requests);

        const pendingRequestsCount = requests.filter(req => req.status === 'Pendiente').length;
        if (onUnreadCountChange) {
          onUnreadCountChange(pendingRequestsCount);
        }
      } catch (fetchError) {
        console.error("Error fetching withdrawal requests from Firebase:", fetchError);
        setError('Error al cargar las solicitudes de retiro.');
        if (onUnreadCountChange) {
          onUnreadCountChange(0);
        }
      }
    }, (error) => {
      console.error("Error subscribing to withdrawal requests:", error);
      setError('Error al suscribirse a las solicitudes de retiro.');
    });

    return () => {
      unsubscribe();
    };
  }, [onUnreadCountChange]);

  const handleUpdateStatus = async (request, newStatus) => {
    setMessage('');
    setError('');
    try {
      const withdrawalRef = doc(db, 'withdrawals', request.id);
      await updateDoc(withdrawalRef, { status: newStatus });

      if (newStatus === 'Completado') {
        const userRef = doc(db, 'users', request.userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setError(`Error: No se pudo obtener el balance del usuario ${request.userId}.`);
          return;
        }

        const userData = userSnap.data();
        const balanceKey = `balance${request.currency}`;
        const currentBalance = userData[balanceKey] || 0;
        const newBalance = currentBalance - request.amount;

        await updateDoc(userRef, {
          [balanceKey]: newBalance >= 0 ? newBalance : 0,
        });

        setMessage(`Estado de la solicitud ${request.id} actualizado a ${newStatus} y balance del usuario reducido.`);
      } else {
        setMessage(`Estado de la solicitud ${request.id} actualizado a ${newStatus}.`);
      }
    } catch (err) {
      console.error("Error updating withdrawal status or user balance:", err);
      setError(`Fallo al actualizar el estado o el balance: ${err.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Completado': return 'bg-green-100 text-green-800';
      case 'Rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Gestión de Solicitudes de Retiro</h2>
      {message && <div className="bg-green-100 text-green-800 p-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>}

      {withdrawalRequests.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No hay solicitudes de retiro pendientes.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario (Email)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moneda</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección/ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {withdrawalRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.userEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.amount.toFixed(8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.addressOrId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {request.status === 'Pendiente' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(request, 'Completado')}
                          className="text-green-600 hover:text-green-800 mr-3"
                        >
                          Completar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(request, 'Rechazado')}
                          className="text-red-600 hover:text-red-800"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WithdrawalRequestsManagement;
