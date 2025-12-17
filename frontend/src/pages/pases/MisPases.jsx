import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Car, RefreshCw, MapPin, Bike } from 'lucide-react';
import { Link } from 'react-router-dom';
import { obtenerMisVehiculos } from '../../api/vehiculos';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const MisPases = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar vehículos al inicio
  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerMisVehiculos();
        setVehiculos(data);
        // Seleccionar automáticamente el primero si existe
        if (data.length > 0) {
          setVehiculoSeleccionado(data[0]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const getImagenVehiculo = (v) => v.foto_url || v.foto_documento_validacion;

  if (loading) return <div className="p-10 text-center text-slate-500">Generando accesos digitales...</div>;

  // Estado vacío: Si no tiene vehículos
  if (vehiculos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-dark-card rounded-xl border border-dashed border-slate-300">
        <div className="p-4 bg-slate-50 rounded-full mb-4">
          <Car size={40} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sin vehículos registrados</h2>
        <p className="text-slate-500 mb-6 max-w-sm text-center mt-2">
          Para generar un Pase de Acceso (QR), primero necesitas registrar tu automóvil o motocicleta.
        </p>
        <Link to="/mis-vehiculos">
          <Button>Registrar Vehículo</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pase de Acceso Digital</h1>
        <p className="text-slate-500 dark:text-slate-400">Muestra este código QR al guardia en la entrada/salida.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: Selector de Vehículo */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">Selecciona tu vehículo:</h3>
          
          <div className="space-y-3">
            {vehiculos.map((v) => (
              <div 
                key={v.id_vehiculo}
                onClick={() => setVehiculoSeleccionado(v)}
                className={`
                  cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-4
                  ${vehiculoSeleccionado?.id_vehiculo === v.id_vehiculo 
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-md' 
                    : 'border-slate-200 hover:border-brand-200 bg-white dark:bg-dark-card dark:border-slate-700'}
                `}
              >
                {/* Miniatura Imagen */}
                <div className="h-16 w-24 bg-slate-200 rounded-md overflow-hidden flex-shrink-0">
                    {getImagenVehiculo(v) ? (
                        <img src={getImagenVehiculo(v)} className="h-full w-full object-cover" alt="miniatura"/>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-400"><Car size={20}/></div>
                    )}
                </div>
                
                {/* Info Texto */}
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-900 dark:text-white">{v.marca} {v.modelo}</p>
                    {v.tipo === 'motocicleta' && <Bike size={16} className="text-orange-500"/>}
                  </div>
                  <p className="text-sm text-slate-500">{v.placas}</p>
                </div>

                {/* Radio Button Visual */}
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${vehiculoSeleccionado?.id_vehiculo === v.id_vehiculo ? 'border-brand-500' : 'border-slate-300'}
                `}>
                  {vehiculoSeleccionado?.id_vehiculo === v.id_vehiculo && (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: El Pase QR (Card Principal) */}
{vehiculoSeleccionado && (
  <Card className="border-0 shadow-2xl overflow-hidden relative bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900 text-white">
    {/* CAMBIOS REALIZADOS:
       1. 'to-slate-900': El final del degradado ahora es casi negro/azul muy oscuro para máximo contraste.
       2. 'via-brand-700': Agregamos un paso intermedio para que el azul se mantenga vivo al centro.
    */}
    
    {/* Fondo decorativo (Icono gigante) */}
    <div className="absolute top-0 right-0 p-4 opacity-5 text-white"> 
      {/* Bajé la opacidad a 5% para que no estorbe visualmente */}
      <Car size={150} />
    </div>

    <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-6">
      
      {/* Header del Pase */}
      <div className="w-full border-b border-white/10 pb-4">
        <p className="text-brand-200 text-sm font-medium tracking-widest uppercase">Pase Oficial ESCOM</p>
        <h2 className="text-3xl font-black mt-1 tracking-tight">{vehiculoSeleccionado.placas}</h2>
        <p className="text-brand-100 text-sm mt-1 capitalize opacity-90">{vehiculoSeleccionado.color} • {vehiculoSeleccionado.marca}</p>
      </div>

      {/* El Código QR */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <QRCode 
          value={JSON.stringify({
            id: vehiculoSeleccionado.id_vehiculo,
            placas: vehiculoSeleccionado.placas,
            tipo: vehiculoSeleccionado.tipo
          })}
          size={200}
          level="H" 
        />
      </div>

      {/* Footer del Pase */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 justify-center text-white bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
          <MapPin size={18} />
          <span className="text-sm font-medium">Acceso Estudiantes - Puerta 3</span>
        </div>
        <p className="text-xs text-brand-300/80">
           Este código es personal e intransferible.
        </p>
      </div>

    </div>

    {/* Barra de estado inferior */}
    {/* Cambié el fondo a bg-black/20 para oscurecer en lugar de aclarar */}
    <div className="bg-black/20 backdrop-blur-md p-4 flex justify-between items-center text-sm border-t border-white/5">
       <span className="flex items-center gap-2 font-medium text-brand-50">
         <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
         Estatus: Activo
       </span>
       <span className="opacity-75 text-brand-100">{new Date().toLocaleDateString()}</span>
    </div>

  </Card>
)}
      </div>
    </div>
  );
};

export default MisPases;