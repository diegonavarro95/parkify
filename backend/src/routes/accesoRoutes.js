const express = require('express');
const router = express.Router();
const accesoController = require('../controllers/accesoController');
const verificarToken = require('../middlewares/authMiddleware');
const cajonController = require('../controllers/cajonController');
// Middleware global de seguridad
router.use(verificarToken);

// 1. Escanear y consultar estado
router.post('/validar', accesoController.validarAcceso);

// 2. Confirmar y guardar en BD
router.post('/registrar', accesoController.registrarMovimiento);

router.get('/historial', accesoController.obtenerHistorial);

router.get('/mapa-motos', cajonController.obtenerMapa);

module.exports = router;