// ... imports
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

// Asegúrate de que esta URL coincida con tu .env o hardcodéala si estás en local
const BASE_URL = process.env.API_URL || 'http://localhost:5000'; 

exports.validarAcceso = async (req, res) => {
  try {
    const { id_vehiculo } = req.body;

    // 👇 CAMBIO: Traemos la columna tal cual, SIN concatenar nada extraño
    const [vehiculo] = await sequelize.query(`
      SELECT 
        v.id_vehiculo, v.placas, v.marca, v.modelo, v.color, v.tipo, 
        v.foto_documento_validacion as foto_url, -- <--- Confiamos en que Supabase guardó aquí el link
        u.nombre_completo as conductor, u.rol, u.activo
      FROM vehiculos v
      JOIN usuarios u ON v.id_usuario = u.id_usuario
      WHERE v.id_vehiculo = :id
    `, {
      replacements: { id: id_vehiculo },
      type: QueryTypes.SELECT
    });

    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado.' });
    if (!vehiculo.activo) return res.status(403).json({ error: 'Usuario inactivo.' });

    // ... (El resto del código de estadoActual y respuesta SE QUEDA IGUAL) ...
    // ...
    // ...

    const [estadoActual] = await sequelize.query(`
      SELECT a.id_acceso, a.id_cajon_moto, a.tipo
      FROM accesos a
      JOIN pases p ON a.id_pase = p.id_pase
      WHERE p.id_vehiculo = :id
      ORDER BY a.fecha_hora DESC
      LIMIT 1
    `, { replacements: { id: id_vehiculo }, type: QueryTypes.SELECT });

    let accionSugerida = 'entrada';
    let cajonAsignado = null;

    if (estadoActual && estadoActual.tipo === 'entrada') {
        accionSugerida = 'salida';
        cajonAsignado = estadoActual.id_cajon_moto;
    }

    res.json({ mensaje: 'Validado', vehiculo, accionSugerida, cajonAsignado });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno.' });
  }
};

exports.registrarMovimiento = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id_vehiculo, tipo_movimiento, id_cajon_moto } = req.body;
    const id_guardia = req.user.id_usuario || req.user.id;
    
    // 👇 CAMBIO 2: Obtener instancia de Socket.io
    const io = req.app.get('io'); 

    // ... (Lógica de Pases y Insert se queda IGUAL) ...
    let [pase] = await sequelize.query(`
      SELECT id_pase FROM pases WHERE id_vehiculo = :id AND estado = 'vigente' AND fecha_vencimiento > NOW() LIMIT 1
    `, { replacements: { id: id_vehiculo }, type: QueryTypes.SELECT, transaction: t });

    if (!pase) {
        const folio = `EXP-${Date.now()}`; 
        const [nuevoPase] = await sequelize.query(`
            INSERT INTO pases (folio, id_vehiculo, fecha_emision, fecha_vencimiento, estado)
            VALUES (:folio, :id, NOW(), NOW() + INTERVAL '24 hours', 'vigente')
            RETURNING id_pase
        `, { replacements: { folio, id: id_vehiculo }, type: QueryTypes.INSERT, transaction: t });
        pase = nuevoPase[0];
    }

    await sequelize.query(`
      INSERT INTO accesos (id_pase, tipo, fecha_hora, metodo_validacion, id_admin_guardia, id_cajon_moto)
      VALUES (:idPase, :tipo, NOW(), 'qr', :idGuardia, :idCajon)
    `, {
      replacements: {
        idPase: pase.id_pase,
        tipo: tipo_movimiento, 
        idGuardia: id_guardia,
        idCajon: (tipo_movimiento === 'entrada' && id_cajon_moto) ? parseInt(id_cajon_moto) : null
      },
      type: QueryTypes.INSERT,
      transaction: t
    });

    await t.commit();

    // 👇 CAMBIO 3: Emitir notificación a todos los guardias
    if (io) {
        // Obtenemos datos extra para la notificación bonita
        const [datosVehiculo] = await sequelize.query(
            `SELECT placas, modelo, color FROM vehiculos WHERE id_vehiculo = :id`,
            { replacements: { id: id_vehiculo }, type: QueryTypes.SELECT }
        );

        io.emit('nuevo_movimiento', {
            tipo: tipo_movimiento, // 'entrada' o 'salida'
            placas: datosVehiculo.placas,
            descripcion: `${datosVehiculo.modelo} ${datosVehiculo.color}`,
            hora: new Date().toLocaleTimeString(),
            cajon: id_cajon_moto ? `M${id_cajon_moto}` : null
        });
    }

    res.json({ mensaje: 'Registrado' });

  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'Error al registrar.' });
  }
};