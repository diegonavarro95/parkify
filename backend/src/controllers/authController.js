const supabase = require('../config/supabase'); // Tu cliente Supabase
const Usuario = require('../models/Usuario');   // Tu modelo Sequelize
const sgMail = require('@sendgrid/mail');       // SendGrid
const crypto = require('crypto');               // Para generar tokens
const { Op } = require('sequelize');            // Operadores Sequelize

// Configurar API Key de SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 1. REGISTRO (Supabase + Documento)
// 1. REGISTRO (Supabase Auth + Supabase Storage)
// 1. REGISTRO (Con Rollback de seguridad)
exports.register = async (req, res) => {
  const { email, password, curp, nombre_completo, tipo_usuario, telefono, rol } = req.body;
  const archivo = req.file; 

  // Variable para rastrear si se creó el usuario en la nube
  let supabaseUserId = null;

  try {
    // A. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true 
    });

    if (authError) throw authError;

    // GUARDAMOS EL ID CREADO PARA PODER BORRARLO SI ALGO FALLA DESPUÉS
    supabaseUserId = authData.user.id;

    let documentoUrl = null;

    // B. Subir archivo a Supabase Storage
    if (archivo) {
        const fileExt = archivo.originalname.split('.').pop();
        const filePath = `documento-oficial/${supabaseUserId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('parkify-files') 
            .upload(filePath, archivo.buffer, {
                contentType: archivo.mimetype,
                upsert: true
            });

        // Si falla la subida, lanzamos error (esto activará el catch y borrará el usuario)
        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
            .from('parkify-files')
            .getPublicUrl(filePath);

        documentoUrl = publicData.publicUrl;
    }

    // C. Crear perfil en PostgreSQL (Sequelize)
    const nuevoUsuario = await Usuario.create({
      id_usuario: supabaseUserId, // Usamos el ID que guardamos
      correo_electronico: email,
      curp,
      nombre_completo,
      tipo_usuario,
      telefono,
      rol: rol || 'usuario',
      documento_validacion_url: documentoUrl, 
      activo: true
    });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: nuevoUsuario
    });

  } catch (error) {
    console.error("Error Registro:", error);

    // --- LÓGICA DE ROLLBACK (DESHACER) ---
    // Si ya habíamos creado el usuario en Supabase pero falló la BD local o el archivo...
    if (supabaseUserId) {
        console.log(`⚠️ Borrando usuario huérfano de Supabase: ${supabaseUserId}`);
        await supabase.auth.admin.deleteUser(supabaseUserId);
    }
    // -------------------------------------

    // Personalizar el mensaje si el error viene de Supabase porque ya existía desde antes
    if (error.code === 'email_exists') {
        return res.status(400).json({ error: 'Este correo ya está registrado.' });
    }

    res.status(400).json({
      error: 'Error en el registro',
      detalle: error.message
    });
  }
};

// 2. LOGIN (Tu versión original corregida con nombre_completo)
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("➡️ Intentando login en Supabase");
    // A. Login en Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // B. Buscar datos extra en PostgreSQL
    const usuarioDB = await Usuario.findByPk(data.user.id);

    if (!usuarioDB) {
      return res.status(404).json({ error: 'Usuario no encontrado en base de datos local.' });
    }

    if (!usuarioDB.activo) {
      return res.status(403).json({ error: 'Cuenta desactivada.' });
    }

    // C. Responder
    res.json({
      mensaje: 'Login exitoso',
      token: data.session.access_token,
      usuario: {
        id_usuario: usuarioDB.id_usuario,
        nombre_completo: usuarioDB.nombre_completo, // <--- CAMPO CORREGIDO
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

// 3. FORGOT PASSWORD (Generar Token Local + Enviar Correo SendGrid)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Buscar usuario en PostgreSQL
    const usuario = await Usuario.findOne({ where: { correo_electronico: email } });

    if (!usuario) {
      return res.status(404).json({ error: 'Correo no registrado' });
    }

    // Generar Token Temporal
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Guardar token en PostgreSQL (Asegúrate de haber creado estas columnas en la BD)
    usuario.reset_password_token = resetToken;
    usuario.reset_password_expires = Date.now() + 3600000; // 1 hora
    await usuario.save();

    // Crear Link para el Frontend
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Enviar Correo con SendGrid
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL, // Tu sender verificado
      subject: 'Recuperar Contraseña - Parkify ESCOM',
      html: `
        <div style="font-family: sans-serif; padding: 20px; text-align: center;">
            <h1 style="color: #2563EB;">Parkify ESCOM</h1>
            <p>Hola ${usuario.nombre_completo}, solicitaste restablecer tu contraseña.</p>
            <a href="${resetUrl}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Restablecer Contraseña
            </a>
            <p style="font-size: 12px; color: #888; margin-top: 20px;">Link: ${resetUrl}</p>
        </div>
      `
    };

    await sgMail.send(msg);
    res.json({ mensaje: 'Correo de recuperación enviado.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar correo' });
  }
};

// 4. RESET PASSWORD (Validar Token Local + Actualizar Supabase)
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // 1. Validar Token en PostgreSQL
        const usuario = await Usuario.findOne({ 
            where: { 
                reset_password_token: token,
                reset_password_expires: { [Op.gt]: Date.now() } // Que no haya expirado
            } 
        });

        if (!usuario) {
            return res.status(400).json({ error: 'El enlace es inválido o ha expirado.' });
        }

        // 2. Actualizar contraseña en SUPABASE
        // Usamos el ID del usuario (que es el mismo en PG y Supabase)
        const { data, error } = await supabase.auth.admin.updateUserById(
            usuario.id_usuario, 
            { password: password }
        );

        if (error) throw error;

        // 3. Limpiar Token en PostgreSQL
        usuario.reset_password_token = null;
        usuario.reset_password_expires = null;
        await usuario.save();

        res.json({ mensaje: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error("Error Reset Password:", error);
        res.status(500).json({ error: 'No se pudo actualizar la contraseña', detalle: error.message });
    }
};