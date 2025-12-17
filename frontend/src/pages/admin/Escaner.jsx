import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, User, Car, RefreshCw, Shield, ArrowRight } from 'lucide-react';
import QRScanner from '../../components/scanner/QRScanner';
import { validarAcceso, registrarMovimiento } from '../../api/accesos';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const Escaner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleScan = async (decodedText) => {
    try {
      setScanning(false);
      setLoading(true);

      // Intentar parsear JSON o usar texto plano
      let idVehiculo = decodedText;
      try {
        const parsed = JSON.parse(decodedText);
        idVehiculo = parsed.id;
      } catch (e) {
        console.log("QR no es JSON, usando texto plano");
      }

      const data = await validarAcceso(idVehiculo);
      setScanResult(data);
      
      if (navigator.vibrate) navigator.vibrate(200);

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'QR Inválido o Vehículo no encontrado';
      toast.error(msg);
      // Reiniciar cámara automáticamente tras error corto
      setTimeout(() => setScanning(true), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async () => {
    if (!scanResult) return;
    try {
      setLoading(true);
      await registrarMovimiento({
        id_vehiculo: scanResult.vehiculo.id_vehiculo,
        tipo_movimiento: scanResult.accionSugerida,
      });

      toast.success(`${scanResult.accionSugerida.toUpperCase()} REGISTRADA`, { duration: 4000 });
      setScanResult(null);
      setScanning(true); // Volver a activar cámara
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const getImagenVehiculo = (v) => v.foto_url || v.foto_documento_validacion;

  return (
    <div className="max-w-xl mx-auto pb-20 px-4">
      
      <div className="text-center mb-6 pt-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <Shield className="text-brand-600" />
          Control de Accesos
        </h1>
        <p className="text-sm text-slate-500">Puerta 3 • Acceso Vehicular</p>
      </div>

      <div className="space-y-6">
        
        {/* MODO ESCÁNER */}
        {scanning && (
          <div className="animate-fade-in">
            <QRScanner onScanSuccess={handleScan} />
          </div>
        )}

        {/* MODO CARGANDO */}
        {!scanning && !scanResult && loading && (
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center animate-pulse">
                <RefreshCw className="animate-spin text-brand-500 mb-2" size={32} />
                <p className="text-slate-500 font-medium">Consultando Base de Datos...</p>
            </div>
        )}

        {/* MODO RESULTADO */}
        {scanResult && (
          <Card className={`overflow-hidden border-0 shadow-xl animate-slide-up ring-4 ${
            scanResult.accionSugerida === 'entrada' ? 'ring-emerald-500/30' : 'ring-orange-500/30'
          }`}>
            
            {/* Encabezado de Color */}
            <div className={`p-4 text-white text-center font-bold uppercase tracking-widest text-lg flex items-center justify-center gap-2 ${
               scanResult.accionSugerida === 'entrada' ? 'bg-emerald-500' : 'bg-orange-500'
            }`}>
               {scanResult.accionSugerida === 'entrada' ? <CheckCircle /> : <ArrowRight />}
               {scanResult.accionSugerida}
            </div>

            <div className="p-6 space-y-6">
              
              {/* Info Principal */}
              <div className="flex gap-4">
                 <div className="w-24 h-24 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 shadow-inner">
                    {getImagenVehiculo(scanResult.vehiculo) ? (
                        <img src={getImagenVehiculo(scanResult.vehiculo)} className="w-full h-full object-cover" alt="Auto" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400"><Car /></div>
                    )}
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                        {scanResult.vehiculo.placas}
                    </h2>
                    <p className="text-slate-500 font-medium">
                        {scanResult.vehiculo.marca} {scanResult.vehiculo.modelo}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-sm text-brand-600 font-bold bg-brand-50 inline-block px-2 py-0.5 rounded">
                        <User size={12} />
                        {scanResult.vehiculo.conductor}
                    </div>
                 </div>
              </div>

              {/* Botones Grandes */}
              <div className="grid grid-cols-2 gap-3">
                 <Button 
                    variant="ghost" 
                    onClick={() => { setScanResult(null); setScanning(true); }}
                    disabled={loading}
                    className="h-14 border border-slate-200"
                 >
                    Cancelar
                 </Button>
                 
                 <Button 
                    onClick={handleConfirmar}
                    isLoading={loading}
                    className={`h-14 text-lg font-bold shadow-lg ${
                        scanResult.accionSugerida === 'entrada' 
                        ? 'bg-emerald-600 hover:bg-emerald-500' 
                        : 'bg-orange-500 hover:bg-orange-400'
                    }`}
                 >
                    {scanResult.accionSugerida === 'entrada' ? '✅ ACEPTAR' : '👋 SALIDA'}
                 </Button>
              </div>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
};

export default Escaner;