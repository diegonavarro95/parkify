const { Usuario } = require('../models');

exports.esAdmin = async (req, res, next) => {
  try {
    // req.user viene del authMiddleware anterior
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    // Consultamos el rol actualizado en la BD (más seguro que confiar en el token)
    const usuario = await Usuario.findByPk(req.user.id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (usuario.rol !== 'admin_guardia') {
      return res.status(403).json({ 
        error: 'Acceso Denegado', 
        mensaje: 'Se requieren permisos de Administrador/Guardia para realizar esta acción.' 
      });
    }

    // Si es admin, dejamos pasar
    next();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error verificando permisos.' });
  }
};