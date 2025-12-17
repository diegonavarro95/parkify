import { Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const Button = ({ 
  children, 
  variant = 'primary', // primary (10% acento), secondary (30%), outline, danger
  size = 'md', 
  isLoading = false, 
  className, 
  disabled,
  ...props 
}) => {
  
  // Clases base (Consistencia)
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

  // Variantes de color (Regla 60-30-10)
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 shadow-lg shadow-brand-500/30", // El 10% que llama la atención
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-brand-600 focus:ring-slate-200 dark:bg-dark-card dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
    outline: "border-2 border-brand-500 text-brand-600 hover:bg-brand-50 focus:ring-brand-500 dark:text-brand-400 dark:border-brand-400 dark:hover:bg-brand-900/20",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-md shadow-red-500/20",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "p-2" // Para botones que son solo icono
  };

  return (
    <button 
      className={twMerge(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;