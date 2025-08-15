import React, { useState } from 'react';
import { 
  X, 
  Save, 
  User,
  Phone,
  MapPin,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

interface Fiador {
  id?: number;
  nombre: string;
  apellido: string;
  cedula: string;
  direccion: string;
  telefono?: string;
  cliente: number;
}

interface FiadorFormProps {
  fiador?: Fiador | null;
  clienteId: number;
  clienteNombre: string;
  onClose: () => void;
  onSave: (fiador: Partial<Fiador>) => Promise<void>;
  mode: 'create' | 'edit' | 'view';
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

interface DocumentoFiador {
  tipo_documento: string;
  descripcion: string;
  archivo?: File;
}

const FiadorForm: React.FC<FiadorFormProps> = ({ 
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
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documentos, setDocumentos] = useState<DocumentoFiador[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Campos requeridos
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

    // Validaciones opcionales
    if (formData.telefono && formData.telefono.length < 10) {
      newErrors.telefono = 'El teléfono debe tener al menos 10 dígitos';
    }

    if (formData.celular && formData.celular.length < 10) {
      newErrors.celular = 'El celular debe tener al menos 10 dígitos';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no tiene un formato válido';
    }

    if (formData.ingresos && (isNaN(Number(formData.ingresos)) || Number(formData.ingresos) < 0)) {
      newErrors.ingresos = 'Los ingresos deben ser un número válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addDocumento = () => {
    setDocumentos([...documentos, { tipo_documento: 'cedula', descripcion: '' }]);
  };

  const removeDocumento = (index: number) => {
    setDocumentos(documentos.filter((_, i) => i !== index));
  };

  const updateDocumento = (index: number, field: keyof DocumentoFiador, value: any) => {
    const newDocumentos = [...documentos];
    newDocumentos[index] = { ...newDocumentos[index], [field]: value };
    setDocumentos(newDocumentos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        cliente: clienteId,
        ...(fiador?.id && { id: fiador.id })
      };

      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('Error saving fiador:', error);
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Información Personal */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información Personal
              </h3>
              
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
                    placeholder="Nombre del fiador"
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
                    placeholder="Apellido del fiador"
                  />
                  {errors.apellido && <p className="text-red-500 text-sm mt-1">{errors.apellido}</p>}
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información de Contacto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="Número de cédula"
                    />
                  </div>
                  {errors.cedula && <p className="text-red-500 text-sm mt-1">{errors.cedula}</p>}
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
                        errors.telefono ? 'border-red-500' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-50' : ''}`}
                      placeholder="Número de teléfono"
                    />
                  </div>
                  {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>}
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Dirección
              </h3>
              
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
                    placeholder="Dirección completa del fiador"
                  />
                </div>
                {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>}
              </div>
            </div>

            {/* Aviso Legal */}
            {!isReadOnly && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
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

export default FiadorForm;