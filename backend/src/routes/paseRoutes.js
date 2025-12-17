const express = require('express');
const router = express.Router();
const paseController = require('../controllers/paseController');
const verificarToken = require('../middlewares/authMiddleware');

router.post('/generar', verificarToken, paseController.generarPase);

module.exports = router;