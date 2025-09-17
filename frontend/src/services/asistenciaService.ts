import api from './api';

export interface RegistroAsistencia {
  id: number;
  empleado: number;
  empleado_nombre: string;
  fecha: string;
  hora: string;
  tipo: 'entrada' | 'salida' | 'entrada_almuerzo' | 'salida_almuerzo';
  tipo_display: string;
  notas?: string;
  fecha_registro: string;
}

export interface RegistroAsistenciaCreate {
  empleado: number;
  fecha: string;
  hora: string;
  tipo: 'entrada' | 'salida' | 'entrada_almuerzo' | 'salida_almuerzo';
  notas?: string;
}

export interface ResumenAsistenciaDiaria {
  fecha: string;
  empleado_id: number;
  empleado_nombre: string;
  empleado_numero: string;
  entrada: string | null;
  salida: string | null;
  entrada_almuerzo: string | null;
  salida_almuerzo: string | null;
  horas_trabajadas: number | null;
  estado: 'presente' | 'tarde' | 'ausente' | 'parcial';
}

export interface AsistenciaStats {
  total_empleados: number;
  empleados_presentes: number;
  empleados_ausentes: number;
  empleados_tardios: number;
  porcentaje_asistencia: number;
  hora_promedio_entrada: string | null;
}

export interface ReporteAsistencia {
  empleado_id: number;
  empleado_nombre: string;
  dias_trabajados: number;
  dias_faltantes: number;
  horas_totales: number;
  porcentaje_asistencia: number;
}

export interface AsistenciaEmpleadoMes {
  empleado: {
    id: number;
    nombre: string;
    numero: string;
  };
  periodo: string;
  registros: RegistroAsistencia[];
}

