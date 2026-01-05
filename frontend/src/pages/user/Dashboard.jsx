import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, Bike, QrCode, Clock, MapPin, Plus, AlertTriangle, 
  ChevronRight, Calendar, Lock, History, X 
} from 'lucide-react';
import toast from 'react-hot-toast';

// Importaciones de Contexto y API
import { useAuth } from '../../context/AuthContext';
import { getMiDashboard } from '../../api/usuarios';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal'; 

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState('');
  
  // Estado para el modal de historial
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // 1. Redirección Admin
  useEffect(() => {
    if (user?.rol === 'admin_guardia') {
       navigate('/admin/estadisticas');
    }
  }, [user, navigate]);

  // 2. Cargar Datos
  useEffect(() => {
    if (user?.rol === 'admin_guardia') return;

    const fetchData = async () => {
      try {
        const result = await getMiDashboard();
        setData(result);
      } catch (error) {
        console.error(error);
        toast.error('Error cargando información');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // 3. Reloj en Vivo
  useEffect(() => {
    if (!data?.estatusActual) return;

    const calcularTiempo = () => {
      const start = new Date(data.estatusActual.hora_entrada);
      const now = new Date();
      const diff = now - start;
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeElapsed(`${hrs}h ${mins}m`);
    };

    calcularTiempo();
    const interval = setInterval(calcularTiempo, 60000);
    return () => clearInterval(interval);
  }, [data]);

  // --- LOGICA DE NOMBRE ---
  const nombreUsuario = user?.nombre_completo || 'Usuario'; 

  // --- LOGICA LIMITE VEHICULOS ---
  const numVehiculos = data?.vehiculos?.length || 0;
  const limiteAlcanzado = numVehiculos >= 2;

  if (user?.rol === 'admin_guardia') return null;
  if (loading) return <div className="p-10 text-center animate-pulse text-slate-400">Cargando tu espacio...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Hola, <span className="text-brand-600 capitalize">{nombreUsuario}</span> 👋
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Calendar size={16}/> {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => navigate('/mis-pases')} className="shadow-lg shadow-brand-500/30">
              <QrCode size={18} className="mr-2"/> Mi Código QR
           </Button>
        </div>
      </div>

      {/* --- GRID PRINCIPAL --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. TARJETA DE ESTADO (ADENTRO / AFUERA) */}
          {data?.estatusActual ? (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-white/20">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            ACTUALMENTE ADENTRO
                        </div>
                        <h2 className="text-4xl font-black tracking-tight">{timeElapsed || 'Calculando...'}</h2>
                        <p className="text-emerald-100 mt-1 text-sm">Tiempo transcurrido</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-4 min-w-[200px]">
                         <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-md">
                             {data.estatusActual.id_cajon_moto ? <Bike size={24}/> : <Car size={24}/>}
                         </div>
                         <div>
                             <p className="font-bold text-lg">{data.estatusActual.placas}</p>
                             <p className="text-xs text-emerald-100">{data.estatusActual.modelo}</p>
                         </div>
                    </div>
                </div>
                {/* 👇 CAMBIO AQUÍ: Mostrar Nombre Cajón en vez de ID */}
                {data.estatusActual.id_cajon_moto && (
                   <div className="mt-6 inline-flex items-center gap-2 bg-black/20 px-4 py-2 rounded-lg">
                      <MapPin size={18} className="text-yellow-400"/>
                      <span className="font-bold text-sm">
                          Cajón Asignado: {data.estatusActual.nombre_cajon || `M-${data.estatusActual.id_cajon_moto}`}
                      </span>
                   </div>
                )}
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-card rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                        <Car size={32} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Estás afuera</h2>
                        <p className="text-slate-500 text-sm mt-1">Escanea tu código QR en la entrada para iniciar el contador.</p>
                    </div>
                    <Button onClick={() => navigate('/mis-pases')} variant="outline">
                        Ver Pase
                    </Button>
                </div>
            </div>
          )}

          {/* 2. ACCIONES RÁPIDAS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Mis Vehículos */}
              <div onClick={() => navigate('/mis-vehiculos')} className="bg-white dark:bg-dark-card p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-brand-200 transition-all cursor-pointer group text-center">
                  <div className="w-10 h-10 mx-auto bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Car size={20}/>
                  </div>
                  <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Mis Autos</p>
              </div>

              {/* Registrar Auto (Con Lógica de Límite) */}
              <div 
                  onClick={() => navigate('/mis-vehiculos')} 
                  className={`p-4 rounded-xl border transition-all cursor-pointer group text-center ${
                      limiteAlcanzado 
                        ? 'bg-slate-50 border-slate-200 opacity-80 hover:bg-slate-100' // Estilo Bloqueado
                        : 'bg-white border-slate-200 hover:shadow-md hover:border-brand-200' // Estilo Activo
                  }`}
              >
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 transition-colors ${
                      limiteAlcanzado 
                        ? 'bg-slate-200 text-slate-500' 
                        : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                  }`}>
                      {limiteAlcanzado ? <Lock size={20}/> : <Plus size={20}/>}
                  </div>
                  <p className={`font-bold text-sm ${limiteAlcanzado ? 'text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                      {limiteAlcanzado ? 'Límite (2/2)' : 'Registrar'}
                  </p>
              </div>

              {/* Reportar */}
              <div onClick={() => navigate('/mis-reportes')} className="bg-white dark:bg-dark-card p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-brand-200 transition-all cursor-pointer group text-center">
                  <div className="w-10 h-10 mx-auto bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      <AlertTriangle size={20}/>
                  </div>
                  <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Reportes</p>
              </div>

              {/* Historial */}
              <div onClick={() => setHistoryModalOpen(true)} className="bg-white dark:bg-dark-card p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-brand-200 transition-all cursor-pointer group text-center">
                  <div className="w-10 h-10 mx-auto bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <History size={20}/>
                  </div>
                  <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Historial</p>
              </div>
          </div>

          {/* 3. LISTA RECIENTE (TIMELINE) */}
          <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Actividad Reciente</h3>
              <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                  {data?.historial?.length === 0 ? (
                      <p className="text-slate-400 text-center py-4">Aún no tienes movimientos registrados.</p>
                  ) : (
                      <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-700">
                          {data?.historial?.map((item, idx) => (
                              <div key={idx} className="relative pl-8">
                                  <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-dark-card ${
                                      item.tipo === 'entrada' ? 'bg-emerald-500' : 'bg-slate-400'
                                  }`}></div>
                                  
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <p className="font-bold text-slate-800 dark:text-white text-sm">
                                              {item.tipo === 'entrada' ? 'Entrada al estacionamiento' : 'Salida del estacionamiento'}
                                          </p>
                                          <p className="text-xs text-slate-500 mt-0.5">
                                              {item.modelo} • <span className="font-mono">{item.placas}</span>
                                          </p>
                                      </div>
                                      <div className="text-right">
                                          <span className="text-xs font-bold text-slate-400 block">
                                              {new Date(item.fecha_hora).toLocaleDateString()}
                                          </span>
                                          <span className="text-xs text-slate-500">
                                              {new Date(item.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </span>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>

        </div>

        {/* COLUMNA DERECHA (1/3) */}
        <div className="space-y-6">
           {/* MIS VEHÍCULOS (Mini Lista) */}
           <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
               <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-slate-800 dark:text-white">Mis Vehículos</h3>
                   <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${limiteAlcanzado ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                       {numVehiculos} / 2
                   </span>
               </div>
               <div className="space-y-3">
                   {numVehiculos === 0 ? (
                       <p className="text-sm text-slate-500 text-center py-4">No tienes vehículos.</p>
                   ) : (
                       data?.vehiculos?.map(v => (
                           <div key={v.id_vehiculo} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                               <div className="w-10 h-10 rounded-lg bg-white overflow-hidden shadow-sm flex items-center justify-center">
                                   {v.foto ? (
                                       <img src={v.foto} className="w-full h-full object-cover"/>
                                   ) : (
                                       v.tipo === 'motocicleta' ? <Bike size={18} className="text-slate-400"/> : <Car size={18} className="text-slate-400"/>
                                   )}
                               </div>
                               <div className="flex-1 min-w-0">
                                   <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{v.modelo}</p>
                                   <p className="text-xs text-slate-500 truncate">{v.placas}</p>
                               </div>
                           </div>
                       ))
                   )}
                   <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate('/mis-vehiculos')}>
                       Gestionar <ChevronRight size={14} className="ml-1"/>
                   </Button>
               </div>
           </div>
        </div>

      </div>

      {/* --- MODAL HISTORIAL --- */}
      <Modal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title="Historial de Accesos">
         <div className="space-y-4">
            {data?.historial?.length === 0 ? (
                <p className="text-center text-slate-500 py-10">No hay historial disponible.</p>
            ) : (
                <div className="space-y-0 divide-y divide-slate-100">
                    {data?.historial?.map((item, idx) => (
                        <div key={idx} className="py-4 flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                 <div className={`p-2 rounded-full ${item.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                     {item.tipo === 'entrada' ? <ChevronRight size={18}/> : <X size={18}/>}
                                 </div>
                                 <div>
                                     <p className="font-bold text-slate-800 text-sm capitalize">{item.tipo}</p>
                                     <p className="text-xs text-slate-500">{item.modelo} ({item.placas})</p>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <p className="text-xs font-bold text-slate-600">{new Date(item.fecha_hora).toLocaleDateString()}</p>
                                 <p className="text-xs text-slate-400">{new Date(item.fecha_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                             </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="pt-4 flex justify-end">
                <Button variant="outline" onClick={() => setHistoryModalOpen(false)}>Cerrar</Button>
            </div>
         </div>
      </Modal>

    </div>
  );
};

export default Dashboard;