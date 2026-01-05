import { useState, useEffect, useMemo } from 'react';
import { 
  Search, Calendar, Clock, MapPin, User, Car, 
  Bike, LogIn, LogOut, AlertCircle, X, ZoomIn, 
  Phone, CreditCard, ArrowRight, Lock, Unlock 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { obtenerHistorialAccesos } from '../../api/accesos';
// Importamos funciones de detalle (reusamos las de estadísticas si es posible, o creamos endpoints dedicados)
// Si no las tienes exportadas en 'api/accesos', asumo que las tienes en 'api/estadisticas'
import { getDetalleUsuarios, getDetalleVehiculos } from '../../api/estadisticas'; 
import InteractiveCard from '../../components/common/InteractiveCard';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

// URL Base
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const HistorialAccesos = () => {
  const [accesos, setAccesos] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Filtros ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos'); 
  const [filterUsuario, setFilterUsuario] = useState('todos'); 

  // --- Modales Principales ---
  const [selectedAcceso, setSelectedAcceso] = useState(null);
  
  // --- Modales de Detalle (Nivel 2) ---
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  
  // --- Lightbox (Zoom) ---
  const [zoomImage, setZoomImage] = useState(null);

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

  // --- Helpers de Navegación a Detalles ---
  const handleVerUsuario = async (nombreConductor) => {
      try {
          // Buscamos en la lista de usuarios completa
          const usuarios = await getDetalleUsuarios();
          const usuarioEncontrado = usuarios.find(u => u.nombre_completo === nombreConductor);
          
          if (usuarioEncontrado) {
              setSelectedUsuario(usuarioEncontrado);
          } else {
              toast.error("Detalles de usuario no disponibles");
          }
      } catch (e) { console.error(e); }
  };

  const handleVerVehiculo = async (placas) => {
      try {
          const vehiculos = await getDetalleVehiculos();
          const vehiculoEncontrado = vehiculos.find(v => v.placas === placas);
          
          if (vehiculoEncontrado) {
              setSelectedVehiculo(vehiculoEncontrado);
          } else {
              toast.error("Detalles de vehículo no disponibles");
          }
      } catch (e) { console.error(e); }
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

  // --- Helpers Visuales ---
  const calcularDuracion = (entrada, salida) => {
    const inicio = new Date(entrada);
    const fin = salida ? new Date(salida) : new Date();
    const diffMs = fin - inicio;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    if (diffHrs > 0) return `${diffHrs}h ${diffMins}m`;
    return `${diffMins} min`;
  };

  const calcularEstadoPase = (fechaVencimiento) => {
    if (!fechaVencimiento) return { texto: 'Sin datos', color: 'text-slate-500 bg-slate-100' };
    const vencimiento = new Date(fechaVencimiento);
    const diffMs = vencimiento - new Date();
    if (diffMs < 0) return { texto: 'Vencido', color: 'text-red-600 bg-red-50' };
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (dias > 0) return { texto: `${dias} días restantes`, color: 'text-emerald-600 bg-emerald-50' };
    return { texto: `${horas} horas restantes`, color: 'text-orange-600 bg-orange-50' };
  };

  const getIniciales = (nombre) => {
    if (!nombre) return '??';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return nombre.substring(0, 2).toUpperCase();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return {
        fecha: date.toLocaleDateString(),
        hora: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${baseUrl}${cleanPath}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* HEADER (Sin cambios) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Car className="text-brand-600" /> Historial de Accesos
            </h1>
            <p className="text-slate-500 mt-1">Monitoreo en tiempo real de entradas y salidas.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative group flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                <input type="text" placeholder="Buscar placas, nombre..." className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm focus:outline-none dark:bg-slate-800 dark:text-white dark:border-slate-700" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                <option value="todos">Todos los Estados</option><option value="adentro">🟢 Adentro</option><option value="afuera">⚪ Salieron</option>
            </select>
            <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm focus:outline-none dark:bg-slate-800 dark:text-white dark:border-slate-700" value={filterUsuario} onChange={(e) => setFilterUsuario(e.target.value)}>
                <option value="todos">Todos los Usuarios</option><option value="comunidad">🎓 Comunidad ESCOM</option><option value="visitante">👤 Visitantes</option>
            </select>
        </div>
      </div>

      {/* LISTA TARJETAS */}
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
                    <InteractiveCard key={acc.id_acceso} onClick={() => setSelectedAcceso(acc)} className={`border-l-4 ${estaAdentro ? 'border-l-emerald-500' : 'border-l-slate-300'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${estaAdentro ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{estaAdentro ? 'Adentro' : 'Finalizado'}</span>
                                {acc.tipo_vehiculo === 'motocicleta' ? <Bike size={16} className="text-slate-400"/> : <Car size={16} className="text-slate-400"/>}
                            </div>
                        </div>
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{acc.placas}</h3>
                            <p className="text-sm text-slate-500">{acc.modelo} • {acc.color}</p>
                        </div>
                        <div className="space-y-3 text-sm border-t border-slate-100 dark:border-slate-700 pt-3">
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-1 text-slate-500 font-medium"><LogIn size={14}/> Entrada:</span>
                                <div className="text-right">
                                    <div className="text-xs text-slate-400">{entrada.fecha}</div>
                                    <div className="font-bold text-slate-700 dark:text-slate-200">{entrada.hora} hrs</div>
                                </div>
                            </div>
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
                            <div className={`flex justify-between px-2 py-1 rounded text-xs ${statusPase.color}`}>
                                <span className="flex items-center gap-1 font-semibold"><AlertCircle size={12}/> Pase:</span>
                                <span className="font-bold">{statusPase.texto}</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">{getIniciales(acc.conductor)}</div>
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-300 leading-none mb-0.5">{acc.conductor}</p>
                                <p className="truncate text-xs text-slate-400 capitalize">{acc.tipo_usuario?.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </InteractiveCard>
                );
            })}
        </div>
      )}

      {/* ================= MODALES DE DETALLE (JERARQUÍA CORREGIDA) ================= */}

      {/* 1. DETALLE ACCESO (NIVEL 1) */}
      {selectedAcceso && (
          <Modal isOpen={!!selectedAcceso} onClose={() => setSelectedAcceso(null)} title="Detalle de Acceso">
            <div className="space-y-6">
                {/* Header Vehículo Clickable */}
                <div className="flex gap-4">
                    <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 relative group cursor-pointer border border-slate-200" onClick={() => { if(selectedAcceso.foto_vehiculo) setZoomImage(getImageUrl(selectedAcceso.foto_vehiculo)) }}>
                        {selectedAcceso.foto_vehiculo ? (
                            <>
                                <img src={getImageUrl(selectedAcceso.foto_vehiculo)} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Vehículo" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><ZoomIn className="text-white drop-shadow-md" /></div>
                            </>
                        ) : <div className="w-full h-full flex items-center justify-center text-slate-400"><Car size={32} /></div>}
                    </div>
                    <div>
                        {/* PLACAS CLICKEABLES -> Abre Detalle Vehículo */}
                        <h2 
                            className="text-2xl font-bold text-slate-900 dark:text-white cursor-pointer hover:text-brand-600 hover:underline transition-colors"
                            onClick={() => handleVerVehiculo(selectedAcceso.placas)}
                        >
                            {selectedAcceso.placas}
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300">{selectedAcceso.marca} {selectedAcceso.modelo}</p>
                        <div className="flex gap-2 mt-2">
                             <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-bold uppercase">{selectedAcceso.color}</span>
                             <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-bold uppercase">{selectedAcceso.tipo_vehiculo}</span>
                        </div>
                    </div>
                </div>

                {/* Info Conductor Clickable */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                    <div 
                        className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-2 -m-2 rounded-lg transition-colors group"
                        onClick={() => handleVerUsuario(selectedAcceso.conductor)}
                    >
                        <p className="text-xs text-slate-400 uppercase font-bold mb-2 group-hover:text-brand-500">Conductor</p>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{getIniciales(selectedAcceso.conductor)}</div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white text-sm leading-tight group-hover:text-brand-600">{selectedAcceso.conductor}</p>
                                <p className="text-xs text-slate-500 capitalize">{selectedAcceso.tipo_usuario?.replace('_', ' ')}</p>
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

                {/* Timeline (Igual que antes) */}
                <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6 py-2">
                    <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-dark-bg"></div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Entrada Registrada</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar size={12}/> {new Date(selectedAcceso.fecha_hora_entrada).toLocaleDateString()}
                            <Clock size={12} className="ml-2"/> {new Date(selectedAcceso.fecha_hora_entrada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hrs
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Guardia: {selectedAcceso.guardia_entrada || 'Sistema'}</p>
                    </div>
                    {selectedAcceso.fecha_hora_salida === null && (
                        <div className="relative pl-6">
                             <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white animate-pulse"></div>
                             <p className="text-sm font-bold text-blue-600">Actualmente Adentro</p>
                             <p className="text-xs text-slate-500">Tiempo transcurrido: <span className="font-bold">{calcularDuracion(selectedAcceso.fecha_hora_entrada)}</span></p>
                             {selectedAcceso.id_cajon_moto && (<p className="text-xs text-orange-600 font-bold mt-1">Ocupando Cajón: {selectedAcceso.nombre_cajon || selectedAcceso.id_cajon_moto}</p>)}
                        </div>
                    )}
                    {selectedAcceso.fecha_hora_salida && (
                        <div className="relative pl-6">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-400 border-2 border-white dark:border-dark-bg"></div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">Salida Registrada</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar size={12}/> {new Date(selectedAcceso.fecha_hora_salida).toLocaleDateString()}
                                <Clock size={12} className="ml-2"/> {new Date(selectedAcceso.fecha_hora_salida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hrs
                            </p>
                            <p className="text-xs font-bold text-slate-600 mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded">Duración total: {calcularDuracion(selectedAcceso.fecha_hora_entrada, selectedAcceso.fecha_hora_salida)}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <Button variant="ghost" onClick={() => setSelectedAcceso(null)}>Cerrar Detalle</Button>
                </div>
            </div>
          </Modal>
      )}

      {/* 2. DETALLE VEHÍCULO (NIVEL 2) */}
      {selectedVehiculo && (
          <Modal isOpen={!!selectedVehiculo} onClose={() => setSelectedVehiculo(null)} title="Detalle del Vehículo">
              <div className="space-y-6">
                  <div className="w-full h-56 bg-slate-200 rounded-xl overflow-hidden relative shadow-inner">
                      {selectedVehiculo.foto_vehiculo ? (
                          <img src={getImageUrl(selectedVehiculo.foto_vehiculo)} className="w-full h-full object-cover" alt="Vehículo" />
                      ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800">
                              {selectedVehiculo.tipo === 'motocicleta' ? <Bike size={64}/> : <Car size={64}/>}
                              <p className="mt-2 text-sm">Sin foto</p>
                          </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <h2 className="text-3xl font-black text-white tracking-widest font-mono">{selectedVehiculo.placas}</h2>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700"><p className="text-xs text-slate-400 uppercase font-bold">Marca / Modelo</p><p className="font-bold text-slate-800 dark:text-white">{selectedVehiculo.marca} {selectedVehiculo.modelo}</p></div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700"><p className="text-xs text-slate-400 uppercase font-bold">Color</p><div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border border-slate-300" style={{backgroundColor: selectedVehiculo.color}}></div><p className="font-bold text-slate-800 dark:text-white">{selectedVehiculo.color}</p></div></div>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group" onClick={() => handleVerUsuario(selectedVehiculo.propietario)}>
                      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">{getIniciales(selectedVehiculo.propietario)}</div><div><p className="text-xs text-slate-400 uppercase font-bold group-hover:text-brand-500">Propietario</p><p className="font-bold text-slate-800 dark:text-white">{selectedVehiculo.propietario}</p></div></div><ArrowRight size={18} className="text-slate-400 group-hover:text-brand-500"/>
                  </div>
                  <div className="flex justify-end pt-2">
                      <Button variant="outline" onClick={() => setSelectedVehiculo(null)}>Cerrar</Button>
                  </div>
              </div>
          </Modal>
      )}

      {/* 3. DETALLE USUARIO (NIVEL 3 - EL MÁS ALTO) */}
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
                          <div className="relative w-full h-48 bg-slate-200 rounded-lg overflow-hidden group cursor-zoom-in" onClick={() => setZoomImage(getImageUrl(selectedUsuario.documento_validacion_url))}>
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

      {/* 4. LIGHTBOX ZOOM (NIVEL MÁXIMO) */}
      {zoomImage && (
        <div 
            className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setZoomImage(null)}
        >
            <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
                <X size={32} />
            </button>
            <img 
                src={zoomImage} 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
                onClick={(e) => e.stopPropagation()}
                alt="Zoom"
            />
        </div>
      )}

    </div>
  );
};

export default HistorialAccesos;