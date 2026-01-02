import { useEffect, useState } from 'react'; // Agregamos useState
import { Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, Menu } from 'lucide-react'; // Agregamos icono Menu
import Sidebar from './Sidebar';
import { useSocket } from '../../context/useSocket'; // Tu import original

const MainLayout = () => {
  const { socket } = useSocket();
  
  // 1. Estado para controlar el Sidebar en móvil
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const onNuevoReporte = (data) => {
      console.log("🔔 Alerta Global (Toast) Recibida");
      try { new Audio('/notification.mp3').play().catch(() => {}); } catch (e) {}

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

    socket.on('nuevo_reporte_creado', onNuevoReporte);

    return () => {
      socket.off('nuevo_reporte_creado', onNuevoReporte);
    };

  }, [socket]);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-dark-bg overflow-hidden">
      
      {/* 2. Pasamos props al Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* 3. Header Móvil (Solo visible en pantallas pequeñas) */}
        <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 h-16 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
               {/* Logo pequeño en header móvil */}
               <img src="/parkify.png" alt="Logo" className="w-8 h-8 object-contain"/>
               <span className="font-black text-brand-600">PARKIFY</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
        </header>

        {/* Área de Contenido */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-dark-bg p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;