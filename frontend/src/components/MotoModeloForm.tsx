import React, { useState, useRef } from 'react';
import { 
  X, 
  Save, 
  Bike, 
  DollarSign, 
  Plus, 
  Trash2, 
  Palette,
  Package,
  Camera 
} from 'lucide-react';
import { motoModeloService } from '../services/motoModeloService';
import type { MotoModelo } from '../types';

interface MotoModeloFormProps {
  modelo?: MotoModelo | null;
  mode: 'create' | 'edit' | 'view';
  onClose: () => void;
  onSave: () => void;
}

interface ColorInventario {
  color: string;
  cantidad_stock: number;
  descuento_porcentaje: number;
  chasis: string[]; // Array de chasis, uno por cada unidad
}

interface FormData {
  marca: string;
  modelo: string;
  ano: string;
  condicion: 'nueva' | 'usada';
  descripcion: string;
  precio_compra: string;
  precio_venta: string;
  moneda_compra: 'USD' | 'RD' | 'EUR' | 'COP';
  moneda_venta: 'USD' | 'RD' | 'EUR' | 'COP';
  activa: boolean;
  imagen?: File;
  colores: ColorInventario[];
  // Especificaciones técnicas
  cilindraje: string;
  tipo_motor: '2_tiempos' | '4_tiempos' | 'electrico' | '';
  potencia: string;
  torque: string;
  combustible: string;
  transmision: string;
  peso: string;
  capacidad_tanque: string;
}

