import api from './api';

export interface Departamento {
  id: number;
  nombre: string;
  descripcion: string;
  presupuesto_mensual: number | null;
  activo: boolean;
  fecha_creacion: string;
  empleados_count: number;
}

export interface Posicion {
  id: number;
  titulo: string;
  departamento: number;
  departamento_nombre: string;
  descripcion: string;
  salario_minimo: number;
  salario_maximo: number;
  activa: boolean;
  fecha_creacion: string;
  empleados_count: number;
}

export interface Empleado {
  id: number;
  numero_empleado: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  cedula: string;
  fecha_nacimiento: string;
  telefono: string;
  telefono_emergencia?: string;
  email: string;
  direccion: string;
  posicion: number;
  posicion_titulo: string;
  departamento_nombre: string;
  fecha_ingreso: string;
  fecha_terminacion?: string;
  salario_base: number;
  tipo_contrato: string;
  estado: string;
  supervisor?: number;
  supervisor_nombre?: string;
  foto?: string;
  notas?: string;
  dias_vacaciones_anuales: number;
  dias_enfermedad_anuales: number;
  antiguedad_anos: number;
  dias_vacaciones_disponibles: number;
  dias_enfermedad_disponibles: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface EmpleadoList {
  id: number;
  numero_empleado: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  posicion_titulo: string;
  departamento_nombre: string;
  estado: string;
  salario_base: number;
  fecha_ingreso: string;
  foto?: string;
}

export interface SolicitudTiempo {
  id: number;
  empleado: number;
  empleado_nombre: string;
  tipo: string;
  tipo_display: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_solicitados: number;
  motivo: string;
  estado: string;
  estado_display: string;
  aprobada_por?: number;
  aprobada_por_nombre?: string;
  fecha_aprobacion?: string;
  comentarios_aprobacion?: string;
  fecha_solicitud: string;
}

export interface RegistroAsistencia {
  id: number;
  empleado: number;
  empleado_nombre: string;
  fecha: string;
  hora: string;
  tipo: string;
  tipo_display: string;
  notas?: string;
  fecha_registro: string;
}

export interface Nomina {
  id: number;
  empleado: number;
  empleado_nombre: string;
  periodo: string;
  periodo_display: string;
  fecha_inicio: string;
  fecha_fin: string;
  año: number;
  mes: number;
  salario_base: number;
  horas_extras: number;
  bonificaciones: number;
  comisiones: number;
  otros_ingresos: number;
  impuesto_renta: number;
  seguro_social: number;
  afp: number;
  seguro_medico: number;
  prestamos: number;
  otras_deducciones: number;
  total_ingresos: number;
  total_deducciones: number;
  salario_neto: number;
  estado: string;
  estado_display: string;
  fecha_calculo?: string;
  fecha_aprobacion?: string;
  fecha_pago?: string;
}

export interface DocumentoEmpleado {
  id: number;
  empleado: number;
  empleado_nombre: string;
  tipo: string;
  tipo_display: string;
  nombre: string;
  archivo: string;
  descripcion?: string;
  fecha_vencimiento?: string;
  esta_vencido: boolean;
  vence_pronto: boolean;
  fecha_subida: string;
}

export interface EvaluacionDesempeno {
  id: number;
  empleado: number;
  empleado_nombre: string;
  evaluador: number;
  evaluador_nombre: string;
  periodo: string;
  periodo_display: string;
  fecha_evaluacion: string;
  fecha_inicio_periodo: string;
  fecha_fin_periodo: string;
  calidad_trabajo: number;
  puntualidad: number;
  comunicacion: number;
  trabajo_equipo: number;
  iniciativa: number;
  puntuacion_promedio: number;
  calificacion_text: string;
  fortalezas: string;
  areas_mejora: string;
  objetivos_siguientes: string;
  comentarios_empleado?: string;
}

export interface EmpleadoStats {
  total_empleados: number;
  empleados_activos: number;
  empleados_inactivos: number;
  empleados_nuevos_mes: number;
  promedio_antiguedad: number;
  total_departamentos: number;
  gasto_nomina_mes: number;
}

export interface DepartamentoStats {
  departamento: string;
  total_empleados: number;
  promedio_salario: number;
  gasto_total: number;
}

export interface AsistenciaReporte {
  empleado_id: number;
  empleado_nombre: string;
  dias_trabajados: number;
  dias_faltantes: number;
  horas_totales: number;
  porcentaje_asistencia: number;
}

// Departamentos
export const departamentoService = {
  async getDepartamentos(params?: any): Promise<{ results: Departamento[], count: number }> {
    const response = await api.get('/empleados/api/departamentos/', { params });
    return response.data;
  },

  async getDepartamento(id: number): Promise<Departamento> {
    const response = await api.get(`/empleados/api/departamentos/${id}/`);
    return response.data;
  },

  async createDepartamento(data: Partial<Departamento>): Promise<Departamento> {
    const response = await api.post('/empleados/api/departamentos/', data);
    return response.data;
  },

  async updateDepartamento(id: number, data: Partial<Departamento>): Promise<Departamento> {
    const response = await api.put(`/empleados/api/departamentos/${id}/`, data);
    return response.data;
  },

  async deleteDepartamento(id: number): Promise<void> {
    await api.delete(`/empleados/api/departamentos/${id}/`);
  }
};

// Posiciones
export const posicionService = {
  async getPosiciones(params?: any): Promise<{ results: Posicion[], count: number }> {
    const response = await api.get('/empleados/api/posiciones/', { params });
    return response.data;
  },

  async getPosicion(id: number): Promise<Posicion> {
    const response = await api.get(`/empleados/api/posiciones/${id}/`);
    return response.data;
  },

  async createPosicion(data: Partial<Posicion>): Promise<Posicion> {
    const response = await api.post('/empleados/api/posiciones/', data);
    return response.data;
  },

  async updatePosicion(id: number, data: Partial<Posicion>): Promise<Posicion> {
    const response = await api.put(`/empleados/api/posiciones/${id}/`, data);
    return response.data;
  },

  async deletePosicion(id: number): Promise<void> {
    await api.delete(`/empleados/api/posiciones/${id}/`);
  }
};

// Empleados
export const empleadoService = {
  async getEmpleados(params?: any): Promise<{ results: EmpleadoList[], count: number }> {
    const response = await api.get('/empleados/api/empleados/', { params });
    return response.data;
  },

  async getEmpleado(id: number): Promise<Empleado> {
    const response = await api.get(`/empleados/api/empleados/${id}/`);
    return response.data;
  },

  async createEmpleado(data: FormData | Partial<Empleado>): Promise<Empleado> {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const response = await api.post('/empleados/api/empleados/', data, { headers });
    return response.data;
  },

  async updateEmpleado(id: number, data: FormData | Partial<Empleado>): Promise<Empleado> {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const response = await api.put(`/empleados/api/empleados/${id}/`, data, { headers });
    return response.data;
  },

  async deleteEmpleado(id: number): Promise<void> {
    await api.delete(`/empleados/api/empleados/${id}/`);
  },

  async getEstadisticas(): Promise<EmpleadoStats> {
    const response = await api.get('/empleados/api/empleados/estadisticas/');
    return response.data;
  },

  async getEstadisticasPorDepartamento(): Promise<DepartamentoStats[]> {
    const response = await api.get('/empleados/api/empleados/por_departamento/');
    return response.data;
  },

  async getHistorialNominas(empleadoId: number): Promise<Nomina[]> {
    const response = await api.get(`/empleados/api/empleados/${empleadoId}/historial_nominas/`);
    return response.data;
  },

  async getSolicitudesTiempo(empleadoId: number): Promise<SolicitudTiempo[]> {
    const response = await api.get(`/empleados/api/empleados/${empleadoId}/solicitudes_tiempo/`);
    return response.data;
  }
};

// Solicitudes de tiempo
export const solicitudTiempoService = {
  async getSolicitudes(params?: any): Promise<{ results: SolicitudTiempo[], count: number }> {
    const response = await api.get('/empleados/api/solicitudes-tiempo/', { params });
    return response.data;
  },

  async getSolicitud(id: number): Promise<SolicitudTiempo> {
    const response = await api.get(`/empleados/api/solicitudes-tiempo/${id}/`);
    return response.data;
  },

  async createSolicitud(data: Partial<SolicitudTiempo>): Promise<SolicitudTiempo> {
    const response = await api.post('/empleados/api/solicitudes-tiempo/', data);
    return response.data;
  },

  async updateSolicitud(id: number, data: Partial<SolicitudTiempo>): Promise<SolicitudTiempo> {
    const response = await api.put(`/empleados/api/solicitudes-tiempo/${id}/`, data);
    return response.data;
  },

  async deleteSolicitud(id: number): Promise<void> {
    await api.delete(`/empleados/api/solicitudes-tiempo/${id}/`);
  },

  async aprobar(id: number, comentarios?: string): Promise<SolicitudTiempo> {
    const response = await api.post(`/empleados/api/solicitudes-tiempo/${id}/aprobar/`, {
      comentarios: comentarios || ''
    });
    return response.data;
  },

  async rechazar(id: number, comentarios?: string): Promise<SolicitudTiempo> {
    const response = await api.post(`/empleados/api/solicitudes-tiempo/${id}/rechazar/`, {
      comentarios: comentarios || ''
    });
    return response.data;
  },

  async getPendientes(): Promise<SolicitudTiempo[]> {
    const response = await api.get('/empleados/api/solicitudes-tiempo/pendientes/');
    return response.data;
  }
};

// Asistencia
export const asistenciaService = {
  async getRegistros(params?: any): Promise<{ results: RegistroAsistencia[], count: number }> {
    const response = await api.get('/empleados/api/asistencia/', { params });
    return response.data;
  },

  async createRegistro(data: Partial<RegistroAsistencia>): Promise<RegistroAsistencia> {
    const response = await api.post('/empleados/api/asistencia/', data);
    return response.data;
  },

  async getReporteAsistencia(fechaInicio: string, fechaFin: string): Promise<AsistenciaReporte[]> {
    const response = await api.get('/empleados/api/asistencia/reporte_asistencia/', {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
    });
    return response.data;
  }
};

// Nóminas
export const nominaService = {
  async getNominas(params?: any): Promise<{ results: Nomina[], count: number }> {
    const response = await api.get('/empleados/api/nominas/', { params });
    return response.data;
  },

  async getNomina(id: number): Promise<Nomina> {
    const response = await api.get(`/empleados/api/nominas/${id}/`);
    return response.data;
  },

  async createNomina(data: Partial<Nomina>): Promise<Nomina> {
    const response = await api.post('/empleados/api/nominas/', data);
    return response.data;
  },

  async updateNomina(id: number, data: Partial<Nomina>): Promise<Nomina> {
    const response = await api.put(`/empleados/api/nominas/${id}/`, data);
    return response.data;
  },

  async calcular(id: number): Promise<Nomina> {
    const response = await api.post(`/empleados/api/nominas/${id}/calcular/`);
    return response.data;
  },

  async aprobar(id: number): Promise<Nomina> {
    const response = await api.post(`/empleados/api/nominas/${id}/aprobar/`);
    return response.data;
  },

  async marcarPagada(id: number): Promise<Nomina> {
    const response = await api.post(`/empleados/api/nominas/${id}/marcar_pagada/`);
    return response.data;
  },

  async generarNominasMes(año: number, mes: number, periodo: string = 'mensual'): Promise<any> {
    const response = await api.post('/empleados/api/nominas/generar_nominas_mes/', {
      año, mes, periodo
    });
    return response.data;
  }
};

// Documentos
export const documentoService = {
  async getDocumentos(params?: any): Promise<{ results: DocumentoEmpleado[], count: number }> {
    const response = await api.get('/empleados/api/documentos/', { params });
    return response.data;
  },

  async createDocumento(data: FormData): Promise<DocumentoEmpleado> {
    const response = await api.post('/empleados/api/documentos/', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async deleteDocumento(id: number): Promise<void> {
    await api.delete(`/empleados/api/documentos/${id}/`);
  },

  async getVencidos(): Promise<DocumentoEmpleado[]> {
    const response = await api.get('/empleados/api/documentos/vencidos/');
    return response.data;
  },

  async getPorVencer(): Promise<DocumentoEmpleado[]> {
    const response = await api.get('/empleados/api/documentos/por_vencer/');
    return response.data;
  }
};

// Evaluaciones
export const evaluacionService = {
  async getEvaluaciones(params?: any): Promise<{ results: EvaluacionDesempeno[], count: number }> {
    const response = await api.get('/empleados/api/evaluaciones/', { params });
    return response.data;
  },

  async getEvaluacion(id: number): Promise<EvaluacionDesempeno> {
    const response = await api.get(`/empleados/api/evaluaciones/${id}/`);
    return response.data;
  },

  async createEvaluacion(data: Partial<EvaluacionDesempeno>): Promise<EvaluacionDesempeno> {
    const response = await api.post('/empleados/api/evaluaciones/', data);
    return response.data;
  },

  async updateEvaluacion(id: number, data: Partial<EvaluacionDesempeno>): Promise<EvaluacionDesempeno> {
    const response = await api.put(`/empleados/api/evaluaciones/${id}/`, data);
    return response.data;
  },

  async getPromedioPorEmpleado(empleadoId: number): Promise<any> {
    const response = await api.get('/empleados/api/evaluaciones/promedio_por_empleado/', {
      params: { empleado_id: empleadoId }
    });
    return response.data;
  }
};

// Función de utilidad para formatear moneda
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Función de utilidad para formatear fechas
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-DO');
};

// Función de utilidad para calcular días entre fechas
export const calcularDias = (fechaInicio: string, fechaFin: string): number => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diferencia = fin.getTime() - inicio.getTime();
  return Math.ceil(diferencia / (1000 * 3600 * 24)) + 1;
};