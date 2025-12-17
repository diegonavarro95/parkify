const { Reporte, Usuario } = require('../models');
const { uploadFile } = require('../services/storageService');
const { enviarCorreoPase } = require('../services/emailService'); // Reutilizaremos lógica de correo
// Nota: Deberíamos crear una función genérica enviarCorreoNotificacion, pero usaremos un mock aquí.

// Mock rápido para enviar correo de cambio de estado (Ponlo en emailService.js idealmente)
const enviarCorreoEstado = async (email, nombre, reporte) => {
    // Aquí iría la lógica de nodemailer similar a enviarCorreoPase
    console.log(`📧 Enviando correo a ${email}: Tu reporte "${reporte.asunto}" cambió a estado: ${reporte.estado}`);
};

exports.crearReporte = async (req, res) => {
  try {
    const { asunto, descripcion } = req.body;
    const id_usuario = req.user.id;
    const files = req.files; // Array de archivos (Multer)

    // 1. Subir evidencias (si hay)
    let fotosUrls = [];
    if (files && files.length > 0) {
      // Usamos Promise.all para subir en paralelo
      fotosUrls = await Promise.all(
        files.map(file => uploadFile(file, 'evidencias'))
      );
    }

    // 2. Guardar en BD
    const nuevoReporte = await Reporte.create({
      id_usuario,
      asunto,
      descripcion,
      fotos_evidencia: fotosUrls
    });

    res.status(201).json({ mensaje: 'Reporte enviado', reporte: nuevoReporte });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear reporte' });
  }
};

exports.misReportes = async (req, res) => {
  try {
    const reportes = await Reporte.findAll({
      where: { id_usuario: req.user.id, eliminado: false },
      order: [['fecha_envio', 'DESC']]
    });
    res.json(reportes);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo reportes' });
  }
};

exports.listarTodos = async (req, res) => {
  try {
    // Solo para admins (filtrar eliminados o no, según política)
    const reportes = await Reporte.findAll({
      where: { eliminado: false },
      include: [{ model: Usuario, as: 'usuario', attributes: ['nombre_completo', 'curp'] }],
      order: [['fecha_envio', 'DESC']]
    });
    res.json(reportes);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo lista de reportes' });
  }
};

exports.actualizarEstado = async (req, res) => {
  try {
    const { id_reporte } = req.params;
    const { estado, comentario } = req.body; // nuevo estado y comentario opcional
    const id_admin = req.user.id;

    const reporte = await Reporte.findByPk(id_reporte, {
        include: [{ model: Usuario, as: 'usuario' }]
    });

    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });

    // Actualizar
    await reporte.update({
      estado,
      comentario_admin: comentario,
      id_admin_atendio: id_admin
    });

    // Notificar al usuario por correo
    if (reporte.usuario && reporte.usuario.correo_electronico) {
        await enviarCorreoEstado(reporte.usuario.correo_electronico, reporte.usuario.nombre_completo, reporte);
    }

    res.json({ mensaje: 'Estado actualizado', reporte });

  } catch (error) {
    res.status(500).json({ error: 'Error actualizando reporte' });
  }
};