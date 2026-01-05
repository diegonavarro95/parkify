import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, CheckCircle, Clock, X, MessageSquare, Trash2, User, AlertTriangle, Calendar, ChevronLeft, ChevronRight, Eye, Phone, CreditCard, Lock, Unlock, ZoomIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { obtenerTodosReportes, atenderReporte, eliminarReporte } from '../../api/reportes';
// Importamos la función para obtener detalle de usuarios (Reutilizando la lógica de estadísticas)
// Si no tienes el export en api/reportes, usa el de estadisticas o ajusta el import
import { getDetalleUsuarios } from '../../api/estadisticas'; 
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import InteractiveCard from '../../components/common/InteractiveCard';
import api from '../../api/axios'; // Para bloquear usuario si es necesario

// URL Base
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const GestionReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  
  // --- Estados de Modales ---
  const [modalAtenderOpen, setModalAtenderOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  // --- Estado para Detalle Usuario (Nivel 2) ---
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [zoomDocImage, setZoomDocImage] = useState(null); // Para Zoom INE Usuario
  const [confirmarBloqueo, setConfirmarBloqueo] = useState(null);

  // --- Estado para Galería Evidencias (Lightbox) ---
  const [galleryState, setGalleryState] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0
  });

  const { register, handleSubmit, setValue } = useForm();

  // --- 1. Carga de Datos ---
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await obtenerTodosReportes();
      setReportes(data);
    } catch (error) {
      toast.error('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const reportesFiltrados = filtroEstado === 'todos' 
    ? reportes 
    : reportes.filter(r => r.estado === filtroEstado);

  // --- Helpers Visuales ---
  const getIniciales = (nombre) => {
    if (!nombre) return '??';
    const partes = nombre.split(' ').filter(p => p.length > 0);
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return partes[0].substring(0, 2).toUpperCase();
  };

  const getImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${baseUrl}${cleanPath}`;
  };

  // --- Acción: Ver Usuario Detallado ---
  const handleVerUsuario = async (nombreConductor) => {
      try {
          const usuarios = await getDetalleUsuarios();
          const usuarioEncontrado = usuarios.find(u => u.nombre_completo === nombreConductor);
          
          if (usuarioEncontrado) {
              setSelectedUsuario(usuarioEncontrado);
          } else {
              toast.error("Detalles de usuario no disponibles");
          }
      } catch (e) { console.error(e); }
  };

  // --- Acción: Bloquear Usuario ---
  const ejecutarBloqueo = async () => {
      if (!confirmarBloqueo) return;
      const usuario = confirmarBloqueo;
      const nuevoEstado = !usuario.activo;
      try {
          await api.put(`/usuarios/${usuario.id_usuario}/estado`, { activo: nuevoEstado });
          
          if (selectedUsuario?.id_usuario === usuario.id_usuario) {
              setSelectedUsuario({ ...selectedUsuario, activo: nuevoEstado });
          }
          toast.success(`Usuario ${nuevoEstado ? 'activado' : 'bloqueado'}`);
          setConfirmarBloqueo(null);
      } catch (error) {
          toast.error("Error al cambiar estado");
      }
  };

  // --- 2. Lógica de Modales ---

  const abrirDetalle = (reporte) => {
    setReporteSeleccionado(reporte);
    setModalDetalleOpen(true);
  };

  const abrirAtender = (e, reporte) => {
    e.stopPropagation(); 
    setReporteSeleccionado(reporte);
    setValue('estado', reporte.estado); 
    setValue('comentario_admin', reporte.comentario_admin || '');
    setModalAtenderOpen(true);
  };

  const abrirEliminar = (e, reporte) => {
    e.stopPropagation(); 
    setReporteSeleccionado(reporte);
    setModalDeleteOpen(true);
  };

  // --- 3. Acciones Backend ---

  const onSubmitAtender = async (data) => {
    try {
      await atenderReporte(reporteSeleccionado.id_reporte, data);
      toast.success('Reporte actualizado');
      setModalAtenderOpen(false);
      setModalDetalleOpen(false);
      cargarDatos(); 
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const confirmarEliminacion = async () => {
    try {
      await eliminarReporte(reporteSeleccionado.id_reporte);
      toast.success('Reporte eliminado');
      setModalDeleteOpen(false);
      setModalDetalleOpen(false); 
      cargarDatos();
    } catch (error) {
      toast.error('No se pudo eliminar');
    }
  };

  // --- 4. Lógica de Galería (Lightbox) ---
  const openGallery = (e, images, index) => {
    e?.stopPropagation();
    // Aseguramos URLs completas para la galería
    const fullImages = images.map(img => getImageUrl(img));
    setGalleryState({ isOpen: true, images: fullImages, currentIndex: index });
  };

  const closeGallery = useCallback(() => {
    setGalleryState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const nextImage = useCallback((e) => {
    e?.stopPropagation();
    setGalleryState(prev => ({ ...prev, currentIndex: (prev.currentIndex + 1) % prev.images.length }));
  }, []);

  const prevImage = useCallback((e) => {
    e?.stopPropagation();
    setGalleryState(prev => ({ ...prev, currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length }));
  }, []);

  useEffect(() => {
    if (!galleryState.isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeGallery();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryState.isOpen, closeGallery, nextImage, prevImage]);


  // --- 5. Configuración Visual ---
  const getStatusConfig = (estado) => {
    switch (estado) {
      case 'nuevo': return { color: 'bg-red-100 text-red-800', icon: FileText, label: 'Nuevo' };
      case 'en_revision': return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'En Revisión' };
      case 'atendido': return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Atendido' };
      case 'cerrado': return { color: 'bg-slate-200 text-slate-600', icon: X, label: 'Cerrado' };
      default: return { color: 'bg-slate-100', icon: FileText, label: estado };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Reportes</h1>
          <p className="text-slate-500">Administra y resuelve las incidencias de la comunidad.</p>
        </div>
        
        {/* Filtros */}
        <div className="flex bg-white dark:bg-dark-card p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto max-w-full">
           {['todos', 'nuevo', 'en_revision', 'atendido', 'cerrado'].map((filtro) => (
             <button
               key={filtro}
               onClick={() => setFiltroEstado(filtro)}
               className={`px-3 py-1.5 text-sm rounded-md transition-all whitespace-nowrap ${
                 filtroEstado === filtro 
                  ? 'bg-brand-500 text-white font-medium shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
               }`}
             >
               {filtro === 'todos' ? 'Todos' : filtro.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
             </button>
           ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="py-20 text-center animate-pulse text-slate-400">Cargando incidencias...</div>
      ) : reportesFiltrados.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-dark-card rounded-xl border border-dashed border-slate-300">
           <p className="text-slate-500">No hay reportes con este filtro.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reportesFiltrados.map((reporte) => {
            const status = getStatusConfig(reporte.estado);
            const StatusIcon = status.icon;
            const isFinalized = ['atendido', 'cerrado'].includes(reporte.estado);

            return (
              <InteractiveCard 
                key={reporte.id_reporte} 
                className="border-l-4 border-l-slate-300"
                onClick={() => abrirDetalle(reporte)}
              >
                <div className="flex flex-col md:flex-row gap-4">
                  
                  {/* Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase ${status.color}`}>
                        <StatusIcon size={12} /> {status.label}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(reporte.fecha_envio).toLocaleDateString()}
                        <Clock size={12} className="ml-1" />
                        {new Date(reporte.fecha_envio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hrs
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                        {reporte.asunto}
                    </h3>
                    
                    {/* USUARIO CON AVATAR */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md w-fit">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {getIniciales(reporte.usuario?.nombre_completo)}
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {reporte.usuario?.nombre_completo || 'Usuario desconocido'}
                        </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 line-clamp-2">
                        {reporte.descripcion}
                    </p>

                    {/* Previsualización de fotos */}
                    {reporte.fotos_evidencia?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                            {reporte.fotos_evidencia.slice(0, 3).map((url, i) => (
                                <div key={i} className="w-10 h-10 rounded overflow-hidden border border-slate-200">
                                    <img src={getImageUrl(url)} className="w-full h-full object-cover" alt="evidencia" />
                                </div>
                            ))}
                            {reporte.fotos_evidencia.length > 3 && (
                                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-bold">
                                    +{reporte.fotos_evidencia.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                  </div>

                  {/* Botones */}
                  <div className="flex md:flex-col gap-2 justify-end md:justify-start border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                      <Button size="sm" onClick={(e) => abrirAtender(e, reporte)} disabled={isFinalized} className={`flex-1 md:flex-none ${isFinalized ? 'opacity-50 cursor-not-allowed bg-slate-400 hover:bg-slate-400' : ''}`}>
                        <MessageSquare size={16} className="mr-2" /> {isFinalized ? 'Resuelto' : 'Atender'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={(e) => abrirEliminar(e, reporte)} className="flex-1 md:flex-none text-red-600 border-red-200 hover:bg-red-50 z-10">
                        <Trash2 size={16} className="mr-2" /> Eliminar
                      </Button>
                  </div>

                </div>
              </InteractiveCard>
            );
          })}
        </div>
      )}

      {/* --- MODAL DETALLE (NIVEL 1) --- */}
      <Modal isOpen={modalDetalleOpen} onClose={() => setModalDetalleOpen(false)} title="Detalle del Reporte">
        {reporteSeleccionado && (
            <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4 dark:border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{reporteSeleccionado.asunto}</h2>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                            <Clock size={14} />
                            {new Date(reporteSeleccionado.fecha_envio).toLocaleDateString()}
                            <span>•</span>
                            {new Date(reporteSeleccionado.fecha_envio).toLocaleTimeString()} hrs
                        </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusConfig(reporteSeleccionado.estado).color}`}>
                        {getStatusConfig(reporteSeleccionado.estado).label}
                    </span>
                </div>

                {/* USUARIO CLICKEABLE (ABRE NIVEL 2) */}
                <div 
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => handleVerUsuario(reporteSeleccionado.usuario?.nombre_completo)}
                >
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                        {getIniciales(reporteSeleccionado.usuario?.nombre_completo)}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-500">{reporteSeleccionado.usuario?.nombre_completo}</p>
                        <p className="text-xs text-slate-500">{reporteSeleccionado.usuario?.email}</p>
                    </div>
                    <div className="ml-auto">
                        <Eye size={18} className="text-slate-300 group-hover:text-brand-500"/>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2 dark:text-slate-300">Descripción</h4>
                    <div className="p-4 border border-slate-200 rounded-lg text-slate-700 bg-white dark:bg-dark-bg dark:border-slate-700 dark:text-slate-300">
                        {reporteSeleccionado.descripcion}
                    </div>
                </div>

                {reporteSeleccionado.fotos_evidencia?.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-2 dark:text-slate-300">Evidencias ({reporteSeleccionado.fotos_evidencia.length})</h4>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {reporteSeleccionado.fotos_evidencia.map((url, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={(e) => openGallery(e, reporteSeleccionado.fotos_evidencia, idx)}
                                    className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden cursor-zoom-in group border border-slate-200"
                                >
                                    <img src={getImageUrl(url)} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="evidencia" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <Eye className="text-white drop-shadow-md" size={20} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {reporteSeleccionado.comentario_admin && (
                    <div className="bg-brand-50 border border-brand-100 p-4 rounded-lg dark:bg-brand-900/20 dark:border-brand-800">
                        <h4 className="text-sm font-bold text-brand-800 mb-1 flex items-center gap-2 dark:text-brand-300">
                            <MessageSquare size={16}/> Respuesta: 
                        </h4>
                        <p className="text-sm text-slate-700 dark:text-slate-200">{reporteSeleccionado.comentario_admin}</p>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <Button variant="ghost" onClick={() => setModalDetalleOpen(false)}>Cerrar</Button>
                    {!['atendido', 'cerrado'].includes(reporteSeleccionado.estado) && (
                         <Button onClick={(e) => abrirAtender(e, reporteSeleccionado)}>Atender Ahora</Button>
                    )}
                </div>
            </div>
        )}
      </Modal>

      {/* --- DETALLE USUARIO (NIVEL 2 - ENCIMA) --- */}
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
                          <div className="relative w-full h-48 bg-slate-200 rounded-lg overflow-hidden group cursor-zoom-in" onClick={() => setZoomDocImage(getImageUrl(selectedUsuario.documento_validacion_url))}>
                              <img src={getImageUrl(selectedUsuario.documento_validacion_url)} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold"><ZoomIn className="mr-2"/> Ver Pantalla Completa</div>
                          </div>
                      ) : <div className="h-20 flex items-center justify-center text-slate-400 bg-white border border-dashed border-slate-300 rounded-lg">Sin documento</div>}
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                      <Button variant="ghost" onClick={() => setSelectedUsuario(null)}>Cerrar</Button>
                      <Button variant={selectedUsuario.activo ? 'danger' : 'success'} onClick={() => setConfirmarBloqueo(selectedUsuario)}>
                          {selectedUsuario.activo ? <><Lock size={16} className="mr-2"/> Bloquear</> : <><Unlock size={16} className="mr-2"/> Desbloquear</>}
                      </Button>
                  </div>
              </div>
          </Modal>
      )}

      {/* --- MODAL CONFIRMACIÓN BLOQUEO --- */}
      <Modal isOpen={!!confirmarBloqueo} onClose={() => setConfirmarBloqueo(null)} title="Confirmar Acción">
          <div className="text-center p-4">
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 ${confirmarBloqueo?.activo ? 'bg-red-100' : 'bg-emerald-100'}`}>
                  {confirmarBloqueo?.activo ? <Lock className="h-8 w-8 text-red-600" /> : <Unlock className="h-8 w-8 text-emerald-600" />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{confirmarBloqueo?.activo ? '¿Bloquear Usuario?' : '¿Desbloquear Usuario?'}</h3>
              <p className="text-sm text-gray-500 mb-6">{confirmarBloqueo?.activo ? `Bloquear acceso a ${confirmarBloqueo.nombre_completo}.` : `Restablecer acceso para ${confirmarBloqueo?.nombre_completo}.`}</p>
              <div className="flex justify-center gap-3">
                  <Button variant="ghost" onClick={() => setConfirmarBloqueo(null)}>Cancelar</Button>
                  <Button variant={confirmarBloqueo?.activo ? 'danger' : 'success'} onClick={ejecutarBloqueo}>{confirmarBloqueo?.activo ? 'Sí, Bloquear' : 'Sí, Desbloquear'}</Button>
              </div>
          </div>
      </Modal>

      {/* --- MODAL ATENDER --- */}
      <Modal isOpen={modalAtenderOpen} onClose={() => setModalAtenderOpen(false)} title="Resolver Reporte">
        <form onSubmit={handleSubmit(onSubmitAtender)} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 mb-4 dark:bg-slate-800 dark:text-slate-300">
                Resolviendo reporte: <span className="font-bold">{reporteSeleccionado?.asunto}</span>
            </div>
            <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
                <select className="w-full border border-slate-300 rounded-lg p-2 bg-white dark:bg-dark-card dark:text-white dark:border-slate-600" {...register("estado")}>
                    <option value="en_revision">En Revisión</option><option value="atendido">Atendido</option><option value="cerrado">Cerrado</option>
                </select>
            </div>
            <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Respuesta / Comentario</label>
                <textarea className="w-full border border-slate-300 rounded-lg p-2 h-24 resize-none dark:bg-dark-card dark:text-white dark:border-slate-600" placeholder="Escribe tu respuesta..." {...register("comentario_admin")}></textarea>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setModalAtenderOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar Resolución</Button>
            </div>
        </form>
      </Modal>

      {/* --- MODAL CONFIRMACIÓN ELIMINAR --- */}
      <Modal isOpen={modalDeleteOpen} onClose={() => setModalDeleteOpen(false)} title="Confirmar Eliminación">
        <div className="text-center space-y-4 py-4">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-red-600"><AlertTriangle size={32} /></div>
            <div><h3 className="text-lg font-bold text-slate-900 dark:text-white">¿Estás seguro?</h3><p className="text-slate-500 mt-2">Esta acción no se puede deshacer.</p></div>
            <div className="flex gap-3 justify-center pt-4">
                <Button variant="ghost" onClick={() => setModalDeleteOpen(false)}>Cancelar</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white border-none" onClick={confirmarEliminacion}>Sí, eliminar</Button>
            </div>
        </div>
      </Modal>

      {/* --- GALERÍA / LIGHTBOX (EVIDENCIAS) --- */}
      {galleryState.isOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={closeGallery}>
            <button onClick={closeGallery} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full z-[110]"><X size={32} /></button>
            <div className="relative w-full h-full flex items-center justify-center p-4 md:p-10" onClick={(e) => e.stopPropagation()}>
                <img src={galleryState.images[galleryState.currentIndex]} alt="Zoom" className="max-h-[85vh] max-w-full object-contain rounded-md shadow-2xl animate-scale-in select-none"/>
                {galleryState.images.length > 1 && (
                    <>
                        <button onClick={prevImage} className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/50 p-3 rounded-full"><ChevronLeft size={40} /></button>
                        <button onClick={nextImage} className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/50 p-3 rounded-full"><ChevronRight size={40} /></button>
                    </>
                )}
            </div>
        </div>
      )}

      {/* --- LIGHTBOX (ZOOM DOCUMENTO USUARIO) --- */}
      {zoomDocImage && (
        <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setZoomDocImage(null)}>
            <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2"><X size={32} /></button>
            <img src={zoomDocImage} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}/>
        </div>
      )}

    </div>
  );
};

export default GestionReportes;