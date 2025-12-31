import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, CheckCircle, Clock, X, MessageSquare, Trash2, Filter, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { obtenerTodosReportes, atenderReporte, eliminarReporte } from '../../api/reportes';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const GestionReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos'); // todos, nuevo, atendido...
  
  // Estado para el Modal de Atender
  const [modalOpen, setModalOpen] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  const { register, handleSubmit, reset, setValue } = useForm();

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

  // Filtrado en el cliente (frontend)
  const reportesFiltrados = filtroEstado === 'todos' 
    ? reportes 
    : reportes.filter(r => r.estado === filtroEstado);

  // Abrir modal para atender
  const handleAtenderClick = (reporte) => {
    setReporteSeleccionado(reporte);
    setValue('estado', reporte.estado); // Poner estado actual por defecto
    setValue('comentario_admin', reporte.comentario_admin || '');
    setModalOpen(true);
  };

  // Enviar formulario del modal
  const onSubmitAtender = async (data) => {
    try {
      await atenderReporte(reporteSeleccionado.id_reporte, data);
      toast.success('Reporte actualizado correctamente');
      setModalOpen(false);
      cargarDatos(); // Recargar lista
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este reporte permanentemente?')) return;
    try {
      await eliminarReporte(id);
      toast.success('Eliminado');
      cargarDatos();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  // Configuración visual de estados
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
      
      {/* Header y Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Reportes</h1>
          <p className="text-slate-500">Administra y resuelve las incidencias de la comunidad.</p>
        </div>
        
        {/* Selector de Filtro */}
        <div className="flex bg-white dark:bg-dark-card p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
           {['todos', 'nuevo', 'en_revision', 'atendido'].map((filtro) => (
             <button
               key={filtro}
               onClick={() => setFiltroEstado(filtro)}
               className={`px-3 py-1.5 text-sm rounded-md transition-all ${
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

            return (
              <Card key={reporte.id_reporte} className="border-l-4 border-l-slate-300 hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row gap-4">
                  
                  {/* Info Principal */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase ${status.color}`}>
                        <StatusIcon size={12} /> {status.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(reporte.fecha_envio).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{reporte.asunto}</h3>
                    
                    {/* Datos del Alumno */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md w-fit">
                        <User size={14} />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {reporte.usuario?.nombre_completo || 'Usuario desconocido'}
                        </span>
                        <span className="text-xs opacity-70">({reporte.usuario?.email})</span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">{reporte.descripcion}</p>

                    {/* Evidencias (Miniaturas) */}
                    {reporte.fotos_evidencia?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                            {reporte.fotos_evidencia.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                    <img src={url} className="w-12 h-12 rounded object-cover border border-slate-200 hover:scale-110 transition-transform" />
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Respuesta Admin (Si existe) */}
                    {reporte.comentario_admin && (
                        <div className="mt-3 pl-3 border-l-2 border-brand-500">
                            <p className="text-xs font-bold text-brand-600 uppercase">Respuesta Staff:</p>
                            <p className="text-sm text-slate-600 italic">"{reporte.comentario_admin}"</p>
                        </div>
                    )}
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex md:flex-col gap-2 justify-end md:justify-start border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                     <Button size="sm" onClick={() => handleAtenderClick(reporte)} className="flex-1 md:flex-none">
                        <MessageSquare size={16} className="mr-2" /> Atender
                     </Button>
                     <Button size="sm" variant="outline" onClick={() => handleEliminar(reporte.id_reporte)} className="flex-1 md:flex-none text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 size={16} className="mr-2" /> Eliminar
                     </Button>
                  </div>

                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL DE ATENCIÓN */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Resolver Reporte">
        <form onSubmit={handleSubmit(onSubmitAtender)} className="space-y-4">
            
            <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 mb-4">
                Resolviendo reporte: <span className="font-bold">{reporteSeleccionado?.asunto}</span>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Estado del Reporte</label>
                <select 
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white dark:bg-dark-card dark:text-white dark:border-slate-600"
                    {...register("estado")}
                >
                    <option value="en_revision">En Revisión (Estamos trabajando)</option>
                    <option value="atendido">Atendido (Solucionado)</option>
                    <option value="cerrado">Cerrado (Descartado/Finalizado)</option>
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Respuesta / Comentario</label>
                <textarea 
                    className="w-full border border-slate-300 rounded-lg p-2 h-24 resize-none dark:bg-dark-card dark:text-white dark:border-slate-600"
                    placeholder="Describe la solución o da respuesta al alumno..."
                    {...register("comentario_admin")}
                ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar Resolución</Button>
            </div>
        </form>
      </Modal>

    </div>
  );
};

export default GestionReportes;