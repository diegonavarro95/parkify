const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
  try {
    // Consultar la vista SQL directamente
    const stats = await sequelize.query("SELECT * FROM vw_estadisticas_hoy", {
      type: QueryTypes.SELECT
    });

    // sequelize devuelve un array, tomamos el primero
    res.json(stats[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
};