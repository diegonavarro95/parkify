const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Acceso = sequelize.define('Acceso', {
  id_acceso: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_vehiculo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // Para saber quién dejó pasar al vehículo
  id_admin_guardia_entrada: {
    type: DataTypes.INTEGER, // O UUID si tus usuarios usan UUID
    allowNull: true
  },
  id_admin_guardia_salida: {
    type: DataTypes.INTEGER, // O UUID
    allowNull: true
  },
  fecha_hora_entrada: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_hora_salida: {
    type: DataTypes.DATE,
    allowNull: true // Null = El carro sigue adentro
  },
  // Exclusivo para motos
  id_cajon_moto: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'accesos',
  timestamps: false
});

module.exports = Acceso;