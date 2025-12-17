const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER, // Tu correo
    pass: process.env.SMTP_PASS  // Tu contraseña de aplicación
  }
});

const enviarCorreoPase = async (emailUsuario, datos, pdfUrl) => {
  try {
    const info = await transporter.sendMail({
      from: '"Parkify ESCOM" <no-reply@parkify.com>',
      to: emailUsuario,
      subject: `Tu Pase de Estacionamiento - ${datos.folio}`,
      html: `
        <h1>Hola ${datos.nombre}</h1>
        <p>Tu pase de estacionamiento ha sido generado exitosamente.</p>
        <p><strong>Vehículo:</strong> ${datos.vehiculo}</p>
        <p><strong>Placas:</strong> ${datos.placas}</p>
        <p><strong>Vence:</strong> ${new Date(datos.vencimiento).toLocaleString()}</p>
        <br>
        <p>Puedes descargar tu pase aquí: <a href="${pdfUrl}">Descargar PDF</a></p>
        <p>O utiliza el archivo adjunto.</p>
      `,
      attachments: [
        {
          filename: `Pase-${datos.folio}.pdf`,
          path: pdfUrl // Nodemailer puede descargar y adjuntar desde URL automáticamente
        }
      ]
    });
    console.log('📧 Correo enviado: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    return false; // No bloqueamos el proceso si falla el correo
  }
};

module.exports = { enviarCorreoPase };