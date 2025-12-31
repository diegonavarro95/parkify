const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const vehiculoRoutes = require('./routes/vehiculoRoutes');
const iniciarCronJobs = require('./utils/cronJobs');
// Inicializar app
const app = express();

// Conectar a BD
connectDB();

iniciarCronJobs();
// Middlewares Globales
app.use(helmet()); // Seguridad headers HTTP
app.use(cors()); // Permitir peticiones del frontend 
app.use(express.json()); // Parsear body JSON
app.use(morgan('dev')); // Logger de peticiones HTTP
app.use('/api/auth', authRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/pases', require('./routes/paseRoutes'));
app.use('/api/accesos', require('./routes/accesoRoutes'));
app.use('/api/estadisticas', require('./routes/estadisticaRoutes'));
app.use('/api/reportes', require('./routes/reporteRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/notificaciones', require('./routes/notificacionRoutes'));

// Ruta de prueba (Health Check)
app.get('/', (req, res) => {
  res.json({ 
    estado: 'API Funcionando 🚀', 
    proyecto: 'Parkify ESCOM',
    version: '1.0.0' 
  });
});

// Rutas API (Las iremos agregando aquí)
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/usuarios', require('./routes/usuarioRoutes'));

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' }); 
});

module.exports = app;