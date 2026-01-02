import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Tu import original
import { MENU_ITEMS } from '../../utils/menuItems'; // Tu import original (ajusta la ruta si es config)
import { LogOut, X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  // --- FILTRADO ESTRICTO ---
  // Si soy Admin, SOLO veo items con role 'admin_guardia'.
  // Si soy Usuario, SOLO veo items SIN role (undefined).
  const items = MENU_ITEMS.filter(item => {
    if (user?.rol === 'admin_guardia') {
      return item.role === 'admin_guardia';
    } else {
      return !item.role;
    }
  });

  return (
    <>
      {/* Overlay Oscuro (Fondo negro en celular) */}
      <div 
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Barra Lateral */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
        transform transition-transform duration-300 ease-in-out 
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        
        {/* Header del Sidebar CON LOGO */}
        <div className="flex items-center gap-3 h-20 px-6 border-b border-slate-100 dark:border-slate-800">
           {/* Imagen Logo (Desde carpeta public) */}
           <img src="/parkify.png" alt="Logo" className="w-10 h-10 object-contain" />
           
           <div className="flex flex-col">
             <span className="text-xl font-black text-brand-600 tracking-tighter leading-none">
               PARKIFY
             </span>
             <span className="text-xs font-bold text-slate-400 tracking-widest">ESCOM</span>
           </div>

           {/* Botón cerrar en móvil */}
           <button onClick={onClose} className="lg:hidden ml-auto text-slate-400 hover:text-slate-600">
             <X size={24} />
           </button>
        </div>

        {/* Navegación */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-140px)]">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose} // Cerrar al dar clic en móvil
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive 
                  ? "bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-900/20 dark:text-brand-400" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                }
              `}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer del Sidebar (Logout) */}
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="mb-3 px-2">
             <p className="text-sm font-bold text-slate-700 dark:text-white truncate">
                {user?.nombre_completo || 'Usuario'}
             </p>
             <p className="text-xs text-slate-500 capitalize">{user?.rol?.replace('_', ' ')}</p>
          </div>
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Salir
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;