const Vehiculo = require('../models/Vehiculo');
const { uploadFile } = require('../services/storageService');
// 👇 IMPORTS NUEVOS NECESARIOS PARA LA CONSULTA DE PASES
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

exports.registrarVehiculo = async (req, res) => {
  try {
    const { tipo, marca, modelo, color, placas, numero_boleta, rfc } = req.body;
    const id_usuario = req.user.id; 

    // 1. Validar límite de 2 vehículos
    const count = await Vehiculo.count({ where: { id_usuario } });
    if (count >= 2) {
      return res.status(400).json({ error: 'Has alcanzado el límite de 2 vehículos.' });
    }

    // 2. Manejar subida de foto
    let fotoUrl = null;
    if (req.file) {
      // Nota: Si ya implementaste la subida a Supabase, asegúrate que uploadFile lo maneje.
      fotoUrl = await uploadFile(req.file, 'documentos'); 
    } else {
      return res.status(400).json({ error: 'La fotografía del documento es obligatoria.' });
    }

    // 3. Crear vehículo en BD
    const nuevoVehiculo = await Vehiculo.create({
      id_usuario,
      tipo,
      marca,
      modelo,
      color,
      placas,
      foto_documento_validacion: fotoUrl,
      numero_boleta,
      rfc
    });

    res.status(201).json({
      mensaje: 'Vehículo registrado exitosamente',
      vehiculo: nuevoVehiculo
    });

  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Esas placas ya están registradas en el sistema.' });
    }
    res.status(500).json({ error: 'Error al registrar vehículo', detalle: error.message });
  }
};

// 👇 ESTA ES LA FUNCIÓN QUE MODIFICAMOS PARA EL PDF
exports.misVehiculos = async (req, res) => {
  try {
    const id_usuario = req.user.id;

    // Hacemos una consulta manual para unir (JOIN) Vehículos con Pases
    // Así obtenemos las fechas reales de la base de datos
    const vehiculos = await sequelize.query(`
      SELECT 
        v.id_vehiculo, 
        v.marca, 
        v.modelo, 
        v.color, 
        v.placas, 
        v.tipo, 
        v.foto_documento_validacion as foto_url,
        
        -- Datos del Pase (si tiene uno vigente)
        p.folio as pase_folio,
        p.fecha_emision,
        p.fecha_vencimiento,
        p.estado as estado_pase

      FROM vehiculos v
      -- LEFT JOIN: Trae el vehículo aunque no tenga pase
      LEFT JOIN pases p ON v.id_vehiculo = p.id_vehiculo 
        AND p.estado = 'vigente' 
        AND p.fecha_vencimiento > NOW() -- Solo pases que no han vencido
      
      WHERE v.id_usuario = :id
    `, { 
      replacements: { id: id_usuario }, 
      type: QueryTypes.SELECT 
    });

    res.json(vehiculos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo vehículos' });
  }
};

exports.eliminarVehiculo = async (req, res) => {
  try {
    const { id_vehiculo } = req.params;
    const id_usuario = req.user.id;

    const resultado = await Vehiculo.destroy({
      where: { 
        id_vehiculo, 
        id_usuario 
      }
    });

    if (resultado === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado o no tienes permiso.' });
    }

    res.json({ mensaje: 'Vehículo eliminado correctamente.' });

  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'No puedes eliminar este vehículo porque tiene historial.' });
    }
    res.status(500).json({ error: 'Error al eliminar el vehículo.' });
  }
};