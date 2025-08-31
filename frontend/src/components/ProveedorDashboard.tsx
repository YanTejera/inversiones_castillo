import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Package,
  Building,
  Users,
  Globe,
  AlertTriangle,
  CheckCircle,
  Activity,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
  Map,
  Clock,
  Zap,
  Eye,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { proveedorService } from '../services/proveedorService';
import { useWindowSize } from '../hooks/useWindowSize';

interface ProveedorListItem {
  id: number;
  nombre_completo: string;
  tipo_proveedor: string;
  ciudad: string;
  pais: string;
  contacto_principal: string;
  telefono_principal: string;
  email: string;
  estado: string;
  esta_activo: boolean;
  total_motocicletas: number;
  fecha_creacion: string;
}

interface DashboardData {
  kpis: {
    total_proveedores: number;
    proveedores_activos: number;
    proveedores_inactivos: number;
    total_motocicletas: number;
    promedio_motocicletas: number;
    crecimiento_mensual: number;
  };
  distribucion_tipos: Array<{
    tipo: string;
    count: number;
    porcentaje: number;
    color: string;
  }>;
  distribucion_geografica: Array<{
    pais: string;
    count: number;
    porcentaje: number;
  }>;
  top_proveedores: Array<{
    id: number;
    nombre: string;
    motocicletas: number;
    eficiencia: number;
  }>;
  tendencia_actividad: Array<{
    mes: string;
    nuevos: number;
    activos: number;
    total: number;
  }>;
  metricas_rendimiento: {
    eficiencia_promedio: number;
    satisfaccion: number;
    tiempo_respuesta: number;
    cumplimiento: number;
    calidad: number;
    innovacion: number;
  };
  alertas: Array<{
    tipo: 'warning' | 'info' | 'error';
    titulo: string;
    mensaje: string;
    proveedor_id?: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];
const TIPO_COLORS = {
  'distribuidor': '#0088FE',
  'importador': '#00C49F', 
  'mayorista': '#FFBB28',
  'fabricante': '#FF8042',
  'particular': '#8884D8'
};

const ProveedorDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [proveedores, setProveedores] = useState<ProveedorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { isMobile } = useWindowSize();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await proveedorService.getProveedores();
      const proveedoresList = response.results;
      setProveedores(proveedoresList);
      
