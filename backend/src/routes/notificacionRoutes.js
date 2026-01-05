const express = require('express');
const router = express.Router();
const notifController = require('../controllers/notificacionController');
const verificarToken = require('../middlewares/authMiddleware');

router.use(verificarToken);
router.get('/', notifController.obtenerMisNotificaciones);
router.put('/:id/leer', notifController.marcarLeida);
router.put('/leer-todas', notifController.marcarTodasLeidas);
router.delete('/', notifController.eliminarTodas);

module.exports = router;