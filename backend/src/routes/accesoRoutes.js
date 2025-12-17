const express = require('express');
const router = express.Router();
const accesoController = require('../controllers/accesoController');
const verificarToken = require('../middlewares/authMiddleware');

// Middleware global de seguridad (Solo guardias/admins deberían poder usar esto)
// Idealmente agregaríamos verificarRol('admin_guardia') aquí.
router.use(verificarToken);

// 1. Validar (Escanear QR y ver datos)
router.post('/validar', accesoController.validarAcceso);

// 2. Registrar (Dar click en "Abrir Pluma")
router.post('/registrar', accesoController.registrarMovimiento);

module.exports = router;