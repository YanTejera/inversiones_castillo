import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Award,
  FileText,
  Download,
  RefreshCw,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  PieChart,
  Activity,
  Target,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Building2,
  UserCheck,
  UserX,
  TrendingDown
} from 'lucide-react';
import { empleadoService, type EmpleadoStats, type DepartamentoStats } from '../../services/empleadoService';
import { solicitudesService } from '../../services/solicitudesService';
import { useToast } from '../Toast';

interface ReportesEmpleadosProps {}

interface AsistenciaReport {
  empleado_id: number;
  empleado_nombre: string;
  dias_trabajados: number;
  dias_faltantes: number;
  horas_totales: number;
  porcentaje_asistencia: number;
}

interface SolicitudesReport {
  total_solicitudes: number;
  solicitudes_pendientes: number;
  solicitudes_aprobadas: number;
  solicitudes_rechazadas: number;
  por_tipo: {
    [key: string]: number;
  };
}

const ReportesEmpleados: React.FC<ReportesEmpleadosProps> = () => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();

  // Estados principales
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<EmpleadoStats | null>(null);
  const [departamentosStats, setDepartamentosStats] = useState<DepartamentoStats[]>([]);
  const [solicitudesReport, setSolicitudesReport] = useState<SolicitudesReport | null>(null);
  const [asistenciaReport, setAsistenciaReport] = useState<AsistenciaReport[]>([]);

  // Estados de filtros
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'year'>('30d');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [reportType, setReportType] = useState<'overview' | 'asistencia' | 'solicitudes' | 'nominas'>('overview');

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod, selectedDepartment, reportType]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadGeneralStats(),
        loadDepartmentStats(),
        loadSolicitudesReport(),
        loadAsistenciaReport()
      ]);
    } catch (err: any) {
      showError(err.message || 'Error al cargar datos de reportes');
    } finally {
      setLoading(false);
    }
  };

  const loadGeneralStats = async () => {
    try {
      const statsData = await empleadoService.getEstadisticas();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadDepartmentStats = async () => {
    try {
      const deptStats = await empleadoService.getEstadisticasPorDepartamento();
      setDepartamentosStats(deptStats);
    } catch (err) {
      console.error('Error loading department stats:', err);
    }
  };

  const loadSolicitudesReport = async () => {
    try {
      // Simulando datos de solicitudes por ahora
      // TODO: Implementar endpoint específico para reportes de solicitudes
      const solicitudes = await solicitudesService.getSolicitudes();

      const report: SolicitudesReport = {
        total_solicitudes: solicitudes.count,
        solicitudes_pendientes: solicitudes.results.filter(s => s.estado === 'pendiente').length,
        solicitudes_aprobadas: solicitudes.results.filter(s => s.estado === 'aprobada').length,
        solicitudes_rechazadas: solicitudes.results.filter(s => s.estado === 'rechazada').length,
        por_tipo: solicitudes.results.reduce((acc, s) => {
          acc[s.tipo] = (acc[s.tipo] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number })
      };

      setSolicitudesReport(report);
    } catch (err) {
      console.error('Error loading solicitudes report:', err);
    }
  };

  const loadAsistenciaReport = async () => {
    try {
      // Simulando datos de asistencia por ahora
      // TODO: Implementar endpoint específico para reportes de asistencia
      const mockData: AsistenciaReport[] = [
        {
          empleado_id: 1,
          empleado_nombre: "Juan Pérez",
          dias_trabajados: 22,
          dias_faltantes: 3,
          horas_totales: 176,
          porcentaje_asistencia: 88.0
        },
        {
          empleado_id: 2,
          empleado_nombre: "María García",
          dias_trabajados: 25,
          dias_faltantes: 0,
          horas_totales: 200,
          porcentaje_asistencia: 100.0
        }
      ];
      setAsistenciaReport(mockData);
    } catch (err) {
      console.error('Error loading asistencia report:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7d': return 'Últimos 7 días';
      case '30d': return 'Últimos 30 días';
      case '90d': return 'Últimos 90 días';
      case 'year': return 'Último año';
      default: return 'Último mes';
    }
  };

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* Métricas principales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Empleados</p>
                <p className="text-3xl font-bold">{stats.total_empleados}</p>
                <p className="text-blue-100 text-sm mt-1">
                  {stats.empleados_activos} activos
                </p>
              </div>
              <Users className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Gasto Nómina</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.gasto_nomina_mes)}</p>
                <p className="text-green-100 text-sm mt-1">Mensual</p>
              </div>
              <DollarSign className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Nuevos este Mes</p>
                <p className="text-3xl font-bold">{stats.empleados_nuevos_mes}</p>
                <p className="text-purple-100 text-sm mt-1">Contrataciones</p>
              </div>
              <UserCheck className="h-12 w-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Antigüedad Promedio</p>
                <p className="text-3xl font-bold">{stats.promedio_antiguedad.toFixed(1)}</p>
                <p className="text-orange-100 text-sm mt-1">Años</p>
              </div>
              <Award className="h-12 w-12 text-orange-200" />
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas por departamento */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Building2 className="h-5 w-5 mr-2 text-blue-600" />
          Estadísticas por Departamento
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Departamento
                </th>
                <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Empleados
                </th>
                <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Salario Promedio
                </th>
                <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Gasto Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {departamentosStats.map((dept, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {dept.departamento}
                  </td>
                  <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                    {dept.total_empleados}
                  </td>
                  <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                    {formatCurrency(dept.promedio_salario)}
                  </td>
                  <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                    {formatCurrency(dept.gasto_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de solicitudes */}
      {solicitudesReport && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Estado de Solicitudes
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Pendientes</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">{solicitudesReport.solicitudes_pendientes}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Aprobadas</span>
                </div>
                <span className="text-lg font-bold text-green-600">{solicitudesReport.solicitudes_aprobadas}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Rechazadas</span>
                </div>
                <span className="text-lg font-bold text-red-600">{solicitudesReport.solicitudes_rechazadas}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-indigo-600" />
              Tipos de Solicitudes
            </h3>
            <div className="space-y-3">
              {Object.entries(solicitudesReport.por_tipo).map(([tipo, cantidad]) => (
                <div key={tipo} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{tipo}</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{
                          width: `${(cantidad / solicitudesReport.total_solicitudes) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                      {cantidad}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAsistenciaReport = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-green-600" />
          Reporte de Asistencia - {getPeriodLabel(selectedPeriod)}
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Empleado
                </th>
                <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Días Trabajados
                </th>
                <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Días Faltantes
                </th>
                <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Horas Totales
                </th>
                <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  % Asistencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {asistenciaReport.map((record) => (
                <tr key={record.empleado_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {record.empleado_nombre}
                  </td>
                  <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                    {record.dias_trabajados}
                  </td>
                  <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                    {record.dias_faltantes}
                  </td>
                  <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                    {record.horas_totales}h
                  </td>
                  <td className="py-3 text-sm text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.porcentaje_asistencia >= 95
                        ? 'bg-green-100 text-green-800'
                        : record.porcentaje_asistencia >= 85
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {formatPercentage(record.porcentaje_asistencia)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSolicitudesReport = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          Análisis Detallado de Solicitudes
        </h3>

        {solicitudesReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Total</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {solicitudesReport.total_solicitudes}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                    {solicitudesReport.solicitudes_pendientes}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-200">Aprobadas</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {solicitudesReport.solicitudes_aprobadas}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-200">Rechazadas</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {solicitudesReport.solicitudes_rechazadas}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
            Distribución por Tipo de Solicitud
          </h4>
          {solicitudesReport && (
            <div className="space-y-3">
              {Object.entries(solicitudesReport.por_tipo).map(([tipo, cantidad]) => {
                const percentage = (cantidad / solicitudesReport.total_solicitudes) * 100;
                return (
                  <div key={tipo} className="flex items-center">
                    <div className="w-32 text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {tipo}
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm font-medium text-gray-900 dark:text-white">
                      {cantidad} ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderNominasReport = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
          Análisis de Nóminas - {getPeriodLabel(selectedPeriod)}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {stats && (
            <>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Gasto Total Mensual</p>
                    <p className="text-3xl font-bold">{formatCurrency(stats.gasto_nomina_mes)}</p>
                  </div>
                  <DollarSign className="h-12 w-12 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Salario Promedio</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(stats.gasto_nomina_mes / stats.empleados_activos)}
                    </p>
                  </div>
                  <TrendingUp className="h-12 w-12 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Empleados en Nómina</p>
                    <p className="text-3xl font-bold">{stats.empleados_activos}</p>
                  </div>
                  <Users className="h-12 w-12 text-purple-200" />
                </div>
              </div>
            </>
          )}
        </div>

        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
            Costos por Departamento
          </h4>
          <div className="space-y-3">
            {departamentosStats.map((dept, index) => {
              const totalGasto = stats ? stats.gasto_nomina_mes : 0;
              const percentage = totalGasto > 0 ? (dept.gasto_total / totalGasto) * 100 : 0;
              return (
                <div key={index} className="flex items-center">
                  <div className="w-40 text-sm font-medium text-gray-900 dark:text-white">
                    {dept.departamento}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                      <div
                        className="bg-green-600 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-32 text-right text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(dept.gasto_total)}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
          <div className="animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Reportes y Estadísticas
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadReportData}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>

          <button className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de Reporte
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="overview">Resumen General</option>
            <option value="asistencia">Asistencia</option>
            <option value="solicitudes">Solicitudes</option>
            <option value="nominas">Nóminas</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Período
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="year">Último año</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Departamento
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Todos los departamentos</option>
            {departamentosStats.map(dept => (
              <option key={dept.departamento} value={dept.departamento}>
                {dept.departamento}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contenido del reporte */}
      <div className="report-content">
        {reportType === 'overview' && renderOverviewReport()}
        {reportType === 'asistencia' && renderAsistenciaReport()}
        {reportType === 'solicitudes' && renderSolicitudesReport()}
        {reportType === 'nominas' && renderNominasReport()}
      </div>

      <ToastContainer />
    </div>
  );
};

export default ReportesEmpleados;