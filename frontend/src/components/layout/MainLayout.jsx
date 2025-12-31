import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

// 👇 1. Asegúrate que este puerto sea el correcto (donde corre tu backend)
const socket = io('http://localhost:5000', {
  transports: ['websocket'], // Forzar websocket para evitar errores de polling
  withCredentials: true
});

const MainLayout = () => {
  const { user } = useAuth();

  useEffect(() => {
    // 👇 2. DEBUGGING: Ver si conecta
    socket.on('connect', () => {
      console.log("🟢 Socket conectado al servidor con ID:", socket.id);
      
      // Si el usuario ya cargó, nos identificamos inmediatamente al conectar
      if (user) {
        enviarIdentificacion();
      }
    });

    // Función para unirse a la sala
    const enviarIdentificacion = () => {
      if (user && user.rol === 'admin_guardia') {
        console.log("📤 Enviando identificación de admin...");
        socket.emit('identificarse', { 
          id: user.id_usuario, // Asegúrate que tu objeto user tenga este campo
          nombre: user.nombre_completo, 
          rol: user.rol 
        });
      }
    };

    // Intentar identificarse si el usuario cambia (login)
    if (user) {
      enviarIdentificacion();
    }

    // 👇 3. ESCUCHAR LA NOTIFICACIÓN
    socket.on('nuevo_reporte_creado', (data) => {
      console.log("🔔 ALERTA RECIBIDA:", data); // Mira la consola del navegador

      // Reproducir sonido
      try {
        const audio = new Audio('/notification.mp3'); 
        audio.play().catch(e => console.log('Audio autoplay bloqueado'));
      } catch (e) {}

      // Mostrar Toast
      toast((t) => (
        <div onClick={() => toast.dismiss(t.id)} className="cursor-pointer flex items-start gap-3">
          <div className="bg-red-100 p-2 rounded-full text-red-600">
            <Bell size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-800">¡Nuevo Reporte!</p>
            <p className="text-sm text-slate-600">
              {data.mensaje}
            </p>
          </div>
        </div>
      ), {
        duration: 5000,
        position: 'top-right',
        style: { borderLeft: '4px solid #ef4444' }
      });
    });

    return () => {
      socket.off('connect');
      socket.off('nuevo_reporte_creado');
    };
  }, [user]);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-dark-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-dark-bg p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;