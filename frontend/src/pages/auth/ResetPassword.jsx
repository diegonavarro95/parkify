import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ResetPassword = () => {
  const { token } = useParams(); // Obtenemos el token de la URL
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm();
  
  const [showPass, setShowPass] = useState(false);
  const password = watch("newPassword");

  const onSubmit = async (data) => {
    try {
      await api.post(`/auth/reset-password/${token}`, { password: data.newPassword });
      toast.success('¡Contraseña actualizada exitosamente!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'El enlace ha expirado o es inválido');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg px-4">
      <div className="max-w-md w-full bg-white dark:bg-dark-card p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Nueva Contraseña</h2>
           <p className="mt-2 text-sm text-slate-600">Crea una contraseña segura para tu cuenta.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
           <div className="relative">
                <Input
                    label="Nueva Contraseña"
                    type={showPass ? "text" : "password"}
                    icon={Lock}
                    error={errors.newPassword?.message}
                    {...register("newPassword", { 
                        required: "Requerida", 
                        minLength: { value: 6, message: "Mínimo 6 caracteres" } 
                    })}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-[34px] text-slate-400">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
           </div>

           <Input
                label="Confirmar Contraseña"
                type="password"
                icon={Lock}
                error={errors.confirmPassword?.message}
                {...register("confirmPassword", { 
                    validate: value => value === password || "No coinciden"
                })}
            />

           <Button type="submit" className="w-full" isLoading={isSubmitting} icon={CheckCircle}>
                Restablecer Contraseña
           </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;