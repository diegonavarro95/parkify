const { NotificacionPaseVencido, Pase, Vehiculo, Usuario } = require('../models');

// GET: Ver alertas pendientes
exports.getPendientes = async (req, res) => {
  try {
    const notificaciones = await NotificacionPaseVencido.findAll({
      where: { revisada: false },
      include: [
        {
          model: Pase,
          as: 'pase',
          include: [
            {
              model: Vehiculo,
              as: 'vehiculo',
              include: [{ model: Usuario, as: 'usuario' }]
            }
          ]
        }
      ],
      order: [['fecha_hora_notificacion', 'DESC']]
    });
    res.json(notificaciones);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo notificaciones' });
  }
};

// PUT: Marcar como revisada
exports.marcarRevisada = async (req, res) => {
  try {
    const { id } = req.params;
    const id_admin = req.user.id;

    await NotificacionPaseVencido.update(
      { revisada: true, id_admin_reviso: id_admin },
      { where: { id_notificacion: id } }
    );

    res.json({ mensaje: 'Notificación marcada como revisada.' });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando notificación' });
  }
};