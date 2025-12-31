import { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const scannerRef = useRef(null);
  const divId = "qr-reader-video";

  useEffect(() => {
    // 1. Configuración de la instancia
    const html5QrCode = new Html5Qrcode(divId);
    scannerRef.current = html5QrCode;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      supportedScanTypes: [Html5QrcodeSupportedFormats.QR_CODE]
    };

    // 2. Iniciar cámara trasera
    html5QrCode.start(
      { facingMode: "environment" }, // Usa cámara trasera
      config,
      (decodedText) => {
        // Éxito
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        // Error de lectura (pasa frecuentemente mientras busca, lo ignoramos o lo pasamos)
        if (onScanError) onScanError(errorMessage);
      }
    ).catch(err => {
      console.error("Error al iniciar cámara:", err);
      if (onScanError) onScanError("PERMISO_DENEGADO");
    });

    // 3. Limpieza al desmontar
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current.clear();
        }).catch(err => console.error("Error deteniendo scanner", err));
      }
    };
  }, []);

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      {/* El video se inyectará aquí */}
      <div id={divId} className="w-full h-full object-cover"></div>
      
      {/* Guía visual (Marco rojo) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 border-2 border-red-500 rounded-lg opacity-70"></div>
      </div>
    </div>
  );
};

export default QRScanner;