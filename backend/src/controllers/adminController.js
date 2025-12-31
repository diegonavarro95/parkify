const { Usuario, Vehiculo, Reporte, Acceso } = require('../models');
const { sequelize } = require('../config/database');
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

exports.obtenerEstadisticas = async (req, res) => {
  try {
    // Ejemplo rápido de estadísticas
    const totalUsuarios = await Usuario.count();
    const totalVehiculos = await Vehiculo.count();
    const reportesPendientes = await Reporte.count({ where: { estado: 'nuevo' } });
    
    res.json({
      usuarios: totalUsuarios,
      vehiculos: totalVehiculos,
      reportes_pendientes: reportesPendientes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Si tienes otras funciones en las rutas, agrégalas aquí vacías para que no crashee
exports.obtenerMapa = async (req, res) => {
    res.json({ mensaje: "Mapa pendiente" });
};

exports.obtenerAlertas = async (req, res) => {
    res.json({ mensaje: "Alertas pendientes" });
};