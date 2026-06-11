import apiClient from './apiClient';

export const getCompras = () => apiClient.get('/api/compras');
export const getCompra  = (id) => apiClient.get(`/api/compras/${id}`);
export const getComprasMe = () => apiClient.get('/api/compras/me');
export const createCompra = (data) => apiClient.post('/api/compras', data);

// Facturación
export const getFacturacionXml       = (idCompra) => apiClient.post('/api/facturacion',                  { idCompra }, { responseType: 'text' });
export const getFacturacionDescargar = (idCompra) => apiClient.post('/api/facturacion/descargar',         { idCompra }, { responseType: 'blob' });
export const getFacturacionConsultar = (idCompra) => apiClient.get(`/api/facturacion/consultar/${idCompra}`);
