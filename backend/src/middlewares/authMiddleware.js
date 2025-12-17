const supabase = require('../config/supabase');

const verificarToken = async (req, res, next) => {
  try {
    // Leer header Authorization: "Bearer <token>"
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
    }

    // Verificar token con Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido o expirado.' });
    }

    // Inyectar usuario en la request
    req.user = { id: user.id, email: user.email };
    next();

  } catch (error) {
    res.status(401).json({ error: 'Error de autenticación.' });
  }
};

module.exports = verificarToken;