      const dashboardData = generateDashboardData(proveedoresList);
      setDashboardData(dashboardData);
    } catch (err) {
      setError('Error al cargar datos del dashboard');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const generateDashboardData = (proveedoresList: ProveedorListItem[]): DashboardData => {
    const activos = proveedoresList.filter(p => p.esta_activo).length;
    const inactivos = proveedoresList.length - activos;
    const totalMotocicletas = proveedoresList.reduce((sum, p) => sum + p.total_motocicletas, 0);
    const promedio = proveedoresList.length > 0 ? Math.round(totalMotocicletas / proveedoresList.length) : 0;

    // Distribución por tipos
    const tipoCount: Record<string, number> = {};
    proveedoresList.forEach(p => {
      tipoCount[p.tipo_proveedor] = (tipoCount[p.tipo_proveedor] || 0) + 1;
    });

    const distribucionTipos = Object.entries(tipoCount).map(([tipo, count]) => ({
      tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
      count,
      porcentaje: (count / proveedoresList.length) * 100,
      color: TIPO_COLORS[tipo as keyof typeof TIPO_COLORS] || '#8884D8'
    }));

    // Distribución geográfica
    const paisCount: Record<string, number> = {};
    proveedoresList.forEach(p => {
      paisCount[p.pais] = (paisCount[p.pais] || 0) + 1;
    });

    const distribucionGeografica = Object.entries(paisCount).map(([pais, count]) => ({
      pais,
      count,
      porcentaje: (count / proveedoresList.length) * 100
    }));

    // Top proveedores
    const topProveedores = proveedoresList
      .sort((a, b) => b.total_motocicletas - a.total_motocicletas)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        nombre: p.nombre_completo.length > 25 ? p.nombre_completo.substring(0, 25) + '...' : p.nombre_completo,
        motocicletas: p.total_motocicletas,
        eficiencia: Math.min(100, (p.total_motocicletas / Math.max(promedio, 1)) * 100)
      }));

    // Tendencia de actividad (simulada)
    const tendenciaActividad = generateTendenciaActividad();

    // Métricas de rendimiento (simuladas)
    const metricasRendimiento = {
      eficiencia_promedio: 85,
      satisfaccion: 92,
      tiempo_respuesta: 78,
      cumplimiento: 88,
      calidad: 90,
      innovacion: 75
    };

    // Alertas generadas
    const alertas = generateAlertas(proveedoresList);

    return {
      kpis: {
        total_proveedores: proveedoresList.length,
        proveedores_activos: activos,
        proveedores_inactivos: inactivos,
        total_motocicletas: totalMotocicletas,
        promedio_motocicletas: promedio,
        crecimiento_mensual: Math.floor(Math.random() * 15) + 5 // Simulado
      },
      distribucion_tipos: distribucionTipos,
      distribucion_geografica: distribucionGeografica,
      top_proveedores: topProveedores,
      tendencia_actividad: tendenciaActividad,
      metricas_rendimiento: metricasRendimiento,
      alertas: alertas
    };
  };

  const generateTendenciaActividad = () => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return meses.map((mes, index) => ({
      mes,
      nuevos: Math.floor(Math.random() * 8) + 2,
      activos: Math.floor(Math.random() * 20) + 15,
      total: (index + 1) * 5 + Math.floor(Math.random() * 10)
    }));
  };

  const generateAlertas = (proveedores: ProveedorListItem[]) => {
    const alertas = [];
    
    // Proveedores inactivos
    const inactivos = proveedores.filter(p => !p.esta_activo);
    if (inactivos.length > 0) {
      alertas.push({
        tipo: 'warning' as const,
        titulo: 'Proveedores Inactivos',
        mensaje: `${inactivos.length} proveedores requieren atención`
      });
    }

    // Proveedores sin motocicletas
    const sinStock = proveedores.filter(p => p.total_motocicletas === 0);
    if (sinStock.length > 0) {
      alertas.push({
        tipo: 'info' as const,
        titulo: 'Sin Inventario',
        mensaje: `${sinStock.length} proveedores sin motocicletas registradas`
      });
    }

    // Top performer
    const topPerformer = proveedores.sort((a, b) => b.total_motocicletas - a.total_motocicletas)[0];
    if (topPerformer) {
      alertas.push({
        tipo: 'info' as const,
        titulo: 'Mejor Rendimiento',
        mensaje: `${topPerformer.nombre_completo} lidera con ${topPerformer.total_motocicletas} motocicletas`,
        proveedor_id: topPerformer.id
      });
    }

    return alertas;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error || 'No se pudieron cargar los datos'}</p>
        <button
          onClick={loadDashboardData}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard de Proveedores</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Visión general del rendimiento y estadísticas de proveedores</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            to="/proveedores"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Todos
          </Link>
          <Link
            to="/proveedores/nuevo"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Link>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            <Activity className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Alertas */}
      {dashboardData.alertas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData.alertas.map((alerta, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                alerta.tipo === 'warning' 
                  ? 'bg-yellow-50 border-yellow-400' 
                  : alerta.tipo === 'error'
                  ? 'bg-red-50 border-red-400'
                  : 'bg-blue-50 border-blue-400'
              }`}
            >
              <div className="flex items-center">
                {alerta.tipo === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                ) : alerta.tipo === 'error' ? (
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-blue-500 mr-3" />
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">{alerta.titulo}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{alerta.mensaje}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.kpis.total_proveedores}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">Proveedores registrados</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.kpis.proveedores_activos}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-green-600">
              {Math.round((dashboardData.kpis.proveedores_activos / dashboardData.kpis.total_proveedores) * 100)}% del total
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Motocicletas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.kpis.total_motocicletas}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">Inventario total</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Promedio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.kpis.promedio_motocicletas}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">Motos por proveedor</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-indigo-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Crecimiento</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.kpis.crecimiento_mensual}%</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-green-600">Mensual estimado</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Globe className="h-8 w-8 text-teal-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Países</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.distribucion_geografica.length}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">Cobertura global</p>
          </div>
        </div>
      </div>

      {/* Charts principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por tipos */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Distribución por Tipo</h3>
            <PieChartIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.distribucion_tipos}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 40 : 60}
                  outerRadius={isMobile ? 80 : 100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {dashboardData.distribucion_tipos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, name: any, props: any) => [
                  `${value} proveedores (${props.payload.porcentaje.toFixed(1)}%)`,
                  props.payload.tipo
                ]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {dashboardData.distribucion_tipos.map((item, index) => (
              <div key={item.tipo} className="flex items-center text-sm">
                <div 
                  className="w-3 h-3 rounded mr-2" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700">{item.tipo}: {item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top proveedores */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Top Proveedores</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.top_proveedores} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="nombre" 
                  type="category" 
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  width={isMobile ? 80 : 120}
                />
                <Tooltip 
                  formatter={(value: any) => [value, 'Motocicletas']}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="motocicletas" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tendencia de actividad */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tendencia de Actividad</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.tendencia_actividad}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: isMobile ? 10 : 12 }} />
                <YAxis />
                <Tooltip 
                  labelStyle={{ color: '#374151' }}
                  formatter={(value: any, name: string) => [
                    value, 
                    name === 'nuevos' ? 'Nuevos' : name === 'activos' ? 'Activos' : 'Total'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stackId="1"
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="activos" 
                  stackId="2"
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Métricas de rendimiento */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Métricas de Rendimiento</h3>
            <Zap className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={[
                { metrica: 'Eficiencia', valor: dashboardData.metricas_rendimiento.eficiencia_promedio, max: 100 },
                { metrica: 'Satisfacción', valor: dashboardData.metricas_rendimiento.satisfaccion, max: 100 },
                { metrica: 'Tiempo Resp.', valor: dashboardData.metricas_rendimiento.tiempo_respuesta, max: 100 },
                { metrica: 'Cumplimiento', valor: dashboardData.metricas_rendimiento.cumplimiento, max: 100 },
                { metrica: 'Calidad', valor: dashboardData.metricas_rendimiento.calidad, max: 100 },
                { metrica: 'Innovación', valor: dashboardData.metricas_rendimiento.innovacion, max: 100 }
              ]}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metrica" tick={{ fontSize: isMobile ? 8 : 10 }} />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="Rendimiento"
                  dataKey="valor"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Tooltip formatter={(value: any) => [`${value}%`, 'Rendimiento']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Distribución geográfica */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Distribución Geográfica</h3>
          <Map className="h-5 w-5 text-gray-400" />
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboardData.distribucion_geografica}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="pais" 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => [value, 'Proveedores']}
                labelStyle={{ color: '#374151' }}
              />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/proveedores/nuevo"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Nuevo Proveedor</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Registrar proveedor</p>
            </div>
          </Link>
          
          <Link
            to="/proveedores"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Ver Proveedores</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lista completa</p>
            </div>
          </Link>
          
          <Link
            to="/reportes/proveedores"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Reportes</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Análisis detallado</p>
            </div>
          </Link>
          
          <button
            onClick={refreshData}
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Activity className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Actualizar</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Refrescar datos</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProveedorDashboard;