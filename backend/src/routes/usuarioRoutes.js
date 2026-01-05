const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');
router.use(verificarToken);

// ... otras rutas ...
router.get('/dashboard', usuarioController.getDashboardData); // <--- NUEVA RUTA
router.put('/:id/estado', verificarToken, usuarioController.cambiarEstadoUsuario);

module.exports = router;