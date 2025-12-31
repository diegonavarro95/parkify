import { LayoutDashboard, Car, QrCode, FileText, ShieldCheck, BarChart3, Bell, ScanLine } from 'lucide-react';

export const MENU_ITEMS = [
  // Menú para todos
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Mis Vehículos', path: '/mis-vehiculos', icon: Car },
  { label: 'Mis Pases', path: '/mis-pases', icon: QrCode },
  { label: 'Reportes', path: '/mis-reportes', icon: FileText },
  
  // Menú solo para Admins (Se filtra en el componente)
  { label: 'Escáner Guardia', path: '/admin/escaner', icon: ScanLine, role: 'admin_guardia' },
  { label: 'Accesos', path: '/admin/accesos', icon: ShieldCheck, role: 'admin_guardia' },
  { label: 'Mapa Motos', path: '/admin/mapa', icon: Car, role: 'admin_guardia' },
  { label: 'Estadísticas', path: '/admin/estadisticas', icon: BarChart3, role: 'admin_guardia' },
  { label: 'Notificaciones', path: '/admin/notificaciones', icon: Bell, role: 'admin_guardia' }
];