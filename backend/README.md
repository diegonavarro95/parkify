# Parkify Backend

API REST construida con Node.js y Express para el sistema de gestión de estacionamiento Parkify.

## Estructura del Proyecto
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Configuración de Sequelize
│   │   ├── supabase.js          # Cliente de Supabase
│   │   └── email.js             # Configuración de Nodemailer
│   │
│   ├── controllers/
│   │   ├── authController.js    # Autenticación (login, register, reset password)
│   │   ├── usuarioController.js # Gestión de usuarios
│   │   ├── vehiculoController.js# Gestión de vehículos
│   │   ├── paseController.js    # Generación y gestión de pases
│   │   ├── accesoController.js  # Control de acceso (entrada/salida)
│   │   ├── cajonController.js   # Mapeo de cajones de motos
│   │   ├── reporteController.js # Sistema de reportes
│   │   ├── estadisticaController.js # Dashboard de estadísticas
│   │   └── notificacionController.js # Notificaciones de pases vencidos
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js    # Verificación de JWT
│   │   ├── roleMiddleware.js    # Verificación de roles
│   │   ├── validationMiddleware.js # Validación de datos
│   │   ├── errorMiddleware.js   # Manejo de errores global
│   │   ├── rateLimitMiddleware.js # Rate limiting
│   │   └── uploadMiddleware.js  # Manejo de carga de archivos
│   │
│   ├── models/
│   │   ├── index.js             # Inicialización de Sequelize y modelos
│   │   ├── Usuario.js           # Modelo de usuario
│   │   ├── Vehiculo.js          # Modelo de vehículo
│   │   ├── Pase.js              # Modelo de pase
│   │   ├── Acceso.js            # Modelo de acceso
│   │   ├── CajonMoto.js         # Modelo de cajón de moto
│   │   ├── Reporte.js           # Modelo de reporte
│   │   ├── NotificacionPaseVencido.js
│   │   └── LogAuditoria.js      # Modelo de log de auditoría
│   │
│   ├── routes/
│   │   ├── index.js             # Enrutador principal
│   │   ├── authRoutes.js        # Rutas de autenticación
│   │   ├── usuarioRoutes.js     # Rutas de usuarios
│   │   ├── vehiculoRoutes.js    # Rutas de vehículos
│   │   ├── paseRoutes.js        # Rutas de pases
│   │   ├── accesoRoutes.js      # Rutas de control de acceso
│   │   ├── cajonRoutes.js       # Rutas de cajones
│   │   ├── reporteRoutes.js     # Rutas de reportes
│   │   ├── estadisticaRoutes.js # Rutas de estadísticas
│   │   └── adminRoutes.js       # Rutas administrativas
│   │
│   ├── services/
│   │   ├── authService.js       # Lógica de autenticación
│   │   ├── usuarioService.js    # Lógica de usuarios
│   │   ├── vehiculoService.js   # Lógica de vehículos
│   │   ├── paseService.js       # Lógica de pases
│   │   ├── accesoService.js     # Lógica de control de acceso
│   │   ├── cajonService.js      # Lógica de cajones
│   │   ├── reporteService.js    # Lógica de reportes
│   │   ├── notificacionService.js # Lógica de notificaciones
│   │   ├── emailService.js      # Envío de correos
│   │   ├── qrService.js         # Generación de QR
│   │   ├── pdfService.js        # Generación de PDF
│   │   └── storageService.js    # Interacción con Supabase Storage
│   │
│   ├── utils/
│   │   ├── validators.js        # Validadores personalizados (CURP, placas, etc.)
│   │   ├── helpers.js           # Funciones auxiliares
│   │   ├── constants.js         # Constantes del sistema
│   │   ├── logger.js            # Winston logger
│   │   └── cronJobs.js          # Tareas programadas (cron)
│   │
│   ├── app.js                   # Configuración de Express
│   └── server.js                # Punto de entrada del servidor
│
├── migrations/                  # Migraciones de Sequelize
├── seeders/                     # Seeds para datos de prueba
├── tests/                       # Pruebas unitarias e integración
│   ├── unit/
│   └── integration/
│
├── .env                         # Variables de entorno (NO subir a Git)
├── .env.example                 # Ejemplo de variables de entorno
├── .eslintrc.js                 # Configuración de ESLint
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
## Descripción de Carpetas y Archivos

### `/src/config/`
Configuraciones globales del sistema.
Configuración de Sequelize para PostgreSQL

*supabase.js: Cliente de Supabase (para Storage)
*email.js: Configuración de Nodemailer (SMTP)

### `/src/controllers/`
Controladores que reciben las peticiones HTTP y responden.

*Reciben datos del request (body, params, query)
*Llaman a servicios para lógica de negocio
*Retornan respuestas HTTP (200, 201, 400, 500, etc.)
*Manejo de errores mediante try-catch

### `/src/middlewares/`
Funciones que se ejecutan antes/durante el procesamiento de peticiones.

*authMiddleware.js: Verifica token JWT válido
*roleMiddleware.js: Verifica rol del usuario (admin/usuario)
*validationMiddleware.js: Valida datos de entrada (express-validator)
*errorMiddleware.js: Manejo global de errores
*rateLimitMiddleware.js: Limita número de peticiones por IP
*uploadMiddleware.js: Manejo de carga de archivos con Multer

### `/src/models/`
Modelos de Sequelize que representan tablas en PostgreSQL.

*Definen estructura de cada tabla
*Relaciones entre modelos (hasMany, belongsTo, etc.)
*Validaciones a nivel de modelo
*Hooks (beforeCreate, afterUpdate, etc.)

### `/src/routes/`
Definición de endpoints de la API.

*Asocian rutas HTTP con controladores
*Aplican middlewares específicos por ruta
*Organizadas por recurso/funcionalidad

### `/src/services/`
Lógica de negocio del sistema.

*Procesan datos antes de guardar en BD
*Interactúan con múltiples modelos
*Contienen algoritmos y cálculos complejos
*Separación de responsabilidades (no mezclar con controladores)

### `/src/utils/`
Funciones auxiliares y utilidades generales.

*validators.js: Validación de CURP, placas, RFC, etc.
*helpers.js: Funciones de ayuda (formateo de fechas, cálculos, etc.)
*constants.js: Constantes del sistema (roles, estados, etc.)
*logger.js: Logger con Winston (logs estructurados)
*cronJobs.js: Tareas programadas (verificar pases vencidos, etc.)
