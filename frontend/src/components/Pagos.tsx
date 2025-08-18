import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Filter,
  Calendar,
  DollarSign,
  CreditCard,
  Banknote,
  Receipt,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  User,
  X,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { pagoService } from '../services/pagoService';
import { ventaService } from '../services/ventaService';
import { cuotaService } from '../services/cuotaService';
import PagoForm from './PagoForm';
import CancelarPagoModal from './CancelarPagoModal';
import type { Pago, Venta, ResumenCobros } from '../types';

const Pagos: React.FC = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [resumenCobros, setResumenCobros] = useState<ResumenCobros | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pagoACancelar, setPagoACancelar] = useState<Pago | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    venta_id: '',
    fecha_desde: '',
    fecha_hasta: '',
    tipo_pago: ''
  });

  const loadPagos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const ventaId = filters.venta_id ? parseInt(filters.venta_id) : undefined;
      const response = await pagoService.getPagos(
        currentPage,
        ventaId,
        filters.fecha_desde || undefined,
        filters.fecha_hasta || undefined,
        filters.tipo_pago || undefined,
        searchTerm || undefined
      );
      
      setPagos(response.results);
      setTotalCount(response.count);
      setTotalPages(Math.ceil(response.count / 20)); // 20 items per page
      
    } catch (error: any) {
      console.error('Error loading pagos:', error);
      setError('Error al cargar los pagos');
      setPagos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadResumenCobros = async () => {
    try {
      const resumen = await cuotaService.getResumenCobros();
      setResumenCobros(resumen);
    } catch (error) {
      console.error('Error loading resumen:', error);
    }
  };

  const loadVentas = async () => {
    try {
      const response = await ventaService.getVentas(1, 100); // Get more ventas for selection
      setVentas(response.results);
    } catch (error) {
      console.error('Error loading ventas:', error);
    }
  };

  useEffect(() => {
    loadPagos();
    loadResumenCobros();
  }, [currentPage, filters, searchTerm]);

  useEffect(() => {
    loadVentas();
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Reset to first page when searching
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  // Search and filtering is now handled on the server side
  const filteredPagos = pagos;

  const handleCreatePago = (venta?: Venta) => {
    setSelectedPago(null);
    setSelectedVenta(venta || null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEditPago = (pago: Pago) => {
    setSelectedPago(pago);
    setSelectedVenta(pago.venta_info || null);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleViewPago = (pago: Pago) => {
    setSelectedPago(pago);
    setSelectedVenta(pago.venta_info || null);
    setFormMode('view');
    setShowForm(true);
  };

  const handleDeletePago = async (pago: Pago) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar este pago de $${formatCurrency(pago.monto_pagado)}?`)) {
      return;
    }

    try {
      await pagoService.deletePago(pago.id);
      await loadPagos();
    } catch (error: any) {
      console.error('Error deleting pago:', error);
      setError('Error al eliminar el pago');
    }
  };

  const handleFormSave = async () => {
    await loadPagos();
    await loadResumenCobros();
  };

  const handleCancelarPago = (pago: Pago) => {
    setPagoACancelar(pago);
    setShowCancelModal(true);
  };

  const handleConfirmarCancelacion = async (motivo: string, descripcion: string) => {
    if (!pagoACancelar) return;

    try {
      await pagoService.cancelarPago(pagoACancelar.id, { motivo, descripcion });
      
      // Recargar datos
      await loadPagos();
      await loadResumenCobros();
      
      // Cerrar modal
      setShowCancelModal(false);
      setPagoACancelar(null);
      
    } catch (error: any) {
      console.error('Error cancelando pago:', error);
      throw new Error(error.response?.data?.message || error.message || 'Error al cancelar el pago');
    }
  };

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoPagoIcon = (tipo: string) => {
    switch (tipo) {
      case 'efectivo':
        return <Banknote className="h-4 w-4 text-green-600" />;
      case 'transferencia':
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case 'tarjeta':
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      case 'cheque':
        return <Receipt className="h-4 w-4 text-orange-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const clearFilters = () => {
    setFilters({
      venta_id: '',
      fecha_desde: '',
      fecha_hasta: '',
      tipo_pago: ''
    });
    setCurrentPage(1);
  };

  if (loading && pagos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h1>
          <p className="text-gray-600">Administra los pagos y cobros del sistema</p>
        </div>
        <button
          onClick={() => handleCreatePago()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span>Registrar Pago</span>
        </button>
      </div>

      {/* Resumen de Cobros */}
      {resumenCobros && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-red-600 text-sm font-medium">Cuotas Vencidas</p>
                <p className="text-2xl font-bold text-red-800">{resumenCobros.cuotas_vencidas}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-yellow-600 text-sm font-medium">Próximas a Vencer</p>
                <p className="text-2xl font-bold text-yellow-800">{resumenCobros.cuotas_proximas_vencer}</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-orange-600 text-sm font-medium">Monto Vencido</p>
                <p className="text-xl font-bold text-orange-800">{formatCurrency(resumenCobros.total_monto_vencido)}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-blue-600 text-sm font-medium">Alertas Activas</p>
                <p className="text-2xl font-bold text-blue-800">{resumenCobros.alertas_activas}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <User className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-red-600 text-sm font-medium">Ventas de Riesgo</p>
                <p className="text-2xl font-bold text-red-800">{resumenCobros.ventas_alto_riesgo}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Búsqueda y Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por cliente, venta ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-md flex items-center space-x-2 hover:bg-gray-50"
          >
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </button>
          <button
            onClick={loadPagos}
            className="px-4 py-2 bg-gray-100 rounded-md flex items-center space-x-2 hover:bg-gray-200"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Panel de Filtros */}
        {showFilters && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={filters.fecha_desde}
                  onChange={(e) => setFilters(prev => ({ ...prev, fecha_desde: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={filters.fecha_hasta}
                  onChange={(e) => setFilters(prev => ({ ...prev, fecha_hasta: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Pago
                </label>
                <select
                  value={filters.tipo_pago}
                  onChange={(e) => setFilters(prev => ({ ...prev, tipo_pago: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Venta
                </label>
                <input
                  type="number"
                  value={filters.venta_id}
                  onChange={(e) => setFilters(prev => ({ ...prev, venta_id: e.target.value }))}
                  placeholder="ID de venta"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Limpiar Filtros</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de Pagos */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venta / Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cobrador
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Cargando pagos...</span>
                    </div>
                  </td>
                </tr>
              ) : pagos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay pagos registrados</h3>
                      <p>No se encontraron pagos que coincidan con los criterios de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{pago.id}</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-600">Venta #{pago.venta}</div>
                        <div className="text-sm font-medium text-gray-900">
                          {pago.venta_info?.cliente_info?.nombre} {pago.venta_info?.cliente_info?.apellido}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(pago.monto_pagado)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTipoPagoIcon(pago.tipo_pago)}
                        <span className="ml-2 text-sm text-gray-900">
                          {pago.tipo_pago.charAt(0).toUpperCase() + pago.tipo_pago.slice(1)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {formatDate(pago.fecha_pago)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {pago.usuario_cobrador_info?.first_name} {pago.usuario_cobrador_info?.last_name}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pago.estado === 'cancelado' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {pago.estado === 'cancelado' ? 'Cancelado' : 'Completado'}
                      </span>
                      {pago.estado === 'cancelado' && pago.motivo_cancelacion_display && (
                        <div className="text-xs text-gray-500 mt-1">
                          {pago.motivo_cancelacion_display}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewPago(pago)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {pago.estado !== 'cancelado' && (
                          <button
                            onClick={() => handleCancelarPago(pago)}
                            className="text-red-600 hover:text-red-900"
                            title="Cancelar pago"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
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

      {/* Pago Form Modal */}
      {showForm && (
        <PagoForm
          pago={selectedPago}
          venta={selectedVenta}
          mode={formMode}
          onClose={() => setShowForm(false)}
          onSave={handleFormSave}
        />
      )}

      {/* Cancel Pago Modal */}
      {showCancelModal && pagoACancelar && (
        <CancelarPagoModal
          pago={pagoACancelar}
          onClose={() => {
            setShowCancelModal(false);
            setPagoACancelar(null);
          }}
          onConfirm={handleConfirmarCancelacion}
        />
      )}
    </div>
  );
};

export default Pagos;