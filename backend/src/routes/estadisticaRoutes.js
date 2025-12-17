const express = require('express');
const router = express.Router();
const estadisticaController = require('../controllers/estadisticaController');
const verificarToken = require('../middlewares/authMiddleware');

router.get('/dashboard', verificarToken, estadisticaController.getDashboardStats);

module.exports = router;