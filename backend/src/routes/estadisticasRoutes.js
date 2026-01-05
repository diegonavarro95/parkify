const express = require('express');
const router = express.Router();
const controller = require('../controllers/estadisticasController');
const verificarToken = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/resumen', controller.getResumen);
router.get('/grafica', controller.getGraficaAccesos);
router.get('/detalle-usuarios', controller.getDetalleUsuarios);
router.get('/detalle-pases', controller.getDetallePases);
router.get('/detalle-vehiculos', controller.getDetalleVehiculos);

module.exports = router;