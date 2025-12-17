import { Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white dark:bg-dark-card border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
      
      {/* Botón Hamburguesa (Solo Móvil) */}
      <button 
        onClick={onMenuClick}
        className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
      >
        <Menu size={24} />
      </button>

      {/* Info Usuario (Derecha) */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {user?.nombre || 'Usuario'}
          </p>
          <p className="text-xs text-slate-500 capitalize">
            {user?.rol?.replace('_', ' ') || 'Invitado'}
          </p>
        </div>
        <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
          <User size={18} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;