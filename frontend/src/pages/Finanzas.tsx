import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  PieChart,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Wallet,
  Building,
  FileText,
} from 'lucide-react';

const Finanzas: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeRange, setTimeRange] = useState('30d');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard Financiero', icon: BarChart3 },
    { id: 'flujo-caja', label: 'Flujo de Caja', icon: TrendingUp },
    { id: 'presupuestos', label: 'Presupuestos', icon: Target },
    { id: 'reportes', label: 'Reportes', icon: FileText },
  ];

  const timeRanges = [
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '90d', label: 'Últimos 3 meses' },
    { value: '1y', label: 'Último año' },
  ];

  const mockFinancialData = {
    ingresosMes: 3250000,
    gastosMes: 2100000,
    utilidadNeta: 1150000,
    margenBruto: 35.4,
    flujoCaja: 850000,
    cuentasPorCobrar: 1850000,
    cuentasPorPagar: 980000,
    inventarioValor: 12500000,
  };

  const mockExpenseCategories = [
    { category: 'Inventario', amount: 1200000, percentage: 57, color: 'bg-blue-500' },
    { category: 'Salarios', amount: 350000, percentage: 17, color: 'bg-green-500' },
    { category: 'Alquiler', amount: 200000, percentage: 10, color: 'bg-yellow-500' },
    { category: 'Marketing', amount: 150000, percentage: 7, color: 'bg-purple-500' },
    { category: 'Servicios', amount: 100000, percentage: 5, color: 'bg-pink-500' },
    { category: 'Otros', amount: 100000, percentage: 4, color: 'bg-gray-500' },
  ];

  const mockBudgetItems = [
    { 
      category: 'Ventas', 
      budgeted: 3000000, 
      actual: 3250000, 
      variance: 8.3, 
      status: 'positive' 
    },
    { 
      category: 'Marketing', 
      budgeted: 120000, 
      actual: 150000, 
      variance: -25, 
      status: 'negative' 
    },
    { 
      category: 'Operaciones', 
      budgeted: 800000, 
      actual: 750000, 
      variance: 6.25, 
      status: 'positive' 
    },
    { 
      category: 'Personal', 
      budgeted: 400000, 
      actual: 380000, 
      variance: 5, 
      status: 'positive' 
    },
  ];

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatPercentage = (percent: number) => {
    return `${percent > 0 ? '+' : ''}${percent}%`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <DollarSign className="h-8 w-8 mr-3 text-green-600" />
              Centro Financiero
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Control y análisis financiero completo del negocio
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
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
                      ? 'border-green-500 text-green-600 dark:text-green-400'
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

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Financial KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ingresos del Mes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(mockFinancialData.ingresosMes)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gastos del Mes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(mockFinancialData.gastosMes)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilidad Neta</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(mockFinancialData.utilidadNeta)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Margen Bruto</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mockFinancialData.margenBruto}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Flow and Accounts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estado Financiero</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center">
                    <Wallet className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-900 dark:text-white">Flujo de Caja</span>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(mockFinancialData.flujoCaja)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-gray-900 dark:text-white">Cuentas por Cobrar</span>
                  </div>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(mockFinancialData.cuentasPorCobrar)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-orange-600 mr-3" />
                    <span className="text-gray-900 dark:text-white">Cuentas por Pagar</span>
                  </div>
                  <span className="font-bold text-orange-600">
                    {formatCurrency(mockFinancialData.cuentasPorPagar)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="text-gray-900 dark:text-white">Valor del Inventario</span>
                  </div>
                  <span className="font-bold text-purple-600">
                    {formatCurrency(mockFinancialData.inventarioValor)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribución de Gastos</h3>
              
              <div className="space-y-3">
                {mockExpenseCategories.map((expense, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className={`w-3 h-3 rounded-full ${expense.color} mr-3`}></div>
                      <span className="text-gray-900 dark:text-white text-sm">{expense.category}</span>
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${expense.color}`}
                            style={{width: `${expense.percentage}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(expense.amount)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {expense.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flujo de Caja Tab */}
      {activeTab === 'flujo-caja' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Proyección de Flujo de Caja
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Esta sección incluirá gráficos interactivos de flujo de caja, 
              proyecciones y análisis de tendencias. En desarrollo.
            </p>
          </div>
        </div>
      )}

      {/* Presupuestos Tab */}
      {activeTab === 'presupuestos' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Análisis Presupuestario</h3>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
              Nuevo Presupuesto
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Categoría</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Presupuestado</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Real</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Varianza</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Estado</th>
                </tr>
              </thead>
              <tbody>
                {mockBudgetItems.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-4 font-medium text-gray-900 dark:text-white">{item.category}</td>
                    <td className="py-4 text-gray-600 dark:text-gray-400">
                      {formatCurrency(item.budgeted)}
                    </td>
                    <td className="py-4 text-gray-900 dark:text-white font-medium">
                      {formatCurrency(item.actual)}
                    </td>
                    <td className="py-4">
                      <span className={`font-medium ${
                        item.status === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(item.variance)}
                      </span>
                    </td>
                    <td className="py-4">
                      {item.status === 'positive' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reportes Tab */}
      {activeTab === 'reportes' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Reportes Financieros
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Esta sección incluirá estados financieros, balances, 
              estado de resultados y reportes personalizados. En desarrollo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finanzas;