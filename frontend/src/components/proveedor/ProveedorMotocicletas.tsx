import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  Eye,
  Plus,
  AlertCircle,
  TrendingDown,
  ShoppingCart,
  FileText
} from 'lucide-react';
import api from '../../services/api';

interface MotoModelo {
  id: number;
  marca: string;
  modelo: string;
  ano: number;
  precio_compra: number;
  precio_venta: number;
  moneda_compra: string;
  moneda_venta: string;
  total_stock: number;
  disponible: boolean;
  activa: boolean;
  imagen?: string;
  cilindraje?: number;
  tipo_motor?: string;
  ganancia: number;
}

interface MotoInventario {
  id: number;
  color: string;
  chasis?: string;
  cantidad_stock: number;
  descuento_porcentaje: number;
  fecha_ingreso: string;
  precio_con_descuento: number;
  precio_compra_individual?: number;
  tasa_dolar?: number;
  fecha_compra?: string;
}

interface SugerenciaRestock {
  modelo_id: number;
  modelo_nombre: string;
  proveedor: string;
  proveedor_id: number;
  stock_actual: number;
  stock_minimo: number;
  cantidad_sugerida: number;
  precio_compra: number;
  total_estimado: number;
}

interface ProveedorMotocicletasProps {
  proveedorId: number;
  proveedorNombre: string;
}

const ProveedorMotocicletas: React.FC<ProveedorMotocicletasProps> = ({ 
  proveedorId, 
  proveedorNombre 
}) => {
  const [modelos, setModelos] = useState<MotoModelo[]>([]);
  const [sugerencias, setSugerencias] = useState<SugerenciaRestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'modelos' | 'stock' | 'restock'>('modelos');
  const [selectedModelo, setSelectedModelo] = useState<MotoModelo | null>(null);
  const [inventarioDetalle, setInventarioDetalle] = useState<MotoInventario[]>([]);

  useEffect(() => {
    loadData();
  }, [proveedorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar modelos del proveedor
      const modelosResponse = await api.get('/motos/modelos/', {
        params: { proveedor: proveedorId }
      });
      setModelos(modelosResponse.data.results || modelosResponse.data);

      // Cargar sugerencias de restock para este proveedor
      const restockResponse = await api.get('/motos/restock/sugerencias/', {
        params: { proveedor: proveedorId, stock_minimo: 5 }
      });
      setSugerencias(restockResponse.data.sugerencias || []);

    } catch (error) {
      console.error('Error loading motorcycle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInventarioDetalle = async (modelo: MotoModelo) => {
    try {
      const response = await api.get(`/motos/modelos/${modelo.id}/inventario/`);
      setInventarioDetalle(response.data.results || response.data);
      setSelectedModelo(modelo);
    } catch (error) {
      console.error('Error loading inventory details:', error);
    }
  };

  const crearOrdenAutomatica = async () => {
    try {
      if (sugerencias.length === 0) {
        alert('No hay sugerencias de restock disponibles');
        return;
      }

      const response = await api.post('/motos/restock/crear-orden/', {
        proveedor_id: proveedorId,
        sugerencias: sugerencias.map(s => ({
          modelo_id: s.modelo_id,
          cantidad_sugerida: s.cantidad_sugerida,
          color: 'Varios'
        })),
        fecha_entrega_esperada: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      alert(`Orden de compra ${response.data.numero_orden} creada exitosamente`);
      loadData(); // Recargar datos
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Error al crear la orden de compra');
    }
  };

  const formatMoney = (amount: number, currency: string = 'USD') => {
    const symbol = currency === 'USD' ? '$' : currency === 'RD' ? 'RD$' : currency;
    return `${symbol}${amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600 bg-red-100';
    if (stock <= 5) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Motocicletas - {proveedorNombre}
        </h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Total modelos: {modelos.length}
          </span>
          <span className="text-sm text-gray-600">
            Stock total: {modelos.reduce((acc, m) => acc + m.total_stock, 0)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'modelos', label: 'Modelos', icon: Package },
            { key: 'stock', label: 'Inventario', icon: Truck },
            { key: 'restock', label: 'Re-stock', icon: ShoppingCart }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
              {key === 'restock' && sugerencias.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {sugerencias.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Lista de Modelos */}
      {activeTab === 'modelos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modelos.map((modelo) => (
            <div key={modelo.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              {modelo.imagen && (
                <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  <img 
                    src={modelo.imagen} 
                    alt={`${modelo.marca} ${modelo.modelo}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {modelo.marca} {modelo.modelo}
                  </h3>
                  <span className="text-sm text-gray-500">{modelo.ano}</span>
                </div>

                {modelo.cilindraje && (
                  <p className="text-sm text-gray-600 mb-2">
                    {modelo.cilindraje}cc {modelo.tipo_motor}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Precio Compra:</span>
                    <span className="font-medium">
                      {formatMoney(modelo.precio_compra, modelo.moneda_compra)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Precio Venta:</span>
                    <span className="font-medium">
                      {formatMoney(modelo.precio_venta, modelo.moneda_venta)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ganancia:</span>
                    <span className="font-medium text-green-600">
                      {formatMoney(modelo.ganancia, modelo.moneda_venta)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockColor(modelo.total_stock)}`}>
                    Stock: {modelo.total_stock}
                  </span>
                  
                  <button
                    onClick={() => loadInventarioDetalle(modelo)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Detalle
                  </button>
                </div>

                {!modelo.activa && (
                  <div className="mt-2 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Modelo inactivo
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {modelos.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay modelos registrados para este proveedor</p>
            </div>
          )}
        </div>
      )}

      {/* Detalle de Inventario por Color */}
      {activeTab === 'stock' && selectedModelo && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Inventario: {selectedModelo.marca} {selectedModelo.modelo} {selectedModelo.ano}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Compra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Final
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descuento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Ingreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chasis
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventarioDetalle.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-2 border"
                          style={{ backgroundColor: item.color.toLowerCase() }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900">
                          {item.color}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockColor(item.cantidad_stock)}`}>
                        {item.cantidad_stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.precio_compra_individual 
                        ? formatMoney(item.precio_compra_individual)
                        : formatMoney(selectedModelo.precio_compra, selectedModelo.moneda_compra)
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatMoney(item.precio_con_descuento, selectedModelo.moneda_venta)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.descuento_porcentaje > 0 ? `${item.descuento_porcentaje}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.fecha_ingreso).toLocaleDateString('es-DO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.chasis || 'No especificado'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sugerencias de Re-stock */}
      {activeTab === 'restock' && (
        <div className="space-y-6">
          {sugerencias.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingDown className="w-5 h-5 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-medium text-yellow-800">
                    Productos con Stock Bajo ({sugerencias.length})
                  </h3>
                </div>
                <button
                  onClick={crearOrdenAutomatica}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Crear Orden Automática
                </button>
              </div>
              <p className="text-yellow-700 mt-2">
                Los siguientes productos necesitan ser reabastecidos. 
                Total estimado: {formatMoney(sugerencias.reduce((acc, s) => acc + s.total_estimado, 0))}
              </p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Sugerencias de Re-stock</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modelo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Mínimo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad Sugerida
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Unit.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Estimado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sugerencias.map((sugerencia, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sugerencia.modelo_nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                          {sugerencia.stock_actual}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sugerencia.stock_minimo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {sugerencia.cantidad_sugerida}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatMoney(sugerencia.precio_compra)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatMoney(sugerencia.total_estimado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {sugerencias.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay productos que necesiten re-stock en este momento</p>
              <p className="text-sm mt-2">Todos los modelos tienen stock adecuado</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProveedorMotocicletas;