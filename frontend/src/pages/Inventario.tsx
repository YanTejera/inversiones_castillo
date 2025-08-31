import React, { useState } from 'react';
import {
  Package,
  MapPin,
  BarChart3,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  ArrowUpDown,
  Boxes,
  TrendingDown,
  Warehouse,
} from 'lucide-react';

const Inventario: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'locations', label: 'Ubicaciones', icon: MapPin },
    { id: 'movements', label: 'Movimientos', icon: ArrowUpDown },
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
  ];

  const mockStats = {
    totalProducts: 145,
    totalValue: 2450000,
    lowStockItems: 12,
    outOfStock: 3,
    movements: 87,
  };

  const mockLocations = [
    { id: 1, name: 'Almacén Principal', zone: 'A', items: 45, capacity: 100 },
    { id: 2, name: 'Showroom', zone: 'S', items: 12, capacity: 20 },
    { id: 3, name: 'Taller', zone: 'T', items: 8, capacity: 15 },
    { id: 4, name: 'Repuestos', zone: 'R', items: 80, capacity: 150 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <Package className="h-8 w-8 mr-3 text-blue-600" />
          Gestión de Inventario
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Control de stock, ubicaciones y movimientos de inventario
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Boxes className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${mockStats.totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stock Bajo</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.lowStockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sin Stock</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.outOfStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <ArrowUpDown className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Movimientos Hoy</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.movements}</p>
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
                  onClick={() => setActiveTab(tab.id)}
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resumen de Inventario</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Movimiento
                </button>
              </div>
              
              <div className="text-center py-12">
                <Warehouse className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Panel de Control de Inventario
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Aquí podrás ver gráficos de rotación de inventario, productos más vendidos, 
                  y análisis de stock. Esta sección está en desarrollo.
                </p>
              </div>
            </div>
          )}

          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ubicaciones del Almacén</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Ubicación
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockLocations.map((location) => (
                  <div key={location.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mr-3">
                          <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{location.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Zona {location.zone}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Ocupación</span>
                        <span className="font-medium">{location.items}/{location.capacity}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{width: `${(location.items / location.capacity) * 100}%`}}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-3 space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 p-1">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-700 p-1">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other tabs placeholder */}
          {(activeTab === 'movements' || activeTab === 'alerts') && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {activeTab === 'movements' ? 'Movimientos de Inventario' : 'Alertas de Stock'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Esta sección está en desarrollo y pronto incluirá funcionalidades para 
                {activeTab === 'movements' ? ' rastrear todos los movimientos de productos.' : ' gestionar alertas de stock mínimo y reabastecimiento.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventario;