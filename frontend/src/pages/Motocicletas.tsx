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
  X,
  Filter,
  Car,
  Clock,
  PackageX,
  Building
} from 'lucide-react';
import { motoService } from '../services/motoService';
import { motoModeloService } from '../services/motoModeloService';
import MotoForm from '../components/MotoForm';
import MotoModeloForm from '../components/MotoModeloForm';
import MotoModeloDetalle from '../components/MotoModeloDetalle';
import ViewToggle from '../components/common/ViewToggle';
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
  const [showEspecificaciones, setShowEspecificaciones] = useState(false);
  
  // Nuevos estados para filtros y agrupación con persistencia
  const [filterType, setFilterType] = useState<'all' | 'new' | 'used' | 'out_of_stock'>(() => {
    const saved = localStorage.getItem('motocicletas_filter_type');
    return (saved as 'all' | 'new' | 'used' | 'out_of_stock') || 'all';
  });
  const [groupByBrand, setGroupByBrand] = useState(() => {
    const saved = localStorage.getItem('motocicletas_group_by_brand');
    return saved === 'true';
  });
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('motocicletas_display_mode');
    return (saved as 'grid' | 'list') || 'grid';
  });

  // Funciones wrapper para persistir configuración
  const handleFilterTypeChange = (newFilterType: 'all' | 'new' | 'used' | 'out_of_stock') => {
    setFilterType(newFilterType);
    localStorage.setItem('motocicletas_filter_type', newFilterType);
  };

  const handleGroupByBrandChange = (newGroupByBrand: boolean) => {
    setGroupByBrand(newGroupByBrand);
    localStorage.setItem('motocicletas_group_by_brand', newGroupByBrand.toString());
  };

  const handleDisplayModeChange = (newDisplayMode: 'grid' | 'list') => {
    setDisplayMode(newDisplayMode);
    localStorage.setItem('motocicletas_display_mode', newDisplayMode);
  };

  const loadMotos = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await motoService.getMotos(page, search);
      console.log('Motos cargadas:', response.results.map(m => ({ id: m.id, marca: m.marca, modelo: m.modelo, condicion: m.condicion })));
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
      console.log('Modelos cargados (DETALLE):');
      response.results.forEach((m, index) => {
        console.log(`Modelo ${index + 1}:`, {
          id: m.id,
          marca: m.marca,
          modelo: m.modelo,
          condicion: m.condicion,
          condicion_raw: JSON.stringify(m.condicion),
          tipo_condicion: typeof m.condicion
        });
      });
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
    console.log('handleFormSave llamado, viewMode:', viewMode);
    const editedModeloId = selectedModelo?.id;
    const editedMotoId = selectedMoto?.id;
    
    // Pequeño delay para asegurar que el backend haya procesado la actualización
    setTimeout(() => {
      if (viewMode === 'modelos') {
        console.log('Recargando modelos...');
        console.log('Modelo editado ID:', editedModeloId);
        loadModelos(currentPage, searchTerm);
      } else {
        console.log('Recargando motos...');
        console.log('Moto editada ID:', editedMotoId);
        loadMotos(currentPage, searchTerm);
      }
    }, 100);
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
  const [modeloEspecificaciones, setModeloEspecificaciones] = useState<MotoModelo | null>(null);

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

  const handleVerEspecificaciones = (modelo: MotoModelo) => {
    setModeloEspecificaciones(modelo);
    setShowEspecificaciones(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrencySymbol = (currency: string) => {
    switch(currency) {
      case 'USD': return '$';
      case 'RD': return 'RD$';
      case 'EUR': return '€';
      case 'COP': return '$';
      default: return '$';
    }
  };

  const formatCurrencyWithSymbol = (amount: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    const formattedAmount = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    
    if (currency === 'EUR') {
      return `${formattedAmount}${symbol}`;
    }
    return `${symbol} ${formattedAmount}`;
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

  // Nuevas funciones de filtrado y agrupación
  const getFilteredData = () => {
    let filteredData = viewMode === 'modelos' ? modelos : motos;
    
    // Aplicar filtros según el tipo seleccionado
    switch (filterType) {
      case 'new':
        if (viewMode === 'modelos') {
          filteredData = modelos.filter(modelo => modelo.condicion === 'nueva');
        } else {
          filteredData = motos.filter(moto => moto.condicion === 'nueva');
        }
        break;
      case 'used':
        if (viewMode === 'modelos') {
          filteredData = modelos.filter(modelo => modelo.condicion === 'usada');
        } else {
          filteredData = motos.filter(moto => moto.condicion === 'usada');
        }
        break;
      case 'out_of_stock':
        if (viewMode === 'modelos') {
          filteredData = modelos.filter(modelo => modelo.total_stock === 0);
        } else {
          filteredData = motos.filter(moto => moto.cantidad_stock === 0);
        }
        break;
      default:
        // 'all' - no filtrar
        break;
    }

    // Aplicar búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (viewMode === 'modelos') {
        filteredData = filteredData.filter((modelo: MotoModelo) =>
          modelo.marca.toLowerCase().includes(search) ||
          modelo.modelo.toLowerCase().includes(search) ||
          modelo.ano.toString().includes(search)
        );
      } else {
        filteredData = filteredData.filter((moto: Moto) =>
          moto.marca.toLowerCase().includes(search) ||
          moto.modelo.toLowerCase().includes(search) ||
          moto.ano.toString().includes(search) ||
          (moto.color && moto.color.toLowerCase().includes(search))
        );
      }
    }

    return filteredData;
  };

  const getGroupedByBrand = () => {
    const filteredData = getFilteredData();
    if (!groupByBrand) return { 'Todas las marcas': filteredData };

    const grouped = filteredData.reduce((acc: any, item: any) => {
      const brand = item.marca.toUpperCase();
      if (!acc[brand]) {
        acc[brand] = [];
      }
      acc[brand].push(item);
      return acc;
    }, {});

    return grouped;
  };

  const getFilterStats = () => {
    const allData = viewMode === 'modelos' ? modelos : motos;
    const newCount = allData.filter(item => item.condicion === 'nueva').length;
    const usedCount = allData.filter(item => item.condicion === 'usada').length;
    const outOfStockCount = viewMode === 'modelos' 
      ? modelos.filter(modelo => modelo.total_stock === 0).length
      : motos.filter(moto => moto.cantidad_stock === 0).length;

    return { newCount, usedCount, outOfStockCount, total: allData.length };
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

      {/* Filtros y Controles */}
      <div className="mb-6 space-y-4">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(() => {
            const stats = getFilterStats();
            return (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <Bike className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total</p>
                      <p className="text-lg font-semibold text-blue-700">{stats.total}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <Car className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Nuevas</p>
                      <p className="text-lg font-semibold text-green-700">{stats.newCount}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Usadas</p>
                      <p className="text-lg font-semibold text-yellow-700">{stats.usedCount}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <PackageX className="h-5 w-5 text-red-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Sin Stock</p>
                      <p className="text-lg font-semibold text-red-700">{stats.outOfStockCount}</p>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Controles de filtrado y visualización */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
          {/* Filtros de tipo */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleFilterTypeChange('all')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => handleFilterTypeChange('new')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  filterType === 'new'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Nuevas
              </button>
              <button
                onClick={() => handleFilterTypeChange('used')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  filterType === 'used'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Usadas
              </button>
              <button
                onClick={() => handleFilterTypeChange('out_of_stock')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  filterType === 'out_of_stock'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Sin Stock
              </button>
            </div>
          </div>

          {/* Controles de vista */}
          <div className="flex items-center gap-4">
            {/* Agrupar por marca */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={groupByBrand}
                onChange={(e) => handleGroupByBrandChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <Building className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Agrupar por marca</span>
            </label>

            {/* Modo de visualización */}
            <ViewToggle viewMode={displayMode} onViewModeChange={handleDisplayModeChange} />
          </div>
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
        <div className="space-y-6">
          {Object.entries(getGroupedByBrand()).map(([brand, items]: [string, any[]]) => (
            <div key={brand} className="space-y-4">
              {/* Header de marca */}
              {groupByBrand && (
                <div className="flex items-center gap-3 border-b border-gray-200 pb-2">
                  <Building className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">{brand}</h2>
                  <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                    {items.length} {items.length === 1 ? 'modelo' : 'modelos'}
                  </span>
                </div>
              )}
              
              {/* Grid de elementos */}
              <div className={`
                ${displayMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
                }
              `}>
                {items.map((modelo) => (
                  displayMode === 'grid' ? (
                    /* Vista en grilla */
                    <div key={modelo.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Imagen */}
                      <div 
                        className="h-48 bg-gray-200 relative cursor-pointer hover:opacity-90 transition-opacity group"
                        onClick={() => handleVerEspecificaciones(modelo)}
                        title="Click para ver especificaciones técnicas"
                      >
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
                        
                        {/* Overlay con ícono de información */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                          <Info className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                        
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
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {modelo.marca} {modelo.modelo}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              modelo.condicion?.toLowerCase()?.trim() === 'nueva' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {modelo.condicion?.toLowerCase()?.trim() === 'nueva' ? 'Nueva' : 'Usada'}
                            </span>
                          </div>
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
                            <span className="text-gray-600">Compra:</span>
                            <span className="font-semibold text-orange-600">
                              {formatCurrencyWithSymbol(modelo.precio_compra, modelo.moneda_compra || 'COP')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Venta:</span>
                            <span className="font-semibold text-green-600">
                              {formatCurrencyWithSymbol(modelo.precio_venta, modelo.moneda_venta || 'COP')}
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
                              className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                              title="Ver detalles completos y estadísticas"
                            >
                              <Info className="h-4 w-4 mr-1" />
                              Ver Detalles
                            </button>
                            {modelo.disponible && (
                              <button
                                onClick={() => handleVentaDirecta(modelo)}
                                className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Vender
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Vista en lista */
                    <div key={modelo.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Imagen pequeña */}
                            <div 
                              className="h-16 w-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-75 transition-opacity"
                              onClick={() => handleVerEspecificaciones(modelo)}
                              title="Click para ver especificaciones técnicas"
                            >
                              {modelo.imagen ? (
                                <img
                                  src={modelo.imagen}
                                  alt={`${modelo.marca} ${modelo.modelo} ${modelo.ano}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Bike className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* Información básica */}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {modelo.marca} {modelo.modelo}
                                </h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  modelo.condicion === 'nueva' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {modelo.condicion === 'nueva' ? 'Nueva' : 'Usada'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">Año {modelo.ano}</p>
                              
                              {/* Colores en línea */}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400">Colores:</span>
                                <div className="flex gap-1">
                                  {Object.entries(modelo.colores_disponibles).slice(0, 4).map(([color, cantidad]) => (
                                    <div 
                                      key={color}
                                      className="w-4 h-4 rounded-full border border-gray-300"
                                      style={{ backgroundColor: getColorCode(color) }}
                                      title={`${color}: ${cantidad} unidades`}
                                    ></div>
                                  ))}
                                  {Object.keys(modelo.colores_disponibles).length > 4 && (
                                    <span className="text-xs text-gray-400">+{Object.keys(modelo.colores_disponibles).length - 4}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Información de precio y stock */}
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Compra</p>
                              <p className="font-semibold text-orange-600">{formatCurrencyWithSymbol(modelo.precio_compra, modelo.moneda_compra || 'COP')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Venta</p>
                              <p className="font-semibold text-green-600">{formatCurrencyWithSymbol(modelo.precio_venta, modelo.moneda_venta || 'COP')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Stock</p>
                              <div className={`flex items-center justify-end gap-1 ${getStockStatusColor(modelo.total_stock)}`}>
                                {getStockStatusIcon(modelo.total_stock)}
                                <span className="font-semibold">{modelo.total_stock}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Acciones */}
                          <div className="flex items-center space-x-1 ml-4">
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
                            <button
                              onClick={() => handleResumenModelo(modelo)}
                              className="flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              title="Ver detalles completos"
                            >
                              <Info className="h-3 w-3 mr-1" />
                              Ver Detalles
                            </button>
                            {modelo.disponible && (
                              <button
                                onClick={() => handleVentaDirecta(modelo)}
                                className="flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                title="Vender"
                              >
                                <ShoppingCart className="h-3 w-3 mr-1" />
                                Vender
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Vista Individual con Filtros y Agrupación */
        <div className="space-y-6">
          {Object.entries(getGroupedByBrand()).map(([brand, items]: [string, any[]]) => (
            <div key={brand} className="space-y-4">
              {/* Header de marca */}
              {groupByBrand && (
                <div className="flex items-center gap-3 border-b border-gray-200 pb-2">
                  <Building className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">{brand}</h2>
                  <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                    {items.length} {items.length === 1 ? 'moto' : 'motos'}
                  </span>
                </div>
              )}
              
              {/* Grid de elementos */}
              <div className={`
                ${displayMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
                }
              `}>
                {items.map((moto) => (
                  displayMode === 'grid' ? (
                    /* Vista en grilla */
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
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {moto.marca} {moto.modelo}
                              {moto.color && <span className="text-blue-600"> - {moto.color}</span>}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              moto.condicion?.toLowerCase()?.trim() === 'nueva' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {moto.condicion?.toLowerCase()?.trim() === 'nueva' ? 'Nueva' : 'Usada'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">Año {moto.ano}</p>
                          {moto.chasis && (
                            <p className="text-xs text-gray-400">Chasis: {moto.chasis}</p>
                          )}
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Compra:</span>
                            <span className="font-semibold text-orange-600">
                              {formatCurrencyWithSymbol(moto.precio_compra, moto.moneda_compra || 'COP')}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Venta:</span>
                            <span className="font-semibold text-green-600">
                              {formatCurrencyWithSymbol(moto.precio_venta, moto.moneda_venta || 'COP')}
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
                  ) : (
                    /* Vista en lista */
                    <div key={moto.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Imagen pequeña */}
                            <div className="h-16 w-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              {moto.imagen ? (
                                <img
                                  src={moto.imagen}
                                  alt={`${moto.marca} ${moto.modelo}${moto.color ? ` ${moto.color}` : ''}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Bike className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* Información básica */}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {moto.marca} {moto.modelo}
                                  {moto.color && <span className="text-blue-600"> - {moto.color}</span>}
                                </h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  moto.condicion === 'nueva' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {moto.condicion === 'nueva' ? 'Nueva' : 'Usada'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">Año {moto.ano}</p>
                              {moto.chasis && (
                                <p className="text-xs text-gray-400">Chasis: {moto.chasis}</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Información de precio y stock */}
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Compra</p>
                              <p className="font-semibold text-orange-600">{formatCurrencyWithSymbol(moto.precio_compra, moto.moneda_compra || 'COP')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Venta</p>
                              <p className="font-semibold text-green-600">{formatCurrencyWithSymbol(moto.precio_venta, moto.moneda_venta || 'COP')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Stock</p>
                              <div className={`flex items-center justify-end gap-1 ${getStockStatusColor(moto.cantidad_stock)}`}>
                                {getStockStatusIcon(moto.cantidad_stock)}
                                <span className="font-semibold">{moto.cantidad_stock}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Estado</p>
                              <div className={`text-xs font-medium ${moto.disponible ? 'text-green-600' : 'text-red-600'}`}>
                                {moto.disponible ? 'Disponible' : 'No Disponible'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Acciones */}
                          <div className="flex items-center space-x-1 ml-4">
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
                    </div>
                  )
                ))}
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
                  <p><span className="font-medium">Compra:</span> {formatCurrencyWithSymbol(selectedModelo.precio_compra, selectedModelo.moneda_compra || 'COP')}</p>
                  <p><span className="font-medium">Venta:</span> {formatCurrencyWithSymbol(selectedModelo.precio_venta, selectedModelo.moneda_venta || 'COP')}</p>
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
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Info className="h-6 w-6 mr-3 text-blue-600" />
                <div>
                  <div className="text-xl font-bold">{selectedModelo.marca} {selectedModelo.modelo}</div>
                  <div className="text-sm text-gray-600 font-normal">Año {selectedModelo.ano} • Detalles Completos y Estadísticas</div>
                </div>
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
                <div className="space-y-6">
                  {/* Información Básica y Estado */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Imagen y Info Básica */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="aspect-w-16 aspect-h-12 mb-4">
                        {selectedModelo.imagen ? (
                          <img
                            src={selectedModelo.imagen}
                            alt={`${selectedModelo.marca} ${selectedModelo.modelo}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Bike className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900">{selectedModelo.marca} {selectedModelo.modelo}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Año:</span>
                          <span className="font-medium">{selectedModelo.ano}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Condición:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            selectedModelo.condicion === 'nueva' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedModelo.condicion === 'nueva' ? 'Nueva' : 'Usada'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Estado:</span>
                          <span className={`font-medium ${
                            estadisticasModelo.modelo_info.activa ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {estadisticasModelo.modelo_info.activa ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Información de Precios */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 shadow-sm">
                      <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Información Financiera
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-orange-700 text-sm">Precio de Compra:</span>
                          <span className="font-bold text-orange-900">
                            {formatCurrencyWithSymbol(estadisticasModelo.modelo_info.precio_compra, selectedModelo.moneda_compra || 'COP')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-700 text-sm">Precio de Venta:</span>
                          <span className="font-bold text-green-900">
                            {formatCurrencyWithSymbol(estadisticasModelo.modelo_info.precio_venta, selectedModelo.moneda_venta || 'COP')}
                          </span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700 text-sm font-medium">Ganancia por Unidad:</span>
                            <span className="font-bold text-blue-900 text-lg">
                              {formatCurrency(estadisticasModelo.modelo_info.ganancia_por_unidad)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stock Rápido */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 shadow-sm">
                      <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                        <Package className="h-5 w-5 mr-2" />
                        Stock Actual
                      </h3>
                      <div className="text-center mb-3">
                        <div className="text-3xl font-bold text-green-900">{estadisticasModelo.inventario_actual.stock_total}</div>
                        <div className="text-sm text-green-700">unidades disponibles</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">Valor del Inventario:</span>
                          <span className="font-semibold text-green-900">
                            {formatCurrency(estadisticasModelo.resumen.valor_inventario_actual)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">Ganancia Potencial:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(estadisticasModelo.inventario_actual.ganancia_total_stock)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección detallada */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Colores Disponibles Detallado */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                      <Palette className="h-5 w-5 mr-2" />
                      Colores Disponibles en Inventario
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(estadisticasModelo.inventario_actual.por_color).map(([color, info]: [string, any]) => (
                        <div key={color} className="bg-white rounded-lg border border-blue-200 p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div 
                                className="w-5 h-5 rounded-full mr-3 border-2 border-white shadow-md"
                                style={{ 
                                  backgroundColor: getColorCode(color),
                                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1)'
                                }}
                              ></div>
                              <span className="font-semibold text-blue-900 capitalize">{color}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-blue-900 text-lg">{info.stock}</div>
                              <div className="text-xs text-blue-600">unidades</div>
                            </div>
                          </div>
                          
                          {/* Información de chasis */}
                          {info.chasis_list && info.chasis_list.length > 0 && (
                            <div className="mt-3 border-t pt-2">
                              <div className="text-xs font-medium text-blue-700 mb-1">Números de Chasis:</div>
                              <div className="space-y-1">
                                {info.chasis_list.map((chasisInfo: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center bg-blue-50 px-2 py-1 rounded text-xs">
                                    <span className="font-mono text-blue-800">{chasisInfo.chasis}</span>
                                    <div className="text-right">
                                      <div className="text-blue-600 font-medium">{chasisInfo.cantidad} unid.</div>
                                      <div className="text-blue-500 text-xs">
                                        {new Date(chasisInfo.fecha_ingreso).toLocaleDateString('es-CO')}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {info.descuento > 0 && (
                            <div className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full text-center font-medium mt-2">
                              {info.descuento}% descuento aplicado
                            </div>
                          )}
                        </div>
                      ))}
                      {Object.keys(estadisticasModelo.inventario_actual.por_color).length === 0 && (
                        <div className="col-span-2 text-center text-blue-500 italic py-8">
                          <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          No hay colores registrados en el inventario
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Historial de Ventas Mejorado */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Historial de Ventas y Rendimiento
                    </h3>
                    
                    {/* Resumen rápido */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center bg-white rounded-lg p-3 border border-purple-200">
                        <div className="text-2xl font-bold text-purple-900">{estadisticasModelo.ventas_historicas.total_vendidas}</div>
                        <div className="text-sm text-purple-600">Unidades Vendidas</div>
                      </div>
                      <div className="text-center bg-white rounded-lg p-3 border border-purple-200">
                        <div className="text-xl font-bold text-green-600">{formatCurrency(estadisticasModelo.ventas_historicas.total_ingresos)}</div>
                        <div className="text-sm text-purple-600">Ingresos Totales</div>
                      </div>
                      <div className="text-center bg-white rounded-lg p-3 border border-purple-200">
                        <div className="text-xl font-bold text-blue-600">{formatCurrency(estadisticasModelo.resumen.precio_promedio_venta)}</div>
                        <div className="text-sm text-purple-600">Precio Promedio</div>
                      </div>
                    </div>

                    {/* Ventas por color */}
                    {Object.keys(estadisticasModelo.ventas_historicas.por_color).length > 0 ? (
                      <div>
                        <h4 className="font-medium text-purple-900 mb-3">Ventas por Color:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(estadisticasModelo.ventas_historicas.por_color).map(([color, cantidad]: [string, any]) => (
                            <div key={color} className="bg-white rounded-lg border border-purple-200 p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div 
                                    className="w-4 h-4 rounded-full mr-3 border-2 border-white shadow-sm"
                                    style={{ backgroundColor: getColorCode(color) }}
                                  ></div>
                                  <span className="font-medium text-purple-900 capitalize">{color}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-purple-900">{cantidad}</div>
                                  <div className="text-xs text-purple-600">vendidas</div>
                                </div>
                              </div>
                              <div className="mt-2 text-center">
                                <div className="text-sm font-medium text-green-600">
                                  {formatCurrency(estadisticasModelo.ventas_historicas.ingresos_por_color[color] || 0)}
                                </div>
                                <div className="text-xs text-purple-500">ingresos generados</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-purple-500 italic py-8">
                        <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No hay ventas registradas aún para este modelo
                      </div>
                    )}
                  </div>

                  </div>

                  {/* Análisis y Resumen Final */}
                  <div className="bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-300 rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <DollarSign className="h-6 w-6 mr-3 text-green-600" />
                      Análisis Financiero y Rendimiento
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Resumen de Ganancias */}
                      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-4 text-center">Resumen de Ganancias</h4>
                        <div className="space-y-4">
                          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-2xl font-bold text-green-700">
                              {formatCurrency(estadisticasModelo.inventario_actual.ganancia_total_stock)}
                            </div>
                            <div className="text-sm text-green-600 font-medium">Ganancia Potencial</div>
                            <div className="text-xs text-gray-500 mt-1">(Stock actual)</div>
                          </div>
                          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-2xl font-bold text-blue-700">
                              {formatCurrency(estadisticasModelo.ventas_historicas.ganancia_total_ventas)}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">Ganancia Realizada</div>
                            <div className="text-xs text-gray-500 mt-1">(Ventas históricas)</div>
                          </div>
                        </div>
                      </div>

                      {/* Métricas Clave */}
                      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-4 text-center">Métricas Clave</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Rotación de Stock:</span>
                            <span className="font-bold text-gray-800">{estadisticasModelo.resumen.rotacion_stock.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Margen de Ganancia:</span>
                            <span className="font-bold text-green-600">
                              {((estadisticasModelo.modelo_info.ganancia_por_unidad / estadisticasModelo.modelo_info.precio_venta) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Colores Disponibles:</span>
                            <span className="font-bold text-blue-600">{Object.keys(estadisticasModelo.inventario_actual.por_color).length}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Precio Promedio Venta:</span>
                            <span className="font-bold text-purple-600">{formatCurrency(estadisticasModelo.resumen.precio_promedio_venta)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Estado y Acciones */}
                      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-4 text-center">Estado y Acciones</h4>
                        <div className="space-y-4">
                          <div className={`text-center p-4 rounded-lg border-2 ${
                            estadisticasModelo.modelo_info.activa 
                              ? 'bg-green-50 border-green-200 text-green-800' 
                              : 'bg-red-50 border-red-200 text-red-800'
                          }`}>
                            <div className="font-bold text-lg">
                              {estadisticasModelo.modelo_info.activa ? '✓ ACTIVO' : '✗ INACTIVO'}
                            </div>
                            <div className="text-sm opacity-75">Estado del modelo</div>
                          </div>
                          
                          <div className="space-y-2">
                            {selectedModelo.disponible && (
                              <button
                                onClick={() => {
                                  setShowResumenModelo(false);
                                  handleVentaDirecta(selectedModelo);
                                }}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Iniciar Venta
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setShowResumenModelo(false);
                                openModal('edit', null, selectedModelo);
                              }}
                              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar Modelo
                            </button>
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

      {/* Modal de Especificaciones Técnicas */}
      {showEspecificaciones && modeloEspecificaciones && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-gray-50 to-slate-100">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Bike className="h-6 w-6 mr-3 text-blue-600" />
                <div>
                  <div className="text-xl font-bold">{modeloEspecificaciones.marca} {modeloEspecificaciones.modelo}</div>
                  <div className="text-sm text-gray-600 font-normal">Año {modeloEspecificaciones.ano} • Especificaciones Técnicas</div>
                </div>
              </h2>
              <button 
                onClick={() => {
                  setShowEspecificaciones(false);
                  setModeloEspecificaciones(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Imagen Principal */}
                <div className="space-y-6">
                  <div className="aspect-w-16 aspect-h-12">
                    {modeloEspecificaciones.imagen ? (
                      <img
                        src={modeloEspecificaciones.imagen}
                        alt={`${modeloEspecificaciones.marca} ${modeloEspecificaciones.modelo}`}
                        className="w-full h-64 object-cover rounded-lg shadow-md"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Bike className="h-24 w-24 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Información General */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">Información General</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Marca:</span>
                        <span className="font-medium text-blue-900">{modeloEspecificaciones.marca}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Modelo:</span>
                        <span className="font-medium text-blue-900">{modeloEspecificaciones.modelo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Año:</span>
                        <span className="font-medium text-blue-900">{modeloEspecificaciones.ano}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Condición:</span>
                        <span className={`font-medium ${
                          modeloEspecificaciones.condicion === 'nueva' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {modeloEspecificaciones.condicion === 'nueva' ? 'Nueva' : 'Usada'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Precios */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3">Información de Precios</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Precio de Compra:</span>
                        <span className="font-bold text-orange-600">
                          {formatCurrencyWithSymbol(modeloEspecificaciones.precio_compra, 'COP')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Precio de Venta:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrencyWithSymbol(modeloEspecificaciones.precio_venta, 'COP')}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-green-700 font-medium">Ganancia por Unidad:</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(modeloEspecificaciones.precio_venta - modeloEspecificaciones.precio_compra)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Especificaciones Técnicas */}
                <div className="space-y-6">
                  {/* Motor */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-3 flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Especificaciones del Motor
                    </h3>
                    <div className="space-y-2 text-sm">
                      {modeloEspecificaciones.cilindraje && (
                        <div className="flex justify-between">
                          <span className="text-red-700">Cilindraje:</span>
                          <span className="font-medium text-red-900">{modeloEspecificaciones.cilindraje} CC</span>
                        </div>
                      )}
                      {modeloEspecificaciones.tipo_motor && (
                        <div className="flex justify-between">
                          <span className="text-red-700">Tipo de Motor:</span>
                          <span className="font-medium text-red-900">{modeloEspecificaciones.tipo_motor}</span>
                        </div>
                      )}
                      {modeloEspecificaciones.potencia && (
                        <div className="flex justify-between">
                          <span className="text-red-700">Potencia:</span>
                          <span className="font-medium text-red-900">{modeloEspecificaciones.potencia}</span>
                        </div>
                      )}
                      {modeloEspecificaciones.torque && (
                        <div className="flex justify-between">
                          <span className="text-red-700">Torque:</span>
                          <span className="font-medium text-red-900">{modeloEspecificaciones.torque}</span>
                        </div>
                      )}
                      {modeloEspecificaciones.combustible && (
                        <div className="flex justify-between">
                          <span className="text-red-700">Combustible:</span>
                          <span className="font-medium text-red-900">{modeloEspecificaciones.combustible}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transmisión y Peso */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Transmisión y Características
                    </h3>
                    <div className="space-y-2 text-sm">
                      {modeloEspecificaciones.transmision && (
                        <div className="flex justify-between">
                          <span className="text-purple-700">Transmisión:</span>
                          <span className="font-medium text-purple-900">{modeloEspecificaciones.transmision}</span>
                        </div>
                      )}
                      {modeloEspecificaciones.peso && (
                        <div className="flex justify-between">
                          <span className="text-purple-700">Peso:</span>
                          <span className="font-medium text-purple-900">{modeloEspecificaciones.peso} kg</span>
                        </div>
                      )}
                      {modeloEspecificaciones.capacidad_tanque && (
                        <div className="flex justify-between">
                          <span className="text-purple-700">Capacidad del Tanque:</span>
                          <span className="font-medium text-purple-900">{modeloEspecificaciones.capacidad_tanque} L</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Descripción */}
                  {modeloEspecificaciones.descripcion && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Descripción Adicional</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {modeloEspecificaciones.descripcion}
                      </p>
                    </div>
                  )}

                  {/* Estado */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 mb-3">Estado del Modelo</h3>
                    <div className="space-y-2">
                      <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                        modeloEspecificaciones.activa 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {modeloEspecificaciones.activa ? '✓ Modelo Activo' : '✗ Modelo Inactivo'}
                      </div>
                      <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ml-2 ${
                        modeloEspecificaciones.disponible 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {modeloEspecificaciones.disponible ? '📦 Stock Disponible' : '📭 Sin Stock'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowEspecificaciones(false);
                  setModeloEspecificaciones(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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