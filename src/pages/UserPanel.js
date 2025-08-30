import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link, Routes, Route, useLocation, useMatch, useResolvedPath } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { countMinersByUser } from '../utils/miners';
import { db, auth } from '../firebase/firebase'; // Importar db y auth desde firebase.js
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, setDoc, addDoc, deleteDoc, getDocs, orderBy } from 'firebase/firestore';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import UserPoolArbitrage from '../components/UserPoolArbitrage'; // Importar UserPoolArbitrage

// Componentes de las sub-secciones
const DashboardContent = ({ userMiners, chartData, userBalances, paymentRate, btcToUsdRate, totalHashratePool, poolCommission, paymentsHistory, withdrawalsHistory }) => {
  const totalHashrate = userMiners.reduce((sum, miner) => sum + (miner.currentHashrate || 0), 0);
  const estimatedDailyUSD = totalHashrate * paymentRate;
  const estimatedDailyBTC = btcToUsdRate > 0 ? estimatedDailyUSD / btcToUsdRate : 0;
  const userPercentageOfPool = totalHashratePool > 0 ? (totalHashrate / totalHashratePool) * 100 : 0;

  // Obtener el último pago o retiro
  const lastPayment = paymentsHistory.length > 0 ? paymentsHistory[0] : null;
  const lastWithdrawal = withdrawalsHistory.length > 0 ? withdrawalsHistory[0] : null;

  let lastTransactionInfo = "No hay historial";
  if (lastPayment && lastWithdrawal) {
    if (lastPayment.createdAt > lastWithdrawal.createdAt) {
      lastTransactionInfo = `Pago: ${lastPayment.amount.toFixed(8)} ${lastPayment.currency} (${lastPayment.createdAt.toLocaleDateString()})`;
    } else {
      lastTransactionInfo = `Retiro: ${lastWithdrawal.amount.toFixed(8)} ${lastWithdrawal.currency} (${lastWithdrawal.createdAt.toLocaleDateString()})`;
    }
  } else if (lastPayment) {
    lastTransactionInfo = `Pago: ${lastPayment.amount.toFixed(8)} ${lastPayment.currency} (${lastPayment.createdAt.toLocaleDateString()})`;
  } else if (lastWithdrawal) {
    lastTransactionInfo = `Retiro: ${lastWithdrawal.amount.toFixed(8)} ${lastWithdrawal.currency} (${lastWithdrawal.createdAt.toLocaleDateString()})`;
  }

  return (
    <div className="p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {/* Tu Hashrate */}
        <div className="bg-light_card p-2 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray_border">
          <h3 className="text-sm text-gray_text mb-1">Tu Hashrate</h3>
          <p className="text-2xl font-bold text-blue_link">{totalHashrate.toFixed(2)} TH/s</p>
          <div className="w-10 h-10 rounded-full bg-blue-100 mt-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue_link" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
        </div>
        {/* Ganancia Estimada Diaria */}
        <div className="bg-light_card p-2 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray_border">
          <h3 className="text-sm text-gray_text mb-1">Ganancia Estimada Diaria</h3>
          <p className="text-2xl font-bold text-green_check">${estimatedDailyUSD.toFixed(2)}</p>
          <div className="w-10 h-10 rounded-full bg-green-100 mt-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green_check" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V3a1 1 0 00-1-1H4a1 1 0 00-1 1v18a1 1 0 001 1h12a1 1 0 001-1v-5m-1-10v4m-4 0h4"/></svg>
          </div>
        </div>
        {/* Tasa de Pago */}
        <div className="bg-light_card p-2 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray_border">
          <h3 className="text-sm text-gray_text mb-1">Tasa de Pago</h3>
          <p className="text-2xl font-bold text-accent">${paymentRate.toFixed(2)}/TH/s</p>
          <div className="w-10 h-10 rounded-full bg-yellow-100 mt-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </div>
        </div>
        {/* Balances */}
        <div className="bg-light_card p-2 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray_border">
          <h3 className="text-sm text-gray_text mb-1">Balances</h3>
          <p className="text-xl font-bold text-purple-500">${(userBalances.balanceUSD || 0).toFixed(2)} USD</p>
          <p className="text-sm text-gray_text">{(userBalances.balanceBTC || 0).toFixed(8)} BTC</p>
          <p className="text-sm text-gray_text">{(userBalances.balanceLTC || 0).toFixed(8)} LTC</p>
          <p className="text-sm text-gray_text">{(userBalances.balanceDOGE || 0).toFixed(8)} DOGE</p>
          <div className="w-10 h-10 rounded-full bg-purple-100 mt-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Rendimiento Histórico */}
        <div className="bg-light_card p-2 rounded-lg shadow-md border border-gray_border">
          <h3 className="text-base font-semibold text-dark_text mb-2">Rendimiento Histórico</h3>
          <div className="h-48">
            {userMiners.length > 0 ? (
              <Bar data={chartData} options={{ maintainAspectRatio: false }} />
            ) : (
              <p className="text-gray_text text-center py-6 text-xs">No hay datos de rendimiento disponibles.</p>
            )}
          </div>
        </div>

        {/* Estadísticas de la Pool */}
        <div className="bg-light_card p-2 rounded-lg shadow-md border border-gray_border">
          <h3 className="text-base font-semibold text-dark_text mb-2">Estadísticas de la Pool</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-gray_text">
              <span>Comisión de la Pool:</span>
              <span className="font-semibold text-red_error">{poolCommission.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-gray_text">
              <span>Última Transacción:</span>
              <span className="font-semibold text-green_check">{lastTransactionInfo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MiningInfoContent = ({ currentUser, userMiners, setUserMiners }) => {
  const [poolUrl, setPoolUrl] = useState('stratum+tcp://bitcoinpool.com:4444');
  const [port, setPort] = useState('4444');
  const [defaultWorkerName, setDefaultWorkerName] = useState('worker1');
  const miningPassword = 'x';
  const [newMinerThs, setNewMinerThs] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    const fetchPoolConfigAndMiners = async () => {
      setError('');
      setMessage('');
      try {
        // Cargar configuración del Pool desde Firebase
        const poolConfigRef = doc(db, 'settings', 'poolConfig');
        const poolConfigSnap = await getDoc(poolConfigRef);
        if (poolConfigSnap.exists()) {
          const poolConfigData = poolConfigSnap.data();
          setPoolUrl(poolConfigData.url || 'stratum+tcp://bitcoinpool.com:4444');
          setPort(poolConfigData.port || '4444');
          setDefaultWorkerName(poolConfigData.defaultWorkerName || 'worker1');
        }

        // Escuchar cambios en los mineros del usuario
        if (currentUser && currentUser.uid) {
          const q = query(collection(db, 'miners'), where('userId', '==', currentUser.uid));
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMiners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUserMiners(fetchedMiners);
          }, (err) => {
            console.error("Error fetching mining info from Firebase:", err);
            setError('Fallo al cargar la información de minería.');
          });

          return () => {
            unsubscribe();
          };
        } else {
          setUserMiners([]);
        }
      } catch (err) {
        console.error("Error fetching mining info:", err);
        setError('Fallo al cargar la información de minería.');
      }
    };
    fetchPoolConfigAndMiners();
  }, [currentUser, setUserMiners]);

  const handleAddMiner = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!currentUser || !currentUser.uid) {
      setError('Debes iniciar sesión para añadir un minero.');
      return;
    }
    if (isNaN(parseFloat(newMinerThs)) || parseFloat(newMinerThs) <= 0) {
      setError('Por favor, introduce una cantidad válida de TH/s.');
      return;
    }

    try {
      const newMinerRef = await addDoc(collection(db, 'miners'), {
        userId: currentUser.uid,
        workerName: defaultWorkerName || `worker-${Math.random().toString(36).substring(2, 8)}`,
        currentHashrate: parseFloat(newMinerThs),
        status: 'activo',
        createdAt: new Date(),
      });

      console.log("Minero añadido a Firebase:", newMinerRef.id);
      setMessage('Minero añadido exitosamente!');
      setNewMinerThs('');
    } catch (err) {
      console.error("Error al añadir minero:", err);
      setError(`Fallo al añadir minero: ${err.message}`);
    }
  };

  const handleDeleteMiner = async (minerId) => {
    if (!currentUser || !currentUser.uid) {
      setError('Debes iniciar sesión para eliminar un minero.');
      return;
    }
    if (window.confirm('¿Estás seguro de que quieres eliminar este minero?')) {
      setError('');
      setMessage('');
      try {
        await deleteDoc(doc(db, 'miners', minerId));
        setMessage('Minero eliminado exitosamente.');
      } catch (err) {
        console.error("Error al eliminar minero:", err);
        setError(`Fallo al eliminar minero: ${err.message}`);
      }
    }
  };

  return (
    <div className="p-2">
      {error && <div className="bg-red_error text-white p-3 rounded mb-4">{error}</div>}
      {message && <div className="bg-green_check text-white p-3 rounded mb-4">{message}</div>}

      {/* Sección: Añadir Nuevo Minero */}
      <div className="bg-light_card p-4 rounded-lg shadow-md mb-6 border border-gray_border">
        <h2 className="text-xl font-bold text-dark_text mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          Añadir Nuevo Minero
        </h2>
        <form onSubmit={handleAddMiner} className="space-y-4">
          <div>
            <label htmlFor="newMinerThs" className="block text-gray_text text-sm font-medium mb-1">Poder de Minado (TH/s):</label>
            <input
              type="number"
              id="newMinerThs"
              value={newMinerThs}
              onChange={(e) => setNewMinerThs(e.target.value)}
              step="0.01"
              className="w-full p-2 bg-gray-100 border border-gray_border rounded-md text-dark_text text-sm focus:outline-none focus:border-blue_link"
              placeholder="Ej: 100.5"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue_link hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Añadir Minero
          </button>
        </form>
      </div>

      {/* Sección: Mineros Activos */}
      <div className="bg-light_card p-4 rounded-lg shadow-md border border-gray_border">
        <h2 className="text-xl font-bold text-dark_text mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green_check" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
          Mis Mineros Activos
        </h2>
        {userMiners.length === 0 ? (
          <p className="text-gray_text text-center py-8">No tienes mineros activos. ¡Añade uno para empezar a minar!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray_border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray_text uppercase tracking-wider">Nombre del Worker</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray_text uppercase tracking-wider">TH/s</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray_text uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-light_card divide-y divide-gray_border">
                {userMiners.map((miner) => (
                  <tr key={miner.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-dark_text">
                      <div className="flex items-center">
                        <input type="text" value={miner.workerName} readOnly className="flex-1 p-1 rounded-l-md bg-gray-100 border border-gray_border text-dark_text text-xs" />
                        <button onClick={() => handleCopy(miner.workerName)} className="bg-blue_link hover:bg-blue-700 text-white p-1 rounded-r-md text-xs">📋</button>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-dark_text">{(miner.currentHashrate || 0).toFixed(2)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteMiner(miner.id)}
                        className="bg-red_error hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instrucciones de Configuración del Pool Estándar */}
      <div className="bg-gray-100 p-4 rounded-lg shadow-inner mt-6 border border-gray_border">
        <h3 className="text-lg font-semibold text-dark_text mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue_link" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          Instrucciones de Conexión (Pool Estándar)
        </h3>
        <p className="text-gray_text text-sm mb-4">Usa esta información para configurar tu minero con nuestra pool principal.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-dark_text mb-2">Detalles de Conexión:</h4>
            <ul className="list-disc list-inside text-gray_text text-sm space-y-1">
              <li>URL del Pool: {poolUrl} <button onClick={() => handleCopy(poolUrl)} className="ml-2 bg-accent hover:bg-yellow-700 text-white p-1 rounded-md text-xs">📋</button></li>
              <li>Puerto: {port} <button onClick={() => handleCopy(port)} className="ml-2 bg-accent hover:bg-yellow-700 text-white p-1 rounded-md text-xs">📋</button></li>
              <li>Contraseña de Minería: {miningPassword} <button onClick={() => handleCopy(miningPassword)} className="ml-2 bg-accent hover:bg-yellow-700 text-white p-1 rounded-md text-xs">📋</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-dark_text mb-2">Ejemplo de Configuración:</h4>
            <pre className="bg-gray-200 p-3 rounded-md text-dark_text text-xs overflow-x-auto border border-gray_border">
              <code>
                URL: {poolUrl} <br />
                Usuario: {defaultWorkerName} <br />
                Contraseña: {miningPassword}
              </code>
            </pre>
            <p className="text-xs text-gray_text mt-2">El nombre de worker por defecto es: {defaultWorkerName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentsContent = ({ currentUser }) => {
  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser || !currentUser.uid) {
      setPaymentsHistory([]);
      return;
    }

    const q = query(
      collection(db, 'payments'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        }));
        setPaymentsHistory(data);
      } catch (fetchError) {
        console.error("Error fetching payments history from Firebase:", fetchError);
        setError('Error al cargar el historial de pagos.');
      }
    }, (err) => {
      console.error("Error subscribing to payments:", err);
      setError('Error al suscribirse al historial de pagos.');
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold text-dark_text mb-4">Historial de Pagos</h1>
      {error && <div className="bg-red_error text-white p-3 rounded mb-4">{error}</div>}

      <div className="bg-light_card p-6 rounded-lg shadow-md border border-gray_border">
        <h2 className="text-xl font-semibold text-dark_text mb-4">Pagos Recibidos</h2>
        {paymentsHistory.length === 0 ? (
          <p className="text-gray_text text-center py-8">No hay pagos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray_border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray_text uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray_text uppercase tracking-wider">Cantidad</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray_text uppercase tracking-wider">Moneda</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray_text uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-light_card divide-y divide-gray_border">
                {paymentsHistory.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-dark_text">
                      {payment.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-dark_text">
                      {payment.amount.toFixed(8)} {payment.currency}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-dark_text">
                      {payment.currency}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-dark_text">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.status === 'Pendiente' ? 'bg-yellow-100 text-accent' :
                        payment.status === 'Completado' ? 'bg-green-100 text-green_check' :
                        'bg-red-100 text-red_error'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const WithdrawalsContent = ({ minPaymentThresholds }) => {
  const { currentUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BTC');
  const [walletAddress, setWalletAddress] = useState('');
  const [binanceId, setBinanceId] = useState('');
  const [useBinancePay, setUseBinancePay] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [userBalances, setUserBalances] = useState({
    balanceUSD: 0,
    balanceBTC: 0,
    balanceLTC: 0,
    balanceDOGE: 0,
  });
  const [withdrawalsHistory, setWithdrawalsHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const balanceKey = `balance${currency}`;
    setAvailableBalance(userBalances[balanceKey] || 0);
  }, [userBalances, currency]);

  useEffect(() => {
    const fetchWithdrawalData = async () => {
      if (!currentUser || !currentUser.uid) {
        setWithdrawalsHistory([]);
        setUserBalances({
          balanceUSD: 0,
          balanceBTC: 0,
          balanceLTC: 0,
          balanceDOGE: 0,
        });
        return;
      }

      try {
        // Cargar balances del usuario desde Firebase
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserBalances({
              balanceUSD: userData.balanceUSD || 0,
              balanceBTC: userData.balanceBTC || 0,
              balanceLTC: userData.balanceLTC || 0,
              balanceDOGE: userData.balanceDOGE || 0,
            });
          }
        }, (err) => {
          console.error("Error subscribing to user balances:", err);
          setError('Error al configurar el listener de balances.');
        });

        // Cargar historial de retiros del usuario desde Firebase
        const q = query(
          collection(db, 'withdrawals'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const unsubscribeWithdrawals = onSnapshot(q, (snapshot) => {
          const fetchedWithdrawals = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
          }));
          setWithdrawalsHistory(fetchedWithdrawals);
        }, (err) => {
          console.error("Error subscribing to withdrawals:", err);
          setError('Error al configurar el listener de retiros.');
        });

        return () => {
          unsubscribeUser();
          unsubscribeWithdrawals();
        };
      } catch (err) {
        console.error("Error setting up listeners:", err);
        setError('Error al configurar los listeners de datos.');
      }
    };

    fetchWithdrawalData();
  }, [currentUser, currency]);

  const handleSubmitWithdrawal = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!currentUser || !currentUser.uid || !currentUser.email) {
      setError('Debes iniciar sesión para solicitar un retiro.');
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      setError('Por favor, introduce una cantidad válida.');
      return;
    }
    const currentMinThreshold = minPaymentThresholds[currency] || 0;
    if (withdrawalAmount < currentMinThreshold) {
      setError(`La cantidad mínima de retiro es ${currentMinThreshold.toFixed(currency === 'USD' ? 2 : 8)} ${currency}.`);
      return;
    }
    const currentBalanceForCurrency = userBalances[`balance${currency}`] || 0;
    if (withdrawalAmount > currentBalanceForCurrency) {
      setError(`Fondos insuficientes para realizar el retiro en ${currency}.`);
      return;
    }

    let method = '';
    let addressOrId = '';

    if (useBinancePay) {
      if (!binanceId.trim()) {
        setError('Por favor, introduce tu Email o ID de Binance.');
        return;
      }
      method = 'Binance Pay';
      addressOrId = binanceId.trim();
    } else {
      if (!walletAddress.trim()) {
        setError('Por favor, introduce tu Dirección de Wallet.');
        return;
      }
      method = 'Wallet';
      addressOrId = walletAddress.trim();
    }

    try {
      await addDoc(collection(db, 'withdrawals'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        amount: withdrawalAmount,
        currency: currency,
        method: method,
        addressOrId: addressOrId,
        status: 'Pendiente',
        createdAt: new Date(),
      });

      // Actualizar el balance del usuario en la tabla 'users'
      const balanceKey = `balance${currency}`;
      const newBalance = currentBalanceForCurrency - withdrawalAmount;

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { [balanceKey]: newBalance });

      setMessage('Solicitud de retiro enviada exitosamente. Será procesada a la brevedad.');
      setAmount('');
      setWalletAddress('');
      setBinanceId('');
      setUseBinancePay(false);
    } catch (err) {
      console.error("Error submitting withdrawal:", err);
      setError(`Fallo al enviar la solicitud de retiro: ${err.message}`);
    }
  };

  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold text-dark_text mb-4">Retiros</h1>
      {message && <div className="bg-green_check text-white p-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red_error text-white p-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Solicitar Retiro */}
        <div className="bg-light_card p-6 rounded-lg shadow-md border border-gray_border">
          <h2 className="text-xl font-semibold text-dark_text mb-4">Solicitar Retiro</h2>
          <form onSubmit={handleSubmitWithdrawal}>
            <div className="mb-4">
              <label htmlFor="amount" className="block text-gray_text text-sm font-medium mb-1">Cantidad</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="any"
                className="w-full p-2 bg-gray-100 border border-gray_border rounded-md text-dark_text text-sm focus:outline-none focus:border-blue_link"
                placeholder="0.00000000"
                required
              />
            </div>
            <div className="mb-4">
            <label htmlFor="currency" className="block text-gray_text text-sm font-medium mb-1">Moneda</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                // Actualizar availableBalance basado en la moneda seleccionada
                const balanceKey = `balance${e.target.value}`;
                setAvailableBalance(userBalances[balanceKey] || 0);
              }}
              className="w-full p-2 bg-gray-100 border border-gray_border rounded-md text-dark_text text-sm focus:outline-none focus:border-blue_link"
            >
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="DOGE">Dogecoin (DOGE)</option>
              <option value="LTC">Litecoin (LTC)</option>
              <option value="USD">USD</option> {/* Añadir USD como opción de retiro */}
            </select>
            </div>
            <div className="mb-4">
              <label htmlFor="walletAddress" className="block text-gray_text text-sm font-medium mb-1">Dirección de Wallet</label>
              <input
                type="text"
                id="walletAddress"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full p-2 bg-gray-100 border border-gray_border rounded-md text-dark_text text-sm focus:outline-none focus:border-blue_link"
                placeholder="bc1q..."
                disabled={useBinancePay}
                required={!useBinancePay}
              />
            </div>

            <div className="mb-4 text-center text-gray_text text-sm">O usar Binance Pay</div>

            <div className="mb-4">
              <label htmlFor="binanceId" className="block text-gray_text text-sm font-medium mb-1">Email o ID de Binance</label>
              <input
                type="text"
                id="binanceId"
                value={binanceId}
                onChange={(e) => setBinanceId(e.target.value)}
                className="w-full p-2 bg-gray-100 border border-gray_border rounded-md text-dark_text text-sm focus:outline-none focus:border-blue_link"
                placeholder="ejemplo@binance.com o 123456789"
                disabled={!useBinancePay}
                required={useBinancePay}
              />
            </div>
            <div className="mb-6 flex items-center">
              <input
                type="checkbox"
                id="useBinancePay"
                checked={useBinancePay}
                onChange={(e) => setUseBinancePay(e.target.checked)}
                className="form-checkbox h-5 w-5 text-accent bg-gray-100 border-gray_border rounded"
              />
              <label htmlFor="useBinancePay" className="ml-2 text-gray_text text-sm">Usar Binance Pay en lugar de dirección de wallet</label>
            </div>

            <div className="flex justify-between text-xs text-gray_text mb-6">
              <span>Balance disponible: {availableBalance.toFixed(currency === 'USD' ? 2 : 8)} {currency}</span>
              <span>Umbral mínimo: {(minPaymentThresholds[currency] || 0).toFixed(currency === 'USD' ? 2 : 8)} {currency}</span>
            </div>

            <button
              type="submit"
              className="w-full bg-accent hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline"
            >
              Solicitar Retiro
            </button>
          </form>
        </div>

        {/* Historial de Retiros */}
        <div className="bg-light_card p-6 rounded-lg shadow-md border border-gray_border">
          <h2 className="text-xl font-semibold text-dark_text mb-4">Historial de Retiros</h2>
          {withdrawalsHistory.length === 0 ? (
            <p className="text-gray_text text-center py-8">No hay retiros registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray_border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray_text uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray_text uppercase tracking-wider">Cantidad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray_text uppercase tracking-wider">Método</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray_text uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-light_card divide-y divide-gray_border">
                  {withdrawalsHistory.map((withdrawal) => (
                    <tr key={withdrawal.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-dark_text">
                        {withdrawal.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-dark_text">
                        {withdrawal.amount.toFixed(8)} {withdrawal.currency}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-dark_text">
                        {withdrawal.currency}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-dark_text">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          withdrawal.status === 'Pendiente' ? 'bg-yellow-100 text-accent' :
                          withdrawal.status === 'Completado' ? 'bg-green-100 text-green_check' :
                          'bg-red-100 text-red_error'
                        }`}>
                          {withdrawal.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ContactSupportContent = ({ onUnreadCountChange }) => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [subject, setSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!currentUser || !currentUser.uid) {
      setTickets([]);
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
      return;
    }

    const q = query(
      collection(db, 'contactRequests'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const fetchedTickets = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
        }));
        setTickets(fetchedTickets);

        const unreadCount = fetchedTickets.filter(ticket =>
          ticket.status === 'Respondido' &&
          ticket.conversation.some(msg => msg.sender === 'admin' && !msg.readByUser)
        ).length;
        if (onUnreadCountChange) {
          onUnreadCountChange(unreadCount);
        }

        if (selectedTicket) {
          const updatedSelected = fetchedTickets.find(t => t.id === selectedTicket.id);
          setSelectedTicket(updatedSelected || null);
        }
      } catch (error) {
        console.error("Error al cargar tickets desde Firebase:", error);
        setStatusMessage('Error al cargar tus solicitudes de soporte.');
        setIsError(true);
      }
    }, (err) => {
      console.error("Error subscribing to contact requests:", err);
      setStatusMessage('Error al suscribirse a las solicitudes de soporte.');
      setIsError(true);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, selectedTicket, onUnreadCountChange]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setIsError(false);

    if (!messageContent.trim()) {
      setStatusMessage('El mensaje no puede estar vacío.');
      setIsError(true);
      return;
    }

    if (!currentUser || !currentUser.uid || !currentUser.email) {
      setStatusMessage('Debes iniciar sesión para enviar un mensaje.');
      setIsError(true);
      return;
    }

    try {
      if (selectedTicket) {
        const newConversation = [...selectedTicket.conversation, {
          sender: 'user',
          text: messageContent,
          timestamp: new Date(),
        }];
        const ticketRef = doc(db, 'contactRequests', selectedTicket.id);
        await updateDoc(ticketRef, {
          conversation: newConversation,
          status: 'Pendiente',
          updatedAt: new Date(),
        });
        setStatusMessage('Tu respuesta ha sido enviada.');
      } else {
        if (!subject.trim()) {
          setStatusMessage('Por favor, introduce un asunto para tu nueva consulta.');
          setIsError(true);
          return;
        }
        await addDoc(collection(db, 'contactRequests'), {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          subject: subject,
          status: 'Abierto',
          createdAt: new Date(),
          updatedAt: new Date(),
          conversation: [{
            sender: 'user',
            text: messageContent,
            timestamp: new Date(),
          }],
        });
        setStatusMessage('Tu nueva consulta ha sido enviada. Te responderemos a la brevedad.');
        setSubject('');
      }
      setMessageContent('');
    } catch (err) {
      console.error("Error al enviar mensaje a Firebase:", err);
      setStatusMessage(`Fallo al enviar mensaje: ${err.message}`);
      setIsError(true);
    }
  };

  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setSubject(ticket.subject);
    setMessageContent('');
    setStatusMessage('');
    setIsError(false);

    if (ticket.status === 'Respondido' && ticket.conversation.some(msg => msg.sender === 'admin' && !msg.readByUser)) {
      const updatedConversation = ticket.conversation.map(msg =>
        msg.sender === 'admin' ? { ...msg, readByUser: true } : msg
      );
      try {
        const ticketRef = doc(db, 'contactRequests', ticket.id);
        await updateDoc(ticketRef, { conversation: updatedConversation });
      } catch (error) {
        console.error("Error al marcar mensajes como leídos en Firebase:", error);
        setStatusMessage('Error al actualizar el estado de lectura del ticket.');
        setIsError(true);
      }
    }
  };

  const handleNewTicket = () => {
    setSelectedTicket(null);
    setSubject('');
    setMessageContent('');
    setStatusMessage('');
    setIsError(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Abierto': return 'bg-blue-600';
      case 'Pendiente': return 'bg-yellow-600';
      case 'Respondido': return 'bg-purple-600';
      case 'Cerrado': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full p-2">
      {/* Mensajes de estado */}
      {statusMessage && (
        <div className={`p-3 rounded-md mb-4 text-sm ${isError ? 'bg-red_error text-white' : 'bg-green_check text-white'} lg:absolute lg:top-4 lg:right-4 lg:z-10`}>
          {statusMessage}
        </div>
      )}

      {/* Lista de Tickets */}
      <div className="w-full lg:w-1/3 bg-light_card p-4 rounded-lg shadow-md lg:mr-4 mb-4 lg:mb-0 overflow-y-auto max-h-[calc(100vh-100px)] border border-gray_border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-dark_text">Mis Solicitudes</h2>
          <button
            onClick={handleNewTicket}
            className="bg-blue_link hover:bg-blue-700 text-white text-sm font-bold py-1.5 px-3 rounded-md"
          >
            + Nueva Consulta
          </button>
        </div>
        {tickets.length === 0 ? (
          <p className="text-gray_text text-sm">No tienes solicitudes de soporte aún.</p>
        ) : (
          <ul>
            {tickets.map(ticket => (
              <li
                key={ticket.id}
                className={`p-3 mb-2 rounded-lg cursor-pointer ${
                  selectedTicket && selectedTicket.id === ticket.id ? 'bg-accent text-white' : 'bg-gray-100 hover:bg-gray-200 text-dark_text'
                }`}
                onClick={() => handleSelectTicket(ticket)}
              >
                <p className="font-semibold text-base truncate">{ticket.subject}</p>
                <p className="text-sm text-gray_text truncate">{ticket.conversation[ticket.conversation.length - 1]?.text}</p>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-gray_text">{ticket.createdAt.toLocaleDateString()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xxs font-semibold ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  {ticket.status === 'Respondido' && ticket.conversation.some(msg => msg.sender === 'admin' && !msg.readByUser) && (
                    <span className="ml-auto bg-red_error text-white text-xxs font-bold px-2 py-0.5 rounded-full">
                      Nuevo
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Detalles de la Solicitud y Formulario de Respuesta */}
      <div className="flex-1 bg-light_card p-4 rounded-lg shadow-md overflow-y-auto max-h-[calc(100vh-100px)] border border-gray_border">
        {selectedTicket ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-dark_text">{selectedTicket.subject}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedTicket.status)}`}>
                {selectedTicket.status}
              </span>
            </div>
            <p className="text-gray_text text-sm mb-4">
              Enviado el: {selectedTicket.createdAt.toLocaleString()}
            </p>

            {/* Historial de Conversación */}
            <div className="bg-gray-100 p-4 rounded-lg shadow-inner mb-4 h-64 overflow-y-auto border border-gray_border">
              {selectedTicket.conversation.map((msg, index) => (
                <div key={index} className={`mb-3 ${msg.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block p-2 rounded-lg text-sm max-w-[80%] ${
                    msg.sender === 'admin' ? 'bg-blue_link text-white' : 'bg-gray-200 text-dark_text'
                  }`}>
                    {msg.text}
                  </span>
                  <p className="text-xxs text-gray_text mt-1">
                    {msg.sender === 'admin' ? 'Admin' : 'Tú'} - {new Date(msg.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Área de Respuesta del Usuario */}
            <div className="bg-gray-100 p-4 rounded-lg shadow-md border border-gray_border">
              <h3 className="text-lg font-semibold text-dark_text mb-3">Responder a este Ticket</h3>
              <textarea
                rows="4"
                className="w-full p-2 bg-white border border-gray_border rounded-md text-dark_text text-sm focus:outline-none focus:border-blue_link mb-3"
                placeholder="Escribe tu respuesta aquí..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                required
              ></textarea>
              <button
                onClick={handleSendMessage}
                className="bg-accent hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md w-full"
              >
                Enviar Respuesta
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 p-4 rounded-lg shadow-md border border-gray_border">
            <h2 className="text-xl font-semibold text-dark_text mb-4">Envía una Nueva Consulta</h2>
            <form onSubmit={handleSendMessage}>
              <div className="mb-4">
                <label htmlFor="subject" className="block text-gray_text text-sm font-medium mb-1">Asunto</label>
                <input
                  type="text"
                  id="subject"
                  className="w-full p-2 bg-white border border-gray_border rounded-md text-dark_text text-sm focus:outline-none focus:border-blue_link"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="messageContent" className="block text-gray_text text-sm font-medium mb-1">Mensaje</label>
                <textarea
                  id="messageContent"
                  rows="5"
                  className="w-full p-2 bg-white border border-gray_border rounded-md text-dark_text text-sm focus:outline-none focus:border-blue_link"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-accent hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md"
              >
                Enviar Nueva Consulta
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const ReferralsContent = () => (
  <div className="bg-white p-2 rounded-lg shadow-md flex flex-col items-center justify-center h-48">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">Referidos</h2>
    <p className="text-gray-600 text-lg">Sección en desarrollo</p>
    <p className="text-gray-500 text-sm mt-2">Pronto podrás gestionar tus referidos y ganancias aquí.</p>
  </div>
);

const SettingsContent = () => {
  const { currentUser } = useAuth();
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [bitcoinAddress, setBitcoinAddress] = useState('');
  const [dogecoinAddress, setDogecoinAddress] = useState('');
  const [litecoinAddress, setLitecoinAddress] = useState('');
  const [receivePaymentNotifications, setReceivePaymentNotifications] = useState(false);
  const [receiveLoginAlerts, setReceiveLoginAlerts] = useState(false);
  const [twoFactorAuthEnabled, setTwoFactorAuthEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (currentUser && currentUser.uid) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setBitcoinAddress(userData.bitcoinAddress || '');
            setDogecoinAddress(userData.dogecoinAddress || '');
            setLitecoinAddress(userData.litecoinAddress || '');
            setReceivePaymentNotifications(userData.receivePaymentNotifications || false);
            setReceiveLoginAlerts(userData.receiveLoginAlerts || false);
            setTwoFactorAuthEnabled(userData.twoFactorAuthEnabled || false);
          }
        } catch (userError) {
          console.error("Error fetching user settings from Firebase:", userError);
          setError('Error al cargar la configuración del usuario.');
        }
      }
    };
    fetchUserSettings();
  }, [currentUser]);

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!currentUser || !currentUser.uid || !currentUser.email) {
      setError('No hay usuario autenticado.');
      return;
    }

    try {
      let userUpdated = false;
      const userDocRef = doc(db, 'users', currentUser.uid);

      // Actualizar email en Firebase Authentication y Firestore
      if (contactEmail !== currentUser.email) {
        if (currentPassword) {
          const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
          await reauthenticateWithCredential(currentUser, credential);
          await updateEmail(currentUser, contactEmail);
          await updateDoc(userDocRef, { email: contactEmail });
          setMessage('Email actualizado exitosamente.');
          userUpdated = true;
        } else {
          setError('Se requiere la contraseña actual para cambiar el email.');
          return;
        }
      }

      // Actualizar contraseña en Firebase Authentication
      if (newPassword) {
        if (newPassword !== confirmNewPassword) {
          setError('Las nuevas contraseñas no coinciden.');
          return;
        }
        if (currentPassword) {
          const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
          await reauthenticateWithCredential(currentUser, credential);
          await updatePassword(currentUser, newPassword);
          setMessage(prev => (prev ? prev + ' y ' : '') + 'Contraseña actualizada exitosamente.');
          setNewPassword('');
          setConfirmNewPassword('');
          setCurrentPassword('');
          userUpdated = true;
        } else {
          setError('Se requiere la contraseña actual para cambiar la contraseña.');
          return;
        }
      }

      if (userUpdated) {
        setMessage(prev => (prev ? prev + ' y ' : '') + 'Configuración de cuenta actualizada.');
      } else {
        setMessage('No se realizaron cambios en la configuración de la cuenta.');
      }

    } catch (err) {
      console.error("Error al actualizar la cuenta en Firebase:", err);
      setError(`Fallo al actualizar la cuenta: ${err.message}`);
    }
  };

  const handleSaveAddresses = async () => {
    setMessage('');
    setError('');
    if (!currentUser || !currentUser.uid) {
      setError('No hay usuario autenticado.');
      return;
    }
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        bitcoinAddress,
        dogecoinAddress,
        litecoinAddress,
      });
      setMessage('Direcciones de pago guardadas exitosamente.');
    } catch (err) {
      console.error("Error al guardar direcciones en Firebase:", err);
      setError(`Fallo al guardar direcciones: ${err.message}`);
    }
  };

  const handleSaveNotifications = async () => {
    setMessage('');
    setError('');
    if (!currentUser || !currentUser.uid) {
      setError('No hay usuario autenticado.');
      return;
    }
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        receivePaymentNotifications,
        receiveLoginAlerts,
      });
      setMessage('Preferencias de notificación guardadas exitosamente.');
    } catch (err) {
      console.error("Error al guardar preferencias de notificación en Firebase:", err);
      setError(`Fallo al guardar preferencias de notificación: ${err.message}`);
    }
  };

  const handleToggleTwoFactorAuth = async () => {
    setMessage('');
    setError('');
    if (!currentUser || !currentUser.uid) {
      setError('No hay usuario autenticado.');
      return;
    }
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        twoFactorAuthEnabled: !twoFactorAuthEnabled,
      });
      setTwoFactorAuthEnabled(prev => !prev);
      setMessage(`Autenticación de dos factores ${!twoFactorAuthEnabled ? 'activada' : 'desactivada'} exitosamente.`);
    } catch (err) {
      console.error("Error al cambiar 2FA en Firebase:", err);
      setError(`Fallo al cambiar autenticación de dos factores: ${err.message}`);
    }
  };

  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Configuración</h1>
      {message && <div className="bg-green-100 text-green-800 p-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Configuración de Cuenta */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Configuración de Cuenta</h2>
          <form onSubmit={handleUpdateAccount}>
            <div className="mb-4">
              <label htmlFor="contact-email" className="block text-gray-700 text-sm font-medium mb-1">Email de Contacto</label>
              <input
                type="email"
                id="contact-email"
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:border-yellow-500"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="current-password" className="block text-gray-700 text-sm font-medium mb-1">Contraseña Actual</label>
              <input
                type="password"
                id="current-password"
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:border-yellow-500"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="new-password" className="block text-gray-700 text-sm font-medium mb-1">Nueva Contraseña</label>
              <input
                type="password"
                id="new-password"
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:border-yellow-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label htmlFor="confirm-new-password" className="block text-gray-700 text-sm font-medium mb-1">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirm-new-password"
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:border-yellow-500"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md w-full"
            >
              Actualizar Configuración
            </button>
          </form>
        </div>

        {/* Seguridad y Direcciones de Pago */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Seguridad</h2>
          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-700 text-sm font-medium">Autenticación de Dos Factores</span>
            <div className="flex items-center">
              <span className="text-gray-500 text-sm mr-2">En Desarrollo</span>
              <button
                onClick={handleToggleTwoFactorAuth}
                className={`py-1 px-3 rounded-md text-xs font-medium bg-gray-300 text-gray-700 cursor-not-allowed`}
                disabled={true} // Deshabilitar el botón
              >
                Activar
              </button>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-4">Direcciones de Pago Predeterminadas</h2>
          <div className="mb-4">
            <label htmlFor="bitcoin-address" className="block text-gray-700 text-sm font-medium mb-1">Bitcoin (BTC)</label>
            <input
              type="text"
              id="bitcoin-address"
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:border-blue-500"
              value={bitcoinAddress}
              onChange={(e) => setBitcoinAddress(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="dogecoin-address" className="block text-gray-700 text-sm font-medium mb-1">Dogecoin (DOGE)</label>
            <input
              type="text"
              id="dogecoin-address"
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:border-blue-500"
              value={dogecoinAddress}
              onChange={(e) => setDogecoinAddress(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="litecoin-address" className="block text-gray-700 text-sm font-medium mb-1">Litecoin (LTC)</label>
            <input
              type="text"
              id="litecoin-address"
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:border-blue-500"
              value={litecoinAddress}
              onChange={(e) => setLitecoinAddress(e.target.value)}
            />
          </div>
          <button
            onClick={handleSaveAddresses}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md w-full"
          >
            Guardar Direcciones
          </button>

          {/* Notificaciones */}
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-4">Notificaciones</h2>
          <div className="mb-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-500 bg-gray-50 border-gray-300 rounded cursor-not-allowed"
                checked={false} // Siempre false ya que está en desarrollo
                onChange={() => {}} // No permitir cambios
                disabled={true} // Deshabilitar el checkbox
              />
              <span className="ml-2 text-gray-500 text-sm">Recibir notificaciones de pagos por email (En Desarrollo)</span>
            </label>
          </div>
          <div className="mb-6">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-500 bg-gray-50 border-gray-300 rounded cursor-not-allowed"
                checked={false} // Siempre false ya que está en desarrollo
                onChange={() => {}} // No permitir cambios
                disabled={true} // Deshabilitar el checkbox
              />
              <span className="ml-2 text-gray-500 text-sm">Recibir alertas de inicio de sesión (En Desarrollo)</span>
            </label>
          </div>
          <button
            onClick={handleSaveNotifications}
            className="bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-md w-full cursor-not-allowed"
            disabled={true} // Deshabilitar el botón
          >
            Guardar Preferencias
          </button>
        </div>
      </div>
    </div>
  );
};


const UserPanel = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMiners, setUserMiners] = useState([]);
  const [unreadTicketsCount, setUnreadTicketsCount] = useState(0);
  const [userBalances, setUserBalances] = useState({
    balanceUSD: 0,
    balanceBTC: 0,
    balanceLTC: 0,
    balanceDOGE: 0,
  });
  const [paymentRate, setPaymentRate] = useState(0.00); // Nuevo estado para la tasa de pago
  const [btcToUsdRate, setBtcToUsdRate] = useState(20000); // Nuevo estado para la tasa de BTC a USD, valor por defecto
  const [minPaymentThresholds, setMinPaymentThresholds] = useState({ // Nuevo estado para los umbrales mínimos de retiro por moneda
    BTC: 0.001,
    DOGE: 100,
    LTC: 0.01,
    USD: 10,
  });
  const [totalHashratePool, setTotalHashratePool] = useState(0); // Nuevo estado para el hashrate total de la pool
  const [poolCommission, setPoolCommission] = useState(0); // Nuevo estado para la comisión de la pool
  const [paymentsHistory, setPaymentsHistory] = useState([]); // Estado para el historial de pagos
  const [withdrawalsHistory, setWithdrawalsHistory] = useState([]); // Estado para el historial de retiros


  const handleUnreadCountChange = (count) => {
    setUnreadTicketsCount(count);
  };

  // Obtener la ruta base actual para los enlaces de la barra lateral
  const { pathname } = useLocation();
  const basePath = pathname.split('/').slice(0, 2).join('/'); // e.g., "/user" or "/test-user-settings"

  const demoUser = { email: 'demo@example.com' };
  const displayUser = currentUser || demoUser;

  const chartData = {
    labels: Object.keys(countMinersByUser(userMiners)),
    datasets: [{
      label: 'Mineros por Usuario',
      data: Object.values(countMinersByUser(userMiners)),
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  useEffect(() => {
    let unsubscribeMiners = null;
    let unsubscribeUserBalances = null;
    let unsubscribePoolConfig = null;
    let unsubscribePaymentConfig = null;
    let unsubscribeAllMiners = null; // Nueva suscripción para todos los mineros
    let unsubscribePayments = null; // Nueva suscripción para pagos
    let unsubscribeWithdrawals = null; // Nueva suscripción para retiros

    if (currentUser && currentUser.uid) {
      // Suscripción para mineros del usuario
      console.log("UserPanel: Configurando suscripción para mineros del usuario:", currentUser.uid);
      const minersQuery = query(collection(db, "miners"), where("userId", "==", currentUser.uid));
      unsubscribeMiners = onSnapshot(minersQuery, (snapshot) => {
        const fetchedMiners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserMiners(fetchedMiners);
      }, (error) => {
        console.error("UserPanel: Error en la suscripción de mineros:", error);
      });

      // Suscripción para todos los mineros (para hashrate total de la pool)
      console.log("UserPanel: Configurando suscripción para todos los mineros.");
      const allMinersQuery = collection(db, "miners");
      unsubscribeAllMiners = onSnapshot(allMinersQuery, (snapshot) => {
        let totalHash = 0;
        snapshot.docs.forEach(doc => {
          totalHash += doc.data().currentHashrate || 0;
        });
        setTotalHashratePool(totalHash);
      }, (error) => {
        console.error("UserPanel: Error en la suscripción de todos los mineros:", error);
      });

      // Suscripción para balances del usuario
      console.log("UserPanel: Configurando suscripción para balances del usuario:", currentUser.uid);
      const userDocRef = doc(db, "users", currentUser.uid);
      unsubscribeUserBalances = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setUserBalances({
            balanceUSD: userData.balanceUSD || 0,
            balanceBTC: userData.balanceBTC || 0,
            balanceLTC: userData.balanceLTC || 0,
            balanceDOGE: userData.balanceDOGE || 0,
          });
        } else {
          // Si el documento de usuario no existe en Firestore, crearlo
          console.log("UserPanel: Documento de usuario no existe en Firestore. Creando uno nuevo...");
          setDoc(userDocRef, {
            balanceUSD: 0,
            balanceBTC: 0,
            balanceLTC: 0,
            balanceDOGE: 0,
            role: 'user',
            email: currentUser.email,
          }).then(() => {
            console.log("UserPanel: Documento de usuario creado exitosamente en Firestore.");
            setUserBalances({
              balanceUSD: 0,
              balanceBTC: 0,
              balanceLTC: 0,
              balanceDOGE: 0,
            });
          }).catch((insertError) => {
            console.error("UserPanel: Error al crear el documento de usuario en Firestore:", insertError);
          });
        }
      }, (error) => {
        console.error("UserPanel: Error en la suscripción de balances del usuario:", error);
      });

      // Suscripción para configuración de la pool
      console.log("UserPanel: Configurando suscripción para poolConfig.");
      const poolConfigQuery = query(collection(db, "settings"), where("key", "==", "poolConfig"));
      unsubscribePoolConfig = onSnapshot(poolConfigQuery, (snapshot) => {
        const settingsData = snapshot.docs.length > 0 ? snapshot.docs[0].data() : {};
        setPaymentRate(settingsData.obsoletePrice || 0.00);
        setBtcToUsdRate(settingsData.btcToUsdRate || 20000);
        setPoolCommission(settingsData.commission || 0); // Obtener la comisión
      }, (error) => {
        console.error("UserPanel: Error en la suscripción de poolConfig:", error);
      });

      // Suscripción para configuración de pagos
      console.log("UserPanel: Configurando suscripción para paymentConfig.");
      const paymentConfigQuery = query(collection(db, "settings"), where("key", "==", "paymentConfig"));
      unsubscribePaymentConfig = onSnapshot(paymentConfigQuery, (snapshot) => {
        const settingsData = snapshot.docs.length > 0 ? snapshot.docs[0].data() : {};
        setMinPaymentThresholds({
          BTC: settingsData.minPaymentThresholdBTC || 0.00000001,
          DOGE: settingsData.minPaymentThresholdDOGE || 100,
          LTC: settingsData.minPaymentThresholdLTC || 0.01,
          USD: settingsData.minPaymentThresholdUSD || 10,
        });
      }, (error) => {
        console.error("UserPanel: Error en la suscripción de paymentConfig:", error);
      });

      // Suscripción para historial de pagos
      console.log("UserPanel: Configurando suscripción para historial de pagos.");
      const paymentsQuery = query(collection(db, "payments"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
      unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
        const fetchedPayments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt.toDate() }));
        setPaymentsHistory(fetchedPayments);
      }, (error) => {
        console.error("UserPanel: Error en la suscripción de pagos:", error);
      });

      // Suscripción para historial de retiros
      console.log("UserPanel: Configurando suscripción para historial de retiros.");
      const withdrawalsQuery = query(collection(db, "withdrawals"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
      unsubscribeWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
        const fetchedWithdrawals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt.toDate() }));
        setWithdrawalsHistory(fetchedWithdrawals);
      }, (error) => {
        console.error("UserPanel: Error en la suscripción de retiros:", error);
      });

      return () => {
        console.log("UserPanel: Limpiando todas las suscripciones de Firebase.");
        if (unsubscribeMiners) unsubscribeMiners();
        if (unsubscribeUserBalances) unsubscribeUserBalances();
        if (unsubscribePoolConfig) unsubscribePoolConfig();
        if (unsubscribePaymentConfig) unsubscribePaymentConfig();
        if (unsubscribeAllMiners) unsubscribeAllMiners();
        if (unsubscribePayments) unsubscribePayments();
        if (unsubscribeWithdrawals) unsubscribeWithdrawals();
      };
    } else {
      console.log("UserPanel: No hay currentUser. Limpiando estados.");
      setUserMiners([]);
      setUserBalances({
        balanceUSD: 0,
        balanceBTC: 0,
        balanceLTC: 0,
        balanceDOGE: 0,
      });
      setPaymentRate(0.00);
      setBtcToUsdRate(20000);
      setMinPaymentThresholds({
        BTC: 0.001,
        DOGE: 100,
        LTC: 0.01,
        USD: 10,
      });
      setTotalHashratePool(0);
      setPoolCommission(0);
      setPaymentsHistory([]);
      setWithdrawalsHistory([]);
    }
  }, [currentUser]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch {
      console.error("Fallo al cerrar sesión");
    }
  }

  return (
    <div className="flex min-h-screen bg-light_bg text-dark_text">
      {/* Sidebar de Navegación */}
      <aside className="w-64 bg-light_card p-2 shadow-lg border-r border-gray_border">
        <div className="flex flex-col items-center text-center border-b border-gray_border pb-2 mb-2">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-dark_text" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
          <h2 className="text-base font-semibold text-dark_text truncate w-full">{displayUser.email || 'Usuario'}</h2>
          <p className="text-xs text-gray_text">Minero</p>
        </div>
        <nav>
          <ul>
            <li className="mb-0.5">
              <Link
                to={`${basePath}/dashboard`}
                className={`flex items-center py-1.5 px-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  useMatch(`${basePath}/dashboard`) ? 'bg-accent text-white' : 'text-gray_text hover:bg-gray-100 hover:text-dark_text'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                Dashboard
              </Link>
            </li>
            <li className="mb-0.5">
              <Link
                to={`${basePath}/mining-info`}
                className={`flex items-center py-1.5 px-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  useMatch(`${basePath}/mining-info`) ? 'bg-accent text-white' : 'text-gray_text hover:bg-gray-100 hover:text-dark_text'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Conectar Pool Estándar
              </Link>
            </li>
            <li className="mb-0.5">
              <Link
                to={`${basePath}/withdrawals`}
                className={`flex items-center py-1.5 px-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  useMatch(`${basePath}/withdrawals`) ? 'bg-accent text-white' : 'text-gray_text hover:bg-gray-100 hover:text-dark_text'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V3a1 1 0 00-1-1H4a1 1 0 00-1 1v18a1 1 0 001 1h12a1 1 0 001-1v-5m-1-10v4m-4 0h4"/></svg>
                Retiros
              </Link>
            </li>
            <li className="mb-0.5">
              <Link
                to={`${basePath}/contact-support`}
                className={`flex items-center py-1.5 px-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  useMatch(`${basePath}/contact-support`) ? 'bg-accent text-white' : 'text-gray_text hover:bg-gray-100 hover:text-dark_text'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                Contacto Soporte
                {unreadTicketsCount > 0 && (
                  <span className="ml-auto bg-red_error text-white text-xxs font-bold px-2 py-0.5 rounded-full">
                    {unreadTicketsCount}
                  </span>
                )}
              </Link>
            </li>
            <li className="mb-0.5">
              <Link
                to={`${basePath}/referrals`}
                className={`flex items-center py-1.5 px-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  useMatch(`${basePath}/referrals`) ? 'bg-accent text-white' : 'text-gray_text hover:bg-gray-100 hover:text-dark_text'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h2a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h2M9 10l4 4m0 0l4-4m-4 4V3"/></svg>
                Referidos
              </Link>
            </li>
            <li className="mb-0.5">
              <Link
                to={`${basePath}/pool-arbitrage`}
                className={`flex items-center py-1.5 px-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  useMatch(`${basePath}/pool-arbitrage`) ? 'bg-accent text-white' : 'text-gray_text hover:bg-gray-100 hover:text-dark_text'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                Pools de Arbitraje
              </Link>
            </li>
            <li className="mb-0.5">
              <Link
                to={`${basePath}/settings`}
                className={`flex items-center py-1.5 px-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  useMatch(`${basePath}/settings`) ? 'bg-accent text-white' : 'text-gray_text hover:bg-gray-100 hover:text-dark_text'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Configuración
              </Link>
            </li>
          </ul>
        </nav>
        <div className="mt-auto pt-2 border-t border-gray_border text-center">
          <p className="text-xxs text-gray_text mb-1">Miembro desde: 01/01/2023</p>
          <p className="text-xxs text-gray_text">UID: {currentUser?.uid?.substring(0, 6) || 'Usuario'}</p>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-4 overflow-y-auto">
        <header className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-dark_text">Dashboard</h1>
        </header>
        
        <Routes>
          <Route path="dashboard/*" element={<DashboardContent userMiners={userMiners} chartData={chartData} userBalances={userBalances} paymentRate={paymentRate} btcToUsdRate={btcToUsdRate} totalHashratePool={totalHashratePool} poolCommission={poolCommission} paymentsHistory={paymentsHistory} withdrawalsHistory={withdrawalsHistory} />} />
          <Route path="mining-info/*" element={<MiningInfoContent currentUser={currentUser} userMiners={userMiners} setUserMiners={setUserMiners} />} />
          <Route path="withdrawals/*" element={<WithdrawalsContent minPaymentThresholds={minPaymentThresholds} />} />
          <Route path="contact-support/*" element={<ContactSupportContent onUnreadCountChange={handleUnreadCountChange} />} />
          <Route path="referrals/*" element={<ReferralsContent />} />
          <Route path="pool-arbitrage/*" element={<UserPoolArbitrage />} />
          <Route path="settings/*" element={<SettingsContent />} />
          {/* Ruta por defecto */}
          <Route path="/*" element={<DashboardContent userMiners={userMiners} chartData={chartData} userBalances={userBalances} paymentRate={paymentRate} btcToUsdRate={btcToUsdRate} totalHashratePool={totalHashratePool} poolCommission={poolCommission} paymentsHistory={paymentsHistory} withdrawalsHistory={withdrawalsHistory} />} />
        </Routes>
      </main>
    </div>
  );
};

export default UserPanel;
