const supabase = require('../config/supabase'); // El cliente que configuramos antes
const Usuario = require('../models/Usuario');

exports.register = async (req, res) => {
  const { email, password, curp, nombre_completo, tipo_usuario, telefono, rol } = req.body;

  try {
    // 1. Crear usuario en Supabase Auth (Capa de Seguridad)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Confirmamos automáticamente para no trabar el desarrollo
    });

    if (authError) throw authError;

    // 2. Crear perfil en nuestra tabla 'usuarios' (Capa de Datos)
    // Usamos el ID que nos devolvió Supabase
    const nuevoUsuario = await Usuario.create({
      id_usuario: authData.user.id,
      correo_electronico: email,
      curp,
      nombre_completo,
      tipo_usuario, // 'comunidad_escom' o 'visitante'
      telefono,
      rol: rol || 'usuario' // Por defecto usuario, pero permite crear admins si se envía
    });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: nuevoUsuario
    });

  } catch (error) {
    console.error(error);
    // Manejo básico de errores (Duplicados, validaciones)
    res.status(400).json({
      error: 'Error en el registro',
      detalle: error.message
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Iniciar sesión con Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // 2. Obtener datos extra de nuestra tabla (Rol, Nombre, etc)
    const usuarioDB = await Usuario.findByPk(data.user.id);

    if (!usuarioDB) {
      return res.status(404).json({ error: 'Usuario autenticado pero no encontrado en base de datos.' });
    }

    if (!usuarioDB.activo) {
      return res.status(403).json({ error: 'Esta cuenta ha sido desactivada.' });
    }

    // 3. Responder con el Token y los datos del usuario
    res.json({
      mensaje: 'Login exitoso',
      token: data.session.access_token,
      usuario: {
        id_usuario: usuarioDB.id_usuario,
        // 👇 AQUÍ ESTÁ EL CAMBIO: Ahora se llama 'nombre_completo'
        nombre_completo: usuarioDB.nombre_completo, 
        correo_electronico: usuarioDB.correo_electronico,
        rol: usuarioDB.rol,
        tipo_usuario: usuarioDB.tipo_usuario
      }
    });

  } catch (error) {
    res.status(401).json({
      error: 'Credenciales inválidas',
      detalle: error.message
    });
  }
};