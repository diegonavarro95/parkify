const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
// 👇 CAMBIO IMPORTANTE: Importamos el nombre correcto del modelo
const { Pase, Vehiculo, Usuario, Acceso, CajonMoto,Notificacion } = require('../models'); 

const BASE_URL = process.env.API_URL || 'http://localhost:5000'; 

exports.validarAcceso = async (req, res) => { 
  try {
    const { id_vehiculo } = req.body;

    const [vehiculo] = await sequelize.query(`
      SELECT 
        v.id_vehiculo, v.placas, v.marca, v.modelo, v.color, v.tipo, 
        v.foto_documento_validacion as foto_url, 
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
    const io = req.app.get('io'); 

    // ... (Lógica de Pases y Insert de Acceso se queda IGUAL) ...
    // ... (Copia tu lógica existente de Pases y Accesos aquí) ...
    // ... (Para no repetir todo el código anterior, asumo que esto no cambia) ...
    
    // 1. Obtener Pase (IGUAL QUE ANTES)
    let [pase] = await sequelize.query(`
      SELECT id_pase FROM pases WHERE id_vehiculo = :id AND estado = 'vigente' AND fecha_vencimiento > NOW() LIMIT 1
    `, { replacements: { id: id_vehiculo }, type: QueryTypes.SELECT, transaction: t });

    if (!pase) {
        // ... Logica crear pase ...
        const folio = `EXP-${Date.now()}`; 
        const [nuevoPase] = await sequelize.query(`
            INSERT INTO pases (folio, id_vehiculo, fecha_emision, fecha_vencimiento, estado)
            VALUES (:folio, :id, NOW(), NOW() + INTERVAL '24 hours', 'vigente')
            RETURNING id_pase
        `, { replacements: { folio, id: id_vehiculo }, type: QueryTypes.INSERT, transaction: t });
        pase = nuevoPase[0];
    }

    // 2. Insertar Acceso (IGUAL QUE ANTES)
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

    // 3. Actualizar Cajon (IGUAL QUE ANTES)
    let nombreCajon = null;
    if (id_cajon_moto && tipo_movimiento === 'entrada') {
        await CajonMoto.update({ estado: 'ocupado' }, { where: { id_cajon: id_cajon_moto }, transaction: t });
        const infoCajon = await CajonMoto.findByPk(id_cajon_moto, { transaction: t });
        if (infoCajon) nombreCajon = infoCajon.identificador;
    } else if (tipo_movimiento === 'salida') {
        const [accesoAnterior] = await sequelize.query(`
            SELECT id_cajon_moto FROM accesos WHERE id_pase = :idPase AND tipo = 'entrada' ORDER BY fecha_hora DESC LIMIT 1
        `, { replacements: { idPase: pase.id_pase }, type: QueryTypes.SELECT, transaction: t });
        if (accesoAnterior && accesoAnterior.id_cajon_moto) {
             await CajonMoto.update({ estado: 'disponible' }, { where: { id_cajon: accesoAnterior.id_cajon_moto }, transaction: t });
        }
    }

    // --- 👇 AQUÍ VIENE LA MAGIA DE GUARDAR NOTIFICACIÓN EN BD 👇 ---
    
    // A. Obtenemos datos del vehículo para el mensaje
    const [datosVehiculo] = await sequelize.query(
        `SELECT placas, modelo, color FROM vehiculos WHERE id_vehiculo = :id`,
        { replacements: { id: id_vehiculo }, type: QueryTypes.SELECT, transaction: t }
    );

    // B. Construimos el mensaje
    let tituloNotif = `Registro de ${tipo_movimiento === 'entrada' ? 'Entrada' : 'Salida'}`;
    let mensajeNotif = `Vehículo ${datosVehiculo.placas} (${datosVehiculo.modelo})`;
    if (nombreCajon && tipo_movimiento === 'entrada') {
        mensajeNotif += ` asignado a cajón ${nombreCajon}`;
    }

    // C. Buscamos a TODOS los administradores/guardias para notificarles
    // (Asumiendo que quieres que todos los admins vean el historial)
    const administradores = await Usuario.findAll({
        where: { rol: 'admin_guardia', activo: true },
        attributes: ['id_usuario'],
        transaction: t
    });

    // D. Creamos el array de notificaciones para insertar en bloque
    const notificacionesAGuardar = administradores.map(admin => ({
        id_usuario: admin.id_usuario,
        titulo: tituloNotif,
        mensaje: mensajeNotif,
        tipo: 'seguridad', // O 'sistema'
        referencia_id: id_vehiculo,
        leida: false,
        fecha_creacion: new Date()
    }));

    // E. Insertamos en la tabla Notificaciones
    if (notificacionesAGuardar.length > 0) {
        await Notificacion.bulkCreate(notificacionesAGuardar, { transaction: t });
    }

    await t.commit(); // CONFIRMAMOS LA TRANSACCIÓN

    // 4. Emitir Socket (IGUAL QUE ANTES)
    if (io) {
        io.emit('nuevo_movimiento', {
            id: Date.now(), 
            mensaje: `${tipo_movimiento.toUpperCase()}: ${datosVehiculo.placas} ${nombreCajon ? '• ' + nombreCajon : ''}`,
            tipo: tipo_movimiento,
            placas: datosVehiculo.placas,
            descripcion: `${datosVehiculo.modelo} ${datosVehiculo.color}`,
            hora: new Date().toLocaleTimeString(),
            cajon: nombreCajon 
        });
        
        // Opcional: Emitir evento para refrescar la campanita de notificaciones sin recargar
        io.emit('actualizar_notificaciones'); 
    }

    res.json({ mensaje: 'Registrado y notificado' });

  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'Error al registrar.' });
  }
};

exports.obtenerHistorial = async (req, res) => {
  try {
    const accesos = await sequelize.query(`
      SELECT 
        a.id_acceso,
        a.fecha_hora as fecha_hora_entrada, 
        a.id_cajon_moto,
        cm.identificador as nombre_cajon,
        (
            SELECT fecha_hora 
            FROM accesos salida 
            WHERE salida.id_pase = a.id_pase 
            AND salida.tipo = 'salida' 
            AND salida.fecha_hora > a.fecha_hora 
            ORDER BY salida.fecha_hora ASC 
            LIMIT 1
        ) as fecha_hora_salida,
        v.placas, v.marca, v.modelo, v.color, v.tipo as tipo_vehiculo,
        v.foto_documento_validacion as foto_vehiculo,
        u.nombre_completo as conductor, u.tipo_usuario, u.rol, u.correo_electronico,
        p.fecha_vencimiento, p.estado as estado_pase,
        g.nombre_completo as guardia_entrada
      FROM accesos a
      JOIN pases p ON a.id_pase = p.id_pase
      JOIN vehiculos v ON p.id_vehiculo = v.id_vehiculo
      JOIN usuarios u ON v.id_usuario = u.id_usuario
      LEFT JOIN usuarios g ON a.id_admin_guardia = g.id_usuario
      LEFT JOIN cajones_motos cm ON a.id_cajon_moto = cm.id_cajon
      WHERE a.tipo = 'entrada'
      ORDER BY a.fecha_hora DESC
      LIMIT 200; 
    `, {
      type: QueryTypes.SELECT
    });

    res.json(accesos);

  } catch (error) {
    console.error("Error obteniendo historial:", error);
    res.status(500).json({ error: 'Error al obtener historial de accesos.' });
  }
};