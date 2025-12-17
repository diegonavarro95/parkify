const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NotificacionPaseVencido = sequelize.define('NotificacionPaseVencido', {
  id_notificacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_pase: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha_hora_notificacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  revisada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  id_admin_reviso: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'notificaciones_pase_vencido',
  timestamps: false
});

module.exports = NotificacionPaseVencido;