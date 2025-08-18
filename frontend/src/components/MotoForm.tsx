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
  condicion: 'nueva' | 'usada';
  color: string;
  chasis: string;
  precio_compra: string;
  precio_venta: string;
  moneda_compra: 'USD' | 'RD' | 'EUR' | 'COP';
  moneda_venta: 'USD' | 'RD' | 'EUR' | 'COP';
  cantidad_stock: string;
  descripcion: string;
  activa: boolean;
  imagen?: File;
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

const MotoForm: React.FC<MotoFormProps> = ({ moto, mode, onClose, onSave }) => {
  const [formData, setFormData] = useState<FormData>({
    marca: '',
    modelo: '',
    ano: '',
    condicion: 'nueva',
    color: '',
    chasis: '',
    precio_compra: '',
    precio_venta: '',
    moneda_compra: 'USD',
    moneda_venta: 'RD',
    cantidad_stock: '',
    descripcion: '',
    activa: true,
    // Especificaciones técnicas
    cilindraje: '',
    tipo_motor: '',
    potencia: '',
    torque: '',
    combustible: 'Gasolina',
    transmision: '',
    peso: '',
    capacidad_tanque: ''
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
        condicion: moto.condicion || 'nueva',
        color: moto.color || '',
        chasis: moto.chasis || '',
        precio_compra: moto.precio_compra?.toString() || '',
        precio_venta: moto.precio_venta?.toString() || '',
        moneda_compra: moto.moneda_compra || 'USD',
        moneda_venta: moto.moneda_venta || 'RD',
        cantidad_stock: moto.cantidad_stock?.toString() || '',
        descripcion: moto.descripcion || '',
        activa: moto.activa ?? true,
        // Especificaciones técnicas
        cilindraje: moto.cilindraje?.toString() || '',
        tipo_motor: moto.tipo_motor || '',
        potencia: moto.potencia || '',
        torque: moto.torque || '',
        combustible: moto.combustible || 'Gasolina',
        transmision: moto.transmision || '',
        peso: moto.peso?.toString() || '',
        capacidad_tanque: moto.capacidad_tanque?.toString() || ''
      });
      
      if (moto.imagen) {
        setImagePreview(moto.imagen);
      }
    }
  }, [moto]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Debug log para condición
    if (name === 'condicion') {
      console.log('Cambio de condición:', { name, value, type });
    }
    
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
        condicion: formData.condicion,
        color: formData.color,
        chasis: formData.chasis,
        precio_compra: Number(formData.precio_compra),
        precio_venta: Number(formData.precio_venta),
        moneda_compra: formData.moneda_compra,
        moneda_venta: formData.moneda_venta,
        cantidad_stock: Number(formData.cantidad_stock),
        descripcion: formData.descripcion,
        activa: formData.activa,
        imagen: formData.imagen,
        // Especificaciones técnicas
        cilindraje: formData.cilindraje ? Number(formData.cilindraje) : null,
        tipo_motor: formData.tipo_motor || null,
        potencia: formData.potencia || null,
        torque: formData.torque || null,
        combustible: formData.combustible || null,
        transmision: formData.transmision || null,
        peso: formData.peso ? Number(formData.peso) : null,
        capacidad_tanque: formData.capacidad_tanque ? Number(formData.capacidad_tanque) : null
      };

      console.log('Datos a enviar al backend:', submitData);

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

  const getCurrencySymbol = (currency: string) => {
    switch(currency) {
      case 'USD': return '$';
      case 'RD': return 'RD$';
      case 'EUR': return '€';
      case 'COP': return '$';
      default: return '$';
    }
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
                  <label htmlFor="condicion" className="block text-sm font-medium text-gray-700 mb-1">
                    Condición *
                  </label>
                  <select
                    id="condicion"
                    name="condicion"
                    value={formData.condicion}
                    onChange={handleChange}
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

              {/* Especificaciones Técnicas */}
              <h3 className="text-lg font-medium text-gray-900 flex items-center mt-6">
                <Bike className="h-5 w-5 mr-2" />
                Especificaciones Técnicas del Motor
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Precios */}
              <h3 className="text-lg font-medium text-gray-900 flex items-center mt-6">
                <DollarSign className="h-5 w-5 mr-2" />
                Información de Precios
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Precio de Compra */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio de Compra *
                  </label>
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
                      id="precio_compra"
                      name="precio_compra"
                      value={formData.precio_compra}
                      onChange={handleChange}
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
                      {formatCurrencyWithSymbol(Number(formData.precio_compra), formData.moneda_compra)}
                    </p>
                  )}
                  {errors.precio_compra && <p className="text-red-500 text-sm mt-1">{errors.precio_compra}</p>}
                </div>

                {/* Precio de Venta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio de Venta *
                  </label>
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
                      id="precio_venta"
                      name="precio_venta"
                      value={formData.precio_venta}
                      onChange={handleChange}
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
                      {formatCurrencyWithSymbol(Number(formData.precio_venta), formData.moneda_venta)}
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
                      <span>Compra: {formatCurrencyWithSymbol(Number(formData.precio_compra), formData.moneda_compra)}</span>
                      <span className="mx-2">→</span>
                      <span>Venta: {formatCurrencyWithSymbol(Number(formData.precio_venta), formData.moneda_venta)}</span>
                    </div>
                    {formData.moneda_compra === formData.moneda_venta && (
                      <div className="text-green-700 font-semibold mt-1">
                        Ganancia: {formatCurrencyWithSymbol(gananciaCalculada, formData.moneda_venta)}
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