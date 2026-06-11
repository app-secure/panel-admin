import apiClient from './apiClient';

export const loginUsuario = (email, password) =>
  apiClient.post('/api/usuarios/login', { email, password });

export const getUsuarios = () => apiClient.get('/api/usuarios');
export const getUsuariosInactivos = () => apiClient.get('/api/usuarios/inactivos');
export const getUsuario = (id) => apiClient.get(`/api/usuarios/${id}`);
export const getUsuarioPorCedula = (cedula) => apiClient.get(`/api/usuarios/cedula/${cedula}`);
export const createUsuario = (data) => apiClient.post('/api/usuarios/registro', data);
export const updateUsuario = (id, data) => apiClient.put(`/api/usuarios/${id}`, data);
export const desactivarUsuario = (id) => apiClient.delete(`/api/usuarios/${id}`);
export const activarUsuario = (id) => apiClient.post(`/api/usuarios/${id}/activar`);

