import api from './axios';

export const getResumenStats = async () => (await api.get('/estadisticas/resumen')).data;
export const getGraficaStats = async (rango) => (await api.get(`/estadisticas/grafica?rango=${rango}`)).data;
export const getDetalleUsuarios = async () => (await api.get('/estadisticas/detalle-usuarios')).data;
export const getDetallePases = async () => (await api.get('/estadisticas/detalle-pases')).data;