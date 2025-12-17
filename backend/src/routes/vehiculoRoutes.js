const express = require('express');
const router = express.Router();
const vehiculoController = require('../controllers/vehiculoController');
const verificarToken = require('../middlewares/authMiddleware');
const multer = require('multer');

// Configuración de Multer (Memoria)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB límite
});

// Middleware de autenticación global para estas rutas
router.use(verificarToken);

// --- RUTAS ---

// 1. Obtener mis vehículos
// El frontend llama a: /api/vehiculos/mis-vehiculos
router.get('/mis-vehiculos', vehiculoController.misVehiculos); 

// 2. Registrar vehículo
// OJO AQUÍ: 'foto' debe coincidir con formData.append('foto', ...) del frontend
router.post('/', upload.single('foto'), vehiculoController.registrarVehiculo);

router.delete('/:id_vehiculo', vehiculoController.eliminarVehiculo);

module.exports = router;