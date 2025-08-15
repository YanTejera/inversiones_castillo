import api from './api';
import type { CuotaVencimiento, AlertaPago, ResumenCobros, ClienteFinanciado } from '../types';

interface CuotaListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CuotaVencimiento[];
}

interface AlertaListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AlertaPago[];
}

export const cuotaService = {
  // Cuotas de vencimiento
  async getCuotas(page = 1, ventaId?: number, estado?: string, vencidas?: boolean): Promise<CuotaListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (ventaId) {
      params.append('venta', ventaId.toString());
    }
    if (estado) {
      params.append('estado', estado);
    }
    if (vencidas) {
      params.append('vencidas', 'true');
    }
    
    const response = await api.get(`/pagos/cuotas/?${params.toString()}`);
    return response.data as CuotaListResponse;
  },

  async getCuota(id: number): Promise<CuotaVencimiento> {
    const response = await api.get(`/pagos/cuotas/${id}/`);
    return response.data as CuotaVencimiento;
  },

  async updateCuota(id: number, data: Partial<CuotaVencimiento>): Promise<CuotaVencimiento> {
    const response = await api.patch(`/pagos/cuotas/${id}/`, data);
    return response.data as CuotaVencimiento;
  },

  async generarCuotasVenta(ventaId: number): Promise<void> {
    await api.post(`/pagos/cuotas/generar/${ventaId}/`);
  },

  // Alertas de pago
  async getAlertas(page = 1, estado?: string, tipo?: string, activasSolo?: boolean): Promise<AlertaListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (estado) {
      params.append('estado', estado);
    }
    if (tipo) {
      params.append('tipo', tipo);
    }
    if (activasSolo) {
      params.append('activas_solo', 'true');
    }
    
    const response = await api.get(`/pagos/alertas/?${params.toString()}`);
    return response.data as AlertaListResponse;
  },

  async getAlerta(id: number): Promise<AlertaPago> {
    const response = await api.get(`/pagos/alertas/${id}/`);
    return response.data as AlertaPago;
  },

  async updateAlerta(id: number, data: Partial<AlertaPago>): Promise<AlertaPago> {
    const response = await api.patch(`/pagos/alertas/${id}/`, data);
    return response.data as AlertaPago;
  },

  async generarAlertasAutomaticas(): Promise<void> {
    await api.post('/pagos/alertas/generar/');
  },

  async marcarAlertaLeida(id: number): Promise<void> {
    await api.post(`/pagos/alertas/${id}/leida/`);
  },

  async marcarAlertaResuelta(id: number): Promise<void> {
    await api.post(`/pagos/alertas/${id}/resuelta/`);
  },

  // Resumen de cobros
  async getResumenCobros(): Promise<ResumenCobros> {
    const response = await api.get('/pagos/resumen-cobros/');
    return response.data as ResumenCobros;
  },

  // Búsqueda de clientes con saldo pendiente (financiados y contado)
  async buscarClientesFinanciados(searchTerm?: string): Promise<ClienteFinanciado[]> {
    const params = new URLSearchParams();
    if (searchTerm) {
      params.append('q', searchTerm);
    }
    
    const response = await api.get(`/pagos/clientes-financiados/?${params.toString()}`);
    return response.data as ClienteFinanciado[];
  }
};