const Vehiculo = require('../models/Vehiculo');
const { uploadFile } = require('../services/storageService');

exports.registrarVehiculo = async (req, res) => {
  try {
    const { tipo, marca, modelo, color, placas, numero_boleta, rfc } = req.body;
    const id_usuario = req.user.id; // Esto vendrá del token JWT (Middleware)

    // 1. Validar límite de 2 vehículos
    const count = await Vehiculo.count({ where: { id_usuario } });
    if (count >= 2) {
      return res.status(400).json({ error: 'Has alcanzado el límite de 2 vehículos.' });
    }

    // 2. Manejar subida de foto (si existe)
    let fotoUrl = null;
    if (req.file) {
      fotoUrl = await uploadFile(req.file, 'documentos'); // Sube a carpeta 'documentos'
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
    // Manejo de error de duplicado (Unique constraint)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Esas placas ya están registradas en el sistema.' });
    }
    res.status(500).json({ error: 'Error al registrar vehículo', detalle: error.message });
  }
};

exports.misVehiculos = async (req, res) => {
  try {
    const vehiculos = await Vehiculo.findAll({ 
      where: { id_usuario: req.user.id } 
    });
    res.json(vehiculos);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo vehículos' });
  }
};

exports.eliminarVehiculo = async (req, res) => {
  try {
    const { id_vehiculo } = req.params;
    const id_usuario = req.user.id;

    // Ejecutar el borrado asegurando que el vehículo sea del usuario
    const resultado = await Vehiculo.destroy({
      where: { 
        id_vehiculo, 
        id_usuario 
      }
    });

    if (resultado === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado o no tienes permiso para eliminarlo.' });
    }

    res.json({ mensaje: 'Vehículo eliminado correctamente.' });

  } catch (error) {
    console.error(error);
    // Si hay pases asociados, la BD lanzará un error de llave foránea (constraint)
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'No puedes eliminar este vehículo porque tiene historial de pases o accesos.' });
    }
    res.status(500).json({ error: 'Error al eliminar el vehículo.' });
  }
};