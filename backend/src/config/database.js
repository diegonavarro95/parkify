const { Sequelize } = require('sequelize');
const path = require('path');

// 1. Cargar .env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = process.env.DATABASE_URL;

// 2. Validación inicial
if (!dbUrl) {
  console.error('❌ ERROR: DATABASE_URL no está definida en .env');
  process.exit(1);
}

// 3. Parseo MANUAL de la URL (Para evitar errores con caracteres especiales en la contraseña)
// Esto separa: postgres://usuario:password@host:port/database
let sequelize;
try {
  const url = new URL(dbUrl); // Usamos el parser nativo de Node.js

  sequelize = new Sequelize(
    url.pathname.substring(1), // Nombre de la base de datos (quita el / inicial)
    url.username,              // Usuario
    url.password,              // Contraseña
    {
      host: url.hostname,
      port: url.port || 5432,
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      define: {
        timestamps: false,
        freezeTableName: true
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} catch (error) {
  console.error('❌ ERROR FATAL: La URL de conexión en .env tiene un formato inválido.');
  console.error('   Verifica que no tengas espacios extra o caracteres raros.');
  console.error('   Error técnico:', error.message);
  process.exit(1);
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a Base de Datos (Supabase) exitosa.');
    console.log(`   Host: ${sequelize.config.host}`);
    console.log(`   Base de Datos: ${sequelize.config.database}`);
  } catch (error) {
    console.error('❌ Error conectando a la Base de Datos:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };