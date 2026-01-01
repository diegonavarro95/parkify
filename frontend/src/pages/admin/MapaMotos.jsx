import { useState, useEffect, useContext } from 'react';
import { 
  Bike, MapPin, User, Clock, Info, X, ZoomIn, 
  BatteryCharging, Circle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { obtenerMapaMotos } from '../../api/accesos';
import { useSocket } from '../../context/useSocket'; // Para tiempo real
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

const MapaMotos = () => {
  const [cajones, setCajones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  // Estados de Modales
  const [selectedCajon, setSelectedCajon] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Carga Inicial
  const cargarMapa = async () => {
    try {
      const data = await obtenerMapaMotos();
      setCajones(data);
      setLoading(false);
    } catch (error) {
      toast.error('Error cargando el mapa');
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMapa();
  }, []);

  // --- TIEMPO REAL ---
  useEffect(() => {
    if (!socket) return;
    
    // Escuchar cuando el mapa cambia (alguien entra o sale)
    // Nota: Asegúrate de que tu backend emita 'mapa_actualizado' o 'nuevo_movimiento'
    // Si no tienes un evento específico, podemos reusar 'nuevo_movimiento' para recargar
    const handleUpdate = () => {
        cargarMapa(); // Recargamos datos frescos
    };

    socket.on('mapa_motos_actualizado', handleUpdate);
    socket.on('nuevo_movimiento', handleUpdate); 

    return () => {
        socket.off('mapa_motos_actualizado', handleUpdate);
        socket.off('nuevo_movimiento', handleUpdate);
    };
  }, [socket]);

  // --- Helpers Visuales ---
  const getIniciales = (nombre) => {
    if (!nombre) return '??';
    return nombre.substring(0, 2).toUpperCase();
  };

  const calcularTiempo = (fecha) => {
    if (!fecha) return '';
    const diff = new Date() - new Date(fecha);
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins} min`;
  };

  // Separar Filas
  const filaA = cajones.filter(c => c.identificador.startsWith('A'));
  const filaB = cajones.filter(c => c.identificador.startsWith('B'));

  // --- COMPONENTE DE CAJÓN ---
  const Cajon = ({ data }) => {
    const ocupado = data.estado === 'ocupado';
    
    return (
      <div 
        onClick={() => { if(ocupado) { setSelectedCajon(data); setModalOpen(true); } }}
        className={`
            relative h-40 w-full min-w-[120px] rounded-lg border-x-2 border-dashed border-yellow-400/50 
            transition-all duration-300 flex flex-col items-center justify-end pb-2
            group
            ${ocupado 
                ? 'bg-slate-700/50 cursor-pointer hover:bg-slate-700 border-t-0 border-b-4 border-b-red-500' 
                : 'bg-transparent border-t-0 border-b-4 border-b-emerald-500/30'}
        `}
      >
        {/* Número de Cajón (Pintado en el suelo) */}
        <span className="absolute top-2 text-3xl font-black text-white/10 select-none group-hover:text-white/20 transition-colors">
            {data.identificador}
        </span>

        {/* MOTO (Si está ocupado) */}
        {ocupado ? (
            <div className="flex flex-col items-center w-full animate-scale-in">
                {/* Avatar / Foto */}
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 bg-slate-600 shadow-xl overflow-hidden relative z-10 mb-2">
                    {data.foto_vehiculo ? (
                        <img src={data.foto_vehiculo} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white bg-blue-600 font-bold">
                            {getIniciales(data.conductor)}
                        </div>
                    )}
                </div>
                
                {/* Placa "Flotante" */}
                <div className="bg-white px-2 py-0.5 rounded shadow-lg text-xs font-bold text-slate-900 border border-slate-300 transform -translate-y-4 z-20">
                    {data.placas}
                </div>

                {/* Info rápida */}
                <div className="text-xs text-slate-400 font-mono -mt-2">
                    {calcularTiempo(data.hora_entrada)}
                </div>
            </div>
        ) : (
            <div className="text-emerald-500/30 flex flex-col items-center justify-center h-full pb-6">
                <p className="text-xs font-bold tracking-widest uppercase">Libre</p>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <MapPin className="text-brand-600" />
                Mapa de Motocicletas
            </h1>
            <p className="text-slate-500">Visualización en tiempo real de la ocupación.</p>
        </div>
        
        {/* Resumen */}
        <div className="flex gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-bold">{cajones.filter(c => c.estado === 'disponible').length} Libres</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg">
                <Circle size={8} fill="currentColor" />
                <span className="font-bold">{cajones.filter(c => c.estado === 'ocupado').length} Ocupados</span>
            </div>
        </div>
      </div>

      {/* --- EL ESTACIONAMIENTO (VISUAL) --- */}
      {/* Contenedor con textura de Asfalto */}
      <div className="bg-slate-800 rounded-3xl p-8 shadow-2xl border-4 border-slate-700 overflow-x-auto">
        <div className="min-w-[800px]"> {/* Asegura scroll horizontal en móviles */}
            
            {/* FILA A (Superior) */}
            <div className="grid grid-cols-10 gap-2 mb-2">
                {filaA.map(cajon => <Cajon key={cajon.id_cajon} data={cajon} />)}
            </div>

            {/* CALLE (Separador) */}
            <div className="h-24 w-full flex items-center justify-center relative my-4">
                {/* Línea punteada central */}
                <div className="absolute w-full h-0 border-t-4 border-dashed border-white/20"></div>
                <div className="bg-slate-800 px-4 relative z-10 text-white/20 font-bold tracking-[1em] text-sm">
                    ZONA DE TRÁNSITO
                </div>
            </div>

            {/* FILA B (Inferior) */}
            <div className="grid grid-cols-10 gap-2 mt-2">
                {filaB.map(cajon => <Cajon key={cajon.id_cajon} data={cajon} />)}
            </div>

        </div>
      </div>

      {/* --- MODAL DETALLE --- */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Detalle Cajón ${selectedCajon?.identificador}`}>
        {selectedCajon && (
            <div className="space-y-6">
                
                {/* Foto Gigante */}
                <div 
                    className="w-full h-48 bg-slate-100 rounded-xl overflow-hidden relative cursor-pointer group"
                    onClick={() => { if(selectedCajon.foto_vehiculo) setImageModalOpen(true) }}
                >
                    {selectedCajon.foto_vehiculo ? (
                        <>
                            <img src={selectedCajon.foto_vehiculo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="text-white drop-shadow-md" size={32} />
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-200">
                            <Bike size={48} />
                            <p className="text-sm mt-2 font-medium">Sin foto disponible</p>
                        </div>
                    )}
                </div>

                {/* Info Principal */}
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">{selectedCajon.placas}</h2>
                        <p className="text-lg text-slate-600">{selectedCajon.modelo} • {selectedCajon.color}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-400 mb-1">Tiempo Estancia</div>
                        <div className="text-xl font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg inline-block">
                            {calcularTiempo(selectedCajon.hora_entrada)}
                        </div>
                    </div>
                </div>

                {/* Conductor */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {getIniciales(selectedCajon.conductor)}
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 uppercase font-bold">Propietario</p>
                        <p className="font-bold text-slate-900 dark:text-white">{selectedCajon.conductor}</p>
                        <p className="text-xs text-slate-500 capitalize">{selectedCajon.tipo_usuario?.replace('_', ' ')}</p>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button variant="ghost" onClick={() => setModalOpen(false)}>Cerrar</Button>
                </div>
            </div>
        )}
      </Modal>

      {/* --- LIGHTBOX --- */}
      {imageModalOpen && selectedCajon?.foto_vehiculo && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setImageModalOpen(false)}
        >
            <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
                <X size={32} />
            </button>
            <img 
                src={selectedCajon.foto_vehiculo} 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
      )}

    </div>
  );
};

export default MapaMotos;