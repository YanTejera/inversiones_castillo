import React, { useState } from 'react';
import {
  X,
  Bike,
  DollarSign,
  Package,
  Calendar,
  Edit,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ShoppingCart
} from 'lucide-react';
import { motoModeloService } from '../services/motoModeloService';
import type { MotoModelo, MotoInventario } from '../types';

interface MotoModeloDetalleProps {
  modelo: MotoModelo;
  onClose: () => void;
  onVentaDirecta: (modelo: MotoModelo) => void;
  onUpdate: () => void;
}

const MotoModeloDetalle: React.FC<MotoModeloDetalleProps> = ({
  modelo,
  onClose,
  onVentaDirecta,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddInventario, setShowAddInventario] = useState(false);
  const [nuevoInventario, setNuevoInventario] = useState({
    color: '',
    chasis: '',
    cantidad_stock: 1,
    descuento_porcentaje: 0,
    precio_con_descuento: modelo.precio_venta
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const handleAgregarInventario = async () => {
    if (!nuevoInventario.color.trim()) {
      setError('El color es requerido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await motoModeloService.createInventario(modelo.id, nuevoInventario);
      setNuevoInventario({ 
        color: '', 
        chasis: '', 
        cantidad_stock: 1,
        descuento_porcentaje: 0,
        precio_con_descuento: modelo.precio_venta
      });
      setShowAddInventario(false);
      onUpdate();
    } catch (err) {
      setError('Error al agregar inventario');
      console.error('Error adding inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarInventario = async (inventarioId: number) => {
    if (window.confirm('¿Estás seguro de eliminar este inventario?')) {
      try {
        await motoModeloService.deleteInventario(inventarioId);
        onUpdate();
      } catch (err) {
        alert('Error al eliminar inventario');
        console.error('Error deleting inventory:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Detalles del Modelo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información del Modelo */}
            <div className="lg:col-span-2 space-y-6">
              {/* Básica */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                  <Bike className="h-5 w-5 mr-2" />
                  Información del Modelo
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Marca</label>
                      <p className="text-lg font-semibold text-gray-900">{modelo.marca}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Modelo</label>
                      <p className="text-lg font-semibold text-gray-900">{modelo.modelo}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Año</label>
                      <p className="text-lg font-semibold text-gray-900">{modelo.ano}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estado</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        modelo.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {modelo.activa ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                  
                  {modelo.descripcion && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-500">Descripción</label>
                      <p className="text-gray-900 mt-1">{modelo.descripcion}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Precios */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Información de Precios
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-blue-600">Precio de Compra</label>
                    <p className="text-xl font-bold text-blue-800">{formatCurrency(modelo.precio_compra)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-green-600">Precio de Venta</label>
                    <p className="text-xl font-bold text-green-800">{formatCurrency(modelo.precio_venta)}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-purple-600">Ganancia</label>
                    <p className="text-xl font-bold text-purple-800">{formatCurrency(modelo.ganancia)}</p>
                  </div>
                </div>
              </div>

              {/* Inventario por Color */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Inventario por Color
                  </h3>
                  <button
                    onClick={() => setShowAddInventario(!showAddInventario)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Stock
                  </button>
                </div>

                {/* Formulario para agregar inventario */}
                {showAddInventario && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-gray-900 mb-3">Agregar Nuevo Stock</h4>
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                        {error}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
                        <input
                          type="text"
                          value={nuevoInventario.color}
                          onChange={(e) => setNuevoInventario(prev => ({...prev, color: e.target.value}))}
                          placeholder="Ej: Rojo, Azul, Negro..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chasis (Opcional)</label>
                        <input
                          type="text"
                          value={nuevoInventario.chasis}
                          onChange={(e) => setNuevoInventario(prev => ({...prev, chasis: e.target.value}))}
                          placeholder="Número de chasis..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          value={nuevoInventario.cantidad_stock}
                          onChange={(e) => setNuevoInventario(prev => ({...prev, cantidad_stock: parseInt(e.target.value) || 1}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-3">
                      <button
                        onClick={() => setShowAddInventario(false)}
                        className="px-3 py-1 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAgregarInventario}
                        disabled={loading}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                      >
                        {loading ? 'Agregando...' : 'Agregar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de inventario */}
                <div className="space-y-3">
                  {modelo.inventario.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      {/* Primera fila: Información básica y botón eliminar */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`flex items-center ${getStockStatusColor(item.cantidad_stock)}`}>
                            {getStockStatusIcon(item.cantidad_stock)}
                            <span className="ml-2 font-medium">{item.color}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Stock: <span className="font-medium">{item.cantidad_stock}</span>
                          </div>
                          {item.chasis && (
                            <div className="text-sm text-gray-500">
                              Chasis: <span className="font-medium">{item.chasis}</span>
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            Ingreso: {formatDate(item.fecha_ingreso)}
                          </div>
                          {item.precio_compra_individual && (
                            <div className="text-sm text-blue-600">
                              Precio Compra: <span className="font-medium">${item.precio_compra_individual}</span>
                            </div>
                          )}
                          {item.tasa_dolar && (
                            <div className="text-sm text-green-600">
                              Tasa: <span className="font-medium">RD${item.tasa_dolar}</span>
                            </div>
                          )}
                          {item.fecha_compra && (
                            <div className="text-sm text-purple-600">
                              Compra: <span className="font-medium">{formatDate(item.fecha_compra)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEliminarInventario(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Segunda fila: Resumen financiero por lote (si existe) */}
                      {(item.precio_compra_individual && item.tasa_dolar) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Resumen Financiero de este Lote</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-gray-500">Precio USD:</span>
                              <div className="font-medium text-blue-600">${item.precio_compra_individual}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Precio RD$:</span>
                              <div className="font-medium text-green-600">
                                RD${(item.precio_compra_individual * item.tasa_dolar).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Precio Venta:</span>
                              <div className="font-medium text-purple-600">RD${modelo.precio_venta.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Ganancia:</span>
                              <div className={`font-medium ${(modelo.precio_venta - (item.precio_compra_individual * item.tasa_dolar)) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                RD${((modelo.precio_venta - (item.precio_compra_individual * item.tasa_dolar)) * item.cantidad_stock).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {modelo.inventario.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No hay inventario registrado</p>
                      <p className="text-sm">Comienza agregando stock por color</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Imagen y Resumen */}
            <div className="space-y-6">
              {/* Imagen */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Imagen</h3>
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  {modelo.imagen ? (
                    <img
                      src={modelo.imagen}
                      alt={`${modelo.marca} ${modelo.modelo}`}
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
                    <Bike className="h-16 w-16 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Resumen */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Resumen</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock Total:</span>
                    <span className={`font-medium ${getStockStatusColor(modelo.total_stock)}`}>
                      {modelo.total_stock} unidades
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Colores disponibles:</span>
                    <span className="font-medium">{Object.keys(modelo.colores_disponibles).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha de creación:</span>
                    <span className="font-medium">{formatDate(modelo.fecha_creacion)}</span>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="space-y-3">
                {modelo.disponible && (
                  <button
                    onClick={() => onVentaDirecta(modelo)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Crear Venta Directa
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotoModeloDetalle;