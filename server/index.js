const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); // Importamos la conexión y modelos
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de Nómina funcionando 🚀');
});

// Función para arrancar el servidor y sincronizar la base de datos
const startServer = async () => {
  try {
    // .sync({ alter: true }) actualiza las tablas si agregas campos después
    await sequelize.sync({ alter: true }); 
    console.log('✅ Base de datos conectada y tablas sincronizadas.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al conectar la base de datos:', error);
  }
};

startServer();