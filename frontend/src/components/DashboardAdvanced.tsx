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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard inteligente...</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Inteligente</h1>
          <p className="text-gray-600">
            Análisis completo y predicciones empresariales
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Period Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['hoy', 'semana', 'mes', 'año'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={loadDashboardData}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ventas del Mes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.metricas_principales.ventas_mes.total)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center">
                {getTrendIcon(data.metricas_principales.ventas_mes.crecimiento_porcentual)}
                <span className={`text-sm font-medium ${getTrendColor(data.metricas_principales.ventas_mes.crecimiento_porcentual)}`}>
                  {formatPercentage(data.metricas_principales.ventas_mes.crecimiento_porcentual)}
                </span>
              </div>
              <p className="text-xs text-gray-500">{data.metricas_principales.ventas_mes.count} ventas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rentabilidad</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(data.metricas_principales.rentabilidad_mes)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Margen bruto</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Conversión</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(data.metricas_principales.conversion_rate)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Efectividad</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Stock Crítico</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.metricas_principales.stock_critico}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Productos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas Inteligentes */}
      {data.alertas_inteligentes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
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
                    <h4 className="text-sm font-medium text-gray-900">{alerta.titulo}</h4>
                    <p className="text-sm text-gray-600 mt-1">{alerta.mensaje}</p>
                    <p className="text-xs text-gray-500 mt-2">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda - Análisis de Ventas */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Gráfico de Ventas por Día */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tendencia de Ventas</h3>
              <Link to="/reportes" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver detalles →
              </Link>
            </div>
            <VentasTrendChart data={data.analisis_ventas.ventas_por_dia} height={280} />
          </div>

          {/* Top Productos - Gráfico de Barras */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Productos Vendidos</h3>
            <TopProductosChart data={data.analisis_ventas.top_productos.slice(0, 5)} height={300} />
          </div>

          {/* Distribución Tipo de Venta */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Ventas</h3>
            <DistribucionVentasChart data={data.analisis_ventas.distribucion_tipo_venta} height={300} />
          </div>

        </div>

        {/* Columna Derecha - KPIs y Salud Financiera */}
        <div className="space-y-6">
          
          {/* Resumen de Cobros */}
          <ResumenCobrosDashboard />

          {/* KPIs Operacionales - Radar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">KPIs Operacionales</h3>
            <KPIsRadarChart data={data.kpis_operacionales} height={280} />
          </div>

          {/* Salud Financiera */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Salud Financiera</h3>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Flujo de Caja</h3>
        <FlujoCajaChart data={data.salud_financiera.flujo_caja} height={350} />
      </div>

      {/* Predicciones y Recomendaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Predicciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 text-blue-500 mr-2" />
            Predicciones
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Predicción Ventas Próximo Mes</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.tendencias_predicciones.prediccion_ventas_mes)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Basado en tendencias históricas y estacionalidad
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Mejor Mes</p>
                <p className="font-semibold text-green-600">
                  {data.tendencias_predicciones.estacionalidad.mejor_mes}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Tendencia</p>
                <p className="font-semibold text-blue-600 capitalize">
                  {data.tendencias_predicciones.tendencia_clientes}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
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
                    <p className="text-sm font-medium text-gray-900">{rec.tipo}</p>
                    <p className="text-sm text-gray-600 mt-1">{rec.descripcion}</p>
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
      <div className="text-center text-sm text-gray-500 py-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>Última actualización: {lastUpdate.toLocaleString('es-CO')}</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdvanced;