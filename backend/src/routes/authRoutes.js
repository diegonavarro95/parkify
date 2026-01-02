const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');

// --- CONFIGURACIÓN DE MULTER (En Memoria) ---
// Guardamos el archivo en RAM temporalmente para subirlo a Supabase
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB por archivo (opcional)
});

// --- RUTAS ---

// 1. Registro: Recibe 'documento_validacion'
router.post('/register', upload.single('documento_validacion'), authController.register);

// 2. Login
router.post('/login', authController.login);

// 3. Recuperación de Contraseña
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router; 