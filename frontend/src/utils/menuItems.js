import { LayoutDashboard, Car, QrCode, FileText, ShieldCheck, BarChart3, Bell, ScanLine, MapPin } from 'lucide-react';

export const MENU_ITEMS = [
  // --- MENÚ USUARIO (Sin rol específico) ---
  { label: 'Dashboard', path: '/usuario/dashboard', icon: LayoutDashboard },
  { label: 'Mis Vehículos', path: '/mis-vehiculos', icon: Car },
  { label: 'Mis Pases', path: '/mis-pases', icon: QrCode },
  { label: 'Reportes', path: '/mis-reportes', icon: FileText },
  
  // --- MENÚ ADMIN (Con role: 'admin_guardia') ---
  { label: 'Estadísticas', path: '/admin/estadisticas', icon: BarChart3, role: 'admin_guardia' },
  { label: 'Escáner Guardia', path: '/admin/escaner', icon: ScanLine, role: 'admin_guardia' },
  { label: 'Accesos', path: '/admin/accesos', icon: ShieldCheck, role: 'admin_guardia' },
  { label: 'Mapa Motos', path: '/admin/mapa', icon: MapPin, role: 'admin_guardia' },
  { label: 'Gestión Reportes', path: '/admin/reportes', icon: FileText, role: 'admin_guardia' },
  { label: 'Notificaciones', path: '/admin/notificaciones', icon: Bell, role: 'admin_guardia' }
];