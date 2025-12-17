const Usuario = require('./Usuario');
const Vehiculo = require('./Vehiculo');
const Pase = require('./Pase');
const Acceso = require('./Acceso');
const CajonMoto = require('./CajonMoto');
const Reporte = require('./Reporte');
const NotificacionPaseVencido = require('./NotificacionPaseVencido')

// Usuario <-> Vehiculo
Usuario.hasMany(Vehiculo, { foreignKey: 'id_usuario', as: 'vehiculos' });
Vehiculo.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

// Vehiculo <-> Pase
Vehiculo.hasMany(Pase, { foreignKey: 'id_vehiculo', as: 'pases' });
Pase.belongsTo(Vehiculo, { foreignKey: 'id_vehiculo', as: 'vehiculo' });

// Pase <-> Acceso
Pase.hasMany(Acceso, { foreignKey: 'id_pase', as: 'accesos' });
Acceso.belongsTo(Pase, { foreignKey: 'id_pase', as: 'pase' });

// CajonMoto <-> Acceso (Relación circular controlada)
CajonMoto.belongsTo(Acceso, { foreignKey: 'id_acceso_ocupante', as: 'ocupante' });
Acceso.belongsTo(CajonMoto, { foreignKey: 'id_cajon_moto', as: 'cajon' });

// Usuario <-> Reporte
Usuario.hasMany(Reporte, { foreignKey: 'id_usuario', as: 'reportes_enviados' });
Reporte.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

// Reporte atendido por Admin (Relación recursiva con Usuario)
Usuario.hasMany(Reporte, { foreignKey: 'id_admin_atendio', as: 'reportes_atendidos' });
Reporte.belongsTo(Usuario, { foreignKey: 'id_admin_atendio', as: 'admin' });

// Pase <-> Notificacion
Pase.hasMany(NotificacionPaseVencido, { foreignKey: 'id_pase', as: 'notificaciones' });
NotificacionPaseVencido.belongsTo(Pase, { foreignKey: 'id_pase', as: 'pase' });

module.exports = { Usuario, Vehiculo, Pase, Acceso, CajonMoto, Reporte, NotificacionPaseVencido };