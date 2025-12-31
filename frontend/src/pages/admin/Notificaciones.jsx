import { useState, useEffect } from 'react';
import { Bell, Check, FileText, ShieldAlert, Info } from 'lucide-react';
import io from 'socket.io-client';
import api from '../../api/axios';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext'; // <--- IMPORTANTE

// Creamos la conexión para esta página
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    transports: ['websocket'],
    withCredentials: true
});

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // <--- Necesitamos saber quién es el usuario

  // 1. Cargar historial de la BD
  const cargarNotificaciones = async () => {
    try {
      const res = await api.get('/notificaciones');
      setNotificaciones(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarNotificaciones();

    // 2. CONECTAR Y ESCUCHAR EN TIEMPO REAL
    socket.on('connect', () => {
        // En cuanto conecte, nos identificamos para entrar a la "sala_admins"
        // Si no hacemos esto, este componente es "anónimo" y no recibe nada.
        if (user && user.rol === 'admin_guardia') {
            console.log("📡 Lista de Notificaciones: Identificándose...");
            socket.emit('identificarse', { 
                id: user.id_usuario, 
                nombre: user.nombre_completo, 
                rol: user.rol 
            });
        }
    });

    socket.on('nuevo_reporte_creado', (data) => {
      console.log('⬇️ Agregando a la lista:', data);

      // Creamos el objeto visualmente idéntico al de la BD
      const nuevaNotificacion = {
        id_notificacion: Date.now(), // ID temporal único
        id_usuario: user?.id_usuario,
        titulo: 'Nuevo Reporte de Incidencia',
        mensaje: data.mensaje || `Un usuario ha reportado: "${data.asunto}"`,
        tipo: 'reporte',
        leida: false,
        fecha_creacion: new Date().toISOString() // Fecha actual
      };

      // Agregamos al principio de la lista (Spread operator)
      setNotificaciones((prev) => [nuevaNotificacion, ...prev]);
    });

    return () => {
      socket.off('connect');
      socket.off('nuevo_reporte_creado');
    };
  }, [user]); // <--- Se re-ejecuta si el usuario carga

  // --- Funciones de interacción (Iguales que antes) ---
  const marcarComoLeida = async (id) => {
    try {
      await api.put(`/notificaciones/${id}/leer`);
      setNotificaciones(prev => 
        prev.map(n => n.id_notificacion === id ? { ...n, leida: true } : n)
      );
    } catch (error) {
      console.error(error);
    }
  };

  const marcarTodoLeido = async () => {
      try {
          await api.put('/notificaciones/leer-todas');
          setNotificaciones(prev => prev.map(n => ({...n, leida: true})));
          toast.success("Todo marcado como leído");
      } catch (error) {
          toast.error("Error al actualizar");
      }
  }

  const getIcon = (tipo) => {
      switch(tipo) {
          case 'reporte': return <FileText className="text-orange-500" />;
          case 'seguridad': return <ShieldAlert className="text-red-500" />;
          default: return <Info className="text-blue-500" />;
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Centro de Notificaciones</h1>
            <p className="text-slate-500">Historial de alertas y avisos del sistema.</p>
        </div>
        <Button variant="outline" onClick={marcarTodoLeido} icon={Check}>
            Marcar todo como leído
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10 animate-pulse text-slate-400">Cargando historial...</div>
      ) : notificaciones.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-800 inline-block p-4 rounded-full mb-4">
                <Bell size={40} className="text-slate-300" />
            </div>
            <p className="text-slate-500">No tienes notificaciones recientes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificaciones.map((notif) => (
            <div 
                key={notif.id_notificacion}
                onClick={() => !notif.leida && marcarComoLeida(notif.id_notificacion)}
                className={`
                    relative p-4 rounded-xl border transition-all cursor-pointer flex gap-4 items-start animate-fade-in
                    ${notif.leida 
                        ? 'bg-white dark:bg-dark-card border-slate-200 dark:border-slate-700 opacity-75 hover:opacity-100' 
                        : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transform hover:-translate-y-0.5'}
                `}
            >
                {!notif.leida && (
                    <span className="absolute top-4 right-4 w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                )}

                <div className="mt-1 bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                    {getIcon(notif.tipo)}
                </div>

                <div className="flex-1">
                    <h3 className={`font-bold text-base ${notif.leida ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {notif.titulo}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {notif.mensaje}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                        {new Date(notif.fecha_creacion).toLocaleString()}
                    </p>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notificaciones;