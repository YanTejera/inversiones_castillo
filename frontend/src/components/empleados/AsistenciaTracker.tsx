import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Download,
  Upload,
  Play,
  Square,
  Pause,
  BarChart3,
  Filter,
  RefreshCw,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Timer
} from 'lucide-react';
import { asistenciaService } from '../../services/asistenciaService';
import { empleadoService } from '../../services/empleadoService';
import type {
  RegistroAsistencia,
  ResumenAsistenciaDiaria,
  AsistenciaStats,
  ReporteAsistencia,
  RegistroAsistenciaCreate
} from '../../services/asistenciaService';
import type { EmpleadoList } from '../../services/empleadoService';
import { useToast } from '../Toast';
import EmpleadoAsistenciaModal from './EmpleadoAsistenciaModal';

interface AsistenciaTrackerProps {}

const AsistenciaTracker: React.FC<AsistenciaTrackerProps> = () => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();

  // Estados principales
  const [currentView, setCurrentView] = useState<'dashboard' | 'registros' | 'reportes' | 'registro_rapido'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados del dashboard
  const [stats, setStats] = useState<AsistenciaStats | null>(null);
  const [resumenDiario, setResumenDiario] = useState<ResumenAsistenciaDiaria[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);

  // Estados de registros
  const [registros, setRegistros] = useState<RegistroAsistencia[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoList[]>([]);
  const [filtroEmpleado, setFiltroEmpleado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Estados del registro rápido
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<number | null>(null);
  const [registrandoTipo, setRegistrandoTipo] = useState<'entrada' | 'salida' | 'entrada_almuerzo' | 'salida_almuerzo' | null>(null);
  const [notasRegistro, setNotasRegistro] = useState('');

  // Estados de reportes
  const [fechaInicioReporte, setFechaInicioReporte] = useState('');
  const [fechaFinReporte, setFechaFinReporte] = useState('');
  const [reporteData, setReporteData] = useState<ReporteAsistencia[]>([]);

  // Estados de formulario
  const [showRegistroForm, setShowRegistroForm] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<RegistroAsistencia | null>(null);
  const [formData, setFormData] = useState<RegistroAsistenciaCreate>({
    empleado: 0,
    fecha: '',
    hora: '',
    tipo: 'entrada',
    notas: ''
  });

  // Estado del modal de empleado
  const [empleadoModalSeleccionado, setEmpleadoModalSeleccionado] = useState<number | null>(null);

  useEffect(() => {
    loadDashboardData();
    loadEmpleados();
  }, [fechaSeleccionada]);

  useEffect(() => {
    if (currentView === 'registros') {
      loadRegistros();
    }
  }, [currentView, currentPage, filtroEmpleado, filtroTipo]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, resumenData] = await Promise.all([
        asistenciaService.getEstadisticasDiarias(fechaSeleccionada),
        asistenciaService.getResumenDiario(fechaSeleccionada)
      ]);
      setStats(statsData);
      setResumenDiario(resumenData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
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

  const loadRegistros = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        fecha: fechaSeleccionada,
        ordering: '-fecha,-hora'
      };

      if (filtroEmpleado) params.empleado = filtroEmpleado;
      if (filtroTipo) params.tipo = filtroTipo;

      const response = await asistenciaService.getRegistros(params);
      setRegistros(response.results);
      setTotalPages(Math.ceil(response.count / 20));
    } catch (err) {
      console.error('Error loading registros:', err);
      setError('Error al cargar registros');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistroRapido = async (tipo: 'entrada' | 'salida' | 'entrada_almuerzo' | 'salida_almuerzo') => {
    if (!empleadoSeleccionado) {
      showError('Selecciona un empleado primero');
      return;
    }

    try {
      setRegistrandoTipo(tipo);

      // Verificar si ya existe un registro de este tipo para hoy
      const disponible = await asistenciaService.validarRegistroDisponible(
        empleadoSeleccionado,
        tipo,
        fechaSeleccionada
      );

      if (!disponible) {
        showError(`Ya existe un registro de ${tipo.replace('_', ' ')} para este empleado hoy`);
        return;
      }

      let registro: RegistroAsistencia;

      switch (tipo) {
        case 'entrada':
          registro = await asistenciaService.registrarEntrada(empleadoSeleccionado, notasRegistro);
          break;
        case 'salida':
          registro = await asistenciaService.registrarSalida(empleadoSeleccionado, notasRegistro);
          break;
        case 'salida_almuerzo':
          registro = await asistenciaService.registrarSalidaAlmuerzo(empleadoSeleccionado, notasRegistro);
          break;
        case 'entrada_almuerzo':
          registro = await asistenciaService.registrarEntradaAlmuerzo(empleadoSeleccionado, notasRegistro);
          break;
        default:
          throw new Error('Tipo de registro no válido');
      }

      success(`Registro de ${tipo.replace('_', ' ')} creado exitosamente`);
      setNotasRegistro('');
      loadDashboardData();

    } catch (err: any) {
      showError(err.message || `Error al registrar ${tipo.replace('_', ' ')}`);
    } finally {
      setRegistrandoTipo(null);
    }
  };

  const handleCreateRegistro = async () => {
    try {
      if (editingRegistro) {
        await asistenciaService.updateRegistro(editingRegistro.id, formData);
        success('Registro actualizado correctamente');
      } else {
        await asistenciaService.createRegistro(formData);
        success('Registro creado correctamente');
      }

      setShowRegistroForm(false);
      setEditingRegistro(null);
      setFormData({
        empleado: 0,
        fecha: '',
        hora: '',
        tipo: 'entrada',
        notas: ''
      });
      loadRegistros();
      loadDashboardData();
    } catch (err: any) {
      showError(err.message || 'Error al guardar registro');
    }
  };

  const handleEditRegistro = (registro: RegistroAsistencia) => {
    setEditingRegistro(registro);
    setFormData({
      empleado: registro.empleado,
      fecha: registro.fecha,
      hora: registro.hora,
      tipo: registro.tipo,
      notas: registro.notas || ''
    });
    setShowRegistroForm(true);
  };

  const handleDeleteRegistro = async (registro: RegistroAsistencia) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      await asistenciaService.deleteRegistro(registro.id);
      success('Registro eliminado correctamente');
      loadRegistros();
      loadDashboardData();
    } catch (err: any) {
      showError(err.message || 'Error al eliminar registro');
    }
  };

  const generateReporte = async () => {
    if (!fechaInicioReporte || !fechaFinReporte) {
      showError('Selecciona las fechas de inicio y fin');
      return;
    }

    try {
      setLoading(true);
      const data = await asistenciaService.getReporteAsistencia(fechaInicioReporte, fechaFinReporte);
      setReporteData(data);
    } catch (err) {
      showError('Error al generar reporte');
    } finally {
      setLoading(false);
    }
  };

  const exportReporte = () => {
    if (reporteData.length === 0) {
      warning('No hay datos para exportar');
      return;
    }

    asistenciaService.exportarReporteCSV(reporteData, fechaInicioReporte, fechaFinReporte);
    info('Reporte exportado correctamente');
  };

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'presente':
        return 'bg-green-100 text-green-800';
      case 'tarde':
        return 'bg-yellow-100 text-yellow-800';
      case 'ausente':
        return 'bg-red-100 text-red-800';
      case 'parcial':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'presente':
        return <CheckCircle className="h-4 w-4" />;
      case 'tarde':
        return <Clock className="h-4 w-4" />;
      case 'ausente':
        return <XCircle className="h-4 w-4" />;
      case 'parcial':
        return <Timer className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const formatEstadoLabel = (estado: string) => {
    const labels: { [key: string]: string } = {
      'presente': 'Presente',
      'tarde': 'Tardío',
      'ausente': 'Ausente',
      'parcial': 'Parcial'
    };
    return labels[estado] || estado;
  };

  const formatTipoLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      'entrada': 'Entrada',
      'salida': 'Salida',
      'entrada_almuerzo': 'Entrada Almuerzo',
      'salida_almuerzo': 'Salida Almuerzo'
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Control de Asistencia
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <button
              onClick={() => loadDashboardData()}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              title="Actualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navegación */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { key: 'registro_rapido', label: 'Registro Rápido', icon: Play },
              { key: 'registros', label: 'Registros', icon: Clock },
              { key: 'reportes', label: 'Reportes', icon: Download }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  currentView === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Dashboard */}
      {currentView === 'dashboard' && (
        <div className="space-y-6">
          {/* Estadísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <p className="text-sm font-medium text-green-900">Presentes</p>
                    <p className="text-2xl font-bold text-green-700">{stats.empleados_presentes}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <UserX className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Ausentes</p>
                    <p className="text-2xl font-bold text-red-700">{stats.empleados_ausentes}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Tardíos</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.empleados_tardios}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resumen diario */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Resumen del {new Date(fechaSeleccionada).toLocaleDateString('es-DO')}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Entrada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Salida
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Horas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {resumenDiario.map((empleado) => (
                    <tr
                      key={empleado.empleado_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => setEmpleadoModalSeleccionado(empleado.empleado_id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {empleado.empleado_nombre}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            #{empleado.empleado_numero}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {empleado.entrada ? asistenciaService.formatearHora(empleado.entrada) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {empleado.salida ? asistenciaService.formatearHora(empleado.salida) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {empleado.horas_trabajadas ? `${empleado.horas_trabajadas}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadgeClass(empleado.estado)}`}>
                          {getEstadoIcon(empleado.estado)}
                          <span className="ml-1">{formatEstadoLabel(empleado.estado)}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {resumenDiario.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No hay datos de asistencia
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No se encontraron registros para la fecha seleccionada
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Registro Rápido */}
      {currentView === 'registro_rapido' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Registro Rápido de Asistencia
          </h3>

          <div className="space-y-6">
            {/* Selección de empleado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleccionar Empleado
              </label>
              <select
                value={empleadoSeleccionado || ''}
                onChange={(e) => setEmpleadoSeleccionado(Number(e.target.value) || null)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Seleccionar empleado...</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre_completo} - #{emp.numero_empleado}
                  </option>
                ))}
              </select>
            </div>

            {/* Notas opcionales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas (Opcional)
              </label>
              <input
                type="text"
                value={notasRegistro}
                onChange={(e) => setNotasRegistro(e.target.value)}
                placeholder="Agregar notas al registro..."
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Botones de registro */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => handleRegistroRapido('entrada')}
                disabled={!empleadoSeleccionado || registrandoTipo === 'entrada'}
                className="flex flex-col items-center p-4 border border-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registrandoTipo === 'entrada' ? (
                  <div className="h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Play className="h-8 w-8 text-green-600 mb-2" />
                )}
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Entrada
                </span>
              </button>

              <button
                onClick={() => handleRegistroRapido('salida_almuerzo')}
                disabled={!empleadoSeleccionado || registrandoTipo === 'salida_almuerzo'}
                className="flex flex-col items-center p-4 border border-yellow-300 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registrandoTipo === 'salida_almuerzo' ? (
                  <div className="h-8 w-8 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Pause className="h-8 w-8 text-yellow-600 mb-2" />
                )}
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  Salida Almuerzo
                </span>
              </button>

              <button
                onClick={() => handleRegistroRapido('entrada_almuerzo')}
                disabled={!empleadoSeleccionado || registrandoTipo === 'entrada_almuerzo'}
                className="flex flex-col items-center p-4 border border-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registrandoTipo === 'entrada_almuerzo' ? (
                  <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Play className="h-8 w-8 text-blue-600 mb-2" />
                )}
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Entrada Almuerzo
                </span>
              </button>

              <button
                onClick={() => handleRegistroRapido('salida')}
                disabled={!empleadoSeleccionado || registrandoTipo === 'salida'}
                className="flex flex-col items-center p-4 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registrandoTipo === 'salida' ? (
                  <div className="h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Square className="h-8 w-8 text-red-600 mb-2" />
                )}
                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                  Salida
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Registros */}
      {currentView === 'registros' && (
        <div className="space-y-6">
          {/* Filtros y controles */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filtrar por empleado
                </label>
                <select
                  value={filtroEmpleado}
                  onChange={(e) => setFiltroEmpleado(e.target.value)}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Todos los empleados</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filtrar por tipo
                </label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Todos los tipos</option>
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                  <option value="entrada_almuerzo">Entrada Almuerzo</option>
                  <option value="salida_almuerzo">Salida Almuerzo</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowRegistroForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo Registro
                </button>
              </div>
            </div>
          </div>

          {/* Lista de registros */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Notas
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {registros.map((registro) => (
                    <tr key={registro.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {registro.empleado_nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(registro.fecha).toLocaleDateString('es-DO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {asistenciaService.formatearHora(registro.hora)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {formatTipoLabel(registro.tipo)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {registro.notas || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditRegistro(registro)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRegistro(registro)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {registros.length === 0 && !loading && (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No hay registros
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No se encontraron registros para los filtros seleccionados
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista de Reportes */}
      {currentView === 'reportes' && (
        <div className="space-y-6">
          {/* Configuración del reporte */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Generar Reporte de Asistencia
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicioReporte}
                  onChange={(e) => setFechaInicioReporte(e.target.value)}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={fechaFinReporte}
                  onChange={(e) => setFechaFinReporte(e.target.value)}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={generateReporte}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <BarChart3 className="h-4 w-4" />
                  {loading ? 'Generando...' : 'Generar'}
                </button>

                {reporteData.length > 0 && (
                  <button
                    onClick={exportReporte}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Resultados del reporte */}
          {reporteData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Reporte de Asistencia ({fechaInicioReporte} - {fechaFinReporte})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Empleado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Días Trabajados
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Días Faltantes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Horas Totales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        % Asistencia
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {reporteData.map((empleado) => (
                      <tr key={empleado.empleado_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {empleado.empleado_nombre}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {empleado.dias_trabajados}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {empleado.dias_faltantes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {empleado.horas_totales}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            empleado.porcentaje_asistencia >= 90 ? 'bg-green-100 text-green-800' :
                            empleado.porcentaje_asistencia >= 75 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {empleado.porcentaje_asistencia}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de formulario de registro */}
      {showRegistroForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingRegistro ? 'Editar Registro' : 'Nuevo Registro'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Empleado
                </label>
                <select
                  value={formData.empleado}
                  onChange={(e) => setFormData({ ...formData, empleado: Number(e.target.value) })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value={0}>Seleccionar empleado...</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hora
                </label>
                <input
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                  <option value="entrada_almuerzo">Entrada Almuerzo</option>
                  <option value="salida_almuerzo">Salida Almuerzo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas adicionales..."
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRegistroForm(false);
                  setEditingRegistro(null);
                  setFormData({
                    empleado: 0,
                    fecha: '',
                    hora: '',
                    tipo: 'entrada',
                    notas: ''
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRegistro}
                disabled={!formData.empleado || !formData.fecha || !formData.hora}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingRegistro ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de asistencia detallada por empleado */}
      {empleadoModalSeleccionado && (
        <EmpleadoAsistenciaModal
          empleadoId={empleadoModalSeleccionado}
          onClose={() => setEmpleadoModalSeleccionado(null)}
        />
      )}

      <ToastContainer />
    </div>
  );
};

export default AsistenciaTracker;