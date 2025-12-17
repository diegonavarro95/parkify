import api from './axios';

// 1. Enviar el ID escaneado para ver quién es y qué le toca (Entrada/Salida)
export const validarAcceso = async (id_vehiculo) => {
  const response = await api.post('/accesos/validar', { id_vehiculo });
  return response.data;
};

// 2. Confirmar la acción (Abrir la pluma)
export const registrarMovimiento = async (datos) => {
  // datos: { id_vehiculo, tipo_movimiento, id_cajon_moto (opcional) }
  const response = await api.post('/accesos/registrar', datos);
  return response.data;
};