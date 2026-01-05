import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react'; // Agregué AlertTriangle para el mensaje
import toast from 'react-hot-toast'; 
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import img1 from '../../imgs/fondo1.jpg'; 
import img2 from '../../imgs/fondo2.jpg';
import img3 from '../../imgs/fondo3.jpg';

// Imágenes para el carrusel
const CAROUSEL_IMAGES = [img1, img2, img3];

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Estados para UI
  const [showPassword, setShowPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Lógica del Carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 5000); // Cambia cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/auth/login', data);
      login(response.data.usuario, response.data.token);
      toast.success(`Bienvenido, ${response.data.usuario.nombre_completo}`); 
      navigate('/'); 
    } catch (error) {
      console.error("Error Login:", error); // Para ver en consola
      
      // 👇 LÓGICA DE BLOQUEO (403)
      if (error.response && error.response.status === 403) {
          // Toast personalizado y persistente para usuario bloqueado
          toast.error(
            (t) => (
                <div className="flex flex-col gap-1" onClick={() => toast.dismiss(t.id)}>
                    <div className="flex items-center gap-2 font-bold text-base">
                        <AlertTriangle size={18} /> Acceso Denegado
                    </div>
                    <span className="text-sm leading-tight">
                        Tu cuenta se encuentra <span className="font-bold">bloqueada</span>.
                        <br/>
                        Por favor, contacta a un administrador.
                    </span>
                </div>
            ),
            { 
                duration: 6000, 
                style: { 
                    border: '2px solid #ef4444', 
                    background: '#FEF2F2',
                    color: '#991B1B'
                } 
            }
          );
      } else {
          // Error genérico (contraseña incorrecta, servidor caído, etc.)
          const msg = error.response?.data?.error || 'Error al iniciar sesión';
          toast.error(msg);
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-bg">
      
      {/* Lado Izquierdo: Formulario */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
                <img src="/parkify.png" alt="Logo" className="w-12 h-12 object-contain" />
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Parkify <span className="text-brand-600">ESCOM</span>
                </h2>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Gestión inteligente de estacionamiento
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="ejemplo@ipn.mx"
                icon={User}
                error={errors.email?.message}
                {...register("email", { 
                  required: "El correo es obligatorio",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Debe contener un @"
                  }
                })}
              />

              <div className="space-y-1 relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  icon={Lock}
                  error={errors.password?.message}
                  {...register("password", { required: "La contraseña es obligatoria" })}
                />
                {/* Botón de Ojo Flotante */}
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-slate-400 hover:text-brand-600 transition-colors"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>

                <div className="flex items-center justify-end pt-1">
                  <div className="text-sm">
                    <Link to="/recuperar-password" className="font-medium text-brand-600 hover:text-brand-500">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                isLoading={isSubmitting}
                icon={LogIn}
              >
                Iniciar Sesión
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Carrusel */}
      <div className="hidden lg:block relative w-0 flex-1 overflow-hidden bg-slate-900">
        {CAROUSEL_IMAGES.map((img, index) => (
            <img
                key={index}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
                src={img}
                alt={`Slide ${index}`}
            />
        ))}
        
        <div className="absolute inset-0 bg-brand-900/40 mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 p-12 text-white z-10">
          <blockquote className="font-medium text-2xl italic border-l-4 border-brand-500 pl-4">
            "La técnica al servicio de la patria"
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;