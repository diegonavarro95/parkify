import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, Users, Car, FileText, AlertTriangle, 
  ArrowRight, Search, PieChart as PieIcon, TrendingUp 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { getResumenStats, getGraficaStats, getDetalleUsuarios, getDetallePases } from '../../api/estadisticas';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

const Estadisticas = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [graficaData, setGraficaData] = useState([]);
  const [rangoGrafica, setRangoGrafica] = useState('7dias');

  // Estados de Modales y sus datos
  const [modalUsuarios, setModalUsuarios] = useState({ open: false, data: [], search: '' });
  const [modalPases, setModalPases] = useState({ open: false, data: [], search: '' });

  // Colores para gráficas
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    cargarDatosGenerales();
  }, []);

  useEffect(() => {
    cargarGrafica();
  }, [rangoGrafica]);

  const cargarDatosGenerales = async () => {
    try {
      const data = await getResumenStats();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const cargarGrafica = async () => {
    const data = await getGraficaStats(rangoGrafica);
    setGraficaData(data);
  };

  const abrirUsuarios = async () => {
    const data = await getDetalleUsuarios();
    setModalUsuarios({ open: true, data, search: '' });
  };

  const abrirPases = async () => {
    const data = await getDetallePases();
    setModalPases({ open: true, data, search: '' });
  };

  // Helper para filtrar tablas
  const filtrarData = (lista, busqueda, campos) => {
    if (!busqueda) return lista;
    return lista.filter(item => 
      campos.some(campo => item[campo]?.toString().toLowerCase().includes(busqueda.toLowerCase()))
    );
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando tablero de control...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8">
      
      {/* 1. Header */}
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <TrendingUp className="text-brand-600" />
             Dashboard Estadístico
           </h1>
           <p className="text-slate-500">Métricas clave y rendimiento del sistema en tiempo real.</p>
        </div>
      </div>

      {/* 2. Tarjetas KPI (Indicadores Clave) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Usuarios */}
          <div onClick={abrirUsuarios} className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-slate-500 text-sm font-medium uppercase">Usuarios Totales</p>
                   <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.usuarios.total}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                   <Users size={24} />
                </div>
             </div>
             <div className="mt-4 flex gap-2 text-xs font-bold">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">🎓 {stats.usuarios.comunidad} Comunidad</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">👤 {stats.usuarios.visitantes} Visitas</span>
             </div>
          </div>

          {/* Vehículos */}
          <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-slate-500 text-sm font-medium uppercase">Parque Vehicular</p>
                   <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.vehiculos.total}</h3>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                   <Car size={24} />
                </div>
             </div>
             <div className="mt-4 flex gap-2 text-xs font-bold">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">🚗 {stats.vehiculos.autos} Autos</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">🏍️ {stats.vehiculos.motos} Motos</span>
             </div>
          </div>

          {/* Pases */}
          <div onClick={abrirPases} className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-slate-500 text-sm font-medium uppercase">Pases Activos</p>
                   <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.pases.activos}</h3>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                   <FileText size={24} />
                </div>
             </div>
             <div className="mt-4 text-xs font-bold text-red-500 flex items-center gap-1">
                <AlertTriangle size={12} /> {stats.pases.vencidos} Vencidos (Histórico)
             </div>
          </div>

          {/* Reportes */}
          <div onClick={() => navigate('/admin/reportes')} className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-slate-500 text-sm font-medium uppercase">Reportes Nuevos</p>
                   <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.reportes.pendientes}</h3>
                </div>
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                   <AlertTriangle size={24} />
                </div>
             </div>
             <div className="mt-4 text-xs font-bold text-slate-400 flex items-center gap-1">
                Ver bandeja de entrada <ArrowRight size={12}/>
             </div>
          </div>
      </div>

      {/* 3. Gráficas Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Gráfica de Área (Accesos) */}
          <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                    <BarChart3 size={20} className="text-brand-600"/> Flujo de Accesos
                </h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setRangoGrafica('7dias')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${rangoGrafica === '7dias' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >7 Días</button>
                    <button 
                        onClick={() => setRangoGrafica('30dias')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${rangoGrafica === '30dias' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >30 Días</button>
                </div>
             </div>
             
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={graficaData}>
                        <defs>
                            <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorSalidas" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="fecha" tick={{fontSize: 12}} stroke="#94A3B8" />
                        <YAxis tick={{fontSize: 12}} stroke="#94A3B8"/>
                        <Tooltip contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Area type="monotone" dataKey="entradas" stroke="#10B981" fillOpacity={1} fill="url(#colorEntradas)" name="Entradas" />
                        <Area type="monotone" dataKey="salidas" stroke="#F59E0B" fillOpacity={1} fill="url(#colorSalidas)" name="Salidas" />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Gráfica de Pastel (Distribución Usuarios) */}
          <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
             <h3 className="font-bold text-lg mb-4 dark:text-white flex items-center gap-2 w-full">
                 <PieIcon size={20} className="text-purple-600"/> Composición
             </h3>
             <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                            data={[
                                { name: 'Comunidad', value: parseInt(stats.usuarios.comunidad) },
                                { name: 'Visitantes', value: parseInt(stats.usuarios.visitantes) },
                                { name: 'Staff', value: parseInt(stats.usuarios.admins) },
                            ]}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {COLORS.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                     </PieChart>
                 </ResponsiveContainer>
             </div>
          </div>
      </div>

      {/* --- MODAL: LISTADO DE USUARIOS --- */}
      <Modal isOpen={modalUsuarios.open} onClose={() => setModalUsuarios({...modalUsuarios, open: false})} title="Base de Datos de Usuarios">
         <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                <input 
                    type="text" 
                    placeholder="Filtrar por nombre o correo..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    onChange={(e) => setModalUsuarios({...modalUsuarios, search: e.target.value})}
                />
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold sticky top-0">
                        <tr>
                            <th className="px-4 py-3">Usuario</th>
                            <th className="px-4 py-3">Rol</th>
                            <th className="px-4 py-3 text-center">Vehículos</th>
                            <th className="px-4 py-3">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filtrarData(modalUsuarios.data, modalUsuarios.search, ['nombre_completo', 'correo_electronico']).map(u => (
                            <tr key={u.id_usuario} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-4 py-3">
                                    <div className="font-bold text-slate-800 dark:text-white">{u.nombre_completo}</div>
                                    <div className="text-xs text-slate-500">{u.correo_electronico}</div>
                                </td>
                                <td className="px-4 py-3 capitalize">{u.tipo_usuario?.replace('_', ' ')}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.num_vehiculos > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {u.num_vehiculos}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {u.activo 
                                        ? <span className="text-emerald-600 font-bold text-xs">Activo</span> 
                                        : <span className="text-red-500 font-bold text-xs">Baja</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         </div>
      </Modal>

      {/* --- MODAL: LISTADO DE PASES --- */}
      <Modal isOpen={modalPases.open} onClose={() => setModalPases({...modalPases, open: false})} title="Pases Vigentes y Recientes">
         <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                <input 
                    type="text" 
                    placeholder="Buscar folio o placa..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    onChange={(e) => setModalPases({...modalPases, search: e.target.value})}
                />
            </div>

            <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold sticky top-0">
                        <tr>
                            <th className="px-4 py-3">Folio</th>
                            <th className="px-4 py-3">Vehículo</th>
                            <th className="px-4 py-3">Propietario</th>
                            <th className="px-4 py-3">Vencimiento</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filtrarData(modalPases.data, modalPases.search, ['folio', 'placas', 'propietario']).map(p => {
                            const vencimiento = new Date(p.fecha_vencimiento);
                            const ahora = new Date();
                            const tiempoRestante = vencimiento - ahora;
                            const horasRestantes = Math.floor(tiempoRestante / (1000 * 60 * 60));
                            const esVigente = tiempoRestante > 0 && p.estado === 'vigente';

                            return (
                                <tr key={p.folio} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{p.folio}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-800 dark:text-white">{p.placas}</div>
                                        <div className="text-xs text-slate-500">{p.modelo}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{p.propietario}</td>
                                    <td className="px-4 py-3">
                                        <div className="text-xs text-slate-500">{vencimiento.toLocaleDateString()}</div>
                                        {esVigente ? (
                                            <span className="text-xs font-bold text-emerald-600">
                                                {horasRestantes > 24 ? `${Math.floor(horasRestantes/24)} días` : `${horasRestantes}h`} restantes
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-red-500">Vencido</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
         </div>
      </Modal>

    </div>
  );
};
 
export default Estadisticas;