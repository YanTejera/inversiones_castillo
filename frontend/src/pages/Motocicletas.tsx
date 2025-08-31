import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
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
  Circle,
  Grid3X3,
  Info,
  X,
  Filter,
  Car,
  Clock,
  PackageX,
  Building,
  BarChart3,
  MapPin,
  Database
} from 'lucide-react';
import { motoService } from '../services/motoService';
import { motoModeloService } from '../services/motoModeloService';
// Lazy load heavy components that are not always used
const MotoForm = lazy(() => import('../components/MotoForm'));
const MotoModeloForm = lazy(() => import('../components/MotoModeloForm'));
const MotoModeloDetalle = lazy(() => import('../components/MotoModeloDetalle'));
const NewVentaForm = lazy(() => import('../components/NewVentaForm'));
const EspecificacionesTecnicas = lazy(() => import('../components/EspecificacionesTecnicas'));
const AdvancedInventoryAnalytics = lazy(() => import('../components/analytics/AdvancedInventoryAnalytics'));
const LocationManager = lazy(() => import('../components/location/LocationManager'));
const ImportExportManager = lazy(() => import('../components/dataManagement/ImportExportManager'));
// import ResumenModelo from '../components/ResumenModelo';
import ViewToggle from '../components/common/ViewToggle';
import { SkeletonCard, SkeletonList, SkeletonStats } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { usePermisos } from '../contexts/PermisosContext';
import AdvancedSearch from '../components/AdvancedSearch';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
import { motocicletasFilters, getSearchPlaceholder } from '../config/searchFilters';
import type { Moto, MotoModelo } from '../types';

// Define SearchFilters locally to avoid import issues
interface SearchFilters {
  [key: string]: any;
}

