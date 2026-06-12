import axios from 'axios';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API;

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60s para dar tiempo al servidor de Render a despertar
});

// Inyecta el Firebase ID Token en cada request
apiClient.interceptors.request.use(async (config) => {
  // Espera a que Firebase restaure la sesión antes de leer currentUser
  await auth.authStateReady();
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(true);
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API] Token enviado:', token.substring(0, 30) + '...');
  } else {
    console.warn('[API] Sin usuario autenticado — request sin token');
  }
  return config;
});

// Evento global para errores 401/403 (sin lógica de failover, ya que hay balanceador externo)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.error('[API] 401 recibido — el token fue rechazado por la API');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
