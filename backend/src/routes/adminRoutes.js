const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const notificacionController = require('../controllers/notificacionController');
const verificarToken = require('../middlewares/authMiddleware');
const { esAdmin } = require('../middlewares/roleMiddleware');

// Todas estas rutas requieren ser ADMIN
router.use(verificarToken, esAdmin);

// Gestión de Usuarios
router.get('/usuarios', adminController.getAllUsuarios);
router.put('/usuarios/:id_usuario/estado', adminController.toggleBloqueoUsuario);

// Gestión de Vehículos
router.get('/vehiculos', adminController.getAllVehiculos);

// Notificaciones
router.get('/notificaciones', notificacionController.getPendientes);
router.put('/notificaciones/:id/revisada', notificacionController.marcarRevisada);

module.exports = router;