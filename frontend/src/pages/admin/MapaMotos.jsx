import { useState, useEffect, useContext } from 'react';
import { 
  Bike, MapPin, User, Clock, Info, X, ZoomIn, 
  BatteryCharging, Circle, AlertTriangle, Moon, Phone, CreditCard, Lock, Unlock 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { obtenerMapaMotos } from '../../api/accesos';
// Importamos la función de detalle de usuarios (Reutilizando la lógica de estadísticas)
import { getDetalleUsuarios } from '../../api/estadisticas'; 
import { useSocket } from '../../context/useSocket'; 
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import api from '../../api/axios'; // Para bloquear usuario si quisieras reutilizar esa lógica

// URL Base
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MapaMotos = () => {
  const [cajones, setCajones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  // Estados de Modales
  const [selectedCajon, setSelectedCajon] = useState(null); // Nivel 1
  const [selectedUsuario, setSelectedUsuario] = useState(null); // Nivel 2 (Nuevo)
  const [modalOpen, setModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [zoomImageSrc, setZoomImageSrc] = useState(null); // Para el lightbox genérico

  // --- NUEVA LÓGICA DE ALERTAS ---
  const verificarAlertas = (data) => {
    const ahora = new Date();

    if (ahora.getHours() >= 22) {
        const ocupados = data.filter(c => c.estado === 'ocupado').length;
        toast('HORA DE CIERRE (10:00 PM)', {
            icon: <Moon className="text-indigo-500"/>,
            duration: 6000,
            id: 'alerta-cierre', 
            style: { border: '2px solid #6366f1', color: '#312e81' },
            description: `Atención Guardia: Aún quedan ${ocupados} motocicletas dentro.`
        });
    }

    data.forEach(c => {
        if (c.estado === 'ocupado' && c.hora_entrada) {
            const entrada = new Date(c.hora_entrada);
            const diffMs = ahora - entrada;
            const horas = diffMs / (1000 * 60 * 60);

            if (horas >= 15) {
                toast.error(
                    `⚠️ ALERTA CRÍTICA: La moto en cajón ${c.identificador} lleva más de 15 horas.`, 
                    { 
                        duration: 8000,
                        id: `alerta-tiempo-${c.id_cajon}`, 
                        style: { fontWeight: 'bold' }
                    }
                );
            }
        }
    });
  };

  // Carga Inicial
  const cargarMapa = async () => {
    try {
      const data = await obtenerMapaMotos();
      setCajones(data);
      setLoading(false);
      verificarAlertas(data); 
    } catch (error) {
      toast.error('Error cargando el mapa');
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMapa();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => { cargarMapa(); };
    socket.on('mapa_motos_actualizado', handleUpdate);
    socket.on('nuevo_movimiento', handleUpdate); 
    return () => {
        socket.off('mapa_motos_actualizado', handleUpdate);
        socket.off('nuevo_movimiento', handleUpdate);
    };
  }, [socket]);

  // --- Helpers ---
  const getIniciales = (nombre) => {
    if (!nombre) return '??';
    const partes = nombre.split(' ').filter(p => p.length > 0);
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return nombre.substring(0, 2).toUpperCase();
  };

  const calcularTiempo = (fecha) => {
    if (!fecha) return '';
    const diff = new Date() - new Date(fecha);
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const esMuchoTiempo = hrs >= 15;
    if (hrs > 0) return (
        <span className={esMuchoTiempo ? "text-red-600 font-black animate-pulse" : ""}>
            {hrs}h {mins % 60}m {esMuchoTiempo && "⚠️"}
        </span>
    );
    return `${mins} min`;
  };

  const getImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${baseUrl}${cleanPath}`;
  };

  // --- ACCIÓN: VER USUARIO DETALLADO ---
  const handleVerUsuario = async (nombreConductor) => {
      try {
          // Buscamos el usuario completo
          const usuarios = await getDetalleUsuarios();
          const usuarioEncontrado = usuarios.find(u => u.nombre_completo === nombreConductor);
          
          if (usuarioEncontrado) {
              setSelectedUsuario(usuarioEncontrado);
          } else {
              toast.error("Detalles de usuario no disponibles");
          }
      } catch (e) { console.error(e); }
  };

  // Separar Filas
  const filaA = cajones.filter(c => c.identificador.startsWith('A'));
  const filaB = cajones.filter(c => c.identificador.startsWith('B'));

  // --- COMPONENTE DE CAJÓN ---
  const Cajon = ({ data }) => {
    const ocupado = data.estado === 'ocupado';
    let alertaTiempo = false;
    if (ocupado && data.hora_entrada) {
        const hrs = (new Date() - new Date(data.hora_entrada)) / (1000 * 60 * 60);
        if (hrs >= 15) alertaTiempo = true;
    }
    
    return (
      <div 
        onClick={() => { if(ocupado) { setSelectedCajon(data); setModalOpen(true); } }}
        className={`
            relative h-40 w-full min-w-[120px] rounded-lg border-x-2 border-dashed border-yellow-400/50 
            transition-all duration-300 flex flex-col items-center justify-end pb-2
            group
            ${ocupado 
                ? 'bg-slate-700/50 cursor-pointer hover:bg-slate-700 border-t-0 border-b-4 ' + (alertaTiempo ? 'border-b-red-600 ring-2 ring-red-500 animate-pulse' : 'border-b-red-500')
                : 'bg-transparent border-t-0 border-b-4 border-b-emerald-500/30'}
        `}
      >
        <span className="absolute top-2 text-3xl font-black text-white/10 select-none group-hover:text-white/20 transition-colors">
            {data.identificador}
        </span>

        {ocupado ? (
            <div className="flex flex-col items-center w-full animate-scale-in">
                {alertaTiempo && (
                    <div className="absolute -top-4 z-30 bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg animate-bounce">
                        REVISAR
                    </div>
                )}
                <div className={`w-16 h-16 rounded-full border-4 bg-slate-600 shadow-xl overflow-hidden relative z-10 mb-2 ${alertaTiempo ? 'border-red-500' : 'border-slate-800'}`}>
                    {data.foto_vehiculo ? (
                        <img src={getImageUrl(data.foto_vehiculo)} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white bg-blue-600 font-bold">
                            {getIniciales(data.conductor)}
                        </div>
                    )}
                </div>
                <div className="bg-white px-2 py-0.5 rounded shadow-lg text-xs font-bold text-slate-900 border border-slate-300 transform -translate-y-4 z-20">
                    {data.placas}
                </div>
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
                <MapPin className="text-brand-600" /> Mapa de Motocicletas
            </h1>
            <p className="text-slate-500">Visualización en tiempo real de la ocupación.</p>
        </div>
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

      {/* --- EL ESTACIONAMIENTO --- */}
      <div className="bg-slate-800 rounded-3xl p-8 shadow-2xl border-4 border-slate-700 overflow-x-auto">
        <div className="min-w-[800px]">
            <div className="grid grid-cols-10 gap-2 mb-2">
                {filaA.map(cajon => <Cajon key={cajon.id_cajon} data={cajon} />)}
            </div>
            <div className="h-24 w-full flex items-center justify-center relative my-4">
                <div className="absolute w-full h-0 border-t-4 border-dashed border-white/20"></div>
                <div className="bg-slate-800 px-4 relative z-10 text-white/20 font-bold tracking-[1em] text-sm">ZONA DE TRÁNSITO</div>
            </div>
            <div className="grid grid-cols-10 gap-2 mt-2">
                {filaB.map(cajon => <Cajon key={cajon.id_cajon} data={cajon} />)}
            </div>
        </div>
      </div>

      {/* --- MODAL DETALLE CAJÓN (NIVEL 1) --- */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Detalle Cajón ${selectedCajon?.identificador}`}>
        {selectedCajon && (
            <div className="space-y-6">
                
                {/* Foto Gigante (Abre Lightbox) */}
                <div 
                    className="w-full h-48 bg-slate-100 rounded-xl overflow-hidden relative cursor-pointer group"
                    onClick={() => { if(selectedCajon.foto_vehiculo) { setZoomImageSrc(getImageUrl(selectedCajon.foto_vehiculo)); setImageModalOpen(true); } }}
                >
                    {selectedCajon.foto_vehiculo ? (
                        <>
                            <img src={getImageUrl(selectedCajon.foto_vehiculo)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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

                {/* ALERTA EN MODAL */}
                {(() => {
                    const hrs = (new Date() - new Date(selectedCajon.hora_entrada)) / (1000 * 60 * 60);
                    if (hrs >= 15) return (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3 text-red-700 font-bold animate-pulse">
                            <AlertTriangle />
                            <p>¡ATENCIÓN! Este vehículo ha excedido el tiempo límite de 15 horas.</p>
                        </div>
                    );
                })()}

                {/* Conductor (CLICKEABLE -> Abre Nivel 2) */}
                <div 
                    className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => handleVerUsuario(selectedCajon.conductor)}
                >
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {getIniciales(selectedCajon.conductor)}
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 uppercase font-bold group-hover:text-brand-500">Propietario</p>
                        <p className="font-bold text-slate-900 dark:text-white">{selectedCajon.conductor}</p>
                        <p className="text-xs text-slate-500 capitalize">{selectedCajon.tipo_usuario?.replace('_', ' ')}</p>
                    </div>
                    <div className="ml-auto">
                        <Info size={20} className="text-slate-300 group-hover:text-brand-500"/>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button variant="ghost" onClick={() => setModalOpen(false)}>Cerrar</Button>
                </div>
            </div>
        )}
      </Modal>

      {/* --- MODAL DETALLE USUARIO (NIVEL 2) --- */}
      {selectedUsuario && (
          <Modal isOpen={!!selectedUsuario} onClose={() => setSelectedUsuario(null)} title="Perfil de Usuario">
              <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                      <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">{getIniciales(selectedUsuario.nombre_completo)}</div>
                      <div>
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedUsuario.nombre_completo}</h2>
                          <p className="text-slate-500 text-sm">{selectedUsuario.correo_electronico}</p>
                          <div className="flex gap-2 mt-1">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded uppercase font-bold">{selectedUsuario.rol}</span>
                              <span className={`px-2 py-0.5 text-xs rounded uppercase font-bold ${selectedUsuario.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{selectedUsuario.activo ? 'Activa' : 'Bloqueada'}</span>
                          </div>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-slate-400 mb-1 flex items-center gap-1"><CreditCard size={14}/> CURP</p><p className="font-mono font-medium">{selectedUsuario.curp || 'No registrada'}</p></div>
                      <div><p className="text-slate-400 mb-1 flex items-center gap-1"><Phone size={14}/> Teléfono</p><p className="font-medium">{selectedUsuario.telefono || 'No registrado'}</p></div>
                      <div><p className="text-slate-400 mb-1">Tipo</p><p className="font-medium capitalize">{selectedUsuario.tipo_usuario?.replace('_', ' ')}</p></div>
                      <div><p className="text-slate-400 mb-1">Vehículos</p><p className="font-medium">{selectedUsuario.num_vehiculos}</p></div>
                  </div>
                  <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-3">Identificación Oficial</p>
                      {selectedUsuario.documento_validacion_url ? (
                          <div 
                              className="relative w-full h-48 bg-slate-200 rounded-lg overflow-hidden group cursor-zoom-in"
                              onClick={() => { setZoomImageSrc(getImageUrl(selectedUsuario.documento_validacion_url)); setImageModalOpen(true); }}
                          >
                              <img src={getImageUrl(selectedUsuario.documento_validacion_url)} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold"><ZoomIn className="mr-2"/> Ver Pantalla Completa</div>
                          </div>
                      ) : <div className="h-20 flex items-center justify-center text-slate-400 bg-white border border-dashed border-slate-300 rounded-lg">Sin documento</div>}
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                      <Button variant="ghost" onClick={() => setSelectedUsuario(null)}>Cerrar</Button>
                  </div>
              </div>
          </Modal>
      )}

      {/* --- LIGHTBOX (NIVEL 3 - MÁXIMO) --- */}
      {imageModalOpen && zoomImageSrc && (
        <div 
            className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => { setImageModalOpen(false); setZoomImageSrc(null); }}
        >
            <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
                <X size={32} />
            </button>
            <img 
                src={zoomImageSrc} 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
      )}

    </div>
  );
};

export default MapaMotos;