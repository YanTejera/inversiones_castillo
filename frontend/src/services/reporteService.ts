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

  // Función para exportar reportes a PDF
  async exportToPDF(reportType: string, params: any = {}) {
    let endpoint = '';
    let queryParams = new URLSearchParams();
    
    // Configurar endpoint según tipo de reporte
    switch (reportType) {
      case 'ventas-periodo':
        endpoint = '/reportes/ventas-periodo/';
        if (params.periodo) queryParams.append('periodo', params.periodo);
        if (params.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
        if (params.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
        break;
      case 'inventario':
        endpoint = '/reportes/inventario/';
        if (params.incluir_inactivos !== undefined) {
          queryParams.append('incluir_inactivos', params.incluir_inactivos.toString());
        }
        if (params.stock_critico !== undefined) {
          queryParams.append('stock_critico', params.stock_critico.toString());
        }
        break;
      case 'cobranza':
        endpoint = '/reportes/cobranza/';
        if (params.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
        if (params.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
        break;
      case 'financiero':
        endpoint = '/reportes/financiero/';
        if (params.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
        if (params.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
        break;
      default:
        throw new Error(`Tipo de reporte no válido: ${reportType}`);
    }
    
    // Realizar petición POST para generar PDF
    const response = await api.post(`${endpoint}?${queryParams}`, {}, {
      responseType: 'blob'
    });
    
    // Crear URL para descarga
    const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    // Crear enlace de descarga automática
    const link = document.createElement('a');
    link.href = url;
    link.download = this.generatePDFFilename(reportType, params);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  
  // Función auxiliar para generar nombre de archivo PDF
  generatePDFFilename(reportType: string, params: any = {}): string {
    const today = new Date().toISOString().split('T')[0];
    const reportNames = {
      'ventas-periodo': 'reporte_ventas',
      'inventario': 'reporte_inventario',
      'cobranza': 'reporte_cobranza',
      'financiero': 'reporte_financiero'
    };
    
    const baseName = reportNames[reportType as keyof typeof reportNames] || 'reporte';
    
    if (params.fecha_inicio && params.fecha_fin) {
      return `${baseName}_${params.fecha_inicio}_${params.fecha_fin}.pdf`;
    }
    
    return `${baseName}_${today}.pdf`;
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