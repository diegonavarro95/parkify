import api from './axios';

export const obtenerMisReportes = async () => {
  const response = await api.get('/reportes/mis-reportes');
  return response.data;
};

export const crearReporte = async (datos) => {
  const formData = new FormData();

  formData.append('asunto', datos.asunto);
  formData.append('descripcion', datos.descripcion);

  // CORRECCIÓN AQUÍ:
  // Tu formulario de React (MisReportes.jsx) recoge los archivos en la variable 'fotos'.
  // Pero tu Backend (route) espera recibir el campo llamado 'evidencia'.
  if (datos.fotos && datos.fotos.length > 0) {
    for (let i = 0; i < datos.fotos.length; i++) {
      // Cambiamos 'fotos' por 'evidencia' para que Multer lo acepte
      formData.append('evidencia', datos.fotos[i]); 
    }
  }

  const response = await api.post('/reportes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
  return response.data;
};