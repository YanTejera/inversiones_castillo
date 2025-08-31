import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  PieChart,
  LineChart,
  Activity,
  Award,
} from 'lucide-react';

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('kpis');
  const [timeRange, setTimeRange] = useState('30d');

  const tabs = [
    { id: 'kpis', label: 'KPIs Principales', icon: Target },
    { id: 'ventas', label: 'Análisis de Ventas', icon: TrendingUp },
    { id: 'clientes', label: 'Comportamiento de Clientes', icon: Users },
    { id: 'productos', label: 'Performance de Productos', icon: Award },
  ];

  const timeRanges = [
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '90d', label: 'Últimos 3 meses' },
    { value: '1y', label: 'Último año' },
  ];

  const mockKPIs = {
    ventasMes: {
      value: 1250000,
      change: 15.3,
      trend: 'up'
    },
    clientesNuevos: {
      value: 47,
      change: -8.2,
      trend: 'down'
    },
    conversionRate: {
      value: 24.5,
      change: 2.1,
      trend: 'up'
    },
    ticketPromedio: {
      value: 850000,
      change: 5.7,
      trend: 'up'
    }
  };

  const mockTopProducts = [
    { name: 'Honda CBR 250R', ventas: 15, ingresos: 4500000 },
    { name: 'Yamaha MT-03', ventas: 12, ingresos: 3600000 },
    { name: 'Kawasaki Ninja 300', ventas: 9, ingresos: 2700000 },
    { name: 'Suzuki GSX-R125', ventas: 8, ingresos: 2400000 },
    { name: 'BMW G 310 R', ventas: 6, ingresos: 1800000 },
  ];

  const mockCustomerSegments = [
    { segment: 'Nuevos Compradores', count: 156, percentage: 35 },
    { segment: 'Clientes Frecuentes', count: 89, percentage: 20 },
    { segment: 'Clientes VIP', count: 67, percentage: 15 },
    { segment: 'Clientes Inactivos', count: 134, percentage: 30 },
  ];

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="h-8 w-8 mr-3 text-purple-600" />
              Analytics & Insights
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Análisis detallado del rendimiento del negocio
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
              <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* KPIs Tab */}
      {activeTab === 'kpis' && (
        <div className="space-y-6">
          {/* Main KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ventas del Mes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(mockKPIs.ventasMes.value)}
                  </p>
                </div>
                <div className={`flex items-center ${mockKPIs.ventasMes.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {mockKPIs.ventasMes.trend === 'up' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  <span className="ml-1 text-sm font-medium">
                    {formatChange(mockKPIs.ventasMes.change)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clientes Nuevos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockKPIs.clientesNuevos.value}</p>
                </div>
                <div className={`flex items-center ${mockKPIs.clientesNuevos.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {mockKPIs.clientesNuevos.trend === 'up' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  <span className="ml-1 text-sm font-medium">
                    {formatChange(mockKPIs.clientesNuevos.change)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasa de Conversión</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockKPIs.conversionRate.value}%</p>
                </div>
                <div className={`flex items-center ${mockKPIs.conversionRate.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {mockKPIs.conversionRate.trend === 'up' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  <span className="ml-1 text-sm font-medium">
                    {formatChange(mockKPIs.conversionRate.change)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(mockKPIs.ticketPromedio.value)}
                  </p>
                </div>
                <div className={`flex items-center ${mockKPIs.ticketPromedio.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {mockKPIs.ticketPromedio.trend === 'up' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  <span className="ml-1 text-sm font-medium">
                    {formatChange(mockKPIs.ticketPromedio.change)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tendencia de Ventas</h3>
                <LineChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-center py-12">
                <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Gráfico de tendencias en desarrollo</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribución por Categoría</h3>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-center py-12">
                <PieChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Gráfico circular en desarrollo</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ventas Tab */}
      {activeTab === 'ventas' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Productos Más Vendidos</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Producto</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Unidades</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Ingresos</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">% del Total</th>
                </tr>
              </thead>
              <tbody>
                {mockTopProducts.map((product, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-4">
                      <div className="flex items-center">
                        <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full mr-3">
                          <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-600 dark:text-gray-400">{product.ventas}</td>
                    <td className="py-4 text-gray-900 dark:text-white font-medium">
                      {formatCurrency(product.ingresos)}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{width: `${(product.ventas / mockTopProducts[0].ventas) * 100}%`}}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {Math.round((product.ventas / mockTopProducts[0].ventas) * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clientes Tab */}
      {activeTab === 'clientes' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Segmentación de Clientes</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockCustomerSegments.map((segment, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{segment.segment}</h4>
                  <span className="text-2xl font-bold text-purple-600">{segment.count}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{width: `${segment.percentage}%`}}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{segment.percentage}% del total</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Productos Tab */}
      {activeTab === 'productos' && (
        <div className="text-center py-12">
          <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Análisis de Performance de Productos
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Esta sección incluirá análisis detallado de rotación, márgenes, 
            y performance de cada producto. En desarrollo.
          </p>
        </div>
      )}
    </div>
  );
};

export default Analytics;