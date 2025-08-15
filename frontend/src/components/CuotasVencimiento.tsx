import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Search,
  Filter,
  Eye,
  Edit,
  RefreshCw
} from 'lucide-react';
import { cuotaService } from '../services/cuotaService';
import type { CuotaVencimiento } from '../types';

const CuotasVencimiento: React.FC = () => {
  const [cuotas, setCuotas] = useState<CuotaVencimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    venta_id: '',
    estado: '',
    vencidas: false
  });

  const loadCuotas = async () => {
    try {
      setLoading(true);
      setError('');
      
      const ventaId = filters.venta_id ? parseInt(filters.venta_id) : undefined;
      const response = await cuotaService.getCuotas(
        currentPage,
        ventaId,
        filters.estado || undefined,
        filters.vencidas
      );
      
      setCuotas(response.results);
      setTotalCount(response.count);
      setTotalPages(Math.ceil(response.count / 10)); // Assuming 10 items per page
      
    } catch (error: any) {
      console.error('Error loading cuotas:', error);
      setError('Error al cargar las cuotas de vencimiento');
      setCuotas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCuotas();
  }, [currentPage, filters]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const filteredCuotas = cuotas.filter(cuota => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      cuota.id.toString().includes(searchLower) ||
      cuota.venta.toString().includes(searchLower) ||
      cuota.venta_info?.cliente_info?.nombre?.toLowerCase().includes(searchLower) ||
      cuota.venta_info?.cliente_info?.apellido?.toLowerCase().includes(searchLower) ||
      cuota.estado_display.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEstadoIcon = (estado: string, estaVencida: boolean) => {
    if (estaVencida) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    
    switch (estado) {
      case 'pagada':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'parcial':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'vencida':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pendiente':
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
  };

  const getEstadoColor = (estado: string, estaVencida: boolean) => {
    if (estaVencida) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    switch (estado) {
      case 'pagada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'parcial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'vencida':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pendiente':
      default:
        return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const clearFilters = () => {
    setFilters({
      venta_id: '',
      estado: '',
      vencidas: false
    });
    setCurrentPage(1);
  };

  const generarAlertas = async () => {
    try {
      await cuotaService.generarAlertasAutomaticas();
      // Recargar cuotas para ver cambios
      await loadCuotas();
    } catch (error) {
      console.error('Error generando alertas:', error);
      setError('Error al generar alertas automáticas');
    }
  };

  if (loading && cuotas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cuotas de Vencimiento</h1>
            <p className="text-gray-600 mt-1">
              {totalCount} cuota{totalCount !== 1 ? 's' : ''} programada{totalCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={generarAlertas}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generar Alertas
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por venta, cliente, estado..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-md flex items-center ${
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-md space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venta ID
                  </label>
                  <input
                    type="number"
                    value={filters.venta_id}
                    onChange={(e) => setFilters(prev => ({ ...prev, venta_id: e.target.value }))}
                    placeholder="Filtrar por venta"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={filters.estado}
                    onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="pagada">Pagada</option>
                    <option value="parcial">Pago Parcial</option>
                    <option value="vencida">Vencida</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.vencidas}
                      onChange={(e) => setFilters(prev => ({ ...prev, vencidas: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Solo cuotas vencidas</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cuotas Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venta / Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo Pendiente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCuotas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay cuotas registradas</h3>
                      <p>No se encontraron cuotas que coincidan con los criterios de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCuotas.map((cuota) => (
                  <tr key={cuota.id} className={`hover:bg-gray-50 ${cuota.esta_vencida ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{cuota.numero_cuota}</div>
                      <div className="text-xs text-gray-500">ID: {cuota.id}</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-600">Venta #{cuota.venta}</div>
                        <div className="text-sm font-medium text-gray-900">
                          {cuota.venta_info?.cliente_info?.nombre} {cuota.venta_info?.cliente_info?.apellido}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${cuota.esta_vencida ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {formatDate(cuota.fecha_vencimiento)}
                      </div>
                      {cuota.esta_vencida && (
                        <div className="text-xs text-red-500">Vencida</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(cuota.monto_cuota)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(cuota.monto_pagado)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">
                        {formatCurrency(cuota.saldo_pendiente)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoColor(cuota.estado, cuota.esta_vencida)}`}>
                        {getEstadoIcon(cuota.estado, cuota.esta_vencida)}
                        <span className="ml-1">{cuota.estado_display}</span>
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {}}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {}}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando página <span className="font-medium">{currentPage}</span> de{' '}
                  <span className="font-medium">{totalPages}</span> ({totalCount} registros)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CuotasVencimiento;