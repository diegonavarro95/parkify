import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User, Lock } from 'lucide-react';
import toast from 'react-hot-toast'; // Feedback inmediato
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      // 1. Petición al Backend
      const response = await api.post('/auth/login', data);
      
      // 2. Guardar sesión
      login(response.data.usuario, response.data.token);
      
      // 3. Feedback y Redirección
      toast.success(`Bienvenido, ${response.data.usuario.nombre}`);
      navigate('/'); 
      
    } catch (error) {
      // Manejo de errores (Heurística: Mensajes claros)
      console.error(error);
      const msg = error.response?.data?.error || 'Error al iniciar sesión';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-bg">
      
      {/* Lado Izquierdo: Formulario */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          
          <div className="mb-10">
            <h2 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white">
              Parkify <span className="text-brand-600">ESCOM</span>
            </h2>
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
                    message: "Correo inválido"
                  }
                })}
              />

              <div className="space-y-1">
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="••••••••"
                  icon={Lock}
                  error={errors.password?.message}
                  {...register("password", { required: "La contraseña es obligatoria" })}
                />
                <div className="flex items-center justify-end">
                  <div className="text-sm">
                    <a href="#" className="font-medium text-brand-600 hover:text-brand-500">
                      ¿Olvidaste tu contraseña?
                    </a>
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

      {/* Lado Derecho: Imagen Decorativa (Oculto en móvil) */}
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1590674899505-1c5c412719a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
          alt="Estacionamiento moderno"
        />
        <div className="absolute inset-0 bg-brand-900/40 mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 p-12 text-white">
          <blockquote className="font-medium text-xl">
            "La tecnología al servicio de la comunidad politécnica."
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;