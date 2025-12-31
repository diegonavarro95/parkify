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
    origin: ["http://localhost:5173", "http://localhost:3000"], // Tus puertos de frontend
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 3. Guardar la instancia de 'io' en la App para usarla en los controladores
app.set('io', io);

// 4. Escuchar conexiones de clientes (Frontend)
io.on('connection', (socket) => {
  console.log('🔌 Nuevo cliente conectado ID:', socket.id);

  // 👇 LÓGICA PARA UNIRSE A LA SALA DE ADMINS
  socket.on('identificarse', (userData) => {
    console.log('👤 Intento de identificación:', userData);
    
    // Validamos si es el rol correcto
    if (userData && userData.rol === 'admin_guardia') {
      socket.join('sala_admins');
      console.log(`✅ Usuario ${userData.nombre} (ID: ${socket.id}) unido a sala_admins`);
      
      // Prueba de bienvenida (opcional)
      socket.emit('mensaje_sistema', 'Has entrado al canal de seguridad');
    }
  });

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