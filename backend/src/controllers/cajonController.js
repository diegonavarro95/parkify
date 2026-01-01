const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

exports.obtenerMapa = async (req, res) => {
  try {
    const cajones = await sequelize.query(`
      SELECT 
        c.id_cajon,
        c.identificador,
        c.zona,
        c.estado,
        
        -- Datos del ocupante (si existe)
        v.placas,
        v.modelo,
        v.color,
        v.foto_documento_validacion as foto_vehiculo,
        u.nombre_completo as conductor,
        u.tipo_usuario,
        a.fecha_hora as hora_entrada

      FROM cajones_motos c
      LEFT JOIN accesos a ON c.id_acceso_ocupante = a.id_acceso
      LEFT JOIN pases p ON a.id_pase = p.id_pase
      LEFT JOIN vehiculos v ON p.id_vehiculo = v.id_vehiculo
      LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
      ORDER BY c.id_cajon ASC
    `, {
      type: QueryTypes.SELECT
    });

    res.json(cajones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar mapa.' });
  }
};