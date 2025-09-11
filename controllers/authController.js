const { User, PasswordResetToken } = require('../models');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailTransporter = require('../config/email');

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

const forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ 
          message: 'No se encontró usuario con ese email' 
        });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

      await PasswordResetToken.create({
        token,
        user_id: user.id,
        expires_at: expiresAt,
        used: false
      });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: 'Recuperación de contraseña',
        html: `
          <h2>Solicitud de recuperación de contraseña</h2>
          <p>Hola ${user.nombre},</p>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Restablecer contraseña
          </a>
          <p>Este enlace expirará en 1 hora.</p>
          <p>Si no solicitaste este cambio, ignora este email.</p>
        `
      };

      await emailTransporter.sendMail(mailOptions);

      res.json({ 
        message: 'Email de recuperación enviado correctamente' 
      });

    } catch (error) {
      console.error('Error en forgotPassword:', error);
      res.status(500).json({ 
        message: 'Error al procesar la solicitud' 
      });
    }
  }

  // Verificar token de recuperación
  const verifyResetToken = async (req, res) => {
    try {
      const { token } = req.query;

      const resetToken = await PasswordResetToken.findOne({
        where: { token },
        include: [{ model: User, as: 'user' }]
      });

      if (!resetToken) {
        return res.status(400).json({ 
          message: 'Token inválido' 
        });
      }

      if (resetToken.used) {
        return res.status(400).json({ 
          message: 'Este token ya fue utilizado' 
        });
      }

      if (new Date() > resetToken.expires_at) {
        return res.status(400).json({ 
          message: 'El token ha expirado' 
        });
      }

      res.json({ 
        valid: true, 
        email: resetToken.user.email 
      });

    } catch (error) {
      console.error('Error en verifyResetToken:', error);
      res.status(500).json({ 
        message: 'Error al verificar el token' 
      });
    }
  }

  // Resetear contraseña
  const resetPassword = async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      const resetToken = await PasswordResetToken.findOne({
        where: { token },
        include: [{ model: User, as: 'user' }]
      });

      if (!resetToken) {
        return res.status(400).json({ 
          message: 'Token inválido' 
        });
      }

      if (resetToken.used) {
        return res.status(400).json({ 
          message: 'Este token ya fue utilizado' 
        });
      }

      if (new Date() > resetToken.expires_at) {
        return res.status(400).json({ 
          message: 'El token ha expirado' 
        });
      }

      const user = await User.findByPk(resetToken.user_id);
      user.password = newPassword;
      await user.save();

      resetToken.used = true;
      await resetToken.save();

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: 'Contraseña actualizada',
        html: `
          <h2>Contraseña actualizada exitosamente</h2>
          <p>Hola ${user.nombre},</p>
          <p>Tu contraseña ha sido actualizada correctamente.</p>
          <p>Si no realizaste este cambio, por favor contacta con soporte inmediatamente.</p>
        `
      };

      await emailTransporter.sendMail(mailOptions);

      res.status(200).json({ 
        message: 'Contraseña actualizada correctamente' 
      });

    } catch (error) {
      console.error('Error en resetPassword:', error);
      res.status(500).json({ 
        message: 'Error al resetear la contraseña' 
      });
    }
  }

module.exports = { register, login, forgotPassword, verifyResetToken, resetPassword };