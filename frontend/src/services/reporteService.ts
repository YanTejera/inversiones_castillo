import api from './api';

interface DateRange {
  fecha_inicio?: string;
  fecha_fin?: string;
}

interface ReporteVentasParams extends DateRange {
  periodo?: 'diario' | 'semanal' | 'mensual' | 'anual';
}

interface ReporteInventarioParams {
  incluir_inactivos?: boolean;
  stock_critico?: number;
}

interface ReporteCobranzaParams extends DateRange {}

interface ReporteFinancieroParams extends DateRange {}

export const reporteService = {
  async getReporteVentas(params: ReporteVentasParams = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.periodo) queryParams.append('periodo', params.periodo);
    if (params.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
    if (params.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
    
    const response = await api.get(`/reportes/ventas-periodo/?${queryParams}`);
    return response.data;
  },

  async getReporteInventario(params: ReporteInventarioParams = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.incluir_inactivos !== undefined) {
      queryParams.append('incluir_inactivos', params.incluir_inactivos.toString());
    }
    if (params.stock_critico !== undefined) {
      queryParams.append('stock_critico', params.stock_critico.toString());
    }
    
    const response = await api.get(`/reportes/inventario/?${queryParams}`);
    return response.data;
  },

  async getReporteCobranza(params: ReporteCobranzaParams = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
    if (params.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
    
    const response = await api.get(`/reportes/cobranza/?${queryParams}`);
    return response.data;
  },

  async getReporteFinanciero(params: ReporteFinancieroParams = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
    if (params.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
    
    const response = await api.get(`/reportes/financiero/?${queryParams}`);
    return response.data;
  },

  // Función auxiliar para exportar a PDF (implementación futura)
  async exportToPDF(reportType: string, params: any = {}) {
    // Esta función se implementará cuando se agregue la funcionalidad de PDF
    console.log(`Exportando ${reportType} a PDF con parámetros:`, params);
    throw new Error('Funcionalidad de exportación PDF no implementada aún');
  },

  // Función auxiliar para formatear fechas
  formatDate(date: string | Date): string {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString().split('T')[0];
  },

  // Función auxiliar para formatear montos
  formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  },

  // Función auxiliar para formatear porcentajes
  formatPercentage(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(1)}%`;
  }
};