const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reporte = sequelize.define('Reporte', {
  id_reporte: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_usuario: {
    type: DataTypes.UUID,
    allowNull: false
  },
  asunto: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fotos_evidencia: {
    type: DataTypes.JSONB, // Array de URLs
    defaultValue: []
  },
  fecha_envio: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  estado: {
    type: DataTypes.ENUM('nuevo', 'en_revision', 'atendido', 'cerrado'),
    defaultValue: 'nuevo'
  },
  comentario_admin: DataTypes.TEXT,
  id_admin_atendio: DataTypes.UUID,
  eliminado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'reportes',
  timestamps: false
});

module.exports = Reporte;