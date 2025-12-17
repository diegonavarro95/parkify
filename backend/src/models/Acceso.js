const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Acceso = sequelize.define('Acceso', {
  id_acceso: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_pase: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('entrada', 'salida'),
    allowNull: false
  },
  fecha_hora: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  metodo_validacion: {
    type: DataTypes.ENUM('placas', 'folio', 'qr', 'curp'),
    allowNull: false
  },
  id_admin_guardia: {
    type: DataTypes.UUID,
    allowNull: false
  },
  id_cajon_moto: DataTypes.INTEGER, // Null si es auto
  tiempo_estancia: DataTypes.STRING // Intervalo de Postgres
}, {
  tableName: 'accesos',
  timestamps: false
});

module.exports = Acceso;