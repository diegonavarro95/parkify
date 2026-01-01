const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const verificarToken = require('../middlewares/authMiddleware');

router.use(verificarToken);

// ... otras rutas ...
router.get('/dashboard', usuarioController.getDashboardData); // <--- NUEVA RUTA

module.exports = router;