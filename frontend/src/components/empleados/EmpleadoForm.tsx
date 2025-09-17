import React, { useState, useEffect } from 'react';
import { X, Save, User, Briefcase, MapPin, Phone, Mail, Calendar, Hash, Users, Building2, Camera, Upload } from 'lucide-react';
import { 
  empleadoService, 
  departamentoService, 
  posicionService, 
  type Empleado, 
  type Departamento, 
  type Posicion 
} from '../../services/empleadoService';
import { useToast } from '../Toast';

interface EmpleadoFormProps {
  empleadoId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
  isModal?: boolean;
}

interface FormData {
  numero_empleado: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  fecha_nacimiento: string;
  telefono: string;
  telefono_emergencia: string;
  email: string;
  direccion: string;
  posicion: number | '';
  fecha_ingreso: string;
  salario_base: number | '';
  tipo_contrato: string;
  estado: string;
  supervisor: number | '';
  notas: string;
  dias_vacaciones_anuales: number;
  dias_enfermedad_anuales: number;
}

const EmpleadoForm: React.FC<EmpleadoFormProps> = ({ empleadoId, onClose, onSuccess, isModal = true }) => {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!empleadoId);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [selectedDepartamento, setSelectedDepartamento] = useState<number | ''>('');

  const [formData, setFormData] = useState<FormData>({
    numero_empleado: '',
    nombres: '',
    apellidos: '',
    cedula: '',
    fecha_nacimiento: '',
    telefono: '',
    telefono_emergencia: '',
    email: '',
    direccion: '',
    posicion: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    salario_base: '',
    tipo_contrato: 'indefinido',
    estado: 'activo',
    supervisor: '',
    notas: '',
    dias_vacaciones_anuales: 15,
    dias_enfermedad_anuales: 10
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
    if (empleadoId) {
      loadEmpleado();
    }
  }, [empleadoId]);

  const loadInitialData = async () => {
    try {
      const [deptResponse, empleadosResponse] = await Promise.all([
        departamentoService.getDepartamentos({ activo: true }),
        empleadoService.getEmpleados({ estado: 'activo' })
      ]);
      
      setDepartamentos(deptResponse.results);
      setEmpleados(empleadosResponse.results);
    } catch (err) {
      console.error('Error loading initial data:', err);
      showError('Error al cargar datos iniciales');
    }
  };

  const loadEmpleado = async () => {
    if (!empleadoId) return;
    
    setLoadingData(true);
    try {
      const empleado = await empleadoService.getEmpleado(empleadoId);
      
      setFormData({
        numero_empleado: empleado.numero_empleado,
        nombres: empleado.nombres,
        apellidos: empleado.apellidos,
        cedula: empleado.cedula,
        fecha_nacimiento: empleado.fecha_nacimiento,
        telefono: empleado.telefono,
        telefono_emergencia: empleado.telefono_emergencia || '',
        email: empleado.email,
        direccion: empleado.direccion,
        posicion: empleado.posicion,
        fecha_ingreso: empleado.fecha_ingreso,
        salario_base: empleado.salario_base,
        tipo_contrato: empleado.tipo_contrato,
        estado: empleado.estado,
        supervisor: empleado.supervisor || '',
        notas: empleado.notas || '',
        dias_vacaciones_anuales: empleado.dias_vacaciones_anuales,
        dias_enfermedad_anuales: empleado.dias_enfermedad_anuales
      });

      // Cargar foto si existe
      if (empleado.foto) {
        setFotoPreview(empleado.foto);
      }

      // Cargar posiciones del departamento del empleado
      const posicion = await posicionService.getPosicion(empleado.posicion);
      setSelectedDepartamento(posicion.departamento);
      await loadPosicionesByDepartamento(posicion.departamento);
      
    } catch (err) {
      console.error('Error loading empleado:', err);
      showError('Error al cargar datos del empleado');
    } finally {
      setLoadingData(false);
    }
  };

  const loadPosicionesByDepartamento = async (departamentoId: number) => {
    try {
      const response = await posicionService.getPosiciones({
        departamento: departamentoId,
        activa: true
      });
      setPosiciones(response.results);
    } catch (err) {
      console.error('Error loading posiciones:', err);
      showError('Error al cargar posiciones');
    }
  };

  const handleDepartamentoChange = (departamentoId: number | '') => {
    setSelectedDepartamento(departamentoId);
    setFormData(prev => ({ ...prev, posicion: '' }));
    setPosiciones([]);
    
    if (departamentoId) {
      loadPosicionesByDepartamento(departamentoId);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showError('Solo se permiten archivos de imagen (JPG, PNG, GIF, WEBP)');
        return;
      }
      
      // Validar tamaño (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showError('La imagen no debe superar los 5MB');
        return;
      }
      
      setFoto(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFoto = () => {
    setFoto(null);
    setFotoPreview(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Campos requeridos
    if (!formData.numero_empleado.trim()) {
      newErrors.numero_empleado = 'Número de empleado es requerido';
    }
    if (!formData.nombres.trim()) {
      newErrors.nombres = 'Nombres son requeridos';
    }
    if (!formData.apellidos.trim()) {
      newErrors.apellidos = 'Apellidos son requeridos';
    }
    if (!formData.cedula.trim()) {
      newErrors.cedula = 'Cédula es requerida';
    }
    if (!formData.fecha_nacimiento) {
      newErrors.fecha_nacimiento = 'Fecha de nacimiento es requerida';
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'Teléfono es requerido';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email es requerido';
    }
    if (!formData.direccion.trim()) {
      newErrors.direccion = 'Dirección es requerida';
    }
    if (!formData.posicion) {
      newErrors.posicion = 'Posición es requerida';
    }
    if (!formData.fecha_ingreso) {
      newErrors.fecha_ingreso = 'Fecha de ingreso es requerida';
    }
    if (!formData.salario_base) {
      newErrors.salario_base = 'Salario base es requerido';
    }

    // Validaciones de formato
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email no tiene formato válido';
    }

    // Validaciones de números
    if (formData.salario_base && Number(formData.salario_base) <= 0) {
      newErrors.salario_base = 'Salario debe ser mayor a 0';
    }

    // Validaciones de fechas
    if (formData.fecha_nacimiento) {
      const birthDate = new Date(formData.fecha_nacimiento);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        newErrors.fecha_nacimiento = 'El empleado debe ser mayor de edad';
      }
    }

    if (formData.fecha_ingreso) {
      const ingresoDate = new Date(formData.fecha_ingreso);
      const today = new Date();
      if (ingresoDate > today) {
        newErrors.fecha_ingreso = 'La fecha de ingreso no puede ser futura';
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
    try {
      // Crear FormData para incluir la foto
      const submitFormData = new FormData();
      
      // Agregar todos los campos del formulario
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (key === 'salario_base' || key === 'posicion') {
            submitFormData.append(key, String(Number(value)));
          } else if (key === 'supervisor' && value) {
            submitFormData.append(key, String(Number(value)));
          } else {
            submitFormData.append(key, String(value));
          }
        }
      });

      // Agregar foto si existe
      if (foto) {
        submitFormData.append('foto', foto);
        console.log('🖼️ DEBUG: Enviando foto:', foto.name, 'Tamaño:', foto.size);
      } else {
        console.log('⚠️ DEBUG: No hay foto para enviar');
      }

      // Debug: Mostrar contenido del FormData
      console.log('📤 DEBUG: Contenido del FormData:');
      for (let [key, value] of submitFormData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      if (empleadoId) {
        const result = await empleadoService.updateEmpleado(empleadoId, submitFormData);
        console.log('✅ DEBUG: Respuesta del servidor (update):', result);
        console.log('🖼️ DEBUG: Foto en respuesta:', result.foto);
        success('Empleado actualizado correctamente');
      } else {
        const result = await empleadoService.createEmpleado(submitFormData);
        console.log('✅ DEBUG: Respuesta del servidor (create):', result);
        console.log('🖼️ DEBUG: Foto en respuesta:', result.foto);
        success('Empleado creado correctamente');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving empleado:', err);
      
      // Handle validation errors from backend
      if (err.response?.data) {
        const backendErrors: Record<string, string> = {};
        Object.entries(err.response.data).forEach(([key, value]: [string, any]) => {
          if (Array.isArray(value)) {
            backendErrors[key] = value[0];
          } else {
            backendErrors[key] = value;
          }
        });
        setErrors(backendErrors);
      }
      
      showError('Error al guardar empleado');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    const loadingContent = (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando datos del empleado...</span>
      </div>
    );

    if (isModal) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">{loadingContent}</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border">
          <div className="p-6">{loadingContent}</div>
        </div>
      );
    }
  }

  const formContent = (
    <>
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <User className="h-6 w-6 mr-2 text-blue-600" />
          {empleadoId ? 'Editar Empleado' : 'Nuevo Empleado'}
        </h2>
        {isModal && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      
      <div className={isModal ? "overflow-y-auto max-h-[calc(90vh-80px)]" : "overflow-y-auto"}>
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Información Personal */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Información Personal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Hash className="h-4 w-4 inline mr-1" />
                    Número de Empleado *
                  </label>
                  <input
                    type="text"
                    value={formData.numero_empleado}
                    onChange={(e) => handleInputChange('numero_empleado', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.numero_empleado ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="EMP001"
                  />
                  {errors.numero_empleado && (
                    <p className="text-red-500 text-xs mt-1">{errors.numero_empleado}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cédula *
                  </label>
                  <input
                    type="text"
                    value={formData.cedula}
                    onChange={(e) => handleInputChange('cedula', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.cedula ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="000-0000000-0"
                  />
                  {errors.cedula && (
                    <p className="text-red-500 text-xs mt-1">{errors.cedula}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => handleInputChange('nombres', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.nombres ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Juan Carlos"
                  />
                  {errors.nombres && (
                    <p className="text-red-500 text-xs mt-1">{errors.nombres}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => handleInputChange('apellidos', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.apellidos ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Pérez González"
                  />
                  {errors.apellidos && (
                    <p className="text-red-500 text-xs mt-1">{errors.apellidos}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.fecha_nacimiento ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.fecha_nacimiento && (
                    <p className="text-red-500 text-xs mt-1">{errors.fecha_nacimiento}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="juan.perez@empresa.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.telefono ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="(809) 123-4567"
                  />
                  {errors.telefono && (
                    <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Teléfono de Emergencia
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono_emergencia}
                    onChange={(e) => handleInputChange('telefono_emergencia', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="(809) 987-6543"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Dirección *
                </label>
                <textarea
                  value={formData.direccion}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.direccion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Calle Principal #123, Sector Los Jardines, Santo Domingo"
                />
                {errors.direccion && (
                  <p className="text-red-500 text-xs mt-1">{errors.direccion}</p>
                )}
              </div>

              {/* Foto del empleado */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Camera className="h-4 w-4 inline mr-1" />
                  Foto del Empleado
                </label>
                <div className="flex items-center space-x-4">
                  {fotoPreview ? (
                    <div className="relative">
                      <img
                        src={fotoPreview}
                        alt="Preview"
                        className="h-24 w-24 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveFoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="foto-upload"
                      accept="image/*"
                      onChange={handleFotoChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="foto-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {fotoPreview ? 'Cambiar Foto' : 'Subir Foto'}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      JPG, PNG, GIF hasta 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información Laboral */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-green-600" />
                Información Laboral
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Building2 className="h-4 w-4 inline mr-1" />
                    Departamento *
                  </label>
                  <select
                    value={selectedDepartamento}
                    onChange={(e) => handleDepartamentoChange(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Seleccionar departamento</option>
                    {departamentos.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Posición *
                  </label>
                  <select
                    value={formData.posicion}
                    onChange={(e) => handleInputChange('posicion', e.target.value ? Number(e.target.value) : '')}
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.posicion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={!selectedDepartamento}
                  >
                    <option value="">Seleccionar posición</option>
                    {posiciones.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.titulo}
                      </option>
                    ))}
                  </select>
                  {errors.posicion && (
                    <p className="text-red-500 text-xs mt-1">{errors.posicion}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Fecha de Ingreso *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_ingreso}
                    onChange={(e) => handleInputChange('fecha_ingreso', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.fecha_ingreso ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.fecha_ingreso && (
                    <p className="text-red-500 text-xs mt-1">{errors.fecha_ingreso}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Salario Base (RD$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salario_base}
                    onChange={(e) => handleInputChange('salario_base', e.target.value ? parseFloat(e.target.value) : '')}
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.salario_base ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="35000"
                  />
                  {errors.salario_base && (
                    <p className="text-red-500 text-xs mt-1">{errors.salario_base}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Contrato
                  </label>
                  <select
                    value={formData.tipo_contrato}
                    onChange={(e) => handleInputChange('tipo_contrato', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="indefinido">Indefinido</option>
                    <option value="temporal">Temporal</option>
                    <option value="medio_tiempo">Medio Tiempo</option>
                    <option value="por_horas">Por Horas</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="suspendido">Suspendido</option>
                    <option value="vacaciones">En Vacaciones</option>
                    <option value="licencia">En Licencia</option>
                    <option value="terminado">Terminado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Users className="h-4 w-4 inline mr-1" />
                    Supervisor
                  </label>
                  <select
                    value={formData.supervisor}
                    onChange={(e) => handleInputChange('supervisor', e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Sin supervisor</option>
                    {empleados.filter(emp => emp.id !== empleadoId).map((empleado) => (
                      <option key={empleado.id} value={empleado.id}>
                        {empleado.nombre_completo} - {empleado.posicion_titulo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Días de Vacaciones Anuales
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={formData.dias_vacaciones_anuales}
                    onChange={(e) => handleInputChange('dias_vacaciones_anuales', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Días de Enfermedad Anuales
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={formData.dias_enfermedad_anuales}
                    onChange={(e) => handleInputChange('dias_enfermedad_anuales', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas Adicionales
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => handleInputChange('notas', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Información adicional sobre el empleado..."
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Guardando...' : (empleadoId ? 'Actualizar' : 'Crear')} Empleado
              </button>
            </div>
          </form>
        </div>
    </>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {formContent}
        </div>
      </div>
    );
  } else {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border">
        {formContent}
      </div>
    );
  }
};

export default EmpleadoForm;