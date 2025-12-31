const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verificarToken = require('../middlewares/authMiddleware');
const { esAdmin } = require('../middlewares/roleMiddleware');

// Todas estas rutas requieren ser ADMIN
router.use(verificarToken, esAdmin);

// Gestión de Usuarios
router.get('/usuarios', adminController.getAllUsuarios);
router.put('/usuarios/:id_usuario/estado', adminController.toggleBloqueoUsuario);

// Gestión de Vehículos
router.get('/vehiculos', adminController.getAllVehiculos);

router.get('/estadisticas', adminController.obtenerEstadisticas);

router.get('/mapa', adminController.obtenerMapa);
router.get('/alertas', adminController.obtenerAlertas);

module.exports = router;