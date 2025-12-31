import { useEffect, useState, useRef } from 'react'; // Quitamos createContext de aquí
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

// 👇 CAMBIO 1: Importamos el contexto en lugar de crearlo
import { SocketContext } from './SocketContextObject';

// 👇 CAMBIO 2: Quitamos el "export const SocketContext = ..." porque ya lo importamos arriba

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    // Si no hay usuario, limpiar
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    if (socketRef.current && socketRef.current.connected) {
      return;
    }

    // --- Lógica Inteligente de URL (MANTENER IGUAL) ---
    const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketURL = envUrl.replace('/api', '').replace(/\/$/, '');
    // ------------------------------------------------

    const newSocket = io(socketURL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    const onConnect = () => {
      console.log("🟢 Socket conectado:", newSocket.id);
      if (user.rol === 'admin_guardia') {
        newSocket.emit('identificarse', { 
          id: user.id_usuario, 
          nombre: user.nombre_completo, 
          rol: user.rol 
        });
      }
    };

    newSocket.on('connect', onConnect);
    newSocket.on('connect_error', (err) => console.error("🔴 Error Socket:", err.message));

    if (newSocket.connected) onConnect();

    return () => {
      newSocket.off('connect', onConnect);
    };
  }, [user]);

  return (
    // Usamos el objeto importado
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};  