import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Package,
  TrendingDown,
  FileText,
  Download,
  AlertTriangle,
  Plus,
  Truck,
  Edit3,
  Eye,
  Palette,
  Settings,
  X,
  Trash2
} from 'lucide-react';
import api from '../services/api';

interface ColorInventario {
  color: string;
  stock_actual: number;
}

interface SugerenciaRestock {
  modelo_id: number;
  modelo_nombre: string;
  proveedor: string;
  proveedor_id: number | null;
  stock_actual: number;
  stock_minimo: number;
  cantidad_sugerida: number;
  precio_compra: number;
  total_estimado: number;
  colores_disponibles?: ColorInventario[];
}

interface CartItem {
  id: string; // unique identifier: `${modelo_id}-${color}`
  modelo_id: number;
  modelo_nombre: string;
  proveedor_id: number;
  proveedor_nombre: string;
  color: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  stock_actual: number;
}

interface OrdenCompra {
  id: number;
  numero_orden: string;
  proveedor_nombre: string;
  fecha_orden: string;
  fecha_entrega_esperada: string;
  estado: string;
  prioridad: string;
  total: number;
  moneda: string;
  dias_para_entrega: number;
  esta_atrasada: boolean;
}

interface RestockSummary {
  sugerencias: SugerenciaRestock[];
  total_modelos_bajo_stock: number;
  total_estimado_restock: number;
}

