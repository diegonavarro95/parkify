import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Car, MapPin, Bike, Printer, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { obtenerMisVehiculos } from '../../api/vehiculos';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const MisPases = () => {
  const { user } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerMisVehiculos();
        setVehiculos(data);
        if (data.length > 0) setVehiculoSeleccionado(data[0]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const getImagenVehiculo = (v) => v.foto_url || v.foto_documento_validacion;

  // --- FUNCIÓN PARA CARGAR IMAGEN (LOGO) ---
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };

  // --- GENERAR PDF ---
  const handlePrint = async () => {
    if (!vehiculoSeleccionado || !user) return;

    // 1. OBTENER FECHAS REALES DE LA BD
    const fechaEmisionBD = vehiculoSeleccionado.fecha_emision ? new Date(vehiculoSeleccionado.fecha_emision) : new Date();
    const fechaVencimientoBD = vehiculoSeleccionado.fecha_vencimiento ? new Date(vehiculoSeleccionado.fecha_vencimiento) : new Date();
    
    if (!vehiculoSeleccionado.fecha_vencimiento) {
        fechaVencimientoBD.setHours(23, 59, 59);
    }

    // Calcular tiempo restante REAL
    const ahora = new Date();
    const diffMs = fechaVencimientoBD - ahora;
    
    // --- NUEVA LÓGICA DE TIEMPO DETALLADO ---
    let tiempoTexto = "0 min";
    
    if (diffMs > 0) {
        const segs = Math.floor((diffMs / 1000) % 60);
        const mins = Math.floor((diffMs / (1000 * 60)) % 60);
        const horas = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const dias = Math.floor((diffMs / (1000 * 60 * 60 * 24)) % 30);
        const meses = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30)); // Aprox 30 días

        if (meses > 0) {
            tiempoTexto = `${meses} Meses, ${dias} Días, ${horas} Hrs`;
        } else if (dias > 0) {
            tiempoTexto = `${dias} Días, ${horas} Hrs, ${mins} Min`;
        } else {
            tiempoTexto = `${horas} Hrs, ${mins} Min, ${segs} Seg`;
        }
    }
    // ----------------------------------------

    // 2. INICIAR PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- ENCABEZADO (AZUL PARKIFY) ---
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    try {
        const logo = await loadImage('/parkify.png');
        doc.addImage(logo, 'PNG', 15, 8, 25, 25);
    } catch (e) {
        console.warn("Logo no cargado");
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('PARKIFY ESCOM', 45, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('CONTROL DE ACCESO VEHICULAR', 45, 28);

    const folioDisplay = vehiculoSeleccionado.pase_folio || `TEMP-${Date.now().toString().slice(-6)}`;
    doc.text(`FOLIO: ${folioDisplay}`, pageWidth - 60, 20);

    // --- FUNCIÓN PARA TÍTULOS DE SECCIÓN ---
    let yPos = 55;
    const drawSection = (title) => {
        doc.setFillColor(241, 245, 249);
        doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), 20, yPos);
        doc.setDrawColor(200, 200, 200);
        doc.line(15, yPos + 3, pageWidth - 15, yPos + 3);
        yPos += 10;
    };

    // --- DATOS CONDUCTOR ---
    drawSection('Información del Conductor');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    doc.setFont('helvetica', 'bold'); doc.text('Nombre:', 20, yPos);
    doc.setFont('helvetica', 'normal'); doc.text(user.nombre_completo, 60, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'bold'); doc.text('Correo:', 20, yPos);
    doc.setFont('helvetica', 'normal'); doc.text(user.correo_electronico, 60, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'bold'); doc.text('Perfil:', 20, yPos);
    doc.setFont('helvetica', 'normal'); doc.text(user.tipo_usuario?.toUpperCase().replace('_', ' '), 60, yPos);
    yPos += 15;

    // --- DATOS VEHÍCULO ---
    drawSection('Datos del Vehículo');
    
    doc.setFontSize(24);
    doc.setFont('courier', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text(vehiculoSeleccionado.placas, 20, yPos + 5);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo}`, 80, yPos);
    doc.text(`Color: ${vehiculoSeleccionado.color}`, 80, yPos + 5);
    doc.text(`Tipo: ${vehiculoSeleccionado.tipo.toUpperCase()}`, 80, yPos + 10);
    yPos += 20;

    // --- VIGENCIA ---
    drawSection('Vigencia del Pase');
    
    const fmtFecha = (date) => date.toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });

    doc.setFontSize(10);
    doc.setTextColor(0,0,0);
    
    doc.setFont('helvetica', 'bold'); doc.text('Emitido:', 20, yPos);
    doc.setFont('helvetica', 'normal'); doc.text(fmtFecha(fechaEmisionBD), 60, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'bold'); doc.text('Vence:', 20, yPos);
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold'); 
    doc.text(fmtFecha(fechaVencimientoBD), 60, yPos);
    yPos += 12;

    // Caja de Tiempo Restante (USANDO LA NUEVA VARIABLE tiempoTexto)
    if (diffMs > 0) {
        doc.setFillColor(236, 253, 245);
        doc.setDrawColor(167, 243, 208);
        doc.rect(20, yPos - 5, pageWidth - 40, 12, 'FD');
        doc.setTextColor(5, 150, 105);
        doc.setFontSize(12);
        // Aquí mostramos el texto formateado
        doc.text(`TIEMPO RESTANTE: ${tiempoTexto}`, pageWidth/2, yPos + 2, { align: 'center' });
    } else {
        doc.setFillColor(254, 242, 242);
        doc.rect(20, yPos - 5, pageWidth - 40, 12, 'F');
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(12);
        doc.text(`PASE VENCIDO`, pageWidth/2, yPos + 2, { align: 'center' });
    }
    yPos += 25;

    // --- CÓDIGO QR ---
    const svg = document.getElementById("qr-code-svg");
    if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            
            const qrSize = 60;
            const qrX = (pageWidth - qrSize) / 2;
            doc.addImage(pngFile, 'PNG', qrX, yPos, qrSize, qrSize);
            
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            doc.text('Escanee este código en la pluma de acceso.', pageWidth / 2, yPos + qrSize + 6, { align: 'center' });

            const footerY = pageHeight - 25;
            
            doc.setFillColor(219, 234, 254);
            doc.rect(0, footerY, pageWidth, 25, 'F');
            
            doc.setFillColor(191, 219, 254); 
            doc.rect(0, footerY + 12, pageWidth, 13, 'F');
            
            doc.setFillColor(30, 58, 138);
            doc.rect(0, pageHeight - 2, pageWidth, 2, 'F');

            doc.setFontSize(8);
            doc.setTextColor(30, 58, 138);
            doc.text('Parkify ESCOM - Instituto Politécnico Nacional', pageWidth / 2, footerY + 8, { align: 'center' });
            doc.text(`Documento generado el: ${ahora.toLocaleString()}`, pageWidth / 2, footerY + 18, { align: 'center' });

            doc.save(`Pase_${vehiculoSeleccionado.placas}.pdf`);
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Cargando pases...</div>;

  if (vehiculos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-dark-card rounded-xl border border-dashed border-slate-300">
        <div className="p-4 bg-slate-50 rounded-full mb-4"><Car size={40} className="text-slate-400" /></div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sin vehículos registrados</h2>
        <Link to="/mis-vehiculos"><Button className="mt-4">Registrar Vehículo</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pase de Acceso Digital</h1>
           <p className="text-slate-500 dark:text-slate-400">Selecciona un vehículo para generar o ver tu pase.</p>
        </div>
        {vehiculoSeleccionado && (
            // CORRECCIÓN AQUÍ: Quité 'hidden md:flex' y dejé 'flex' para que se vea en celular
            <Button onClick={handlePrint} variant="outline" className="flex gap-2 border-brand-200 text-brand-700 hover:bg-brand-50">
                <Printer size={18}/> Descargar PDF
            </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LISTA DE VEHÍCULOS */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">Mis Vehículos:</h3>
          <div className="space-y-3">
            {vehiculos.map((v) => (
              <div 
                key={v.id_vehiculo}
                onClick={() => setVehiculoSeleccionado(v)}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${vehiculoSeleccionado?.id_vehiculo === v.id_vehiculo ? 'border-brand-500 bg-brand-50 shadow-md' : 'border-slate-200 bg-white hover:border-brand-200'}`}
              >
                <div className="h-16 w-24 bg-slate-200 rounded-md overflow-hidden flex-shrink-0">
                    {getImagenVehiculo(v) ? <img src={getImagenVehiculo(v)} className="h-full w-full object-cover"/> : <Car className="m-auto text-slate-400"/>}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{v.marca} {v.modelo}</p>
                  <p className="text-sm text-slate-500">{v.placas}</p>
                  {v.fecha_vencimiento && new Date(v.fecha_vencimiento) > new Date() && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">PASE ACTIVO</span>
                  )}
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${vehiculoSeleccionado?.id_vehiculo === v.id_vehiculo ? 'border-brand-500' : 'border-slate-300'}`}>
                  {vehiculoSeleccionado?.id_vehiculo === v.id_vehiculo && <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TARJETA DEL PASE */}
        {vehiculoSeleccionado && (
          <Card className="border-0 shadow-2xl overflow-hidden relative bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900 text-white min-h-[500px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-white"><Car size={150} /></div>
            
            <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-6">
              <div className="w-full border-b border-white/10 pb-4">
                <p className="text-brand-200 text-sm font-medium tracking-widest uppercase">Pase Oficial ESCOM</p>
                <h2 className="text-3xl font-black mt-1 tracking-tight">{vehiculoSeleccionado.placas}</h2>
                <p className="text-brand-100 text-sm mt-1 capitalize opacity-90">{vehiculoSeleccionado.color} • {vehiculoSeleccionado.marca}</p>
                {vehiculoSeleccionado.pase_folio && <p className="text-xs font-mono mt-2 text-white/50">Folio: {vehiculoSeleccionado.pase_folio}</p>}
              </div>

              <div className="bg-white p-4 rounded-xl shadow-lg">
                <QRCode 
                  id="qr-code-svg"
                  value={JSON.stringify({
                    id: vehiculoSeleccionado.id_vehiculo,
                    placas: vehiculoSeleccionado.placas,
                    tipo: vehiculoSeleccionado.tipo
                  })}
                  size={180}
                  level="H" 
                />
              </div>

              {vehiculoSeleccionado.fecha_vencimiento ? (
                  <div className="text-sm">
                      <p className="text-brand-200">Vence:</p>
                      <p className="font-bold text-white text-lg">
                          {new Date(vehiculoSeleccionado.fecha_vencimiento).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                  </div>
              ) : (
                  <div className="flex items-center gap-2 text-yellow-300 text-sm bg-yellow-500/20 px-3 py-1 rounded-lg">
                      <Clock size={14}/> <span>Pase no dado de alta</span>
                  </div>
              )}
            </div>

            <div className="bg-black/20 backdrop-blur-md p-4 flex justify-between items-center text-sm border-t border-white/5">
               <span className="flex items-center gap-2 font-medium text-brand-50">
                 <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)] ${vehiculoSeleccionado.fecha_vencimiento && new Date(vehiculoSeleccionado.fecha_vencimiento) > new Date() ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                 {vehiculoSeleccionado.fecha_vencimiento && new Date(vehiculoSeleccionado.fecha_vencimiento) > new Date() ? 'Vigente' : 'Sin Pase / Vencido'}
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