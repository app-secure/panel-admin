import axios from 'axios';
import { auth } from './firebase';

const MASTER = import.meta.env.VITE_API_MASTER;
const BACKUP = import.meta.env.VITE_API_BACKUP;

const apiClient = axios.create({
  baseURL: MASTER,
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

// Failover master→backup + evento global para errores 401/403
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isMasterRequest =
      originalRequest.baseURL === MASTER || originalRequest.url?.startsWith(MASTER);
    const alreadyRetried = originalRequest._retried;
    const isNetworkOrServer =
      !error.response || (error.response.status >= 500 && error.response.status <= 599);

    if (isNetworkOrServer && !alreadyRetried && isMasterRequest) {
      originalRequest._retried = true;
      const backupUrl = originalRequest.url?.replace(MASTER, '') ?? originalRequest.url;
      return apiClient({ ...originalRequest, baseURL: BACKUP, url: backupUrl });
    }

    if (error.response?.status === 401) {
      console.error('[API] 401 recibido — el token fue rechazado por la API');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
