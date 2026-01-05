import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { Bell, Check, FileText, ShieldAlert, Info, Trash2, ArrowRightLeft, MapPin } from 'lucide-react';
import api from '../../api/axios';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal'; // <--- IMPORT AGREGADO
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/useSocket';

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // Estado para el modal de confirmación
  const [confirmarLimpiar, setConfirmarLimpiar] = useState(false); 

  // --- CARGA INICIAL ---
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
  }, []);

  // --- ESCUCHA EN TIEMPO REAL ---
  useEffect(() => {
    if (!socket) return;

    const agregarAlFeed = (nuevaNotif) => {
        setNotificaciones((prev) => [nuevaNotif, ...prev]);
        const audio = new Audio('/notification.mp3'); 
        audio.play().catch(e => {}); 
    };

    const handleNuevoReporte = (data) => {
      agregarAlFeed({
        id_notificacion: `temp-${Date.now()}`,
        titulo: 'Nuevo Reporte de Incidencia',
        mensaje: data.mensaje || `Asunto: ${data.asunto}`,
        tipo: 'reporte',
        leida: false,
        fecha_creacion: new Date().toISOString()
      });
    };

    const handleNuevoMovimiento = (data) => {
        agregarAlFeed({
            id_notificacion: `mov-${Date.now()}`,
            titulo: `Registro de ${data.tipo?.toUpperCase() || 'MOVIMIENTO'}`,
            mensaje: data.mensaje,
            tipo: 'movimiento', 
            leida: false,
            fecha_creacion: new Date().toISOString()
        });
    };

    socket.on('nuevo_reporte_creado', handleNuevoReporte);
    socket.on('nuevo_movimiento', handleNuevoMovimiento);

    return () => {
      socket.off('nuevo_reporte_creado', handleNuevoReporte);
      socket.off('nuevo_movimiento', handleNuevoMovimiento);
    };
  }, [socket]);

  // --- ACCIONES ---

  const marcarComoLeida = async (id) => {
    if (typeof id === 'string' && (id.startsWith('temp-') || id.startsWith('mov-'))) {
        setNotificaciones(prev => prev.map(n => n.id_notificacion === id ? { ...n, leida: true } : n));
        return;
    }
    try {
      await api.put(`/notificaciones/${id}/leer`);
      setNotificaciones(prev => prev.map(n => n.id_notificacion === id ? { ...n, leida: true } : n));
    } catch (error) { console.error(error); }
  };

  const marcarTodoLeido = async () => {
      try {
          await api.put('/notificaciones/leer-todas');
          setNotificaciones(prev => prev.map(n => ({...n, leida: true})));
          toast.success("Todo marcado como leído");
      } catch (error) { toast.error("Error al actualizar"); }
  };

  // 1. Función que abre el modal (reemplaza al confirm nativo)
  const limpiarTodo = () => {
      if (notificaciones.length === 0) return;
      setConfirmarLimpiar(true);
  };

  // 2. Función que ejecuta la limpieza real
  const ejecutarLimpieza = async () => {
      try {
          await api.delete('/notificaciones'); 
          setNotificaciones([]);
          toast.success("Historial eliminado correctamente");
          setConfirmarLimpiar(false);
      } catch (error) {
          console.error(error);
          toast.error("Error al limpiar el historial");
      }
  };

  // --- NAVEGACIÓN INTELIGENTE ---
  const handleNotificationClick = (notif) => {
    if (!notif.leida) {
        marcarComoLeida(notif.id_notificacion);
    }

    switch (notif.tipo) {
        case 'reporte':
            navigate('/admin/reportes'); 
            break;
        
        case 'movimiento':
        case 'seguridad':
            navigate('/admin/accesos'); 
            break;
        
        case 'mapa':
            navigate('/admin/mapa-motos');
            break;

        default:
            break;
    }
  };

  const getIcon = (tipo) => {
      switch(tipo) {
          case 'reporte': return <FileText className="text-orange-500" />;
          case 'movimiento': return <ArrowRightLeft className="text-emerald-500" />;
          case 'mapa': return <MapPin className="text-purple-500" />;
          case 'seguridad': return <ShieldAlert className="text-red-500" />;
          default: return <Info className="text-blue-500" />;
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Centro de Notificaciones</h1>
            <p className="text-slate-500">Historial de alertas, accesos y reportes.</p>
        </div>
        
        <div className="flex gap-2">
            <Button variant="outline" onClick={marcarTodoLeido} icon={Check} size="sm">Leído</Button>
            <Button variant="ghost" onClick={limpiarTodo} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" icon={Trash2} size="sm">Limpiar</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 animate-pulse text-slate-400">Cargando historial...</div>
      ) : notificaciones.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <Bell size={40} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-slate-900 dark:text-white font-medium">Sin notificaciones</h3>
            <p className="text-slate-500 text-sm">Estás al día con la actividad del sistema.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificaciones.map((notif) => (
            <div 
                key={notif.id_notificacion}
                onClick={() => handleNotificationClick(notif)}
                className={`
                    relative p-4 rounded-xl border transition-all cursor-pointer flex gap-4 items-start animate-slide-up group
                    ${notif.leida 
                        ? 'bg-white dark:bg-dark-card border-slate-200 dark:border-slate-700 opacity-75 hover:opacity-100' 
                        : 'bg-white dark:bg-slate-800 border-brand-200 dark:border-brand-700 shadow-md ring-1 ring-brand-100 dark:ring-brand-900/50 transform hover:-translate-y-0.5'}
                `}
            >
                {!notif.leida && (
                    <span className="absolute top-4 right-4 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                    </span>
                )}

                <div className={`mt-1 p-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 ${notif.leida ? 'bg-slate-100 dark:bg-slate-900' : 'bg-white dark:bg-slate-800'}`}>
                    {getIcon(notif.tipo)}
                </div>

                <div className="flex-1 pr-6">
                    <div className="flex justify-between items-start">
                        <h3 className={`font-bold text-base ${notif.leida ? 'text-slate-700 dark:text-slate-400' : 'text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors'}`}>
                            {notif.titulo}
                        </h3>
                    </div>
                    
                    <p className={`text-sm mt-1 leading-relaxed ${notif.leida ? 'text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {notif.mensaje}
                    </p>
                    
                    <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
                        <ClockSize12 />
                        {new Date(notif.fecha_creacion).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        
                        <span className="ml-auto text-brand-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver detalles →
                        </span>
                    </p>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL CONFIRMACIÓN DE LIMPIEZA --- */}
      <Modal isOpen={confirmarLimpiar} onClose={() => setConfirmarLimpiar(false)} title="Confirmar Limpieza">
          <div className="text-center p-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 bg-red-100 dark:bg-red-900/30">
                  <Trash2 className="h-8 w-8 text-red-600 dark:text-red-500" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  ¿Borrar todo el historial?
              </h3>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Esta acción eliminará permanentemente todas las notificaciones de tu bandeja. No podrás recuperarlas.
              </p>

              <div className="flex justify-center gap-3">
                  <Button variant="ghost" onClick={() => setConfirmarLimpiar(false)}>Cancelar</Button>
                  <Button 
                      className="bg-red-600 hover:bg-red-700 text-white border-none"
                      onClick={ejecutarLimpieza}
                  >
                      Sí, eliminar todo
                  </Button>
              </div>
          </div>
      </Modal>

    </div>
  );
};

const ClockSize12 = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

export default Notificaciones;