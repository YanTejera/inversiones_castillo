import React, { useState } from 'react';
import { 
  X, 
  Save, 
  User,
  Phone,
  MapPin,
  CreditCard,
  AlertTriangle,
  Mail,
  Calendar,
  Briefcase,
  DollarSign,
  Plus,
  FileText,
  Upload,
  Trash2
} from 'lucide-react';

interface Fiador {
  id?: number;
  nombre: string;
  apellido: string;
  cedula: string;
  direccion: string;
  telefono?: string;
  celular?: string;
  email?: string;
  fecha_nacimiento?: string;
  estado_civil?: string;
  ocupacion?: string;
  ingresos?: number;
  lugar_trabajo?: string;
  telefono_trabajo?: string;
  referencias_personales?: string;
  parentesco_cliente?: string;
  cliente: number;
}

interface FiadorFormProps {
  fiador?: Fiador | null;
  clienteId: number;
  clienteNombre: string;
  onClose: () => void;
  onSave: (fiador: Partial<Fiador>, documentos?: DocumentoData[]) => Promise<void>;
  mode: 'create' | 'edit' | 'view';
}

interface DocumentoData {
  tipo_documento: string;
  descripcion: string;
  archivo?: File;
}

interface FormData {
  nombre: string;
  apellido: string;
  cedula: string;
  direccion: string;
  telefono: string;
  celular: string;
  email: string;
  fecha_nacimiento: string;
  estado_civil: string;
  ocupacion: string;
  ingresos: string;
  lugar_trabajo: string;
  telefono_trabajo: string;
  referencias_personales: string;
  parentesco_cliente: string;
}

const tiposDocumento = [
  { value: 'cedula', label: 'Cédula' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'licencia_conducir', label: 'Licencia de Conducir' },
  { value: 'prueba_direccion', label: 'Prueba de Dirección' },
];

const estadosCiviles = [
  'Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre'
];

const parentescos = [
  'Padre/Madre', 'Hijo/a', 'Hermano/a', 'Esposo/a', 'Tío/a', 'Primo/a', 'Amigo/a', 'Vecino/a', 'Compañero/a de trabajo', 'Otro'
];

const FiadorFormMejorado: React.FC<FiadorFormProps> = ({ 
  fiador, 
  clienteId, 
  clienteNombre, 
  onClose, 
  onSave, 
  mode 
}) => {
  const [formData, setFormData] = useState<FormData>({
    nombre: fiador?.nombre || '',
    apellido: fiador?.apellido || '',
    cedula: fiador?.cedula || '',
    direccion: fiador?.direccion || '',
    telefono: fiador?.telefono || '',
    celular: fiador?.celular || '',
    email: fiador?.email || '',
    fecha_nacimiento: fiador?.fecha_nacimiento || '',
    estado_civil: fiador?.estado_civil || '',
    ocupacion: fiador?.ocupacion || '',
    ingresos: fiador?.ingresos?.toString() || '',
    lugar_trabajo: fiador?.lugar_trabajo || '',
    telefono_trabajo: fiador?.telefono_trabajo || '',
    referencias_personales: fiador?.referencias_personales || '',
    parentesco_cliente: fiador?.parentesco_cliente || ''
  });
  
  const [documentos, setDocumentos] = useState<DocumentoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('personal');

  const validateForm = (): boolean => {
    console.log('🔍 Validating form with data:', formData);
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    }

    if (!formData.cedula.trim()) {
      newErrors.cedula = 'La cédula es requerida';
    } else if (formData.cedula.length < 8) {
      newErrors.cedula = 'La cédula debe tener al menos 8 dígitos';
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    }

    // Hacer parentesco_cliente opcional para crear, requerido solo para editar
    if (mode === 'create' || (mode === 'edit' && !formData.parentesco_cliente.trim())) {
      // Solo requerir parentesco si hay valor y está vacío
      if (formData.parentesco_cliente !== undefined && !formData.parentesco_cliente.trim()) {
        newErrors.parentesco_cliente = 'El parentesco con el cliente es requerido';
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no tiene un formato válido';
    }

    if (formData.ingresos && (isNaN(Number(formData.ingresos)) || Number(formData.ingresos) < 0)) {
      newErrors.ingresos = 'Los ingresos deben ser un número válido';
    }

    console.log('Validation errors found:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Validation result:', isValid ? '✅ VALID' : '❌ INVALID');
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== FIADOR FORM SUBMIT ===');
    console.log('Form data:', formData);
    console.log('Fiador prop:', fiador);
    console.log('Cliente ID:', clienteId);
    console.log('Mode:', mode);
    
    if (!validateForm()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('✅ Validation passed');
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        ingresos: formData.ingresos ? Number(formData.ingresos) : undefined,
        cliente: clienteId,
        ...(fiador?.id && { id: fiador.id })
      };

      console.log('Submit data prepared:', submitData);
      console.log('Documentos:', documentos.length > 0 ? documentos : undefined);
      
      console.log('Calling onSave...');
      await onSave(submitData, documentos.length > 0 ? documentos : undefined);
      console.log('✅ onSave completed successfully');
      // onClose() ya se llama desde handleSaveFiador si es exitoso
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      // No cerrar el formulario si hay error - el error ya se muestra en handleSaveFiador
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const addDocumento = () => {
    setDocumentos([...documentos, { tipo_documento: 'cedula', descripcion: '' }]);
  };

  const removeDocumento = (index: number) => {
    setDocumentos(documentos.filter((_, i) => i !== index));
  };

  const updateDocumento = (index: number, field: keyof DocumentoData, value: any) => {
    const newDocumentos = [...documentos];
    newDocumentos[index] = { ...newDocumentos[index], [field]: value };
    setDocumentos(newDocumentos);
  };

  const handleFileChange = (index: number, file: File | null) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo no debe superar los 10MB');
        return;
      }
      updateDocumento(index, 'archivo', file);
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' && 'Registrar Fiador'}
            {mode === 'edit' && 'Editar Fiador'}
            {mode === 'view' && 'Detalles del Fiador'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Client Info */}
        <div className="p-6 bg-blue-50 border-b">
          <div className="flex items-center">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Fiador para el cliente:
              </p>
              <p className="text-lg font-semibold text-blue-800">
                {clienteNombre}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('personal')}
              className={`py-2 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'personal'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Información Personal
            </button>
            <button
              onClick={() => setActiveTab('laboral')}
              className={`py-2 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'laboral'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Información Laboral
            </button>
            {mode === 'create' && (
              <button
                onClick={() => setActiveTab('documentos')}
                className={`py-2 px-4 text-sm font-medium border-b-2 ${
                  activeTab === 'documentos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Documentos ({documentos.length})
              </button>
            )}
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Información Personal */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    readOnly={isReadOnly}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.nombre ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                  {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                    readOnly={isReadOnly}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.apellido ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                  {errors.apellido && <p className="text-red-500 text-sm mt-1">{errors.apellido}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cédula *
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      value={formData.cedula}
                      onChange={(e) => setFormData(prev => ({ ...prev, cedula: e.target.value }))}
                      readOnly={isReadOnly}
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.cedula ? 'border-red-500' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                  {errors.cedula && <p className="text-red-500 text-sm mt-1">{errors.cedula}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parentesco con Cliente *
                  </label>
                  <select
                    value={formData.parentesco_cliente}
                    onChange={(e) => setFormData(prev => ({ ...prev, parentesco_cliente: e.target.value }))}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.parentesco_cliente ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  >
                    <option value="">Seleccionar...</option>
                    {parentescos.map((parentesco) => (
                      <option key={parentesco} value={parentesco}>
                        {parentesco}
                      </option>
                    ))}
                  </select>
                  {errors.parentesco_cliente && <p className="text-red-500 text-sm mt-1">{errors.parentesco_cliente}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                      readOnly={isReadOnly}
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isReadOnly ? 'bg-gray-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Celular
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="tel"
                      value={formData.celular}
                      onChange={(e) => setFormData(prev => ({ ...prev, celular: e.target.value }))}
                      readOnly={isReadOnly}
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isReadOnly ? 'bg-gray-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      readOnly={isReadOnly}
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                      readOnly={isReadOnly}
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isReadOnly ? 'bg-gray-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado Civil
                  </label>
                  <select
                    value={formData.estado_civil}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado_civil: e.target.value }))}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isReadOnly ? 'bg-gray-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar...</option>
                    {estadosCiviles.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección Completa *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                  <textarea
                    value={formData.direccion}
                    onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                    readOnly={isReadOnly}
                    rows={3}
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.direccion ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                </div>
                {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencias Personales
                </label>
                <textarea
                  value={formData.referencias_personales}
                  onChange={(e) => setFormData(prev => ({ ...prev, referencias_personales: e.target.value }))}
                  readOnly={isReadOnly}
                  rows={3}
                  placeholder="Nombres, teléfonos y relación de personas que pueden dar referencias..."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isReadOnly ? 'bg-gray-50' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Información Laboral */}
          {activeTab === 'laboral' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ocupación
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      value={formData.ocupacion}
                      onChange={(e) => setFormData(prev => ({ ...prev, ocupacion: e.target.value }))}
                      readOnly={isReadOnly}
                      placeholder="Ej: Comerciante, Empleado, Independiente..."
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isReadOnly ? 'bg-gray-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ingresos Mensuales
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="number"
                      value={formData.ingresos}
                      onChange={(e) => setFormData(prev => ({ ...prev, ingresos: e.target.value }))}
                      readOnly={isReadOnly}
                      placeholder="0"
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.ingresos ? 'border-red-500' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                  {errors.ingresos && <p className="text-red-500 text-sm mt-1">{errors.ingresos}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lugar de Trabajo
                  </label>
                  <input
                    type="text"
                    value={formData.lugar_trabajo}
                    onChange={(e) => setFormData(prev => ({ ...prev, lugar_trabajo: e.target.value }))}
                    readOnly={isReadOnly}
                    placeholder="Nombre de la empresa o lugar donde trabaja..."
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isReadOnly ? 'bg-gray-50' : 'border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono de Trabajo
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="tel"
                      value={formData.telefono_trabajo}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono_trabajo: e.target.value }))}
                      readOnly={isReadOnly}
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isReadOnly ? 'bg-gray-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documentos */}
          {activeTab === 'documentos' && mode === 'create' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Documentos del Fiador
                </h3>
                <button
                  type="button"
                  onClick={addDocumento}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Documento
                </button>
              </div>

              {documentos.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay documentos agregados</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Puedes agregar documentos del fiador como cédula, comprobantes de ingresos, etc.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documentos.map((documento, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-gray-900">Documento {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeDocumento(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Documento
                          </label>
                          <select
                            value={documento.tipo_documento}
                            onChange={(e) => updateDocumento(index, 'tipo_documento', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {tiposDocumento.map((tipo) => (
                              <option key={tipo.value} value={tipo.value}>
                                {tipo.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Archivo
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                          </div>
                          {documento.archivo && (
                            <p className="text-xs text-green-600 mt-1">
                              Archivo seleccionado: {documento.archivo.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          value={documento.descripcion}
                          onChange={(e) => updateDocumento(index, 'descripcion', e.target.value)}
                          rows={2}
                          placeholder="Descripción del documento..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aviso Legal */}
          {!isReadOnly && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Información Legal
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    El fiador acepta la responsabilidad solidaria por las obligaciones financieras 
                    del cliente titular. Esta información será utilizada únicamente para fines 
                    crediticios y de cobranza.
                  </p>
                </div>
              </div>
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
                    {mode === 'create' ? 'Registrar Fiador' : 'Guardar Cambios'}
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

export default FiadorFormMejorado;