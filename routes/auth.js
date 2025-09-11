const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, verifyResetToken, resetPassword } = require('../controllers/authController');

//Registro de usuario (Profesional)
router.post('/register', register);
//Login del profesional
router.post('/login', login);
// Ruta para solicitar recuperación de contraseña
router.post('/forgot-password', forgotPassword);
// Ruta para verificar token
router.get('/verify-reset-token', verifyResetToken);
// Ruta para resetear contraseña
router.post('/reset-password', resetPassword);

module.exports = router;