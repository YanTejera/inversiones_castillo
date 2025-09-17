import api from './api';

// Types
export interface FinancialEntity {
  id: number;
  nombre: string;
  tipo: string;
  logo?: string;
  tasa_minima: number;
  tasa_maxima: number;
  plazo_minimo: number;
  plazo_maximo: number;
  monto_minimo: number;
  monto_maximo: number;
  requiere_inicial: boolean;
  porcentaje_inicial_minimo: number;
  contacto_nombre?: string;
  contacto_telefono?: string;
  contacto_email?: string;
  activa: boolean;
  tipos_credito: CreditType[];
}

export interface CreditType {
  id: number;
  nombre: string;
  descripcion: string;
  tasa_interes: number;
  plazo_maximo: number;
  score_minimo_requerido: number;
  ingresos_minimos: number;
  activo: boolean;
}

export interface CreditApplication {
  id?: number;
  numero_solicitud?: string;
  cliente: number;
  cliente_nombre?: string;
  cliente_cedula?: string;
  venta: number;
  venta_numero?: string;
  entidad_financiera: number;
  entidad_nombre?: string;
  tipo_credito: number;
  vendedor: number;
  vendedor_nombre?: string;
  monto_solicitado: number;
  monto_inicial: number;
  plazo_meses: number;
  monto_aprobado?: number;
  tasa_aprobada?: number;
  cuota_mensual?: number;
  plazo_aprobado?: number;
  estado: string;
  fecha_solicitud?: string;
  fecha_envio?: string;
  fecha_respuesta?: string;
  fecha_desembolso?: string;
  numero_credito_externo?: string;
  observaciones?: string;
  motivo_rechazo?: string;
  condiciones_aprobacion?: string;
  documentos?: CreditDocument[];
  historial?: CreditHistory[];
  monto_financiar?: number;
  porcentaje_inicial?: number;
}

export interface CreditDocument {
  id?: number;
  tipo: string;
  nombre: string;
  archivo: File | string;
  obligatorio: boolean;
  estado_validacion: string;
  observaciones_validacion?: string;
  fecha_subida?: string;
  usuario_subida?: number;
  usuario_subida_nombre?: string;
}

export interface CreditHistory {
  id: number;
  estado_anterior: string;
  estado_nuevo: string;
  usuario: number;
  usuario_nombre: string;
  observaciones: string;
  fecha: string;
}

export interface LoanCalculation {
  cuota_mensual: number;
  total_intereses: number;
  total_pagar: number;
  resumen: {
    monto_vehiculo: number;
    inicial: number;
    monto_financiar: number;
    plazo_meses: number;
    tasa_anual: number;
    tasa_mensual: number;
  };
  tabla_amortizacion: AmortizationRow[];
}

export interface AmortizationRow {
  mes: number;
  cuota: number;
  capital: number;
  interes: number;
  saldo: number;
}

export interface LoanParams {
  monto: number;
  inicial: number;
  tasa: number;
  plazo: number;
}

export interface FinancingStats {
  resumen: {
    total_solicitudes: number;
    aprobadas: number;
    rechazadas: number;
    en_proceso: number;
    monto_total_solicitado: number;
    monto_aprobado: number;
    tasa_aprobacion: number;
  };
  por_entidad: Array<{
    entidad_financiera__nombre: string;
    total: number;
    aprobadas: number;
    monto_total: number;
  }>;
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
}

class FinancingService {
  // Entidades financieras
  async getFinancialEntities(): Promise<FinancialEntity[]> {
    const response = await api.get('/financiamiento/entidades/');
    return response.data;
  }

  // Calculadora de crédito
  async calculateLoan(params: LoanParams): Promise<LoanCalculation> {
    const response = await api.post('/financiamiento/calculadora/', params);
    return response.data;
  }

