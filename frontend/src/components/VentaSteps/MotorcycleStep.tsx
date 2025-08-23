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
  Settings,
  ShoppingCart,
  Trash2,
  Edit
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
  const [selectedChasis, setSelectedChasis] = useState<string>('');
  const [customChasis, setCustomChasis] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [availableColors, setAvailableColors] = useState<ColorOption[]>([]);
  const [availableChasis, setAvailableChasis] = useState<string[]>([]);
  const [chasisInfo, setChasisInfo] = useState<Array<{
    chasis: string;
    stock: number;
    precio: number;
    descuento?: number;
    unidad?: number;
    chasisOriginal?: string;
    inventarioId?: number;
    isIndividual?: boolean;
    allowCustomChasis?: boolean;
  }>>([]);

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
      
      // Manejar chasis
      if (data.selectedMotorcycle.chasis) {
        setCustomChasis(data.selectedMotorcycle.chasis);
        setSelectedChasis('');
      }
      
      if (data.selectedMotorcycle.modelo) {
        setSelectedModeloId(data.selectedMotorcycle.modelo.id);
        loadColorsForModelo(data.selectedMotorcycle.modelo.id);
        
        // Si ya hay color, cargar chasis disponibles
        if (data.selectedMotorcycle.color) {
          loadChasisForColor(data.selectedMotorcycle.modelo.id, data.selectedMotorcycle.color);
        }
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

  const loadChasisForColor = async (modeloId: number, color: string) => {
    try {
      console.log('🔍 Cargando chasis para modelo', modeloId, 'color', color);
      
      // Usar el nuevo endpoint optimizado
      const chasisData = await motoModeloService.getChasisByColor(modeloId, color);
      
      console.log('📦 Datos recibidos del endpoint:', chasisData);
      
      // Procesar la información de chasis recibida del backend
      const chasisWithInfo = chasisData.chasis_available?.map((item: any, index: number) => ({
        chasis: item.chasis || `Stock-${color}-${index + 1}`,
        chasisOriginal: item.chasis || '',
        stock: item.stock,
        precio: item.precio,
        descuento: item.descuento || 0,
        unidad: index + 1,
        inventarioId: item.id,
        isIndividual: item.is_individual,
        allowCustomChasis: item.allow_custom_chasis
      })) || [];
      
      console.log('🏷️ Información de chasis procesada:', chasisWithInfo);
      
      const chasisList = chasisWithInfo
        .map(item => item.chasis)
        .filter(Boolean);
      
      setAvailableChasis(chasisList);
      setChasisInfo(chasisWithInfo);
    } catch (error) {
      console.error('❌ Error loading chasis:', error);
      setAvailableChasis([]);
      setChasisInfo([]);
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
    setSelectedChasis('');
    setCustomChasis('');
    
    if (data.selectedMotorcycle && data.selectedMotorcycle.modelo) {
      const colorOption = availableColors.find(c => c.color === color);
      const precioUnitario = colorOption?.priceWithDiscount || data.selectedMotorcycle.modelo.precio_venta;
      
      // Cargar chasis disponibles para este color
      loadChasisForColor(data.selectedMotorcycle.modelo.id, color);
      
      updateSelection({
        ...data.selectedMotorcycle,
        color,
        chasis: '', // Reset chasis when color changes
        precio_unitario: precioUnitario
      });
    }
  };

  const handleChasisSelect = (chasis: string) => {
    setSelectedChasis(chasis);
    setCustomChasis('');
    
    if (data.selectedMotorcycle) {
      // Buscar la información del chasis seleccionado para usar el precio correcto
      const chasisData = chasisInfo.find(item => item.chasis === chasis);
      const precioUnitario = chasisData?.precio || data.selectedMotorcycle.precio_unitario;
      
      updateSelection({
        ...data.selectedMotorcycle,
        chasis,
        precio_unitario: precioUnitario
      });
    }
  };

  const handleCustomChasisChange = (chasis: string) => {
    setCustomChasis(chasis);
    setSelectedChasis('');
    
    if (data.selectedMotorcycle) {
      updateSelection({
        ...data.selectedMotorcycle,
        chasis
      });
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    const selectedColorOption = availableColors.find(c => c.color === selectedColor);
    const maxQuantity = viewMode === 'modelos' 
      ? selectedColorOption?.availableStock || 0
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

  const addMotorcycleToCart = () => {
    if (!data.selectedMotorcycle) return;

    const newMotorcycle = { ...data.selectedMotorcycle };
    
    // Agregar al array de motocicletas
    const updatedMotorcycles = [...data.selectedMotorcycles, newMotorcycle];
    
    onUpdate({
      selectedMotorcycles: updatedMotorcycles
    });

    // Limpiar selección actual para permitir agregar otra
    resetSelection();
  };

  const removeMotorcycleFromCart = (index: number) => {
    const updatedMotorcycles = data.selectedMotorcycles.filter((_, i) => i !== index);
    onUpdate({
      selectedMotorcycles: updatedMotorcycles
    });
  };

  const resetSelection = () => {
    setSelectedModeloId(null);
    setSelectedMotoId(null);
    setSelectedColor('');
    setSelectedChasis('');
    setCustomChasis('');
    setQuantity(1);
    setAvailableColors([]);
    setAvailableChasis([]);
    setChasisInfo([]);
    
    onUpdate({
      selectedMotorcycle: null
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
    if (!data.selectedMotorcycle) return false;
    
    if (viewMode === 'individual') {
      return true; // Para motos individuales ya tiene todos los datos
    }
    
    // Para modelos, necesita color seleccionado
    if (!selectedColor) return false;
    
    // Y necesita chasis (seleccionado de la lista o personalizado)
    const hasChasisSelected = selectedChasis !== '' || customChasis.trim() !== '';
    
    return hasChasisSelected;
  };

  const getTotalFromCart = () => {
    return data.selectedMotorcycles.reduce((total, moto) => 
      total + (moto.precio_unitario * moto.cantidad), 0
    );
  };

  const getTotalQuantityFromCart = () => {
    return data.selectedMotorcycles.reduce((total, moto) => 
      total + moto.cantidad, 0
    );
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
          Selección de Motocicletas
        </h3>
        <p className="text-gray-600">
          Seleccione las motocicletas, colores y chasis para la venta. Puede agregar múltiples motocicletas.
        </p>
      </div>

      {/* Carrito de motocicletas seleccionadas */}
      {data.selectedMotorcycles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Motocicletas Seleccionadas ({getTotalQuantityFromCart()} unidades)
          </h4>
          
          <div className="space-y-3">
            {data.selectedMotorcycles.map((moto, index) => (
              <div key={index} className="bg-white border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">
                      {moto.tipo === 'modelo' 
                        ? `${moto.modelo?.marca} ${moto.modelo?.modelo} ${moto.modelo?.ano}`
                        : `${moto.moto?.marca} ${moto.moto?.modelo} ${moto.moto?.ano}`
                      }
                    </h5>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {moto.color && (
                        <span className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                            style={{ backgroundColor: getColorCode(moto.color) }}
                          ></div>
                          Color: {moto.color}
                        </span>
                      )}
                      {moto.chasis && (
                        <span className="flex items-center">
                          <Tag className="h-4 w-4 mr-1" />
                          Chasis: {moto.chasis}
                        </span>
                      )}
                      <span>Cantidad: {moto.cantidad}</span>
                      <span>Precio: {formatCurrency(moto.precio_unitario)}</span>
                      <span className="font-semibold text-blue-600">
                        Subtotal: {formatCurrency(moto.precio_unitario * moto.cantidad)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeMotorcycleFromCart(index)}
                    className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar motocicleta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-blue-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-900">Total General:</span>
              <span className="text-xl font-bold text-blue-900">
                {formatCurrency(getTotalFromCart())}
              </span>
            </div>
          </div>
        </div>
      )}

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
            <div className="flex items-center flex-1">
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
            
            {/* Botones de acción */}
            {isSelectionComplete() && (
              <div className="ml-4 flex space-x-2">
                <button
                  onClick={addMotorcycleToCart}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Otra
                </button>
                <button
                  onClick={resetSelection}
                  className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            )}
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

      {/* Selección de chasis (solo para modelos después de seleccionar color) */}
      {viewMode === 'modelos' && selectedColor && (
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Tag className="h-5 w-5 mr-2" />
            Seleccionar Número de Chasis
          </h4>
          
          {availableChasis.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-4">
                {/* Motos individuales con chasis específico */}
                {chasisInfo.filter(item => item.isIndividual).length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-3">Motocicletas Individuales Disponibles:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {chasisInfo.filter(item => item.isIndividual).map((item, index) => {
                        const isSelected = selectedChasis === item.chasis;
                        const isAvailable = item.stock > 0;
                        
                        return (
                          <button
                            key={`individual-${item.inventarioId || index}`}
                            onClick={() => handleChasisSelect(item.chasis)}
                            disabled={!isAvailable}
                            className={`p-3 text-left border-2 rounded-lg transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : isAvailable
                                ? 'border-green-200 hover:border-green-300 bg-green-50 cursor-pointer'
                                : 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium text-gray-900">📍 {item.chasis}</div>
                              <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                                isAvailable 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {isAvailable ? 'Disponible' : 'No Disponible'}
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="flex justify-between">
                                <span>Unidades:</span>
                                <span className="font-medium">{item.stock}</span>
                              </div>
                              {item.descuento && item.descuento > 0 && (
                                <div className="flex justify-between">
                                  <span>Descuento:</span>
                                  <span className="text-orange-600 font-medium">{item.descuento}%</span>
                                </div>
                              )}
                              <div className="flex justify-between border-t pt-1">
                                <span>Precio:</span>
                                <span className="font-medium text-green-600">
                                  {formatCurrency(item.precio)}
                                </span>
                              </div>
                            </div>
                            
                            {isSelected && (
                              <div className="mt-2 flex items-center text-xs text-blue-600">
                                <Check className="h-3 w-3 mr-1" />
                                Seleccionado
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Stock general sin chasis específico */}
                {chasisInfo.filter(item => !item.isIndividual).length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-3">Stock Disponible (Chasis Personalizable):</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {chasisInfo.filter(item => !item.isIndividual).map((item, index) => {
                        const isAvailable = item.stock > 0;
                        
                        return (
                          <div
                            key={`stock-${item.inventarioId || index}`}
                            className={`p-4 border-2 rounded-lg ${
                              isAvailable
                                ? 'border-blue-200 bg-blue-50'
                                : 'border-gray-200 bg-gray-50 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium text-gray-900">📦 Stock General</div>
                              <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                                isAvailable 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {item.stock} disponibles
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-600 space-y-1">
                              {item.descuento && item.descuento > 0 && (
                                <div className="flex justify-between">
                                  <span>Descuento:</span>
                                  <span className="text-orange-600 font-medium">{item.descuento}%</span>
                                </div>
                              )}
                              <div className="flex justify-between border-t pt-1">
                                <span>Precio unitario:</span>
                                <span className="font-medium text-green-600">
                                  {formatCurrency(item.precio)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-3 text-xs text-blue-600 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Requiere número de chasis personalizado
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔢 O ingrese un número de chasis personalizado:
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customChasis}
                    onChange={(e) => handleCustomChasisChange(e.target.value)}
                    placeholder="Ej: ABC123456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {customChasis && (
                    <div className="text-xs text-blue-600 flex items-center">
                      <Check className="h-3 w-3 mr-1" />
                      Chasis personalizado: {customChasis}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  No hay números de chasis específicos disponibles para este color en el inventario.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingrese el número de chasis:
                </label>
                <input
                  type="text"
                  value={customChasis}
                  onChange={(e) => handleCustomChasisChange(e.target.value)}
                  placeholder="Ingrese número de chasis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selección de cantidad */}
      {selectedColor && (selectedChasis || customChasis) && viewMode === 'modelos' && (
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
      {data.selectedMotorcycles.length === 0 && !data.selectedMotorcycle && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
          <span className="text-yellow-800">
            Debe agregar al menos una motocicleta al carrito para continuar.
          </span>
        </div>
      )}

      {data.selectedMotorcycle && !isSelectionComplete() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
          <div className="text-yellow-800">
            {!selectedColor ? (
              <div>
                <div className="font-medium">Falta seleccionar el color</div>
                <div className="text-sm">Seleccione un color para ver los chasis disponibles.</div>
              </div>
            ) : (
              <div>
                <div className="font-medium">Falta seleccionar el chasis</div>
                <div className="text-sm">
                  {chasisInfo.filter(item => item.isIndividual).length > 0
                    ? 'Seleccione una motocicleta individual o ingrese un chasis personalizado.'
                    : 'Ingrese el número de chasis para esta motocicleta.'
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botones de acción rápida al final */}
      {(data.selectedMotorcycles.length > 0 || data.selectedMotorcycle) && (
        <div className="bg-gray-50 border-t border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {data.selectedMotorcycles.length > 0 
                ? `${data.selectedMotorcycles.length} motocicleta(s) en el carrito`
                : 'Motocicleta seleccionada'
              }
              {data.selectedMotorcycle && !data.selectedMotorcycles.find(m => m.chasis === data.selectedMotorcycle?.chasis) && (
                <span className="ml-2 text-blue-600">
                  + 1 pendiente de agregar
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              {data.selectedMotorcycle && isSelectionComplete() && (
                <button
                  onClick={addMotorcycleToCart}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Agregar al Carrito
                </button>
              )}
              <div className="text-sm text-green-600 flex items-center">
                <Check className="h-4 w-4 mr-1" />
                Listo para continuar
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MotorcycleStep;