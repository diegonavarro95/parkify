const { Acceso, Vehiculo, Usuario } = require('../models');
const { Op } = require('sequelize');

// 1. VALIDAR ACCESO (El Ojo del Guardia)
// Recibe el QR, busca el vehículo y le dice al guardia: "Es Juan, trae un Aveo Rojo".
exports.validarAcceso = async (req, res) => {
  try {
    const { id_vehiculo } = req.body;

    // 1. Buscamos el vehículo e intentamos traer al usuario
    const vehiculo = await Vehiculo.findByPk(id_vehiculo, {
      include: [{ 
        model: Usuario, 
        as: 'usuario', // Asegúrate de que en tus Modelos definiste "as: 'usuario'"
        attributes: ['nombre_completo', 'rol', 'activo'] 
      }]
    });

    // 2. Si no existe el vehículo
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado en el sistema.' });
    }

    // --- DEBUGGING (MIRA ESTO EN TU CONSOLA NEGRA) ---
    // Esto nos dirá si Sequelize trajo al usuario o no
    console.log("Vehículo encontrado:", JSON.stringify(vehiculo, null, 2)); 

    // 3. DEFENSIVE CODING: Verificar si el usuario se cargó correctamente
    // Intentamos leer 'usuario' (alias minúscula) o 'Usuario' (defecto mayúscula)
    const propietario = vehiculo.usuario || vehiculo.Usuario;

    if (!propietario) {
      console.error(`ERROR DE INTEGRIDAD: El vehículo ${id_vehiculo} no tiene usuario asociado.`);
      return res.status(500).json({ 
        error: 'Error de datos', 
        detalle: 'Este vehículo no tiene un propietario válido asignado.' 
      });
    }

    // 4. Validar si el usuario está activo (Ahora usamos la variable segura 'propietario')
    if (!propietario.activo) {
      return res.status(403).json({ 
        error: 'ACCESO DENEGADO', 
        detalle: 'El usuario tiene el acceso suspendido.' 
      });
    }

    // 5. Buscar historial para sugerir entrada/salida
    const ultimoAcceso = await Acceso.findOne({
      where: { id_vehiculo },
      order: [['fecha_hora_entrada', 'DESC']]
    });

    let accionSugerida = 'entrada';
    if (ultimoAcceso && ultimoAcceso.fecha_hora_salida === null) {
      accionSugerida = 'salida';
    }

    // 6. Responder
    res.json({
      mensaje: 'Vehículo Verificado',
      vehiculo: {
        id_vehiculo: vehiculo.id_vehiculo,
        placas: vehiculo.placas,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        color: vehiculo.color,
        tipo: vehiculo.tipo,
        foto_url: vehiculo.foto_url,
        conductor: propietario.nombre_completo, // Usamos la variable segura
        rol: propietario.rol
      },
      accionSugerida
    });

  } catch (error) {
    console.error("Error en validarAcceso:", error);
    res.status(500).json({ error: 'Error interno validando acceso' });
  }
};

// 2. REGISTRAR EL MOVIMIENTO (Acción Real)
exports.registrarMovimiento = async (req, res) => {
  try {
    const { id_vehiculo, tipo_movimiento, id_cajon_moto } = req.body; // tipo_movimiento: 'entrada' | 'salida'
    const id_guardia = req.user.id;
    const io = req.app.get('io'); // WebSockets

    let acceso;

    if (tipo_movimiento === 'entrada') {
      // --- LÓGICA DE ENTRADA ---
      acceso = await Acceso.create({
        id_vehiculo,
        tipo_acceso: 'alumno', // Opcional
        id_admin_guardia_entrada: id_guardia,
        fecha_hora_entrada: new Date(),
        id_cajon_moto: id_cajon_moto || null
      });

      // Notificar mapa de motos si aplica
      if (id_cajon_moto && io) {
        io.emit('mapa_actualizado', { accion: 'ocupar', cajon: id_cajon_moto });
      }

    } else {
      // --- LÓGICA DE SALIDA ---
      // Buscar el registro abierto para cerrarlo
      acceso = await Acceso.findOne({
        where: { 
          id_vehiculo, 
          fecha_hora_salida: null 
        },
        order: [['fecha_hora_entrada', 'DESC']]
      });

      if (!acceso) {
        return res.status(400).json({ error: 'No se encontró un registro de entrada abierto para este vehículo.' });
      }

      acceso.fecha_hora_salida = new Date();
      acceso.id_admin_guardia_salida = id_guardia;
      await acceso.save();

      // Liberar mapa de motos
      if (acceso.id_cajon_moto && io) {
        io.emit('mapa_actualizado', { accion: 'liberar', cajon: acceso.id_cajon_moto });
      }
    }

    // Notificar actualización general (stats)
    if (io) io.emit('stats_actualizado');

    res.json({ 
      mensaje: `${tipo_movimiento === 'entrada' ? 'Bienvenido' : 'Hasta luego'}`, 
      tipo: tipo_movimiento 
    });

  } catch (error) {
    console.error(error);
    // Manejo de tu Trigger P0001 (Postgres)
    if (error.original && error.original.code === 'P0001') {
      return res.status(409).json({ error: error.original.message });
    }
    res.status(500).json({ error: 'Error registrando movimiento' });
  }
};