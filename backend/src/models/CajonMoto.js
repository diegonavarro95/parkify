const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CajonMoto = sequelize.define('CajonMoto', {
  id_cajon: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true 
  },
  identificador: {
    type: DataTypes.STRING(10), // Ej: "A-01"
    allowNull: false,
    unique: true
  },
  zona: DataTypes.STRING(5),
  fila: DataTypes.INTEGER,
  columna: DataTypes.INTEGER,
  estado: {
    type: DataTypes.ENUM('disponible', 'ocupado', 'mantenimiento'),
    defaultValue: 'disponible'
  },
  id_acceso_ocupante: DataTypes.INTEGER // FK temporal
}, {
  tableName: 'cajones_motos',
  timestamps: false
});

module.exports = CajonMoto;