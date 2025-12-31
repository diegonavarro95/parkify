// 1. IMPORTAR MODELOS
// (Nota: No les pasamos parámetros extra porque estos archivos ya importan 'sequelize' dentro)
const Usuario = require('./Usuario');
const Vehiculo = require('./Vehiculo');
const Pase = require('./Pase');
const Acceso = require('./Acceso');
const CajonMoto = require('./CajonMoto');
const Reporte = require('./Reporte');
const NotificacionPaseVencido = require('./NotificacionPaseVencido');
const Notificacion = require('./Notificacion'); // <--- CORRECCIÓN 1: Importación simple

// ==========================================
// 2. DEFINIR RELACIONES
// ==========================================

// --- Usuario <-> Vehiculo ---
Usuario.hasMany(Vehiculo, { foreignKey: 'id_usuario', as: 'vehiculos' });
Vehiculo.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

// --- Vehiculo <-> Pase ---
Vehiculo.hasMany(Pase, { foreignKey: 'id_vehiculo', as: 'pases' });
Pase.belongsTo(Vehiculo, { foreignKey: 'id_vehiculo', as: 'vehiculo' });

// --- Pase <-> Acceso ---
Pase.hasMany(Acceso, { foreignKey: 'id_pase', as: 'accesos' });
Acceso.belongsTo(Pase, { foreignKey: 'id_pase', as: 'pase' });

// --- CajonMoto <-> Acceso ---
CajonMoto.belongsTo(Acceso, { foreignKey: 'id_acceso_ocupante', as: 'ocupante' });
Acceso.belongsTo(CajonMoto, { foreignKey: 'id_cajon_moto', as: 'cajon' });

// --- Usuario <-> Reporte ---
Usuario.hasMany(Reporte, { foreignKey: 'id_usuario', as: 'reportes_enviados' });
Reporte.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

// --- Reporte <-> Admin (Quién atendió) ---
Usuario.hasMany(Reporte, { foreignKey: 'id_admin_atendio', as: 'reportes_atendidos' });
Reporte.belongsTo(Usuario, { foreignKey: 'id_admin_atendio', as: 'admin' });

// --- Pase <-> NotificacionPaseVencido ---
Pase.hasMany(NotificacionPaseVencido, { foreignKey: 'id_pase', as: 'notificaciones_vencimiento' });
NotificacionPaseVencido.belongsTo(Pase, { foreignKey: 'id_pase', as: 'pase' });

// --- Usuario <-> Notificacion (LA NUEVA PARA REPORTES) ---
// CORRECCIÓN 2: Usar las variables const definidas arriba, no 'db.'
Usuario.hasMany(Notificacion, { foreignKey: 'id_usuario', as: 'notificaciones' });
Notificacion.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

// 3. EXPORTAR TODOS
module.exports = { 
    Usuario, 
    Vehiculo, 
    Pase, 
    Acceso, 
    CajonMoto, 
    Reporte, 
    NotificacionPaseVencido,
    Notificacion // <--- CORRECCIÓN 3: Agregar al export
};