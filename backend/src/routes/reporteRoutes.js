const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const verificarToken = require('../middlewares/authMiddleware');
const { esAdmin } = require('../middlewares/roleMiddleware');
const multer = require('multer');

// Configuración de subida (hasta 3 fotos)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// Rutas de Usuario
router.get('/mis-reportes', verificarToken, reporteController.misReportes);
router.post('/', verificarToken, upload.array('evidencia', 3), reporteController.crearReporte);

// Rutas de Admin
router.get('/todos', verificarToken, esAdmin, reporteController.listarTodos);
router.put('/:id_reporte/estado', verificarToken, esAdmin, reporteController.actualizarEstado);

module.exports = router;