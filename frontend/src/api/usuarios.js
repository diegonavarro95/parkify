import api from './axios';

export const getMiDashboard = async () => {
  const response = await api.get('/usuarios/dashboard');
  return response.data;
};