const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

// 1. RESUMEN GLOBAL (Tarjetas Superiores)
exports.getResumen = async (req, res) => {
  try {
    // A. Usuarios por tipo
    const usuarios = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN rol = 'admin_guardia' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN tipo_usuario = 'comunidad_escom' AND rol = 'usuario' THEN 1 ELSE 0 END) as comunidad,
        SUM(CASE WHEN tipo_usuario = 'visitante' AND rol = 'usuario' THEN 1 ELSE 0 END) as visitantes
      FROM usuarios WHERE activo = true
    `, { type: QueryTypes.SELECT });

    // B. Vehículos (Autos vs Motos)
    const vehiculos = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN tipo = 'automovil' THEN 1 ELSE 0 END) as autos,
        SUM(CASE WHEN tipo = 'motocicleta' THEN 1 ELSE 0 END) as motos
      FROM vehiculos
    `, { type: QueryTypes.SELECT });

    // C. Pases (Vigentes vs Vencidos)
    const pases = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'vigente' AND fecha_vencimiento > NOW() THEN 1 ELSE 0 END) as activos,
        SUM(CASE WHEN estado = 'vencido' OR fecha_vencimiento < NOW() THEN 1 ELSE 0 END) as vencidos
      FROM pases
    `, { type: QueryTypes.SELECT });

    // D. Reportes (Pendientes vs Resueltos)
    const reportes = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado IN ('nuevo', 'en_revision') THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado IN ('atendido', 'cerrado') THEN 1 ELSE 0 END) as resueltos
      FROM reportes
    `, { type: QueryTypes.SELECT });

    res.json({
      usuarios: usuarios[0],
      vehiculos: vehiculos[0],
      pases: pases[0],
      reportes: reportes[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

// 2. DATOS PARA GRÁFICAS (Accesos por día)
exports.getGraficaAccesos = async (req, res) => {
  try {
    const { rango } = req.query; // '7dias', '30dias'
    let limit = 7;
    if (rango === '30dias') limit = 30;

    // Esta consulta agrupa por día (Postgres)
    const data = await sequelize.query(`
      SELECT 
        TO_CHAR(fecha_hora, 'YYYY-MM-DD') as fecha,
        COUNT(*) as total,
        SUM(CASE WHEN tipo = 'entrada' THEN 1 ELSE 0 END) as entradas,
        SUM(CASE WHEN tipo = 'salida' THEN 1 ELSE 0 END) as salidas
      FROM accesos
      WHERE fecha_hora >= NOW() - INTERVAL '${limit} days'
      GROUP BY TO_CHAR(fecha_hora, 'YYYY-MM-DD')
      ORDER BY fecha ASC
    `, { type: QueryTypes.SELECT });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error en gráfica' });
  }
};

// 3. DETALLE DE USUARIOS (Para el Modal)
exports.getDetalleUsuarios = async (req, res) => {
  try {
    // Trae usuarios + conteo de sus vehículos
    const usuarios = await sequelize.query(`
      SELECT 
        u.id_usuario,
        u.nombre_completo,
        u.tipo_usuario,
        u.rol,
        u.correo_electronico,
        u.activo,
        u.curp,
        u.telefono,
        u.documento_validacion_url, 

        COUNT(v.id_vehiculo) as num_vehiculos
      FROM usuarios u
      LEFT JOIN vehiculos v ON u.id_usuario = v.id_usuario
      GROUP BY u.id_usuario
      ORDER BY num_vehiculos DESC, u.nombre_completo ASC
    `, { type: QueryTypes.SELECT });
    
    res.json(usuarios);
  } catch (error) {
    console.error(error); // Es bueno imprimir el error para depurar
    res.status(500).json({ error: 'Error usuarios detalle' });
  }
};

// 4. DETALLE DE PASES (Para el Modal)
exports.getDetallePases = async (req, res) => {
  try {
    const pases = await sequelize.query(`
      SELECT 
        p.id_pase,
        p.folio,
        p.fecha_emision,
        p.fecha_vencimiento,
        p.estado,
        p.codigo_qr_path as qr_url,
        v.placas,
        v.modelo,
        v.marca,
        v.color,
        u.nombre_completo as propietario,
        u.tipo_usuario
      FROM pases p
      JOIN vehiculos v ON p.id_vehiculo = v.id_vehiculo
      JOIN usuarios u ON v.id_usuario = u.id_usuario
      ORDER BY p.fecha_emision DESC
    `, { type: QueryTypes.SELECT });
    res.json(pases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener pases' });
  }
};

exports.getDetalleVehiculos = async (req, res) => {
  try {
    const vehiculos = await sequelize.query(`
      SELECT 
        v.id_vehiculo,
        v.placas,
        v.marca,
        v.modelo,
        v.color,
        v.tipo,
        v.foto_documento_validacion as foto_vehiculo,
        u.id_usuario,
        u.nombre_completo as propietario,
        u.tipo_usuario,
        u.telefono
      FROM vehiculos v
      JOIN usuarios u ON v.id_usuario = u.id_usuario
      ORDER BY v.id_vehiculo DESC
    `, { type: QueryTypes.SELECT });

    res.json(vehiculos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener vehículos' });
  }
};