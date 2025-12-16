# Parkify - Sistema de Gestión de Estacionamiento ESCOM

Plataforma web integral para la gestión digital del estacionamiento de la Escuela Superior de Cómputo (ESCOM). Permite el registro diferenciado de usuarios (comunidad ESCOM y visitantes), generación de pases temporales con QR, control de accesos, mapeo visual del estacionamiento de motocicletas, sistema de reportes y estadísticas operativas.

## Tabla de Contenidos

- [Características Principales](#características-principales)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Scripts Disponibles](#scripts-disponibles)
- [Variables de Entorno](#variables-de-entorno)
- [Documentación](#documentación)
- [Contribución](#contribución)

## Características Principales

### Para Usuarios
- Registro diferenciado (Comunidad ESCOM / Visitantes)
- Gestión de hasta 2 vehículos por usuario
- Generación de pases digitales con QR (vigencia: 3 días o 24 horas)
- Envío automático de pases por correo electrónico
- Sistema de reportes para comunicar incidencias
- Consulta de historial personal de accesos

### Para Administradores/Guardias
- Validación de acceso por placas, folio, CURP o escaneo de QR
- Registro rápido de entradas y salidas
- Mapeo visual en tiempo real del estacionamiento de motocicletas
- Notificaciones de pases vencidos con vehículo dentro
- Gestión completa de usuarios y vehículos
- Dashboard con estadísticas operativas
- Atención y seguimiento de reportes

## Tecnologías

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Base de Datos:** PostgreSQL (Supabase)
- **Autenticación:** JWT (jsonwebtoken)
- **Seguridad:** bcrypt, helmet, cors
- **Generación de PDFs:** pdfkit
- **Generación de QR:** qrcode
- **Envío de correos:** nodemailer (SendGrid)
- **Almacenamiento:** Supabase Storage

### Frontend
- **Librería:** React 18+
- **Enrutamiento:** React Router DOM
- **Cliente HTTP:** Axios
- **Estilos:** Tailwind CSS
- **Formularios:** React Hook Form
- **Gestión de estado:** React Query + Context API
- **QR Scanner:** html5-qrcode
- **Gráficas:** Recharts

### Herramientas de Desarrollo
- **Control de versiones:** Git
- **Linter:** ESLint
- **Formatter:** Prettier
- **Testing:** Jest + React Testing Library

## Requisitos Previos

- Node.js 18+ y npm 9+
- Cuenta de Supabase 
- Git

## Instalación

### Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/parkify.git
cd parkify
```

### Instalar dependencias

Nota: instalar todas las dependecias fuera del proyecto en la carpeta github local no dentro de las carpetas del proyecto. Asi se ahora espacio. Solo instalar las dependencias necesarias no instalar todos los modulos existentes. 

```bash
npm install NombreDeLaDependencia
```

### Configurar variables de entorno

Archivos `.env` en ambas carpetas

#### Backend `.env`
```env
PORT=5000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# JWT
JWT_SECRET=tu-secreto-super-seguro-aqui
JWT_EXPIRES_IN=24h

# Correo (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-correo@gmail.com
SMTP_PASS=tu-contraseña-de-aplicacion

# URLs
FRONTEND_URL=http://localhost:5173
```

#### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## Estructura del Proyecto
```
parkify/
├── backend/               # Servidor Node.js + Express
│   ├── src/
│   │   ├── config/       # Configuraciones (DB, Supabase, correo)
│   │   ├── controllers/  # Controladores de rutas
│   │   ├── middlewares/  # Middlewares (auth, validación)
│   │   ├── models/       # Modelos
│   │   ├── routes/       # Definición de rutas
│   │   ├── services/     # Lógica de negocio
│   │   ├── utils/        # Utilidades (QR, PDF, validaciones)
│   │   ├── app.js        # Configuración de Express
│   │   └── server.js     # Punto de entrada
│   ├── .env
│   ├── package.json
│   └── README.md
│
├── frontend/              # Aplicación React
│   ├── public/
│   ├── src/
│   │   ├── api/          # Servicios de API (axios)
│   │   ├── components/   # Componentes React
│   │   ├── context/      # Context API (estado global)
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Páginas/vistas principales
│   │   ├── utils/        # Utilidades frontend
│   │   ├── App.jsx       # Componente raíz
│   │   └── main.jsx      # Punto de entrada
│   ├── .env
│   ├── package.json
│   ├── tailwind.config.js
│   └── README.md
│
├── docs/                  # Documentación adicional
│   ├── api/              # Documentación de API
│   ├── database/         # Diagramas de BD
│
├── .gitignore
└── README.md             # Este archivo
```

## Scripts Disponibles

### Backend
```bash
# Desarrollo (con hot-reload)
npm run dev

# Producción
npm start


# Linting
npm run lint
npm run lint:fix

# Testing
npm test
npm run test:watch
```

### Frontend
```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
npm run lint:fix

# Testing
npm test
```

## Variables de Entorno

### Backend (`.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `5000` |
| `NODE_ENV` | Entorno de ejecución | `development` / `production` |
| `SUPABASE_URL` | URL del proyecto Supabase | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | API Key anon de Supabase | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | `eyJhbGc...` |
| `JWT_SECRET` | Secreto para firmar JWT | `mi-secreto-super-seguro` |
| `JWT_EXPIRES_IN` | Tiempo de expiración JWT | `24h` |
| `SMTP_HOST` | Host del servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_USER` | Usuario SMTP | `correo@gmail.com` |
| `SMTP_PASS` | Contraseña SMTP | `contraseña-app` |
| `FRONTEND_URL` | URL del frontend | `http://localhost:5173` |

### Frontend (`.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base de la API | `http://localhost:5000/api` |
| `VITE_SUPABASE_URL` | URL de Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anon key de Supabase | `eyJhbGc...` |

## Documentación

- **API REST:** Ver [docs/api/README.md](docs/api/README.md)
- **Base de Datos:** Ver [docs/database/diagrama-er.md](docs/database/diagrama-er.md)

## Contribución

1. Fork del proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

Desarrollado para la comunidad de ESCOM