import { useState, useEffect, useMemo } from 'react';
import { 
  Search, Calendar, Clock, MapPin, User, Car, 
  Bike, LogIn, LogOut, AlertCircle, X, ZoomIn 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { obtenerHistorialAccesos } from '../../api/accesos';
import InteractiveCard from '../../components/common/InteractiveCard';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

const HistorialAccesos = () => {
  const [accesos, setAccesos] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Filtros ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos'); 
  const [filterUsuario, setFilterUsuario] = useState('todos'); 

  // --- Modales ---
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAcceso, setSelectedAcceso] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await obtenerHistorialAccesos();
      setAccesos(data);
    } catch (error) {
      toast.error('Error cargando historial');
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica de Filtrado ---
  const filteredAccesos = useMemo(() => {
    return accesos.filter(acceso => {
      const term = searchTerm.toLowerCase();
      const matchesText = 
        acceso.placas.toLowerCase().includes(term) ||
        acceso.conductor.toLowerCase().includes(term) ||
        acceso.modelo.toLowerCase().includes(term);

      let matchesEstado = true;
      if (filterEstado === 'adentro') matchesEstado = acceso.fecha_hora_salida === null;
      if (filterEstado === 'afuera') matchesEstado = acceso.fecha_hora_salida !== null;

      let matchesUsuario = true;
      if (filterUsuario === 'comunidad') matchesUsuario = acceso.tipo_usuario === 'comunidad_escom';
      if (filterUsuario === 'visitante') matchesUsuario = acceso.tipo_usuario === 'visitante';

      return matchesText && matchesEstado && matchesUsuario;
    });
  }, [accesos, searchTerm, filterEstado, filterUsuario]);

  // --- 1. LÓGICA DE TIEMPOS ---
  const calcularDuracion = (entrada, salida) => {
    const inicio = new Date(entrada);
    const fin = salida ? new Date(salida) : new Date();
    const diffMs = fin - inicio;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    
    if (diffHrs > 0) return `${diffHrs}h ${diffMins}m`;
    return `${diffMins} min`;
  };

  // --- 2. LÓGICA DE PASE (CORREGIDA) ---
  // Usamos 'fecha_vencimiento' que viene directo de la BD
  const calcularEstadoPase = (fechaVencimiento) => {
    if (!fechaVencimiento) return { texto: 'Sin datos', color: 'text-slate-500 bg-slate-100' };

    const vencimiento = new Date(fechaVencimiento);
    const ahora = new Date();
    const diffMs = vencimiento - ahora;

    if (diffMs < 0) return { texto: 'Vencido', color: 'text-red-600 bg-red-50' };
    
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (dias > 0) return { texto: `${dias} días restantes`, color: 'text-emerald-600 bg-emerald-50' };
    return { texto: `${horas} horas restantes`, color: 'text-orange-600 bg-orange-50' };
  };

  // --- 3. HELPER PARA AVATAR (INICIALES) ---
  const getIniciales = (nombre) => {
    if (!nombre) return '??';
    const partes = nombre.trim().split(/\s+/); // Divide por espacios
    
    // Caso: Diego Navarro -> DN
    if (partes.length >= 2) {
        return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    // Caso: Camila -> CA (Las dos primeras letras)
    return nombre.substring(0, 2).toUpperCase();
  };

  // --- FORMATO DE FECHA ---
  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return {
        fecha: date.toLocaleDateString(),
        hora: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const abrirDetalle = (acc) => {
    setSelectedAcceso(acc);
    setModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Header y Buscador */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Car className="text-brand-600" />
                Historial de Accesos
            </h1>
            <p className="text-slate-500 mt-1">Monitoreo en tiempo real de entradas y salidas.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Buscador */}
            <div className="relative group flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar placas, nombre..." 
                    className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* Filtros */}
            <select 
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm focus:outline-none dark:bg-slate-800 dark:text-white dark:border-slate-700"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
            >
                <option value="todos">Todos los Estados</option>
                <option value="adentro">🟢 Adentro</option>
                <option value="afuera">⚪ Salieron</option>
            </select>

            <select 
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm focus:outline-none dark:bg-slate-800 dark:text-white dark:border-slate-700"
                value={filterUsuario}
                onChange={(e) => setFilterUsuario(e.target.value)}
            >
                <option value="todos">Todos los Usuarios</option>
                <option value="comunidad">🎓 Comunidad ESCOM</option>
                <option value="visitante">👤 Visitantes</option>
            </select>
        </div>
      </div>

      {/* Lista de Tarjetas */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 animate-pulse">Cargando historial...</div>
      ) : filteredAccesos.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-dark-card rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500">No se encontraron accesos con estos filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccesos.map((acc) => {
                const estaAdentro = acc.fecha_hora_salida === null;
                const statusPase = calcularEstadoPase(acc.fecha_vencimiento);
                const entrada = formatDateTime(acc.fecha_hora_entrada);
                const salida = formatDateTime(acc.fecha_hora_salida);
                
                return (
                    <InteractiveCard 
                        key={acc.id_acceso} 
                        onClick={() => abrirDetalle(acc)}
                        className={`border-l-4 ${estaAdentro ? 'border-l-emerald-500' : 'border-l-slate-300'}`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${estaAdentro ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {estaAdentro ? 'Adentro' : 'Finalizado'}
                                </span>
                                {acc.tipo_vehiculo === 'motocicleta' ? <Bike size={16} className="text-slate-400"/> : <Car size={16} className="text-slate-400"/>}
                            </div>
                            {/* AQUÍ ELIMINÉ EL #ID QUE ME PEDISTE */}
                        </div>

                        {/* Info Principal */}
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{acc.placas}</h3>
                            <p className="text-sm text-slate-500">{acc.modelo} • {acc.color}</p>
                        </div>

                        {/* Tiempos (Fecha Y Hora) */}
                        <div className="space-y-3 text-sm border-t border-slate-100 dark:border-slate-700 pt-3">
                            
                            {/* Entrada */}
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-1 text-slate-500 font-medium"><LogIn size={14}/> Entrada:</span>
                                <div className="text-right">
                                    <div className="text-xs text-slate-400">{entrada.fecha}</div>
                                    <div className="font-bold text-slate-700 dark:text-slate-200">{entrada.hora} hrs</div>
                                </div>
                            </div>
                            
                            {/* Salida o Duración */}
                            {estaAdentro ? (
                                <div className="flex justify-between items-center bg-emerald-50/50 p-1.5 rounded">
                                    <span className="flex items-center gap-1 text-emerald-600 font-bold"><Clock size={14}/> Tiempo:</span>
                                    <span className="font-bold text-emerald-700">{calcularDuracion(acc.fecha_hora_entrada)}</span>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center text-slate-400">
                                    <span className="flex items-center gap-1"><LogOut size={14}/> Salida:</span>
                                    <div className="text-right">
                                        <div className="text-xs opacity-80">{salida.fecha}</div>
                                        <div>{salida.hora} hrs</div>
                                    </div>
                                </div>
                            )}

                            {/* Alerta de Pase */}
                            <div className={`flex justify-between px-2 py-1 rounded text-xs ${statusPase.color}`}>
                                <span className="flex items-center gap-1 font-semibold"><AlertCircle size={12}/> Pase:</span>
                                <span className="font-bold">{statusPase.texto}</span>
                            </div>
                        </div>

                        {/* Usuario Mini (AVATAR RED SOCIAL) */}
                        <div className="mt-4 flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                {getIniciales(acc.conductor)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-300 leading-none mb-0.5">
                                    {acc.conductor}
                                </p>
                                <p className="truncate text-xs text-slate-400 capitalize">
                                    {acc.tipo_usuario?.replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                    </InteractiveCard>
                );
            })}
        </div>
      )}

      {/* --- MODAL DETALLE --- */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Detalle de Acceso">
        {selectedAcceso && (
            <div className="space-y-6">
                
                {/* Header Vehículo */}
                <div className="flex gap-4">
                    <div 
                        className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 relative group cursor-pointer border border-slate-200"
                        onClick={() => { if(selectedAcceso.foto_vehiculo) setImageModalOpen(true) }}
                    >
                        {selectedAcceso.foto_vehiculo ? (
                            <>
                                <img src={selectedAcceso.foto_vehiculo} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Vehículo" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <ZoomIn className="text-white drop-shadow-md" />
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Car size={32} />
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedAcceso.placas}</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300">{selectedAcceso.marca} {selectedAcceso.modelo}</p>
                        <div className="flex gap-2 mt-2">
                             <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-bold uppercase">{selectedAcceso.color}</span>
                             <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-bold uppercase">{selectedAcceso.tipo_vehiculo}</span>
                        </div>
                    </div>
                </div>

                {/* Info Conductor y Status */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold mb-2">Conductor</p>
                        <div className="flex items-center gap-2">
                             {/* Avatar en Modal también */}
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                {getIniciales(selectedAcceso.conductor)}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white text-sm leading-tight">
                                    {selectedAcceso.conductor}
                                </p>
                                <p className="text-xs text-slate-500 capitalize">
                                    {selectedAcceso.tipo_usuario?.replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold mb-2">Estado Pase</p>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${calcularEstadoPase(selectedAcceso.fecha_vencimiento).color}`}>
                            <AlertCircle size={14} /> {calcularEstadoPase(selectedAcceso.fecha_vencimiento).texto}
                        </div>
                    </div>
                </div>

                {/* Timeline de Tiempos */}
                <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6 py-2">
                    {/* Entrada */}
                    <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-dark-bg"></div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Entrada Registrada</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar size={12}/> {new Date(selectedAcceso.fecha_hora_entrada).toLocaleDateString()}
                            <Clock size={12} className="ml-2"/> {new Date(selectedAcceso.fecha_hora_entrada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hrs
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Guardia: {selectedAcceso.guardia_entrada || 'Sistema'}</p>
                    </div>

                    {/* Duración (Si sigue adentro) */}
                    {selectedAcceso.fecha_hora_salida === null && (
                        <div className="relative pl-6">
                             <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white animate-pulse"></div>
                             <p className="text-sm font-bold text-blue-600">Actualmente Adentro</p>
                             <p className="text-xs text-slate-500">Tiempo transcurrido: <span className="font-bold">{calcularDuracion(selectedAcceso.fecha_hora_entrada)}</span></p>
                             {selectedAcceso.id_cajon_moto && (
                                 <p className="text-xs text-orange-600 font-bold mt-1">Ocupando Cajón: M{selectedAcceso.id_cajon_moto}</p>
                             )}
                        </div>
                    )}

                    {/* Salida */}
                    {selectedAcceso.fecha_hora_salida && (
                        <div className="relative pl-6">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-400 border-2 border-white dark:border-dark-bg"></div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">Salida Registrada</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar size={12}/> {new Date(selectedAcceso.fecha_hora_salida).toLocaleDateString()}
                                <Clock size={12} className="ml-2"/> {new Date(selectedAcceso.fecha_hora_salida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hrs
                            </p>
                            <p className="text-xs font-bold text-slate-600 mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded">
                                Duración total: {calcularDuracion(selectedAcceso.fecha_hora_entrada, selectedAcceso.fecha_hora_salida)}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <Button variant="ghost" onClick={() => setModalOpen(false)}>Cerrar Detalle</Button>
                </div>
            </div>
        )}
      </Modal>

      {/* --- LIGHTBOX (Zoom Imagen) --- */}
      {imageModalOpen && selectedAcceso?.foto_vehiculo && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setImageModalOpen(false)}
        >
            <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
                <X size={32} />
            </button>
            <img 
                src={selectedAcceso.foto_vehiculo} 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
                onClick={(e) => e.stopPropagation()}
                alt="Detalle"
            />
        </div>
      )}

    </div>
  );
};

export default HistorialAccesos;