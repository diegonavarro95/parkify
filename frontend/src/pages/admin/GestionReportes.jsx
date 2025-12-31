import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, CheckCircle, Clock, X, MessageSquare, Trash2, User, AlertTriangle, Calendar, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { obtenerTodosReportes, atenderReporte, eliminarReporte } from '../../api/reportes';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
// 👇 Importamos la nueva tarjeta interactiva
import InteractiveCard from '../../components/common/InteractiveCard';

const GestionReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  
  // --- Estados de Modales ---
  const [modalAtenderOpen, setModalAtenderOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  // --- Estado para Galería (Lightbox) ---
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

  // --- 2. Lógica de Modales ---

  // Abrir Detalle (Click en tarjeta)
  const abrirDetalle = (reporte) => {
    setReporteSeleccionado(reporte);
    setModalDetalleOpen(true);
  };

  // Abrir Atender (Click en botón)
  const abrirAtender = (e, reporte) => {
    e.stopPropagation(); // Evita que se abra el detalle
    setReporteSeleccionado(reporte);
    setValue('estado', reporte.estado); 
    setValue('comentario_admin', reporte.comentario_admin || '');
    setModalAtenderOpen(true);
  };

  // Abrir Eliminar (Click en botón)
  const abrirEliminar = (e, reporte) => {
    e.stopPropagation(); // Evita que se abra el detalle
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
      setModalDetalleOpen(false); // Cierra el detalle si estaba abierto
      cargarDatos();
    } catch (error) {
      toast.error('No se pudo eliminar');
    }
  };

  // --- 4. Lógica de Galería (Lightbox) ---
  const openGallery = (e, images, index) => {
    e?.stopPropagation();
    setGalleryState({ isOpen: true, images, currentIndex: index });
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

  // Teclado para galería
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
            // Verificar si está finalizado
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
                      {/* FECHA Y HORA */}
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
                    
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md w-fit">
                        <User size={14} />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {reporte.usuario?.nombre_completo || 'Usuario desconocido'}
                        </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 line-clamp-2">
                        {reporte.descripcion}
                    </p>

                    {/* Previsualización de fotos (max 3) */}
                    {reporte.fotos_evidencia?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                            {reporte.fotos_evidencia.slice(0, 3).map((url, i) => (
                                <div key={i} className="w-10 h-10 rounded overflow-hidden border border-slate-200">
                                    <img src={url} className="w-full h-full object-cover" alt="evidencia" />
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
                     
                     <Button 
                        size="sm" 
                        onClick={(e) => abrirAtender(e, reporte)} 
                        disabled={isFinalized} 
                        className={`flex-1 md:flex-none ${isFinalized ? 'opacity-50 cursor-not-allowed bg-slate-400 hover:bg-slate-400' : ''}`}
                     >
                        <MessageSquare size={16} className="mr-2" /> 
                        {isFinalized ? 'Resuelto' : 'Atender'}
                     </Button>
                     
                     <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => abrirEliminar(e, reporte)} 
                        className="flex-1 md:flex-none text-red-600 border-red-200 hover:bg-red-50 z-10"
                     >
                        <Trash2 size={16} className="mr-2" /> Eliminar
                     </Button>
                  </div>

                </div>
              </InteractiveCard>
            );
          })}
        </div>
      )}

      {/* --- MODAL DETALLE --- */}
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

                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="bg-white p-2 rounded-full shadow-sm dark:bg-slate-700">
                        <User size={20} className="text-slate-600 dark:text-slate-300"/>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{reporteSeleccionado.usuario?.nombre_completo}</p>
                        <p className="text-xs text-slate-500">{reporteSeleccionado.usuario?.email}</p>
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
                                    <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="evidencia" />
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
                        <p className="text-xs text-brand-600/70 mt-2 text-right">
                             
                        </p>
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

      {/* --- MODAL ATENDER --- */}
      <Modal isOpen={modalAtenderOpen} onClose={() => setModalAtenderOpen(false)} title="Resolver Reporte">
        <form onSubmit={handleSubmit(onSubmitAtender)} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 mb-4 dark:bg-slate-800 dark:text-slate-300">
                Resolviendo reporte: <span className="font-bold">{reporteSeleccionado?.asunto}</span>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado del Reporte</label>
                <select 
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white dark:bg-dark-card dark:text-white dark:border-slate-600"
                    {...register("estado")}
                >
                    <option value="en_revision">En Revisión</option>
                    <option value="atendido">Atendido (Solucionado)</option>
                    <option value="cerrado">Cerrado (Descartado/Finalizado)</option>
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Respuesta / Comentario</label>
                <textarea 
                    className="w-full border border-slate-300 rounded-lg p-2 h-24 resize-none dark:bg-dark-card dark:text-white dark:border-slate-600"
                    placeholder="Describe la solución o da respuesta al alumno..."
                    {...register("comentario_admin")}
                ></textarea>
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
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-red-600">
                <AlertTriangle size={32} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">¿Estás seguro?</h3>
                <p className="text-slate-500 mt-2">
                    Esta acción eliminará el reporte y sus evidencias permanentemente. No se puede deshacer.
                </p>
            </div>
            
            <div className="flex gap-3 justify-center pt-4">
                <Button variant="ghost" onClick={() => setModalDeleteOpen(false)}>Cancelar</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white border-none" onClick={confirmarEliminacion}>Sí, eliminar</Button>
            </div>
        </div>
      </Modal>

      {/* --- GALERÍA / LIGHTBOX --- */}
      {galleryState.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={closeGallery}>
            <button onClick={closeGallery} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full z-[110]">
                <X size={32} />
            </button>

            <div className="relative w-full h-full flex items-center justify-center p-4 md:p-10" onClick={(e) => e.stopPropagation()}>
                <img 
                    src={galleryState.images[galleryState.currentIndex]} 
                    alt="Zoom" 
                    className="max-h-[85vh] max-w-full object-contain rounded-md shadow-2xl animate-scale-in select-none"
                />

                {galleryState.images.length > 1 && (
                    <>
                        <button onClick={prevImage} className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/50 p-3 rounded-full">
                            <ChevronLeft size={40} />
                        </button>
                        <button onClick={nextImage} className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/50 p-3 rounded-full">
                            <ChevronRight size={40} />
                        </button>
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                            {galleryState.images.map((_, idx) => (
                                <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === galleryState.currentIndex ? 'bg-white w-4' : 'bg-white/40'}`} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
      )}

    </div>
  );
};

export default GestionReportes;