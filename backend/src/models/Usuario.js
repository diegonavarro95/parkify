const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false
    // No ponemos defaultValue UUIDV4 porque el ID vendrá de Supabase Auth
  },
  curp: {
    type: DataTypes.STRING(18),
    allowNull: false,
    unique: true
  },
  tipo_usuario: {
    type: DataTypes.ENUM('comunidad_escom', 'visitante'),
    allowNull: false
  },
  nombre_completo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  correo_electronico: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  telefono: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  rol: {
    type: DataTypes.ENUM('usuario', 'admin_guardia'),
    defaultValue: 'usuario'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  intentos_login_fallidos: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  fecha_registro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  documento_validacion_url: {
    type: DataTypes.STRING, // o TEXT
    allowNull: true
  },
  reset_password_token: {
    type: DataTypes.STRING, // o TEXT
    allowNull: true
  },
  reset_password_expires: {
    type: DataTypes.BIGINT,
    allowNull: true
  }
}, {
  tableName: 'usuarios', // Nombre exacto en la BD
  timestamps: false      // Ya tenemos fecha_registro manual
});

module.exports = Usuario;