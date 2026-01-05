import axios from 'axios';

// Usamos variables de entorno para la URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', // Asegúrate que el puerto coincida con tu backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Interceptor de SOLICITUD (Request)
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el error es 401 (No autorizado) o 403 (Prohibido)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      
      // 1. Limpiar basura local siempre por seguridad
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      
      // 2. LÓGICA CORREGIDA:
      // Solo forzamos la redirección si NO estamos ya en la página de login.
      // Esto permite que el LoginPage maneje el error 403 y muestre la alerta sin recargar.
      if (window.location.pathname !== '/login') {
          console.warn('Sesión expirada o acceso denegado. Redirigiendo al login...');
          window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;