import React, { useState, lazy, Suspense } from 'react';
import {
  Calculator,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  Building2,
  Clock
} from 'lucide-react';

// Lazy load components
const FinancingCalculator = lazy(() => import('../components/financing/FinancingCalculator'));

const Financiamiento: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'applications' | 'entities' | 'stats'>('calculator');

  const tabs = [
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    { id: 'applications', label: 'Solicitudes', icon: FileText },
    { id: 'entities', label: 'Entidades', icon: Building2 },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <CreditCard className="h-8 w-8 mr-3 text-blue-600" />
          Módulo de Financiamiento
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gestión completa de créditos, calculadora y entidades financieras
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Solicitudes Activas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En Proceso</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aprobadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">15</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entidades</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">5</p>
            </div>
          </div>
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
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
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
          {/* Calculator Tab */}
          {activeTab === 'calculator' && (
            <div>
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              }>
                <FinancingCalculator />
              </Suspense>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Gestión de Solicitudes
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Aquí podrás ver y gestionar todas las solicitudes de crédito: crear nuevas, 
                revisar documentos, aprobar/rechazar y dar seguimiento al estado.
              </p>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Próximamente
              </button>
            </div>
          )}

          {/* Entities Tab */}
          {activeTab === 'entities' && (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Entidades Financieras
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Gestiona bancos, cooperativas y financieras. Configura tasas de interés, 
                plazos, montos mínimos y máximos, y tipos de crédito disponibles.
              </p>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Próximamente
              </button>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Estadísticas y Reportes
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Dashboard con métricas de financiamiento: tasas de aprobación, 
                montos promedio, tiempos de procesamiento y análisis por entidad.
              </p>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Próximamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Financiamiento;