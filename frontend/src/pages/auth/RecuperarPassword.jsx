import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const RecuperarPassword = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/forgot-password', data);
      toast.success('Correo enviado. Revisa tu bandeja de entrada.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al enviar solicitud');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg px-4">
      <div className="max-w-md w-full bg-white dark:bg-dark-card p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
        <div className="text-center">
          <div className="flex justify-center mb-4">
             <img src="/parkify.png" alt="Logo" className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recuperar Contraseña</h2>
          <p className="mt-2 text-sm text-slate-600">
            Ingresa tu correo y te enviaremos las instrucciones.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Correo Electrónico"
            type="email"
            icon={Mail}
            error={errors.email?.message}
            {...register("email", { required: "El correo es obligatorio" })}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting} icon={Send}>
            Enviar Enlace de Recuperación
          </Button>

          <div className="text-center">
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
              <ArrowLeft size={16} /> Regresar al Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecuperarPassword;