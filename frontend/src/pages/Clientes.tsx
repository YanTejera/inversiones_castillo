import React, { useState, useEffect } from 'react';
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
  Settings
} from 'lucide-react';
import { clienteService } from '../services/clienteService';
import ClienteForm from '../components/ClienteForm';
import ClienteDetalle from '../components/ClienteDetalle';
import ClienteDetalleCompleto from '../components/ClienteDetalleCompleto';
import ViewToggle from '../components/common/ViewToggle';
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
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');
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

  // Función para obtener datos persistentes del cliente
  const getClienteData = (cliente: Cliente): Cliente => {
    const savedData = localStorage.getItem(`cliente_${cliente.id}`);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      return { ...cliente, ...parsedData };
    }
    
    // Generar datos solo si no existen
    const newData = {
      ...cliente,
      foto_perfil: cliente.foto_perfil || undefined,
      deuda_total: cliente.deuda_total || (Math.random() > 0.5 ? Math.floor(Math.random() * 5000000) + 1000000 : 0),
      cuota_actual: cliente.cuota_actual || (Math.random() > 0.5 ? Math.floor(Math.random() * 500000) + 200000 : 0),
      proximo_pago: cliente.proximo_pago || (Math.random() > 0.3 ? new Date(Date.now() + (Math.random() - 0.5) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined),
      dias_atraso: cliente.dias_atraso || (Math.random() > 0.7 ? Math.floor(Math.random() * 30) : 0),
      estado_pago: cliente.estado_pago || (Math.random() > 0.7 ? 'atrasado' : (Math.random() > 0.5 ? 'proximo' : 'al_dia')),
      score_credito: cliente.score_credito || Math.floor(Math.random() * 800) + 200,
      nivel_lealtad: cliente.nivel_lealtad || (['bronce', 'plata', 'oro', 'platino'][Math.floor(Math.random() * 4)] as 'bronce' | 'plata' | 'oro' | 'platino'),
      puntos_lealtad: cliente.puntos_lealtad || Math.floor(Math.random() * 1000) + 100,
      compras_historicas: cliente.compras_historicas || Math.floor(Math.random() * 10) + 1,
      pagos_a_tiempo: cliente.pagos_a_tiempo || Math.floor(Math.random() * 20) + 5,
      total_pagos: cliente.total_pagos || Math.floor(Math.random() * 25) + 5,
      cliente_desde: cliente.cliente_desde || cliente.fecha_registro
    };
    
    // Agregar fiador y documentos si no existen
    if (!newData.fiador && Math.random() > 0.6) {
      // Generar fiador simulado para algunos clientes
      newData.fiador = {
        id: Date.now(),
        nombre: ['Carlos', 'María', 'Luis', 'Ana', 'Jorge', 'Sofía'][Math.floor(Math.random() * 6)],
        apellido: ['González', 'Martínez', 'López', 'García', 'Rodríguez', 'Hernández'][Math.floor(Math.random() * 6)],
        cedula: Math.floor(Math.random() * 90000000) + 10000000 + '',
        direccion: `Calle ${Math.floor(Math.random() * 100) + 1} #${Math.floor(Math.random() * 50)}-${Math.floor(Math.random() * 99)}`,
        telefono: `30${Math.floor(Math.random() * 100000000) + 10000000}`,
        ocupacion: ['Empleado', 'Comerciante', 'Profesional', 'Independiente'][Math.floor(Math.random() * 4)],
        parentesco_cliente: ['Hermano/a', 'Padre/Madre', 'Tío/a', 'Primo/a', 'Amigo/a'][Math.floor(Math.random() * 5)],
        cliente: cliente.id,
        nombre_completo: ''
      };
      newData.fiador.nombre_completo = `${newData.fiador.nombre} ${newData.fiador.apellido}`;
    }

    // Guardar en localStorage
    const dataToSave = {
      foto_perfil: newData.foto_perfil,
      deuda_total: newData.deuda_total,
      cuota_actual: newData.cuota_actual,
      proximo_pago: newData.proximo_pago,
      dias_atraso: newData.dias_atraso,
      estado_pago: newData.estado_pago,
      score_credito: newData.score_credito,
      nivel_lealtad: newData.nivel_lealtad,
      puntos_lealtad: newData.puntos_lealtad,
      compras_historicas: newData.compras_historicas,
      pagos_a_tiempo: newData.pagos_a_tiempo,
      total_pagos: newData.total_pagos,
      cliente_desde: newData.cliente_desde,
      fiador: newData.fiador
    };
    localStorage.setItem(`cliente_${cliente.id}`, JSON.stringify(dataToSave));
    
    return newData;
  };

  const loadClientes = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await clienteService.getClientes(page, search);
      
      // Usar datos persistentes para cada cliente
      const clientesConDatos = response.results.map(getClienteData);
      
      setClientes(clientesConDatos);
      setTotalPages(Math.ceil(response.count / 20)); // Asumiendo 20 items por página
    } catch (err) {
      setError('Error al cargar clientes');
      console.error('Error loading clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Clientes component mounted, loading clientes...');
    loadClientes(currentPage, searchTerm);
  }, [currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadClientes(1, searchTerm);
  };

  const handleDelete = async (cliente: Cliente) => {
    showConfirmModal(
      'Confirmar Eliminación',
      `¿Estás seguro de eliminar al cliente ${cliente.nombre} ${cliente.apellido}?\n\nEsta acción no se puede deshacer.`,
      async () => {
        try {
          await clienteService.deleteCliente(cliente.id);
          loadClientes(currentPage, searchTerm);
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

  const openModal = (mode: 'view' | 'create' | 'edit', cliente?: Cliente) => {
    setModalMode(mode);
    setSelectedCliente(cliente || null);
    setShowModal(true);
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
    // Guardar en localStorage
    const dataToSave = {
      foto_perfil: clienteActualizado.foto_perfil,
      deuda_total: clienteActualizado.deuda_total,
      cuota_actual: clienteActualizado.cuota_actual,
      proximo_pago: clienteActualizado.proximo_pago,
      dias_atraso: clienteActualizado.dias_atraso,
      estado_pago: clienteActualizado.estado_pago,
      score_credito: clienteActualizado.score_credito,
      nivel_lealtad: clienteActualizado.nivel_lealtad,
      puntos_lealtad: clienteActualizado.puntos_lealtad,
      compras_historicas: clienteActualizado.compras_historicas,
      pagos_a_tiempo: clienteActualizado.pagos_a_tiempo,
      total_pagos: clienteActualizado.total_pagos,
      cliente_desde: clienteActualizado.cliente_desde,
      fiador: clienteActualizado.fiador
    };
    localStorage.setItem(`cliente_${clienteActualizado.id}`, JSON.stringify(dataToSave));
    
    // Actualizar cliente en la lista
    setClientes(prev => prev.map(c => c.id === clienteActualizado.id ? clienteActualizado : c));
  };


  const handleEditClick = (e: React.MouseEvent, cliente: Cliente) => {
    e.stopPropagation(); // Evita que se abra el detalle al hacer clic en editar
    openModal('edit', cliente);
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


  const closeModal = () => {
    setShowModal(false);
    setSelectedCliente(null);
  };

  const handleFormSave = () => {
    loadClientes(currentPage, searchTerm);
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
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
            <p className="mt-1 text-sm text-gray-500">
              Administra la información de todos tus clientes
            </p>
          </div>
          <button
            onClick={() => openModal('create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Search Bar and View Toggle */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o cédula..."
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
        
        <div className="flex justify-end">
          <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Clientes Display */}
      {viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientes.map((cliente) => {
            console.log('Rendering cliente:', cliente.nombre);
            const estadoPago = getEstadoPagoInfo(cliente);
            const sistemaCredito = calcularSistemaCredito(cliente);
            const NivelIcon = getNivelIcon(sistemaCredito.nivel);
            
            return (
              <div 
                key={cliente.id} 
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200"
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
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cliente.nombre} {cliente.apellido}
                        </h3>
                        <p className="text-sm text-gray-500">CC: {cliente.cedula}</p>
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
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="Opciones"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      
                      {/* Dropdown menu */}
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <div className="py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVentaRapida(cliente);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Nueva Venta
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePagoCuota(cliente);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            Pago de Cuota
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContratosFacturas(cliente);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Contratos y Facturas
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={(e) => handleEditClick(e, cliente)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, cliente)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-3 w-3 mr-2" />
                        {cliente.telefono}
                      </div>
                    )}
                    {cliente.email && (
                      <div className="flex items-center text-sm text-gray-600">
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingresos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
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
                          <div className="text-sm font-medium text-gray-900">
                            {cliente.nombre} {cliente.apellido}
                          </div>
                          <div className="text-xs text-gray-500">
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
                      <div className="text-sm text-gray-900">
                        {cliente.telefono && (
                          <div className="flex items-center mb-1">
                            <Phone className="h-3 w-3 mr-1" />
                            {cliente.telefono}
                          </div>
                        )}
                        {cliente.email && (
                          <div className="flex items-center text-xs text-gray-500 mb-1">
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
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {cliente.direccion || 'Sin dirección'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cliente.ingresos ? (
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(cliente.ingresos)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">No especificado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetalle(cliente)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openModal('edit', cliente)}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cliente)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
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

      {clientes.length === 0 && !loading && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clientes</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron clientes con esa búsqueda.' : 'Comienza creando tu primer cliente.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => openModal('create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Nuevo Cliente
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

      {/* Cliente Form Modal */}
      {showModal && (
        <ClienteForm
          cliente={selectedCliente}
          mode={modalMode}
          onClose={closeModal}
          onSave={handleFormSave}
        />
      )}

      {/* Modales personalizados */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-2xl">
            {/* Modal de confirmación */}
            {modalState.type === 'confirm' && (
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">{modalState.title}</h3>
                </div>
                <p className="text-gray-600 mb-6 whitespace-pre-line">{modalState.message}</p>
                <div className="flex space-x-3">
                  <button
                    onClick={closeCustomModal}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
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
                  <h3 className="text-lg font-semibold text-gray-900">{modalState.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{modalState.message}</p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto del pago
                  </label>
                  <input
                    type="number"
                    placeholder="Ingrese el monto"
                    value={formData.monto || ''}
                    onChange={(e) => setFormData({...formData, monto: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={closeCustomModal}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (formData.monto && !isNaN(Number(formData.monto)) && modalState.data) {
                        procesarPago(modalState.data, Number(formData.monto));
                      }
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
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
                  <h3 className="text-lg font-semibold text-gray-900">{modalState.title}</h3>
                </div>
                <p className="text-gray-600 mb-6 whitespace-pre-line">{modalState.message}</p>
                <button
                  onClick={closeCustomModal}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
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
                  <h3 className="text-lg font-semibold text-gray-900">{modalState.title}</h3>
                </div>
                <p className="text-gray-600 mb-6 whitespace-pre-line">{modalState.message}</p>
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
                  <h3 className="text-lg font-semibold text-gray-900">{modalState.title}</h3>
                </div>
                <p className="text-gray-600 mb-6 whitespace-pre-line">{modalState.message}</p>
                <button
                  onClick={closeCustomModal}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
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