import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Bike,
  DollarSign,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Palette,
  Info,
  X
} from 'lucide-react';
import { motoService } from '../services/motoService';
import { motoModeloService } from '../services/motoModeloService';
import MotoForm from '../components/MotoForm';
import MotoModeloForm from '../components/MotoModeloForm';
import MotoModeloDetalle from '../components/MotoModeloDetalle';
import type { Moto, MotoModelo } from '../types';

const Motocicletas: React.FC = () => {
  const [motos, setMotos] = useState<Moto[]>([]);
  const [modelos, setModelos] = useState<MotoModelo[]>([]);
  const [viewMode, setViewMode] = useState<'modelos' | 'individual'>('modelos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedMoto, setSelectedMoto] = useState<Moto | null>(null);
  const [selectedModelo, setSelectedModelo] = useState<MotoModelo | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');
  const [showDetalleModelo, setShowDetalleModelo] = useState(false);
  const [showVentaDirecta, setShowVentaDirecta] = useState(false);
  const [showResumenModelo, setShowResumenModelo] = useState(false);

  const loadMotos = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await motoService.getMotos(page, search);
      setMotos(response.results);
      setTotalPages(Math.ceil(response.count / 20)); // Asumiendo 20 items por página
    } catch (err) {
      setError('Error al cargar motocicletas');
      console.error('Error loading motos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadModelos = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await motoModeloService.getModelos(page, search);
      setModelos(response.results);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err) {
      setError('Error al cargar modelos de motocicletas');
      console.error('Error loading modelos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'modelos') {
      loadModelos(currentPage, searchTerm);
    } else {
      loadMotos(currentPage, searchTerm);
    }
  }, [currentPage, viewMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    if (viewMode === 'modelos') {
      loadModelos(1, searchTerm);
    } else {
      loadMotos(1, searchTerm);
    }
  };

  const handleDelete = async (moto: Moto) => {
    if (window.confirm(`¿Estás seguro de eliminar la moto ${moto.marca} ${moto.modelo}${moto.color ? ` ${moto.color}` : ''}?`)) {
      try {
        await motoService.deleteMoto(moto.id);
        loadMotos(currentPage, searchTerm);
      } catch (err) {
        alert('Error al eliminar moto');
        console.error('Error deleting moto:', err);
      }
    }
  };

  const openModal = (mode: 'view' | 'create' | 'edit', moto?: Moto, modelo?: MotoModelo) => {
    setModalMode(mode);
    setSelectedMoto(moto || null);
    setSelectedModelo(modelo || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMoto(null);
    setSelectedModelo(null);
  };

  const handleFormSave = () => {
    if (viewMode === 'modelos') {
      loadModelos(currentPage, searchTerm);
    } else {
      loadMotos(currentPage, searchTerm);
    }
  };

  const handleDeleteModelo = async (modelo: MotoModelo) => {
    if (window.confirm(`¿Estás seguro de eliminar el modelo ${modelo.marca} ${modelo.modelo} ${modelo.ano}?`)) {
      try {
        await motoModeloService.deleteModelo(modelo.id);
        loadModelos(currentPage, searchTerm);
      } catch (err) {
        alert('Error al eliminar modelo');
        console.error('Error deleting modelo:', err);
      }
    }
  };

  const handleVerDetalleModelo = async (modelo: MotoModelo) => {
    try {
      // Obtener la información más actualizada del modelo
      const modeloActualizado = await motoModeloService.getModelo(modelo.id);
      setSelectedModelo(modeloActualizado);
      setShowDetalleModelo(true);
    } catch (err) {
      console.error('Error loading modelo details:', err);
      setSelectedModelo(modelo);
      setShowDetalleModelo(true);
    }
  };

  const handleUpdateModelo = async () => {
    if (selectedModelo) {
      try {
        const modeloActualizado = await motoModeloService.getModelo(selectedModelo.id);
        setSelectedModelo(modeloActualizado);
        // También actualizar la lista de modelos
        loadModelos(currentPage, searchTerm);
      } catch (err) {
        console.error('Error updating modelo:', err);
      }
    }
  };

  const handleVentaDirecta = (modelo: MotoModelo) => {
    setSelectedModelo(modelo);
    setShowVentaDirecta(true);
  };

  const [estadisticasModelo, setEstadisticasModelo] = useState<any>(null);

  const handleResumenModelo = async (modelo: MotoModelo) => {
    try {
      // Obtener las estadísticas detalladas del modelo
      const estadisticas = await motoModeloService.getEstadisticasModelo(modelo.id);
      setEstadisticasModelo(estadisticas);
      setSelectedModelo(modelo);
      setShowResumenModelo(true);
    } catch (err) {
      console.error('Error loading modelo statistics:', err);
      setEstadisticasModelo(null);
      setSelectedModelo(modelo);
      setShowResumenModelo(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return 'text-red-600';
    if (stock <= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStockStatusIcon = (stock: number) => {
    if (stock === 0) return <XCircle className="h-4 w-4" />;
    if (stock <= 5) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getColorCode = (colorName: string) => {
    const colorMap: { [key: string]: string } = {
      // Colores comunes en español
      'rojo': '#dc2626',
      'azul': '#2563eb',
      'verde': '#16a34a',
      'amarillo': '#eab308',
      'negro': '#1f2937',
      'blanco': '#f9fafb',
      'gris': '#6b7280',
      'rosa': '#ec4899',
      'morado': '#7c3aed',
      'naranja': '#ea580c',
      'cafe': '#92400e',
      'marrón': '#92400e',
      'dorado': '#d97706',
      'plateado': '#9ca3af',
      'celeste': '#0ea5e9',
      'turquesa': '#06b6d4',
      'violeta': '#8b5cf6',
      'beige': '#d6d3d1',
      // Colores en inglés
      'red': '#dc2626',
      'blue': '#2563eb',
      'green': '#16a34a',
      'yellow': '#eab308',
      'black': '#1f2937',
      'white': '#f9fafb',
      'gray': '#6b7280',
      'pink': '#ec4899',
      'purple': '#7c3aed',
      'orange': '#ea580c',
      'brown': '#92400e',
      'gold': '#d97706',
      'silver': '#9ca3af',
    };
    
    const normalizedColor = colorName.toLowerCase().trim();
    return colorMap[normalizedColor] || '#6b7280'; // Default gray if color not found
  };

  if (loading && (viewMode === 'modelos' ? modelos.length === 0 : motos.length === 0)) {
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
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Motocicletas</h1>
            <p className="mt-1 text-sm text-gray-500">
              Administra el inventario de motocicletas
            </p>
          </div>
          <button
            onClick={() => openModal('create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {viewMode === 'modelos' ? 'Nueva Motocicleta' : 'Nueva Moto'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setViewMode('modelos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'modelos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Palette className="h-4 w-4 mr-2" />
                Modelos con Colores
              </div>
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'individual'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Bike className="h-4 w-4 mr-2" />
                Vista Individual
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por marca, modelo o chasis..."
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
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Content Grid */}
      {viewMode === 'modelos' ? (
        /* Vista de Modelos con Colores */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modelos.map((modelo) => (
            <div key={modelo.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Imagen */}
              <div className="h-48 bg-gray-200 relative">
                {modelo.imagen ? (
                  <img
                    src={modelo.imagen}
                    alt={`${modelo.marca} ${modelo.modelo} ${modelo.ano}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Bike className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                
                {/* Stock Badge */}
                <div className="absolute top-2 right-2">
                  <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    modelo.total_stock === 0 
                      ? 'bg-red-100 text-red-800' 
                      : modelo.total_stock <= 5 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                  }`}>
                    {getStockStatusIcon(modelo.total_stock)}
                    <span className="ml-1">{modelo.total_stock}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {modelo.marca} {modelo.modelo}
                  </h3>
                  <p className="text-sm text-gray-500">Año {modelo.ano}</p>
                </div>

                {/* Colores Disponibles */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Colores disponibles:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(modelo.colores_disponibles).map(([color, cantidad]) => (
                      <div 
                        key={color}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200"
                      >
                        <div 
                          className="w-3 h-3 rounded-full mr-2 border border-gray-300"
                          style={{ 
                            backgroundColor: getColorCode(color),
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                          }}
                        ></div>
                        <span className="font-semibold">{color}</span>
                        <span className="ml-1 px-1.5 py-0.5 bg-blue-200 text-blue-900 rounded-full text-xs font-bold">
                          {cantidad}
                        </span>
                      </div>
                    ))}
                    {Object.keys(modelo.colores_disponibles).length === 0 && (
                      <span className="text-xs text-gray-400 italic">Sin colores registrados</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Precio de Venta:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(modelo.precio_venta)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Ganancia:</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(modelo.ganancia)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Stock Total:</span>
                    <span className={`font-semibold ${getStockStatusColor(modelo.total_stock)}`}>
                      {modelo.total_stock} unidades
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleVerDetalleModelo(modelo)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Ver detalles"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openModal('edit', null, modelo)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteModelo(modelo)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleResumenModelo(modelo)}
                      className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      title="Ver resumen y estadísticas"
                    >
                      <Info className="h-4 w-4 mr-1" />
                      Resumen
                    </button>
                    {modelo.disponible && (
                      <button
                        onClick={() => handleVentaDirecta(modelo)}
                        className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Vender
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Vista Individual Original */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {motos.map((moto) => (
          <div key={moto.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* Imagen */}
            <div className="h-48 bg-gray-200 relative">
              {moto.imagen ? (
                <img
                  src={moto.imagen}
                  alt={`${moto.marca} ${moto.modelo}${moto.color ? ` ${moto.color}` : ''}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Bike className="h-16 w-16 text-gray-400" />
                </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                {moto.disponible ? (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    Disponible
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    No Disponible
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {moto.marca} {moto.modelo}
                  {moto.color && <span className="text-blue-600"> - {moto.color}</span>}
                </h3>
                <p className="text-sm text-gray-500">Año {moto.ano}</p>
                {moto.chasis && (
                  <p className="text-xs text-gray-400">Chasis: {moto.chasis}</p>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Precio de Venta:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(moto.precio_venta)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Ganancia:</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(moto.ganancia)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Stock:</span>
                  <div className={`flex items-center gap-1 ${getStockStatusColor(moto.cantidad_stock)}`}>
                    {getStockStatusIcon(moto.cantidad_stock)}
                    <span className="font-semibold">{moto.cantidad_stock}</span>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  Ingreso: {new Date(moto.fecha_ingreso).toLocaleDateString('es-CO')}
                </div>
              </div>

              {moto.descripcion && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-2">{moto.descripcion}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => openModal('view', moto)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Ver detalles"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openModal('edit', moto)}
                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(moto)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Empty State */}
      {((viewMode === 'modelos' && modelos.length === 0) || (viewMode === 'individual' && motos.length === 0)) && !loading && (
        <div className="text-center py-12">
          <Bike className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {viewMode === 'modelos' ? 'No hay modelos de motocicletas' : 'No hay motocicletas'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm 
              ? `No se encontraron ${viewMode === 'modelos' ? 'modelos' : 'motos'} con esa búsqueda.` 
              : `Comienza agregando tu primer${viewMode === 'modelos' ? ' modelo de' : 'a'} motocicleta.`
            }
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => openModal('create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                {viewMode === 'modelos' ? 'Nuevo Modelo' : 'Nueva Moto'}
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

      {/* Form Modals */}
      {showModal && viewMode === 'modelos' && (
        <MotoModeloForm
          modelo={selectedModelo}
          mode={modalMode}
          onClose={closeModal}
          onSave={handleFormSave}
        />
      )}
      
      {showModal && viewMode === 'individual' && (
        <MotoForm
          moto={selectedMoto}
          mode={modalMode}
          onClose={closeModal}
          onSave={handleFormSave}
        />
      )}

      {/* Modelo Detail Modal */}
      {showDetalleModelo && selectedModelo && (
        <MotoModeloDetalle
          modelo={selectedModelo}
          onClose={() => {
            setShowDetalleModelo(false);
            setSelectedModelo(null);
          }}
          onVentaDirecta={handleVentaDirecta}
          onUpdate={handleUpdateModelo}
        />
      )}

      {/* Venta Directa Modal */}
      {showVentaDirecta && selectedModelo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Venta Directa - {selectedModelo.marca} {selectedModelo.modelo}
            </h3>
            
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">Información del Modelo</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><span className="font-medium">Modelo:</span> {selectedModelo.marca} {selectedModelo.modelo} {selectedModelo.ano}</p>
                  <p><span className="font-medium">Precio:</span> {formatCurrency(selectedModelo.precio_venta)}</p>
                  <p><span className="font-medium">Stock Total:</span> {selectedModelo.total_stock} unidades</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-3">Colores Disponibles</h4>
                <div className="space-y-2">
                  {Object.entries(selectedModelo.colores_disponibles).map(([color, cantidad]) => (
                    <div key={color} className="flex justify-between items-center p-2 bg-white rounded-lg border">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3 border border-gray-300"
                          style={{ 
                            backgroundColor: getColorCode(color),
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                          }}
                        ></div>
                        <span className="text-yellow-700 font-medium">{color}</span>
                      </div>
                      <span className="text-yellow-700 font-bold bg-yellow-100 px-2 py-1 rounded-full text-xs">
                        {cantidad} unidades
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowVentaDirecta(false);
                  setSelectedModelo(null);
                }}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Redirigir al sistema de ventas con información pre-cargada
                  const searchParams = new URLSearchParams({
                    modelo_id: selectedModelo.id.toString(),
                    marca: selectedModelo.marca,
                    modelo: selectedModelo.modelo,
                    ano: selectedModelo.ano.toString(),
                    precio: selectedModelo.precio_venta.toString()
                  });
                  
                  // Navegar a la página de ventas con parámetros
                  window.location.href = `/ventas?${searchParams.toString()}`;
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Ir a Ventas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resumen Modal */}
      {showResumenModelo && selectedModelo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Info className="h-6 w-6 mr-2" />
                Resumen Detallado - {selectedModelo.marca} {selectedModelo.modelo} {selectedModelo.ano}
              </h2>
              <button 
                onClick={() => {
                  setShowResumenModelo(false);
                  setSelectedModelo(null);
                  setEstadisticasModelo(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {estadisticasModelo ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Información General */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                      <Bike className="h-5 w-5 mr-2" />
                      Información General
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Precio de Compra:</span>
                        <span className="font-semibold text-blue-900">{formatCurrency(estadisticasModelo.modelo_info.precio_compra)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Precio de Venta:</span>
                        <span className="font-semibold text-blue-900">{formatCurrency(estadisticasModelo.modelo_info.precio_venta)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Ganancia por Unidad:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(estadisticasModelo.modelo_info.ganancia_por_unidad)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Estado:</span>
                        <span className={`font-semibold ${estadisticasModelo.modelo_info.activa ? 'text-green-600' : 'text-red-600'}`}>
                          {estadisticasModelo.modelo_info.activa ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inventario Actual */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Inventario Actual
                    </h3>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-green-700">Stock Total:</span>
                        <span className="font-semibold text-green-900">{estadisticasModelo.inventario_actual.stock_total} unidades</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Valor del Inventario:</span>
                        <span className="font-semibold text-green-900">{formatCurrency(estadisticasModelo.resumen.valor_inventario_actual)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Ganancia Potencial:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(estadisticasModelo.inventario_actual.ganancia_total_stock)}</span>
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-green-900 mb-2">Por Color:</h4>
                    <div className="space-y-2">
                      {Object.entries(estadisticasModelo.inventario_actual.por_color).map(([color, info]: [string, any]) => (
                        <div key={color} className="flex justify-between items-center p-2 bg-white rounded border">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                              style={{ backgroundColor: getColorCode(color) }}
                            ></div>
                            <span className="font-medium">{color}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{info.stock} unidades</div>
                            {info.descuento > 0 && (
                              <div className="text-xs text-orange-600">-{info.descuento}% descuento</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ventas Históricas */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Ventas Históricas
                    </h3>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Total Vendidas:</span>
                        <span className="font-semibold text-purple-900">{estadisticasModelo.ventas_historicas.total_vendidas} unidades</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Ingresos Totales:</span>
                        <span className="font-semibold text-purple-900">{formatCurrency(estadisticasModelo.ventas_historicas.total_ingresos)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Ganancia por Ventas:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(estadisticasModelo.ventas_historicas.ganancia_total_ventas)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Precio Promedio:</span>
                        <span className="font-semibold text-purple-900">{formatCurrency(estadisticasModelo.resumen.precio_promedio_venta)}</span>
                      </div>
                    </div>

                    <h4 className="font-medium text-purple-900 mb-2">Ventas por Color:</h4>
                    <div className="space-y-2">
                      {Object.entries(estadisticasModelo.ventas_historicas.por_color).map(([color, cantidad]: [string, any]) => (
                        <div key={color} className="flex justify-between items-center p-2 bg-white rounded border">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                              style={{ backgroundColor: getColorCode(color) }}
                            ></div>
                            <span className="font-medium">{color}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{cantidad} vendidas</div>
                            <div className="text-xs text-purple-600">
                              {formatCurrency(estadisticasModelo.ventas_historicas.ingresos_por_color[color] || 0)} ingresos
                            </div>
                          </div>
                        </div>
                      ))}
                      {Object.keys(estadisticasModelo.ventas_historicas.por_color).length === 0 && (
                        <div className="text-center text-purple-500 italic py-4">
                          No hay ventas registradas aún
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Análisis de Rendimiento */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Análisis de Rendimiento
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-orange-700">Rotación de Stock:</span>
                        <span className="font-semibold text-orange-900">{estadisticasModelo.resumen.rotacion_stock.toFixed(1)}%</span>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-orange-900 mb-3">Resumen Financiero:</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-white rounded border">
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(estadisticasModelo.inventario_actual.ganancia_total_stock)}</div>
                            <div className="text-sm text-gray-600">Ganancia Potencial (Stock)</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded border">
                            <div className="text-2xl font-bold text-purple-600">{formatCurrency(estadisticasModelo.ventas_historicas.ganancia_total_ventas)}</div>
                            <div className="text-sm text-gray-600">Ganancia Realizada (Ventas)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => {
                  setShowResumenModelo(false);
                  setSelectedModelo(null);
                  setEstadisticasModelo(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Motocicletas;