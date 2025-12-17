import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MENU_ITEMS } from '../../utils/menuItems';
import { LogOut, X } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  // Filtrar menú según rol
  const items = MENU_ITEMS.filter(item => !item.role || item.role === user?.rol);

  return (
    <>
      {/* Overlay para móvil (Fondo oscuro al abrir menú) */}
      <div 
        className={clsx(
          "fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Barra Lateral */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-dark-card border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* Header del Sidebar */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100 dark:border-slate-700">
          <span className="text-xl font-bold text-brand-600 dark:text-brand-400 tracking-tight">
            Parkify <span className="text-slate-900 dark:text-white">ESCOM</span>
          </span>
          <button onClick={onClose} className="lg:hidden p-1 text-slate-500 hover:bg-slate-100 rounded-md">
            <X size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="p-4 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()} // Cerrar menú en móvil al hacer clic
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                isActive 
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400" // Activo (30%)
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer del Sidebar (Logout) */}
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 dark:border-slate-700">
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;