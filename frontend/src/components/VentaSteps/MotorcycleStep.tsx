import React, { useState, useEffect } from 'react';
import {
  Bike,
  Search,
  Calendar,
  DollarSign,
  Package,
  Palette,
  Check,
  AlertCircle,
  Plus,
  Minus,
  Tag,
  Settings
} from 'lucide-react';
import { motoService } from '../../services/motoService';
import { motoModeloService } from '../../services/motoModeloService';
import type { Moto, MotoModelo } from '../../types';
import type { VentaFormData } from '../NewVentaForm';

interface MotorcycleStepProps {
  data: VentaFormData;
  onUpdate: (updates: Partial<VentaFormData>) => void;
  errors: Record<string, string>;
}

interface ColorOption {
  color: string;
  availableStock: number;
  priceWithDiscount?: number;
  discount?: number;
}

const MotorcycleStep: React.FC<MotorcycleStepProps> = ({ data, onUpdate, errors }) => {
  const [viewMode, setViewMode] = useState<'modelos' | 'individual'>('modelos');
  const [searchTerm, setSearchTerm] = useState('');
  const [modelos, setModelos] = useState<MotoModelo[]>([]);
  const [motos, setMotos] = useState<Moto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModeloId, setSelectedModeloId] = useState<number | null>(null);
  const [selectedMotoId, setSelectedMotoId] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [availableColors, setAvailableColors] = useState<ColorOption[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    loadMotorcycles();
  }, [viewMode, searchTerm]);

  // Sincronizar con datos del formulario
  useEffect(() => {
    if (data.selectedMotorcycle) {
      setViewMode(data.selectedMotorcycle.tipo);
      setQuantity(data.selectedMotorcycle.cantidad);
      setSelectedColor(data.selectedMotorcycle.color || '');
      
      if (data.selectedMotorcycle.modelo) {
        setSelectedModeloId(data.selectedMotorcycle.modelo.id);
        loadColorsForModelo(data.selectedMotorcycle.modelo.id);
      } else if (data.selectedMotorcycle.moto) {
        setSelectedMotoId(data.selectedMotorcycle.moto.id);
      }
    }
  }, []);

  const loadMotorcycles = async () => {
    setLoading(true);
    try {
      if (viewMode === 'modelos') {
        const response = await motoModeloService.getModelos(1, searchTerm);
        setModelos(response.results);
      } else {
        const response = await motoService.getMotos(1, searchTerm);
        setMotos(response.results);
      }
    } catch (error) {
      console.error('Error loading motorcycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadColorsForModelo = async (modeloId: number) => {
    try {
      const modelo = await motoModeloService.getModelo(modeloId);
      const colors: ColorOption[] = Object.entries(modelo.colores_disponibles).map(([color, stock]) => {
        // Buscar si hay descuento para este color
        const inventarioItem = modelo.inventario?.find(inv => inv.color === color);
        return {
          color,
          availableStock: stock as number,
          priceWithDiscount: inventarioItem?.precio_con_descuento,
          discount: inventarioItem?.descuento_porcentaje
        };
      });
      setAvailableColors(colors);
    } catch (error) {
      console.error('Error loading colors:', error);
      setAvailableColors([]);
    }
  };

  const handleModeloSelect = (modelo: MotoModelo) => {
    setSelectedModeloId(modelo.id);
    setSelectedMotoId(null);
    setSelectedColor('');
    setQuantity(1);
    loadColorsForModelo(modelo.id);
    
    updateSelection({
      tipo: 'modelo',
      modelo,
      moto: undefined,
      color: '',
      cantidad: 1,
      precio_unitario: modelo.precio_venta
    });
  };

  const handleMotoSelect = (moto: Moto) => {
    setSelectedMotoId(moto.id);
    setSelectedModeloId(null);
    setSelectedColor(moto.color || '');
    setQuantity(1);
    setAvailableColors([]);
    
    updateSelection({
      tipo: 'individual',
      modelo: undefined,
      moto,
      color: moto.color,
      chasis: moto.chasis,
      cantidad: 1,
      precio_unitario: moto.precio_venta
    });
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    
    if (data.selectedMotorcycle && data.selectedMotorcycle.modelo) {
      const colorOption = availableColors.find(c => c.color === color);
      const precioUnitario = colorOption?.priceWithDiscount || data.selectedMotorcycle.modelo.precio_venta;
      
      updateSelection({
        ...data.selectedMotorcycle,
        color,
        precio_unitario: precioUnitario
      });
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    const selectedColor = availableColors.find(c => c.color === selectedColor);
    const maxQuantity = viewMode === 'modelos' 
      ? selectedColor?.availableStock || 0
      : 1; // Para motos individuales, máximo 1

    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
      
      if (data.selectedMotorcycle) {
        updateSelection({
          ...data.selectedMotorcycle,
          cantidad: newQuantity
        });
      }
    }
  };

  const updateSelection = (selection: any) => {
    onUpdate({
      selectedMotorcycle: selection
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getColorCode = (colorName: string) => {
    const colorMap: { [key: string]: string } = {
      'rojo': '#dc2626', 'azul': '#2563eb', 'verde': '#16a34a',
      'amarillo': '#eab308', 'negro': '#1f2937', 'blanco': '#f9fafb',
      'gris': '#6b7280', 'rosa': '#ec4899', 'morado': '#7c3aed',
      'naranja': '#ea580c', 'cafe': '#92400e', 'marrón': '#92400e',
      'dorado': '#d97706', 'plateado': '#9ca3af', 'celeste': '#0ea5e9'
    };
    return colorMap[colorName.toLowerCase()] || '#6b7280';
  };

  const isSelectionComplete = () => {
    return data.selectedMotorcycle !== null && 
           (viewMode === 'individual' || selectedColor !== '');
  };

  const getSelectedColorOption = () => {
    return availableColors.find(c => c.color === selectedColor);
  };

  const calculateTotal = () => {
    if (!data.selectedMotorcycle) return 0;
    return data.selectedMotorcycle.precio_unitario * data.selectedMotorcycle.cantidad;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Selección de Motocicleta
        </h3>
        <p className="text-gray-600">
          Seleccione la motocicleta, color (si aplica) y cantidad para la venta.
        </p>
      </div>

      {/* Tabs para tipo de vista */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setViewMode('modelos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'modelos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
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
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Bike className="h-4 w-4 mr-2" />
              Motos Individuales
            </div>
          </button>
        </nav>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder={`Buscar ${viewMode === 'modelos' ? 'modelos' : 'motocicletas'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Selección actual */}
      {data.selectedMotorcycle && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Check className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h4 className="font-semibold text-green-900">
                  {viewMode === 'modelos' 
                    ? `${data.selectedMotorcycle.modelo?.marca} ${data.selectedMotorcycle.modelo?.modelo} ${data.selectedMotorcycle.modelo?.ano}`
                    : `${data.selectedMotorcycle.moto?.marca} ${data.selectedMotorcycle.moto?.modelo} ${data.selectedMotorcycle.moto?.ano}`
                  }
                </h4>
                <div className="flex items-center space-x-4 text-sm text-green-700">
                  {selectedColor && (
                    <span className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                        style={{ backgroundColor: getColorCode(selectedColor) }}
                      ></div>
                      Color: {selectedColor}
                    </span>
                  )}
                  {data.selectedMotorcycle.chasis && (
                    <span className="flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      Chasis: {data.selectedMotorcycle.chasis}
                    </span>
                  )}
                  <span>Cantidad: {data.selectedMotorcycle.cantidad}</span>
                  <span>Precio: {formatCurrency(data.selectedMotorcycle.precio_unitario)}</span>
                  <span className="font-semibold">Total: {formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de motocicletas */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {viewMode === 'modelos' ? (
            modelos.map((modelo) => (
              <div
                key={modelo.id}
                onClick={() => handleModeloSelect(modelo)}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedModeloId === modelo.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {modelo.marca} {modelo.modelo}
                  </h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    modelo.condicion === 'nueva' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {modelo.condicion === 'nueva' ? 'Nueva' : 'Usada'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Año {modelo.ano}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {formatCurrency(modelo.precio_venta)}
                  </div>
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Stock: {modelo.total_stock}
                  </div>
                </div>

                {/* Colores disponibles preview */}
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Colores disponibles:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(modelo.colores_disponibles).slice(0, 4).map((color) => (
                      <div
                        key={color}
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: getColorCode(color) }}
                        title={color}
                      ></div>
                    ))}
                    {Object.keys(modelo.colores_disponibles).length > 4 && (
                      <span className="text-xs text-gray-400 ml-1">
                        +{Object.keys(modelo.colores_disponibles).length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            motos.map((moto) => (
              <div
                key={moto.id}
                onClick={() => handleMotoSelect(moto)}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedMotoId === moto.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {moto.marca} {moto.modelo}
                  </h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    moto.condicion === 'nueva' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {moto.condicion === 'nueva' ? 'Nueva' : 'Usada'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Año {moto.ano}
                  </div>
                  {moto.color && (
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                        style={{ backgroundColor: getColorCode(moto.color) }}
                      ></div>
                      Color: {moto.color}
                    </div>
                  )}
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {formatCurrency(moto.precio_venta)}
                  </div>
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Stock: {moto.cantidad_stock}
                  </div>
                  {moto.chasis && (
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      Chasis: {moto.chasis}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Selección de color (solo para modelos) */}
      {viewMode === 'modelos' && selectedModeloId && availableColors.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Seleccionar Color
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableColors.map((colorOption) => (
              <div
                key={colorOption.color}
                onClick={() => handleColorSelect(colorOption.color)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedColor === colorOption.color
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${colorOption.availableStock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300 mr-3"
                      style={{ backgroundColor: getColorCode(colorOption.color) }}
                    ></div>
                    <span className="font-medium text-gray-900 capitalize">
                      {colorOption.color}
                    </span>
                  </div>
                  {selectedColor === colorOption.color && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Stock disponible:</span>
                    <span className={`font-medium ${
                      colorOption.availableStock === 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {colorOption.availableStock}
                    </span>
                  </div>
                  
                  {colorOption.priceWithDiscount && colorOption.discount && colorOption.discount > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>Descuento:</span>
                        <span className="text-orange-600 font-medium">
                          -{colorOption.discount}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Precio con descuento:</span>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(colorOption.priceWithDiscount)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selección de cantidad */}
      {selectedColor && viewMode === 'modelos' && (
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Cantidad
          </h4>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="h-4 w-4" />
            </button>
            
            <span className="text-xl font-semibold text-gray-900 min-w-12 text-center">
              {quantity}
            </span>
            
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= (getSelectedColorOption()?.availableStock || 0)}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
            </button>
            
            <div className="text-sm text-gray-600">
              Máximo disponible: {getSelectedColorOption()?.availableStock || 0}
            </div>
          </div>
        </div>
      )}

      {/* Validación */}
      {!isSelectionComplete() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
          <span className="text-yellow-800">
            {!data.selectedMotorcycle 
              ? 'Seleccione una motocicleta para continuar.'
              : 'Seleccione un color para continuar.'
            }
          </span>
        </div>
      )}
    </div>
  );
};

export default MotorcycleStep;