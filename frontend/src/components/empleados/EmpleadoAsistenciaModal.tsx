import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  BarChart3,
  User,
  CalendarDays
} from 'lucide-react';
import { asistenciaService } from '../../services/asistenciaService';
import { useToast } from '../Toast';
import type {
  RegistroAsistencia,
  AsistenciaEmpleadoMes,
  RegistroAsistenciaCreate
} from '../../services/asistenciaService';
import type { EmpleadoList } from '../../services/empleadoService';
import { empleadoService } from '../../services/empleadoService';

interface EmpleadoAsistenciaModalProps {
  empleadoId: number;
  onClose: () => void;
}

interface EstadisticasEmpleado {
  total_dias_trabajados: number;
  total_horas: number;
  promedio_entrada: string | null;
  promedio_salida: string | null;
  dias_tarde: number;
  dias_ausente: number;
  porcentaje_asistencia: number;
  tendencia_mensual: Array<{
    mes: string;
    dias_trabajados: number;
    porcentaje: number;
  }>;
}

interface DiaCalendario {
  dia: number;
  fecha: string;
  registros: RegistroAsistencia[];
  estado: 'presente' | 'tarde' | 'ausente' | 'parcial' | 'fin_semana';
  horas_trabajadas?: number;
}

const EmpleadoAsistenciaModal: React.FC<EmpleadoAsistenciaModalProps> = ({
  empleadoId,
  onClose
}) => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();

  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [asistenciaData, setAsistenciaData] = useState<AsistenciaEmpleadoMes | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasEmpleado | null>(null);
  const [calendarioDias, setCalendarioDias] = useState<DiaCalendario[]>([]);
  const [currentView, setCurrentView] = useState<'calendario' | 'lista' | 'estadisticas'>('calendario');
  const [empleado, setEmpleado] = useState<EmpleadoList | null>(null);

  // Estados para edición
  const [editingRegistro, setEditingRegistro] = useState<RegistroAsistencia | null>(null);
  const [showRegistroForm, setShowRegistroForm] = useState(false);
  const [formData, setFormData] = useState<RegistroAsistenciaCreate>({
    empleado: empleadoId,
    fecha: '',
    hora: '',
    tipo: 'entrada',
    notas: ''
  });

  useEffect(() => {
    loadEmpleado();
  }, [empleadoId]);

  useEffect(() => {
    if (empleado) {
      loadAsistenciaData();
    }
  }, [currentMonth, empleado]);

  // Función para formatear hora a formato de 12 horas
  const formatearHora12 = (hora: string): string => {
    if (!hora) return '';

    const [hours, minutes] = hora.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const loadEmpleado = async () => {
    try {
      const empleadoData = await empleadoService.getEmpleado(empleadoId);
      setEmpleado(empleadoData);
    } catch (err) {
      console.error('Error loading empleado:', err);
      showError('Error al cargar información del empleado');
    }
  };

  const loadAsistenciaData = async () => {
    try {
      setLoading(true);

      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const [asistenciaResponse] = await Promise.all([
        asistenciaService.getAsistenciaEmpleadoMes(empleadoId, year, month)
      ]);

      setAsistenciaData(asistenciaResponse);
      generateCalendario(asistenciaResponse, year, month);
      await loadEstadisticas();

    } catch (err) {
      console.error('Error loading asistencia data:', err);
      showError('Error al cargar datos de asistencia');
    } finally {
      setLoading(false);
    }
  };

  const loadEstadisticas = async () => {
    try {
      // Calcular estadísticas del año actual
      const year = new Date().getFullYear();
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const reporteAnual = await asistenciaService.getReporteAsistencia(startDate, endDate);
      const empleadoStats = reporteAnual.find(r => r.empleado_id === empleadoId);

      if (empleadoStats) {
        // Calcular estadísticas adicionales
        const registrosAno = await asistenciaService.getRegistros({
          empleado: empleadoId,
          fecha__year: year,
          page_size: 1000
        });

        const entradas = registrosAno.results.filter(r => r.tipo === 'entrada');
        const promedio_entrada = entradas.length > 0
          ? calcularPromedioHora(entradas.map(r => r.hora))
          : null;

        const salidas = registrosAno.results.filter(r => r.tipo === 'salida');
        const promedio_salida = salidas.length > 0
          ? calcularPromedioHora(salidas.map(r => r.hora))
          : null;

        // Contar días tarde (después de 8:00 AM)
        const dias_tarde = entradas.filter(r => r.hora > '08:00').length;

        const stats: EstadisticasEmpleado = {
          total_dias_trabajados: empleadoStats.dias_trabajados,
          total_horas: empleadoStats.horas_totales,
          promedio_entrada,
          promedio_salida,
          dias_tarde,
          dias_ausente: empleadoStats.dias_faltantes,
          porcentaje_asistencia: empleadoStats.porcentaje_asistencia,
          tendencia_mensual: await calcularTendenciaMensual()
        };

        setEstadisticas(stats);
      }
    } catch (err) {
      console.error('Error loading estadísticas:', err);
    }
  };

  const calcularPromedioHora = (horas: string[]): string => {
    const totalMinutos = horas.reduce((acc, hora) => {
      const [h, m] = hora.split(':').map(Number);
      return acc + (h * 60) + m;
    }, 0);

    const promedioMinutos = totalMinutos / horas.length;
    const horas_prom = Math.floor(promedioMinutos / 60);
    const minutos_prom = Math.round(promedioMinutos % 60);

    return `${horas_prom.toString().padStart(2, '0')}:${minutos_prom.toString().padStart(2, '0')}`;
  };

  const calcularTendenciaMensual = async (): Promise<Array<{mes: string; dias_trabajados: number; porcentaje: number}>> => {
    const year = new Date().getFullYear();
    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const tendencia = [];

    for (let i = 0; i < 12; i++) {
      const mesActual = i + 1;
      const startDate = `${year}-${mesActual.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, mesActual, 0).getDate();
      const endDate = `${year}-${mesActual.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

      try {
        const reporte = await asistenciaService.getReporteAsistencia(startDate, endDate);
        const empleadoData = reporte.find(r => r.empleado_id === empleadoId);

        tendencia.push({
          mes: meses[i],
          dias_trabajados: empleadoData?.dias_trabajados || 0,
          porcentaje: empleadoData?.porcentaje_asistencia || 0
        });
      } catch (err) {
        tendencia.push({
          mes: meses[i],
          dias_trabajados: 0,
          porcentaje: 0
        });
      }
    }

    return tendencia;
  };

  const generateCalendario = (data: AsistenciaEmpleadoMes, year: number, month: number) => {
    const diasEnMes = new Date(year, month, 0).getDate();
    const primerDia = new Date(year, month - 1, 1).getDay();

    const dias: DiaCalendario[] = [];

    // Días del mes anterior (para completar la primera semana)
    const diasMesAnterior = new Date(year, month - 1, 0).getDate();
    for (let i = primerDia - 1; i >= 0; i--) {
      const dia = diasMesAnterior - i;
      const fecha = `${year}-${(month - 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
      dias.push({
        dia,
        fecha,
        registros: [],
        estado: 'fin_semana',
        horas_trabajadas: 0
      });
    }

    // Días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = `${year}-${month.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
      const registrosDia = data.registros.filter(r => r.fecha === fecha);

      const diaSemana = new Date(year, month - 1, dia).getDay();
      let estado: DiaCalendario['estado'] = 'fin_semana';
      let horasTrabajadas = 0;

      // Solo calcular para días laborables (lunes a viernes)
      if (diaSemana >= 1 && diaSemana <= 5) {
        const entrada = registrosDia.find(r => r.tipo === 'entrada');
        const salida = registrosDia.find(r => r.tipo === 'salida');

        if (!entrada) {
          estado = 'ausente';
        } else if (!salida) {
          estado = 'parcial';
        } else {
          // Verificar si llegó tarde
          if (entrada.hora > '08:00') {
            estado = 'tarde';
          } else {
            estado = 'presente';
          }

          // Calcular horas trabajadas
          horasTrabajadas = asistenciaService.calcularHorasTrabajadas(entrada.hora, salida.hora);
        }
      }

      dias.push({
        dia,
        fecha,
        registros: registrosDia,
        estado,
        horas_trabajadas: horasTrabajadas
      });
    }

    setCalendarioDias(dias);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleEditRegistro = (registro: RegistroAsistencia) => {
    setEditingRegistro(registro);
    setFormData({
      empleado: empleadoId,
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
      loadAsistenciaData();
    } catch (err: any) {
      showError(err.message || 'Error al eliminar registro');
    }
  };

  const handleSaveRegistro = async () => {
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
        empleado: empleadoId,
        fecha: '',
        hora: '',
        tipo: 'entrada',
        notas: ''
      });
      loadAsistenciaData();
    } catch (err: any) {
      showError(err.message || 'Error al guardar registro');
    }
  };

  const getEstadoColor = (estado: DiaCalendario['estado']) => {
    switch (estado) {
      case 'presente':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'tarde':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ausente':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'parcial':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fin_semana':
        return 'bg-gray-50 text-gray-400 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: DiaCalendario['estado']) => {
    switch (estado) {
      case 'presente':
        return <CheckCircle className="h-3 w-3" />;
      case 'tarde':
        return <Clock className="h-3 w-3" />;
      case 'ausente':
        return <XCircle className="h-3 w-3" />;
      case 'parcial':
        return <Timer className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const exportarReporte = () => {
    if (!asistenciaData) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const csvContent = [
      ['REPORTE DE ASISTENCIA'],
      [`Empleado: ${empleado.nombre_completo}`],
      [`Período: ${monthName}`],
      [''],
      ['Fecha', 'Entrada', 'Salida Almuerzo', 'Entrada Almuerzo', 'Salida', 'Horas Trabajadas', 'Estado'],
      ...calendarioDias
        .filter(dia => dia.registros.length > 0 || dia.estado === 'ausente')
        .map(dia => {
          const entrada = dia.registros.find(r => r.tipo === 'entrada');
          const salida = dia.registros.find(r => r.tipo === 'salida');
          const salidaAlmuerzo = dia.registros.find(r => r.tipo === 'salida_almuerzo');
          const entradaAlmuerzo = dia.registros.find(r => r.tipo === 'entrada_almuerzo');

          return [
            new Date(dia.fecha).toLocaleDateString('es-ES'),
            entrada ? formatearHora12(entrada.hora) : '-',
            salidaAlmuerzo ? formatearHora12(salidaAlmuerzo.hora) : '-',
            entradaAlmuerzo ? formatearHora12(entradaAlmuerzo.hora) : '-',
            salida ? formatearHora12(salida.hora) : '-',
            dia.horas_trabajadas ? `${dia.horas_trabajadas}h` : '-',
            dia.estado
          ];
        })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `asistencia_${empleado.nombre_completo}_${monthName.replace(' ', '_')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    info('Reporte exportado correctamente');
  };

  if (!empleado) {
    return createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[99999]">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-700 dark:text-gray-300">Cargando información del empleado...</span>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[99999]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="h-6 w-6 mr-3" />
              <div>
                <h3 className="text-lg font-semibold">
                  Historial de Asistencia - {empleado.nombre_completo}
                </h3>
                <p className="text-blue-100 text-sm">
                  #{empleado.numero_empleado} - {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportarReporte}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded-md flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
              <button
                onClick={onClose}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('calendario')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  currentView === 'calendario'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="h-4 w-4 inline mr-1" />
                Calendario
              </button>
              <button
                onClick={() => setCurrentView('lista')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  currentView === 'lista'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Clock className="h-4 w-4 inline mr-1" />
                Lista
              </button>
              <button
                onClick={() => setCurrentView('estadisticas')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  currentView === 'estadisticas'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-1" />
                Estadísticas
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[120px] text-center">
                {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Vista Calendario */}
              {currentView === 'calendario' && (
                <div className="space-y-4">
                  {/* Calendario */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
                      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => (
                        <div
                          key={dia}
                          className="bg-gray-50 dark:bg-gray-800 p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
                        >
                          {dia}
                        </div>
                      ))}

                      {calendarioDias.map((dia, index) => (
                        <div
                          key={index}
                          className={`bg-white dark:bg-gray-800 p-2 min-h-[80px] border-r border-b border-gray-100 dark:border-gray-700 ${
                            dia.estado !== 'fin_semana' ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : ''
                          }`}
                        >
                          <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${
                                dia.estado === 'fin_semana'
                                  ? 'text-gray-400'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {dia.dia}
                              </span>
                              {dia.estado !== 'fin_semana' && getEstadoIcon(dia.estado)}
                            </div>

                            {dia.registros.length > 0 && (
                              <div className="space-y-1 flex-1">
                                {dia.registros.slice(0, 2).map((registro) => (
                                  <div
                                    key={registro.id}
                                    className="text-xs p-1 rounded bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                  >
                                    {registro.tipo === 'entrada' && '↓'}
                                    {registro.tipo === 'salida' && '↑'}
                                    {registro.tipo === 'salida_almuerzo' && '🍽️'}
                                    {registro.tipo === 'entrada_almuerzo' && '🍽️'}
                                    {' '}
                                    {formatearHora12(registro.hora)}
                                  </div>
                                ))}
                                {dia.registros.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{dia.registros.length - 2} más
                                  </div>
                                )}
                              </div>
                            )}

                            {dia.estado !== 'fin_semana' && dia.registros.length === 0 && (
                              <div className="flex-1 flex items-center justify-center">
                                <div className={`w-4 h-4 rounded-full ${
                                  dia.estado === 'ausente' ? 'bg-red-200' : 'bg-gray-100'
                                }`}></div>
                              </div>
                            )}

                            {dia.horas_trabajadas && dia.horas_trabajadas > 0 && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-auto">
                                {dia.horas_trabajadas}h
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leyenda */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Presente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span>Tardío</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-blue-600" />
                      <span>Parcial</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>Ausente</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Vista Lista */}
              {currentView === 'lista' && asistenciaData && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Registros Detallados
                    </h4>
                    <button
                      onClick={() => setShowRegistroForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Nuevo Registro
                    </button>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
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
                          {asistenciaData.registros.map((registro) => (
                            <tr key={registro.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {new Date(registro.fecha).toLocaleDateString('es-ES')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {formatearHora12(registro.hora)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  registro.tipo === 'entrada' ? 'bg-green-100 text-green-800' :
                                  registro.tipo === 'salida' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {registro.tipo_display}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {registro.notas || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleEditRegistro(registro)}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
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

                    {asistenciaData.registros.length === 0 && (
                      <div className="text-center py-12">
                        <Clock className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                          No hay registros
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          No se encontraron registros para este mes
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vista Estadísticas */}
              {currentView === 'estadisticas' && estadisticas && (
                <div className="space-y-6">
                  {/* Resumen de estadísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <div className="flex items-center">
                        <CalendarDays className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Días Trabajados</p>
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{estadisticas.total_dias_trabajados}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">Horas Totales</p>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{estadisticas.total_horas}h</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Días Tarde</p>
                          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{estadisticas.dias_tarde}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                      <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-100">% Asistencia</p>
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{estadisticas.porcentaje_asistencia}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Promedios de horarios */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Promedios de Horarios
                      </h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Entrada Promedio:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {estadisticas.promedio_entrada ? formatearHora12(estadisticas.promedio_entrada) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Salida Promedio:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {estadisticas.promedio_salida ? formatearHora12(estadisticas.promedio_salida) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Días Ausente:</span>
                          <span className="font-medium text-red-600 dark:text-red-400">
                            {estadisticas.dias_ausente}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tendencia mensual */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Tendencia Mensual
                      </h5>
                      <div className="space-y-2">
                        {estadisticas.tendencia_mensual.slice(-6).map((mes) => (
                          <div key={mes.mes} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{mes.mes}:</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(mes.porcentaje, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white w-12">
                                {mes.porcentaje}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal de formulario de registro */}
        {showRegistroForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {editingRegistro ? 'Editar Registro' : 'Nuevo Registro'}
                </h3>
              </div>

              <div className="p-6 space-y-4">
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
                      empleado: empleadoId,
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
                  onClick={handleSaveRegistro}
                  disabled={!formData.fecha || !formData.hora}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingRegistro ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer />
      </div>
    </div>,
    document.body
  );
};

export default EmpleadoAsistenciaModal;