import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, User, Phone, FileBadge } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const RegisterPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm();
  const navigate = useNavigate();

  // Validar que passwords coincidan
  const password = watch("password");

  const onSubmit = async (data) => {
    try {
      // Ajustar datos para el backend
      const payload = {
        ...data,
        rol: 'usuario' // Por defecto siempre usuario
      };

      await api.post('/auth/register', payload);
      toast.success('¡Registro exitoso! Ahora inicia sesión.');
      navigate('/login');
      
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Error al registrarse';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-dark-card p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Crear Cuenta</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Únete a Parkify ESCOM
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            
            <Input
              label="Nombre Completo"
              placeholder="Juan Pérez"
              icon={User}
              error={errors.nombre_completo?.message}
              {...register("nombre_completo", { required: "El nombre es requerido" })}
            />

            <Input
              label="Correo Institucional / Personal"
              type="email"
              placeholder="alumno@ipn.mx"
              icon={Mail}
              error={errors.email?.message}
              {...register("email", { 
                required: "Correo requerido",
                pattern: { value: /^\S+@\S+$/i, message: "Correo inválido" }
              })}
            />

            <div className="grid grid-cols-2 gap-4">
                <Input
                label="CURP"
                placeholder="AAAA000000..."
                icon={FileBadge}
                className="uppercase"
                error={errors.curp?.message}
                {...register("curp", { 
                    required: "CURP requerida",
                    minLength: { value: 18, message: "Deben ser 18 caracteres" },
                    maxLength: { value: 18, message: "Deben ser 18 caracteres" }
                })}
                />
                
                <div className="w-full">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Tipo de Usuario
                    </label>
                    <select 
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:bg-dark-card dark:border-slate-600 dark:text-white"
                        {...register("tipo_usuario", { required: true })}
                    >
                        <option value="comunidad_escom">Comunidad ESCOM</option>
                        <option value="visitante">Visitante</option>
                    </select>
                </div>
            </div>

            <Input
              label="Teléfono"
              placeholder="55 1234 5678"
              icon={Phone}
              error={errors.telefono?.message}
              {...register("telefono")}
            />

            <div className="grid grid-cols-2 gap-4">
                <Input
                label="Contraseña"
                type="password"
                error={errors.password?.message}
                {...register("password", { 
                    required: "Requerida",
                    minLength: { value: 6, message: "Mínimo 6 caracteres" }
                })}
                />
                
                <Input
                label="Confirmar"
                type="password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword", { 
                    validate: value => value === password || "Las contraseñas no coinciden"
                })}
                />
            </div>

          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting} icon={UserPlus}>
            Registrarse
          </Button>

          <div className="text-center text-sm">
            <span className="text-slate-600 dark:text-slate-400">¿Ya tienes cuenta? </span>
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500">
              Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;