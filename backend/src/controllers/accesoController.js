const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

// --- 1. VALIDAR ACCESO ---
exports.validarAcceso = async (req, res) => {
  try {
    const { id_vehiculo } = req.body;

    // 1. Obtener datos del Vehículo y Dueño
    const [vehiculo] = await sequelize.query(`
      SELECT 
        v.id_vehiculo, v.placas, v.marca, v.modelo, v.color, v.tipo, v.foto_documento_validacion as foto_url,
        u.nombre_completo as conductor, u.rol, u.activo
      FROM vehiculos v
      JOIN usuarios u ON v.id_usuario = u.id_usuario
      WHERE v.id_vehiculo = :id
    `, {
      replacements: { id: id_vehiculo },
      type: QueryTypes.SELECT
    });

    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado en el sistema.' });
    }
    if (!vehiculo.activo) {
      return res.status(403).json({ error: 'ACCESO DENEGADO: Usuario inactivo.' });
    }

    // 2. Determinar Estado (¿Está adentro o afuera?)
    // Lógica: Está dentro si tiene una entrada SIN salida posterior (fecha_hora DESC)
    const [estadoActual] = await sequelize.query(`
      SELECT a.id_acceso, a.id_cajon_moto, a.tipo
      FROM accesos a
      JOIN pases p ON a.id_pase = p.id_pase
      WHERE p.id_vehiculo = :id
      ORDER BY a.fecha_hora DESC
      LIMIT 1
    `, {
      replacements: { id: id_vehiculo },
      type: QueryTypes.SELECT
    });

    let accionSugerida = 'entrada';
    let cajonAsignado = null;

    // Si existe historial y el último movimiento fue entrada, toca salida
    if (estadoActual && estadoActual.tipo === 'entrada') {
        accionSugerida = 'salida';
        cajonAsignado = estadoActual.id_cajon_moto;
    }

    res.json({
      mensaje: 'Vehículo validado',
      vehiculo,
      accionSugerida,
      cajonAsignado
    });

  } catch (error) {
    console.error("Error validarAcceso:", error);
    res.status(500).json({ error: 'Error interno al validar vehículo.' });
  }
};

// --- 2. REGISTRAR MOVIMIENTO ---
exports.registrarMovimiento = async (req, res) => {
  const t = await sequelize.transaction(); 
  try {
    const { id_vehiculo, tipo_movimiento, id_cajon_moto } = req.body;

    // --- CORRECCIÓN AQUÍ: Extracción Segura del ID del Guardia ---
    // A veces el token decodificado trae 'id' y otras 'id_usuario'
    console.log("Usuario en Request:", req.user); // DEBUG
    const id_guardia = req.user.id_usuario || req.user.id;

    if (!id_guardia) {
        await t.rollback();
        return res.status(401).json({ error: 'No se pudo identificar al guardia. Inicia sesión nuevamente.' });
    }

    // 1. Necesitamos un PASE VIGENTE
    let [pase] = await sequelize.query(`
      SELECT id_pase FROM pases 
      WHERE id_vehiculo = :id AND estado = 'vigente' AND fecha_vencimiento > NOW()
      LIMIT 1
    `, { replacements: { id: id_vehiculo }, type: QueryTypes.SELECT, transaction: t });

    // Si no tiene pase, creamos uno temporal
    if (!pase) {
        const folio = `EXP-${Date.now()}`; 
        const [nuevoPase] = await sequelize.query(`
            INSERT INTO pases (folio, id_vehiculo, fecha_emision, fecha_vencimiento, estado)
            VALUES (:folio, :id, NOW(), NOW() + INTERVAL '24 hours', 'vigente')
            RETURNING id_pase
        `, { replacements: { folio, id: id_vehiculo }, type: QueryTypes.INSERT, transaction: t });
        pase = nuevoPase[0];
    }

    // 2. Insertar el ACCESO
    // Aseguramos que idGuardia tenga un valor válido
    await sequelize.query(`
      INSERT INTO accesos (id_pase, tipo, fecha_hora, metodo_validacion, id_admin_guardia, id_cajon_moto)
      VALUES (:idPase, :tipo, NOW(), 'qr', :idGuardia, :idCajon)
    `, {
      replacements: {
        idPase: pase.id_pase,
        tipo: tipo_movimiento, 
        idGuardia: id_guardia, // Ahora garantizamos que esto no es undefined
        idCajon: (tipo_movimiento === 'entrada' && id_cajon_moto) ? parseInt(id_cajon_moto) : null
      },
      type: QueryTypes.INSERT,
      transaction: t
    });

    // 3. Manejo de estado de cajones (Opcional, si tienes tabla de cajones)
    // if (tipo_movimiento === 'entrada' && id_cajon_moto) { ... }

    await t.commit();
    res.json({ mensaje: `Acceso de ${tipo_movimiento} registrado correctamente.` });

  } catch (error) {
    await t.rollback();
    console.error("Error registrarMovimiento:", error);
    
    // Capturar errores de Base de Datos (ej: Triggers de doble entrada)
    if (error.original && error.original.code === 'P0001') {
        return res.status(400).json({ error: error.original.message });
    }
    
    res.status(500).json({ error: 'Error al registrar el movimiento.' });
  }
};