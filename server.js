require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const imageRoutes = require('./routes/imageRoutes');
const authRoutes = require('./routes/auth');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);

// Conexión a base de datos y levantar servidor
sequelize.authenticate()
  .then(() => {
    console.log('Conectado a la base de datos correctamente');
    return sequelize.sync(); // o sync({ alter: true }) en desarrollo
  })
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error al conectar con la base de datos:', err);
  });