export interface RegistroMasivo {
  registros: RegistroAsistenciaCreate[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const asistenciaService = {
  // CRUD básico
  async getRegistros(params?: any): Promise<PaginatedResponse<RegistroAsistencia>> {
    const response = await api.get('/empleados/api/asistencia/', { params });
    return response.data;
  },

  async getRegistro(id: number): Promise<RegistroAsistencia> {
    const response = await api.get(`/empleados/api/asistencia/${id}/`);
    return response.data;
  },

  async createRegistro(data: RegistroAsistenciaCreate): Promise<RegistroAsistencia> {
    const response = await api.post('/empleados/api/asistencia/', data);
    return response.data;
  },

  async updateRegistro(id: number, data: Partial<RegistroAsistenciaCreate>): Promise<RegistroAsistencia> {
    const response = await api.patch(`/empleados/api/asistencia/${id}/`, data);
    return response.data;
  },

  async deleteRegistro(id: number): Promise<void> {
    await api.delete(`/empleados/api/asistencia/${id}/`);
  },

  // Funciones específicas de asistencia
  async registroMasivo(data: RegistroMasivo): Promise<{ message: string; registros_creados: number }> {
    const response = await api.post('/empleados/api/asistencia/registro_masivo/', data);
    return response.data;
  },

  async getResumenDiario(fecha?: string, departamento?: number): Promise<ResumenAsistenciaDiaria[]> {
    const params: any = {};
    if (fecha) params.fecha = fecha;
    if (departamento) params.departamento = departamento;

    const response = await api.get('/empleados/api/asistencia/resumen_diario/', { params });
    return response.data;
  },

  async getEstadisticasDiarias(fecha?: string): Promise<AsistenciaStats> {
    const params: any = {};
    if (fecha) params.fecha = fecha;

    const response = await api.get('/empleados/api/asistencia/estadisticas_diarias/', { params });
    return response.data;
  },

  async getReporteAsistencia(fechaInicio: string, fechaFin: string): Promise<ReporteAsistencia[]> {
    const response = await api.get('/empleados/api/asistencia/reporte_asistencia/', {
      params: {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      }
    });
    return response.data;
  },

  async getAsistenciaEmpleadoMes(empleadoId: number, year?: number, month?: number): Promise<AsistenciaEmpleadoMes> {
    const params: any = { empleado_id: empleadoId };
    if (year) params.year = year;
    if (month) params.month = month;

    const response = await api.get('/empleados/api/asistencia/empleado_mes/', { params });
    return response.data;
  },

  // Funciones de utilidad
  async registrarEntrada(empleadoId: number, notas?: string): Promise<RegistroAsistencia> {
    const now = new Date();
    const fecha = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const hora = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM

    return this.createRegistro({
      empleado: empleadoId,
      fecha,
      hora,
      tipo: 'entrada',
      notas
    });
  },

  async registrarSalida(empleadoId: number, notas?: string): Promise<RegistroAsistencia> {
    const now = new Date();
    const fecha = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const hora = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM

    return this.createRegistro({
      empleado: empleadoId,
      fecha,
      hora,
      tipo: 'salida',
      notas
    });
  },

  async registrarSalidaAlmuerzo(empleadoId: number, notas?: string): Promise<RegistroAsistencia> {
    const now = new Date();
    const fecha = now.toISOString().split('T')[0];
    const hora = now.toTimeString().split(' ')[0].slice(0, 5);

    return this.createRegistro({
      empleado: empleadoId,
      fecha,
      hora,
      tipo: 'salida_almuerzo',
      notas
    });
  },

  async registrarEntradaAlmuerzo(empleadoId: number, notas?: string): Promise<RegistroAsistencia> {
    const now = new Date();
    const fecha = now.toISOString().split('T')[0];
    const hora = now.toTimeString().split(' ')[0].slice(0, 5);

    return this.createRegistro({
      empleado: empleadoId,
      fecha,
      hora,
      tipo: 'entrada_almuerzo',
      notas
    });
  },

  // Validaciones
  async validarRegistroDisponible(empleadoId: number, tipo: string, fecha?: string): Promise<boolean> {
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    try {
      const registros = await this.getRegistros({
        empleado: empleadoId,
        fecha: fechaConsulta,
        tipo
      });

      return registros.results.length === 0;
    } catch (error) {
      console.error('Error validando registro:', error);
      return false;
    }
  },

  // Obtener último registro del empleado para el día actual
  async getUltimoRegistroEmpleado(empleadoId: number, fecha?: string): Promise<RegistroAsistencia | null> {
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    try {
      const registros = await this.getRegistros({
        empleado: empleadoId,
        fecha: fechaConsulta,
        ordering: '-hora'
      });

      return registros.results.length > 0 ? registros.results[0] : null;
    } catch (error) {
      console.error('Error obteniendo último registro:', error);
      return null;
    }
  },

  // Obtener registros del empleado para el día
  async getRegistrosEmpleadoDia(empleadoId: number, fecha?: string): Promise<RegistroAsistencia[]> {
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    try {
      const registros = await this.getRegistros({
        empleado: empleadoId,
        fecha: fechaConsulta,
        ordering: 'hora'
      });

      return registros.results;
    } catch (error) {
      console.error('Error obteniendo registros del día:', error);
      return [];
    }
  },

  // Exportar reporte a CSV
  exportarReporteCSV(datos: ReporteAsistencia[], fechaInicio: string, fechaFin: string): void {
    const headers = [
      'Empleado ID',
      'Nombre del Empleado',
      'Días Trabajados',
      'Días Faltantes',
      'Horas Totales',
      'Porcentaje de Asistencia'
    ];

    const csvContent = [
      headers.join(','),
      ...datos.map(row => [
        row.empleado_id,
        `"${row.empleado_nombre}"`,
        row.dias_trabajados,
        row.dias_faltantes,
        row.horas_totales,
        `${row.porcentaje_asistencia}%`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_asistencia_${fechaInicio}_${fechaFin}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  // Formatear tiempo para mostrar
  formatearHora(hora: string): string {
    return hora.slice(0, 5); // HH:MM
  },

  // Calcular horas trabajadas entre dos horarios
  calcularHorasTrabajadas(entrada: string, salida: string, tiempoAlmuerzo: number = 1): number {
    const [horaEntrada, minutoEntrada] = entrada.split(':').map(Number);
    const [horaSalida, minutoSalida] = salida.split(':').map(Number);

    const minutosEntrada = horaEntrada * 60 + minutoEntrada;
    const minutosSalida = horaSalida * 60 + minutoSalida;

    const diferenciaTotalMinutos = minutosSalida - minutosEntrada;
    const horasTotales = diferenciaTotalMinutos / 60;

    return Math.max(0, horasTotales - tiempoAlmuerzo);
  },

  // Obtener estadísticas detalladas de empleado
  async obtenerEstadisticasEmpleado(empleadoId: number, mes?: number, anio?: number): Promise<any> {
    const params = new URLSearchParams({
      empleado_id: empleadoId.toString(),
      ...(mes && { mes: mes.toString() }),
      ...(anio && { anio: anio.toString() })
    });

    const response = await api.get(`/empleados/registro-asistencia/estadisticas_empleado/?${params}`);
    return response.data;
  },

  // Determinar estado del empleado basado en registros
  determinarEstadoEmpleado(registros: RegistroAsistencia[]): 'presente' | 'tarde' | 'ausente' | 'parcial' {
    if (registros.length === 0) return 'ausente';

    const entrada = registros.find(r => r.tipo === 'entrada');
    const salida = registros.find(r => r.tipo === 'salida');

    if (!entrada) return 'ausente';

    if (entrada && salida) {
      // Verificar si llegó tarde (después de las 8:00 AM)
      const horaEntrada = entrada.hora;
      const [hora] = horaEntrada.split(':').map(Number);

      if (hora > 8 || (hora === 8 && parseInt(horaEntrada.split(':')[1]) > 0)) {
        return 'tarde';
      }
      return 'presente';
    }

    return 'parcial';
  }
};