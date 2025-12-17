import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ScanLine, CameraOff } from 'lucide-react';

const QRScanner = ({ onScanSuccess, onScanFailure }) => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const scannerRef = useRef(null);
  const containerId = "reader-container";

  // 1. Detectar si el usuario cambia de pestaña o minimiza
  useEffect(() => {
    const handleVisibility = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // 2. Controlar la cámara
  useEffect(() => {
    // Si la pestaña no es visible, NO iniciamos nada (o limpiamos si ya estaba)
    if (!isVisible) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.warn);
        scannerRef.current = null;
      }
      return;
    }

    // Pequeño delay para asegurar que el DOM está listo
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        containerId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
          rememberLastUsedCamera: true
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          // Éxito: Limpiamos y notificamos
          scanner.clear();
          scannerRef.current = null;
          onScanSuccess(decodedText);
        },
        (error) => {
          // Ignoramos errores de "no QR found" para no saturar consola
          // if (onScanFailure) onScanFailure(error);
        }
      );

      scannerRef.current = scanner;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.warn);
      }
    };
  }, [isVisible, onScanSuccess]);

  return (
    <div className="relative w-full max-w-sm mx-auto aspect-square bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800">
      
      {isVisible ? (
        <>
          {/* Contenedor donde la librería inyecta el video */}
          <div id={containerId} className="w-full h-full text-white" />

          {/* --- OVERLAY VISUAL (Marco y Texto) --- */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            
            {/* Marco de enfoque */}
            <div className="w-64 h-64 border-2 border-brand-500/50 rounded-xl relative shadow-[0_0_100px_rgba(0,0,0,0.5)_inset]">
              {/* Esquinas brillantes */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-brand-400 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-brand-400 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-brand-400 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-brand-400 rounded-br-lg"></div>
              
              {/* Línea de escaneo animada */}
              <div className="absolute w-full h-0.5 bg-brand-400 shadow-[0_0_10px_#60a5fa] animate-scan top-0 opacity-80"></div>
            </div>

            {/* Texto Flotante (Blanco con fondo oscuro para contraste) */}
            <div className="absolute bottom-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <p className="text-white text-xs font-medium flex items-center gap-2">
                <ScanLine size={14} className="text-brand-400" />
                Apunta al Código QR
              </p>
            </div>
          </div>
        </>
      ) : (
        // Estado INACTIVO (Ahorro de energía)
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
          <CameraOff size={48} className="mb-2 opacity-50" />
          <p className="text-sm font-medium">Cámara en espera</p>
          <p className="text-xs opacity-60">Regresa a esta pestaña para activar</p>
        </div>
      )}

      {/* Estilos para ocultar la interfaz fea de la librería */}
      <style>{`
        #reader-container video { object-fit: cover; width: 100%; height: 100%; }
        #reader-container__scan_region { display: none !important; }
        #reader-container__dashboard_section_csr button { display: none !important; }
        #reader-container__dashboard_section_swaplink { display: none !important; }
      `}</style>
    </div>
  );
};

export default QRScanner;