import { useEffect, useState, useRef } from 'react'; // Quitamos createContext de aquí
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast'; // Importamos toast
import { Car, ArrowRight, CheckCircle } from 'lucide-react'; // Iconos

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

    const onNuevoMovimiento = (data) => {
      // data trae: { tipo, placas, descripcion, hora, cajon }
      
      // Reproducir sonidito (opcional)
      const audio = new Audio('/notification.mp3'); // Si tienes uno
      audio.play().catch(e => {}); 

      // Mostrar Toast Personalizado
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 ${
             data.tipo === 'entrada' ? 'border-l-emerald-500' : 'border-l-orange-500'
          }`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                {/* Icono dinámico */}
                {data.tipo === 'entrada' 
                    ? <CheckCircle className="h-10 w-10 text-emerald-500" />
                    : <ArrowRight className="h-10 w-10 text-orange-500" />
                }
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {data.tipo === 'entrada' ? 'Entrada Registrada' : 'Salida Registrada'}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                  <span className="font-bold">{data.placas}</span> - {data.descripcion}
                </p>
                {data.cajon && (
                    <p className="mt-1 text-xs font-bold text-yellow-600 bg-yellow-50 inline-block px-2 py-0.5 rounded">
                        Cajón: {data.cajon}
                    </p>
                )}
                <p className="mt-1 text-xs text-slate-400">{data.hora}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200 dark:border-slate-700">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-brand-600 hover:text-brand-500 focus:outline-none"
            >
              Cerrar
            </button>
          </div>
        </div>
      ), { duration: 5000 });
    };

    newSocket.on('connect', onConnect);
    newSocket.on('nuevo_movimiento', onNuevoMovimiento);
    newSocket.on('connect_error', (err) => console.error("🔴 Error Socket:", err.message));

    if (newSocket.connected) onConnect();

    return () => {
      newSocket.off('connect', onConnect);
      newSocket.off('nuevo_movimiento', onNuevoMovimiento);
    };
  }, [user]);

  return (
    // Usamos el objeto importado
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};  