const { User } = require('../models');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const register = async (req, res) => {
  try {
    const { nombre, apellido, email, password } = req.body;

    if (!nombre || !apellido || !email || !password)
      return res.status(400).json({ error: 'Faltan datos obligatorios' });

    const userExists = await User.findOne({ where: { email } });
    if (userExists)
      return res.status(400).json({ error: 'El email ya está registrado' });

    await User.create({ nombre, apellido, email, password });

    res.status(201).json({ message: 'Registro exitoso' });
  } catch (err) {
    console.error('❌ Error en registro:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(400).json({ error: 'Credenciales inválidas' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user.id, email: user.email, nombre: user.nombre },
      JWT_SECRET
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email
      }
    });
  } catch (err) {
    console.error('❌ Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { register, login };