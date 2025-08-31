import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Calendar, Briefcase, DollarSign, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { clienteService } from '../services/clienteService';
import { useToast } from './Toast';
import type { Cliente } from '../types';

interface ClienteFormProps {
  mode: 'create' | 'edit' | 'view';
}

interface FormData {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  email: string;
  direccion: string;
  fecha_nacimiento: string;
  estado_civil: string;
  ocupacion: string;
  ingresos: string;
  referencias_personales: string;
}

const ClienteForm: React.FC<ClienteFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { success, error: showError, warning } = useToast();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
    email: '',
    direccion: '',
    fecha_nacimiento: '',
    estado_civil: '',
    ocupacion: '',
    ingresos: '',
    referencias_personales: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (mode === 'edit' && id) {
          const clienteResponse = await clienteService.getCliente(Number(id));
          setCliente(clienteResponse);
          
          // Actualizar formData con los datos del cliente
          setFormData({
            nombre: clienteResponse.nombre || '',
            apellido: clienteResponse.apellido || '',
            cedula: clienteResponse.cedula || '',
            telefono: clienteResponse.telefono || '',
            email: clienteResponse.email || '',
            direccion: clienteResponse.direccion || '',
            fecha_nacimiento: clienteResponse.fecha_nacimiento || '',
            estado_civil: clienteResponse.estado_civil || '',
            ocupacion: clienteResponse.ocupacion || '',
            ingresos: clienteResponse.ingresos?.toString() || '',
            referencias_personales: clienteResponse.referencias_personales || ''
          });
        } else if (mode === 'create') {
          // Reset form for create mode
          setFormData({
            nombre: '',
            apellido: '',
            cedula: '',
            telefono: '',
            email: '',
            direccion: '',
            fecha_nacimiento: '',
            estado_civil: '',
            ocupacion: '',
            ingresos: '',
            referencias_personales: ''
          });
          setErrors({});
          setServerError('');
          setIsDirty(false);
        }
      } catch (error) {
        console.error('Error loading cliente:', error);
        showError('Error al cargar los datos del cliente');
      }
    };
    
    loadInitialData();
  }, [mode, id]);

  useEffect(() => {
    console.log('🔄 ClienteForm useEffect - cliente:', cliente, 'mode:', mode);
    if (cliente && mode !== 'create') {
      setFormData({
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        cedula: cliente.cedula || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        direccion: cliente.direccion || '',
        fecha_nacimiento: cliente.fecha_nacimiento || '',
        estado_civil: cliente.estado_civil || '',
        ocupacion: cliente.ocupacion || '',
        ingresos: cliente.ingresos?.toString() || '',
        referencias_personales: cliente.referencias_personales || ''
      });
    } else if (mode === 'create') {
      // Always reset form for create mode
      console.log('🆕 Resetting form for create mode');
      setFormData({
        nombre: '',
        apellido: '',
        cedula: '',
        telefono: '',
        email: '',
        direccion: '',
        fecha_nacimiento: '',
        estado_civil: '',
        ocupacion: '',
        ingresos: '',
        referencias_personales: ''
      });
      setErrors({});
      setServerError('');
      setIsDirty(false);
    }
  }, [cliente, mode]);

  // Optimized change handler with debouncing for validation
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    }
    if (!formData.cedula.trim()) {
      newErrors.cedula = 'La cédula es requerida';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (formData.ingresos && isNaN(Number(formData.ingresos))) {
      newErrors.ingresos = 'Los ingresos deben ser un número válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    setServerError('');
    
    try {
      const submitData = {
        ...formData,
        ingresos: formData.ingresos ? Number(formData.ingresos) : undefined
      };

      console.log('Enviando datos del cliente:', submitData);

      if (mode === 'create') {
        await clienteService.createCliente(submitData);
        success('Cliente creado exitosamente');
      } else if (mode === 'edit' && cliente) {
        await clienteService.updateCliente(cliente.id, submitData);
        success('Cliente actualizado exitosamente');
      }
      
      success('Cliente guardado exitosamente');
      navigate('/clientes');
    } catch (error: any) {
      console.error('Error completo al guardar cliente:', error);
      
      let errorMessage = 'Error al guardar cliente';
      
      if (error.response?.data) {
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
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setServerError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, mode, cliente, success, showError, validateForm, navigate]);

  const isReadOnly = mode === 'view';

  // Auto-focus en el primer campo al abrir el modal
  useEffect(() => {
    if (mode !== 'view') {
      const timer = setTimeout(() => {
        const firstInput = document.querySelector('#nombre') as HTMLInputElement;
        if (firstInput) firstInput.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  return (
    <div className="page-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/clientes')}
              className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Volver
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {mode === 'create' && 'Crear Nuevo Cliente'}
                {mode === 'edit' && 'Editar Cliente'}
                {mode === 'view' && 'Detalles del Cliente'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {mode === 'create' && 'Agrega un nuevo cliente al sistema'}
                {mode === 'edit' && 'Modifica los datos del cliente'}
                {mode === 'view' && 'Información detallada del cliente'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 md:p-6">

        {/* Form */}
        <form onSubmit={handleSubmit} className="card-mobile">
          {/* Server Error */}
          {serverError && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
              <div className="flex">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Error al guardar:</p>
                  <pre className="text-xs mt-1 whitespace-pre-wrap text-red-600 dark:text-red-400">{serverError}</pre>
                </div>
              </div>
            </div>
          )}
          <div className="form-grid-mobile">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información Personal
              </h3>
              
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className={`input-mobile w-full ${
                    errors.nombre ? 'border-red-500' : ''
                  } ${isReadOnly ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                />
                {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
              </div>

              <div>
                <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.apellido ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } ${isReadOnly ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                />
                {errors.apellido && <p className="text-red-500 text-sm mt-1">{errors.apellido}</p>}
              </div>

              <div>
                <label htmlFor="cedula" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cédula *
                </label>
                <input
                  type="text"
                  id="cedula"
                  name="cedula"
                  value={formData.cedula}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.cedula ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } ${isReadOnly ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                />
                {errors.cedula && <p className="text-red-500 text-sm mt-1">{errors.cedula}</p>}
              </div>

              <div>
                <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  id="fecha_nacimiento"
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className={`input-mobile w-full ${
                    isReadOnly ? 'bg-gray-50 dark:bg-gray-800' : ''
                  }`}
                />
              </div>

              <div>
                <label htmlFor="estado_civil" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado Civil
                </label>
                <select
                  id="estado_civil"
                  name="estado_civil"
                  value={formData.estado_civil}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  className={`select-mobile w-full ${
                    isReadOnly ? 'bg-gray-50 dark:bg-gray-800' : ''
                  }`}
                >
                  <option value="">Seleccionar...</option>
                  <option value="soltero">Soltero(a)</option>
                  <option value="casado">Casado(a)</option>
                  <option value="divorciado">Divorciado(a)</option>
                  <option value="viudo">Viudo(a)</option>
                  <option value="union_libre">Unión Libre</option>
                </select>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Contacto y Ubicación
              </h3>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className={`input-mobile w-full ${
                    isReadOnly ? 'bg-gray-50 dark:bg-gray-800' : ''
                  }`}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } ${isReadOnly ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Dirección
                </label>
                <textarea
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  rows={2}
                  className={`input-mobile w-full ${
                    isReadOnly ? 'bg-gray-50 dark:bg-gray-800' : ''
                  }`}
                />
              </div>

              <div>
                <label htmlFor="ocupacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Briefcase className="h-4 w-4 inline mr-1" />
                  Ocupación
                </label>
                <input
                  type="text"
                  id="ocupacion"
                  name="ocupacion"
                  value={formData.ocupacion}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className={`input-mobile w-full ${
                    isReadOnly ? 'bg-gray-50 dark:bg-gray-800' : ''
                  }`}
                />
              </div>

              <div>
                <label htmlFor="ingresos" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Ingresos Mensuales
                </label>
                <input
                  type="number"
                  id="ingresos"
                  name="ingresos"
                  value={formData.ingresos}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.ingresos ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } ${isReadOnly ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                />
                {errors.ingresos && <p className="text-red-500 text-sm mt-1">{errors.ingresos}</p>}
              </div>
            </div>
          </div>

          {/* Referencias */}
          <div className="mt-6">
            <label htmlFor="referencias_personales" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Referencias Personales
            </label>
            <textarea
              id="referencias_personales"
              name="referencias_personales"
              value={formData.referencias_personales}
              onChange={handleChange}
              readOnly={isReadOnly}
              rows={3}
              placeholder="Nombres, teléfonos y relación con el cliente..."
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                isReadOnly ? 'bg-gray-50 dark:bg-gray-800' : ''
              }`}
            />
          </div>

          {/* Buttons */}
          <div className="form-actions-mobile mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-600 safe-bottom">
            <button
              type="button"
              onClick={() => navigate('/clientes')}
              className="touch-target w-full md:w-auto px-6 py-3 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 btn-press micro-scale"
            >
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={loading}
                className="touch-target w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center btn-press micro-glow"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ClienteForm;