const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify(function(error, success) {
  if (error) {
    console.log('Error configurando el transporte de email:', error);
  } else {
    console.log('Servidor de email configurado correctamente');
  }
});

module.exports = transporter;