import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  Plus, 
  Search, 
  Eye,
  ShoppingCart,
  DollarSign,
  User,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  X,
  Database
} from 'lucide-react';
const ImportExportManager = lazy(() => import('../components/dataManagement/ImportExportManager'));
import { ventaService } from '../services/ventaService';
import NewVentaForm, { type VentaFormData } from '../components/NewVentaForm';
import CancelarVentaModal from '../components/CancelarVentaModal';
import VentaDetalleModal from '../components/VentaDetalleModal';
import ViewToggle from '../components/common/ViewToggle';
import { colors, statusColors } from '../styles/colors';
import { SkeletonCard, SkeletonList, SkeletonStats } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import AdvancedSearch from '../components/AdvancedSearch';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
import { ventasFilters, getSearchPlaceholder } from '../config/searchFilters';
import type { Venta } from '../types';

// Define SearchFilters locally to avoid import issues
interface SearchFilters {
  [key: string]: any;
}

const Ventas: React.FC = () => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImportExportManager, setShowImportExportManager] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Advanced search setup
  const {
    searchTerm,
    filters: activeFilters,
    setSearchTerm,
    setFilters: setActiveFilters,
    debouncedSearchTerm,
    hasActiveFilters
  } = useAdvancedSearch({
    persistKey: 'ventas_search',
    debounceMs: 300
  });
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [ventaACancelar, setVentaACancelar] = useState<Venta | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('ventas_view_mode');
    return (saved as 'grid' | 'list') || 'grid';
  });

  // Guardar la configuración de vista cuando cambie
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('ventas_view_mode', mode);
  };

  const loadVentas = async (page = 1, search = '', filters: SearchFilters = {}) => {
    try {
      setLoading(true);
      
      // Build API parameters from search term and filters
      const params: any = {
        page,
        search: search || undefined,
        estado: filters.estado || undefined,
        tipo_venta: filters.tipo_venta || undefined,
        cliente_nombre: filters.cliente_nombre || undefined
      };
      
      // Handle date ranges
      if (filters.fecha_venta && Array.isArray(filters.fecha_venta)) {
        const [startDate, endDate] = filters.fecha_venta;
        if (startDate) params.fecha_inicio = startDate;
        if (endDate) params.fecha_fin = endDate;
      }
      
      // Handle number ranges
      if (filters.monto_total && Array.isArray(filters.monto_total)) {
        const [minMonto, maxMonto] = filters.monto_total;
        if (minMonto) params.monto_min = minMonto;
        if (maxMonto) params.monto_max = maxMonto;
      }
      
      if (filters.saldo_pendiente && Array.isArray(filters.saldo_pendiente)) {
        const [minSaldo, maxSaldo] = filters.saldo_pendiente;
        if (minSaldo) params.saldo_min = minSaldo;
        if (maxSaldo) params.saldo_max = maxSaldo;
      }
      
      // Remove undefined parameters
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await ventaService.getVentas(page, search, params.estado, params);
      setVentas(response.results);
      setTotalPages(Math.ceil(response.count / 20)); // Asumiendo 20 items por página
    } catch (err) {
      const errorMsg = 'Error al cargar ventas';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error loading ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVentas(currentPage, debouncedSearchTerm, activeFilters);
  }, [currentPage, debouncedSearchTerm, activeFilters]);

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
  
  // Quick filter handlers for legacy compatibility
  const handleEstadoChange = (estado: string) => {
    const newFilters = { ...activeFilters };
    if (estado) {
      newFilters.estado = estado;
    } else {
      delete newFilters.estado;
    }
    setActiveFilters(newFilters);
    setCurrentPage(1);
  };

  const handleDelete = async (venta: Venta) => {
    if (window.confirm(`¿Estás seguro de eliminar la venta #${venta.id}?`)) {
      try {
        await ventaService.deleteVenta(venta.id);
        loadVentas(currentPage, debouncedSearchTerm, activeFilters);
      } catch (err) {
        alert('Error al eliminar venta');
        console.error('Error deleting venta:', err);
      }
    }
  };

  const handleCambiarEstado = async (venta: Venta, nuevoEstado: 'activa' | 'finalizada') => {
    if (window.confirm(`¿Cambiar estado de la venta a "${nuevoEstado}"?`)) {
      try {
        await ventaService.cambiarEstadoVenta(venta.id, nuevoEstado);
        loadVentas(currentPage, debouncedSearchTerm, activeFilters);
      } catch (err) {
        alert('Error al cambiar estado de venta');
        console.error('Error changing venta status:', err);
      }
    }
  };

  const handleCancelarVenta = (venta: Venta) => {
    setVentaACancelar(venta);
    setShowCancelModal(true);
  };

  const handleConfirmarCancelacion = async (motivo: string, descripcion: string) => {
    if (!ventaACancelar) return;

    try {
      await ventaService.cancelarVenta(ventaACancelar.id, { motivo, descripcion });
      setShowCancelModal(false);
      setVentaACancelar(null);
      loadVentas(currentPage, debouncedSearchTerm, activeFilters);
    } catch (err) {
      console.error('Error al cancelar venta:', err);
      alert('Error al cancelar la venta');
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const openModal = (mode: 'view' | 'edit', venta?: Venta) => {
    setSelectedVenta(venta || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVenta(null);
  };

  const handleSaveDraft = async (data: VentaFormData) => {
    try {
      if (!data.customer) {
        throw new Error('Debe seleccionar un cliente para guardar el borrador');
      }

      console.log('Guardando borrador de venta:', data);
      
      const draftResult = await ventaService.saveDraft({
        cliente_id: data.customer.id,
        draft_data: data,
        draft_id: data.draftId
      });

      console.log('Borrador guardado exitosamente:', draftResult);
      
      // Mostrar mensaje de éxito
      alert(`Borrador guardado exitosamente! ID: ${draftResult.id}`);
      
    } catch (error: any) {
      console.error('Error guardando borrador:', error);
      
      let errorMessage = 'Error al guardar el borrador';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleFormSave = async (data: VentaFormData) => {
    try {
      console.log('Saving venta data:', data);
      
      if (!data.customer || !data.selectedMotorcycle) {
        throw new Error('Faltan datos requeridos para la venta');
      }

      const totalAmount = data.selectedMotorcycle.precio_unitario * data.selectedMotorcycle.cantidad;

      // Preparar datos para el nuevo servicio mejorado
      const ventaData = {
        cliente_id: data.customer.id,
        tipo_venta: data.paymentType,
        motorcycle: {
          tipo: data.selectedMotorcycle.tipo,
          modelo_id: data.selectedMotorcycle.tipo === 'modelo' ? data.selectedMotorcycle.modelo?.id : undefined,
          moto_id: data.selectedMotorcycle.tipo === 'individual' ? data.selectedMotorcycle.moto?.id : undefined,
          color: data.selectedMotorcycle.color,
          chasis: data.selectedMotorcycle.chasis,
          cantidad: data.selectedMotorcycle.cantidad,
          precio_unitario: data.selectedMotorcycle.precio_unitario
        },
        payment: {
          monto_total: totalAmount,
          monto_inicial: data.paymentType === 'financiado' ? data.downPayment : totalAmount,
          cuotas: data.paymentType === 'financiado' ? data.financingDetails.numberOfPayments : undefined,
          tasa_interes: data.paymentType === 'financiado' ? data.financingDetails.interestRate : undefined,
          pago_mensual: data.paymentType === 'financiado' ? data.financingDetails.paymentAmount : undefined,
          monto_total_con_intereses: data.paymentType === 'financiado' ? data.financingDetails.totalAmount : totalAmount
        },
        documentos: data.allSelectedDocuments || [],
        observaciones: data.observations || ''
      };

      console.log('Prepared venta data for API:', ventaData);

      // Crear la venta usando el nuevo método mejorado
      const newVenta = await ventaService.createVentaFromForm(ventaData);
      console.log('Venta created successfully:', newVenta);
      
      // Recargar la lista de ventas
      await loadVentas(currentPage, debouncedSearchTerm, activeFilters);
      
      // Cerrar el modal
      closeCreateModal();
      
      // Mostrar mensaje de éxito
      alert(`Venta #${newVenta.id} registrada exitosamente!`);
      
    } catch (error) {
      console.error('Error saving venta:', error);
      setError(`Error al guardar la venta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa':
        return statusColors.venta.activa;
      case 'finalizada':
        return statusColors.venta.finalizada;
      case 'cancelada':
        return statusColors.venta.cancelada;
      default:
        return colors.badge.neutral;
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activa':
        return <Clock className="h-4 w-4" />;
      case 'finalizada':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelada':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTipoVentaColor = (tipo: string) => {
    return tipo === 'contado' ? 'text-green-600' : 'text-blue-600';
  };

  if (loading && ventas.length === 0) {
    return (
      <div className="page-fade-in">
        {/* Header skeleton */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Filters skeleton */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex space-x-2 animate-fade-in-left">
            <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Loading State */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 staggered-fade-in">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-fade-in">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Ventas</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
              Administra todas las ventas de motocicletas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImportExportManager(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 btn-press micro-glow flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Importar/Exportar
            </button>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 btn-press micro-glow flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Venta
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Search */}
      <div className="mb-6">
        <AdvancedSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={ventasFilters}
          activeFilters={activeFilters}
          onFiltersChange={handleFiltersChange}
          placeholder={getSearchPlaceholder('ventas')}
          onReset={handleSearchReset}
          loading={loading}
          className="animate-fade-in-up"
        />
        
        {/* View Toggle and Quick Filters */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2 animate-fade-in-left">
            <button
              onClick={() => handleEstadoChange('')}
              className={`px-3 py-1 rounded-full text-sm font-medium btn-press micro-bounce ${
                !activeFilters.estado
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => handleEstadoChange('activa')}
              className={`px-3 py-1 rounded-full text-sm font-medium btn-press micro-bounce ${
                activeFilters.estado === 'activa'
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Activas
            </button>
            <button
              onClick={() => handleEstadoChange('finalizada')}
              className={`px-3 py-1 rounded-full text-sm font-medium btn-press micro-bounce ${
                activeFilters.estado === 'finalizada'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Finalizadas
            </button>
            <button
              onClick={() => handleEstadoChange('cancelada')}
              className={`px-3 py-1 rounded-full text-sm font-medium btn-press micro-bounce ${
                activeFilters.estado === 'cancelada'
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Canceladas
            </button>
          </div>
          
          <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}


      {/* Ventas Display */}
      {!loading && (
        <>
          {viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 staggered-fade-in">
          {ventas.map((venta) => (
          <div key={venta.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 card-hover animate-fade-in-up">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Venta #{venta.id}
                </h3>
                <div className="flex items-center text-sm text-slate-500 dark:text-gray-400 mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(venta.fecha_venta)}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(venta.estado)}`}>
                  {getEstadoIcon(venta.estado)}
                  <span className="ml-1">{venta.estado_display}</span>
                </span>
                <span className={`text-sm font-medium ${getTipoVentaColor(venta.tipo_venta)}`}>
                  {venta.tipo_venta_display}
                </span>
              </div>
            </div>

            {/* Cliente */}
            <div className="flex items-center mb-4">
              <User className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-slate-700">
                {venta.cliente_info ? 
                  `${venta.cliente_info.nombre} ${venta.cliente_info.apellido}` : 
                  'Cliente no disponible'
                }
              </span>
            </div>

            {/* Detalles financieros */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700">Monto Total:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(venta.monto_total)}
                </span>
              </div>
              
              {venta.tipo_venta === 'financiado' && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">Inicial:</span>
                    <span className="font-medium">
                      {formatCurrency(venta.monto_inicial)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">Cuotas:</span>
                    <span className="font-medium">{venta.cuotas}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">Pago Mensual:</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(venta.pago_mensual)}
                    </span>
                  </div>
                  
                  {venta.saldo_pendiente > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">Saldo Pendiente:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(venta.saldo_pendiente)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Motocicleta vendida */}
            {venta.detalles && venta.detalles.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Motocicleta Vendida
                </h4>
                {venta.detalles.map((detalle, index) => (
                  <div key={index} className="bg-slate-50 dark:bg-gray-900 border-3 border-slate-300 rounded-lg p-3 mb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {detalle.producto_info?.marca} {detalle.producto_info?.modelo} {detalle.producto_info?.ano}
                        </div>
                        {detalle.producto_info?.color && (
                          <div className="text-sm text-slate-700">
                            Color: <span className="font-medium">{detalle.producto_info.color}</span>
                          </div>
                        )}
                        {detalle.producto_info?.chasis && (
                          <div className="text-sm text-slate-700">
                            Chasis: <span className="font-mono font-medium">{detalle.producto_info.chasis}</span>
                          </div>
                        )}
                        {detalle.producto_info?.cilindraje && (
                          <div className="text-sm text-slate-700">
                            {detalle.producto_info.cilindraje}cc
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          Cant: {detalle.cantidad}
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          {formatCurrency(detalle.precio_unitario)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Documentos asociados */}
            {venta.documentos_generados && venta.documentos_generados.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentos Generados
                </h4>
                <div className="space-y-2">
                  {venta.documentos_generados.slice(0, 3).map((doc, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 truncate">{doc.nombre || doc.tipo}</span>
                      <span className="text-xs text-slate-500 dark:text-gray-400">
                        {doc.fecha_creacion ? formatDate(doc.fecha_creacion) : 'Generado'}
                      </span>
                    </div>
                  ))}
                  {venta.documentos_generados.length > 3 && (
                    <div className="text-xs text-blue-600">
                      +{venta.documentos_generados.length - 3} documentos más
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Información de cancelación */}
            {venta.estado === 'cancelada' && venta.motivo_cancelacion && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="text-sm">
                  <div className="text-red-700 font-medium mb-1">
                    Motivo: {venta.motivo_cancelacion_display}
                  </div>
                  {venta.fecha_cancelacion && (
                    <div className="text-red-600 text-xs">
                      Cancelada: {formatDate(venta.fecha_cancelacion)}
                    </div>
                  )}
                  {venta.descripcion_cancelacion && (
                    <div className="text-slate-700 text-xs mt-1">
                      {venta.descripcion_cancelacion}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex space-x-2">
                <button
                  onClick={() => openModal('view', venta)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Ver detalles"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {venta.estado === 'activa' && (
                  <button
                    onClick={() => handleCancelarVenta(venta)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Cancelar venta"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Estado actions */}
              {venta.estado === 'activa' && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleCambiarEstado(venta, 'finalizada')}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    title="Marcar como finalizada"
                  >
                    <CheckCircle className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50 dark:bg-gray-900 border-3 border-slate-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                    Venta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                    Monto Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                    Cancelación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                {ventas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-slate-50 dark:hover:bg-gray-700 dark:bg-gray-900 border-3 border-slate-300">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          Venta #{venta.id}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-gray-400 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(venta.fecha_venta)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-white">
                        {venta.cliente_info ? 
                          `${venta.cliente_info.nombre} ${venta.cliente_info.apellido}` : 
                          'Cliente no disponible'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(venta.monto_total)}
                      </div>
                      {venta.tipo_venta === 'financiado' && venta.saldo_pendiente > 0 && (
                        <div className="text-xs text-red-600">
                          Pendiente: {formatCurrency(venta.saldo_pendiente)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getTipoVentaColor(venta.tipo_venta)}`}>
                        {venta.tipo_venta_display}
                      </span>
                      {venta.tipo_venta === 'financiado' && (
                        <div className="text-xs text-slate-500 dark:text-gray-400">
                          {venta.cuotas} cuotas
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(venta.estado)}`}>
                        {getEstadoIcon(venta.estado)}
                        <span className="ml-1">{venta.estado_display}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {venta.estado === 'cancelada' && venta.motivo_cancelacion ? (
                        <div className="text-xs">
                          <div className="text-red-600 font-medium">
                            {venta.motivo_cancelacion_display}
                          </div>
                          {venta.fecha_cancelacion && (
                            <div className="text-slate-500 dark:text-gray-400">
                              {formatDate(venta.fecha_cancelacion)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      {venta.detalles?.length || 0} producto(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openModal('view', venta)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {venta.estado === 'activa' && (
                          <button
                            onClick={() => handleCancelarVenta(venta)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Cancelar venta"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {/* Estado actions en lista */}
                        {venta.estado === 'activa' && (
                          <button
                            onClick={() => handleCambiarEstado(venta, 'finalizada')}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Marcar como finalizada"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ventas.length === 0 && !loading && (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No hay ventas</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
            {searchTerm || hasActiveFilters ? 'No se encontraron ventas con esos filtros.' : 'Comienza creando tu primera venta.'}
          </p>
          {!searchTerm && !hasActiveFilters && (
            <div className="mt-6">
              <button
                onClick={openCreateModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Nueva Venta
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-slate-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 rounded-md hover:bg-slate-50 dark:hover:bg-gray-700 dark:bg-gray-900 border-3 border-slate-300 disabled:opacity-50"
            >
              Anterior
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (page > totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 dark:bg-gray-900 border-3 border-slate-300'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-slate-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 rounded-md hover:bg-slate-50 dark:hover:bg-gray-700 dark:bg-gray-900 border-3 border-slate-300 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
        </>
      )}

      {/* Import/Export Manager */}
      {showImportExportManager && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 rounded-lg p-8">Cargando...</div></div>}>
          <ImportExportManager 
            defaultType="ventas"
            onClose={() => setShowImportExportManager(false)}
          />
        </Suspense>
      )}

      {/* Toast Container */}
      <ToastContainer />

      {/* New Venta Form Modal */}
      {showCreateModal && (
        <NewVentaForm
          onClose={closeCreateModal}
          onSave={handleFormSave}
          onSaveDraft={handleSaveDraft}
        />
      )}

      {/* Cancelar Venta Modal */}
      {showCancelModal && ventaACancelar && (
        <CancelarVentaModal
          venta={ventaACancelar}
          onClose={() => {
            setShowCancelModal(false);
            setVentaACancelar(null);
          }}
          onConfirm={handleConfirmarCancelacion}
        />
      )}

      {/* Venta Details Modal */}
      {showModal && selectedVenta && (
        <VentaDetalleModal
          venta={selectedVenta}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default Ventas;