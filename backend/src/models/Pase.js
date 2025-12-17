const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pase = sequelize.define('Pase', {
  id_pase: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  folio: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  id_vehiculo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  codigo_qr_path: DataTypes.TEXT,
  pdf_path: DataTypes.TEXT,
  fecha_emision: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_vencimiento: DataTypes.DATE, // Calculado por trigger
  estado: {
    type: DataTypes.ENUM('vigente', 'vencido', 'invalidado'),
    defaultValue: 'vigente'
  }
}, {
  tableName: 'pases',
  timestamps: false
});

module.exports = Pase;