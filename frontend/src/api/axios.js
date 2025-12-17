import axios from 'axios';

// Usamos variables de entorno para la URL
// NOTA: Si tu backend corre en el puerto 5000, cambia el 3000 de abajo por 5000.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Interceptor de SOLICITUD (Request)
// Inyecta el token automáticamente antes de que la petición salga
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Interceptor de RESPUESTA (Response)
// Maneja los errores globales (Token vencido o Acceso denegado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el error es 401 (No autorizado) o 403 (Prohibido)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      
      console.warn('Sesión expirada o acceso denegado. Redirigiendo al login...');
      
      // 1. Limpiar basura local
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      
      // 2. FORZAR la redirección al Login (Esto rompe el bucle infinito)
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;