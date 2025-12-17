import { Link } from 'react-router-dom';
import { Car, QrCode, Plus, History, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const Dashboard = () => {
  const { user } = useAuth();

  // Datos simulados (Mock) para ver el diseño antes de conectar la API
  const stats = {
    vehiculos: 1, // El usuario tiene 1 auto
    pasesActivos: 0,
    ultimoAcceso: 'Hoy, 08:30 AM'
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Encabezado de Bienvenida */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Hola, {user?.nombre_completo?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Resumen de tu actividad en Parkify
          </p>
        </div>
        
        {/* Acción Principal (Heurística: Flexibilidad y Eficiencia) */}
        <Link to="/mis-pases">
          <Button icon={QrCode}>
            Generar Pase Rápido
          </Button>
        </Link>
      </div>

      {/* 2. Tarjetas de Estado (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tarjeta: Vehículos */}
        <Card className="border-l-4 border-l-brand-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-50 rounded-lg text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
              <Car size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Mis Vehículos</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.vehiculos}</h3>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/mis-vehiculos" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              Ver detalles &rarr;
            </Link>
          </div>
        </Card>

        {/* Tarjeta: Pases Activos */}
        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <QrCode size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pases Activos</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pasesActivos}</h3>
            </div>
          </div>
          <div className="mt-4">
             {stats.pasesActivos > 0 ? (
                <span className="text-sm text-green-600 font-medium">Tienes acceso permitido</span>
             ) : (
                <span className="text-sm text-slate-400">Sin pases vigentes</span>
             )}
          </div>
        </Card>

        {/* Tarjeta: Estado General */}
        <Card className="border-l-4 border-l-orange-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Estatus Cuenta</p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                {user?.activo ? 'Activa' : 'Bloqueada'}
              </h3>
            </div>
          </div>
           <div className="mt-4">
            <span className="text-sm text-slate-500">
              Rol: <span className="capitalize">{user?.rol?.replace('_', ' ')}</span>
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Sección de Accesos Rápidos (Solo para usuarios vacíos) */}
      {stats.vehiculos === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">¡Empieza ahora!</h3>
                <p className="text-blue-700 dark:text-blue-300">Aún no has registrado ningún vehículo. Agrega uno para generar pases.</p>
            </div>
            <Link to="/mis-vehiculos">
                <Button variant="primary" size="sm" icon={Plus}>Registrar Auto</Button>
            </Link>
        </div>
      )}

      {/* 4. Historial Reciente (Placeholder) */}
      <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 mt-8">
        <History size={20} className="text-slate-400" />
        Actividad Reciente
      </h2>
      <Card className="p-0 overflow-hidden">
        <div className="p-8 text-center text-slate-500">
            <p>No hay actividad reciente para mostrar.</p>
        </div>
      </Card>

    </div>
  );
};

export default Dashboard;