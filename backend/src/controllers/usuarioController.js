const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { Usuario } = require('../models');

exports.getDashboardData = async (req, res) => {
  try {
    const id_usuario = req.user.id; // Del token

    // 1. Mis Vehículos
    const vehiculos = await sequelize.query(`
      SELECT id_vehiculo, marca, modelo, color, placas, tipo, foto_documento_validacion as foto
      FROM vehiculos 
      WHERE id_usuario = :id
    `, { replacements: { id: id_usuario }, type: QueryTypes.SELECT });

    // 2. Mi Estatus Actual (¿Estoy adentro?)
    // Buscamos si alguno de mis vehículos tiene una entrada SIN salida
    const [estatusActual] = await sequelize.query(`
      SELECT 
        a.id_acceso,
        a.fecha_hora as hora_entrada,
        a.id_cajon_moto,
        cm.identificador as nombre_cajon,
        v.placas,
        v.modelo,
        v.foto_documento_validacion as foto
      FROM accesos a
      JOIN pases p ON a.id_pase = p.id_pase
      JOIN vehiculos v ON p.id_vehiculo = v.id_vehiculo
      LEFT JOIN cajones_motos cm ON a.id_cajon_moto = cm.id_cajon -- 👈 2. AGREGADO: Unión con tabla de cajones
      WHERE v.id_usuario = :id
      AND a.tipo = 'entrada'
      AND NOT EXISTS (
        SELECT 1 FROM accesos out 
        WHERE out.id_pase = p.id_pase 
        AND out.tipo = 'salida' 
        AND out.fecha_hora > a.fecha_hora
      )
      LIMIT 1
    `, { replacements: { id: id_usuario }, type: QueryTypes.SELECT });

    // 3. Mi Historial Reciente (Últimos 5 movimientos)
    const historial = await sequelize.query(`
      SELECT 
        a.tipo,
        a.fecha_hora,
        v.placas,
        v.modelo
      FROM accesos a
      JOIN pases p ON a.id_pase = p.id_pase
      JOIN vehiculos v ON p.id_vehiculo = v.id_vehiculo
      WHERE v.id_usuario = :id
      ORDER BY a.fecha_hora DESC
      LIMIT 5
    `, { replacements: { id: id_usuario }, type: QueryTypes.SELECT });

    // 4. Pases Generados (Si tiene QR activo)
    const [paseActivo] = await sequelize.query(`
       SELECT p.folio, p.fecha_vencimiento, v.placas
       FROM pases p
       JOIN vehiculos v ON p.id_vehiculo = v.id_vehiculo
       WHERE v.id_usuario = :id AND p.estado = 'vigente' AND p.fecha_vencimiento > NOW()
       ORDER BY p.fecha_emision DESC LIMIT 1
    `, { replacements: { id: id_usuario }, type: QueryTypes.SELECT });

    res.json({
      vehiculos,
      estatusActual: estatusActual || null, // null si no está adentro
      historial,
      paseActivo: paseActivo || null
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar dashboard' });
  }
};

exports.cambiarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body; // true o false

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Evitar que un admin se bloquee a sí mismo (opcional pero recomendado)
    if (usuario.id_usuario === req.user.id) {
        return res.status(400).json({ error: 'No puedes bloquear tu propia cuenta.' });
    }

    usuario.activo = activo;
    await usuario.save();

    res.json({ mensaje: `Usuario ${activo ? 'activado' : 'bloqueado'} correctamente` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};