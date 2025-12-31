// frontend/src/api/socket.js
import io from 'socket.io-client';

// Creamos la conexión UNA sola vez
export const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  transports: ['websocket'],
  withCredentials: true,
  autoConnect: true
});