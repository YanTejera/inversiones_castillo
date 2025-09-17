import api from './api';

// Types
export interface CommissionScheme {
  id: number;
  nombre: string;
  descripcion: string;
  tipo_esquema: 'porcentaje_venta' | 'porcentaje_utilidad' | 'monto_fijo' | 'escalado' | 'mixto';
  porcentaje_base: number;
  monto_fijo: number;
  incluye_financiamiento: boolean;
  porcentaje_financiamiento: number;
  aplica_modelos: number[];
  monto_minimo_venta: number;
  monto_maximo_venta?: number;
  activo: boolean;
  fecha_inicio: string;
  fecha_fin?: string;
  fecha_creacion: string;
  creado_por: number;
  creado_por_nombre: string;
  tramos?: CommissionTier[];
}

export interface CommissionTier {
  id: number;
  desde_unidades: number;
  hasta_unidades?: number;
  desde_monto: number;
  hasta_monto?: number;
  porcentaje: number;
  monto_fijo: number;
}

export interface CommissionAssignment {
  id: number;
  vendedor: number;
  vendedor_nombre: string;
  esquema: number;
  esquema_nombre: string;
  fecha_inicio: string;
  fecha_fin?: string;
  activa: boolean;
  porcentaje_personalizado?: number;
  fecha_creacion: string;
  creado_por: number;
  creado_por_nombre: string;
}

export interface CalculatedCommission {
  id: number;
  venta: number;
  venta_numero: string;
  vendedor: number;
  vendedor_nombre: string;
  esquema_aplicado: number;
  esquema_nombre: string;
  cliente_nombre: string;
  monto_venta: number;
  monto_utilidad: number;
  porcentaje_aplicado: number;
  comision_venta: number;
  comision_financiamiento: number;
  comision_total: number;
  estado: 'calculada' | 'aprobada' | 'pagada' | 'retenida' | 'anulada';
  fecha_calculo: string;
  fecha_aprobacion?: string;
  fecha_pago?: string;
  numero_pago?: string;
  observaciones?: string;
  aprobada_por?: number;
  aprobada_por_nombre?: string;
  pagada_por?: number;
  pagada_por_nombre?: string;
}

export interface SalesGoal {
  id: number;
  vendedor: number;
  vendedor_nombre: string;
  periodo: 'mensual' | 'trimestral' | 'semestral' | 'anual';
  ano: number;
  mes?: number;
  meta_unidades: number;
  meta_monto: number;
  bonificacion_cumplimiento: number;
  bonificacion_sobrecumplimiento: number;
  fecha_creacion: string;
  creado_por: number;
  creado_por_nombre: string;
  // Campos calculados
  progreso_unidades?: number;
  progreso_monto?: number;
  porcentaje_cumplimiento_unidades?: number;
  porcentaje_cumplimiento_monto?: number;
}

export interface CommissionSummary {
  vendedor_id: number;
  vendedor_nombre: string;
  periodo_inicio: string;
  periodo_fin: string;
  total_ventas: number;
  total_monto_ventas: number;
  total_comisiones: number;
  comision_ventas: number;
  comision_financiamiento: number;
  bonificaciones: number;
  comisiones_calculadas: number;
  comisiones_aprobadas: number;
  comisiones_pagadas: number;
  comisiones_pendientes: number;
}

export interface CommissionStats {
  resumen: {
    total_comisiones: number;
    monto_total: number;
    monto_promedio: number;
  };
  por_estado: Array<{
    estado: string;
    cantidad: number;
    monto: number;
  }>;
  top_vendedores: Array<{
    vendedor__first_name: string;
    vendedor__last_name: string;
    total_comisiones: number;
    total_ventas: number;
  }>;
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
}

class CommissionsService {
  // Esquemas de comisión
  async getCommissionSchemes(): Promise<CommissionScheme[]> {
    const response = await api.get('/financiamiento/esquemas-comision/');
    return response.data.results || response.data;
  }

  async getCommissionScheme(id: number): Promise<CommissionScheme> {
    const response = await api.get(`/financiamiento/esquemas-comision/${id}/`);
    return response.data;
  }

  async createCommissionScheme(data: Partial<CommissionScheme>): Promise<CommissionScheme> {
    const response = await api.post('/financiamiento/esquemas-comision/', data);
    return response.data;
  }

  async updateCommissionScheme(id: number, data: Partial<CommissionScheme>): Promise<CommissionScheme> {
    const response = await api.put(`/financiamiento/esquemas-comision/${id}/`, data);
    return response.data;
  }

