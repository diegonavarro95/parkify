import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import { useSocket } from '../../context/useSocket';

const MainLayout = () => {
  // Ya no necesitamos useAuth aquí para el socket, porque el SocketContext ya se encargó de la autenticación.
  // Solo traemos el socket del contexto.
  const { socket } = useSocket();

  useEffect(() => {
    // 1. Si el socket aún no existe (se está conectando), esperamos.
    if (!socket) return;

    // 2. Definimos qué hacer cuando llega una notificación (Mostrar Toast)
    const onNuevoReporte = (data) => {
      console.log("🔔 Alerta Global (Toast) Recibida");
      
      // Reproducir sonido (Opcional)
      try { new Audio('/notification.mp3').play().catch(() => {}); } catch (e) {}

      // Mostrar el Toast de react-hot-toast
      toast((t) => (
        <div onClick={() => toast.dismiss(t.id)} className="cursor-pointer flex items-start gap-3">
          <div className="bg-red-100 p-2 rounded-full text-red-600">
            <Bell size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-800">¡Nuevo Reporte!</p>
            <p className="text-sm text-slate-600">{data.mensaje}</p>
          </div>
        </div>
      ), { 
        duration: 5000, 
        position: 'top-right', 
        style: { borderLeft: '4px solid #ef4444' } 
      });
    };

    // 3. Empezar a escuchar el evento
    socket.on('nuevo_reporte_creado', onNuevoReporte);

    // 4. Limpieza: Dejar de escuchar si el componente se desmonta (para no duplicar toasts)
    return () => {
      socket.off('nuevo_reporte_creado', onNuevoReporte);
    };

  }, [socket]); // Este efecto se ejecuta cuando el socket esté listo

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-dark-bg">
      {/* Sidebar Fija */}
      <Sidebar />

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-dark-bg p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 