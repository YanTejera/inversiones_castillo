import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Building2,
  DollarSign,
  Calendar,
  Clock,
  Award,
  FileText,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  UserX,
  TrendingUp,
  BarChart3,
  Download,
  Upload,
  X,
  User
} from 'lucide-react';
import { empleadoService, departamentoService, type EmpleadoList, type EmpleadoStats, type DepartamentoStats } from '../services/empleadoService';
import { useToast } from '../components/Toast';
import { SkeletonCard, SkeletonList, SkeletonStats } from '../components/Skeleton';

// Lazy load components
const EmpleadoForm = lazy(() => import('../components/empleados/EmpleadoForm'));
const EmpleadoDetalle = lazy(() => import('../components/empleados/EmpleadoDetalle'));
const NominaManager = lazy(() => import('../components/empleados/NominaManager'));
const SolicitudesManager = lazy(() => import('../components/empleados/SolicitudesManager'));
const ReportesEmpleados = lazy(() => import('../components/empleados/ReportesEmpleados'));

// Import AsistenciaTracker directly to avoid dynamic import issues
import AsistenciaTracker from '../components/empleados/AsistenciaTracker';

const Empleados: React.FC = () => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();
  const [empleados, setEmpleados] = useState<EmpleadoList[]>([]);
  const [stats, setStats] = useState<EmpleadoStats | null>(null);
  const [departamentosStats, setDepartamentosStats] = useState<DepartamentoStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterDepartamento, setFilterDepartamento] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'empleados' | 'formulario' | 'nominas' | 'asistencia' | 'solicitudes' | 'reportes'>('empleados');
  
  // Modal states (keeping only detalle modal)
  const [showDetalle, setShowDetalle] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<EmpleadoList | null>(null);
  const [editingEmpleado, setEditingEmpleado] = useState<number | null>(null);
  const [deletingEmpleado, setDeletingEmpleado] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [currentPage, searchTerm, filterEstado, filterDepartamento, viewMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (viewMode === 'empleados') {
        await Promise.all([
          loadEmpleados(),
          loadStats(),
          loadDepartamentosStats()
        ]);
      } else {
        await loadEmpleados();
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadEmpleados = async () => {
    try {
      const params: any = {
        page: currentPage,
        search: searchTerm || undefined,
        estado: filterEstado !== 'all' ? filterEstado : undefined,
        posicion__departamento: filterDepartamento !== 'all' ? filterDepartamento : undefined
      };

      const response = await empleadoService.getEmpleados(params);
      setEmpleados(response.results);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err) {
      console.error('Error loading empleados:', err);
      setError('Error al cargar empleados');
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await empleadoService.getEstadisticas();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadDepartamentosStats = async () => {
    try {
      const deptStats = await empleadoService.getEstadisticasPorDepartamento();
      setDepartamentosStats(deptStats);
    } catch (err) {
      console.error('Error loading departamento stats:', err);
    }
  };

  const handleDelete = async (empleado: EmpleadoList) => {
    if (window.confirm(`¿Estás seguro de eliminar al empleado ${empleado.nombre_completo}?`)) {
      setDeletingEmpleado(empleado.id);
      try {
        await empleadoService.deleteEmpleado(empleado.id);
        loadEmpleados();
        success(`Empleado ${empleado.nombre_completo} eliminado correctamente`);
      } catch (err) {
        showError('Error al eliminar empleado');
        console.error('Error deleting empleado:', err);
      } finally {
        setDeletingEmpleado(null);
      }
    }
  };

  const handleFormSuccess = () => {
    setViewMode('empleados');
    setEditingEmpleado(null);
    loadData();
    success(editingEmpleado ? 'Empleado actualizado correctamente' : 'Empleado creado correctamente');
  };

  const handleVerDetalle = (empleado: EmpleadoList) => {
    setSelectedEmpleado(empleado);
    setShowDetalle(true);
  };

  const handleEdit = (empleado: EmpleadoList) => {
    setEditingEmpleado(empleado.id);
    setViewMode('formulario');
  };

  const handleNuevoEmpleado = () => {
    setEditingEmpleado(null);
    setViewMode('formulario');
  };

  const handleCancelarFormulario = () => {
    setEditingEmpleado(null);
    setViewMode('empleados');
  };

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'inactivo':
        return 'bg-gray-100 text-gray-800';
      case 'suspendido':
        return 'bg-red-100 text-red-800';
      case 'vacaciones':
        return 'bg-blue-100 text-blue-800';
      case 'licencia':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminado':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <UserCheck className="h-4 w-4" />;
      case 'inactivo':
      case 'terminado':
        return <UserX className="h-4 w-4" />;
      case 'suspendido':
        return <AlertTriangle className="h-4 w-4" />;
      case 'vacaciones':
        return <Calendar className="h-4 w-4" />;
      case 'licencia':
        return <Clock className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatEstadoLabel = (estado: string) => {
    const labels: { [key: string]: string } = {
      'activo': 'Activo',
      'inactivo': 'Inactivo',
      'suspendido': 'Suspendido',
      'vacaciones': 'En Vacaciones',
      'licencia': 'En Licencia',
      'terminado': 'Terminado'
    };
    return labels[estado] || estado;
  };

  if (loading && empleados.length === 0) {
    return (
      <div>
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Stats skeleton */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SkeletonStats />
            <SkeletonStats />
            <SkeletonStats />
            <SkeletonStats />
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-4">
          <SkeletonList />
          <SkeletonList />
          <SkeletonList />
        </div>
      </div>
    );
  }

  return (
    <div className="page-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Users className="h-8 w-8 mr-3 text-blue-600" />
              Gestión de Empleados
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Administra empleados, nóminas, asistencia y evaluaciones
            </p>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === 'empleados' && (
              <button
                onClick={handleNuevoEmpleado}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Nuevo Empleado
              </button>
            )}
            {viewMode === 'formulario' && (
              <button
                onClick={handleCancelarFormulario}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm font-medium"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards - Solo en vista empleados */}
      {viewMode === 'empleados' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">Total Empleados</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total_empleados}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-900">Activos</p>
                <p className="text-2xl font-bold text-green-700">{stats.empleados_activos}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Nuevos este Mes</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.empleados_nuevos_mes}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-purple-900">Gasto Nómina</p>
                <p className="text-2xl font-bold text-purple-700">{formatCurrency(stats.gasto_nomina_mes)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setViewMode('empleados')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'empleados'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Empleados
              </div>
            </button>
            {(viewMode === 'formulario' || editingEmpleado) && (
              <button
                onClick={() => setViewMode('formulario')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  viewMode === 'formulario'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  {editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
                </div>
              </button>
            )}
            <button
              onClick={() => setViewMode('nominas')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'nominas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Nóminas
              </div>
            </button>
            <button
              onClick={() => setViewMode('asistencia')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'asistencia'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Asistencia
              </div>
            </button>
            <button
              onClick={() => setViewMode('solicitudes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'solicitudes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Solicitudes
              </div>
            </button>
            <button
              onClick={() => setViewMode('reportes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'reportes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Reportes
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Filtros y búsqueda - Solo para empleados */}
      {viewMode === 'empleados' && (
        <div className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar empleado
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nombre, cédula, email..."
                  className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Todos los estados</option>
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
                Departamento
              </label>
              <select
                value={filterDepartamento}
                onChange={(e) => setFilterDepartamento(e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Todos los departamentos</option>
                {departamentosStats.map(dept => (
                  <option key={dept.departamento} value={dept.departamento}>
                    {dept.departamento}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterEstado('all');
                  setFilterDepartamento('all');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Content */}
      {viewMode === 'formulario' ? (
        /* Vista de Formulario */
        <div className="formulario-section">
          <Suspense fallback={
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
                <div className="animate-pulse">
                  <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="h-20 bg-gray-200 rounded"></div>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          }>
            <EmpleadoForm
              empleadoId={editingEmpleado}
              onClose={handleCancelarFormulario}
              onSuccess={handleFormSuccess}
              isModal={false}
            />
          </Suspense>
        </div>
      ) : viewMode === 'empleados' ? (
        /* Lista de Empleados */
        <div className="space-y-6">
          {/* Lista de empleados */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Salario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha Ingreso
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {empleados.map((empleado) => (
                    <tr key={empleado.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {empleado.foto ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={empleado.foto}
                                alt={empleado.nombre_completo}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <Users className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {empleado.nombre_completo}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              #{empleado.numero_empleado}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{empleado.posicion_titulo}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{empleado.departamento_nombre}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadgeClass(empleado.estado)}`}>
                          {getEstadoIcon(empleado.estado)}
                          <span className="ml-1">{formatEstadoLabel(empleado.estado)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(empleado.salario_base)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(empleado.fecha_ingreso).toLocaleDateString('es-DO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleVerDetalle(empleado)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(empleado)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(empleado)}
                            disabled={deletingEmpleado === empleado.id}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                            title="Eliminar"
                          >
                            {deletingEmpleado === empleado.id ? (
                              <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {empleados.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No hay empleados
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || filterEstado !== 'all' || filterDepartamento !== 'all'
                  ? 'No se encontraron empleados con los filtros aplicados.'
                  : 'Comienza agregando tu primer empleado.'
                }
              </p>
              {!searchTerm && filterEstado === 'all' && filterDepartamento === 'all' && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Empleado
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : viewMode === 'nominas' ? (
        /* Vista de Nóminas */
        <div className="nominas-section">
          <Suspense fallback={
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
                <div className="animate-pulse">
                  <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }>
            <NominaManager />
          </Suspense>
        </div>
      ) : viewMode === 'asistencia' ? (
        /* Vista de Asistencia */
        <div className="asistencia-section">
          <AsistenciaTracker />
        </div>
      ) : viewMode === 'solicitudes' ? (
        /* Vista de Solicitudes */
        <div className="solicitudes-section">
          <Suspense fallback={
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
                <div className="animate-pulse">
                  <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }>
            <SolicitudesManager />
          </Suspense>
        </div>
      ) : viewMode === 'reportes' ? (
        /* Vista de Reportes */
        <div className="reportes-section">
          <Suspense fallback={
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
                <div className="animate-pulse">
                  <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-32 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }>
            <ReportesEmpleados />
          </Suspense>
        </div>
      ) : null}

      {/* Modals - Solo el detalle */}
      {showDetalle && selectedEmpleado && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6">
                <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }>
          <EmpleadoDetalle
            empleadoId={selectedEmpleado.id}
            onClose={() => {
              setShowDetalle(false);
              setSelectedEmpleado(null);
            }}
            onEdit={(empleadoId) => {
              setEditingEmpleado(empleadoId);
              setViewMode('formulario');
              setShowDetalle(false);
              setSelectedEmpleado(null);
            }}
          />
        </Suspense>
      )}

      <ToastContainer />
    </div>
  );
};

export default Empleados;