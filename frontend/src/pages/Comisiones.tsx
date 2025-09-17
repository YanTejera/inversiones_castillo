import React, { useState } from 'react';
import {
  DollarSign,
  Users,
  Target,
  TrendingUp,
  Settings,
  Award,
  BarChart3,
  Percent
} from 'lucide-react';

const Comisiones: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schemes' | 'assignments' | 'goals' | 'payments'>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'schemes', label: 'Esquemas', icon: Settings },
    { id: 'assignments', label: 'Asignaciones', icon: Users },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'payments', label: 'Pagos', icon: DollarSign },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <Percent className="h-8 w-8 mr-3 text-green-600" />
          Sistema de Comisiones
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gestión completa de comisiones, metas y pagos para vendedores
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Comisiones del Mes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$2,450,000</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vendedores Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Award className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Metas Cumplidas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">6</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Promedio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">3.2%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Award className="h-5 w-5 mr-2 text-yellow-600" />
          Top Vendedores del Mes
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Juan Pérez', sales: 15, commission: '$850,000', position: 1 },
            { name: 'María García', sales: 12, commission: '$720,000', position: 2 },
            { name: 'Carlos López', sales: 10, commission: '$580,000', position: 3 },
          ].map((seller) => (
            <div key={seller.name} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">{seller.name}</h3>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  seller.position === 1 ? 'bg-yellow-500' : 
                  seller.position === 2 ? 'bg-gray-400' : 'bg-amber-600'
                }`}>
                  {seller.position}
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>{seller.sales} ventas</p>
                <p className="font-semibold text-green-600">{seller.commission}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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

        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Dashboard de Comisiones
              </h3>
              
              {/* Chart placeholder */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Gráficos de tendencias, comparativas mensuales y análisis de rendimiento próximamente
                </p>
              </div>

              {/* Recent Activity */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Actividad Reciente</h4>
                <div className="space-y-3">
                  {[
                    { action: 'Comisión calculada', user: 'Juan Pérez', amount: '$125,000', time: 'Hace 2 horas' },
                    { action: 'Meta cumplida', user: 'María García', amount: '120%', time: 'Hace 4 horas' },
                    { action: 'Comisión pagada', user: 'Carlos López', amount: '$95,000', time: 'Ayer' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{activity.user}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">{activity.amount}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Other tabs with placeholders */}
          {activeTab === 'schemes' && (
            <div className="text-center py-12">
              <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Esquemas de Comisión
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Crea y gestiona diferentes esquemas: porcentaje sobre venta, utilidad, 
                monto fijo, escalado por metas y esquemas mixtos.
              </p>
              <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Próximamente
              </button>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Asignaciones
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Asigna esquemas de comisión a vendedores específicos con 
                porcentajes personalizados y vigencias definidas.
              </p>
              <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Próximamente
              </button>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="text-center py-12">
              <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Metas de Vendedores
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Define metas mensuales, trimestrales y anuales con bonificaciones 
                por cumplimiento y sobrecumplimiento.
              </p>
              <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Próximamente
              </button>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Gestión de Pagos
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Aprueba, procesa y registra pagos de comisiones. Control completo 
                del workflow: calculada → aprobada → pagada.
              </p>
              <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Próximamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comisiones;