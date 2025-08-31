import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  Users,
  Package,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface DashboardBasicData {
  ventas_hoy: { total: number; count: number };
  ventas_mes: { total: number; count: number };
  pagos_hoy: { total: number; count: number };
  stock_critico: number;
  clientes_activos: number;
  total_inventario: number;
  cuentas_por_cobrar: number;
}

const DashboardClassic: React.FC = () => {
  const [data, setData] = useState<DashboardBasicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/pagos/dashboard/');
      setData(response.data);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError('Error al cargar datos del dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 3 minutes
    const interval = setInterval(loadDashboardData, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700 shimmer">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gray-200 rounded animate-pulse mr-4"></div>
                <div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700 shimmer">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700 shimmer">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Dashboard Clásico</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Resumen ejecutivo de la empresa</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadDashboardData}
            className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Métricas Principales - Grid más simple */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Ventas de Hoy */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Ventas Hoy</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                {formatCurrency(data.ventas_hoy?.total || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{data.ventas_hoy?.count || 0} operaciones</p>
            </div>
          </div>
        </div>

        {/* Ventas del Mes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ventas del Mes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.ventas_mes?.total || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{data.ventas_mes?.count || 0} ventas</p>
            </div>
          </div>
        </div>

        {/* Pagos de Hoy */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pagos Hoy</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.pagos_hoy?.total || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{data.pagos_hoy?.count || 0} pagos</p>
            </div>
          </div>
        </div>

        {/* Stock Crítico */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock Crítico</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {data.stock_critico || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">productos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Información Secundaria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Accesos Rápidos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accesos Rápidos</h3>
          <div className="space-y-3">
            <Link 
              to="/ventas/nueva" 
              className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <ShoppingCart className="h-5 w-5 text-blue-600 mr-3" />
              <span className="text-blue-700 font-medium">Nueva Venta</span>
            </Link>
            <Link 
              to="/clientes" 
              className="flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <Users className="h-5 w-5 text-green-600 mr-3" />
              <span className="text-green-700 font-medium">Ver Clientes</span>
            </Link>
            <Link 
              to="/motos" 
              className="flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <Package className="h-5 w-5 text-purple-600 mr-3" />
              <span className="text-purple-700 font-medium">Inventario</span>
            </Link>
            <Link 
              to="/cobros-pendientes" 
              className="flex items-center p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <CreditCard className="h-5 w-5 text-orange-600 mr-3" />
              <span className="text-orange-700 font-medium">Cobros Pendientes</span>
            </Link>
          </div>
        </div>

        {/* Resumen Financiero */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumen Financiero</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Valor Inventario</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(data.total_inventario || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Por Cobrar</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(data.cuentas_por_cobrar || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Clientes Activos</span>
              <span className="font-semibold text-blue-600">
                {data.clientes_activos || 0}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <Link 
                to="/reportes" 
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver reportes detallados
              </Link>
            </div>
          </div>
        </div>

        {/* Alertas y Notificaciones */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estado del Sistema</h3>
          <div className="space-y-4">
            
            {/* Stock Crítico Alert */}
            {data.stock_critico > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-red-700 text-sm font-medium">
                    {data.stock_critico} productos con stock bajo
                  </span>
                </div>
              </div>
            )}

            {/* Cuentas por Cobrar Alert */}
            {data.cuentas_por_cobrar > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-yellow-700 text-sm font-medium">
                    Revisar cuentas por cobrar
                  </span>
                </div>
              </div>
            )}

            {/* Ventas del día */}
            {(data.ventas_hoy?.count || 0) > 0 ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-green-700 text-sm font-medium">
                    {data.ventas_hoy.count} ventas realizadas hoy
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-300 mr-2" />
                  <span className="text-gray-700 text-sm font-medium">
                    Sin ventas registradas hoy
                  </span>
                </div>
              </div>
            )}
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

export default DashboardClassic;