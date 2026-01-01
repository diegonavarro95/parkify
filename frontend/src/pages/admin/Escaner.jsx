import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode'; 
import { Shield, RefreshCw, CheckCircle, ArrowRight, User, MapPin, Bike, Car, Camera, Image as ImageIcon, X, ZoomIn } from 'lucide-react';
import QRScanner from '../../components/scanner/QRScanner';
// 👇 Importamos obtenerMapaMotos para traer los cajones reales
import { validarAcceso, registrarMovimiento, obtenerMapaMotos } from '../../api/accesos';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const Escaner = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedCajon, setSelectedCajon] = useState(null);
  
  // Estado para guardar los cajones reales traídos de la BD
  const [cajonesDisponibles, setCajonesDisponibles] = useState([]);

  // Estado para el visor de imagen (Lightbox)
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const fileInputRef = useRef(null);

  // --- CARGAR CAJONES AL INICIAR ---
  const cargarCajones = async () => {
    try {
        const data = await obtenerMapaMotos();
        // Solo nos interesan los disponibles para asignarlos
        setCajonesDisponibles(data.filter(c => c.estado === 'disponible'));
    } catch (error) {
        console.error("Error cargando cajones", error);
    }
  };

  useEffect(() => {
    cargarCajones();
  }, []);

  // --- LÓGICA DE PROCESAMIENTO ---
  const procesarCodigo = async (decodedText) => {
    try {
      setCameraActive(false);
      setLoading(true);
      setScanResult(null);
      setSelectedCajon(null);
      
      // Actualizamos cajones por si alguien ocupó uno mientras escaneábamos
      cargarCajones(); 

      if (fileInputRef.current) fileInputRef.current.value = '';

      let idParaEnviar;
      try {
        const qrData = JSON.parse(decodedText);
        idParaEnviar = qrData.id; 
      } catch (e) {
        idParaEnviar = decodedText; 
      }

      const data = await validarAcceso(idParaEnviar);
      setScanResult(data);
      if (navigator.vibrate) navigator.vibrate(200);

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'No se pudo validar el código';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- MANEJO DE ARCHIVOS ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode("reader-hidden");
    try {
        setLoading(true);
        const decodedText = await html5QrCode.scanFile(file, true);
        html5QrCode.clear();
        procesarCodigo(decodedText);
    } catch (err) {
        toast.error("No se detectó QR en la imagen");
        setLoading(false);
        html5QrCode.clear();
    }
  };

  // --- CONFIRMAR ---
  const handleConfirmar = async () => {
    if (!scanResult) return;
    const { vehiculo, accionSugerida } = scanResult;

    const esMoto = vehiculo.tipo.toLowerCase().includes('moto');
    const esEntrada = accionSugerida === 'entrada';

    if (esMoto && esEntrada && !selectedCajon) {
      toast.error('⚠️ Selecciona un cajón para la moto');
      return;
    }

    try {
      setLoading(true);
      await registrarMovimiento({
        id_vehiculo: vehiculo.id_vehiculo,
        tipo_movimiento: accionSugerida,
        id_cajon_moto: selectedCajon // Enviamos el ID real del cajón
      });
      toast.success(`${accionSugerida.toUpperCase()} ACEPTADA`);
      setScanResult(null);
      setSelectedCajon(null);
      cargarCajones(); // Recargar mapa para la siguiente
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const cancelar = () => {
    setScanResult(null);
    setCameraActive(false);
  };

  // Filtros para mostrar ordenado
  const cajonesA = cajonesDisponibles.filter(c => c.zona === 'A');
  const cajonesB = cajonesDisponibles.filter(c => c.zona === 'B');

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 pb-32 relative">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2">
          <Shield className="text-brand-600" />
          Control de Acceso
        </h1>
        <p className="text-slate-500 mt-1">Guardia en Turno • Puerta Principal</p>
      </div>

      {/* --- ZONA ESCÁNER --- */}
      {!scanResult && !loading && (
        <div className="space-y-8 animate-fade-in">
            <div className="relative w-full aspect-square max-w-sm mx-auto bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                {cameraActive ? (
                    <>
                        <QRScanner 
                            onScanSuccess={procesarCodigo} 
                            onScanError={(err) => {
                                if(err === "PERMISO_DENEGADO") {
                                    setCameraActive(false);
                                    toast.error("Permiso denegado");
                                }
                            }}
                        />
                        <button onClick={() => setCameraActive(false)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full z-10 hover:bg-red-600 transition-colors">
                            <X size={20} />
                        </button>
                    </>
                ) : (
                    <div className="text-slate-500 flex flex-col items-center">
                        <Camera size={64} className="mb-4 opacity-50" />
                        <p className="text-sm font-medium">Cámara Inactiva</p>
                    </div>
                )}
            </div>

            {!cameraActive && (
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <button onClick={() => setCameraActive(true)} className="flex flex-col items-center justify-center gap-2 p-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-lg active:scale-95 transition-all">
                        <Camera size={28} /> <span className="font-bold">Cámara</span>
                    </button>
                    <button onClick={() => fileInputRef.current.click()} className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-lg active:scale-95 transition-all dark:bg-slate-800 dark:text-white dark:border-slate-700">
                        <ImageIcon size={28} /> <span className="font-bold">Galería</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload}/>
                </div>
            )}
        </div>
      )}

      {/* --- CARGANDO --- */}
      {loading && (
        <div className="h-64 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 animate-pulse">
           <RefreshCw size={48} className="text-brand-500 animate-spin mb-4"/>
           <p className="text-lg font-medium text-slate-600">Procesando...</p>
        </div>
      )}

      {/* --- RESULTADO --- */}
      {scanResult && !loading && (
        <div className="animate-slide-up">
           <Card className={`border-t-[10px] shadow-2xl overflow-hidden ${
               scanResult.accionSugerida === 'entrada' ? 'border-t-emerald-500' : 'border-t-orange-500'
           }`}>
              
              <div className={`py-3 text-center text-white font-bold tracking-widest text-lg uppercase mb-6 ${
                  scanResult.accionSugerida === 'entrada' ? 'bg-emerald-500' : 'bg-orange-500'
              }`}>
                  {scanResult.accionSugerida === 'entrada' ? 'Permitir Entrada' : 'Registrar Salida'}
              </div>

              <div className="px-6 pb-8 space-y-6">

                  <div className="flex items-start gap-5">
                      
                      {/* --- FOTO / ICONO --- */}
                      <div 
                        className={`w-24 h-24 bg-slate-100 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-200 relative group ${scanResult.vehiculo.foto_url ? 'cursor-zoom-in' : ''}`}
                        onClick={() => scanResult.vehiculo.foto_url && setImageModalOpen(true)}
                      >
                          {scanResult.vehiculo.foto_url ? (
                              <>
                                <img 
                                    src={scanResult.vehiculo.foto_url} 
                                    alt="Vehículo" 
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ZoomIn className="text-white drop-shadow-md" size={24} />
                                </div>
                              </>
                          ) : (
                              scanResult.vehiculo.tipo.toLowerCase().includes('moto') 
                                ? <Bike size={40} className="text-slate-400"/> 
                                : <Car size={40} className="text-slate-400"/>
                          )}
                      </div>
                      
                      <div className="flex-1">
                          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                              {scanResult.vehiculo.placas}
                          </h2>
                          <p className="text-xl text-slate-500 font-medium mb-3">
                              {scanResult.vehiculo.marca} {scanResult.vehiculo.modelo}
                          </p>
                          <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg">
                              <User size={18} className="text-slate-500"/>
                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                  {scanResult.vehiculo.conductor}
                              </span>
                          </div>
                      </div>
                  </div>

                  {/* SELECCIÓN DE CAJÓN (DINÁMICO DESDE BD) */}
                  {(scanResult.vehiculo.tipo.toLowerCase().includes('moto')) && scanResult.accionSugerida === 'entrada' && (
                     <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-5 dark:bg-yellow-900/10 dark:border-yellow-700">
                        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-500 font-bold mb-4 text-lg">
                           <MapPin /> Asignar Cajón
                        </div>
                        
                        {cajonesDisponibles.length === 0 ? (
                           <p className="text-center text-red-500 font-bold">¡NO HAY CAJONES DISPONIBLES!</p>
                        ) : (
                           <div className="space-y-3">
                               {/* Fila A */}
                               {cajonesA.length > 0 && (
                                 <div>
                                   <p className="text-xs font-bold text-slate-400 mb-1">FILA A</p>
                                   <div className="flex flex-wrap gap-2">
                                     {cajonesA.map((cajon) => (
                                        <button 
                                          key={cajon.id_cajon} 
                                          onClick={() => setSelectedCajon(cajon.id_cajon)} 
                                          className={`px-3 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${
                                            selectedCajon === cajon.id_cajon 
                                            ? 'bg-brand-600 text-white scale-110 shadow-brand-200 ring-2 ring-brand-300' 
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                          }`}
                                        >
                                          {cajon.identificador}
                                        </button>
                                     ))}
                                   </div>
                                 </div>
                               )}

                               {/* Fila B */}
                               {cajonesB.length > 0 && (
                                 <div>
                                   <p className="text-xs font-bold text-slate-400 mb-1">FILA B</p>
                                   <div className="flex flex-wrap gap-2">
                                     {cajonesB.map((cajon) => (
                                        <button 
                                          key={cajon.id_cajon} 
                                          onClick={() => setSelectedCajon(cajon.id_cajon)} 
                                          className={`px-3 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${
                                            selectedCajon === cajon.id_cajon 
                                            ? 'bg-brand-600 text-white scale-110 shadow-brand-200 ring-2 ring-brand-300' 
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                          }`}
                                        >
                                          {cajon.identificador}
                                        </button>
                                     ))}
                                   </div>
                                 </div>
                               )}
                           </div>
                        )}
                     </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4">
                     <Button variant="outline" onClick={cancelar} className="h-16 text-lg border-2">Cancelar</Button>
                     <Button onClick={handleConfirmar} className={`h-16 text-lg font-bold shadow-lg ${scanResult.accionSugerida === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                        CONFIRMAR {scanResult.accionSugerida.toUpperCase()}
                     </Button>
                  </div>
              </div>
           </Card>
        </div>
      )}

      {/* --- VISOR DE IMAGEN (MODAL NEGRO) --- */}
      {imageModalOpen && scanResult?.vehiculo?.foto_url && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4"
            onClick={() => setImageModalOpen(false)}
        >
            <button 
                className="absolute top-4 right-4 bg-white/10 text-white p-3 rounded-full hover:bg-white/20 transition-colors"
                onClick={() => setImageModalOpen(false)}
            >
                <X size={32} />
            </button>
            <img 
                src={scanResult.vehiculo.foto_url} 
                alt="Zoom" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in select-none"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
      )}

      <div id="reader-hidden" style={{ position: 'absolute', top: 0, left: 0, width: '10px', height: '10px', zIndex: -1, opacity: 0, overflow: 'hidden' }}></div>
    </div>
  );
};

export default Escaner;