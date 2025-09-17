import api from './api';

export interface SolicitudTiempo {
  id: number;
  empleado: number;
  empleado_nombre: string;
  tipo: 'vacaciones' | 'enfermedad' | 'personal' | 'maternidad' | 'duelo' | 'compensatorio';
  tipo_display: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_solicitados: number;
  motivo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  estado_display: string;
  aprobada_por: number | null;
  aprobada_por_nombre: string | null;
  fecha_aprobacion: string | null;
  comentarios_aprobacion: string;
  documento_soporte: string | null;
  fecha_solicitud: string;
}

export interface SolicitudTiempoCreate {
  empleado: number;
  tipo: 'vacaciones' | 'enfermedad' | 'personal' | 'maternidad' | 'duelo' | 'compensatorio';
  fecha_inicio: string;
  fecha_fin: string;
  dias_solicitados: number;
  motivo: string;
}

export interface SolicitudAprobacion {
  comentarios: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const solicitudesService = {
  // CRUD básico
  async getSolicitudes(params?: any): Promise<PaginatedResponse<SolicitudTiempo>> {
    const response = await api.get('/empleados/api/solicitudes-tiempo/', { params });
    return response.data;
  },

  async getSolicitud(id: number): Promise<SolicitudTiempo> {
    const response = await api.get(`/empleados/api/solicitudes-tiempo/${id}/`);
    return response.data;
  },

  async createSolicitud(data: SolicitudTiempoCreate): Promise<SolicitudTiempo> {
    const response = await api.post('/empleados/api/solicitudes-tiempo/', data);
    return response.data;
  },

  async updateSolicitud(id: number, data: Partial<SolicitudTiempoCreate>): Promise<SolicitudTiempo> {
    const response = await api.patch(`/empleados/api/solicitudes-tiempo/${id}/`, data);
    return response.data;
  },

  async deleteSolicitud(id: number): Promise<void> {
    await api.delete(`/empleados/api/solicitudes-tiempo/${id}/`);
  },

  // CRUD with file support
  async createSolicitudWithFile(data: SolicitudTiempoCreate, file?: File): Promise<SolicitudTiempo> {
    const formData = new FormData();
    formData.append('empleado', data.empleado.toString());
    formData.append('tipo', data.tipo);
    formData.append('fecha_inicio', data.fecha_inicio);
    formData.append('fecha_fin', data.fecha_fin);
    formData.append('dias_solicitados', data.dias_solicitados.toString());
    formData.append('motivo', data.motivo);

    if (file) {
      formData.append('documento_soporte', file);
    }

    const response = await api.post('/empleados/api/solicitudes-tiempo/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateSolicitudWithFile(id: number, data: Partial<SolicitudTiempoCreate>, file?: File): Promise<SolicitudTiempo> {
    const formData = new FormData();

    if (data.empleado) formData.append('empleado', data.empleado.toString());
    if (data.tipo) formData.append('tipo', data.tipo);
    if (data.fecha_inicio) formData.append('fecha_inicio', data.fecha_inicio);
    if (data.fecha_fin) formData.append('fecha_fin', data.fecha_fin);
    if (data.dias_solicitados) formData.append('dias_solicitados', data.dias_solicitados.toString());
    if (data.motivo) formData.append('motivo', data.motivo);

    if (file) {
      formData.append('documento_soporte', file);
    }

    const response = await api.patch(`/empleados/api/solicitudes-tiempo/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Acciones de aprobación
  async aprobarSolicitud(id: number, data: SolicitudAprobacion): Promise<SolicitudTiempo> {
    const response = await api.post(`/empleados/api/solicitudes-tiempo/${id}/aprobar/`, data);
    return response.data;
  },

  async rechazarSolicitud(id: number, data: SolicitudAprobacion): Promise<SolicitudTiempo> {
    const response = await api.post(`/empleados/api/solicitudes-tiempo/${id}/rechazar/`, data);
    return response.data;
  },

  // Filtros específicos
  async getSolicitudesPendientes(): Promise<SolicitudTiempo[]> {
    const response = await api.get('/empleados/api/solicitudes-tiempo/pendientes/');
    return response.data;
  },

  async getSolicitudesEmpleado(empleadoId: number, params?: any): Promise<SolicitudTiempo[]> {
    const response = await api.get('/empleados/api/solicitudes-tiempo/', {
      params: { empleado: empleadoId, ...params }
    });
    return response.data.results;
  },

  // Utilidades
  calcularDiasSolicitados(fechaInicio: string, fechaFin: string): number {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir el día de inicio
    return diffDays;
  },

  validarFechas(fechaInicio: string, fechaFin: string): string[] {
    const errores: string[] = [];
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (inicio < hoy) {
      errores.push('La fecha de inicio no puede ser anterior a hoy');
    }

    if (fin < inicio) {
      errores.push('La fecha de fin no puede ser anterior a la fecha de inicio');
    }

    // Validar que no sea más de 1 año en el futuro
    const unAnoFuturo = new Date();
    unAnoFuturo.setFullYear(unAnoFuturo.getFullYear() + 1);

    if (inicio > unAnoFuturo) {
      errores.push('La fecha de inicio no puede ser más de un año en el futuro');
    }

    return errores;
  },

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  obtenerColorEstado(estado: string): { bg: string; text: string } {
    switch (estado) {
      case 'pendiente':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
      case 'aprobada':
        return { bg: 'bg-green-100', text: 'text-green-800' };
      case 'rechazada':
        return { bg: 'bg-red-100', text: 'text-red-800' };
      case 'cancelada':
        return { bg: 'bg-gray-100', text: 'text-gray-800' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800' };
    }
  },

  obtenerIconoTipo(tipo: string): string {
    switch (tipo) {
      case 'vacaciones':
        return '🏖️';
      case 'enfermedad':
        return '🏥';
      case 'personal':
        return '👤';
      case 'maternidad':
        return '👶';
      case 'duelo':
        return '🕊️';
      case 'compensatorio':
        return '⏰';
      default:
        return '📅';
    }
  }
};