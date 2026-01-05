import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom'; // 1. Importamos createPortal
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Bloquear el scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Si no está abierto o el componente no se ha montado, no renderizamos nada
  if (!isOpen || !mounted) return null;

  // 2. Usamos createPortal para "sacar" el modal del Layout y ponerlo en el body
  return createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
      style={{ zIndex: 9999 }} // Z-index máximo garantizado
    >
      
      {/* Overlay (Fondo Negro) */}
      <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Contenido del Modal */}
      {/* z-index relative para estar encima del overlay */}
      <div className="relative w-full max-w-lg bg-white dark:bg-dark-card rounded-2xl shadow-2xl transform transition-all animate-scale-in flex flex-col max-h-[90vh] z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body (Con Scroll interno si el contenido es largo) */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>

      </div>
    </div>,
    document.body // 3. El destino del Portal es el <body>
  );
};

export default Modal;