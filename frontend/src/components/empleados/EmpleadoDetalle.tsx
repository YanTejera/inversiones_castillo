import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, User, Mail, Phone, MapPin, Calendar, Briefcase, Building2, 
  CreditCard, Clock, Star, FileText, Users, Hash, Camera, Edit2 
} from 'lucide-react';
import { 
  empleadoService, 
  type Empleado, 
  formatCurrency, 
  formatDate 
} from '../../services/empleadoService';
import { useToast } from '../Toast';

interface EmpleadoDetalleProps {
  empleadoId: number;
  onClose: () => void;
  onEdit: (empleadoId: number) => void;
}

const EmpleadoDetalle: React.FC<EmpleadoDetalleProps> = ({ empleadoId, onClose, onEdit }) => {
  const { error: showError } = useToast();
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmpleado();
  }, [empleadoId]);

  const loadEmpleado = async () => {
    try {
      setLoading(true);
      const data = await empleadoService.getEmpleado(empleadoId);
      setEmpleado(data);
    } catch (err) {
      console.error('Error loading empleado:', err);
      showError('Error al cargar los datos del empleado');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactivo':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'suspendido':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'vacaciones':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'licencia':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'terminado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTipoContratoBadgeClass = (tipo: string) => {
    switch (tipo) {
      case 'indefinido':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'temporal':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medio_tiempo':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'por_horas':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'freelance':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-2 z-[99999]">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border w-[70vw] h-[75vh] overflow-hidden">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (!empleado) {
    return createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-2 z-[99999]">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border max-w-md w-full p-6">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No se pudo cargar la información del empleado
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-2 z-[99999]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border w-[70vw] h-[75vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {empleado.nombre_completo}
            </h2>
            <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getEstadoBadgeClass(empleado.estado)}`}>
              {empleado.estado.charAt(0).toUpperCase() + empleado.estado.slice(1)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(empleado.id)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
            >
              <Edit2 className="h-4 w-4" />
              Editar
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(75vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda - Foto y datos básicos */}
            <div className="lg:col-span-1">
              {/* Foto */}
              <div className="text-center mb-6">
                {empleado.foto ? (
                  <img
                    src={empleado.foto}
                    alt={empleado.nombre_completo}
                    className="w-32 h-32 mx-auto rounded-lg object-cover border-4 border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-32 h-32 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-4 border-gray-200 dark:border-gray-600">
                    <Camera className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {empleado.nombre_completo}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {empleado.posicion_titulo}
                  </p>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Información de Contacto
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4 mr-2" />
                      {empleado.email}
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4 mr-2" />
                      {empleado.telefono}
                    </div>
                    {empleado.telefono_emergencia && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="h-4 w-4 mr-2" />
                        {empleado.telefono_emergencia} <span className="ml-1 text-xs">(Emergencia)</span>
                      </div>
                    )}
                    <div className="flex items-start text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                      <span>{empleado.direccion}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Información detallada */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Personal */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Información Personal
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Número de Empleado:</span>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Hash className="h-3 w-3 mr-1" />
                        {empleado.numero_empleado}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Cédula:</span>
                      <p className="text-gray-600 dark:text-gray-400">{empleado.cedula}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Fecha de Nacimiento:</span>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(empleado.fecha_nacimiento)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información Laboral */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Información Laboral
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Departamento:</span>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Building2 className="h-3 w-3 mr-1" />
                        {empleado.departamento_nombre}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Posición:</span>
                      <p className="text-gray-600 dark:text-gray-400">{empleado.posicion_titulo}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Fecha de Ingreso:</span>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(empleado.fecha_ingreso)}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Antigüedad:</span>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {empleado.antiguedad_anos} años
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información Salarial */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Información Salarial
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Salario Base:</span>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(empleado.salario_base)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Tipo de Contrato:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTipoContratoBadgeClass(empleado.tipo_contrato)}`}>
                        {empleado.tipo_contrato.replace('_', ' ').charAt(0).toUpperCase() + empleado.tipo_contrato.replace('_', ' ').slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información de Beneficios */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <Star className="h-4 w-4 mr-2" />
                    Beneficios
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Vacaciones Anuales:</span>
                      <p className="text-gray-600 dark:text-gray-400">{empleado.dias_vacaciones_anuales} días</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Días Disponibles:</span>
                      <p className="text-gray-600 dark:text-gray-400">{empleado.dias_vacaciones_disponibles} días</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Enfermedad Anual:</span>
                      <p className="text-gray-600 dark:text-gray-400">{empleado.dias_enfermedad_anuales} días</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Disponibles:</span>
                      <p className="text-gray-600 dark:text-gray-400">{empleado.dias_enfermedad_disponibles} días</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supervisor */}
              {empleado.supervisor_nombre && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Supervisor
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{empleado.supervisor_nombre}</p>
                </div>
              )}

              {/* Notas */}
              {empleado.notas && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Notas Adicionales
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {empleado.notas}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EmpleadoDetalle;