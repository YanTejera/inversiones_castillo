import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Building,
  Phone,
  Mail,
  MapPin,
  User,
  CreditCard,
  FileText,
  AlertCircle
} from 'lucide-react';
import { proveedorService } from '../services/proveedorService';
import { useWindowSize } from '../hooks/useWindowSize';

interface Proveedor {
  id?: number;
  nombre: string;
  nombre_comercial?: string;
  tipo_proveedor: 'distribuidor' | 'importador' | 'mayorista' | 'fabricante' | 'particular';
  ruc?: string;
  cedula?: string;
  registro_mercantil?: string;
  telefono?: string;
  telefono2?: string;
  email?: string;
  sitio_web?: string;
  direccion: string;
  ciudad: string;
  provincia?: string;
  pais: string;
  codigo_postal?: string;
  persona_contacto?: string;
  cargo_contacto?: string;
  telefono_contacto?: string;
  email_contacto?: string;
  moneda_preferida: 'USD' | 'RD' | 'EUR' | 'COP';
  terminos_pago?: string;
  limite_credito?: number;
  descuento_general?: number;
  estado: 'activo' | 'inactivo' | 'suspendido';
  fecha_inicio_relacion?: string;
  notas?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  creado_por?: number;
  nombre_completo?: string;
  contacto_principal?: string;
  telefono_principal?: string;
  email_principal?: string;
  esta_activo?: boolean;
  total_compras?: number;
  total_motocicletas?: number;
}

interface ProveedorFormProps {
  mode: 'create' | 'edit';
}

// Métodos utilitarios
const getTiposProveedor = () => [
  { value: 'distribuidor', label: 'Distribuidor Oficial' },
  { value: 'importador', label: 'Importador' },
  { value: 'mayorista', label: 'Mayorista' },
  { value: 'fabricante', label: 'Fabricante' },
  { value: 'particular', label: 'Particular' }
];

const getEstados = () => [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'suspendido', label: 'Suspendido' }
];

const getMonedas = () => [
  { value: 'USD', label: 'Dólares (USD)' },
  { value: 'RD', label: 'Pesos Dominicanos (RD)' },
  { value: 'EUR', label: 'Euros (EUR)' },
  { value: 'COP', label: 'Pesos Colombianos (COP)' }
];

const getPaises = () => [
  'República Dominicana',
  'Colombia',
  'Estados Unidos',
  'España',
  'México',
  'Brasil',
  'Argentina',
  'Otro'
];

const ProveedorForm: React.FC<ProveedorFormProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();
  
  const [formData, setFormData] = useState<Partial<Proveedor>>({
    nombre: '',
    nombre_comercial: '',
    tipo_proveedor: 'distribuidor',
    ruc: '',
    cedula: '',
    registro_mercantil: '',
    telefono: '',
    telefono2: '',
    email: '',
    sitio_web: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    pais: 'República Dominicana',
    codigo_postal: '',
    persona_contacto: '',
    cargo_contacto: '',
    telefono_contacto: '',
    email_contacto: '',
    moneda_preferida: 'USD',
    terminos_pago: '',
    limite_credito: 0,
    descuento_general: 0,
    estado: 'activo',
    fecha_inicio_relacion: '',
    notas: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && id) {
      loadProveedor();
    }
  }, [mode, id]);

  const loadProveedor = async () => {
    try {
      setLoading(true);
      const proveedor = await proveedorService.getProveedor(parseInt(id!));
      setFormData(proveedor);
    } catch (err) {
      setSubmitError('Error al cargar proveedor');
      console.error('Error loading proveedor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.direccion?.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    }

    if (!formData.ciudad?.trim()) {
      newErrors.ciudad = 'La ciudad es requerida';
    }

    if (!formData.ruc?.trim() && !formData.cedula?.trim()) {
      newErrors.documentos = 'Debe proporcionar al menos RUC o cédula';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.email_contacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_contacto)) {
      newErrors.email_contacto = 'Email de contacto inválido';
    }

    if (formData.limite_credito && formData.limite_credito < 0) {
      newErrors.limite_credito = 'El límite de crédito no puede ser negativo';
    }

    if (formData.descuento_general && (formData.descuento_general < 0 || formData.descuento_general > 100)) {
      newErrors.descuento_general = 'El descuento debe estar entre 0 y 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setSubmitError(null);

      if (mode === 'create') {
        await proveedorService.createProveedor(formData as Omit<Proveedor, 'id' | 'fecha_creacion' | 'fecha_actualizacion' | 'creado_por'>);
      } else {
        await proveedorService.updateProveedor(parseInt(id!), formData);
      }

      navigate('/proveedores');
    } catch (err: any) {
      console.error('Error saving proveedor:', err);
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          const errorData = err.response.data;
          if (errorData.non_field_errors) {
            setSubmitError(errorData.non_field_errors[0]);
          } else {
            // Manejar errores de campo específico
            const fieldErrors: Record<string, string> = {};
            Object.keys(errorData).forEach(key => {
              if (Array.isArray(errorData[key])) {
                fieldErrors[key] = errorData[key][0];
              }
            });
            setErrors(fieldErrors);
          }
        } else {
          setSubmitError('Error al guardar proveedor');
        }
      } else {
        setSubmitError('Error de conexión');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && mode === 'edit') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/proveedores')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}
            </h1>
            <p className="text-gray-600">
              {mode === 'create' 
                ? 'Ingresa la información del nuevo proveedor'
                : 'Actualiza la información del proveedor'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-800">{submitError}</span>
        </div>
      )}

      {errors.documentos && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-800">{errors.documentos}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información Básica */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <Building className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Información Básica</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Proveedor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nombre || ''}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nombre legal del proveedor"
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Comercial
              </label>
              <input
                type="text"
                value={formData.nombre_comercial || ''}
                onChange={(e) => handleInputChange('nombre_comercial', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre comercial o marca"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Proveedor <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipo_proveedor || 'distribuidor'}
                onChange={(e) => handleInputChange('tipo_proveedor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {getTiposProveedor().map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={formData.estado || 'activo'}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {getEstados().map(estado => (
                  <option key={estado.value} value={estado.value}>{estado.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Documentos Legales */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <FileText className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Documentos Legales</h3>
            <p className="text-sm text-gray-500 ml-2">(Al menos uno requerido)</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RUC/NIT</label>
              <input
                type="text"
                value={formData.ruc || ''}
                onChange={(e) => handleInputChange('ruc', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Registro Único de Contribuyente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cédula</label>
              <input
                type="text"
                value={formData.cedula || ''}
                onChange={(e) => handleInputChange('cedula', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Número de cédula"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registro Mercantil</label>
              <input
                type="text"
                value={formData.registro_mercantil || ''}
                onChange={(e) => handleInputChange('registro_mercantil', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Número de registro mercantil"
              />
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <Phone className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Información de Contacto</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono Principal</label>
              <input
                type="tel"
                value={formData.telefono || ''}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1-809-555-1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono Alternativo</label>
              <input
                type="tel"
                value={formData.telefono2 || ''}
                onChange={(e) => handleInputChange('telefono2', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1-809-555-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="email@ejemplo.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sitio Web</label>
              <input
                type="url"
                value={formData.sitio_web || ''}
                onChange={(e) => handleInputChange('sitio_web', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://www.ejemplo.com"
              />
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <MapPin className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Dirección</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.direccion || ''}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.direccion ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Dirección completa del proveedor"
              />
              {errors.direccion && (
                <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ciudad || ''}
                  onChange={(e) => handleInputChange('ciudad', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.ciudad ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ciudad"
                />
                {errors.ciudad && (
                  <p className="mt-1 text-sm text-red-600">{errors.ciudad}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provincia/Estado</label>
                <input
                  type="text"
                  value={formData.provincia || ''}
                  onChange={(e) => handleInputChange('provincia', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provincia o estado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">País</label>
                <select
                  value={formData.pais || 'República Dominicana'}
                  onChange={(e) => handleInputChange('pais', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {getPaises().map(pais => (
                    <option key={pais} value={pais}>{pais}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Código Postal</label>
                <input
                  type="text"
                  value={formData.codigo_postal || ''}
                  onChange={(e) => handleInputChange('codigo_postal', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="00000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Persona de Contacto */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Persona de Contacto</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Contacto</label>
              <input
                type="text"
                value={formData.persona_contacto || ''}
                onChange={(e) => handleInputChange('persona_contacto', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre de la persona de contacto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
              <input
                type="text"
                value={formData.cargo_contacto || ''}
                onChange={(e) => handleInputChange('cargo_contacto', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Cargo o posición"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono de Contacto</label>
              <input
                type="tel"
                value={formData.telefono_contacto || ''}
                onChange={(e) => handleInputChange('telefono_contacto', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1-809-555-1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contacto</label>
              <input
                type="email"
                value={formData.email_contacto || ''}
                onChange={(e) => handleInputChange('email_contacto', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email_contacto ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="contacto@ejemplo.com"
              />
              {errors.email_contacto && (
                <p className="mt-1 text-sm text-red-600">{errors.email_contacto}</p>
              )}
            </div>
          </div>
        </div>

        {/* Información Comercial */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Información Comercial</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Moneda Preferida</label>
              <select
                value={formData.moneda_preferida || 'USD'}
                onChange={(e) => handleInputChange('moneda_preferida', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {getMonedas().map(moneda => (
                  <option key={moneda.value} value={moneda.value}>{moneda.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Términos de Pago</label>
              <input
                type="text"
                value={formData.terminos_pago || ''}
                onChange={(e) => handleInputChange('terminos_pago', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 30 días, Contado, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Límite de Crédito</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.limite_credito || ''}
                onChange={(e) => handleInputChange('limite_credito', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.limite_credito ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.limite_credito && (
                <p className="mt-1 text-sm text-red-600">{errors.limite_credito}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descuento General (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.descuento_general || ''}
                onChange={(e) => handleInputChange('descuento_general', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.descuento_general ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.descuento_general && (
                <p className="mt-1 text-sm text-red-600">{errors.descuento_general}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio Relación</label>
              <input
                type="date"
                value={formData.fecha_inicio_relacion || ''}
                onChange={(e) => handleInputChange('fecha_inicio_relacion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas Adicionales</label>
            <textarea
              rows={4}
              value={formData.notas || ''}
              onChange={(e) => handleInputChange('notas', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Información adicional sobre el proveedor..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 bg-white shadow rounded-lg p-6">
          <button
            type="button"
            onClick={() => navigate('/proveedores')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            <Save className="h-4 w-4 mr-2" />
            {mode === 'create' ? 'Crear Proveedor' : 'Actualizar Proveedor'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProveedorForm;