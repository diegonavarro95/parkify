import api from './axios';

export const obtenerMisVehiculos = async () => {
  const response = await api.get('/vehiculos/mis-vehiculos');
  return response.data;
};

export const registrarVehiculo = async (datosVehiculo) => {
  // Cuando subimos archivos, no podemos enviar JSON normal.
  // Necesitamos usar FormData.
  const formData = new FormData();
  
  formData.append('placas', datosVehiculo.placas);
  formData.append('marca', datosVehiculo.marca);
  formData.append('modelo', datosVehiculo.modelo);
  formData.append('color', datosVehiculo.color);
  formData.append('tipo', datosVehiculo.tipo);
  
  // 'foto' debe coincidir con el nombre que pusimos en Multer en el Backend (upload.single('foto'))
  if (datosVehiculo.foto && datosVehiculo.foto[0]) {
    formData.append('foto', datosVehiculo.foto[0]);
  }

  const response = await api.post('/vehiculos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // Indispensable para subir archivos
    },
  });
  
  return response.data;
};

export const eliminarVehiculo = async (id_vehiculo) => {
  const response = await api.delete(`/vehiculos/${id_vehiculo}`);
  return response.data;
};