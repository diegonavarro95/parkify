import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Car, Plus, X, Upload, Trash2, Bike, AlertTriangle } from 'lucide-react'; // <--- AlertTriangle Agregado
import toast from 'react-hot-toast';
import { obtenerMisVehiculos, registrarVehiculo, eliminarVehiculo } from '../../api/vehiculos'; // <--- eliminarVehiculo Agregado
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';

const MisVehiculos = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Estados para Modales
  const [selectedVehiculo, setSelectedVehiculo] = useState(null); // Detalle
  const [vehiculoAEliminar, setVehiculoAEliminar] = useState(null); // Confirmación Borrado

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();
  const fotoWatch = watch('foto');

  useEffect(() => {
    if (fotoWatch && fotoWatch.length > 0) {
      const file = fotoWatch[0];
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [fotoWatch]);

  const cargarVehiculos = async () => {
    try {
      setLoading(true);
      const data = await obtenerMisVehiculos();
      setVehiculos(data);
    } catch (error) {
      toast.error('Error cargando tus vehículos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const onSubmit = async (data) => {
    try {
      await registrarVehiculo(data);
      toast.success('Vehículo registrado exitosamente');
      limpiarFormulario();
      cargarVehiculos(); 
    } catch (error) {
      const msg = error.response?.data?.error || 'Error al registrar vehículo';
      toast.error(msg);
    }
  };

  // --- NUEVA FUNCIÓN DE ELIMINAR ---
  const confirmarEliminacion = async () => {
    if (!vehiculoAEliminar) return;

    try {
      await eliminarVehiculo(vehiculoAEliminar.id_vehiculo);
      toast.success('Vehículo eliminado correctamente');
      
      // Actualizar UI
      setVehiculoAEliminar(null);
      cargarVehiculos();
      
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'No se pudo eliminar el vehículo';
      toast.error(msg);
      setVehiculoAEliminar(null);
    }
  };
  // ---------------------------------

  const limpiarFormulario = () => {
    setShowForm(false);
    setPreviewUrl(null);
    reset();
  };

  const getImagenVehiculo = (v) => v.foto_url || v.foto_documento_validacion;

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Vehículos</h1>
          <p className="text-slate-500 dark:text-slate-400">Administra tus autos registrados</p>
        </div>
        
        {!showForm && vehiculos.length < 2 && (
          <Button onClick={() => setShowForm(true)} icon={Plus}>
            Nuevo Vehículo
          </Button>
        )}
      </div>

      {/* Formulario (Sin cambios) */}
      {showForm && (
        <Card className="animate-slide-up border-brand-200 shadow-brand-100">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="font-semibold text-lg text-brand-700">Registrar Nuevo Vehículo</h3>
            <button onClick={limpiarFormulario} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Tipo de Vehículo
                </label>
                <select 
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:bg-dark-card dark:border-slate-600 dark:text-white"
                  {...register("tipo", { required: "Selecciona el tipo" })}
                >
                  <option value="automovil">Automóvil</option>
                  <option value="motocicleta">Motocicleta</option>
                </select>
              </div>
              <Input
                label="Placas"
                placeholder="ABC-123-D"
                className="uppercase"
                error={errors.placas?.message}
                {...register("placas", { 
                  required: "Las placas son obligatorias",
                  pattern: { value: /^[A-Z0-9-]{6,9}$/, message: "Formato inválido" }
                })}
                onInput={(e) => e.target.value = e.target.value.toUpperCase()}
              />
              <Input label="Marca" placeholder="Nissan" error={errors.marca?.message} {...register("marca", { required: true })} />
              <Input label="Modelo" placeholder="Versa" error={errors.modelo?.message} {...register("modelo", { required: true })} />
              <Input label="Color" placeholder="Rojo" error={errors.color?.message} {...register("color", { required: true })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Foto del Vehículo</label>
              <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors relative overflow-hidden ${previewUrl ? 'border-brand-500 bg-slate-50' : 'border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800'}`}>
                <div className="space-y-1 text-center relative z-10">
                  {previewUrl ? (
                    <div className="relative">
                       <img src={previewUrl} alt="Preview" className="mx-auto h-48 object-contain rounded-md shadow-md" />
                       <p className="mt-2 text-xs text-brand-600 font-medium">Click para cambiar imagen</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-slate-400" />
                      <p className="text-xs text-slate-500">Sube una foto clara del vehículo (JPG/PNG)</p>
                    </>
                  )}
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" {...register("foto", { required: "La foto es obligatoria" })} />
                </div>
              </div>
              {errors.foto && <p className="text-sm text-red-500 mt-1">{errors.foto.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={limpiarFormulario}>Cancelar</Button>
              <Button type="submit" isLoading={isSubmitting}>Guardar Vehículo</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-center py-10 text-slate-500">Cargando vehículos...</div>
      ) : vehiculos.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-white dark:bg-dark-card rounded-xl border border-dashed border-slate-300">
          <Car className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">No tienes vehículos</h3>
          <p className="mt-1 text-sm text-slate-500">Registra uno para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vehiculos.map((vehiculo) => (
            <div key={vehiculo.id_vehiculo} onClick={() => setSelectedVehiculo(vehiculo)} className="cursor-pointer">
              <Card className="overflow-hidden group hover:ring-2 ring-brand-200 transition-all h-full">
                <div className="aspect-video w-full bg-slate-100 relative">
                  {getImagenVehiculo(vehiculo) ? (
                    <img src={getImagenVehiculo(vehiculo)} alt={vehiculo.modelo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400"><Car size={48} /></div>
                  )}
                  <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold shadow-sm text-white flex items-center gap-1 uppercase ${vehiculo.tipo === 'motocicleta' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                          {vehiculo.tipo === 'motocicleta' ? <Bike size={12}/> : <Car size={12}/>}
                          {vehiculo.tipo === 'motocicleta' ? 'Moto' : 'Auto'}
                      </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{vehiculo.marca} {vehiculo.modelo}</h3>
                      <p className="text-sm text-slate-500 capitalize">{vehiculo.color}</p>
                    </div>
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-sm font-semibold border border-slate-200 dark:border-slate-700">{vehiculo.placas}</span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                        // ACTIVAR MODAL DE CONFIRMACIÓN
                        onClick={(e) => {
                          e.stopPropagation(); // IMPORTANTE: Para que no se abra el modal de detalle
                          setVehiculoAEliminar(vehiculo);
                        }}
                      >
                        <Trash2 size={18} />
                      </Button> 
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL 1: DETALLES --- */}
      <Modal
        isOpen={!!selectedVehiculo}
        onClose={() => setSelectedVehiculo(null)}
        title="Detalles del Vehículo"
      >
        {selectedVehiculo && (
          <div className="space-y-6">
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50">
               {getImagenVehiculo(selectedVehiculo) ? (
                  <img src={getImagenVehiculo(selectedVehiculo)} alt="Vehiculo" className="w-full h-64 object-cover" />
               ) : (
                 <div className="h-40 flex items-center justify-center text-slate-400">Sin Imagen</div>
               )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Placas</p>
                <p className="text-lg font-mono font-bold text-slate-900 dark:text-white">{selectedVehiculo.placas}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Tipo</p>
                <p className="text-lg font-medium text-slate-900 dark:text-white capitalize">{selectedVehiculo.tipo}</p>
              </div>
              {/* Más detalles... */}
              <div><p className="text-xs text-slate-500">Marca</p><p className="font-medium">{selectedVehiculo.marca}</p></div>
              <div><p className="text-xs text-slate-500">Modelo</p><p className="font-medium">{selectedVehiculo.modelo}</p></div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedVehiculo(null)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* --- MODAL 2: CONFIRMACIÓN DE BORRADO (Danger Zone) --- */}
      <Modal
        isOpen={!!vehiculoAEliminar}
        onClose={() => setVehiculoAEliminar(null)}
        title="Confirmar Eliminación"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          
          <div className="mt-2">
            <p className="text-sm text-slate-500">
              ¿Estás seguro de que quieres eliminar el vehículo con placas <span className="font-bold text-slate-900">{vehiculoAEliminar?.placas}</span>?
            </p>
            <p className="text-xs text-red-500 mt-2 font-medium">
              Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="mt-5 sm:mt-6 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setVehiculoAEliminar(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarEliminacion}>
              Sí, eliminar
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default MisVehiculos;