import React, { useState, useEffect, Suspense, useMemo, lazy } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle,
  CreditCard,
  DollarSign,
  Star,
  Award,
  Medal,
  Crown,
  ShoppingCart,
  Camera,
  FileText,
  Settings,
  Database
} from 'lucide-react';
const ImportExportManager = lazy(() => import('../components/dataManagement/ImportExportManager'));
import { clienteService } from '../services/clienteService';
import ClienteDetalle from '../components/ClienteDetalle';
import ClienteDetalleCompleto from '../components/ClienteDetalleCompleto';
import AdvancedSearch from '../components/AdvancedSearch';
import ViewToggle from '../components/common/ViewToggle';
import { SkeletonCard, SkeletonList, SkeletonStats } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useLocalSearch, useSearchSuggestions } from '../hooks/useAdvancedSearch';
import { clientesFilters, getSearchPlaceholder } from '../config/searchFilters';
import { getEstadoPagoInfo, calcularSistemaCredito, getNivelIcon, getNivelColor, formatCurrency, calcularProximoPago, type Cliente } from '../utils/clienteUtils';

interface ModalState {
  type: 'none' | 'confirm' | 'pago' | 'success' | 'info' | 'error';
  isOpen: boolean;
  title?: string;
  message?: string;
  data?: any;
  onConfirm?: () => void;
}