const RestockManager: React.FC = () => {
  const [sugerencias, setSugerencias] = useState<SugerenciaRestock[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sugerencias' | 'ordenes'>('sugerencias');
  const [stockMinimo, setStockMinimo] = useState(5);
  
  // Estados para el carrito
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  // Estados temporales para agregar al carrito
  const [tempColors, setTempColors] = useState<Map<number, string>>(new Map());
  const [tempQuantities, setTempQuantities] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    loadData();
  }, [stockMinimo]);

  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar sugerencias de restock
      const restockResponse = await api.get('/motos/restock/sugerencias/', {
        params: { stock_minimo: stockMinimo }
      });
      setSugerencias(restockResponse.data.sugerencias || []);

      // Cargar órdenes de compra pendientes
      const ordenesResponse = await api.get('/motos/ordenes-compra/', {
        params: { estado: 'borrador,enviada,confirmada,recibida_parcial' }
      });
      setOrdenes(ordenesResponse.data.results || ordenesResponse.data);

    } catch (error) {
      console.error('Error loading restock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTempColor = (modeloId: number, color: string) => {
    const newColors = new Map(tempColors);
    newColors.set(modeloId, color);
    setTempColors(newColors);
  };

  const updateTempQuantity = (modeloId: number, cantidad: number) => {
    const newQuantities = new Map(tempQuantities);
    newQuantities.set(modeloId, cantidad);
    setTempQuantities(newQuantities);
  };

  const addToCart = (sugerencia: SugerenciaRestock) => {
    if (!sugerencia.proveedor_id) {
      alert('Esta motocicleta no tiene proveedor asignado');
      return;
    }

    const color = tempColors.get(sugerencia.modelo_id) || 'Varios';
    const cantidad = tempQuantities.get(sugerencia.modelo_id) || sugerencia.cantidad_sugerida;
    
    const cartItemId = `${sugerencia.modelo_id}-${color}`;
    
    // Verificar si ya existe en el carrito
    const existingItemIndex = cart.findIndex(item => item.id === cartItemId);
    
    const newItem: CartItem = {
      id: cartItemId,
      modelo_id: sugerencia.modelo_id,
      modelo_nombre: sugerencia.modelo_nombre,
      proveedor_id: sugerencia.proveedor_id,
      proveedor_nombre: sugerencia.proveedor,
      color: color,
      cantidad: cantidad,
      precio_unitario: sugerencia.precio_compra,
      subtotal: sugerencia.precio_compra * cantidad,
      stock_actual: sugerencia.stock_actual
    };

    if (existingItemIndex >= 0) {
      // Actualizar item existente
      const newCart = [...cart];
      newCart[existingItemIndex] = newItem;
      setCart(newCart);
    } else {
      // Agregar nuevo item
      setCart([...cart, newItem]);
    }

    // Limpiar estados temporales
    const newColors = new Map(tempColors);
    const newQuantities = new Map(tempQuantities);
    newColors.delete(sugerencia.modelo_id);
    newQuantities.delete(sugerencia.modelo_id);
    setTempColors(newColors);
    setTempQuantities(newQuantities);
    
    alert('Producto agregado al carrito');
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateCartItem = (itemId: string, field: 'cantidad' | 'color', value: any) => {
    const newCart = cart.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'cantidad') {
          updatedItem.subtotal = updatedItem.precio_unitario * value;
        }
        if (field === 'color') {
          // Cambiar ID si cambia el color
          updatedItem.id = `${item.modelo_id}-${value}`;
        }
        return updatedItem;
      }
      return item;
    });
    setCart(newCart);
  };

  const completarPedido = async () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    try {
      // Agrupar items del carrito por proveedor
      const itemsPorProveedor = new Map<number, CartItem[]>();
      
      cart.forEach(item => {
        if (!itemsPorProveedor.has(item.proveedor_id)) {
          itemsPorProveedor.set(item.proveedor_id, []);
        }
        itemsPorProveedor.get(item.proveedor_id)!.push(item);
      });

      let ordenesCreadas = 0;
      
      for (const [proveedorId, items] of itemsPorProveedor.entries()) {
        await api.post('/motos/restock/crear-orden/', {
          proveedor_id: proveedorId,
          sugerencias: items.map(item => ({
            modelo_id: item.modelo_id,
            cantidad_sugerida: item.cantidad,
            color: item.color
          })),
          fecha_entrega_esperada: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
        ordenesCreadas++;
      }

      alert(`Se crearon ${ordenesCreadas} órdenes de compra exitosamente`);
      
      // Limpiar carrito y recargar datos
      setCart([]);
      setShowCart(false);
      loadData();
      
    } catch (error) {
      console.error('Error creating orders:', error);
      alert('Error al crear las órdenes de compra');
    }
  };

  // Funciones de cálculo del carrito
  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.cantidad, 0);
  const cartProviders = new Set(cart.map(item => item.proveedor_nombre)).size;

  const clearCart = () => {
    setCart([]);
  };

  const descargarOrdenPDF = async (ordenId: number) => {
    try {
      const response = await api.get(`/motos/ordenes-compra/${ordenId}/pdf/`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `orden_compra_${ordenId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error al descargar el PDF');
    }
  };

  const totalEstimadoCarrito = cart.reduce((sum, item) => sum + item.subtotal, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Re-stock</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestiona el reabastecimiento de inventario y órdenes de compra
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <label className="text-sm text-gray-600 dark:text-gray-400 mr-2">Stock mínimo:</label>
              <select 
                value={stockMinimo}
                onChange={(e) => setStockMinimo(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1"
              >
                <option value={1}>1</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>
            
            {/* Carrito de Compras */}
            <button
              onClick={() => setShowCart(true)}
              className="relative bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Carrito ({cartItemCount})
              {cartTotal > 0 && (
                <span className="ml-2 text-blue-200">
                  {formatMoney(cartTotal)}
                </span>
              )}
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Productos Bajo Stock</p>
                <p className="text-2xl font-bold text-red-900">{sugerencias.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">En Carrito</p>
                <p className="text-2xl font-bold text-blue-900">{cart.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Órdenes Activas</p>
                <p className="text-2xl font-bold text-green-900">{ordenes.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white rounded-t-lg">
        <nav className="-mb-px flex space-x-8 px-6 pt-4">
          {[
            { key: 'sugerencias', label: 'Sugerencias de Re-stock', icon: TrendingDown, count: sugerencias.length },
            { key: 'ordenes', label: 'Órdenes de Compra', icon: Truck, count: ordenes.length }
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                activeTab === key
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 dark:text-gray-400'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Sugerencias Tab */}
      {activeTab === 'sugerencias' && (
        <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow border border-gray-200 dark:border-gray-700 dark:border-gray-700 overflow-hidden">
          {sugerencias.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Modelo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stock Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Precio Unit.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                  {sugerencias.map((sugerencia) => (
                    <tr key={sugerencia.modelo_id} className="hover:bg-gray-50 dark:bg-gray-900">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {sugerencia.modelo_nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {sugerencia.proveedor_id ? (
                          <span className="text-gray-900 dark:text-white">{sugerencia.proveedor}</span>
                        ) : (
                          <span className="text-red-600 font-medium flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Sin proveedor
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {sugerencia.stock_actual}
                        </span>
                      </td>
                      
                      {/* Selector de Color */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={tempColors.get(sugerencia.modelo_id) || 'Varios'}
                          onChange={(e) => updateTempColor(sugerencia.modelo_id, e.target.value)}
                          className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="Varios">Varios</option>
                          <option value="Rojo">Rojo</option>
                          <option value="Azul">Azul</option>
                          <option value="Negro">Negro</option>
                          <option value="Blanco">Blanco</option>
                          <option value="Amarillo">Amarillo</option>
                          <option value="Verde">Verde</option>
                          <option value="Gris">Gris</option>
                        </select>
                      </td>
                      
                      {/* Input de Cantidad */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            value={tempQuantities.get(sugerencia.modelo_id) || sugerencia.cantidad_sugerida}
                            onChange={(e) => updateTempQuantity(sugerencia.modelo_id, parseInt(e.target.value) || 1)}
                            className="w-20 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            (sug: {sugerencia.cantidad_sugerida})
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatMoney(sugerencia.precio_compra)}
                      </td>
                      
                      {/* Botón Agregar al Carrito */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => addToCart(sugerencia)}
                          disabled={!sugerencia.proveedor_id}
                          className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Agregar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay productos que necesiten re-stock</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Todos los productos tienen stock adecuado</p>
            </div>
          )}
        </div>
      )}

      {/* Órdenes Tab */}
      {activeTab === 'ordenes' && (
        <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow border border-gray-200 dark:border-gray-700 dark:border-gray-700 overflow-hidden">
          {ordenes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha Orden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Entrega Esperada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                  {ordenes.map((orden) => (
                    <tr key={orden.id} className="hover:bg-gray-50 dark:bg-gray-900">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {orden.numero_orden}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {orden.proveedor_nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(orden.fecha_orden).toLocaleDateString('es-DO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(orden.fecha_entrega_esperada).toLocaleDateString('es-DO')}
                        {orden.esta_atrasada && (
                          <span className="ml-2 text-red-600 text-xs flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Atrasada
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          orden.estado === 'borrador' ? 'bg-gray-100 text-gray-800' :
                          orden.estado === 'enviada' ? 'bg-blue-100 text-blue-800' :
                          orden.estado === 'confirmada' ? 'bg-yellow-100 text-yellow-800' :
                          orden.estado === 'recibida_parcial' ? 'bg-orange-100 text-orange-800' :
                          orden.estado === 'recibida_completa' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {orden.estado.replace('_', ' ').charAt(0).toUpperCase() + orden.estado.replace('_', ' ').slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          orden.prioridad === 'urgente' ? 'bg-red-100 text-red-800' :
                          orden.prioridad === 'alta' ? 'bg-orange-100 text-orange-800' :
                          orden.prioridad === 'normal' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {orden.prioridad.charAt(0).toUpperCase() + orden.prioridad.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                        {formatMoney(orden.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => descargarOrdenPDF(orden.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay órdenes de compra activas</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Las órdenes aparecerán aquí una vez creadas</p>
            </div>
          )}
        </div>
      )}

      {/* Carrito Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 dark:border-gray-700 w-full max-w-4xl max-h-screen overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Carrito de Re-stock</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {cart.length > 0 ? (
                <>
                  <div className="mb-4 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-600">Items</p>
                      <p className="text-2xl font-bold text-blue-900">{cart.length}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-600">Cantidad Total</p>
                      <p className="text-2xl font-bold text-green-900">{cartItemCount}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm text-purple-600">Proveedores</p>
                      <p className="text-2xl font-bold text-purple-900">{cartProviders}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{item.modelo_nombre}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.proveedor_nombre}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <select
                              value={item.color}
                              onChange={(e) => updateCartItem(item.id, 'color', e.target.value)}
                              className="text-xs border-gray-300 rounded"
                            >
                              <option value="Varios">Varios</option>
                              <option value="Rojo">Rojo</option>
                              <option value="Azul">Azul</option>
                              <option value="Negro">Negro</option>
                              <option value="Blanco">Blanco</option>
                              <option value="Amarillo">Amarillo</option>
                              <option value="Verde">Verde</option>
                              <option value="Gris">Gris</option>
                            </select>
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => updateCartItem(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                              className="w-16 text-xs border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-500 dark:text-gray-400">× {formatMoney(item.precio_unitario)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900 dark:text-white">{formatMoney(item.subtotal)}</span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">El carrito está vacío</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Agrega productos desde las sugerencias</p>
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium text-gray-900 dark:text-white">Total:</span>
                  <span className="text-2xl font-bold text-green-600">{formatMoney(cartTotal)}</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={clearCart}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                  >
                    Limpiar Carrito
                  </button>
                  <button
                    onClick={completarPedido}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                  >
                    Completar Pedido
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestockManager;