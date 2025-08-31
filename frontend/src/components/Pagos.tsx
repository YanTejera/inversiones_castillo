import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
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
  AlertTriangle,
  Database
} from 'lucide-react';
const ImportExportManager = lazy(() => import('./dataManagement/ImportExportManager'));
import { pagoService } from '../services/pagoService';
import { ventaService } from '../services/ventaService';
import { cuotaService } from '../services/cuotaService';
import CancelarPagoModal from './CancelarPagoModal';
import { SkeletonCard, SkeletonList, SkeletonStats } from './Skeleton';
import { useToast } from './Toast';
import AdvancedSearch from './AdvancedSearch';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
import { pagosFilters, getSearchPlaceholder } from '../config/searchFilters';
import type { Pago, Venta, ResumenCobros } from '../types';

// Define SearchFilters locally to avoid import issues
interface SearchFilters {
  [key: string]: any;
}

const Pagos: React.FC = () => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showImportExportManager, setShowImportExportManager] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  // Advanced search setup
  const {
    searchTerm,
    filters: activeFilters,
    setSearchTerm,
    setFilters: setActiveFilters,
    debouncedSearchTerm,
    hasActiveFilters
  } = useAdvancedSearch({
    persistKey: 'pagos_search',
    debounceMs: 300
  });
  const [resumenCobros, setResumenCobros] = useState<ResumenCobros | null>(null);

  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pagoACancelar, setPagoACancelar] = useState<Pago | null>(null);

  // Legacy compatibility - will be removed
  const filters = {
    venta_id: activeFilters.venta_id || '',
    fecha_desde: activeFilters.fecha_pago?.[0] || '',
    fecha_hasta: activeFilters.fecha_pago?.[1] || '',
    tipo_pago: activeFilters.tipo_pago || ''
  };

  const loadPagos = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build API parameters from search term and filters
      const params: any = {
        page: currentPage,
        search: debouncedSearchTerm || undefined,
        tipo_pago: activeFilters.tipo_pago || undefined,
        estado_pago: activeFilters.estado_pago || undefined,
        cliente_nombre: activeFilters.cliente_nombre || undefined,
        numero_recibo: activeFilters.numero_recibo || undefined
      };
      
      // Handle venta_id filter
      if (activeFilters.venta_id) {
        params.venta_id = parseInt(activeFilters.venta_id);
      }
      
      // Handle date ranges
      if (activeFilters.fecha_pago && Array.isArray(activeFilters.fecha_pago)) {
        const [startDate, endDate] = activeFilters.fecha_pago;
        if (startDate) params.fecha_desde = startDate;
        if (endDate) params.fecha_hasta = endDate;
      }
      
      // Handle number ranges
      if (activeFilters.monto_pagado && Array.isArray(activeFilters.monto_pagado)) {
        const [minMonto, maxMonto] = activeFilters.monto_pagado;
        if (minMonto) params.monto_min = minMonto;
        if (maxMonto) params.monto_max = maxMonto;
      }
      
      // Remove undefined parameters
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await pagoService.getPagos(
        params.page,
        params.venta_id,
        params.fecha_desde,
        params.fecha_hasta,
        params.tipo_pago,
        params.search,
        params // Pass additional parameters
      );
      
      setPagos(response.results);
      setTotalCount(response.count);
      setTotalPages(Math.ceil(response.count / 20)); // 20 items per page
      
    } catch (error: any) {
      console.error('Error loading pagos:', error);
      const errorMsg = 'Error al cargar los pagos';
      setError(errorMsg);
      showError(errorMsg);
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
      showError('Error al cargar el resumen de cobros');
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
  }, [currentPage, debouncedSearchTerm, activeFilters]);

  useEffect(() => {
    loadVentas();
  }, []);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setActiveFilters(newFilters);
    setCurrentPage(1);
  };
  
  const handleSearchReset = () => {
    setSearchTerm('');
    setActiveFilters({});
    setCurrentPage(1);
    info('Búsqueda reiniciada');
  };

  // All filtering is now handled on the server side through advanced search
  const filteredPagos = pagos;

  const handleViewPago = (pago: Pago) => {
    setSelectedPago(pago);
    setSelectedVenta(pago.venta_info || null);
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
        return <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };


  if (loading && pagos.length === 0) {
    return (
      <div className="space-y-6 page-fade-in">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Resumen Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 staggered-fade-in">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 border rounded-lg p-4 shimmer">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mr-3"></div>
                <div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {[...Array(8)].map((_, index) => (
                    <th key={index} className="px-6 py-3">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {[...Array(5)].map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Pagos</h1>
          <p className="text-gray-600 dark:text-gray-400">Administra los pagos y cobros del sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportExportManager(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-green-700 btn-press micro-glow"
          >
            <Database className="h-5 w-5" />
            <span>Importar/Exportar</span>
          </button>
          <Link
            to="/pagos/nuevo"
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-blue-700 btn-press micro-glow"
          >
            <Plus className="h-5 w-5" />
            <span>Registrar Pago</span>
          </Link>
        </div>
      </div>

      {/* Resumen de Cobros */}
      {resumenCobros && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 staggered-fade-in">
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

      {/* Advanced Search */}
      <div className="mb-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}
        
        <AdvancedSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={pagosFilters}
          activeFilters={activeFilters}
          onFiltersChange={handleFiltersChange}
          placeholder={getSearchPlaceholder('pagos')}
          onReset={handleSearchReset}
          loading={loading}
          className="animate-fade-in-up"
        />
        
        <div className="flex justify-end mt-4">
          <button
            onClick={loadPagos}
            className="px-4 py-2 bg-gray-100 rounded-md flex items-center space-x-2 hover:bg-gray-200 btn-press micro-scale"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Venta / Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cobrador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <>
                  {[...Array(5)].map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-20 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-20 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <div className="h-8 w-8 bg-gray-200 rounded"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : pagos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay pagos registrados</h3>
                      <p>No se encontraron pagos que coincidan con los criterios de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-gray-50 dark:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">#{pago.id}</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Venta #{pago.venta}</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
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
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {pago.tipo_pago.charAt(0).toUpperCase() + pago.tipo_pago.slice(1)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatDate(pago.fecha_pago)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
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
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50"
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
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>


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

      {/* Import/Export Manager */}
      {showImportExportManager && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 rounded-lg p-8">Cargando...</div></div>}>
          <ImportExportManager 
            defaultType="pagos"
            onClose={() => setShowImportExportManager(false)}
          />
        </Suspense>
      )}

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default Pagos;