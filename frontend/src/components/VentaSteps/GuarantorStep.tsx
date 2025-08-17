import React, { useState } from 'react';
import {
  UserCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Building,
  Briefcase,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import type { VentaFormData } from '../NewVentaForm';

interface GuarantorStepProps {
  data: VentaFormData;
  onUpdate: (updates: Partial<VentaFormData>) => void;
  errors: Record<string, string>;
}

interface GuarantorData {
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

const GuarantorStep: React.FC<GuarantorStepProps> = ({ data, onUpdate, errors }) => {
  const [guarantorData, setGuarantorData] = useState<GuarantorData>({
    nombre: data.guarantor?.nombre || '',
    apellido: data.guarantor?.apellido || '',
    cedula: data.guarantor?.cedula || '',
    direccion: data.guarantor?.direccion || '',
    telefono: data.guarantor?.telefono || '',
    celular: data.guarantor?.celular || '',
    email: data.guarantor?.email || '',
    fecha_nacimiento: data.guarantor?.fecha_nacimiento || '',
    estado_civil: data.guarantor?.estado_civil || 'soltero',
    ocupacion: data.guarantor?.ocupacion || '',
    ingresos: data.guarantor?.ingresos?.toString() || '',
    lugar_trabajo: data.guarantor?.lugar_trabajo || '',
    telefono_trabajo: data.guarantor?.telefono_trabajo || '',
    referencias_personales: data.guarantor?.referencias_personales || '',
    parentesco_cliente: data.guarantor?.parentesco_cliente || ''
  });

  const [guarantorErrors, setGuarantorErrors] = useState<Record<string, string>>({});

  const handleNeedsGuarantorChange = (needsGuarantor: boolean) => {
    onUpdate({ 
      needsGuarantor,
      guarantor: needsGuarantor ? guarantorData : null
    });
    
    if (!needsGuarantor) {
      setGuarantorErrors({});
    }
  };

  const validateGuarantor = (): boolean => {
    if (!data.needsGuarantor) return true;

    const errors: Record<string, string> = {};

    if (!guarantorData.nombre.trim()) {
      errors.nombre = 'El nombre del garante es requerido';
    }
    if (!guarantorData.apellido.trim()) {
      errors.apellido = 'El apellido del garante es requerido';
    }
    if (!guarantorData.cedula.trim()) {
      errors.cedula = 'La cédula del garante es requerida';
    }
    if (!guarantorData.direccion.trim()) {
      errors.direccion = 'La dirección del garante es requerida';
    }
    if (!guarantorData.telefono.trim() && !guarantorData.celular.trim()) {
      errors.telefono = 'Debe proporcionar al menos un número de teléfono del garante';
    }
    if (!guarantorData.ocupacion.trim()) {
      errors.ocupacion = 'La ocupación del garante es requerida';
    }
    if (!guarantorData.parentesco_cliente.trim()) {
      errors.parentesco_cliente = 'El parentesco con el cliente es requerido';
    }
    if (guarantorData.email && !/\S+@\S+\.\S+/.test(guarantorData.email)) {
      errors.email = 'El email del garante no es válido';
    }

    setGuarantorErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGuarantorChange = (field: keyof GuarantorData, value: string) => {
    const newData = { ...guarantorData, [field]: value };
    setGuarantorData(newData);
    
    if (data.needsGuarantor) {
      onUpdate({ 
        guarantor: {
          ...newData,
          ingresos: newData.ingresos ? Number(newData.ingresos) : undefined
        }
      });
    }
    
    if (guarantorErrors[field]) {
      setGuarantorErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validar automáticamente cuando cambian los datos
  React.useEffect(() => {
    if (data.needsGuarantor) {
      validateGuarantor();
    }
  }, [guarantorData, data.needsGuarantor]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Información del Garante
        </h3>
        <p className="text-gray-600">
          Indique si esta venta requiere garante y proporcione la información necesaria.
        </p>
      </div>

      {/* Selector de necesidad de garante */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <UserCheck className="h-6 w-6 text-gray-600" />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">¿Esta venta requiere garante?</h4>
            <p className="text-sm text-gray-600">
              Seleccione si es necesario incluir información de un garante para esta venta.
            </p>
          </div>
        </div>
        
        <div className="mt-4 flex space-x-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="needsGuarantor"
              checked={!data.needsGuarantor}
              onChange={() => handleNeedsGuarantorChange(false)}
              className="mr-2 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">No requiere garante</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="needsGuarantor"
              checked={data.needsGuarantor}
              onChange={() => handleNeedsGuarantorChange(true)}
              className="mr-2 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Sí requiere garante</span>
          </label>
        </div>
      </div>

      {/* Mensaje cuando no requiere garante */}
      {!data.needsGuarantor && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
          <span className="text-green-800">
            Esta venta no requiere garante. Puede continuar al siguiente paso.
          </span>
        </div>
      )}

      {/* Formulario de garante */}
      {data.needsGuarantor && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Información del Garante
          </h4>

          {Object.keys(guarantorErrors).length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Por favor complete todos los campos requeridos del garante.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información Personal */}
            <div className="md:col-span-2">
              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Información Personal
              </h5>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={guarantorData.nombre}
                onChange={(e) => handleGuarantorChange('nombre', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  guarantorErrors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nombre del garante"
              />
              {guarantorErrors.nombre && (
                <p className="text-red-500 text-sm mt-1">{guarantorErrors.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                value={guarantorData.apellido}
                onChange={(e) => handleGuarantorChange('apellido', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  guarantorErrors.apellido ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Apellido del garante"
              />
              {guarantorErrors.apellido && (
                <p className="text-red-500 text-sm mt-1">{guarantorErrors.apellido}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cédula *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={guarantorData.cedula}
                  onChange={(e) => handleGuarantorChange('cedula', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    guarantorErrors.cedula ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Número de cédula"
                />
              </div>
              {guarantorErrors.cedula && (
                <p className="text-red-500 text-sm mt-1">{guarantorErrors.cedula}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parentesco con el Cliente *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={guarantorData.parentesco_cliente}
                  onChange={(e) => handleGuarantorChange('parentesco_cliente', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    guarantorErrors.parentesco_cliente ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Padre, Hermano, Amigo, etc."
                />
              </div>
              {guarantorErrors.parentesco_cliente && (
                <p className="text-red-500 text-sm mt-1">{guarantorErrors.parentesco_cliente}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Nacimiento
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  value={guarantorData.fecha_nacimiento}
                  onChange={(e) => handleGuarantorChange('fecha_nacimiento', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado Civil
              </label>
              <select
                value={guarantorData.estado_civil}
                onChange={(e) => handleGuarantorChange('estado_civil', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="soltero">Soltero/a</option>
                <option value="casado">Casado/a</option>
                <option value="divorciado">Divorciado/a</option>
                <option value="viudo">Viudo/a</option>
                <option value="union_libre">Unión Libre</option>
              </select>
            </div>

            {/* Información de Contacto */}
            <div className="md:col-span-2 mt-4">
              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Información de Contacto
              </h5>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={guarantorData.direccion}
                  onChange={(e) => handleGuarantorChange('direccion', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    guarantorErrors.direccion ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Dirección de residencia"
                />
              </div>
              {guarantorErrors.direccion && (
                <p className="text-red-500 text-sm mt-1">{guarantorErrors.direccion}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={guarantorData.telefono}
                  onChange={(e) => handleGuarantorChange('telefono', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    guarantorErrors.telefono ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Teléfono fijo"
                />
              </div>
              {guarantorErrors.telefono && (
                <p className="text-red-500 text-sm mt-1">{guarantorErrors.telefono}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Celular
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={guarantorData.celular}
                  onChange={(e) => handleGuarantorChange('celular', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Número de celular"
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
                  value={guarantorData.email}
                  onChange={(e) => handleGuarantorChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    guarantorErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              {guarantorErrors.email && (
                <p className="text-red-500 text-sm mt-1">{guarantorErrors.email}</p>
              )}
            </div>

            {/* Información Laboral */}
            <div className="md:col-span-2 mt-4">
              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                <Briefcase className="h-4 w-4 mr-2" />
                Información Laboral
              </h5>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ocupación *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={guarantorData.ocupacion}
                  onChange={(e) => handleGuarantorChange('ocupacion', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    guarantorErrors.ocupacion ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ocupación actual"
                />
              </div>
              {guarantorErrors.ocupacion && (
                <p className="text-red-500 text-sm mt-1">{guarantorErrors.ocupacion}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lugar de Trabajo
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={guarantorData.lugar_trabajo}
                  onChange={(e) => handleGuarantorChange('lugar_trabajo', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Empresa o lugar de trabajo"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono de Trabajo
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={guarantorData.telefono_trabajo}
                  onChange={(e) => handleGuarantorChange('telefono_trabajo', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Teléfono del trabajo"
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
                  value={guarantorData.ingresos}
                  onChange={(e) => handleGuarantorChange('ingresos', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referencias Personales
              </label>
              <textarea
                value={guarantorData.referencias_personales}
                onChange={(e) => handleGuarantorChange('referencias_personales', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Nombres y teléfonos de referencias personales..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuarantorStep;