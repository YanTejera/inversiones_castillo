import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Building,
  UserPlus,
  Check,
  X
} from 'lucide-react';
import { clienteService } from '../../services/clienteService';
import type { Cliente } from '../../types';
import type { VentaFormData } from '../NewVentaForm';

interface CustomerStepProps {
  data: VentaFormData;
  onUpdate: (updates: Partial<VentaFormData>) => void;
  errors: Record<string, string>;
}

interface NewCustomerData {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  celular: string;
  email: string;
  direccion: string;
  ciudad: string;
  fecha_nacimiento: string;
  estado_civil: string;
  ocupacion: string;
  ingresos: string;
}

const CustomerStep: React.FC<CustomerStepProps> = ({ data, onUpdate, errors }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerData>({
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
    celular: '',
    email: '',
    direccion: '',
    ciudad: '',
    fecha_nacimiento: '',
    estado_civil: 'soltero',
    ocupacion: '',
    ingresos: ''
  });
  const [customerErrors, setCustomerErrors] = useState<Record<string, string>>({});

  // Buscar clientes existentes
  useEffect(() => {
    const searchClients = async () => {
      if (searchTerm.length >= 3) {
        setLoading(true);
        try {
          const results = await clienteService.searchClientes(searchTerm);
          setSearchResults(results);
        } catch (error) {
          console.error('Error searching clients:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(searchClients, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSelectCustomer = (customer: Cliente) => {
    onUpdate({
      customer,
      isNewCustomer: false
    });
    setSearchTerm('');
    setSearchResults([]);
    setShowNewCustomerForm(false);
  };

  const validateNewCustomer = (): boolean => {
    const errors: Record<string, string> = {};

    if (!newCustomerData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }
    if (!newCustomerData.apellido.trim()) {
      errors.apellido = 'El apellido es requerido';
    }
    if (!newCustomerData.cedula.trim()) {
      errors.cedula = 'La cédula es requerida';
    }
    if (!newCustomerData.telefono.trim() && !newCustomerData.celular.trim()) {
      errors.telefono = 'Debe proporcionar al menos un número de teléfono';
    }
    if (newCustomerData.email && !/\S+@\S+\.\S+/.test(newCustomerData.email)) {
      errors.email = 'El email no es válido';
    }

    setCustomerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCustomer = async () => {
    if (!validateNewCustomer()) {
      return;
    }

    setLoading(true);
    try {
      const customerToCreate = {
        ...newCustomerData,
        ingresos: newCustomerData.ingresos ? Number(newCustomerData.ingresos) : undefined
      };

      const newCustomer = await clienteService.createCliente(customerToCreate);
      
      onUpdate({
        customer: newCustomer,
        isNewCustomer: true
      });
      
      setShowNewCustomerForm(false);
      setNewCustomerData({
        nombre: '',
        apellido: '',
        cedula: '',
        telefono: '',
        celular: '',
        email: '',
        direccion: '',
        ciudad: '',
        fecha_nacimiento: '',
        estado_civil: 'soltero',
        ocupacion: '',
        ingresos: ''
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      setCustomerErrors({ form: 'Error al crear el cliente. Por favor intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewCustomerChange = (field: keyof NewCustomerData, value: string) => {
    setNewCustomerData(prev => ({ ...prev, [field]: value }));
    if (customerErrors[field]) {
      setCustomerErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Información del Cliente
        </h3>
        <p className="text-gray-600">
          Seleccione un cliente existente o registre uno nuevo para continuar con la venta.
        </p>
      </div>

      {/* Cliente seleccionado */}
      {data.customer && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h4 className="font-semibold text-green-900">
                  {data.customer.nombre_completo}
                </h4>
                <p className="text-green-700 text-sm">
                  CC: {data.customer.cedula}
                </p>
                <p className="text-green-700 text-sm">
                  {data.customer.telefono || data.customer.celular}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <button
                onClick={() => onUpdate({ customer: null, isNewCustomer: false })}
                className="p-1 text-red-600 hover:text-red-800"
                title="Cambiar cliente"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Búsqueda de cliente (solo si no hay cliente seleccionado) */}
      {!data.customer && (
        <div className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Cliente Existente
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, cédula o teléfono..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </button>
            </div>
          </div>

          {/* Resultados de búsqueda */}
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
              {searchResults.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {customer.nombre_completo}
                      </h4>
                      <p className="text-sm text-gray-600">
                        CC: {customer.cedula}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-1 space-x-4">
                        {customer.telefono && (
                          <span className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {customer.telefono}
                          </span>
                        )}
                        {customer.celular && (
                          <span className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {customer.celular}
                          </span>
                        )}
                        {customer.email && (
                          <span className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {customer.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-blue-600">
                      <Plus className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchTerm.length >= 3 && !loading && searchResults.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No se encontraron clientes. ¿Desea crear uno nuevo?
            </div>
          )}
        </div>
      )}

      {/* Formulario de nuevo cliente */}
      {showNewCustomerForm && !data.customer && (
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Registrar Nuevo Cliente
          </h4>

          {customerErrors.form && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {customerErrors.form}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información personal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={newCustomerData.nombre}
                onChange={(e) => handleNewCustomerChange('nombre', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  customerErrors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {customerErrors.nombre && (
                <p className="text-red-500 text-sm mt-1">{customerErrors.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                value={newCustomerData.apellido}
                onChange={(e) => handleNewCustomerChange('apellido', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  customerErrors.apellido ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {customerErrors.apellido && (
                <p className="text-red-500 text-sm mt-1">{customerErrors.apellido}</p>
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
                  value={newCustomerData.cedula}
                  onChange={(e) => handleNewCustomerChange('cedula', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    customerErrors.cedula ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {customerErrors.cedula && (
                <p className="text-red-500 text-sm mt-1">{customerErrors.cedula}</p>
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
                  value={newCustomerData.telefono}
                  onChange={(e) => handleNewCustomerChange('telefono', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    customerErrors.telefono ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {customerErrors.telefono && (
                <p className="text-red-500 text-sm mt-1">{customerErrors.telefono}</p>
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
                  value={newCustomerData.celular}
                  onChange={(e) => handleNewCustomerChange('celular', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                  value={newCustomerData.email}
                  onChange={(e) => handleNewCustomerChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    customerErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {customerErrors.email && (
                <p className="text-red-500 text-sm mt-1">{customerErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={newCustomerData.direccion}
                  onChange={(e) => handleNewCustomerChange('direccion', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={newCustomerData.ciudad}
                  onChange={(e) => handleNewCustomerChange('ciudad', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Nacimiento
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  value={newCustomerData.fecha_nacimiento}
                  onChange={(e) => handleNewCustomerChange('fecha_nacimiento', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado Civil
              </label>
              <select
                value={newCustomerData.estado_civil}
                onChange={(e) => handleNewCustomerChange('estado_civil', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="soltero">Soltero/a</option>
                <option value="casado">Casado/a</option>
                <option value="divorciado">Divorciado/a</option>
                <option value="viudo">Viudo/a</option>
                <option value="union_libre">Unión Libre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ocupación
              </label>
              <input
                type="text"
                value={newCustomerData.ocupacion}
                onChange={(e) => handleNewCustomerChange('ocupacion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingresos Mensuales
              </label>
              <input
                type="number"
                value={newCustomerData.ingresos}
                onChange={(e) => handleNewCustomerChange('ingresos', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setShowNewCustomerForm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateCustomer}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Cliente'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerStep;