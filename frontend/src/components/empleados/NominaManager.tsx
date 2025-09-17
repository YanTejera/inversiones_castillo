import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Calculator,
  Users,
  AlertCircle,
  TrendingUp,
  Building2,
  FileText,
  CreditCard
} from 'lucide-react';
import { 
  nominaService,
  empleadoService,
  departamentoService,
  type Nomina,
  type EmpleadoList,
  type Departamento,
  formatCurrency 
} from '../../services/empleadoService';
import { useToast } from '../Toast';

interface NominaStats {
  total_nominas: number;
  nominas_pendientes: number;
  nominas_aprobadas: number;
  nominas_pagadas: number;
  gasto_total_mes: number;
  promedio_salario: number;
}

const NominaManager: React.FC = () => {
  const { success, error: showError, warning, info } = useToast();
  const [nominas, setNominas] = useState<Nomina[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoList[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [stats, setStats] = useState<NominaStats>({
    total_nominas: 0,
    nominas_pendientes: 0,
    nominas_aprobadas: 0,
    nominas_pagadas: 0,
    gasto_total_mes: 0,
    promedio_salario: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterMes, setFilterMes] = useState<string>(new Date().getMonth() + 1 + '');
  const [filterAño, setFilterAño] = useState<string>(new Date().getFullYear() + '');
  const [filterEmpleado, setFilterEmpleado] = useState<string>('all');
  
  // Estados del modal/formulario
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingNomina, setEditingNomina] = useState<Nomina | null>(null);
  const [selectedNomina, setSelectedNomina] = useState<Nomina | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [currentPage, filterEstado, filterMes, filterAño, filterEmpleado, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadNominas(),
        loadEmpleados(),
        loadDepartamentos(),
        loadStats()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      showError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadNominas = async () => {
    try {
      const params: any = {
        page: currentPage,
        search: searchTerm || undefined,
        estado: filterEstado !== 'all' ? filterEstado : undefined,
        mes: filterMes !== 'all' ? filterMes : undefined,
        año: filterAño !== 'all' ? filterAño : undefined,
        empleado: filterEmpleado !== 'all' ? filterEmpleado : undefined
      };

      const response = await nominaService.getNominas(params);
      setNominas(response.results);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err) {
      console.error('Error loading nominas:', err);
      showError('Error al cargar nóminas');
    }
  };

  const loadEmpleados = async () => {
    try {
      const response = await empleadoService.getEmpleados({ estado: 'activo' });
      setEmpleados(response.results);
    } catch (err) {
      console.error('Error loading empleados:', err);
    }
  };

  const loadDepartamentos = async () => {
    try {
      const response = await departamentoService.getDepartamentos({ activo: true });
      setDepartamentos(response.results);
    } catch (err) {
      console.error('Error loading departamentos:', err);
    }
  };

  const loadStats = async () => {
    try {
      // Calcular estadísticas basadas en nóminas cargadas
      const currentMonth = parseInt(filterMes);
      const currentYear = parseInt(filterAño);
      
      const allNominas = await nominaService.getNominas({
        mes: currentMonth,
        año: currentYear,
        page_size: 1000 // Obtener todas para estadísticas
      });

      const nominasData = allNominas.results;
      
      const statsData: NominaStats = {
        total_nominas: nominasData.length,
        nominas_pendientes: nominasData.filter(n => ['borrador', 'calculada'].includes(n.estado)).length,
        nominas_aprobadas: nominasData.filter(n => n.estado === 'aprobada').length,
        nominas_pagadas: nominasData.filter(n => n.estado === 'pagada').length,
        gasto_total_mes: nominasData
          .filter(n => ['aprobada', 'pagada'].includes(n.estado))
          .reduce((sum, n) => sum + n.salario_neto, 0),
        promedio_salario: nominasData.length > 0 
          ? nominasData.reduce((sum, n) => sum + n.salario_neto, 0) / nominasData.length 
          : 0
      };

      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleGenerateNominas = async () => {
    if (actionLoading === -1) {
      warning('Ya se está generando nóminas, por favor espere...');
      return;
    }

    try {
      setActionLoading(-1); // Loading genérico
      const año = parseInt(filterAño);
      const mes = parseInt(filterMes);
      
      console.log('Iniciando generación de nóminas para:', { año, mes });
      info(`Generando nóminas para ${getMesesOptions().find(m => m.value === filterMes)?.label} ${año}...`);
      
      // Verificar que tenemos empleados activos
      if (empleados.length === 0) {
        warning('No hay empleados activos para generar nóminas');
        return;
      }
      
      const result = await nominaService.generarNominasMes(año, mes);
      console.log('Resultado de la generación:', result);
      
      if (result && result.nominas_creadas !== undefined) {
        success(`${result.nominas_creadas} nóminas generadas para ${getMesesOptions().find(m => m.value === filterMes)?.label} ${año}`);
      } else if (result && result.message) {
        success(result.message);
      } else {
        success(`Nóminas generadas exitosamente para ${getMesesOptions().find(m => m.value === filterMes)?.label} ${año}`);
      }
      
      // Recargar datos después de generar nóminas
      await loadData();
    } catch (err: any) {
      console.error('Error generating nominas:', err);
      
      let errorMessage = 'Error al generar nóminas';
      
      if (err?.response?.status === 404) {
        errorMessage = 'El endpoint de generación de nóminas no está disponible. Verifique que el servidor esté ejecutándose.';
      } else if (err?.response?.status === 403) {
        errorMessage = 'No tiene permisos para generar nóminas.';
      } else if (err?.response?.status === 400) {
        errorMessage = err?.response?.data?.error || err?.response?.data?.message || 'Datos inválidos para generar nóminas.';
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = `Error de red: ${err.message}`;
      } else if (err?.code === 'NETWORK_ERROR') {
        errorMessage = 'Error de conexión. Verifique que el servidor esté ejecutándose.';
      }
      
      showError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCalculateNomina = async (nomina: Nomina) => {
    try {
      setActionLoading(nomina.id);
      await nominaService.calcular(nomina.id);
      success(`Nómina de ${nomina.empleado_nombre} calculada correctamente`);
      loadData();
    } catch (err) {
      console.error('Error calculating nomina:', err);
      showError('Error al calcular nómina');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveNomina = async (nomina: Nomina) => {
    try {
      setActionLoading(nomina.id);
      await nominaService.aprobar(nomina.id);
      success(`Nómina de ${nomina.empleado_nombre} aprobada correctamente`);
      loadData();
    } catch (err) {
      console.error('Error approving nomina:', err);
      showError('Error al aprobar nómina');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsPaid = async (nomina: Nomina) => {
    try {
      setActionLoading(nomina.id);
      await nominaService.marcarPagada(nomina.id);
      success(`Nómina de ${nomina.empleado_nombre} marcada como pagada`);
      loadData();
    } catch (err) {
      console.error('Error marking as paid:', err);
      showError('Error al marcar como pagada');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetail = (nomina: Nomina) => {
    setSelectedNomina(nomina);
    setShowDetail(true);
  };

  const handleEdit = (nomina: Nomina) => {
    setEditingNomina(nomina);
    setShowForm(true);
  };

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'borrador':
        return 'bg-gray-100 text-gray-800';
      case 'calculada':
        return 'bg-blue-100 text-blue-800';
      case 'aprobada':
        return 'bg-green-100 text-green-800';
      case 'pagada':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'borrador':
        return <Edit className="h-4 w-4" />;
      case 'calculada':
        return <Calculator className="h-4 w-4" />;
      case 'aprobada':
        return <CheckCircle className="h-4 w-4" />;
      case 'pagada':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getMesesOptions = () => {
    const meses = [
      { value: '1', label: 'Enero' },
      { value: '2', label: 'Febrero' },
      { value: '3', label: 'Marzo' },
      { value: '4', label: 'Abril' },
      { value: '5', label: 'Mayo' },
      { value: '6', label: 'Junio' },
      { value: '7', label: 'Julio' },
      { value: '8', label: 'Agosto' },
      { value: '9', label: 'Septiembre' },
      { value: '10', label: 'Octubre' },
      { value: '11', label: 'Noviembre' },
      { value: '12', label: 'Diciembre' }
    ];
    return meses;
  };

  if (loading && nominas.length === 0) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow border p-4">
              <div className="animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
        {/* Table skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Nóminas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_nominas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.nominas_pendientes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pagadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.nominas_pagadas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gasto Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.gasto_total_mes)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controles y filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <DollarSign className="h-6 w-6 text-green-600 mr-2" />
              Gestión de Nóminas
            </h2>
            <button
              onClick={handleGenerateNominas}
              disabled={actionLoading === -1}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-all duration-200"
            >
              {actionLoading === -1 ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Generar Nóminas del Mes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
                placeholder="Nombre del empleado..."
                className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="calculada">Calculada</option>
              <option value="aprobada">Aprobada</option>
              <option value="pagada">Pagada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mes
            </label>
            <select
              value={filterMes}
              onChange={(e) => setFilterMes(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {getMesesOptions().map(mes => (
                <option key={mes.value} value={mes.value}>
                  {mes.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Año
            </label>
            <select
              value={filterAño}
              onChange={(e) => setFilterAño(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2023">2023</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterEstado('all');
                setFilterEmpleado('all');
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Tabla de nóminas */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Salario Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Salario Neto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {nominas.map((nomina) => (
                <tr key={nomina.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {nomina.empleado_nombre}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {nomina.periodo_display}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {nomina.mes}/{nomina.año}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(nomina.salario_base)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(nomina.salario_neto)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadgeClass(nomina.estado)}`}>
                      {getEstadoIcon(nomina.estado)}
                      <span className="ml-1">{nomina.estado_display}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetail(nomina)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {nomina.estado === 'borrador' && (
                        <button
                          onClick={() => handleCalculateNomina(nomina)}
                          disabled={actionLoading === nomina.id}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50"
                          title="Calcular"
                        >
                          {actionLoading === nomina.id ? (
                            <div className="h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Calculator className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      
                      {nomina.estado === 'calculada' && (
                        <button
                          onClick={() => handleApproveNomina(nomina)}
                          disabled={actionLoading === nomina.id}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                          title="Aprobar"
                        >
                          {actionLoading === nomina.id ? (
                            <div className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      
                      {nomina.estado === 'aprobada' && (
                        <button
                          onClick={() => handleMarkAsPaid(nomina)}
                          disabled={actionLoading === nomina.id}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
                          title="Marcar como pagada"
                        >
                          {actionLoading === nomina.id ? (
                            <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <CreditCard className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleEdit(nomina)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {nominas.length === 0 && !loading && (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No hay nóminas
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filterEstado !== 'all' || filterEmpleado !== 'all'
                ? 'No se encontraron nóminas con los filtros aplicados.'
                : `No hay nóminas para ${getMesesOptions().find(m => m.value === filterMes)?.label} ${filterAño}.`
              }
            </p>
            {!searchTerm && filterEstado === 'all' && filterEmpleado === 'all' && (
              <div className="mt-6">
                <button
                  onClick={handleGenerateNominas}
                  disabled={actionLoading === -1}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generar Nóminas del Mes
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {showDetail && selectedNomina && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Detalle de Nómina - {selectedNomina.empleado_nombre}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información general */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Información General
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Período:</span> {selectedNomina.mes}/{selectedNomina.año}</p>
                    <p><span className="font-medium">Tipo:</span> {selectedNomina.periodo_display}</p>
                    <p><span className="font-medium">Estado:</span> 
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadgeClass(selectedNomina.estado)}`}>
                        {getEstadoIcon(selectedNomina.estado)}
                        <span className="ml-1">{selectedNomina.estado_display}</span>
                      </span>
                    </p>
                    <p><span className="font-medium">Fechas:</span> {new Date(selectedNomina.fecha_inicio).toLocaleDateString()} - {new Date(selectedNomina.fecha_fin).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Ingresos */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Ingresos
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Salario Base:</span> {formatCurrency(selectedNomina.salario_base)}</p>
                    <p><span className="font-medium">Horas Extras:</span> {formatCurrency(selectedNomina.horas_extras)}</p>
                    <p><span className="font-medium">Bonificaciones:</span> {formatCurrency(selectedNomina.bonificaciones)}</p>
                    <p><span className="font-medium">Comisiones:</span> {formatCurrency(selectedNomina.comisiones)}</p>
                    <p><span className="font-medium">Otros Ingresos:</span> {formatCurrency(selectedNomina.otros_ingresos)}</p>
                    <p className="font-bold border-t pt-2"><span className="font-medium">Total Ingresos:</span> {formatCurrency(selectedNomina.total_ingresos)}</p>
                  </div>
                </div>

                {/* Deducciones */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Deducciones
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Impuesto sobre la Renta:</span> {formatCurrency(selectedNomina.impuesto_renta)}</p>
                    <p><span className="font-medium">Seguro Social:</span> {formatCurrency(selectedNomina.seguro_social)}</p>
                    <p><span className="font-medium">AFP:</span> {formatCurrency(selectedNomina.afp)}</p>
                    <p><span className="font-medium">Seguro Médico:</span> {formatCurrency(selectedNomina.seguro_medico)}</p>
                    <p><span className="font-medium">Préstamos:</span> {formatCurrency(selectedNomina.prestamos)}</p>
                    <p><span className="font-medium">Otras Deducciones:</span> {formatCurrency(selectedNomina.otras_deducciones)}</p>
                    <p className="font-bold border-t pt-2"><span className="font-medium">Total Deducciones:</span> {formatCurrency(selectedNomina.total_deducciones)}</p>
                  </div>
                </div>

                {/* Resumen */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Resumen
                  </h3>
                  <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-300">
                      {formatCurrency(selectedNomina.salario_neto)}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">Salario Neto a Pagar</p>
                  </div>
                  
                  {selectedNomina.fecha_calculo && (
                    <div className="mt-4 text-xs text-gray-500">
                      <p>Calculada: {new Date(selectedNomina.fecha_calculo).toLocaleString()}</p>
                      {selectedNomina.fecha_aprobacion && (
                        <p>Aprobada: {new Date(selectedNomina.fecha_aprobacion).toLocaleString()}</p>
                      )}
                      {selectedNomina.fecha_pago && (
                        <p>Pagada: {new Date(selectedNomina.fecha_pago).toLocaleString()}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NominaManager;