const Motocicletas: React.FC = () => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();
  const { tienePermiso, esMaster } = usePermisos();
  const [motos, setMotos] = useState<Moto[]>([]);
  const [modelos, setModelos] = useState<MotoModelo[]>([]);
  const [viewMode, setViewMode] = useState<'modelos' | 'individual' | 'analytics' | 'locations'>('modelos');
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
    persistKey: 'motocicletas_search',
    debounceMs: 300
  });
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedMoto, setSelectedMoto] = useState<Moto | null>(null);
  const [selectedModelo, setSelectedModelo] = useState<MotoModelo | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');
  const [showDetalleModelo, setShowDetalleModelo] = useState(false);
  const [showVentaDirecta, setShowVentaDirecta] = useState(false);
  const [showResumenModelo, setShowResumenModelo] = useState(false);
  const [showEspecificaciones, setShowEspecificaciones] = useState(false);
  const [deletingModelo, setDeletingModelo] = useState<number | null>(null);
  const [deletingMoto, setDeletingMoto] = useState<number | null>(null);
  
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
  const handleFilterTypeChange = useCallback((newFilterType: 'all' | 'new' | 'used' | 'out_of_stock') => {
    setFilterType(newFilterType);
    localStorage.setItem('motocicletas_filter_type', newFilterType);
  }, []); // No dependencies, function is stable

  const handleGroupByBrandChange = useCallback((newGroupByBrand: boolean) => {
    setGroupByBrand(newGroupByBrand);
    localStorage.setItem('motocicletas_group_by_brand', newGroupByBrand.toString());
  }, []);

  const handleDisplayModeChange = useCallback((newDisplayMode: 'grid' | 'list') => {
    setDisplayMode(newDisplayMode);
    localStorage.setItem('motocicletas_display_mode', newDisplayMode);
  }, []);

  const loadMotos = async (page = 1, search = '', filters: SearchFilters = {}) => {
    try {
      setLoading(true);
      
      // Build API parameters from search term and filters
      const params: any = {
        page,
        search: search || undefined,
        marca: filters.marca || undefined,
        condicion: filters.condicion || undefined,
        estado_disponibilidad: filters.estado_disponibilidad || undefined
      };
      
      // Handle number ranges
      if (filters.precio_venta && Array.isArray(filters.precio_venta)) {
        const [minPrecio, maxPrecio] = filters.precio_venta;
        if (minPrecio) params.precio_min = minPrecio;
        if (maxPrecio) params.precio_max = maxPrecio;
      }
      
      if (filters.ano && Array.isArray(filters.ano)) {
        const [minAno, maxAno] = filters.ano;
        if (minAno) params.ano_min = minAno;
        if (maxAno) params.ano_max = maxAno;
      }
      
      if (filters.cilindraje && Array.isArray(filters.cilindraje)) {
        const [minCilindraje, maxCilindraje] = filters.cilindraje;
        if (minCilindraje) params.cilindraje_min = minCilindraje;
        if (maxCilindraje) params.cilindraje_max = maxCilindraje;
      }
      
      if (filters.cantidad_stock && Array.isArray(filters.cantidad_stock)) {
        const [minStock, maxStock] = filters.cantidad_stock;
        if (minStock) params.stock_min = minStock;
        if (maxStock) params.stock_max = maxStock;
      }
      
      // Remove undefined parameters
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await motoService.getMotos(page, search, params);
      // console.log('Motos cargadas:', response.results.map(m => ({ id: m.id, marca: m.marca, modelo: m.modelo, condicion: m.condicion })));
      setMotos(response.results);
      setTotalPages(Math.ceil(response.count / 20)); // Asumiendo 20 items por página
    } catch (err) {
      const errorMsg = 'Error al cargar motocicletas';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error loading motos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadModelos = async (page = 1, search = '', filters: SearchFilters = {}) => {
    try {
      setLoading(true);
      
      // Build API parameters from search term and filters
      const params: any = {
        page,
        search: search || undefined,
        marca: filters.marca || undefined,
        condicion: filters.condicion || undefined,
        estado_disponibilidad: filters.estado_disponibilidad || undefined
      };
      
      // Handle number ranges
      if (filters.precio_venta && Array.isArray(filters.precio_venta)) {
        const [minPrecio, maxPrecio] = filters.precio_venta;
        if (minPrecio) params.precio_min = minPrecio;
        if (maxPrecio) params.precio_max = maxPrecio;
      }
      
      if (filters.ano && Array.isArray(filters.ano)) {
        const [minAno, maxAno] = filters.ano;
        if (minAno) params.ano_min = minAno;
        if (maxAno) params.ano_max = maxAno;
      }
      
      if (filters.cilindraje && Array.isArray(filters.cilindraje)) {
        const [minCilindraje, maxCilindraje] = filters.cilindraje;
        if (minCilindraje) params.cilindraje_min = minCilindraje;
        if (maxCilindraje) params.cilindraje_max = maxCilindraje;
      }
      
      if (filters.cantidad_stock && Array.isArray(filters.cantidad_stock)) {
        const [minStock, maxStock] = filters.cantidad_stock;
        if (minStock) params.stock_min = minStock;
        if (maxStock) params.stock_max = maxStock;
      }
      
      // Remove undefined parameters
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await motoModeloService.getModelos(page, search, params);
      // console.log('Modelos cargados (DETALLE):');
      // Debug logs removed for performance
      // response.results.forEach((m, index) => {
      //   console.log(`Modelo ${index + 1}:`, {
      //     id: m.id,
      //     marca: m.marca,
      //     modelo: m.modelo,
      //     condicion: m.condicion,
      //     condicion_raw: JSON.stringify(m.condicion),
      //     tipo_condicion: typeof m.condicion
      //   });
      // });
      setModelos(response.results);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err) {
      const errorMsg = 'Error al cargar modelos de motocicletas';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error loading modelos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'modelos') {
      loadModelos(currentPage, debouncedSearchTerm, activeFilters);
    } else {
      loadMotos(currentPage, debouncedSearchTerm, activeFilters);
    }
  }, [currentPage, viewMode, debouncedSearchTerm, activeFilters]);

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

  const handleDelete = async (moto: Moto) => {
    if (window.confirm(`¿Estás seguro de eliminar la moto ${moto.marca} ${moto.modelo}${moto.color ? ` ${moto.color}` : ''}?`)) {
      setDeletingMoto(moto.id);
      try {
        await motoService.deleteMoto(moto.id);
        loadMotos(currentPage, searchTerm);
        success(`Motocicleta ${moto.marca} ${moto.modelo} eliminada correctamente`);
      } catch (err) {
        showError('Error al eliminar moto');
        console.error('Error deleting moto:', err);
      } finally {
        setDeletingMoto(null);
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
        if (modalMode === 'create') {
          success('Modelo de motocicleta creado exitosamente');
        } else if (modalMode === 'edit') {
          success('Modelo de motocicleta actualizado exitosamente');
        }
      } else {
        console.log('Recargando motos...');
        console.log('Moto editada ID:', editedMotoId);
        loadMotos(currentPage, searchTerm);
        if (modalMode === 'create') {
          success('Motocicleta creada exitosamente');
        } else if (modalMode === 'edit') {
          success('Motocicleta actualizada exitosamente');
        }
      }
    }, 100);
  };

  const handleDeleteModelo = async (modelo: MotoModelo) => {
    if (window.confirm(`¿Estás seguro de eliminar el modelo ${modelo.marca} ${modelo.modelo} ${modelo.ano}?`)) {
      setDeletingModelo(modelo.id);
      try {
        await motoModeloService.deleteModelo(modelo.id);
        loadModelos(currentPage, searchTerm);
        success(`Modelo ${modelo.marca} ${modelo.modelo} ${modelo.ano} eliminado correctamente`);
      } catch (err) {
        showError('Error al eliminar modelo');
        console.error('Error deleting modelo:', err);
      } finally {
        setDeletingModelo(null);
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

  const handleVentaSuccess = () => {
    setShowVentaDirecta(false);
    // Recargar datos después de una venta exitosa
    loadModelos(currentPage, searchTerm);
    success('Venta procesada exitosamente');
  };

  const [estadisticasModelo, setEstadisticasModelo] = useState<any>(null);
  const [modeloEspecificaciones, setModeloEspecificaciones] = useState<MotoModelo | null>(null);

  const handleResumenModelo = async (modelo: MotoModelo) => {
    setSelectedModelo(modelo);
    setShowDetalleModelo(true);
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

  const getColorStyle = (colorName: string) => {
    const colorMap: Record<string, string> = {
      // Colores básicos
      'rojo': '#ef4444',
      'azul': '#3b82f6',
      'verde': '#22c55e',
      'amarillo': '#eab308',
      'negro': '#1f2937',
      'blanco': '#f8fafc',
      'gris': '#6b7280',
      'naranja': '#f97316',
      'morado': '#8b5cf6',
      'rosa': '#ec4899',
      'violeta': '#7c3aed',
      'celeste': '#0ea5e9',
      'dorado': '#fbbf24',
      'plateado': '#9ca3af',
      'café': '#92400e',
      'marrón': '#92400e',
      'beige': '#d6d3d1',
      'crema': '#fef7cd',
      // Variantes
      'rojo oscuro': '#dc2626',
      'azul oscuro': '#1d4ed8',
      'verde oscuro': '#16a34a',
      'gris oscuro': '#374151',
      'azul claro': '#60a5fa',
      'verde claro': '#4ade80',
      'rojo claro': '#f87171',
      // Default
      'default': '#6b7280'
    };
    
    const normalizedColor = colorName.toLowerCase().trim();
    return colorMap[normalizedColor] || colorMap['default'];
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
    let filteredData: any[];
    
    if (viewMode === 'modelos') {
      filteredData = modelos;
    } else if (viewMode === 'individual') {
      // En modo individual, usar las unidades de inventario
      filteredData = getAllInventoryUnits;
    } else {
      filteredData = motos;
    }
    
    // Aplicar filtros según el tipo seleccionado
    switch (filterType) {
      case 'new':
        filteredData = filteredData.filter(item => item.condicion === 'nueva');
        break;
      case 'used':
        filteredData = filteredData.filter(item => item.condicion === 'usada');
        break;
      case 'out_of_stock':
        if (viewMode === 'modelos') {
          filteredData = filteredData.filter(item => item.total_stock === 0);
        } else {
          // Para individual y motos, filtrar por cantidad_stock
          filteredData = filteredData.filter(item => item.cantidad_stock === 0);
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
          modelo.ano.toString().includes(search) ||
          // Buscar en inventario de cada modelo (chasis, color)
          (modelo.inventario && modelo.inventario.some(item => 
            (item.chasis && (
              item.chasis.toLowerCase().includes(search) ||
              item.chasis.slice(-4).toLowerCase() === search.slice(-4) // Últimos 4 dígitos
            )) ||
            (item.color && item.color.toLowerCase().includes(search))
          ))
        );
      } else {
        filteredData = filteredData.filter((moto: Moto) =>
          moto.marca.toLowerCase().includes(search) ||
          moto.modelo.toLowerCase().includes(search) ||
          moto.ano.toString().includes(search) ||
          (moto.color && moto.color.toLowerCase().includes(search)) ||
          // Buscar por chasis completo o últimos 4 dígitos
          (moto.chasis && (
            moto.chasis.toLowerCase().includes(search) ||
            moto.chasis.slice(-4).toLowerCase() === search.slice(-4)
          ))
        );
      }
    }

    return filteredData;
  };

  // Función memoizada para obtener todas las unidades individuales de inventario
  const getAllInventoryUnits = useMemo(() => {
    const allUnits: any[] = [];
    
    modelos.forEach(modelo => {
      if (modelo.inventario && modelo.inventario.length > 0) {
        modelo.inventario.forEach(item => {
          // Si hay múltiples chasis en el item, crear una entrada por cada chasis
          if (item.chasis_list && Array.isArray(item.chasis_list)) {
            item.chasis_list.forEach((chasisNum, index) => {
              if (chasisNum && chasisNum.trim()) {
                allUnits.push({
                  id: `${modelo.id}-${item.id}-${index}`,
                  marca: modelo.marca,
                  modelo: modelo.modelo,
                  ano: modelo.ano,
                  condicion: modelo.condicion,
                  color: item.color,
                  chasis: chasisNum,
                  fecha_ingreso: item.fecha_ingreso,
                  fecha_compra: item.fecha_compra,
                  precio_compra_individual: item.precio_compra_individual || modelo.precio_compra,
                  precio_venta: modelo.precio_venta,
                  moneda_compra: modelo.moneda_compra,
                  moneda_venta: modelo.moneda_venta,
                  tasa_dolar: item.tasa_dolar,
                  descuento_porcentaje: item.descuento_porcentaje || 0,
                  imagen: modelo.imagen,
                  activa: modelo.activa
                });
              }
            });
          } else if (item.chasis) {
            // Chasis con cantidad_stock - crear una unidad por cada cantidad
            // console.log(`DEBUG - Procesando chasis ${item.chasis} con cantidad_stock: ${item.cantidad_stock}`);
            for (let i = 0; i < item.cantidad_stock; i++) {
              allUnits.push({
                id: `${modelo.id}-${item.id}-${i}`,
                marca: modelo.marca,
                modelo: modelo.modelo,
                ano: modelo.ano,
                condicion: modelo.condicion,
                color: item.color,
                chasis: item.cantidad_stock > 1 ? `${item.chasis}-U${i + 1}` : item.chasis,
                fecha_ingreso: item.fecha_ingreso,
                fecha_compra: item.fecha_compra,
                precio_compra_individual: item.precio_compra_individual || modelo.precio_compra,
                precio_venta: modelo.precio_venta,
                moneda_compra: modelo.moneda_compra,
                moneda_venta: modelo.moneda_venta,
                tasa_dolar: item.tasa_dolar,
                descuento_porcentaje: item.descuento_porcentaje || 0,
                imagen: modelo.imagen,
                activa: modelo.activa,
                cantidad_stock: 1
              });
            }
          } else {
            // Si no tiene chasis específico, crear entradas según cantidad
            for (let i = 0; i < item.cantidad_stock; i++) {
              allUnits.push({
                id: `${modelo.id}-${item.id}-${i}`,
                marca: modelo.marca,
                modelo: modelo.modelo,
                ano: modelo.ano,
                condicion: modelo.condicion,
                color: item.color,
                chasis: `Sin asignar ${i + 1}`,
                fecha_ingreso: item.fecha_ingreso,
                fecha_compra: item.fecha_compra,
                precio_compra_individual: item.precio_compra_individual || modelo.precio_compra,
                precio_venta: modelo.precio_venta,
                moneda_compra: modelo.moneda_compra,
                moneda_venta: modelo.moneda_venta,
                tasa_dolar: item.tasa_dolar,
                descuento_porcentaje: item.descuento_porcentaje || 0,
                imagen: modelo.imagen,
                activa: modelo.activa
              });
            }
          }
        });
      }
    });

    // Debug logs removed for performance
    // console.log('DEBUG getAllInventoryUnits - TOTAL UNIDADES:', allUnits.length);
    return allUnits;
  }, [modelos]); // Memo dependency: recalcular solo cuando modelos cambie

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

  const getFilterStats = useMemo(() => {
    let allData: any[];
    
    if (viewMode === 'modelos') {
      allData = modelos;
    } else {
      // En vista individual, usar las unidades de inventario
      allData = getAllInventoryUnits;
    }
    
    const newCount = allData.filter(item => item.condicion === 'nueva').length;
    const usedCount = allData.filter(item => item.condicion === 'usada').length;
    const outOfStockCount = viewMode === 'modelos' 
      ? modelos.filter(modelo => modelo.total_stock === 0).length
      : allData.filter(item => item.cantidad_stock === 0).length;

    // Debug logs removed for performance
    // console.log('DEBUG getFilterStats:', { viewMode, total: allData.length, newCount, usedCount, outOfStockCount });

    return { newCount, usedCount, outOfStockCount, total: allData.length };
  }, [viewMode, modelos, getAllInventoryUnits]); // Memoizar basado en dependencias relevantes

  if (loading && (viewMode === 'modelos' ? modelos.length === 0 : motos.length === 0)) {
    return (
      <div>
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Tabs skeleton */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <div className="h-10 w-24 bg-gray-200 rounded-t animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-t animate-pulse"></div>
            </nav>
          </div>
        </div>
        
        {/* Stats skeleton */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SkeletonStats />
            <SkeletonStats />
            <SkeletonStats />
            <SkeletonStats />
          </div>
          
          {/* Controls skeleton */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
              <div className="flex gap-1">
                <div className="h-6 w-16 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="h-6 w-16 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="h-6 w-16 bg-gray-300 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-32 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-8 w-20 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Search skeleton */}
        <div className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-6">
          {viewMode === 'modelos' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="space-y-4">
              <SkeletonList />
              <SkeletonList />
              <SkeletonList />
              <SkeletonList />
              <SkeletonList />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Motocicletas</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra el inventario de motocicletas
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
            {viewMode !== 'analytics' && viewMode !== 'locations' && (
              <button
                onClick={() => openModal('create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 btn-press micro-glow flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {viewMode === 'modelos' ? 'Nueva Motocicleta' : 'Nueva Moto'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setViewMode('modelos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'modelos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="flex items-center">
                <Grid3X3 className="h-4 w-4 mr-2" />
                Catálogo
              </div>
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'individual'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Ver Inventario
              </div>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </div>
            </button>
            <button
              onClick={() => setViewMode('locations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'locations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Ubicaciones
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Filtros y Controles */}
      {viewMode !== 'analytics' && viewMode !== 'locations' && (
        <>
        <div className="mb-6 space-y-4">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 staggered-fade-in">
          {(() => {
            const stats = getFilterStats;
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
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          {/* Filtros de tipo */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleFilterTypeChange('all')}
                className={`px-3 py-1 text-xs font-medium rounded-full btn-press micro-bounce ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 hover:bg-gray-100 border border-gray-200 dark:border-gray-700'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => handleFilterTypeChange('new')}
                className={`px-3 py-1 text-xs font-medium rounded-full btn-press micro-bounce ${
                  filterType === 'new'
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 hover:bg-gray-100 border border-gray-200 dark:border-gray-700'
                }`}
              >
                Nuevas
              </button>
              <button
                onClick={() => handleFilterTypeChange('used')}
                className={`px-3 py-1 text-xs font-medium rounded-full btn-press micro-bounce ${
                  filterType === 'used'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 hover:bg-gray-100 border border-gray-200 dark:border-gray-700'
                }`}
              >
                Usadas
              </button>
              <button
                onClick={() => handleFilterTypeChange('out_of_stock')}
                className={`px-3 py-1 text-xs font-medium rounded-full btn-press micro-bounce ${
                  filterType === 'out_of_stock'
                    ? 'bg-red-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 hover:bg-gray-100 border border-gray-200 dark:border-gray-700'
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
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
              />
              <Building className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Agrupar por marca</span>
            </label>

            {/* Modo de visualización */}
            <ViewToggle viewMode={displayMode} onViewModeChange={handleDisplayModeChange} />
          </div>
        </div>
      </div>

      {/* Advanced Search */}
      <div className="mb-6">
        <AdvancedSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={motocicletasFilters}
          activeFilters={activeFilters}
          onFiltersChange={handleFiltersChange}
          placeholder={getSearchPlaceholder('motocicletas')}
          onReset={handleSearchReset}
          loading={loading}
          className="animate-fade-in-up"
        />
      </div>
        </>
      )}

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
                <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <Building className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{brand}</h2>
                  <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                    {items.length} {items.length === 1 ? 'modelo' : 'modelos'}
                  </span>
                </div>
              )}
              
              {/* Grid de elementos */}
              <div className={`
                transition-all duration-300 ease-in-out
                ${displayMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
                }
              `}>
                {items.map((modelo) => (
                  displayMode === 'grid' ? (
                    /* Vista en grilla */
                    <div key={modelo.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden card-hover animate-fade-in-up">
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
                            onError={(e) => {
                              // Hide broken image and show fallback
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                            onLoad={(e) => {
                              // Ensure fallback is hidden on successful load
                              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                              if (fallback) {
                                fallback.style.display = 'none';
                              }
                            }}
                          />
                        ) : null}
                        
                        {/* Fallback icon - always present but hidden unless needed */}
                        <div className="fallback-icon w-full h-full flex items-center justify-center" style={{ display: modelo.imagen ? 'none' : 'flex' }}>
                          <Bike className="h-16 w-16 text-gray-400" />
                        </div>
                        
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
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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
                          <p className="text-sm text-gray-500 dark:text-gray-400">Año {modelo.ano}</p>
                        </div>

                        {/* Colores Disponibles */}
                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Colores disponibles:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(modelo.colores_disponibles).map(([color, cantidad]) => (
                              <div 
                                key={color}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200"
                              >
                                <div 
                                  className="w-3 h-3 rounded-full mr-2 border border-gray-300 dark:border-gray-600"
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
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transform hover:scale-110 transition-all duration-150 ease-in-out"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteModelo(modelo)}
                              disabled={deletingModelo === modelo.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transform hover:scale-110 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                              title="Eliminar"
                            >
                              {deletingModelo === modelo.id ? (
                                <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleResumenModelo(modelo)}
                              className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-150 ease-in-out"
                              title="Ver detalles completos y estadísticas"
                            >
                              <Info className="h-4 w-4 mr-1" />
                              Ver Detalles
                            </button>
                            {modelo.disponible && (
                              <button
                                onClick={() => handleVentaDirecta(modelo)}
                                className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-150 ease-in-out"
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
                    /* Vista en lista - Responsive */
                    <div key={modelo.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 micro-lift animate-fade-in-left">
                      <div className="p-4">
                        {/* Layout móvil/desktop adaptativo */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          {/* Sección principal: Imagen + Info básica */}
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
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
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                    if (fallback) {
                                      fallback.style.display = 'flex';
                                    }
                                  }}
                                  onLoad={(e) => {
                                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                    if (fallback) {
                                      fallback.style.display = 'none';
                                    }
                                  }}
                                />
                              ) : null}
                              
                              <div className="fallback-icon w-full h-full flex items-center justify-center" style={{ display: modelo.imagen ? 'none' : 'flex' }}>
                                <Bike className="h-8 w-8 text-gray-400" />
                              </div>
                            </div>
                            
                            {/* Información básica */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                    {modelo.marca} {modelo.modelo}
                                  </h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Año {modelo.ano}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                                  modelo.condicion === 'nueva' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {modelo.condicion === 'nueva' ? 'Nueva' : 'Usada'}
                                </span>
                              </div>
                              
                              {/* Colores - Solo en desktop */}
                              <div className="hidden lg:flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400">Colores:</span>
                                <div className="flex gap-1">
                                  {Object.entries(modelo.colores_disponibles).slice(0, 4).map(([color, cantidad]) => (
                                    <div 
                                      key={color}
                                      className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
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
                          
                          {/* Información de precio y stock - Responsive */}
                          <div className="flex justify-between lg:justify-end lg:flex-row lg:space-x-6 lg:space-y-0 space-y-0">
                            <div className="grid grid-cols-3 gap-4 lg:flex lg:items-center lg:space-x-6 flex-1 lg:flex-initial">
                              <div className="text-center lg:text-right">
                                <p className="text-xs lg:text-sm text-gray-600">Compra</p>
                                <p className="font-semibold text-orange-600 text-sm lg:text-base truncate">
                                  {formatCurrencyWithSymbol(modelo.precio_compra, modelo.moneda_compra || 'COP')}
                                </p>
                              </div>
                              <div className="text-center lg:text-right">
                                <p className="text-xs lg:text-sm text-gray-600">Venta</p>
                                <p className="font-semibold text-green-600 text-sm lg:text-base truncate">
                                  {formatCurrencyWithSymbol(modelo.precio_venta, modelo.moneda_venta || 'COP')}
                                </p>
                              </div>
                              <div className="text-center lg:text-right">
                                <p className="text-xs lg:text-sm text-gray-600">Stock</p>
                                <div className={`flex items-center justify-center lg:justify-end gap-1 ${getStockStatusColor(modelo.total_stock)}`}>
                                  {getStockStatusIcon(modelo.total_stock)}
                                  <span className="font-semibold text-sm lg:text-base">{modelo.total_stock}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Acciones - Responsive */}
                          <div className="flex items-center justify-center lg:justify-end space-x-1 flex-wrap gap-1">
                            <button
                              onClick={() => openModal('edit', null, modelo)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg flex-shrink-0 transform hover:scale-110 transition-all duration-150 ease-in-out"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteModelo(modelo)}
                              disabled={deletingModelo === modelo.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0 transform hover:scale-110 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                              title="Eliminar"
                            >
                              {deletingModelo === modelo.id ? (
                                <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleResumenModelo(modelo)}
                              className="flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex-shrink-0 transform hover:scale-105 transition-all duration-150 ease-in-out"
                              title="Ver detalles completos"
                            >
                              <Info className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Ver Detalles</span>
                              <span className="sm:hidden">Detalles</span>
                            </button>
                            {modelo.disponible && (
                              <button
                                onClick={() => handleVentaDirecta(modelo)}
                                className="flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex-shrink-0 transform hover:scale-105 transition-all duration-150 ease-in-out"
                                title="Vender"
                              >
                                <ShoppingCart className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Vender</span>
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Colores - Solo en móvil */}
                        <div className="lg:hidden flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-400">Colores:</span>
                          <div className="flex gap-1 flex-wrap">
                            {Object.entries(modelo.colores_disponibles).map(([color, cantidad]) => (
                              <div 
                                key={color}
                                className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                                style={{ backgroundColor: getColorCode(color) }}
                                title={`${color}: ${cantidad} unidades`}
                              ></div>
                            ))}
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
      ) : viewMode === 'individual' ? (
        /* Vista de Inventario Individual por Chasis */
        <div className="space-y-6">
          {Object.entries(getGroupedByBrand()).map(([brand, units]: [string, any[]]) => (
            <div key={brand} className="space-y-4">
              {/* Header de marca */}
              {groupByBrand && (
                <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <Building className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{brand}</h2>
                  <span className="bg-blue-100 text-blue-600 text-sm px-2 py-1 rounded-full">
                    {units.length} {units.length === 1 ? 'unidad' : 'unidades'}
                  </span>
                </div>
              )}
              
              {/* Tabla de inventario individual */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Motocicleta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Color
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Chasis
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Fecha Ingreso
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Fecha Compra
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Precio Compra
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tasa Dólar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Precio Venta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ganancia
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {units.map((unit) => {
                        const ganancia = unit.tasa_dolar && unit.precio_compra_individual 
                          ? unit.precio_venta - (unit.precio_compra_individual * unit.tasa_dolar)
                          : unit.precio_venta - unit.precio_compra_individual;
                        
                        return (
                          <tr key={unit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  {unit.imagen ? (
                                    <img
                                      className="h-10 w-10 rounded-lg object-cover"
                                      src={unit.imagen}
                                      alt={`${unit.marca} ${unit.modelo}`}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                        if (fallback) {
                                          fallback.style.display = 'flex';
                                        }
                                      }}
                                      onLoad={(e) => {
                                        const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                        if (fallback) {
                                          fallback.style.display = 'none';
                                        }
                                      }}
                                    />
                                  ) : null}
                                  
                                  <div className="fallback-icon h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center" style={{ display: unit.imagen ? 'none' : 'flex' }}>
                                    <Bike className="h-5 w-5 text-gray-400" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {unit.marca} {unit.modelo}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {unit.ano} • {unit.condicion === 'nueva' ? 'Nueva' : 'Usada'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Circle 
                                  className={`h-4 w-4 mr-2 fill-current ${unit.color.toLowerCase().includes('blanco') || unit.color.toLowerCase().includes('crema') ? 'border border-gray-300 dark:border-gray-600 rounded-full' : ''}`}
                                  style={{ color: getColorStyle(unit.color) }}
                                />
                                <span className="text-sm font-medium text-gray-700">{unit.color}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-mono text-gray-900 dark:text-white">{unit.chasis}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(unit.fecha_ingreso).toLocaleDateString('es-CO')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {unit.fecha_compra 
                                ? new Date(unit.fecha_compra).toLocaleDateString('es-CO')
                                : '-'
                              }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <div className="font-medium text-orange-600">
                                  {getCurrencySymbol(unit.moneda_compra || 'USD')} {unit.precio_compra_individual?.toLocaleString()}
                                </div>
                                {unit.tasa_dolar && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    RD${(unit.precio_compra_individual * unit.tasa_dolar).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {unit.tasa_dolar ? (
                                <span className="text-sm font-medium text-green-600">
                                  RD${unit.tasa_dolar}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-green-600">
                                {getCurrencySymbol(unit.moneda_venta || 'RD')} {unit.precio_venta?.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-medium ${
                                ganancia > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {getCurrencySymbol(unit.moneda_venta || 'RD')} {ganancia?.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'analytics' ? (
        /* Vista de Analytics Avanzados */
        <div className="analytics-section">
          <Suspense fallback={
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse">
                  <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }>
            <AdvancedInventoryAnalytics />
          </Suspense>
        </div>
      ) : viewMode === 'locations' ? (
        /* Vista de Gestión de Ubicaciones */
        <div className="locations-section">
          <Suspense fallback={
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse">
                  <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }>
            <LocationManager />
          </Suspense>
        </div>
      ) : null}

      {/* Empty State */}
      {((viewMode === 'modelos' && modelos.length === 0) || (viewMode === 'individual' && getAllInventoryUnits.length === 0)) && !loading && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {viewMode === 'modelos' ? 'No hay modelos de motocicletas' : 'No hay unidades en inventario'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm 
              ? `No se encontraron ${viewMode === 'modelos' ? 'modelos' : 'unidades'} con esa búsqueda.` 
              : `Comienza agregando tu primer${viewMode === 'modelos' ? ' modelo de' : 'a'} motocicleta.`
            }
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => openModal('create')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                {viewMode === 'modelos' ? 'Agregar Modelo' : 'Agregar Motocicleta'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showModal && viewMode === 'modelos' && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-4">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        }>
          <MotoModeloForm
            modelo={selectedModelo}
            mode={modalMode}
            isReadOnly={modalMode === 'view'}
            onClose={closeModal}
            onSave={handleFormSave}
          />
        </Suspense>
      )}
      
      {showModal && viewMode === 'individual' && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-4">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        }>
          <MotoForm
            moto={selectedMoto}
            mode={modalMode}
            onClose={closeModal}
            onSave={handleFormSave}
          />
        </Suspense>
      )}

      {showDetalleModelo && selectedModelo && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6">
                <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }>
          <MotoModeloDetalle
            modelo={selectedModelo}
            onClose={() => setShowDetalleModelo(false)}
            onVentaDirecta={handleVentaDirecta}
            onUpdate={handleUpdateModelo}
          />
        </Suspense>
      )}

      {showVentaDirecta && selectedModelo && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-4">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        }>
          <NewVentaForm
            onClose={() => setShowVentaDirecta(false)}
            preSelectedMoto={selectedModelo}
            onSuccess={handleVentaSuccess}
          />
        </Suspense>
      )}

      {/* Temporarily disabled - ResumenModelo component doesn't exist yet */}
      {/*showResumenModelo && selectedModelo && (
        <ResumenModelo
          modelo={selectedModelo}
          estadisticas={estadisticasModelo}
          onClose={() => setShowResumenModelo(false)}
        />
      )*/}

      {showEspecificaciones && modeloEspecificaciones && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6">
                <div className="h-6 w-56 bg-gray-200 rounded animate-pulse mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }>
          <EspecificacionesTecnicas
            modelo={modeloEspecificaciones}
            onClose={() => setShowEspecificaciones(false)}
          />
        </Suspense>
      )}

      {/* Import/Export Manager */}
      {showImportExportManager && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 rounded-lg p-8">Cargando...</div></div>}>
          <ImportExportManager 
            onClose={() => setShowImportExportManager(false)}
          />
        </Suspense>
      )}
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default Motocicletas;
