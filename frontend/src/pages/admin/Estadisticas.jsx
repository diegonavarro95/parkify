import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, Users, Car, FileText, AlertTriangle, 
  ArrowRight, Search, PieChart as PieIcon, TrendingUp, X, Lock, Unlock, Phone, CreditCard, Bike, Calendar, QrCode, User, ZoomIn 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { getResumenStats, getGraficaStats, getDetalleUsuarios, getDetallePases, getDetalleVehiculos } from '../../api/estadisticas'; 
import api from '../../api/axios'; 
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal'; 
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

// URL Base para imágenes
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Estadisticas = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [graficaData, setGraficaData] = useState([]);
  const [rangoGrafica, setRangoGrafica] = useState('7dias');

  // Estados de Modales de Lista
  const [modalUsuarios, setModalUsuarios] = useState({ open: false, data: [], search: '' });
  const [modalVehiculos, setModalVehiculos] = useState({ open: false, data: [], search: '' }); 
  const [modalPases, setModalPases] = useState({ open: false, data: [], search: '' });

  // Estados Modales de DETALLE
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null); 
  const [selectedPase, setSelectedPase] = useState(null);
  
  // Estado para Zoom de Imagen
  const [zoomImage, setZoomImage] = useState(null);

  // Estado para Modal de Confirmación
  const [confirmarBloqueo, setConfirmarBloqueo] = useState(null); 

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    cargarDatosGenerales();
  }, []);

  useEffect(() => {
    cargarGrafica();
  }, [rangoGrafica]);

  // --- CARGA DE DATOS ---
  const cargarDatosGenerales = async () => {
    try {
      const data = await getResumenStats();
      setStats(data);
      setLoading(false);
    } catch (error) { console.error(error); }
  };

  const cargarGrafica = async () => {
    const data = await getGraficaStats(rangoGrafica);
    setGraficaData(data);
  };

  // --- FUNCIONES PARA ABRIR MODALES ---
  const fetchUsuarios = async () => {
      const data = await getDetalleUsuarios();
      setModalUsuarios(prev => ({ ...prev, data }));
      return data;
  };

  const fetchVehiculos = async () => {
      const data = await getDetalleVehiculos();
      setModalVehiculos(prev => ({ ...prev, data }));
      return data;
  };

  const abrirUsuarios = async () => { 
      const data = await fetchUsuarios();
      setModalUsuarios({ open: true, data, search: '' }); 
  };
  
  const abrirVehiculos = async () => { 
      const data = await fetchVehiculos();
      setModalVehiculos({ open: true, data, search: '' }); 
  };
  
  const abrirPases = async () => {
    const data = await getDetallePases();
    setModalPases({ open: true, data, search: '' });
  };

  // --- LÓGICA DE INTERCONEXIÓN ---
  const handleVerUsuario = async (nombreOId) => {
      let lista = modalUsuarios.data;
      if (lista.length === 0) lista = await fetchUsuarios();
      
      const usuarioEncontrado = lista.find(u => u.nombre_completo === nombreOId || u.id_usuario === nombreOId);
      
      if (usuarioEncontrado) {
          setSelectedUsuario(usuarioEncontrado);
      } else {
          toast.error("Usuario no encontrado.");
      }
  };

  const handleVerVehiculo = async (placas) => {
      let lista = modalVehiculos.data;
      if (lista.length === 0) lista = await fetchVehiculos();

      const vehiculoEncontrado = lista.find(v => v.placas === placas);
      if (vehiculoEncontrado) {
          setSelectedVehiculo(vehiculoEncontrado);
      } else {
          toast.error("Vehículo no encontrado.");
      }
  };

  // --- ACCIONES ---
  const ejecutarBloqueo = async () => {
      if (!confirmarBloqueo) return;
      const usuario = confirmarBloqueo;
      const nuevoEstado = !usuario.activo;
      try {
          await api.put(`/usuarios/${usuario.id_usuario}/estado`, { activo: nuevoEstado });
          
          if (selectedUsuario?.id_usuario === usuario.id_usuario) {
              setSelectedUsuario({ ...selectedUsuario, activo: nuevoEstado });
          }
          setModalUsuarios(prev => ({
              ...prev,
              data: prev.data.map(u => u.id_usuario === usuario.id_usuario ? { ...u, activo: nuevoEstado } : u)
          }));
          toast.success(`Usuario ${nuevoEstado ? 'activado' : 'bloqueado'}`);
          setConfirmarBloqueo(null);
      } catch (error) {
          toast.error("Error al cambiar estado");
      }
  };

  const getIniciales = (nombre) => {
      if (!nombre) return '??';
      const partes = nombre.split(' ').filter(p => p.length > 0);
      if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
      return partes[0].substring(0, 2).toUpperCase();
  };

  const filtrarData = (lista, busqueda, campos) => {
    if (!busqueda) return lista;
    return lista.filter(item => 
      campos.some(campo => item[campo]?.toString().toLowerCase().includes(busqueda.toLowerCase()))
    );
  };

  const getImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${baseUrl}${cleanPath}`;
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando tablero...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><TrendingUp className="text-brand-600" /> Dashboard Estadístico</h1>
           <p className="text-slate-500">Métricas clave y rendimiento del sistema en tiempo real.</p>
        </div>
      </div>

      {/* TARJETAS KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={abrirUsuarios} className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group">
             <div className="flex justify-between items-start">
                <div><p className="text-slate-500 text-sm font-medium uppercase">Usuarios Totales</p><h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.usuarios.total}</h3></div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><Users size={24} /></div>
             </div>
             <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">🎓 {stats.usuarios.comunidad} Comunidad</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">👤 {stats.usuarios.visitantes} Visitas</span>
                <span className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded">🛡️ {stats.usuarios.admins} Admins</span>
             </div>
          </div>

          <div onClick={abrirVehiculos} className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group">
             <div className="flex justify-between items-start">
                <div><p className="text-slate-500 text-sm font-medium uppercase">Parque Vehicular</p><h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.vehiculos.total}</h3></div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Car size={24} /></div>
             </div>
             <div className="mt-4 flex gap-2 text-xs font-bold">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">🚗 {stats.vehiculos.autos} Autos</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">🏍️ {stats.vehiculos.motos} Motos</span>
             </div>
          </div>

          <div onClick={abrirPases} className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group">
             <div className="flex justify-between items-start">
                <div><p className="text-slate-500 text-sm font-medium uppercase">Pases Activos</p><h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.pases.activos}</h3></div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors"><FileText size={24} /></div>
             </div>
             <div className="mt-4 text-xs font-bold text-red-500 flex items-center gap-1"><AlertTriangle size={12} /> {stats.pases.vencidos} Vencidos (Histórico)</div>
          </div>

          <div onClick={() => navigate('/admin/reportes')} className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group">
             <div className="flex justify-between items-start">
                <div><p className="text-slate-500 text-sm font-medium uppercase">Reportes Nuevos</p><h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.reportes.pendientes}</h3></div>
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-colors"><AlertTriangle size={24} /></div>
             </div>
             <div className="mt-4 text-xs font-bold text-slate-400 flex items-center gap-1">Ver bandeja de entrada <ArrowRight size={12}/></div>
          </div>
      </div>

      {/* GRAFICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><BarChart3 size={20} className="text-brand-600"/> Flujo de Accesos</h3>
                <div className="flex gap-2">
                   <button onClick={() => setRangoGrafica('7dias')} className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${rangoGrafica === '7dias' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>7 Días</button>
                   <button onClick={() => setRangoGrafica('30dias')} className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${rangoGrafica === '30dias' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>30 Días</button>
                </div>
             </div>
             <div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={graficaData}><defs><linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient><linearGradient id="colorSalidas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/><stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" /><XAxis dataKey="fecha" tick={{fontSize: 12}} stroke="#94A3B8" /><YAxis tick={{fontSize: 12}} stroke="#94A3B8"/><Tooltip /><Area type="monotone" dataKey="entradas" stroke="#10B981" fillOpacity={1} fill="url(#colorEntradas)" /><Area type="monotone" dataKey="salidas" stroke="#F59E0B" fillOpacity={1} fill="url(#colorSalidas)" /></AreaChart></ResponsiveContainer></div>
          </div>
          <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
             <h3 className="font-bold text-lg mb-4 dark:text-white flex items-center gap-2 w-full"><PieIcon size={20} className="text-purple-600"/> Composición</h3>
             <div className="h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ name: 'Comunidad', value: parseInt(stats.usuarios.comunidad) },{ name: 'Visitantes', value: parseInt(stats.usuarios.visitantes) },{ name: 'Staff', value: parseInt(stats.usuarios.admins) },]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{COLORS.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
          </div>
      </div>

      {/* ================= MODALES NIVEL 1 (LISTAS) ================= */}

      {/* 1. LISTA USUARIOS */}
      <Modal isOpen={modalUsuarios.open} onClose={() => setModalUsuarios({...modalUsuarios, open: false})} title="Base de Datos de Usuarios">
         <div className="space-y-4">
            <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input type="text" placeholder="Filtrar por nombre..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" onChange={(e) => setModalUsuarios({...modalUsuarios, search: e.target.value})}/></div>
            <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold sticky top-0 z-10">
                     <tr><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3 text-center">Vehículos</th><th className="px-4 py-3">Estado</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                     {filtrarData(modalUsuarios.data, modalUsuarios.search, ['nombre_completo', 'correo_electronico']).map(u => (
                        <tr key={u.id_usuario} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => setSelectedUsuario(u)}>
                           <td className="px-4 py-3 flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200">{getIniciales(u.nombre_completo)}</div>
                               <div><div className="font-bold text-slate-800 dark:text-white">{u.nombre_completo}</div><div className="text-xs text-slate-500">{u.correo_electronico}</div></div>
                           </td>
                           <td className="px-4 py-3 capitalize">{u.tipo_usuario?.replace('_', ' ')}</td>
                           <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${u.num_vehiculos > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{u.num_vehiculos}</span></td>
                           <td className="px-4 py-3">{u.activo ? <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">Activo</span> : <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded">Bloqueado</span>}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </Modal>

      {/* 2. LISTA VEHÍCULOS */}
      <Modal isOpen={modalVehiculos.open} onClose={() => setModalVehiculos({...modalVehiculos, open: false})} title="Parque Vehicular Registrado">
         <div className="space-y-4">
            <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input type="text" placeholder="Buscar placas..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" onChange={(e) => setModalVehiculos({...modalVehiculos, search: e.target.value})}/></div>
            <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold sticky top-0 z-10">
                     <tr><th className="px-4 py-3">Vehículo</th><th className="px-4 py-3">Propietario</th><th className="px-4 py-3">Tipo</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                     {filtrarData(modalVehiculos.data, modalVehiculos.search, ['placas', 'modelo', 'marca', 'propietario']).map(v => (
                        <tr key={v.id_vehiculo} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                           <td className="px-4 py-3 cursor-pointer group" onClick={() => setSelectedVehiculo(v)}>
                               <div className="font-mono font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand-600 underline-offset-2 group-hover:underline">{v.placas}</div>
                               <div className="text-xs text-slate-500">{v.marca} {v.modelo}</div>
                           </td>
                           <td className="px-4 py-3 cursor-pointer" onClick={() => handleVerUsuario(v.propietario)}>
                               <span className="text-slate-800 dark:text-white font-medium hover:text-brand-600 hover:underline">{v.propietario}</span>
                           </td>
                           <td className="px-4 py-3 capitalize">{v.tipo}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </Modal>

      {/* 3. LISTA PASES */}
      <Modal isOpen={modalPases.open} onClose={() => setModalPases({...modalPases, open: false})} title="Pases Vigentes y Recientes">
         <div className="space-y-4">
            <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input type="text" placeholder="Buscar folio..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" onChange={(e) => setModalPases({...modalPases, search: e.target.value})}/></div>
            <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold sticky top-0 z-10">
                     <tr><th className="px-4 py-3">Folio</th><th className="px-4 py-3">Vehículo</th><th className="px-4 py-3">Propietario</th><th className="px-4 py-3">Estado</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                     {filtrarData(modalPases.data, modalPases.search, ['folio', 'placas', 'propietario']).map(p => {
                        const vencimiento = new Date(p.fecha_vencimiento);
                        const esVigente = (vencimiento - new Date()) > 0 && p.estado === 'vigente';
                        return (
                           <tr key={p.folio} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 cursor-pointer hover:text-brand-600 hover:underline" onClick={() => setSelectedPase(p)}>
                                  {p.folio}
                              </td>
                              <td className="px-4 py-3 cursor-pointer group" onClick={() => handleVerVehiculo(p.placas)}>
                                 <div className="font-bold text-slate-800 dark:text-white group-hover:text-brand-600 hover:underline">{p.placas}</div>
                                 <div className="text-xs text-slate-500">{p.modelo}</div>
                              </td>
                              <td className="px-4 py-3 cursor-pointer" onClick={() => handleVerUsuario(p.propietario)}>
                                  <span className="text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:underline">{p.propietario}</span>
                              </td>
                              <td className="px-4 py-3">
                                 {/* CAMBIO SOLICITADO: Fecha de vencimiento debajo del estado */}
                                 <div className="flex flex-col">
                                     {esVigente 
                                        ? <span className="text-xs font-bold text-emerald-600 mb-1">Vigente</span>
                                        : <span className="text-xs font-bold text-red-500 mb-1">Vencido</span>
                                     }
                                     <span className="text-[10px] text-slate-400 font-mono">
                                         {vencimiento.toLocaleDateString()}
                                     </span>
                                 </div>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>
      </Modal>

      {/* ================= MODALES DE NIVEL 2 (DETALLES) ================= */}
      {/* ORDEN DE APILAMIENTO CORREGIDO (Del fondo hacia el frente):
          1. Listas (Nivel 1)
          2. Detalle Pase
          3. Detalle Vehículo (Cubre Pase)
          4. Detalle Usuario (Cubre Vehículo y Pase - "Leaf node")
          5. Zoom Imagen (Cubre Todo)
          6. Confirmación (Cubre Todo)
      */}

      {/* DETALLE PASE */}
      {selectedPase && (
          <Modal isOpen={!!selectedPase} onClose={() => setSelectedPase(null)} title="Información del Pase">
              <div className="space-y-6">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                      <div className="flex justify-between items-start mb-6">
                          <div><p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Folio</p><p className="font-mono text-xl font-bold tracking-wider">{selectedPase.folio}</p></div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${selectedPase.estado === 'vigente' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>{selectedPase.estado.toUpperCase()}</div>
                      </div>
                      <div className="flex gap-6 items-center">
                          <div className="bg-white p-2 rounded-lg w-24 h-24 flex items-center justify-center shrink-0 overflow-hidden">
                              {selectedPase.qr_url ? (
                                  <img src={getImageUrl(selectedPase.qr_url)} alt="QR" className="w-full h-full object-contain" />
                              ) : <QrCode className="text-slate-900" size={40}/>}
                          </div>
                          <div className="space-y-3 flex-1">
                              <div>
                                  <p className="text-slate-400 text-[10px] uppercase font-bold">Vencimiento</p>
                                  <p className="font-bold flex items-center gap-1"><Calendar size={14}/> {new Date(selectedPase.fecha_vencimiento).toLocaleDateString()} <span className="text-slate-400 font-normal text-xs">({new Date(selectedPase.fecha_vencimiento).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</span></p>
                              </div>
                              <div className="cursor-pointer hover:text-brand-400 transition-colors" onClick={() => handleVerUsuario(selectedPase.propietario)}>
                                  <p className="text-slate-400 text-[10px] uppercase font-bold">Titular</p>
                                  <p className="font-bold flex items-center gap-1 text-sm"><User size={14}/> {selectedPase.propietario}</p>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleVerVehiculo(selectedPase.placas)}>
                      <div><p className="text-xs text-slate-400 uppercase font-bold">Vehículo Asociado</p><p className="font-bold text-slate-800 dark:text-white text-lg">{selectedPase.placas}</p><p className="text-sm text-slate-500">{selectedPase.marca} {selectedPase.modelo} • {selectedPase.color}</p></div>
                      <Car className="text-slate-300" size={32}/>
                  </div>
                  <div className="flex justify-end pt-2">
                      <Button variant="outline" onClick={() => setSelectedPase(null)}>Cerrar</Button>
                  </div>
              </div>
          </Modal>
      )}

      {/* DETALLE VEHÍCULO */}
      {selectedVehiculo && (
          <Modal isOpen={!!selectedVehiculo} onClose={() => setSelectedVehiculo(null)} title="Detalle del Vehículo">
              <div className="space-y-6">
                  <div className="w-full h-56 bg-slate-200 rounded-xl overflow-hidden relative shadow-inner">
                      {selectedVehiculo.foto_vehiculo ? (
                          <img src={getImageUrl(selectedVehiculo.foto_vehiculo)} className="w-full h-full object-cover" alt="Vehículo" />
                      ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800">
                              {selectedVehiculo.tipo === 'motocicleta' ? <Bike size={64}/> : <Car size={64}/>}
                              <p className="mt-2 text-sm">Sin foto</p>
                          </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <h2 className="text-3xl font-black text-white tracking-widest font-mono">{selectedVehiculo.placas}</h2>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                          <p className="text-xs text-slate-400 uppercase font-bold">Marca / Modelo</p>
                          <p className="font-bold text-slate-800 dark:text-white">{selectedVehiculo.marca} {selectedVehiculo.modelo}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                          <p className="text-xs text-slate-400 uppercase font-bold">Color</p>
                          <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full border border-slate-300" style={{backgroundColor: selectedVehiculo.color}}></div>
                              <p className="font-bold text-slate-800 dark:text-white">{selectedVehiculo.color}</p>
                          </div>
                      </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group" onClick={() => handleVerUsuario(selectedVehiculo.propietario)}>
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">{getIniciales(selectedVehiculo.propietario)}</div>
                          <div><p className="text-xs text-slate-400 uppercase font-bold group-hover:text-brand-500">Propietario</p><p className="font-bold text-slate-800 dark:text-white">{selectedVehiculo.propietario}</p></div>
                      </div>
                      <ArrowRight size={18} className="text-slate-400 group-hover:text-brand-500"/>
                  </div>
                  <div className="flex justify-end pt-2">
                      <Button variant="outline" onClick={() => setSelectedVehiculo(null)}>Cerrar</Button>
                  </div>
              </div>
          </Modal>
      )}

      {/* DETALLE USUARIO (EL MÁS ALTO) */}
      {selectedUsuario && (
          <Modal isOpen={!!selectedUsuario} onClose={() => setSelectedUsuario(null)} title="Perfil de Usuario">
              <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                      <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">{getIniciales(selectedUsuario.nombre_completo)}</div>
                      <div>
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedUsuario.nombre_completo}</h2>
                          <p className="text-slate-500 text-sm">{selectedUsuario.correo_electronico}</p>
                          <div className="flex gap-2 mt-1">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded uppercase font-bold">{selectedUsuario.rol}</span>
                              <span className={`px-2 py-0.5 text-xs rounded uppercase font-bold ${selectedUsuario.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{selectedUsuario.activo ? 'Activa' : 'Bloqueada'}</span>
                          </div>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-slate-400 mb-1 flex items-center gap-1"><CreditCard size={14}/> CURP</p><p className="font-mono font-medium">{selectedUsuario.curp || 'No registrada'}</p></div>
                      <div><p className="text-slate-400 mb-1 flex items-center gap-1"><Phone size={14}/> Teléfono</p><p className="font-medium">{selectedUsuario.telefono || 'No registrado'}</p></div>
                      <div><p className="text-slate-400 mb-1">Tipo</p><p className="font-medium capitalize">{selectedUsuario.tipo_usuario?.replace('_', ' ')}</p></div>
                      <div><p className="text-slate-400 mb-1">Vehículos</p><p className="font-medium">{selectedUsuario.num_vehiculos}</p></div>
                  </div>
                  <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-3">Identificación Oficial</p>
                      {selectedUsuario.documento_validacion_url ? (
                          // FUNCIONALIDAD ZOOM AGREGADA AQUÍ
                          <div 
                              className="relative w-full h-48 bg-slate-200 rounded-lg overflow-hidden group cursor-zoom-in"
                              onClick={() => setZoomImage(getImageUrl(selectedUsuario.documento_validacion_url))}
                          >
                              <img src={getImageUrl(selectedUsuario.documento_validacion_url)} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold"><ZoomIn className="mr-2"/> Ver Pantalla Completa</div>
                          </div>
                      ) : <div className="h-20 flex items-center justify-center text-slate-400 bg-white border border-dashed border-slate-300 rounded-lg">Sin documento</div>}
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                      <Button variant="ghost" onClick={() => setSelectedUsuario(null)}>Cerrar</Button>
                      <Button variant={selectedUsuario.activo ? 'danger' : 'success'} onClick={() => setConfirmarBloqueo(selectedUsuario)}>
                          {selectedUsuario.activo ? <><Lock size={16} className="mr-2"/> Bloquear</> : <><Unlock size={16} className="mr-2"/> Desbloquear</>}
                      </Button>
                  </div>
              </div>
          </Modal>
      )}

      {/* --- MODAL ZOOM IMAGEN (LIGHTBOX) --- */}
      {zoomImage && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in" onClick={() => setZoomImage(null)}>
              <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"><X size={32}/></button>
              <img src={zoomImage} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}/>
          </div>
      )}

      {/* --- MODAL CONFIRMACIÓN BLOQUEO --- */}
      <Modal isOpen={!!confirmarBloqueo} onClose={() => setConfirmarBloqueo(null)} title="Confirmar Acción">
          <div className="text-center p-4">
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 ${confirmarBloqueo?.activo ? 'bg-red-100' : 'bg-emerald-100'}`}>
                  {confirmarBloqueo?.activo ? <Lock className="h-8 w-8 text-red-600" /> : <Unlock className="h-8 w-8 text-emerald-600" />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{confirmarBloqueo?.activo ? '¿Bloquear Usuario?' : '¿Desbloquear Usuario?'}</h3>
              <p className="text-sm text-gray-500 mb-6">{confirmarBloqueo?.activo ? `Estás a punto de bloquear el acceso a ${confirmarBloqueo.nombre_completo}.` : `Se restablecerá el acceso para ${confirmarBloqueo?.nombre_completo}.`}</p>
              <div className="flex justify-center gap-3">
                  <Button variant="ghost" onClick={() => setConfirmarBloqueo(null)}>Cancelar</Button>
                  <Button variant={confirmarBloqueo?.activo ? 'danger' : 'success'} onClick={ejecutarBloqueo}>{confirmarBloqueo?.activo ? 'Sí, Bloquear' : 'Sí, Desbloquear'}</Button>
              </div>
          </div>
      </Modal>

    </div>
  );
};

export default Estadisticas;