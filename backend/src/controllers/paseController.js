const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const { Pase, Vehiculo, Usuario } = require('../models');
const { uploadBuffer } = require('../services/storageService');
const { enviarCorreoPase } = require('../services/emailService');

exports.generarPase = async (req, res) => {
  try {
    const { id_vehiculo } = req.body;
    const id_usuario = req.user.id;

    // 1. Verificar que el vehículo pertenezca al usuario
    const vehiculo = await Vehiculo.findOne({ 
      where: { id_vehiculo, id_usuario },
      include: [{ model: Usuario, as: 'usuario' }] // Necesitamos datos del usuario
    });

    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado o no te pertenece.' });
    }

    // 2. Generar Folio Único (PK-AÑO-RANDOM)
    const anio = new Date().getFullYear();
    const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
    const folio = `PK-${anio}-${randomStr}`;

    // 3. Generar Código QR (Buffer)
    const qrData = JSON.stringify({
      folio,
      placas: vehiculo.placas,
      tipo: vehiculo.usuario.tipo_usuario
    });
    const qrBuffer = await QRCode.toBuffer(qrData);
    
    // Subir QR a Supabase
    const qrUrl = await uploadBuffer(qrBuffer, `qrs/${folio}.png`, 'image/png');

    // 4. Pre-guardar en BD para que los Triggers calculen la fecha de vencimiento
    // (Recuerda: la lógica de 6 meses vs 24h está en la BD)
    // Usamos una fecha dummy, el trigger la corregirá
    const fechaDummy = new Date(); 
    fechaDummy.setHours(fechaDummy.getHours() + 1);

    const nuevoPase = await Pase.create({
      folio,
      id_vehiculo,
      codigo_qr_path: qrUrl,
      pdf_path: 'PENDIENTE', // Lo actualizamos después de generar el PDF
      fecha_vencimiento: fechaDummy // El trigger lo sobreescribirá
    });

    // Recargar para obtener la fecha de vencimiento real calculada por la BD
    await nuevoPase.reload();

    // 5. Generar PDF (Buffer)
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    // -- Diseño del PDF --
    doc.fontSize(20).text('Pase de Estacionamiento ESCOM', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Folio: ${folio}`);
    doc.text(`Usuario: ${vehiculo.usuario.nombre_completo}`);
    doc.text(`Tipo: ${vehiculo.usuario.tipo_usuario}`);
    doc.text(`Vehículo: ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.color})`);
    doc.fontSize(16).text(`Placas: ${vehiculo.placas}`, { bold: true });
    doc.moveDown();
    doc.text(`Vence: ${new Date(nuevoPase.fecha_vencimiento).toLocaleString()}`, { color: 'red' });
    
    // Insertar QR
    doc.image(qrBuffer, { fit: [150, 150], align: 'center' });
    
    doc.end();

    // Esperar a que termine de generarse el PDF
    const pdfBuffer = await new Promise((resolve) => {
      doc.on('end', () => {
        const result = Buffer.concat(buffers);
        resolve(result);
      });
    });

    // Subir PDF a Supabase
    const pdfUrl = await uploadBuffer(pdfBuffer, `pases/${folio}.pdf`, 'application/pdf');

    // 6. Actualizar registro con la URL del PDF
    await nuevoPase.update({ pdf_path: pdfUrl });

    // 7. Enviar Correo (Asíncrono, no esperamos)
    enviarCorreoPase(vehiculo.usuario.correo_electronico, {
      nombre: vehiculo.usuario.nombre_completo,
      folio: folio,
      vehiculo: `${vehiculo.marca} ${vehiculo.modelo}`,
      placas: vehiculo.placas,
      vencimiento: nuevoPase.fecha_vencimiento
    }, pdfUrl);

    res.status(201).json({
      mensaje: 'Pase generado exitosamente',
      pase: nuevoPase
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generando pase', detalle: error.message });
  }
};

exports.misPases = async (req, res) => {
    // Implementación simple para ver historial
    try {
        // Lógica compleja para filtrar por usuario a través de vehiculos...
        // Por brevedad, dejémoslo pendiente o simple
        res.json({ mensaje: "Endpoint pendiente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};