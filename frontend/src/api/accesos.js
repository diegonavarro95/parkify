import api from './axios';

export const validarAcceso = async (idVehiculo) => {
  // Enviamos { id_vehiculo: 1 } al backend
  const response = await api.post('/accesos/validar', { id_vehiculo: idVehiculo });
  return response.data;
};

export const registrarMovimiento = async (datos) => {
  // datos = { id_vehiculo, tipo_movimiento, id_cajon_moto }
  const response = await api.post('/accesos/registrar', datos);
  return response.data;
};

export const obtenerHistorialAccesos = async () => {
  const response = await api.get('/accesos/historial');
  return response.data;
};