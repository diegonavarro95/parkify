const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehiculo = sequelize.define('Vehiculo', {
  id_vehiculo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_usuario: {
    type: DataTypes.UUID,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('automovil', 'motocicleta'),
    allowNull: false
  },
  marca: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  modelo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  placas: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
    // El trigger en BD se encarga de hacerlas mayúsculas
  },
  foto_documento_validacion: {
    type: DataTypes.TEXT, // Aquí guardaremos la URL de Supabase
    allowNull: true
  },
  numero_boleta: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  rfc: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  fecha_registro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'vehiculos',
  timestamps: false
});

module.exports = Vehiculo;