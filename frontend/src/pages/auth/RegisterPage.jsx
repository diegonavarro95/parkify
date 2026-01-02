import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, User, Phone, FileBadge, Upload, Eye, EyeOff, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const RegisterPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm();
  const navigate = useNavigate();
  
  // Estados para ver contraseña
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const password = watch("password");

  const onSubmit = async (data) => {
    try {
      // Crear FormData para enviar Archivo + Texto
      const formData = new FormData();
      formData.append('nombre_completo', data.nombre_completo);
      formData.append('email', data.email);
      formData.append('curp', data.curp);
      formData.append('tipo_usuario', data.tipo_usuario);
      formData.append('telefono', data.telefono);
      formData.append('password', data.password);
      formData.append('rol', 'usuario'); // Por defecto

      // Adjuntar archivo (si existe)
      if (data.documento && data.documento[0]) {
          formData.append('documento_validacion', data.documento[0]);
      } else {
          toast.error("Debes subir tu documento de identificación para continuar.");
          return;
      }

      // IMPORTANTE: El backend debe estar preparado para recibir 'multipart/form-data'
      await api.post('/auth/register', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('¡Registro exitoso! Por favor inicia sesión.');
      navigate('/login');
      
    } catch (error) {
      console.error(error);
      // Extraemos el mensaje de error exacto que viene del backend
      const msg = error.response?.data?.error || error.response?.data?.message || 'Ocurrió un error al registrarse.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white dark:bg-dark-card p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
        
        <div className="text-center">
          <div className="flex justify-center mb-4">
             <img src="/parkify.png" alt="Logo" className="w-16 h-16 object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Crear Cuenta</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Únete a la comunidad Parkify ESCOM
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            
            {/* NOMBRE: 3 Palabras mínimo */}
            <Input
              label="Nombre Completo (Con Apellidos)"
              placeholder="Diego Navarro Arellano"
              icon={User}
              error={errors.nombre_completo?.message}
              {...register("nombre_completo", { 
                  required: "El nombre es requerido",
                  validate: (value) => {
                      const words = value.trim().split(/\s+/);
                      return words.length >= 3 || "Ingresa tu nombre y dos apellidos (Mínimo 3 palabras)";
                  }
              })}
            />

            <Input
              label="Correo Institucional / Personal"
              type="email"
              placeholder="alumno@ipn.mx"
              icon={Mail}
              error={errors.email?.message}
              {...register("email", { 
                required: "El correo es obligatorio",
                pattern: { 
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
                    message: "Ingresa un correo válido (debe contener @)" 
                }
              })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                label="CURP"
                placeholder="AAAA000000..."
                icon={FileBadge}
                className="uppercase"
                maxLength={18}
                error={errors.curp?.message}
                {...register("curp", { 
                    required: "La CURP es requerida",
                    minLength: { value: 18, message: "La CURP debe tener 18 caracteres" },
                    maxLength: { value: 18, message: "La CURP debe tener 18 caracteres" },
                    pattern: {
                        // Regex E.R.1 proporcionada
                        value: /^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/,
                        message: "Formato de CURP inválido, verifica tus datos"
                    }
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

            {/* TELÉFONO ESTRICTO (10 Dígitos) */}
            <Input
              label="Teléfono Móvil"
              placeholder="5512345678"
              type="tel" // Abre teclado numérico en celular
              icon={Phone}
              maxLength={10}
              error={errors.telefono?.message}
              {...register("telefono", { 
                  required: "El teléfono es obligatorio",
                  pattern: {
                      value: /^[0-9]{10}$/,
                      message: "El teléfono debe ser de exactamente 10 números"
                  }
              })}
            />
            
            {/* DOCUMENTO DE VALIDACIÓN */}
            <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                    <Upload size={16}/> Documento de Validación (INE/Credencial)
                </label>
                <input 
                    type="file" 
                    accept="image/*,.pdf"
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-slate-700 dark:file:text-white"
                    {...register("documento", { required: "Debes subir tu identificación" })}
                />
                {errors.documento && <p className="text-red-500 text-xs mt-1 font-medium">{errors.documento.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <Input
                        label="Contraseña"
                        type={showPass ? "text" : "password"}
                        icon={Lock}
                        error={errors.password?.message}
                        {...register("password", { 
                            required: "Contraseña requerida",
                            minLength: { value: 6, message: "Mínimo 6 caracteres" }
                        })}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-[34px] text-slate-400 hover:text-brand-600">
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                
                <div className="relative">
                    <Input
                        label="Confirmar Contraseña"
                        type={showConfirm ? "text" : "password"}
                        icon={Lock}
                        error={errors.confirmPassword?.message}
                        {...register("confirmPassword", { 
                            validate: value => value === password || "Las contraseñas no coinciden"
                        })}
                    />
                     <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-[34px] text-slate-400 hover:text-brand-600">
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
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