const MotoModeloForm: React.FC<MotoModeloFormProps> = ({ modelo, mode, onClose, onSave }) => {
  const [formData, setFormData] = useState<FormData>({
    marca: modelo?.marca || '',
    modelo: modelo?.modelo || '',
    ano: modelo?.ano?.toString() || '',
    condicion: modelo?.condicion || 'nueva',
    descripcion: modelo?.descripcion || '',
    precio_compra: modelo?.precio_compra?.toString() || '',
    precio_venta: modelo?.precio_venta?.toString() || '',
    moneda_compra: modelo?.moneda_compra || 'USD',
    moneda_venta: modelo?.moneda_venta || 'RD',
    activa: modelo?.activa ?? true,
    colores: modelo?.inventario?.map(inv => ({
      color: inv.color || '',
      cantidad_stock: inv.cantidad_stock || 1,
      descuento_porcentaje: inv.descuento_porcentaje || 0,
      chasis: inv.chasis && inv.chasis.trim() 
        ? [inv.chasis] 
        : Array(inv.cantidad_stock || 1).fill('')
    })) || [],
    // Especificaciones técnicas
    cilindraje: modelo?.cilindraje?.toString() || '',
    tipo_motor: modelo?.tipo_motor || '',
    potencia: modelo?.potencia || '',
    torque: modelo?.torque || '',
    combustible: modelo?.combustible || 'Gasolina',
    transmision: modelo?.transmision || '',
    peso: modelo?.peso?.toString() || '',
    capacidad_tanque: modelo?.capacidad_tanque?.toString() || ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [activeTab, setActiveTab] = useState('basico');
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    console.log('=== ESTADO INICIAL DEL FORMULARIO ===');
    console.log('Modelo recibido:', modelo);
    console.log('Formdata.colores inicial:', formData.colores);
    console.log('Mode:', mode);
    
    if (modelo?.imagen) {
      setImagePreview(modelo.imagen);
    }
  }, [modelo]);
  
  // Debug: Log cuando cambien los colores (removido para evitar loops)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.marca.trim()) {
      newErrors.marca = 'La marca es requerida';
    }
    if (!formData.modelo.trim()) {
      newErrors.modelo = 'El modelo es requerido';
    }
    if (!formData.ano) {
      newErrors.ano = 'El año es requerido';
    } else {
      const year = parseInt(formData.ano);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear + 1) {
        newErrors.ano = `El año debe estar entre 1900 y ${currentYear + 1}`;
      }
    }
    if (!formData.precio_compra) {
      newErrors.precio_compra = 'El precio de compra es requerido';
    } else if (isNaN(Number(formData.precio_compra)) || Number(formData.precio_compra) < 0) {
      newErrors.precio_compra = 'Debe ser un precio válido';
    }
    if (!formData.precio_venta) {
      newErrors.precio_venta = 'El precio de venta es requerido';
    } else if (isNaN(Number(formData.precio_venta)) || Number(formData.precio_venta) < 0) {
      newErrors.precio_venta = 'Debe ser un precio válido';
    }

    // Validar que precio de venta sea mayor a precio de compra
    if (formData.precio_compra && formData.precio_venta) {
      const compra = Number(formData.precio_compra);
      const venta = Number(formData.precio_venta);
      if (venta <= compra) {
        newErrors.precio_venta = 'El precio de venta debe ser mayor al precio de compra';
      }
    }

    // Validar colores
    if (formData.colores.length === 0) {
      newErrors.colores = 'Debe agregar al menos un color';
    } else {
      formData.colores.forEach((color, index) => {
        if (!color.color.trim()) {
          newErrors[`color_${index}`] = 'El color es requerido';
        }
        if (color.cantidad_stock < 1) {
          newErrors[`cantidad_${index}`] = 'La cantidad debe ser mayor a 0';
        }
        if (color.descuento_porcentaje < 0 || color.descuento_porcentaje > 100) {
          newErrors[`descuento_${index}`] = 'El descuento debe estar entre 0 y 100%';
        }
        
        // Validar que todos los chasis estén completos
        const chasisArray = Array.isArray(color.chasis) ? color.chasis : [color.chasis || ''];
        const emptyChasis = chasisArray.filter(chasis => !chasis.trim()).length;
        if (emptyChasis > 0) {
          newErrors[`chasis_${index}`] = `Faltan ${emptyChasis} números de chasis`;
        }
        
        // Validar que no haya chasis duplicados
        const uniqueChasis = new Set(chasisArray.filter(c => c.trim()));
        if (uniqueChasis.size !== chasisArray.filter(c => c.trim()).length) {
          newErrors[`chasis_duplicados_${index}`] = 'Los números de chasis deben ser únicos';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setServerError('');
    
    try {
      const submitData: any = {
        marca: formData.marca,
        modelo: formData.modelo,
        ano: Number(formData.ano),
        condicion: formData.condicion,
        descripcion: formData.descripcion,
        precio_compra: Number(formData.precio_compra),
        precio_venta: Number(formData.precio_venta),
        moneda_compra: formData.moneda_compra,
        moneda_venta: formData.moneda_venta,
        activa: formData.activa,
        // Especificaciones técnicas
        cilindraje: formData.cilindraje ? Number(formData.cilindraje) : null,
        tipo_motor: formData.tipo_motor || null,
        potencia: formData.potencia || null,
        torque: formData.torque || null,
        combustible: formData.combustible || null,
        transmision: formData.transmision || null,
        peso: formData.peso ? Number(formData.peso) : null,
        capacidad_tanque: formData.capacidad_tanque ? Number(formData.capacidad_tanque) : null,
        inventario_data: formData.colores.map(color => ({
          color: color.color,
          cantidad_stock: color.cantidad_stock,
          descuento_porcentaje: color.descuento_porcentaje || 0,
          chasis: Array.isArray(color.chasis) ? color.chasis[0] || undefined : color.chasis || undefined,
          chasis_list: Array.isArray(color.chasis) ? color.chasis : [color.chasis || '']
        }))
      };

      // Solo agregar la imagen si realmente hay una
      if (formData.imagen && formData.imagen instanceof File) {
        submitData.imagen = formData.imagen;
      }

      // Validar que todos los chasis estén llenos
      const invalidChasis = [];
      formData.colores.forEach((color, colorIndex) => {
        color.chasis.forEach((chasis, chasisIndex) => {
          if (!chasis || chasis.trim() === '') {
            invalidChasis.push(`Color ${colorIndex + 1}, Unidad ${chasisIndex + 1}`);
          }
        });
      });

      if (invalidChasis.length > 0) {
        setServerError(`⚠️ Los siguientes chasis están vacíos: ${invalidChasis.join(', ')}. Todos los chasis son obligatorios.`);
        return;
      }

      // Validar chasis únicos
      const allChasis = formData.colores.flatMap(color => color.chasis.filter(c => c.trim() !== ''));
      const duplicateChasis = allChasis.filter((chasis, index) => allChasis.indexOf(chasis) !== index);
      if (duplicateChasis.length > 0) {
        setServerError(`⚠️ Chasis duplicados encontrados: ${[...new Set(duplicateChasis)].join(', ')}. Cada chasis debe ser único.`);
        return;
      }

      console.log('🚀 === DATOS ENVIADOS AL BACKEND ===');
      console.log('📋 Datos completos:', submitData);
      console.log('🔢 ID del modelo:', modelo?.id);
      console.log('📦 Inventario data detallado:');
      submitData.inventario_data.forEach((item, index) => {
        console.log(`   Color ${index + 1}:`, {
          color: item.color,
          cantidad_stock: item.cantidad_stock,
          chasis: item.chasis,
          chasis_list: item.chasis_list
        });
      });
      if (submitData.imagen) {
        console.log('🖼️ Imagen:', submitData.imagen.name, submitData.imagen.size);
      }

      let response;
      if (mode === 'create') {
        console.log('📤 Creando nuevo modelo...');
        response = await motoModeloService.createModelo(submitData);
      } else if (mode === 'edit' && modelo) {
        console.log('📤 Actualizando modelo ID:', modelo.id);
        response = await motoModeloService.updateModelo({ ...submitData, id: modelo.id });
      }
      
      console.log('✅ Respuesta del backend:', response);
      console.log('🔄 Cerrando formulario y recargando...');
      
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving modelo:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Full error object:', error);
      
      // Mostrar mensaje de error más específico
      let errorMessage = 'Error al guardar el modelo de motocicleta';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Si hay errores de validación específicos
        if (typeof errorData === 'object') {
          const errorMessages = [];
          for (const [field, messages] of Object.entries(errorData)) {
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${messages}`);
            }
          }
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('\n');
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      setServerError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addColor = () => {
    try {
      console.log('=== AGREGANDO NUEVO COLOR ===');
      
      setFormData(prev => {
        const newColor = { 
          color: '', 
          cantidad_stock: 1, 
          descuento_porcentaje: 0, 
          chasis: [''] 
        };
        const newColores = [...prev.colores, newColor];
        console.log(`Colores: ${prev.colores.length} -> ${newColores.length}`);
        
        return {
          ...prev,
          colores: newColores
        };
      });
      
      console.log('=== COLOR AGREGADO EXITOSAMENTE ===');
    } catch (error) {
      console.error('Error al agregar color:', error);
    }
  };

  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colores: prev.colores.filter((_, i) => i !== index)
    }));
  };

  const updateColor = (index: number, field: keyof ColorInventario, value: any) => {
    console.log(`Actualizando color ${index}, campo ${field}:`, value);
    setFormData(prev => ({
      ...prev,
      colores: prev.colores.map((color, i) => {
        if (i === index) {
          const updatedColor = { ...color, [field]: value };
          
          // Si se cambió la cantidad, ajustar el array de chasis
          if (field === 'cantidad_stock') {
            const newQuantity = parseInt(value) || 1;
            const currentChasis = color.chasis || [];
            console.log(`📦 Cantidad: ${currentChasis.length} -> ${newQuantity} chasis`);
            
            if (newQuantity > currentChasis.length) {
              // Agregar campos vacíos para los nuevos chasis (manual)
              updatedColor.chasis = [
                ...currentChasis,
                ...Array(newQuantity - currentChasis.length).fill('')
              ];
              console.log('✅ Chasis agregados:', updatedColor.chasis.length);
            } else if (newQuantity < currentChasis.length) {
              // Recortar el array si la cantidad disminuye
              updatedColor.chasis = currentChasis.slice(0, newQuantity);
              console.log('🔄 Chasis recortados:', updatedColor.chasis.length);
            }
          }
          
          return updatedColor;
        }
        return color;
      })
    }));
  };

  const updateChasis = (colorIndex: number, chasisIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      colores: prev.colores.map((color, i) => {
        if (i === colorIndex) {
          const newChasis = [...color.chasis];
          newChasis[chasisIndex] = value;
          return { ...color, chasis: newChasis };
        }
        return color;
      })
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, imagen: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imagen: undefined }));
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculatePriceWithDiscount = (basePrice: number, discount: number) => {
    if (discount > 0) {
      return basePrice * (1 - discount / 100);
    }
    return basePrice;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`Campo ${name} cambiado a:`, value);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isReadOnly = mode === 'view';
  const gananciaCalculada = formData.precio_venta && formData.precio_compra 
    ? Number(formData.precio_venta) - Number(formData.precio_compra) 
    : 0;

  const getCurrencySymbol = (currency: string) => {
    switch(currency) {
      case 'USD': return '$';
      case 'RD': return 'RD$';
      case 'EUR': return '€';
      case 'COP': return '$';
      default: return '$';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' && 'Registrar Nueva Motocicleta'}
            {mode === 'edit' && 'Editar Motocicleta'}
            {mode === 'view' && 'Detalles de la Motocicleta'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('basico')}
              className={`py-3 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'basico'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Bike className="h-4 w-4 mr-2" />
                Información Básica
              </div>
            </button>
            <button
              onClick={() => setActiveTab('colores')}
              className={`py-3 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'colores'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Palette className="h-4 w-4 mr-2" />
                Colores y Chasis ({formData.colores.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tecnicas')}
              className={`py-3 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'tecnicas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Especificaciones Técnicas
              </div>
            </button>
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Server Error */}
          {serverError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {serverError}
            </div>
          )}

          {/* Tab Básico */}
          {activeTab === 'basico' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Información Básica */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Bike className="h-5 w-5 mr-2" />
                  Información del Modelo
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
                    <input
                      type="text"
                      value={formData.marca}
                      onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                      readOnly={isReadOnly}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.marca ? 'border-red-500' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-50' : ''}`}
                    />
                    {errors.marca && <p className="text-red-500 text-sm mt-1">{errors.marca}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
                    <input
                      type="text"
                      value={formData.modelo}
                      onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                      readOnly={isReadOnly}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.modelo ? 'border-red-500' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-50' : ''}`}
                    />
                    {errors.modelo && <p className="text-red-500 text-sm mt-1">{errors.modelo}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Año *</label>
                    <input
                      type="number"
                      value={formData.ano}
                      onChange={(e) => setFormData(prev => ({ ...prev, ano: e.target.value }))}
                      readOnly={isReadOnly}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.ano ? 'border-red-500' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-50' : ''}`}
                    />
                    {errors.ano && <p className="text-red-500 text-sm mt-1">{errors.ano}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condición *</label>
                    <select
                      value={formData.condicion}
                      onChange={(e) => {
                        console.log('Cambio de condición en MotoModeloForm:', e.target.value);
                        setFormData(prev => ({ ...prev, condicion: e.target.value as 'nueva' | 'usada' }));
                      }}
                      disabled={isReadOnly}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isReadOnly ? 'bg-gray-50' : ''
                      }`}
                    >
                      <option value="nueva">Nueva</option>
                      <option value="usada">Usada</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.activa}
                        onChange={(e) => setFormData(prev => ({ ...prev, activa: e.target.checked }))}
                        disabled={isReadOnly}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Modelo Activo</span>
                    </label>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    readOnly={isReadOnly}
                    rows={3}
                    placeholder="Detalles adicionales del modelo..."
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isReadOnly ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>

                {/* Precios */}
                <h3 className="text-lg font-medium text-gray-900 flex items-center mt-6">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Información de Precios
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Precio de Compra */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Compra *</label>
                    <div className="flex gap-2">
                      <select
                        name="moneda_compra"
                        value={formData.moneda_compra}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      >
                        <option value="USD">USD</option>
                        <option value="RD">RD</option>
                        <option value="EUR">EUR</option>
                        <option value="COP">COP</option>
                      </select>
                      <input
                        type="number"
                        value={formData.precio_compra}
                        onChange={(e) => setFormData(prev => ({ ...prev, precio_compra: e.target.value }))}
                        readOnly={isReadOnly}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.precio_compra ? 'border-red-500' : 'border-gray-300'
                        } ${isReadOnly ? 'bg-gray-50' : ''}`}
                      />
                    </div>
                    {formData.precio_compra && (
                      <p className="text-xs text-gray-500 mt-1">
                        {getCurrencySymbol(formData.moneda_compra)} {new Intl.NumberFormat('es-CO', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(Number(formData.precio_compra))}
                      </p>
                    )}
                    {errors.precio_compra && <p className="text-red-500 text-sm mt-1">{errors.precio_compra}</p>}
                  </div>

                  {/* Precio de Venta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta *</label>
                    <div className="flex gap-2">
                      <select
                        name="moneda_venta"
                        value={formData.moneda_venta}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      >
                        <option value="USD">USD</option>
                        <option value="RD">RD</option>
                        <option value="EUR">EUR</option>
                        <option value="COP">COP</option>
                      </select>
                      <input
                        type="number"
                        value={formData.precio_venta}
                        onChange={(e) => setFormData(prev => ({ ...prev, precio_venta: e.target.value }))}
                        readOnly={isReadOnly}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.precio_venta ? 'border-red-500' : 'border-gray-300'
                        } ${isReadOnly ? 'bg-gray-50' : ''}`}
                      />
                    </div>
                    {formData.precio_venta && (
                      <p className="text-xs text-gray-500 mt-1">
                        {getCurrencySymbol(formData.moneda_venta)} {new Intl.NumberFormat('es-CO', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(Number(formData.precio_venta))}
                      </p>
                    )}
                    {errors.precio_venta && <p className="text-red-500 text-sm mt-1">{errors.precio_venta}</p>}
                  </div>
                </div>
                
                {/* Ganancia calculada - mostrar solo cuando ambos precios tienen datos */}
                {formData.precio_compra && formData.precio_venta && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ganancia Estimada
                    </label>
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="text-sm text-gray-600">
                        <span>Compra: {getCurrencySymbol(formData.moneda_compra)} {new Intl.NumberFormat('es-CO', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(Number(formData.precio_compra))}</span>
                        <span className="mx-2">→</span>
                        <span>Venta: {getCurrencySymbol(formData.moneda_venta)} {new Intl.NumberFormat('es-CO', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(Number(formData.precio_venta))}</span>
                      </div>
                      {formData.moneda_compra === formData.moneda_venta && (
                        <div className="text-green-700 font-semibold mt-1">
                          Ganancia: {getCurrencySymbol(formData.moneda_venta)} {new Intl.NumberFormat('es-CO', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(gananciaCalculada)}
                        </div>
                      )}
                      {formData.moneda_compra !== formData.moneda_venta && (
                        <div className="text-orange-600 text-xs mt-1">
                          ⚠️ Diferentes monedas - conversión requerida para cálculo exacto
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ganancia Calculada</label>
                    <div className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-md text-green-700 font-semibold">
                      {formatCurrency(gananciaCalculada)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Imagen */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Imagen
                </h3>
                
                <div className="space-y-4">
                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                  
                  {!isReadOnly && (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Camera className="h-8 w-8 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">
                          {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                        </p>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Especificaciones Técnicas */}
          {activeTab === 'tecnicas' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Especificaciones Técnicas del Motor
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Motor */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-4">Motor</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="cilindraje" className="block text-sm font-medium text-gray-700 mb-1">
                        Cilindraje (CC)
                      </label>
                      <input
                        type="number"
                        id="cilindraje"
                        name="cilindraje"
                        value={formData.cilindraje}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        min="0"
                        placeholder="Ej: 150, 250, 500..."
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">Cilindrada del motor en centímetros cúbicos</p>
                    </div>

                    <div>
                      <label htmlFor="tipo_motor" className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Motor
                      </label>
                      <select
                        id="tipo_motor"
                        name="tipo_motor"
                        value={formData.tipo_motor}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      >
                        <option value="">Seleccionar tipo</option>
                        <option value="2_tiempos">2 Tiempos</option>
                        <option value="4_tiempos">4 Tiempos</option>
                        <option value="electrico">Eléctrico</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="potencia" className="block text-sm font-medium text-gray-700 mb-1">
                        Potencia
                      </label>
                      <input
                        type="text"
                        id="potencia"
                        name="potencia"
                        value={formData.potencia}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: 15 HP @ 8000 RPM"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">Potencia máxima del motor</p>
                    </div>

                    <div>
                      <label htmlFor="torque" className="block text-sm font-medium text-gray-700 mb-1">
                        Torque
                      </label>
                      <input
                        type="text"
                        id="torque"
                        name="torque"
                        value={formData.torque}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: 12 Nm @ 6000 RPM"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">Torque máximo del motor</p>
                    </div>

                    <div>
                      <label htmlFor="combustible" className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Combustible
                      </label>
                      <input
                        type="text"
                        id="combustible"
                        name="combustible"
                        value={formData.combustible}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: Gasolina, Diesel, Eléctrico"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Características */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-4">Características</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="transmision" className="block text-sm font-medium text-gray-700 mb-1">
                        Transmisión
                      </label>
                      <input
                        type="text"
                        id="transmision"
                        name="transmision"
                        value={formData.transmision}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: Manual 5 velocidades"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="peso" className="block text-sm font-medium text-gray-700 mb-1">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        id="peso"
                        name="peso"
                        value={formData.peso}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        min="0"
                        step="0.1"
                        placeholder="Ej: 120.5"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">Peso en seco de la motocicleta</p>
                    </div>

                    <div>
                      <label htmlFor="capacidad_tanque" className="block text-sm font-medium text-gray-700 mb-1">
                        Capacidad del Tanque (L)
                      </label>
                      <input
                        type="number"
                        id="capacidad_tanque"
                        name="capacidad_tanque"
                        value={formData.capacidad_tanque}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        min="0"
                        step="0.1"
                        placeholder="Ej: 12.5"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">Capacidad del tanque de combustible</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de especificaciones */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Resumen de Especificaciones</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{formData.cilindraje || '---'}</div>
                    <div className="text-gray-600">CC</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{formData.tipo_motor ? (formData.tipo_motor === '2_tiempos' ? '2T' : formData.tipo_motor === '4_tiempos' ? '4T' : 'E') : '---'}</div>
                    <div className="text-gray-600">Motor</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{formData.peso || '---'}</div>
                    <div className="text-gray-600">kg</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{formData.capacidad_tanque || '---'}</div>
                    <div className="text-gray-600">L</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Colores */}
          {activeTab === 'colores' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Colores y Stock Disponible
                </h3>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={addColor}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Color
                  </button>
                )}
              </div>

              {errors.colores && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {errors.colores}
                </div>
              )}

              {formData.colores.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay colores agregados</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Agrega al menos un color con su cantidad en stock
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.colores.map((color, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-gray-900">Color {index + 1}</h4>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => removeColor(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
                          <input
                            type="text"
                            value={color.color}
                            onChange={(e) => updateColor(index, 'color', e.target.value)}
                            readOnly={isReadOnly}
                            placeholder="Ej: Rojo, Azul, Negro..."
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`color_${index}`] ? 'border-red-500' : 'border-gray-300'
                            } ${isReadOnly ? 'bg-gray-50' : 'bg-white'}`}
                          />
                          {errors[`color_${index}`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`color_${index}`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                          <input
                            type="number"
                            min="1"
                            value={color.cantidad_stock}
                            onChange={(e) => updateColor(index, 'cantidad_stock', parseInt(e.target.value) || 1)}
                            readOnly={isReadOnly}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`cantidad_${index}`] ? 'border-red-500' : 'border-gray-300'
                            } ${isReadOnly ? 'bg-gray-50' : 'bg-white'}`}
                          />
                          {errors[`cantidad_${index}`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`cantidad_${index}`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={color.descuento_porcentaje}
                            onChange={(e) => updateColor(index, 'descuento_porcentaje', parseFloat(e.target.value) || 0)}
                            readOnly={isReadOnly}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`descuento_${index}`] ? 'border-red-500' : 'border-gray-300'
                            } ${isReadOnly ? 'bg-gray-50' : 'bg-white'}`}
                          />
                          {errors[`descuento_${index}`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`descuento_${index}`]}</p>
                          )}
                        </div>

                        <div className="md:col-span-2 lg:col-span-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Números de Chasis *
                          </label>
                          <p className="text-xs text-gray-500 mb-2">
                            Se requiere un número de chasis único para cada unidad ({color.cantidad_stock} unidades)
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {color.chasis.map((chasis, chasisIndex) => (
                              <div key={chasisIndex}>
                                <input
                                  type="text"
                                  value={chasis}
                                  onChange={(e) => updateChasis(index, chasisIndex, e.target.value)}
                                  readOnly={isReadOnly}
                                  placeholder={`Chasis ${chasisIndex + 1}...`}
                                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    isReadOnly ? 'bg-gray-50' : 'bg-white'
                                  } ${!chasis.trim() ? 'border-red-300 bg-red-50' : ''}`}
                                />
                                {!chasis.trim() && (
                                  <p className="text-red-500 text-xs mt-1">Chasis requerido</p>
                                )}
                              </div>
                            ))}
                          </div>
                          {/* Errores de validación de chasis */}
                          {errors[`chasis_${index}`] && (
                            <p className="text-red-500 text-sm mt-2">{errors[`chasis_${index}`]}</p>
                          )}
                          {errors[`chasis_duplicados_${index}`] && (
                            <p className="text-red-500 text-sm mt-2">{errors[`chasis_duplicados_${index}`]}</p>
                          )}
                        </div>
                      </div>

                      {/* Precio con descuento */}
                      {formData.precio_venta && color.descuento_porcentaje > 0 && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-green-700">Precio original:</span>
                            <span className="text-green-700">{formatCurrency(Number(formData.precio_venta))}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-semibold">
                            <span className="text-green-800">Precio con descuento ({color.descuento_porcentaje}%):</span>
                            <span className="text-green-800">
                              {formatCurrency(calculatePriceWithDiscount(Number(formData.precio_venta), color.descuento_porcentaje))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === 'create' ? 'Registrar Motocicleta' : 'Guardar Cambios'}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default MotoModeloForm;