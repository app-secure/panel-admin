import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const ContingencyContext = createContext({
  isContingency: false,
  activeDatabase: 'Supabase',
  loading: true,
  checkStatus: async () => {},
});

export function ContingencyProvider({ children }) {
  const [activeDatabase, setActiveDatabase] = useState('Supabase');
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      const res = await apiClient.get('/api/test-db');
      if (res.data && res.data.activeDatabase) {
        setActiveDatabase(res.data.activeDatabase);
      } else {
        setActiveDatabase('Supabase');
      }
    } catch (err) {
      console.error('Error al consultar estado de la base de datos:', err);
      // En caso de error de conexión con la API, asumimos preventivamente que hay contingencia
      setActiveDatabase('Aiven');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000); // Consulta cada 15 segundos
    return () => clearInterval(interval);
  }, []);

  const isContingency = activeDatabase !== 'Supabase';

  return (
    <ContingencyContext.Provider value={{ isContingency, activeDatabase, loading, checkStatus }}>
      {children}
    </ContingencyContext.Provider>
  );
}

export function useContingency() {
  return useContext(ContingencyContext);
}