  // Solicitudes de crédito
  async getCreditApplications(filters?: any): Promise<CreditApplication[]> {
    const params = new URLSearchParams(filters || {});
    const response = await api.get(`/financiamiento/solicitudes/?${params}`);
    return response.data.results || response.data;
  }

  async getCreditApplication(id: number): Promise<CreditApplication> {
    const response = await api.get(`/financiamiento/solicitudes/${id}/`);
    return response.data;
  }

  async createCreditApplication(data: Partial<CreditApplication>): Promise<CreditApplication> {
    const response = await api.post('/financiamiento/solicitudes/', data);
    return response.data;
  }

  async updateCreditApplication(id: number, data: Partial<CreditApplication>): Promise<CreditApplication> {
    const response = await api.put(`/financiamiento/solicitudes/${id}/`, data);
    return response.data;
  }

  async deleteCreditApplication(id: number): Promise<void> {
    await api.delete(`/financiamiento/solicitudes/${id}/`);
  }

  // Procesar solicitudes
  async processCreditApplication(id: number): Promise<any> {
    const response = await api.post(`/financiamiento/solicitudes/${id}/procesar/`);
    return response.data;
  }

  async updateApplicationStatus(id: number, status: string, observations?: string): Promise<any> {
    const response = await api.post(`/financiamiento/solicitudes/${id}/actualizar-estado/`, {
      estado: status,
      observaciones: observations
    });
    return response.data;
  }

  // Documentos
  async uploadDocument(applicationId: number, file: File, type: string, name: string): Promise<CreditDocument> {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tipo', type);
    formData.append('nombre', name);
    
    const response = await api.post(
      `/financiamiento/solicitudes/${applicationId}/documentos/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }

  async getApplicationDocuments(applicationId: number): Promise<CreditDocument[]> {
    const response = await api.get(`/financiamiento/solicitudes/${applicationId}/documentos/`);
    return response.data;
  }

  // Estadísticas
  async getFinancingStats(dateRange?: { fecha_inicio?: string; fecha_fin?: string }): Promise<FinancingStats> {
    const params = new URLSearchParams(dateRange || {});
    const response = await api.get(`/financiamiento/estadisticas/?${params}`);
    return response.data;
  }

  // Utilidades
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'borrador': 'bg-gray-100 text-gray-800 border-gray-200',
      'enviada': 'bg-blue-100 text-blue-800 border-blue-200',
      'en_evaluacion': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'documentos_pendientes': 'bg-orange-100 text-orange-800 border-orange-200',
      'aprobada': 'bg-green-100 text-green-800 border-green-200',
      'aprobada_condicionada': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'rechazada': 'bg-red-100 text-red-800 border-red-200',
      'desembolsada': 'bg-purple-100 text-purple-800 border-purple-200',
      'cancelada': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'borrador': 'Borrador',
      'enviada': 'Enviada',
      'en_evaluacion': 'En Evaluación',
      'documentos_pendientes': 'Documentos Pendientes',
      'aprobada': 'Aprobada',
      'aprobada_condicionada': 'Aprobada con Condiciones',
      'rechazada': 'Rechazada',
      'desembolsada': 'Desembolsada',
      'cancelada': 'Cancelada'
    };
    return labels[status] || status;
  }

  getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'cedula': 'Cédula de Ciudadanía',
      'ingresos': 'Certificado de Ingresos',
      'laborales': 'Certificado Laboral',
      'bancarios': 'Referencias Bancarias',
      'comerciales': 'Referencias Comerciales',
      'familiares': 'Referencias Familiares',
      'centrales_riesgo': 'Centrales de Riesgo',
      'autorizacion_debito': 'Autorización Débito Automático',
      'pagare': 'Pagaré',
      'otros': 'Otros'
    };
    return labels[type] || type;
  }

  getValidationStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'validado': 'bg-green-100 text-green-800',
      'rechazado': 'bg-red-100 text-red-800',
      'requiere_correccion': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
}

export const financingService = new FinancingService();