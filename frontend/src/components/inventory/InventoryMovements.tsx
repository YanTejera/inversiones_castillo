import React, { useState, useEffect } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Calendar,
  User,
  Package,
  Plus,
  Eye,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  Truck,
  ShoppingCart,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MovementRecord {
  id: number;
  fecha: string;
  tipo: 'entrada' | 'salida' | 'ajuste' | 'venta' | 'compra' | 'devolucion';
  motocicleta: {
    marca: string;
    modelo: string;
    ano: number;
    color: string;
    chasis?: string;
  };
  cantidad: number;
  usuario: string;
  ubicacion_origen?: string;
  ubicacion_destino?: string;
  referencia?: string;
  observaciones?: string;
  precio_unitario?: number;
  valor_total?: number;
}

const InventoryMovements: React.FC = () => {
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{start: string; end: string}>({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [showNewMovementModal, setShowNewMovementModal] = useState(false);
  
  // Mock data - en producción esto vendría del backend
  const mockMovements: MovementRecord[] = [
    {
      id: 1,
      fecha: '2024-01-15T10:30:00Z',
      tipo: 'entrada',
      motocicleta: {
        marca: 'YAMAHA',
        modelo: 'YBR 125',
        ano: 2024,
        color: 'Rojo',
        chasis: 'YBR125ABC123'
      },
      cantidad: 3,
      usuario: 'Juan Pérez',
      ubicacion_destino: 'Almacén Principal - A1',
      referencia: 'COMP-2024-001',
      observaciones: 'Llegada de nueva mercancía',
      precio_unitario: 1800000,
      valor_total: 5400000
    },
    {
      id: 2,
      fecha: '2024-01-14T14:45:00Z',
      tipo: 'salida',
      motocicleta: {
        marca: 'HONDA',
        modelo: 'XR 150L',
        ano: 2023,
        color: 'Negro',
        chasis: 'XR150DEF456'
      },
      cantidad: 1,
      usuario: 'María García',
      ubicacion_origen: 'Showroom - S1',
      referencia: 'VENTA-2024-045',
      observaciones: 'Venta a cliente final',
      precio_unitario: 2200000,
      valor_total: 2200000
    },
    {
      id: 3,
      fecha: '2024-01-14T09:15:00Z',
      tipo: 'ajuste',
      motocicleta: {
        marca: 'SUZUKI',
        modelo: 'GN 125',
        ano: 2024,
        color: 'Azul'
      },
      cantidad: -1,
      usuario: 'Carlos López',
      ubicacion_origen: 'Almacén Principal - B2',
      observaciones: 'Ajuste por inventario físico - unidad dañada',
      precio_unitario: 1650000,
      valor_total: -1650000
    },
    {
      id: 4,
      fecha: '2024-01-13T16:20:00Z',
      tipo: 'venta',
      motocicleta: {
        marca: 'YAMAHA',
        modelo: 'MT-03',
        ano: 2024,
        color: 'Blanco',
        chasis: 'MT03GHI789'
      },
      cantidad: 1,
      usuario: 'Ana Rodríguez',
      ubicacion_origen: 'Showroom - S2',
      referencia: 'VENTA-2024-044',
      observaciones: 'Venta con financiamiento',
      precio_unitario: 3800000,
      valor_total: 3800000
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    const loadMovements = async () => {
      setLoading(true);
      // Aquí iría la llamada al API
      // const response = await inventoryService.getMovements();
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMovements(mockMovements);
      setLoading(false);
    };

    loadMovements();
  }, []);

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'entrada':
      case 'compra':
        return <ArrowDown className="h-4 w-4 text-green-600" />;
      case 'salida':
      case 'venta':
        return <ArrowUp className="h-4 w-4 text-red-600" />;
      case 'ajuste':
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
      case 'devolucion':
        return <ArrowUpDown className="h-4 w-4 text-blue-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      entrada: 'Entrada',
      salida: 'Salida',
      ajuste: 'Ajuste',
      venta: 'Venta',
      compra: 'Compra',
      devolucion: 'Devolución'
    };
    return labels[type] || type;
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'entrada':
      case 'compra':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'salida':
      case 'venta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ajuste':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'devolucion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = searchTerm === '' || 
      movement.motocicleta.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.motocicleta.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movement.motocicleta.chasis && movement.motocicleta.chasis.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' || movement.tipo === filterType;

    const movementDate = new Date(movement.fecha);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const matchesDate = movementDate >= startDate && movementDate <= endDate;

    return matchesSearch && matchesType && matchesDate;
  });

  const totalValue = filteredMovements.reduce((sum, movement) => {
    return sum + (movement.valor_total || 0);
  }, 0);

  const totalEntradas = filteredMovements.filter(m => ['entrada', 'compra', 'devolucion'].includes(m.tipo)).length;
  const totalSalidas = filteredMovements.filter(m => ['salida', 'venta'].includes(m.tipo)).length;
  const totalAjustes = filteredMovements.filter(m => m.tipo === 'ajuste').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
          <div className="animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <ArrowUpDown className="h-5 w-5 mr-2 text-blue-600" />
              Movimientos de Inventario
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Registro completo de entradas, salidas y ajustes de inventario
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewMovementModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Nuevo Movimiento
            </button>
            <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm">
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg mr-3">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Movimientos</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{filteredMovements.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg mr-3">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entradas</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{totalEntradas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg mr-3">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Salidas</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{totalSalidas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg mr-3">
              <RefreshCw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por marca, modelo, usuario o chasis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
              <option value="venta">Ventas</option>
              <option value="compra">Compras</option>
              <option value="ajuste">Ajustes</option>
              <option value="devolucion">Devoluciones</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-500">a</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Motocicleta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMovements.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="font-medium">
                          {format(new Date(movement.fecha), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(movement.fecha), 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getMovementTypeIcon(movement.tipo)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getMovementTypeColor(movement.tipo)}`}>
                        {getMovementTypeLabel(movement.tipo)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div>
                      <div className="font-medium">
                        {movement.motocicleta.marca} {movement.motocicleta.modelo}
                      </div>
                      <div className="text-xs text-gray-500">
                        {movement.motocicleta.ano} • {movement.motocicleta.color}
                        {movement.motocicleta.chasis && (
                          <span className="block font-mono">#{movement.motocicleta.chasis}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`${movement.cantidad > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.cantidad > 0 ? '+' : ''}{movement.cantidad}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      {movement.usuario}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {movement.ubicacion_origen && (
                      <div className="text-xs">
                        <span className="text-gray-400">De:</span> {movement.ubicacion_origen}
                      </div>
                    )}
                    {movement.ubicacion_destino && (
                      <div className="text-xs">
                        <span className="text-gray-400">A:</span> {movement.ubicacion_destino}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {movement.valor_total && (
                      <span className={`font-medium ${movement.valor_total > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(movement.valor_total)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredMovements.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No se encontraron movimientos
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filterType !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda.'
                : 'No hay movimientos registrados en el periodo seleccionado.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Placeholder for New Movement Modal */}
      {showNewMovementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Nuevo Movimiento
                </h3>
                <button 
                  onClick={() => setShowNewMovementModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  El formulario para crear nuevos movimientos estará disponible en la próxima actualización.
                </p>
                <button 
                  onClick={() => setShowNewMovementModal(false)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryMovements;