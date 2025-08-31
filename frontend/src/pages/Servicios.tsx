import React, { useState } from 'react';
import {
  Wrench,
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Settings,
  Users,
} from 'lucide-react';

const Servicios: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ordenes');

  const tabs = [
    { id: 'ordenes', label: 'Órdenes de Servicio', icon: Wrench },
    { id: 'calendario', label: 'Calendario', icon: Calendar },
    { id: 'tecnicos', label: 'Técnicos', icon: Users },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  const mockStats = {
    ordenesAbiertas: 23,
    ordenesHoy: 8,
    tecnicosActivos: 5,
    tiempoPromedio: '2.5h',
  };

  const mockOrdenes = [
    {
      id: 1,
      numero: 'OS-2024-001',
      cliente: 'Juan Pérez',
      moto: 'Honda CBR 250R',
      placa: 'ABC-123',
      servicio: 'Mantenimiento Preventivo',
      tecnico: 'Carlos Rodríguez',
      estado: 'En Progreso',
      fecha: '2024-01-15',
      prioridad: 'Normal',
    },
    {
      id: 2,
      numero: 'OS-2024-002',
      cliente: 'María García',
      moto: 'Yamaha MT-03',
      placa: 'DEF-456',
      servicio: 'Reparación Motor',
      tecnico: 'Luis Martínez',
      estado: 'Pendiente',
      fecha: '2024-01-15',
      prioridad: 'Alta',
    },
    {
      id: 3,
      numero: 'OS-2024-003',
      cliente: 'Pedro López',
      moto: 'Kawasaki Ninja 300',
      placa: 'GHI-789',
      servicio: 'Cambio de Aceite',
      tecnico: 'Ana Silva',
      estado: 'Completado',
      fecha: '2024-01-14',
      prioridad: 'Baja',
    },
  ];

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Completado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'En Progreso':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'Alta':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'Normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Baja':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <Wrench className="h-8 w-8 mr-3 text-orange-600" />
          Centro de Servicios
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gestión de órdenes de servicio, mantenimiento y reparaciones
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Órdenes Abiertas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.ordenesAbiertas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Servicios Hoy</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.ordenesHoy}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Técnicos Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.tecnicosActivos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.tiempoPromedio}</p>
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
                      ? 'border-orange-500 text-orange-600 dark:text-orange-400'
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
          {/* Órdenes Tab */}
          {activeTab === 'ordenes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Órdenes de Servicio</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar órdenes..."
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Orden
                  </button>
                </div>
              </div>

              {/* Orders Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Orden
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cliente / Vehículo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Servicio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Técnico
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Prioridad
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {mockOrdenes.map((orden) => (
                      <tr key={orden.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {orden.numero}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {orden.fecha}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {orden.cliente}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {orden.moto} - {orden.placa}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">{orden.servicio}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white">{orden.tecnico}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(orden.estado)}`}>
                            {orden.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(orden.prioridad)}`}>
                            {orden.prioridad}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button className="text-blue-600 hover:text-blue-700 p-1">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-700 p-1">
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Other tabs placeholder */}
          {(activeTab === 'calendario' || activeTab === 'tecnicos' || activeTab === 'configuracion') && (
            <div className="text-center py-12">
              <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {activeTab === 'calendario' && 'Calendario de Servicios'}
                {activeTab === 'tecnicos' && 'Gestión de Técnicos'}
                {activeTab === 'configuracion' && 'Configuración de Servicios'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Esta sección está en desarrollo y pronto incluirá funcionalidades para 
                {activeTab === 'calendario' && ' programar citas y ver la agenda de servicios.'}
                {activeTab === 'tecnicos' && ' gestionar el personal técnico y sus especialidades.'}
                {activeTab === 'configuracion' && ' configurar tipos de servicios y tarifas.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Servicios;