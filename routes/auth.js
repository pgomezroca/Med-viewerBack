const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

//Registro de usuario (Profesional)
router.post('/register', register);
//Login del profesional
router.post('/login', login);

module.exports = router;