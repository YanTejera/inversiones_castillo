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
  Camera,
  Wand2 
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
  precio_compra_individual?: number; // Precio de compra específico para este color/chasis
  tasa_dolar?: number; // Tasa del dólar al momento de la compra
  fecha_compra?: string; // Fecha de compra de este stock específico
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
  // Especificaciones técnicas - Motor
  tipo_motor: string;
  cilindrada: string;
  potencia: string;
  refrigeracion: string;
  arranque: string;
  transmision: string;
  // Especificaciones técnicas - Dimensiones
  dimensiones: string;
  distancia_ejes: string;
  altura_asiento: string;
  peso_seco: string;
  tanque_combustible: string;
  capacidad_carga: string;
  // Especificaciones técnicas - Frenos y Suspensión
  freno_delantero: string;
  freno_trasero: string;
  llanta_delantera: string;
  llanta_trasera: string;
  suspension_delantera: string;
  suspension_trasera: string;
  // Especificaciones técnicas - Rendimiento
  consumo: string;
  velocidad_maxima: string;
  autonomia: string;
  emisiones: string;
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
        : Array(inv.cantidad_stock || 1).fill(''),
      precio_compra_individual: inv.precio_compra_individual || undefined,
      tasa_dolar: inv.tasa_dolar || undefined,
      fecha_compra: inv.fecha_compra || new Date().toISOString().split('T')[0]
    })) || [],
    // Especificaciones técnicas - Motor
    tipo_motor: modelo?.especificaciones?.tipo_motor || '',
    cilindrada: modelo?.especificaciones?.cilindrada || '',
    potencia: modelo?.especificaciones?.potencia || '',
    refrigeracion: modelo?.especificaciones?.refrigeracion || '',
    arranque: modelo?.especificaciones?.arranque || '',
    transmision: modelo?.especificaciones?.transmision || '',
    // Especificaciones técnicas - Dimensiones
    dimensiones: modelo?.especificaciones?.dimensiones || '',
    distancia_ejes: modelo?.especificaciones?.distancia_ejes || '',
    altura_asiento: modelo?.especificaciones?.altura_asiento || '',
    peso_seco: modelo?.especificaciones?.peso_seco || '',
    tanque_combustible: modelo?.especificaciones?.tanque_combustible || '',
    capacidad_carga: modelo?.especificaciones?.capacidad_carga || '',
    // Especificaciones técnicas - Frenos y Suspensión
    freno_delantero: modelo?.especificaciones?.freno_delantero || '',
    freno_trasero: modelo?.especificaciones?.freno_trasero || '',
    llanta_delantera: modelo?.especificaciones?.llanta_delantera || '',
    llanta_trasera: modelo?.especificaciones?.llanta_trasera || '',
    suspension_delantera: modelo?.especificaciones?.suspension_delantera || '',
    suspension_trasera: modelo?.especificaciones?.suspension_trasera || '',
    // Especificaciones técnicas - Rendimiento
    consumo: modelo?.especificaciones?.consumo || '',
    velocidad_maxima: modelo?.especificaciones?.velocidad_maxima || '',
    autonomia: modelo?.especificaciones?.autonomia || '',
    emisiones: modelo?.especificaciones?.emisiones || ''
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
        if (color.cantidad_stock < 0) {
          newErrors[`cantidad_${index}`] = 'La cantidad no puede ser negativa';
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
        // Especificaciones técnicas completas
        especificaciones: {
          // Motor
          tipo_motor: formData.tipo_motor || null,
          cilindrada: formData.cilindrada || null,
          potencia: formData.potencia || null,
          refrigeracion: formData.refrigeracion || null,
          arranque: formData.arranque || null,
          transmision: formData.transmision || null,
          // Dimensiones
          dimensiones: formData.dimensiones || null,
          distancia_ejes: formData.distancia_ejes || null,
          altura_asiento: formData.altura_asiento || null,
          peso_seco: formData.peso_seco || null,
          tanque_combustible: formData.tanque_combustible || null,
          capacidad_carga: formData.capacidad_carga || null,
          // Frenos y Suspensión
          freno_delantero: formData.freno_delantero || null,
          freno_trasero: formData.freno_trasero || null,
          llanta_delantera: formData.llanta_delantera || null,
          llanta_trasera: formData.llanta_trasera || null,
          suspension_delantera: formData.suspension_delantera || null,
          suspension_trasera: formData.suspension_trasera || null,
          // Rendimiento
          consumo: formData.consumo || null,
          velocidad_maxima: formData.velocidad_maxima || null,
          autonomia: formData.autonomia || null,
          emisiones: formData.emisiones || null
        },
        inventario_data: formData.colores.map(color => ({
          color: color.color,
          cantidad_stock: color.cantidad_stock,
          descuento_porcentaje: color.descuento_porcentaje || 0,
          chasis: Array.isArray(color.chasis) ? color.chasis[0] || undefined : color.chasis || undefined,
          chasis_list: Array.isArray(color.chasis) ? color.chasis : [color.chasis || ''],
          precio_compra_individual: color.precio_compra_individual || null,
          tasa_dolar: color.tasa_dolar || null,
          fecha_compra: color.fecha_compra || null
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
          chasis: [''],
          precio_compra_individual: undefined,
          tasa_dolar: undefined,
          fecha_compra: new Date().toISOString().split('T')[0]
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
            const newQuantity = parseInt(value) || 0;
            const currentChasis = color.chasis || [];
            console.log(`📦 Cantidad: ${currentChasis.length} -> ${newQuantity} chasis`);
            
            if (newQuantity > currentChasis.length) {
              // Agregar campos vacíos para los nuevos chasis
              updatedColor.chasis = [
                ...currentChasis,
                ...Array(newQuantity - currentChasis.length).fill('')
              ];
              console.log('✅ Chasis agregados:', updatedColor.chasis.length);
            } else if (newQuantity < currentChasis.length && newQuantity >= 0) {
              // Recortar el array si la cantidad disminuye
              updatedColor.chasis = currentChasis.slice(0, newQuantity);
              console.log('🔄 Chasis recortados:', updatedColor.chasis.length);
            }
            
            // Si la cantidad es 0, limpiar todos los chasis
            if (newQuantity === 0) {
              updatedColor.chasis = [];
            }
          }
          
          return updatedColor;
        }
        return color;
      })
    }));
  };

  // Función para extraer prefijo y detectar patrón de chasis
  const extractChasisPattern = (chasisInput: string) => {
    if (!chasisInput || chasisInput.length < 8) return null;
    
    // Buscar donde terminan las letras y empiezan solo números
    const match = chasisInput.match(/^([A-Z0-9]+?)(\d{4,})$/);
    if (match) {
      return {
        prefix: match[1],
        suffix: match[2],
        suffixLength: match[2].length
      };
    }
    
    // Fallback: tomar los primeros 8-12 caracteres como prefijo
    for (let i = 8; i <= Math.min(12, chasisInput.length); i++) {
      const prefix = chasisInput.substring(0, i);
      const suffix = chasisInput.substring(i);
      if (/^\d+$/.test(suffix) && suffix.length >= 3) {
        return {
          prefix,
          suffix,
          suffixLength: suffix.length
        };
      }
    }
    
    return null;
  };

  // Función para generar sugerencias de chasis
  const generateChasisSuggestions = (colorIndex: number) => {
    const color = formData.colores[colorIndex];
    if (!color || color.chasis.length === 0) return [];
    
    const firstChasis = color.chasis[0];
    if (!firstChasis || firstChasis.trim() === '') return [];
    
    const pattern = extractChasisPattern(firstChasis.trim());
    if (!pattern) return [];
    
    const suggestions = [];
    const startNumber = parseInt(pattern.suffix);
    
    for (let i = 1; i < color.cantidad_stock; i++) {
      if (i < color.chasis.length && color.chasis[i].trim() !== '') {
        continue; // Skip if already filled
      }
      
      const nextNumber = startNumber + i;
      const paddedNumber = nextNumber.toString().padStart(pattern.suffixLength, '0');
      suggestions.push(pattern.prefix + paddedNumber);
    }
    
    return suggestions;
  };

  // Función para aplicar auto-completado
  const applyChasisAutoFill = (colorIndex: number) => {
    const suggestions = generateChasisSuggestions(colorIndex);
    if (suggestions.length === 0) return;
    
    setFormData(prev => ({
      ...prev,
      colores: prev.colores.map((color, i) => {
        if (i === colorIndex) {
          const newChasis = [...color.chasis];
          let suggestionIndex = 0;
          
          for (let j = 1; j < newChasis.length; j++) {
            if (newChasis[j].trim() === '' && suggestionIndex < suggestions.length) {
              newChasis[j] = suggestions[suggestionIndex];
              suggestionIndex++;
            }
          }
          
          return { ...color, chasis: newChasis };
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-4">
            {mode === 'create' && 'Registrar Nueva Motocicleta'}
            {mode === 'edit' && 'Editar Motocicleta'}
            {mode === 'view' && 'Detalles de la Motocicleta'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('basico')}
              className={`py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'basico'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Bike className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Información Básica</span>
                <span className="sm:hidden">Básico</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('colores')}
              className={`py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'colores'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Palette className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Colores y Chasis ({formData.colores.length})</span>
                <span className="sm:hidden">Colores ({formData.colores.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tecnicas')}
              className={`py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'tecnicas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Especificaciones Técnicas</span>
                <span className="sm:hidden">Técnicas</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {/* Server Error */}
          {serverError && (
            <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {serverError}
            </div>
          )}

          {/* Tab Básico */}
          {activeTab === 'basico' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Información Básica */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
                  <Bike className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Información del Modelo
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                Especificaciones Técnicas Completas
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Motor y Rendimiento */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    Motor y Rendimiento
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="tipo_motor" className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Motor
                      </label>
                      <input
                        type="text"
                        id="tipo_motor"
                        name="tipo_motor"
                        value={formData.tipo_motor}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: Motor de 4 tiempos, monocilíndrico"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="cilindrada" className="block text-sm font-medium text-gray-700 mb-1">
                        Cilindrada
                      </label>
                      <input
                        type="text"
                        id="cilindrada"
                        name="cilindrada"
                        value={formData.cilindrada}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: 125 cc"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="potencia" className="block text-sm font-medium text-gray-700 mb-1">
                        Potencia Máxima
                      </label>
                      <input
                        type="text"
                        id="potencia"
                        name="potencia"
                        value={formData.potencia}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: 8.5 HP @ 7,500 rpm"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="refrigeracion" className="block text-sm font-medium text-gray-700 mb-1">
                        Sistema de Refrigeración
                      </label>
                      <input
                        type="text"
                        id="refrigeracion"
                        name="refrigeracion"
                        value={formData.refrigeracion}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: Por aire"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="arranque" className="block text-sm font-medium text-gray-700 mb-1">
                        Sistema de Arranque
                      </label>
                      <input
                        type="text"
                        id="arranque"
                        name="arranque"
                        value={formData.arranque}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: Eléctrico y kick"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

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
                        placeholder="Ej: 5 velocidades"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Dimensiones y Peso */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Dimensiones y Peso
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="dimensiones" className="block text-sm font-medium text-gray-700 mb-1">
                        Dimensiones (L x A x H)
                      </label>
                      <input
                        type="text"
                        id="dimensiones"
                        name="dimensiones"
                        value={formData.dimensiones}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: 1,950 x 720 x 1,040 mm"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="distancia_ejes" className="block text-sm font-medium text-gray-700 mb-1">
                        Distancia entre Ejes
                      </label>
                      <input
                        type="text"
                        id="distancia_ejes"
                        name="distancia_ejes"
                        value={formData.distancia_ejes}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: 1,285 mm"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="altura_asiento" className="block text-sm font-medium text-gray-700 mb-1">
                        Altura del Asiento
                      </label>
                      <input
                        type="text"
                        id="altura_asiento"
                        name="altura_asiento"
                        value={formData.altura_asiento}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: 785 mm"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="peso_seco" className="block text-sm font-medium text-gray-700 mb-1">
                        Peso en Seco
                      </label>
                      <input
                        type="text"
                        id="peso_seco"
                        name="peso_seco"
                        value={formData.peso_seco}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: 115 kg"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="tanque_combustible" className="block text-sm font-medium text-gray-700 mb-1">
                        Capacidad de Combustible
                      </label>
                      <input
                        type="text"
                        id="tanque_combustible"
                        name="tanque_combustible"
                        value={formData.tanque_combustible}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: 13 litros"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="capacidad_carga" className="block text-sm font-medium text-gray-700 mb-1">
                        Capacidad de Carga
                      </label>
                      <input
                        type="text"
                        id="capacidad_carga"
                        name="capacidad_carga"
                        value={formData.capacidad_carga}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: 150 kg"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Frenos y Suspensión */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Frenos y Suspensión
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="freno_delantero" className="block text-sm font-medium text-gray-700 mb-1">
                        Freno Delantero
                      </label>
                      <input
                        type="text"
                        id="freno_delantero"
                        name="freno_delantero"
                        value={formData.freno_delantero}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: Disco hidráulico de 220mm"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="freno_trasero" className="block text-sm font-medium text-gray-700 mb-1">
                        Freno Trasero
                      </label>
                      <input
                        type="text"
                        id="freno_trasero"
                        name="freno_trasero"
                        value={formData.freno_trasero}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: Tambor de 130mm"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="llanta_delantera" className="block text-sm font-medium text-gray-700 mb-1">
                        Llanta Delantera
                      </label>
                      <input
                        type="text"
                        id="llanta_delantera"
                        name="llanta_delantera"
                        value={formData.llanta_delantera}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: 2.75-18"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="llanta_trasera" className="block text-sm font-medium text-gray-700 mb-1">
                        Llanta Trasera
                      </label>
                      <input
                        type="text"
                        id="llanta_trasera"
                        name="llanta_trasera"
                        value={formData.llanta_trasera}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: 3.00-18"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="suspension_delantera" className="block text-sm font-medium text-gray-700 mb-1">
                        Suspensión Delantera
                      </label>
                      <input
                        type="text"
                        id="suspension_delantera"
                        name="suspension_delantera"
                        value={formData.suspension_delantera}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: Telescópica"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="suspension_trasera" className="block text-sm font-medium text-gray-700 mb-1">
                        Suspensión Trasera
                      </label>
                      <input
                        type="text"
                        id="suspension_trasera"
                        name="suspension_trasera"
                        value={formData.suspension_trasera}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: Doble amortiguador"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Consumo y Rendimiento */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Consumo y Rendimiento
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="consumo" className="block text-sm font-medium text-gray-700 mb-1">
                        Consumo de Combustible
                      </label>
                      <input
                        type="text"
                        id="consumo"
                        name="consumo"
                        value={formData.consumo}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: 50 km/litro"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="velocidad_maxima" className="block text-sm font-medium text-gray-700 mb-1">
                        Velocidad Máxima
                      </label>
                      <input
                        type="text"
                        id="velocidad_maxima"
                        name="velocidad_maxima"
                        value={formData.velocidad_maxima}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: 95 km/h"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="autonomia" className="block text-sm font-medium text-gray-700 mb-1">
                        Autonomía
                      </label>
                      <input
                        type="text"
                        id="autonomia"
                        name="autonomia"
                        value={formData.autonomia}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: 650 km"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="emisiones" className="block text-sm font-medium text-gray-700 mb-1">
                        Estándar de Emisiones
                      </label>
                      <input
                        type="text"
                        id="emisiones"
                        name="emisiones"
                        value={formData.emisiones}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Ej: Euro 3"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isReadOnly ? 'bg-gray-50' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de especificaciones */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Resumen de Especificaciones Principales</h4>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{formData.cilindrada || '---'}</div>
                    <div className="text-gray-600">Cilindrada</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{formData.potencia || '---'}</div>
                    <div className="text-gray-600">Potencia</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{formData.peso_seco || '---'}</div>
                    <div className="text-gray-600">Peso</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{formData.tanque_combustible || '---'}</div>
                    <div className="text-gray-600">Tanque</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{formData.consumo || '---'}</div>
                    <div className="text-gray-600">Consumo</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{formData.velocidad_maxima || '---'}</div>
                    <div className="text-gray-600">Vel. Máx.</div>
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

                      {/* Información básica del color */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                            min="0"
                            value={color.cantidad_stock}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Permitir campo vacío para que el usuario pueda editarlo libremente
                              if (value === '') {
                                updateColor(index, 'cantidad_stock', 0);
                              } else {
                                const numValue = parseInt(value);
                                if (!isNaN(numValue) && numValue >= 0) {
                                  updateColor(index, 'cantidad_stock', numValue);
                                }
                              }
                            }}
                            readOnly={isReadOnly}
                            placeholder="Cantidad de motos"
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

                      </div>

                      {/* Información de compra específica */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h5 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Información de Compra Específica (Opcional)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Precio Compra Individual
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={color.precio_compra_individual || ''}
                              onChange={(e) => updateColor(index, 'precio_compra_individual', e.target.value ? parseFloat(e.target.value) : undefined)}
                              readOnly={isReadOnly}
                              placeholder="Precio específico de este lote"
                              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isReadOnly ? 'bg-gray-50' : 'bg-white'
                              }`}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Si es diferente al precio base del modelo
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tasa del Dólar
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={color.tasa_dolar || ''}
                              onChange={(e) => updateColor(index, 'tasa_dolar', e.target.value ? parseFloat(e.target.value) : undefined)}
                              readOnly={isReadOnly}
                              placeholder="Ej: 58.50"
                              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isReadOnly ? 'bg-gray-50' : 'bg-white'
                              }`}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Tasa al momento de la compra
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Fecha de Compra
                            </label>
                            <input
                              type="date"
                              value={color.fecha_compra || ''}
                              onChange={(e) => updateColor(index, 'fecha_compra', e.target.value)}
                              readOnly={isReadOnly}
                              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isReadOnly ? 'bg-gray-50' : 'bg-white'
                              }`}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Fecha de compra de este stock
                            </p>
                          </div>
                        </div>

                        {/* Cálculo de precio en pesos */}
                        {color.precio_compra_individual && color.tasa_dolar && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="text-sm">
                              <span className="text-green-700 font-medium">
                                Precio en RD$: {(color.precio_compra_individual * color.tasa_dolar).toLocaleString('es-DO', {
                                  style: 'currency',
                                  currency: 'DOP',
                                  minimumFractionDigits: 0
                                })}
                              </span>
                              <span className="text-gray-500 text-xs ml-2">
                                (${color.precio_compra_individual} × RD${color.tasa_dolar})
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Números de Chasis */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Números de Chasis *
                          </label>
                          {!isReadOnly && color.cantidad_stock > 1 && color.chasis[0]?.trim() && (
                            <button
                              type="button"
                              onClick={() => applyChasisAutoFill(index)}
                              className="flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                              title="Auto-completar chasis basado en el primer número"
                            >
                              <Wand2 className="h-3 w-3 mr-1" />
                              Auto-completar
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          Se requiere un número de chasis único para cada unidad ({color.cantidad_stock} unidades)
                        </p>
                        {color.chasis[0]?.trim() && color.cantidad_stock > 1 && (
                          <div className="text-xs text-blue-600 mb-2 p-2 bg-blue-50 rounded border border-blue-200">
                            💡 <strong>Tip:</strong> Ingresa el primer chasis completo y usa "Auto-completar" para generar los siguientes automáticamente
                          </div>
                        )}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {color.chasis.map((chasis, chasisIndex) => {
                              const isFirstChasis = chasisIndex === 0;
                              const pattern = isFirstChasis && chasis.trim() ? extractChasisPattern(chasis.trim()) : null;
                              
                              return (
                                <div key={chasisIndex} className={isFirstChasis ? 'md:col-span-2 lg:col-span-3' : ''}>
                                  {isFirstChasis && (
                                    <label className="text-xs font-medium text-blue-600 mb-1 block">
                                      Chasis Base (usado para generar los siguientes)
                                    </label>
                                  )}
                                  <input
                                    type="text"
                                    value={chasis}
                                    onChange={(e) => updateChasis(index, chasisIndex, e.target.value)}
                                    readOnly={isReadOnly}
                                    placeholder={isFirstChasis ? "Ej: TBLPCL4A02B002222" : `Chasis ${chasisIndex + 1}...`}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                      isReadOnly ? 'bg-gray-50' : 'bg-white'
                                    } ${!chasis.trim() ? 'border-red-300 bg-red-50' : isFirstChasis ? 'border-blue-300 bg-blue-50' : 'border-gray-300'}`}
                                  />
                                  {pattern && (
                                    <div className="text-xs text-green-600 mt-1">
                                      ✅ Patrón detectado: <code className="bg-green-100 px-1 rounded">{pattern.prefix}</code> + números secuenciales
                                    </div>
                                  )}
                                  {!chasis.trim() && (
                                    <p className="text-red-500 text-xs mt-1">Chasis requerido</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {/* Errores de validación de chasis */}
                          {errors[`chasis_${index}`] && (
                            <p className="text-red-500 text-sm mt-2">{errors[`chasis_${index}`]}</p>
                          )}
                          {errors[`chasis_duplicados_${index}`] && (
                            <p className="text-red-500 text-sm mt-2">{errors[`chasis_duplicados_${index}`]}</p>
                          )}
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