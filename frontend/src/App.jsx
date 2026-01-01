import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import { SocketProvider } from './context/SocketContext';

// Importar páginas reales
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/user/Dashboard';
import MisVehiculos from './pages/vehiculos/MisVehiculos'; 
import MisPases from './pages/pases/MisPases';
import Escaner from './pages/admin/Escaner';
import MisReportes from './pages/reportes/MisReportes';
import Notificaciones from './pages/admin/Notificaciones';
import GestionReportes from './pages/admin/GestionReportes';
import Accesos from './pages/admin/HistorialAccesos';
import MapaMotos from './pages/admin/MapaMotos';
import Estadisticas from './pages/admin/Estadisticas';

// Componente para proteger rutas privadas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return (
    <div className="flex justify-center items-center h-screen text-brand-600">
      Cargando...
    </div>
  );
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
      <BrowserRouter>
        {/* Configuración de las notificaciones */}
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rutas Privadas (Dentro del Layout) */}
          <Route path="/" element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }>
            {/* Dashboard Principal */}
            <Route index element={<Dashboard />} />
            
            {/* Módulo de Vehículos */}
            <Route path="mis-vehiculos" element={<MisVehiculos />} />
            
            {/* Módulo de Pases */}
            <Route path="mis-pases" element={<MisPases />} />
            {/* Módulo de Reportes */}
            <Route path="mis-reportes" element={<MisReportes />} />
            {/* --- RUTAS DE ADMINISTRACIÓN / GUARDIA --- */}
            <Route path="admin/escaner" element={<Escaner/>} />
            <Route path="admin/notificaciones" element={<Notificaciones/>} />
            <Route path="admin/reportes" element={<GestionReportes/>} />
            <Route path="admin/accesos" element={<Accesos/>} />
            <Route path="admin/mapa" element={<MapaMotos/>} />
            <Route path="admin/estadisticas" element={<Estadisticas/>} />
          </Route>

          {/* Manejo de 404 - Redirigir al inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;