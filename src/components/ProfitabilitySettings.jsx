import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase'; // Importar la instancia de Firebase Firestore
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const ProfitabilitySettings = () => {
  const [fixedRatePerTHs, setFixedRatePerTHs] = useState(0.06);
  const [fixedPoolCommission, setFixedPoolCommission] = useState(1);
  const [useFixedRate, setUseFixedRate] = useState(false);


  // Cargar la configuración al iniciar el componente
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'profitability');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFixedRatePerTHs(data.fixedRatePerTHs || 0.06);
          setFixedPoolCommission(data.fixedPoolCommission || 1);
          setUseFixedRate(data.useFixedRate || false);
        } else {
          // Si no existe, establecer valores por defecto y crearlo en Firebase
          setFixedRatePerTHs(0.06);
          setFixedPoolCommission(1);
          setUseFixedRate(false);
          try {
            await setDoc(docRef, {
              fixedRatePerTHs: 0.06,
              fixedPoolCommission: 1,
              useFixedRate: false,
            });
          } catch (createError) {
            console.error("Error creating default profitability settings in Firebase:", createError);
          }
        }
      } catch (err) {
        console.error("Error fetching profitability settings from Firebase:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      const dataToSave = {
        fixedRatePerTHs,
        fixedPoolCommission,
        useFixedRate,
      };
      const docRef = doc(db, 'settings', 'profitability');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, dataToSave);
      } else {
        await setDoc(docRef, dataToSave);
      }
      alert('Configuración guardada exitosamente en Firebase!');
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      alert('Error al guardar la configuración.');
    }
  };

  // Calcular vista previa
  const preview1THs = fixedRatePerTHs;
  const preview10THs = fixedRatePerTHs * 10;
  const previewCommission = fixedPoolCommission;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-white mb-6">Configuración de Calculadora de Rentabilidad</h2>
      
      <div className="mb-4">
        <label htmlFor="fixedRatePerTHs" className="block text-gray-400 text-sm mb-1">Tasa Fija por TH/s (USD)</label>
        <input
          type="number"
          id="fixedRatePerTHs"
          step="0.01"
          value={fixedRatePerTHs}
          onChange={(e) => setFixedRatePerTHs(parseFloat(e.target.value))}
          className="w-full p-2 rounded bg-gray-900 border border-gray-600 focus:outline-none focus:border-blue-500 text-white"
          placeholder="Ej: 0.06"
        />
        <p className="text-gray-500 text-sm mt-1">Ejemplo: Si 10 TH/s = $0.60, entonces 1 TH/s = $0.06</p>
      </div>

      <div className="mb-6">
        <label htmlFor="fixedPoolCommission" className="block text-gray-400 text-sm mb-1">Comisión Fija de la Pool (%)</label>
        <input
          type="number"
          id="fixedPoolCommission"
          value={fixedPoolCommission}
          onChange={(e) => setFixedPoolCommission(parseFloat(e.target.value))}
          className="w-full p-2 rounded bg-gray-900 border border-gray-600 focus:outline-none focus:border-blue-500 text-white"
          placeholder="Ej: 1"
        />
        <p className="text-gray-500 text-sm mt-1">Esta comisión no será editable por los usuarios en la calculadora</p>
      </div>

      <div className="flex items-center mb-6">
        <input
          type="checkbox"
          id="useFixedRate"
          checked={useFixedRate}
          onChange={(e) => setUseFixedRate(e.target.checked)}
          className="mr-2 h-4 w-4 text-yellow-500 rounded border-gray-600 focus:ring-yellow-500"
        />
        <label htmlFor="useFixedRate" className="text-white text-base">Usar tasa fija en lugar del cálculo dinámico de Bitcoin</label>
      </div>

      <div className="bg-gray-700 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-yellow-400 mb-2">Vista previa del cálculo:</h3>
        <ul className="list-disc list-inside text-gray-300">
          <li>1 TH/s = ${preview1THs.toFixed(4)} USD/día</li>
          <li>10 TH/s = ${preview10THs.toFixed(4)} USD/día</li>
          <li>Comisión: {previewCommission.toFixed(1)}%</li>
        </ul>
      </div>

      <button
        onClick={handleSaveSettings}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
      >
        Guardar Configuración
      </button>
    </div>
  );
};

export default ProfitabilitySettings;
