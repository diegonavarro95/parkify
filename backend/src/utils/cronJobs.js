const cron = require('node-cron');
const { sequelize, NotificacionPaseVencido } = require('../models'); 
// Nota: Importa desde models/index para tener acceso a todo
const { QueryTypes } = require('sequelize');

const iniciarCronJobs = () => {
  console.log('⏰ Tareas programadas iniciadas.');

  // Ejecutar cada 30 minutos
  cron.schedule('*/30 * * * *', async () => {
    try {
      console.log('🔍 Ejecutando análisis de vencimientos...');

      // 1. Actualizar estados de pases (Vigente -> Vencido)
      await sequelize.query(`
        UPDATE pases 
        SET estado = 'vencido' 
        WHERE estado = 'vigente' 
        AND fecha_vencimiento < NOW()
      `);

      // 2. Detectar vehículos vencidos que siguen DENTRO
      // Usamos la vista SQL que creamos para facilitar esto
      const infracciones = await sequelize.query(
        "SELECT * FROM vw_vehiculos_dentro WHERE fecha_vencimiento < NOW()", 
        { type: QueryTypes.SELECT }
      );

      if (infracciones.length > 0) {
        console.log(`⚠️ Se detectaron ${infracciones.length} vehículos vencidos dentro.`);

        // Insertar notificaciones solo si no existe una pendiente para ese pase
        for (const inf of infracciones) {
            // Buscamos el id_pase basado en el folio que nos da la vista
            // Ojo: La vista vw_vehiculos_dentro en el script final tenía 'folio' y 'placas'.
            // Necesitamos el ID del pase. Si la vista no lo trae, hacemos un subquery rápido.
            
            const [pase] = await sequelize.query(
                `SELECT id_pase FROM pases WHERE folio = '${inf.folio}'`,
                { type: QueryTypes.SELECT }
            );

            if (pase) {
                // Verificar si ya tiene notificacion pendiente
                const existe = await NotificacionPaseVencido.findOne({
                    where: { id_pase: pase.id_pase, revisada: false }
                });

                if (!existe) {
                    await NotificacionPaseVencido.create({ id_pase: pase.id_pase });
                    console.log(`🔔 Notificación creada para pase: ${inf.folio}`);
                }
            }
        }
      }

    } catch (error) {
      console.error('❌ Error en Cron Job:', error.message);
    }
  });
};

module.exports = iniciarCronJobs;