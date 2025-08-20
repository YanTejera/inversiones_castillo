import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  BarChart3,
  Activity,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { proveedorService } from '../services/proveedorService';
import { useWindowSize } from '../hooks/useWindowSize';
import MobileTable from './MobileTable';

interface ProveedorListItem {
  id: number;
  nombre_completo: string;
  tipo_proveedor: string;
  ciudad: string;
  pais: string;
  contacto_principal: string;
  telefono_principal: string;
  email: string;
  estado: string;
  esta_activo: boolean;
  total_motocicletas: number;
  fecha_creacion: string;
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

const ProveedoresList: React.FC = () => {
  const [proveedores, setProveedores] = useState<ProveedorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    estado: '',
    tipo_proveedor: '',
    activo: undefined as boolean | undefined
  });
  const [showFilters, setShowFilters] = useState(false);
  const { isMobile } = useWindowSize();

  const loadProveedores = async () => {
    try {
      setLoading(true);
      const response = await proveedorService.getProveedores({
        search: searchTerm || undefined,
        estado: filters.estado || undefined,
        tipo_proveedor: filters.tipo_proveedor || undefined,
        activo: filters.activo,
        ordering: 'nombre'
      });
      setProveedores(response.results);
    } catch (err) {
      setError('Error al cargar proveedores');
      console.error('Error loading proveedores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProveedores();
  }, [searchTerm, filters]);

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este proveedor?')) {
      try {
        await proveedorService.deleteProveedor(id);
        await loadProveedores();
      } catch (err) {
        setError('Error al eliminar proveedor');
        console.error('Error deleting proveedor:', err);
      }
    }
  };

  const getEstadoIcon = (estado: string, activo: boolean) => {
    if (activo) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (estado === 'suspendido') {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getEstadoColor = (estado: string, activo: boolean) => {
    if (activo) return 'text-green-700 bg-green-50';
    if (estado === 'suspendido') return 'text-yellow-700 bg-yellow-50';
    return 'text-red-700 bg-red-50';
  };

  const clearFilters = () => {
    setFilters({
      estado: '',
      tipo_proveedor: '',
      activo: undefined
    });
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const columns = [
    {
      key: 'nombre_completo',
      label: 'Proveedor',
      render: (proveedor: ProveedorListItem) => (
        <div>
          <div className="font-medium text-gray-900">{proveedor.nombre_completo}</div>
          <div className="text-sm text-gray-500 flex items-center">
            <Building className="h-4 w-4 mr-1" />
            {proveedor.tipo_proveedor}
          </div>
        </div>
      )
    },
    {
      key: 'contacto',
      label: 'Contacto',
      render: (proveedor: ProveedorListItem) => (
        <div>
          <div className="text-sm text-gray-900">{proveedor.contacto_principal}</div>
          <div className="text-xs text-gray-500 flex items-center">
            <Phone className="h-3 w-3 mr-1" />
            {proveedor.telefono_principal}
          </div>
          {proveedor.email && (
            <div className="text-xs text-gray-500 flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              {proveedor.email}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'ubicacion',
      label: 'Ubicación',
      render: (proveedor: ProveedorListItem) => (
        <div className="text-sm text-gray-900 flex items-center">
          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
          <div>
            <div>{proveedor.ciudad}</div>
            <div className="text-xs text-gray-500">{proveedor.pais}</div>
          </div>
        </div>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (proveedor: ProveedorListItem) => (
        <div className="flex items-center">
          {getEstadoIcon(proveedor.estado, proveedor.esta_activo)}
          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(proveedor.estado, proveedor.esta_activo)}`}>
            {proveedor.esta_activo ? 'Activo' : proveedor.estado === 'suspendido' ? 'Suspendido' : 'Inactivo'}
          </span>
        </div>
      )
    },
    {
      key: 'motocicletas',
      label: 'Motocicletas',
      render: (proveedor: ProveedorListItem) => (
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{proveedor.total_motocicletas}</div>
          <div className="text-xs text-gray-500">Suministradas</div>
        </div>
      )
    }
  ];

  const actions = [
    {
      icon: Eye,
      label: 'Ver detalles',
      onClick: (proveedor: ProveedorListItem) => window.location.href = `/proveedores/${proveedor.id}`,
      color: 'text-blue-600 hover:text-blue-900'
    },
    {
      icon: Edit,
      label: 'Editar',
      onClick: (proveedor: ProveedorListItem) => window.location.href = `/proveedores/${proveedor.id}/editar`,
      color: 'text-indigo-600 hover:text-indigo-900'
    },
    {
      icon: Trash2,
      label: 'Eliminar',
      onClick: (proveedor: ProveedorListItem) => handleDelete(proveedor.id),
      color: 'text-red-600 hover:text-red-900'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Proveedores</h1>
          <p className="text-gray-600 mt-1">Administra la información de tus proveedores de motocicletas</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            to="/proveedores/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Activity className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
          <Link
            to="/proveedores/reportes"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Reportes
          </Link>
          <Link
            to="/proveedores/nuevo"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar proveedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>
            
            {(filters.estado || filters.tipo_proveedor || filters.activo !== undefined) && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-900"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {getEstados().map(estado => (
                  <option key={estado.value} value={estado.value}>{estado.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Proveedor</label>
              <select
                value={filters.tipo_proveedor}
                onChange={(e) => setFilters({ ...filters, tipo_proveedor: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {getTiposProveedor().map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Actividad</label>
              <select
                value={filters.activo === undefined ? '' : filters.activo.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters({ 
                    ...filters, 
                    activo: value === '' ? undefined : value === 'true'
                  });
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="true">Solo Activos</option>
                <option value="false">Solo Inactivos</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        {proveedores.length === 0 ? (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proveedores</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza agregando un nuevo proveedor.
            </p>
            <div className="mt-6">
              <Link
                to="/proveedores/nuevo"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proveedor
              </Link>
            </div>
          </div>
        ) : isMobile ? (
          <MobileTable
            data={proveedores}
            columns={columns}
            actions={actions}
            keyExtractor={(proveedor) => proveedor.id.toString()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proveedores.map((proveedor) => (
                  <tr key={proveedor.id} className="hover:bg-gray-50">
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                        {column.render(proveedor)}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {actions.map((action, index) => {
                          const Icon = action.icon;
                          return (
                            <button
                              key={index}
                              onClick={() => action.onClick(proveedor)}
                              className={`${action.color} hover:scale-110 transition-transform`}
                              title={action.label}
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {proveedores.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-blue-600">
                <span className="font-medium">{proveedores.length}</span> proveedores encontrados
              </div>
              <div className="text-sm text-blue-600">
                <span className="font-medium">{proveedores.filter(p => p.esta_activo).length}</span> activos
              </div>
              <div className="text-sm text-blue-600">
                <span className="font-medium">{proveedores.reduce((sum, p) => sum + p.total_motocicletas, 0)}</span> motocicletas suministradas
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProveedoresList;