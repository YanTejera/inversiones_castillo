import api from './api';
import type { Pago, Venta, User } from '../types';

interface PagoCreateData {
  venta: number;
  monto_pagado: number;
  tipo_pago: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque';
  observaciones?: string;
}

interface PagoListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Pago[];
}

export const pagoService = {
  async getPagos(page = 1, ventaId?: number, fechaDesde?: string, fechaHasta?: string, tipoPago?: string, search?: string): Promise<PagoListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (ventaId) {
      params.append('venta', ventaId.toString());
    }
    if (fechaDesde) {
      params.append('fecha_desde', fechaDesde);
    }
    if (fechaHasta) {
      params.append('fecha_hasta', fechaHasta);
    }
    if (tipoPago) {
      params.append('tipo_pago', tipoPago);
    }
    if (search) {
      params.append('search', search);
    }
    
    const response = await api.get(`/pagos/?${params.toString()}`);
    return response.data as PagoListResponse;
  },

  async getPago(id: number): Promise<Pago> {
    const response = await api.get(`/pagos/${id}/`);
    return response.data as Pago;
  },

  async createPago(data: PagoCreateData): Promise<Pago> {
    console.log('=== PAGO SERVICE DEBUG ===');
    console.log('Data being sent to API:', data);
    console.log('Data types:', {
      venta: typeof data.venta,
      monto_pagado: typeof data.monto_pagado,
      tipo_pago: typeof data.tipo_pago,
      observaciones: typeof data.observaciones
    });
    console.log('API endpoint: /pagos/');
    console.log('===========================');
    
    try {
      const response = await api.post('/pagos/', data);
      console.log('=== API RESPONSE SUCCESS ===');
      console.log('Response data:', response.data);
      console.log('===============================');
      return response.data as Pago;
    } catch (error: any) {
      console.log('=== API RESPONSE ERROR ===');
      console.log('Error:', error);
      console.log('Error response:', error.response);
      console.log('Error response data:', error.response?.data);
      console.log('Error response status:', error.response?.status);
      console.log('=============================');
      throw error;
    }
  },

  async updatePago(id: number, data: Partial<PagoCreateData>): Promise<Pago> {
    const response = await api.patch(`/pagos/${id}/`, data);
    return response.data as Pago;
  },

  async deletePago(id: number): Promise<void> {
    await api.delete(`/pagos/${id}/`);
  },

  async getPagosPorVenta(ventaId: number): Promise<Pago[]> {
    const response = await api.get(`/pagos/por-venta/${ventaId}/`);
    return response.data as Pago[];
  },

  async getDashboard(): Promise<{
    ventas_hoy: { total: number; count: number };
    ventas_mes: { total: number; count: number };
    pagos_hoy: { total: number; count: number };
    stock_critico: number;
    cobros_pendientes: number;
    ventas_con_saldo: Array<{
      venta_id: number;
      cliente: string;
      saldo: number;
    }>;
  }> {
    const response = await api.get('/pagos/dashboard/');
    return response.data;
  },

  async generarFacturaPago(pagoId: number): Promise<any> {
    const response = await api.get(`/pagos/${pagoId}/factura/`);
    return response.data;
  },

  async cancelarPago(pagoId: number, cancelacionData?: { motivo: string, descripcion: string }): Promise<any> {
    const response = await api.post(`/pagos/${pagoId}/cancelar/`, cancelacionData || {});
    return response.data;
  }
};