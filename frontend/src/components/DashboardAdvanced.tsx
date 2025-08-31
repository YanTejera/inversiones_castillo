import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  Users,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Package,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { dashboardAdvancedService, type AdvancedDashboardData } from '../services/dashboardAdvancedService';
import { Link } from 'react-router-dom';
import ResumenCobrosDashboard from './ResumenCobrosDashboard';
import NotificacionesBell from './NotificacionesBell';

// Import chart components
import VentasTrendChart from './charts/VentasTrendChart';
import TopProductosChart from './charts/TopProductosChart';
import DistribucionVentasChart from './charts/DistribucionVentasChart';
import FlujoCajaChart from './charts/FlujoCajaChart';
import KPIsRadarChart from './charts/KPIsRadarChart';

const DashboardAdvanced: React.FC = () => {
  const [data, setData] = useState<AdvancedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'hoy' | 'semana' | 'mes' | 'año'>('mes');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const dashboardData = await dashboardAdvancedService.getAdvancedDashboardData();
      setData(dashboardData);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError('Error al cargar datos del dashboard');
      console.error('Advanced Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => dashboardAdvancedService.formatCurrency(amount);
  const formatPercentage = (value: number) => dashboardAdvancedService.formatPercentage(value);
  const formatNumber = (value: number) => dashboardAdvancedService.formatNumber(value);

  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'critica': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'advertencia': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getAlertColor = (tipo: string) => {
    switch (tipo) {
      case 'critica': return 'border-red-200 bg-red-50';
      case 'advertencia': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-green-200 bg-green-50';
    }
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <ArrowUpRight className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* KPI Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700 shimmer">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Charts grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700 shimmer">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard Inteligente</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            Análisis completo y predicciones empresariales
          </p>
        </div>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          {/* Period Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
            {(['hoy', 'semana', 'mes', 'año'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedPeriod === period
                    ? 'bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700 text-blue-600'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={loadDashboardData}
            className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Ventas del Mes</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {formatCurrency(data.metricas_principales.ventas_mes.total)}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="flex items-center justify-end">
                {getTrendIcon(data.metricas_principales.ventas_mes.crecimiento_porcentual)}
                <span className={`text-xs sm:text-sm font-medium ml-1 ${getTrendColor(data.metricas_principales.ventas_mes.crecimiento_porcentual)}`}>
                  {formatPercentage(data.metricas_principales.ventas_mes.crecimiento_porcentual)}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.metricas_principales.ventas_mes.count} ventas</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rentabilidad</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(data.metricas_principales.rentabilidad_mes)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Margen bruto</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversión</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(data.metricas_principales.conversion_rate)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Efectividad</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock Crítico</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.metricas_principales.stock_critico}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Productos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas Inteligentes */}
      {data.alertas_inteligentes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Zap className="h-5 w-5 text-yellow-500 mr-2" />
              Alertas Inteligentes
            </h3>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {data.alertas_inteligentes.filter(a => a.tipo === 'critica').length} críticas
            </span>
          </div>
          <div className="space-y-3">
            {data.alertas_inteligentes.slice(0, 3).map((alerta, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getAlertColor(alerta.tipo)}`}>
                <div className="flex items-start">
                  {getAlertIcon(alerta.tipo)}
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{alerta.titulo}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{alerta.mensaje}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <strong>Acción sugerida:</strong> {alerta.accion_sugerida}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Columna Izquierda - Análisis de Ventas */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          
          {/* Gráfico de Ventas por Día */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Tendencia de Ventas</h3>
              <Link to="/reportes" className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                Ver detalles →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <VentasTrendChart data={data.analisis_ventas.ventas_por_dia} height={250} />
            </div>
          </div>

          {/* Top Productos - Gráfico de Barras */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Productos Vendidos</h3>
            <div className="overflow-x-auto">
              <TopProductosChart data={data.analisis_ventas.top_productos.slice(0, 5)} height={280} />
            </div>
          </div>

          {/* Distribución Tipo de Venta */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribución de Ventas</h3>
            <div className="overflow-x-auto">
              <DistribucionVentasChart data={data.analisis_ventas.distribucion_tipo_venta} height={280} />
            </div>
          </div>

        </div>

        {/* Columna Derecha - KPIs y Salud Financiera */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* Resumen de Cobros */}
          <ResumenCobrosDashboard />

          {/* KPIs Operacionales - Radar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">KPIs Operacionales</h3>
            <KPIsRadarChart data={data.kpis_operacionales} height={280} />
          </div>

          {/* Salud Financiera */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Salud Financiera</h3>
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">Balance del Mes</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(data.salud_financiera.flujo_caja.balance)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700">Cuentas por Cobrar</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(data.salud_financiera.cuentas_por_cobrar.total)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-700">Valor Inventario</span>
                  <span className="font-bold text-purple-600">
                    {formatCurrency(data.salud_financiera.inventario.valor_total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Sección adicional de análisis financiero */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Análisis de Flujo de Caja</h3>
        <FlujoCajaChart data={data.salud_financiera.flujo_caja} height={350} />
      </div>

      {/* Predicciones y Recomendaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Predicciones */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="h-5 w-5 text-blue-500 mr-2" />
            Predicciones
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">Predicción Ventas Próximo Mes</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.tendencias_predicciones.prediccion_ventas_mes)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Basado en tendencias históricas y estacionalidad
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">Mejor Mes</p>
                <p className="font-semibold text-green-600">
                  {data.tendencias_predicciones.estacionalidad.mejor_mes}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">Tendencia</p>
                <p className="font-semibold text-blue-600 capitalize">
                  {data.tendencias_predicciones.tendencia_clientes}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Target className="h-5 w-5 text-green-500 mr-2" />
            Recomendaciones
          </h3>
          <div className="space-y-3">
            {data.tendencias_predicciones.recomendaciones.map((rec, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{rec.tipo}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{rec.descripcion}</p>
                    <p className="text-xs text-green-600 mt-2 font-medium">
                      Impacto esperado: {rec.impacto_esperado}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer con última actualización */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>Última actualización: {lastUpdate.toLocaleString('es-CO')}</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdvanced;