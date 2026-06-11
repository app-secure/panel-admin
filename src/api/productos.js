import apiClient from './apiClient';

// El backend crashea con onlyActive=false — se omite el parámetro para usar el default (true)
export const getProductos = () =>
  apiClient.get('/api/productos');
export const getProductosInactivos = () => apiClient.get('/api/productos/inactivos');
export const getProducto = (id) => apiClient.get(`/api/productos/${id}`);
export const createProducto = (data) => apiClient.post('/api/productos', data);
export const updateProducto = (id, data) => apiClient.put(`/api/productos/${id}`, data);
export const desactivarProducto = (id) => apiClient.delete(`/api/productos/${id}`);
export const activarProducto = (id) => apiClient.post(`/api/productos/${id}/activar`);

