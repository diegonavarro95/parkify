const { Usuario, Vehiculo } = require('../models');

// Listar todos los usuarios
exports.getAllUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['password_hash'] }, // Por seguridad
      order: [['fecha_registro', 'DESC']]
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
};

// Bloquear/Desbloquear Usuario
exports.toggleBloqueoUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { activo } = req.body; // true o false

    // Evitar auto-bloqueo (El admin no puede bloquearse a sí mismo)
    if (id_usuario === req.user.id) {
        return res.status(400).json({ error: "No puedes bloquear tu propia cuenta." });
    }

    await Usuario.update({ activo }, { where: { id_usuario } });

    res.json({ mensaje: `Usuario ${activo ? 'activado' : 'bloqueado'} exitosamente.` });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando estado del usuario' });
  }
};

// Listar todos los vehículos (con sus dueños)
exports.getAllVehiculos = async (req, res) => {
  try {
    const vehiculos = await Vehiculo.findAll({
      include: [{ 
          model: Usuario, 
          as: 'usuario',
          attributes: ['nombre_completo', 'tipo_usuario'] 
      }]
    });
    res.json(vehiculos);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo vehículos' });
  }
};