  async deleteCommissionScheme(id: number): Promise<void> {
    await api.delete(`/financiamiento/esquemas-comision/${id}/`);
  }

  // Asignaciones de comisión
  async getCommissionAssignments(filters?: any): Promise<CommissionAssignment[]> {
    const params = new URLSearchParams(filters || {});
    const response = await api.get(`/financiamiento/asignaciones-comision/?${params}`);
    return response.data.results || response.data;
  }

  async createCommissionAssignment(data: Partial<CommissionAssignment>): Promise<CommissionAssignment> {
    const response = await api.post('/financiamiento/asignaciones-comision/', data);
    return response.data;
  }

  async updateCommissionAssignment(id: number, data: Partial<CommissionAssignment>): Promise<CommissionAssignment> {
    const response = await api.put(`/financiamiento/asignaciones-comision/${id}/`, data);
    return response.data;
  }

  // Comisiones calculadas
  async getCalculatedCommissions(filters?: any): Promise<CalculatedCommission[]> {
    const params = new URLSearchParams(filters || {});
    const response = await api.get(`/financiamiento/comisiones/?${params}`);
    return response.data.results || response.data;
  }

  async calculateCommissionForSale(saleId: number): Promise<CalculatedCommission> {
    const response = await api.post(`/financiamiento/ventas/${saleId}/calcular-comision/`);
    return response.data;
  }

  async approveCommission(id: number, observations?: string): Promise<CalculatedCommission> {
    const response = await api.post(`/financiamiento/comisiones/${id}/aprobar/`, {
      observaciones: observations
    });
    return response.data;
  }

  async payCommission(id: number, paymentNumber: string, observations?: string): Promise<CalculatedCommission> {
    const response = await api.post(`/financiamiento/comisiones/${id}/pagar/`, {
      numero_pago: paymentNumber,
      observaciones: observations
    });
    return response.data;
  }

  // Metas de vendedores
  async getSalesGoals(filters?: any): Promise<SalesGoal[]> {
    const params = new URLSearchParams(filters || {});
    const response = await api.get(`/financiamiento/metas/?${params}`);
    return response.data.results || response.data;
  }

  async createSalesGoal(data: Partial<SalesGoal>): Promise<SalesGoal> {
    const response = await api.post('/financiamiento/metas/', data);
    return response.data;
  }

  async updateSalesGoal(id: number, data: Partial<SalesGoal>): Promise<SalesGoal> {
    const response = await api.put(`/financiamiento/metas/${id}/`, data);
    return response.data;
  }

  // Resúmenes y estadísticas
  async getCommissionSummary(sellerId: number, dateRange?: { fecha_inicio?: string; fecha_fin?: string }): Promise<CommissionSummary> {
    const params = new URLSearchParams(dateRange || {});
    const response = await api.get(`/financiamiento/vendedores/${sellerId}/resumen-comisiones/?${params}`);
    return response.data;
  }

  async getCommissionStats(dateRange?: { fecha_inicio?: string; fecha_fin?: string }): Promise<CommissionStats> {
    const params = new URLSearchParams(dateRange || {});
    const response = await api.get(`/financiamiento/estadisticas-comisiones/?${params}`);
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

  getSchemeTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'porcentaje_venta': 'Porcentaje sobre Venta',
      'porcentaje_utilidad': 'Porcentaje sobre Utilidad',
      'monto_fijo': 'Monto Fijo',
      'escalado': 'Escalado por Metas',
      'mixto': 'Mixto'
    };
    return labels[type] || type;
  }

  getCommissionStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'calculada': 'bg-blue-100 text-blue-800 border-blue-200',
      'aprobada': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'pagada': 'bg-green-100 text-green-800 border-green-200',
      'retenida': 'bg-orange-100 text-orange-800 border-orange-200',
      'anulada': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getCommissionStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'calculada': 'Calculada',
      'aprobada': 'Aprobada',
      'pagada': 'Pagada',
      'retenida': 'Retenida',
      'anulada': 'Anulada'
    };
    return labels[status] || status;
  }

  getPeriodLabel(period: string): string {
    const labels: Record<string, string> = {
      'mensual': 'Mensual',
      'trimestral': 'Trimestral',
      'semestral': 'Semestral',
      'anual': 'Anual'
    };
    return labels[period] || period;
  }

  calculateProgress(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-blue-500';
    return 'bg-red-500';
  }
}

export const commissionsService = new CommissionsService();