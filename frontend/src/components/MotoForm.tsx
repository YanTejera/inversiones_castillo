import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Bike, DollarSign, Package, Camera, CalendarDays, FileText } from 'lucide-react';
import { motoService } from '../services/motoService';
import type { Moto } from '../types';

interface MotoFormProps {
  moto?: Moto | null;
  mode: 'create' | 'edit' | 'view';
  onClose: () => void;
  onSave: () => void;
}

interface FormData {
  marca: string;
  modelo: string;
  ano: string;
  color: string;
  chasis: string;
  precio_compra: string;
  precio_venta: string;
  cantidad_stock: string;
  descripcion: string;
  activa: boolean;
  imagen?: File;
}

const MotoForm: React.FC<MotoFormProps> = ({ moto, mode, onClose, onSave }) => {
  const [formData, setFormData] = useState<FormData>({
    marca: '',
    modelo: '',
    ano: '',
    color: '',
    chasis: '',
    precio_compra: '',
    precio_venta: '',
    cantidad_stock: '',
    descripcion: '',
    activa: true
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (moto) {
      setFormData({
        marca: moto.marca || '',
        modelo: moto.modelo || '',
        ano: moto.ano?.toString() || '',
        color: moto.color || '',
        chasis: moto.chasis || '',
        precio_compra: moto.precio_compra?.toString() || '',
        precio_venta: moto.precio_venta?.toString() || '',
        cantidad_stock: moto.cantidad_stock?.toString() || '',
        descripcion: moto.descripcion || '',
        activa: moto.activa ?? true
      });
      
      if (moto.imagen) {
        setImagePreview(moto.imagen);
      }
    }
  }, [moto]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, imagen: file }));
      
      // Create preview
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
    if (!formData.cantidad_stock) {
      newErrors.cantidad_stock = 'La cantidad en stock es requerida';
    } else if (isNaN(Number(formData.cantidad_stock)) || Number(formData.cantidad_stock) < 0) {
      newErrors.cantidad_stock = 'Debe ser un número válido';
    }

    // Validar que precio de venta sea mayor a precio de compra
    if (formData.precio_compra && formData.precio_venta) {
      const compra = Number(formData.precio_compra);
      const venta = Number(formData.precio_venta);
      if (venta <= compra) {
        newErrors.precio_venta = 'El precio de venta debe ser mayor al precio de compra';
      }
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
      const submitData = {
        marca: formData.marca,
        modelo: formData.modelo,
        ano: Number(formData.ano),
        color: formData.color,
        chasis: formData.chasis,
        precio_compra: Number(formData.precio_compra),
        precio_venta: Number(formData.precio_venta),
        cantidad_stock: Number(formData.cantidad_stock),
        descripcion: formData.descripcion,
        activa: formData.activa,
        imagen: formData.imagen
      };

      console.log('Enviando datos de la moto:', submitData);

      if (mode === 'create') {
        await motoService.createMoto(submitData);
      } else if (mode === 'edit' && moto) {
        await motoService.updateMoto(moto.id, submitData);
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error completo al guardar moto:', error);
      
      let errorMessage = 'Error al guardar motocicleta';
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            if (error.response.data.includes('<html>')) {
              if (error.response.status === 404) {
                errorMessage = 'API endpoint no encontrado. Verifica que el backend esté funcionando correctamente.';
              } else {
                errorMessage = `Error del servidor (${error.response.status}). Verifica la conexión con el backend.`;
              }
            } else {
              errorMessage = error.response.data;
            }
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else {
            const fieldErrors = [];
            for (const field in error.response.data) {
              if (Array.isArray(error.response.data[field])) {
                fieldErrors.push(`${field}: ${error.response.data[field].join(', ')}`);
              } else if (typeof error.response.data[field] === 'string') {
                fieldErrors.push(`${field}: ${error.response.data[field]}`);
              }
            }
            if (fieldErrors.length > 0) {
              errorMessage = fieldErrors.join('\n');
            }
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setServerError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === 'view';
  const gananciaCalculada = formData.precio_venta && formData.precio_compra 
    ? Number(formData.precio_venta) - Number(formData.precio_compra) 
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' && 'Agregar Nueva Motocicleta'}
            {mode === 'edit' && 'Editar Motocicleta'}
            {mode === 'view' && 'Detalles de la Motocicleta'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Server Error */}
          {serverError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <div className="flex">
                <div>
                  <p className="text-sm font-medium">Error al guardar:</p>
                  <pre className="text-xs mt-1 whitespace-pre-wrap">{serverError}</pre>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información Básica */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Bike className="h-5 w-5 mr-2" />
                Información Básica
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-1">
                    Marca *
                  </label>
                  <input
                    type="text"
                    id="marca"
                    name="marca"
                    value={formData.marca}
                    onChange={handleChange}
                    readOnly={isReadOnly}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.marca ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                  {errors.marca && <p className="text-red-500 text-sm mt-1">{errors.marca}</p>}
                </div>

                <div>
                  <label htmlFor="modelo" className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    id="modelo"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleChange}
                    readOnly={isReadOnly}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.modelo ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                  {errors.modelo && <p className="text-red-500 text-sm mt-1">{errors.modelo}</p>}
                </div>

                <div>
                  <label htmlFor="ano" className="block text-sm font-medium text-gray-700 mb-1">
                    <CalendarDays className="h-4 w-4 inline mr-1" />
                    Año *
                  </label>
                  <input
                    type="number"
                    id="ano"
                    name="ano"
                    value={formData.ano}
                    onChange={handleChange}
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
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    readOnly={isReadOnly}
                    placeholder="Ej: Rojo, Azul, Negro..."
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isReadOnly ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="chasis" className="block text-sm font-medium text-gray-700 mb-1">
                    Chasis
                  </label>
                  <input
                    type="text"
                    id="chasis"
                    name="chasis"
                    value={formData.chasis}
                    onChange={handleChange}
                    readOnly={isReadOnly}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isReadOnly ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Precios */}
              <h3 className="text-lg font-medium text-gray-900 flex items-center mt-6">
                <DollarSign className="h-5 w-5 mr-2" />
                Información de Precios
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="precio_compra" className="block text-sm font-medium text-gray-700 mb-1">
                    Precio de Compra *
                  </label>
                  <input
                    type="number"
                    id="precio_compra"
                    name="precio_compra"
                    value={formData.precio_compra}
                    onChange={handleChange}
                    readOnly={isReadOnly}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.precio_compra ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                  {errors.precio_compra && <p className="text-red-500 text-sm mt-1">{errors.precio_compra}</p>}
                </div>

                <div>
                  <label htmlFor="precio_venta" className="block text-sm font-medium text-gray-700 mb-1">
                    Precio de Venta *
                  </label>
                  <input
                    type="number"
                    id="precio_venta"
                    name="precio_venta"
                    value={formData.precio_venta}
                    onChange={handleChange}
                    readOnly={isReadOnly}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.precio_venta ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                  {errors.precio_venta && <p className="text-red-500 text-sm mt-1">{errors.precio_venta}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ganancia Calculada
                  </label>
                  <div className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-md text-green-700 font-semibold">
                    {formatCurrency(gananciaCalculada)}
                  </div>
                </div>
              </div>

              {/* Stock */}
              <h3 className="text-lg font-medium text-gray-900 flex items-center mt-6">
                <Package className="h-5 w-5 mr-2" />
                Inventario
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cantidad_stock" className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad en Stock *
                  </label>
                  <input
                    type="number"
                    id="cantidad_stock"
                    name="cantidad_stock"
                    value={formData.cantidad_stock}
                    onChange={handleChange}
                    readOnly={isReadOnly}
                    min="0"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.cantidad_stock ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                  {errors.cantidad_stock && <p className="text-red-500 text-sm mt-1">{errors.cantidad_stock}</p>}
                </div>

                <div>
                  <label htmlFor="activa" className="flex items-center">
                    <input
                      type="checkbox"
                      id="activa"
                      name="activa"
                      checked={formData.activa}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Moto Activa</span>
                  </label>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  rows={3}
                  placeholder="Detalles adicionales de la motocicleta..."
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isReadOnly ? 'bg-gray-50' : ''
                  }`}
                />
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
                    {mode === 'create' ? 'Crear Motocicleta' : 'Guardar Cambios'}
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

export default MotoForm;