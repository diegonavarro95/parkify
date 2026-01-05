const { Notificacion } = require('../models');

// Obtener mis notificaciones
exports.obtenerMisNotificaciones = async (req, res) => {
  try {
    const notificaciones = await Notificacion.findAll({
      where: { id_usuario: req.user.id },
      order: [['fecha_creacion', 'DESC']],
      limit: 100 // Traer solo las últimas 50
    });
    res.json(notificaciones);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

// Marcar como leída
exports.marcarLeida = async (req, res) => {
  try {
    const { id } = req.params;
    await Notificacion.update(
      { leida: true },
      { where: { id_notificacion: id, id_usuario: req.user.id } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
};

// Marcar TODAS como leídas
exports.marcarTodasLeidas = async (req, res) => {
    try {
      await Notificacion.update(
        { leida: true },
        { where: { id_usuario: req.user.id, leida: false } }
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar todo' });
    }
  };

  // Eliminar TODAS las notificaciones del usuario
exports.eliminarTodas = async (req, res) => {
  try {
    // Borra todas las filas que pertenezcan a este usuario
    await Notificacion.destroy({
      where: { id_usuario: req.user.id }
    });
    res.json({ success: true, mensaje: 'Historial limpio' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar notificaciones' });
  }
};