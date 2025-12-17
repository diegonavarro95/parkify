require('dotenv').config();
const http = require('http'); // Importar HTTP nativo
const { Server } = require('socket.io'); // Importar Socket.io
const app = require('./app');

const PORT = process.env.PORT || 5000;

// 1. Crear servidor HTTP a partir de la App de Express
const server = http.createServer(app);

// 2. Configurar Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // En producción, pon aquí la URL de tu frontend (ej: http://localhost:5173)
    methods: ["GET", "POST"]
  }
});

// 3. Guardar la instancia de 'io' en la App para usarla en los controladores
app.set('io', io);

// 4. Escuchar conexiones de clientes (Frontend)
io.on('connection', (socket) => {
  console.log('⚡ Cliente conectado vía WebSocket:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

// 5. Arrancar el servidor (Nota: usamos server.listen, NO app.listen)
server.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 WebSockets activos`);
  console.log(`👉 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});