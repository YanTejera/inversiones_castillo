import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  ShoppingCart,
  DollarSign,
  User,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  FileText
} from 'lucide-react';
import { ventaService } from '../services/ventaService';
import VentaForm from '../components/VentaForm';
import type { Venta } from '../types';

const Ventas: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');

  const loadVentas = async (page = 1, search = '', estado = '') => {
    try {
      setLoading(true);
      const response = await ventaService.getVentas(page, search, estado);
      setVentas(response.results);
      setTotalPages(Math.ceil(response.count / 20)); // Asumiendo 20 items por página
    } catch (err) {
      setError('Error al cargar ventas');
      console.error('Error loading ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVentas(currentPage, searchTerm, estadoFilter);
  }, [currentPage, estadoFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadVentas(1, searchTerm, estadoFilter);
  };

  const handleEstadoChange = (estado: string) => {
    setEstadoFilter(estado);
    setCurrentPage(1);
  };

  const handleDelete = async (venta: Venta) => {
    if (window.confirm(`¿Estás seguro de eliminar la venta #${venta.id}?`)) {
      try {
        await ventaService.deleteVenta(venta.id);
        loadVentas(currentPage, searchTerm, estadoFilter);
      } catch (err) {
        alert('Error al eliminar venta');
        console.error('Error deleting venta:', err);
      }
    }
  };

  const handleCambiarEstado = async (venta: Venta, nuevoEstado: 'activa' | 'finalizada' | 'cancelada') => {
    if (window.confirm(`¿Cambiar estado de la venta a "${nuevoEstado}"?`)) {
      try {
        await ventaService.cambiarEstadoVenta(venta.id, nuevoEstado);
        loadVentas(currentPage, searchTerm, estadoFilter);
      } catch (err) {
        alert('Error al cambiar estado de venta');
        console.error('Error changing venta status:', err);
      }
    }
  };

  const openModal = (mode: 'view' | 'create' | 'edit', venta?: Venta) => {
    setModalMode(mode);
    setSelectedVenta(venta || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVenta(null);
  };

  const handleFormSave = () => {
    loadVentas(currentPage, searchTerm, estadoFilter);
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
        return 'bg-green-100 text-green-800';
      case 'finalizada':
        return 'bg-blue-100 text-blue-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Ventas</h1>
            <p className="mt-1 text-sm text-gray-500">
              Administra todas las ventas de motocicletas
            </p>
          </div>
          <button
            onClick={() => openModal('create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Venta
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por cliente o ID de venta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Buscar
          </button>
        </form>

        {/* Estado Filters */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleEstadoChange('')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              estadoFilter === '' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => handleEstadoChange('activa')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              estadoFilter === 'activa' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Activas
          </button>
          <button
            onClick={() => handleEstadoChange('finalizada')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              estadoFilter === 'finalizada' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Finalizadas
          </button>
          <button
            onClick={() => handleEstadoChange('cancelada')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              estadoFilter === 'cancelada' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Canceladas
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Ventas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {ventas.map((venta) => (
          <div key={venta.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Venta #{venta.id}
                </h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(venta.fecha_venta)}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(venta.estado)}`}>
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
              <span className="text-sm text-gray-600">
                {venta.cliente_info ? 
                  `${venta.cliente_info.nombre} ${venta.cliente_info.apellido}` : 
                  'Cliente no disponible'
                }
              </span>
            </div>

            {/* Detalles financieros */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Monto Total:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(venta.monto_total)}
                </span>
              </div>
              
              {venta.tipo_venta === 'financiado' && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Inicial:</span>
                    <span className="font-medium">
                      {formatCurrency(venta.monto_inicial)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Cuotas:</span>
                    <span className="font-medium">{venta.cuotas}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Pago Mensual:</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(venta.pago_mensual)}
                    </span>
                  </div>
                  
                  {venta.saldo_pendiente > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Saldo Pendiente:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(venta.saldo_pendiente)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Número de productos */}
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <ShoppingCart className="h-4 w-4 mr-2" />
              {venta.detalles?.length || 0} producto(s)
            </div>

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
                <button
                  onClick={() => openModal('edit', venta)}
                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(venta)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
                  <button
                    onClick={() => handleCambiarEstado(venta, 'cancelada')}
                    className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                    title="Cancelar venta"
                  >
                    <XCircle className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {ventas.length === 0 && !loading && (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ventas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || estadoFilter ? 'No se encontraron ventas con esos filtros.' : 'Comienza creando tu primera venta.'}
          </p>
          {!searchTerm && !estadoFilter && (
            <div className="mt-6">
              <button
                onClick={() => openModal('create')}
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
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
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
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Venta Form Modal */}
      {showModal && (
        <VentaForm
          venta={selectedVenta}
          mode={modalMode}
          onClose={closeModal}
          onSave={handleFormSave}
        />
      )}
    </div>
  );
};

export default Ventas;