const Clientes: React.FC = () => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImportExportManager, setShowImportExportManager] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showDetalleCompleto, setShowDetalleCompleto] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('clientes_view_mode');
    return (saved as 'grid' | 'list') || 'grid';
  });

  // Guardar la configuración de vista cuando cambie
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('clientes_view_mode', mode);
  };
  const [modalState, setModalState] = useState<ModalState>({ type: 'none', isOpen: false });
  const [formData, setFormData] = useState<any>({});

  // Funciones helper para modales
  const showCustomModal = (type: ModalState['type'], title?: string, message?: string, data?: any, onConfirm?: () => void) => {
    setModalState({ type, isOpen: true, title, message, data, onConfirm });
  };

  const closeCustomModal = () => {
    setModalState({ type: 'none', isOpen: false });
    setFormData({});
  };

  const showSuccessModal = (message: string) => {
    showCustomModal('success', 'Éxito', message);
  };

  const showInfoModal = (message: string) => {
    showCustomModal('info', 'Información', message);
  };

  const showErrorModal = (message: string) => {
    showCustomModal('error', 'Error', message);
  };

  const showConfirmModal = (title: string, message: string, onConfirm: () => void) => {
    showCustomModal('confirm', title, message, null, onConfirm);
  };

  // Advanced search functionality
  const searchFields: (keyof Cliente)[] = ['nombre', 'apellido', 'cedula', 'telefono', 'email', 'ciudad'];
  
  const filterFunctions = useMemo(() => ({
    estado_credito: (cliente: Cliente, value: string) => {
      const estadoPago = getEstadoPagoInfo(cliente);
      return estadoPago.estado === value;
    },
    saldo_pendiente: (cliente: Cliente, value: [string, string]) => {
      const [min, max] = value;
      const saldo = cliente.saldo_pendiente || 0;
      if (min && max) return saldo >= Number(min) && saldo <= Number(max);
      if (min) return saldo >= Number(min);
      if (max) return saldo <= Number(max);
      return true;
    },
    nivel_credito: (cliente: Cliente, value: string) => {
      const sistema = calcularSistemaCredito(cliente);
      return sistema.nivel === value;
    },
    tiene_ventas_activas: (cliente: Cliente, value: string) => {
      const hasActiveVentas = cliente.ventas?.some(v => v.estado === 'activa') || false;
      return value === 'true' ? hasActiveVentas : !hasActiveVentas;
    }
  }), []);

  const {
    searchTerm,
    filters,
    setSearchTerm,
    setFilters,
    filteredData: filteredClientes,
    totalCount,
    filteredCount
  } = useLocalSearch({
    data: clientes,
    searchFields,
    filterFunctions,
    persistKey: 'clientes'
  });

  const suggestions = useSearchSuggestions(clientes, searchFields, 10);

  // Función para obtener datos del cliente (SOLO datos reales del API)
  const getClienteData = (cliente: Cliente): Cliente => {
    // INDICADOR DE VERSIÓN - Si ves este mensaje, no se generan datos fake
    console.log('🔧 Clientes v2.0 - No fake data generation, using API data only');
    
    // Limpiar localStorage de datos fake previos
    localStorage.removeItem(`cliente_${cliente.id}`);
    
    // Usar solo los datos del API sin modificaciones
    return cliente;
  };

  const loadClientes = async (page = 1) => {
    try {
      setLoading(true);
      const response = await clienteService.getClientes(page);
      
      // Usar datos persistentes para cada cliente
      const clientesConDatos = response.results.map(getClienteData);
      
      setClientes(clientesConDatos);
      setTotalPages(Math.ceil(response.count / 20)); // Asumiendo 20 items por página
    } catch (err) {
      const errorMsg = 'Error al cargar clientes';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error loading clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes(currentPage);
  }, [currentPage]);


  const handleDelete = async (cliente: Cliente) => {
    showConfirmModal(
      'Confirmar Eliminación',
      `¿Estás seguro de eliminar al cliente ${cliente.nombre} ${cliente.apellido}?\n\nEsta acción no se puede deshacer.`,
      async () => {
        try {
          await clienteService.deleteCliente(cliente.id);
          loadClientes(currentPage);
          closeCustomModal();
          showSuccessModal('Cliente eliminado exitosamente');
        } catch (err) {
          closeCustomModal();
          showErrorModal('Error al eliminar cliente');
          console.error('Error deleting cliente:', err);
        }
      }
    );
  };


  const handleViewDetalle = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowDetalle(true);
  };

  const handleViewDetalleCompleto = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowDetalleCompleto(true);
  };

  const handleClienteClick = (cliente: Cliente) => {
    // Al hacer clic en cualquier parte de la tarjeta, abre los detalles completos
    handleViewDetalleCompleto(cliente);
  };

  const handleUpdateCliente = (clienteActualizado: Cliente) => {
    // NO guardar datos fake - solo actualizar la lista con datos del API
    console.log('🔧 Clientes v2.0 - handleUpdateCliente: No localStorage fake data');
    
    // Actualizar cliente en la lista
    setClientes(prev => prev.map(c => c.id === clienteActualizado.id ? clienteActualizado : c));
  };



  const handleDeleteClick = (e: React.MouseEvent, cliente: Cliente) => {
    e.stopPropagation(); // Evita que se abra el detalle al hacer clic en eliminar
    handleDelete(cliente);
  };

  const getEstadoPagoIcon = (estado: string) => {
    switch (estado) {
      case 'atrasado': return AlertTriangle;
      case 'proximo': return Clock;
      case 'al_dia': 
      default: return CheckCircle;
    }
  };

  const handleBackFromDetalle = () => {
    setShowDetalle(false);
    setSelectedCliente(null);
  };

  const handleBackFromDetalleCompleto = () => {
    setShowDetalleCompleto(false);
    setSelectedCliente(null);
  };

  const handleVentaRapida = (cliente: Cliente) => {
    // Mostrar un mensaje por ahora hasta que se implemente la navegación correcta
    showInfoModal(`Función Nueva Venta para ${cliente.nombre} ${cliente.apellido}\n\nEsta función se integrará con el sistema de ventas próximamente.`);
    // TODO: Implementar navegación interna sin perder estado
  };

  const handlePagoCuota = (cliente: Cliente) => {
    // Mostrar modal de pago
    showCustomModal('pago', 'Registrar Pago de Cuota', `Registrar pago para ${cliente.nombre} ${cliente.apellido}`, cliente);
  };

  const procesarPago = (cliente: Cliente, montoPago: number) => {
    const nuevoCliente = {
      ...cliente,
      deuda_total: Math.max(0, (cliente.deuda_total || 0) - montoPago),
      pagos_a_tiempo: (cliente.pagos_a_tiempo || 0) + 1,
      total_pagos: (cliente.total_pagos || 0) + 1
    };
    handleUpdateCliente(nuevoCliente);
    closeCustomModal();
    showSuccessModal(`Pago de $${montoPago.toLocaleString()} registrado exitosamente.`);
  };

  const handleContratosFacturas = (cliente: Cliente) => {
    showInfoModal(`Acceso a Contratos y Facturas para ${cliente.nombre} ${cliente.apellido}\n\nEsta función mostrará todos los documentos del cliente.`);
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && clientes.length === 0) {
    return (
      <div className="page-fade-in">
        {/* Header skeleton */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Search and filters skeleton */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="flex justify-end">
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Loading State */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 staggered-fade-in">
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

  if (showDetalle && selectedCliente) {
    return (
      <ClienteDetalle 
        cliente={selectedCliente} 
        onBack={handleBackFromDetalle}
      />
    );
  }

  if (showDetalleCompleto && selectedCliente) {
    return (
      <ClienteDetalleCompleto 
        cliente={selectedCliente} 
        onClose={handleBackFromDetalleCompleto}
        onUpdate={handleUpdateCliente}
        onVentaRapida={handleVentaRapida}
      />
    );
  }

  return (
    <div className="page-fade-in">
      {/* Header */}
      <div className="mb-6 md:mb-8 animate-fade-in-up">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Gestión de Clientes</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra la información de todos tus clientes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImportExportManager(true)}
              className="touch-target bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded-lg btn-press micro-glow flex items-center gap-2 transition-colors"
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Importar/Exportar</span>
              <span className="sm:hidden">Datos</span>
            </button>
            <Link
              to="/clientes/nuevo"
              className="touch-target bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg btn-press micro-glow flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Cliente</span>
              <span className="sm:hidden">Nuevo</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Advanced Search */}
      <div className="mb-6 space-y-4">
        <AdvancedSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={clientesFilters}
          activeFilters={filters}
          onFiltersChange={setFilters}
          suggestions={suggestions}
          placeholder={getSearchPlaceholder('clientes')}
          loading={loading}
          className="animate-fade-in-up"
        />
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredCount !== totalCount ? (
              <span>Mostrando {filteredCount} de {totalCount} clientes</span>
            ) : (
              <span>{totalCount} cliente{totalCount !== 1 ? 's' : ''} total{totalCount !== 1 ? 'es' : ''}</span>
            )}
          </div>
          <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}


      {/* Clientes Display */}
      {!loading && (
        <>
          {viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 staggered-fade-in">
          {filteredClientes.map((cliente) => {
            const estadoPago = getEstadoPagoInfo(cliente);
            const sistemaCredito = calcularSistemaCredito(cliente);
            const NivelIcon = getNivelIcon(sistemaCredito.nivel);
            
            return (
              <div 
                key={cliente.id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow border card-hover cursor-pointer border border-gray-200 dark:border-gray-700 animate-fade-in-up transition-colors"
                onClick={() => handleClienteClick(cliente)}
              >
                {/* Header con foto y datos básicos */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      {/* Foto de perfil o avatar */}
                      <div className="relative mr-3 group">
                        {cliente.foto_perfil ? (
                          <div className="relative">
                            <img 
                              src={cliente.foto_perfil} 
                              alt={`${cliente.nombre} ${cliente.apellido}`}
                              className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (event) => {
                                  const file = (event.target as HTMLInputElement).files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                      const newCliente = {
                                        ...cliente,
                                        foto_perfil: e.target?.result as string
                                      };
                                      handleUpdateCliente(newCliente);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                };
                                input.click();
                              }}
                              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Cambiar foto de perfil"
                            >
                              <Camera className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        ) : (
                          <div className="bg-blue-100 rounded-full p-3 relative">
                            <User className="h-6 w-6 text-blue-600" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (event) => {
                                  const file = (event.target as HTMLInputElement).files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                      const newCliente = {
                                        ...cliente,
                                        foto_perfil: e.target?.result as string
                                      };
                                      handleUpdateCliente(newCliente);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                };
                                input.click();
                              }}
                              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Agregar foto de perfil"
                            >
                              <Camera className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        )}
                        
                        {/* Badge de nivel de lealtad */}
                        <div className={`absolute -bottom-1 -right-1 ${getNivelColor(sistemaCredito.nivel)} rounded-full p-1`}>
                          <NivelIcon className="h-3 w-3" />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {cliente.nombre} {cliente.apellido}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">CC: {cliente.cedula}</p>
                        <div className="flex items-center mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getNivelColor(sistemaCredito.nivel)}`}>
                            {sistemaCredito.nivel.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {sistemaCredito.score} pts
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botón de gestión flotante */}
                    <div className="relative group">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Opciones"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      
                      {/* Dropdown menu */}
                      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <div className="py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVentaRapida(cliente);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Nueva Venta
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePagoCuota(cliente);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                          >
                            <CreditCard className="h-4 w-4" />
                            Pago de Cuota
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContratosFacturas(cliente);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                            Contratos y Facturas
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <Link
                            to={`/clientes/${cliente.id}/editar`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </Link>
                          <button
                            onClick={(e) => handleDeleteClick(e, cliente)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estado de pago destacado */}
                  <div className={`p-3 rounded-lg border mb-3 ${estadoPago.color_clase}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {estadoPago.estado === 'atrasado' && <AlertTriangle className="h-4 w-4 mr-2" />}
                        {estadoPago.estado === 'proximo' && <Clock className="h-4 w-4 mr-2" />}
                        {estadoPago.estado === 'al_dia' && <CheckCircle className="h-4 w-4 mr-2" />}
                        <div>
                          <p className="text-sm font-medium">{estadoPago.mensaje}</p>
                          {cliente.deuda_total && (
                            <p className="text-xs">Deuda: {formatCurrency(cliente.deuda_total)}</p>
                          )}
                        </div>
                      </div>
                      {cliente.cuota_actual && (
                        <div className="text-right">
                          <p className="text-xs">Cuota</p>
                          <p className="text-sm font-bold">{formatCurrency(cliente.cuota_actual)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información de contacto */}
                  <div className="space-y-1">
                    {cliente.telefono && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="h-3 w-3 mr-2" />
                        {cliente.telefono}
                      </div>
                    )}
                    {cliente.email && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="h-3 w-3 mr-2" />
                        {cliente.email}
                      </div>
                    )}
                    {/* Información del fiador */}
                    {cliente.fiador && (
                      <div className="flex items-center text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <User className="h-3 w-3 mr-2" />
                        <div>
                          <span className="font-medium">Fiador: </span>
                          <span>{cliente.fiador.nombre_completo}</span>
                          {cliente.fiador.parentesco_cliente && (
                            <span className="text-xs ml-1">({cliente.fiador.parentesco_cliente})</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden border dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ingresos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {/* Foto de perfil o avatar */}
                        <div className="relative mr-3 group">
                          {cliente.foto_perfil ? (
                            <div className="relative">
                              <img 
                                src={cliente.foto_perfil} 
                                alt={`${cliente.nombre} ${cliente.apellido}`}
                                className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = (event) => {
                                    const file = (event.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (e) => {
                                        const newCliente = {
                                          ...cliente,
                                          foto_perfil: e.target?.result as string
                                        };
                                        handleUpdateCliente(newCliente);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  };
                                  input.click();
                                }}
                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Cambiar foto de perfil"
                              >
                                <Camera className="h-3 w-3 text-white" />
                              </button>
                            </div>
                          ) : (
                            <div className="bg-blue-100 rounded-full p-2 relative">
                              <User className="h-6 w-6 text-blue-600" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = (event) => {
                                    const file = (event.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (e) => {
                                        const newCliente = {
                                          ...cliente,
                                          foto_perfil: e.target?.result as string
                                        };
                                        handleUpdateCliente(newCliente);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  };
                                  input.click();
                                }}
                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Agregar foto de perfil"
                              >
                                <Camera className="h-3 w-3 text-white" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {cliente.nombre} {cliente.apellido}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            CC: {cliente.cedula}
                          </div>
                          <div className="flex items-center mt-1">
                            {(() => {
                              const sistemaCredito = calcularSistemaCredito(cliente);
                              const NivelIcon = getNivelIcon(sistemaCredito.nivel);
                              return (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getNivelColor(sistemaCredito.nivel)} flex items-center`}>
                                  <NivelIcon className="h-3 w-3 mr-1" />
                                  {sistemaCredito.nivel.toUpperCase()}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {cliente.telefono && (
                          <div className="flex items-center mb-1">
                            <Phone className="h-3 w-3 mr-1" />
                            {cliente.telefono}
                          </div>
                        )}
                        {cliente.email && (
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <Mail className="h-3 w-3 mr-1" />
                            {cliente.email}
                          </div>
                        )}
                        {/* Información del fiador */}
                        {cliente.fiador && (
                          <div className="flex items-center text-xs text-blue-600 bg-blue-50 p-1 rounded mt-1">
                            <User className="h-3 w-3 mr-1" />
                            <div>
                              <span className="font-medium">Fiador: </span>
                              <span>{cliente.fiador.nombre_completo}</span>
                              {cliente.fiador.parentesco_cliente && (
                                <span className="text-xs ml-1">({cliente.fiador.parentesco_cliente})</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                        {cliente.direccion || 'Sin dirección'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cliente.ingresos ? (
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(cliente.ingresos)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">No especificado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetalle(cliente)}
                          className="touch-target-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/clientes/${cliente.id}/editar`}
                          className="touch-target-sm text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(cliente)}
                          className="touch-target-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {filteredClientes.length === 0 && !loading && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay clientes</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {(searchTerm || Object.keys(filters).length > 0) ? 'No se encontraron clientes con esa búsqueda.' : 'Comienza creando tu primer cliente.'}
          </p>
          {!(searchTerm || Object.keys(filters).length > 0) && (
            <div className="mt-6">
              <Link
                to="/clientes/nuevo"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Nuevo Cliente
              </Link>
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
              className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
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
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
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
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-8">Cargando...</div></div>}>
          <ImportExportManager 
            defaultType="clientes"
            onClose={() => setShowImportExportManager(false)}
          />
        </Suspense>
      )}

      {/* Toast Container */}
      <ToastContainer />

      {/* Modales personalizados */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 shadow border dark:border-gray-700">
            {/* Modal de confirmación */}
            {modalState.type === 'confirm' && (
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{modalState.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line">{modalState.message}</p>
                <div className="flex space-x-3">
                  <button
                    onClick={closeCustomModal}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={modalState.onConfirm}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}

            {/* Modal de pago */}
            {modalState.type === 'pago' && (
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{modalState.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{modalState.message}</p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monto del pago
                  </label>
                  <input
                    type="number"
                    placeholder="Ingrese el monto"
                    value={formData.monto || ''}
                    onChange={(e) => setFormData({...formData, monto: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={closeCustomModal}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (formData.monto && !isNaN(Number(formData.monto)) && modalState.data) {
                        procesarPago(modalState.data, Number(formData.monto));
                      }
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Registrar Pago
                  </button>
                </div>
              </div>
            )}

            {/* Modal de éxito */}
            {modalState.type === 'success' && (
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{modalState.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line">{modalState.message}</p>
                <button
                  onClick={closeCustomModal}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Aceptar
                </button>
              </div>
            )}

            {/* Modal de información */}
            {modalState.type === 'info' && (
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{modalState.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line">{modalState.message}</p>
                <button
                  onClick={closeCustomModal}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Aceptar
                </button>
              </div>
            )}

            {/* Modal de error */}
            {modalState.type === 'error' && (
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{modalState.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line">{modalState.message}</p>
                <button
                  onClick={closeCustomModal}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Aceptar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;