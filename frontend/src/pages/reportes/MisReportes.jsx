import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Plus, AlertCircle, CheckCircle, Clock, Image as ImageIcon, X, MessageSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { obtenerMisReportes, crearReporte } from '../../api/reportes';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';

const MisReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Estado local para manejar los archivos manualmente y permitir "acumular" selecciones
  const [selectedFiles, setSelectedFiles] = useState([]); 
  const [previews, setPreviews] = useState([]);

  // Destructuramos setValue para actualizar el formulario manualmente
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  // 1. Efecto para generar URLs de previsualización cuando cambian los archivos seleccionados
  useEffect(() => {
    if (selectedFiles.length > 0) {
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
      // Limpieza de memoria
      return () => newPreviews.forEach(url => URL.revokeObjectURL(url));
    } else {
      setPreviews([]);
    }
  }, [selectedFiles]);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      const data = await obtenerMisReportes();
      setReportes(data);
    } catch (error) {
      console.error(error);
      if (error.response?.status !== 404) toast.error('Error cargando historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  // Manejador personalizado para la subida de archivos
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validar cantidad total
    if (selectedFiles.length + files.length > 3) {
      toast.error('Solo puedes subir un máximo de 3 fotos en total.');
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);
    
    // Sincronizar con React Hook Form
    setValue('fotos', newFiles); 
    
    // Limpiar el input para permitir subir el mismo archivo si se borró antes
    e.target.value = ''; 
  };

  // Función para eliminar una foto específica de la lista
  const removeImage = (indexToRemove) => {
    const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(newFiles);
    setValue('fotos', newFiles);
  };

  const onSubmit = async (data) => {
    try {
      // data.fotos ya tiene el array actualizado gracias a setValue
      await crearReporte(data);
      toast.success('Reporte enviado correctamente');
      handleCloseModal();
      cargarReportes();
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar reporte');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFiles([]); // Limpiar archivos
    setPreviews([]);      // Limpiar previews
    reset();              // Limpiar formulario
  };

  const getStatusConfig = (estado) => {
    switch (estado) {
      case 'nuevo': return { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, text: 'Nuevo' };
      case 'en_revision': return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'En Revisión' };
      case 'atendido': return { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Atendido' };
      case 'cerrado': return { color: 'bg-slate-200 text-slate-600', icon: X, text: 'Cerrado' };
      default: return { color: 'bg-slate-100 text-slate-800', icon: AlertCircle, text: estado };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Reportes</h1>
          <p className="text-slate-500 dark:text-slate-400">Historial de incidencias reportadas.</p>
        </div>
        <Button onClick={() => setShowModal(true)} icon={Plus}>
          Crear Reporte
        </Button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="py-10 text-center text-slate-500 animate-pulse">Cargando reportes...</div>
      ) : reportes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-card rounded-xl border border-dashed border-slate-300">
          <div className="bg-slate-50 inline-flex p-4 rounded-full mb-3">
             <FileText className="text-slate-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">Sin reportes</h3>
          <p className="text-slate-500 mt-1">No tienes incidencias registradas.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {reportes.map((reporte) => {
            const status = getStatusConfig(reporte.estado);
            const StatusIcon = status.icon;

            return (
              <Card key={reporte.id_reporte} className="border-l-4 border-l-brand-500 hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${status.color}`}>
                        <StatusIcon size={14} /> {status.text}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(reporte.fecha_envio).toLocaleDateString()} • {new Date(reporte.fecha_envio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{reporte.asunto}</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">{reporte.descripcion}</p>
                    
                    {reporte.comentario_admin && (
                      <div className="mt-3 bg-brand-50 dark:bg-brand-900/20 p-3 rounded-lg border border-brand-100 dark:border-brand-800 flex gap-3">
                         <MessageSquare className="text-brand-500 mt-0.5 flex-shrink-0" size={18}/>
                         <div>
                            <p className="text-xs font-bold text-brand-700 dark:text-brand-300 uppercase mb-1">Respuesta del Staff</p>
                            <p className="text-sm text-slate-700 dark:text-slate-200">{reporte.comentario_admin}</p>
                         </div>
                      </div>
                    )}
                  </div>

                  {reporte.fotos_evidencia && reporte.fotos_evidencia.length > 0 && (
                    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                      {reporte.fotos_evidencia.map((fotoUrl, idx) => (
                        <a key={idx} href={fotoUrl} target="_blank" rel="noopener noreferrer" className="relative group w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                          <img src={fotoUrl} alt="Evidencia" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Crear */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title="Nuevo Reporte de Incidencia">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Asunto"
            placeholder="Ej: Auto obstruyendo paso"
            error={errors.asunto?.message}
            {...register("asunto", { required: "El asunto es requerido" })}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none dark:bg-dark-card dark:border-slate-600 dark:text-white h-32 resize-none"
              placeholder="Detalla lo sucedido..."
              {...register("descripcion", { required: "Describe el problema" })}
            />
            {errors.descripcion && <span className="text-xs text-red-500">{errors.descripcion.message}</span>}
          </div>

          {/* Área de Subida de Fotos Mejorada */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Evidencia Fotográfica
              </label>
              <span className={`text-xs ${selectedFiles.length >= 3 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {selectedFiles.length} / 3 Fotos
              </span>
            </div>
            
            <div className="flex items-center justify-center w-full">
              <label className={`
                flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-all
                ${selectedFiles.length >= 3 
                  ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700' 
                  : 'border-slate-300 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-700'}
              `}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {selectedFiles.length >= 3 ? (
                    <>
                      <ImageIcon className="w-8 h-8 mb-2 text-slate-400" />
                      <p className="text-sm text-slate-400 font-bold">Límite alcanzado</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 mb-2 text-slate-500" />
                      <p className="text-sm text-slate-500"><span className="font-semibold">Click para subir</span></p>
                      <p className="text-xs text-slate-500">JPG, PNG (Máx 3)</p>
                    </>
                  )}
                </div>
                
                {/* Input deshabilitado si ya hay 3 fotos */}
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={selectedFiles.length >= 3}
                />
              </label>
            </div>

            {/* Previews con Botón de Eliminar */}
            {previews.length > 0 && (
              <div className="flex gap-3 mt-4 overflow-x-auto p-1">
                {previews.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
                    <img src={url} className="w-full h-full object-cover" alt="Preview" />
                    
                    {/* Botón X para eliminar */}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button type="button" variant="ghost" onClick={handleCloseModal}>Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting}>Enviar Reporte</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default MisReportes;