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
  async getPagos(page = 1, ventaId?: number, fechaDesde?: string, fechaHasta?: string): Promise<PagoListResponse> {
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
    
    const response = await api.get(`/pagos/?${params.toString()}`);
    return response.data as PagoListResponse;
  },

  async getPago(id: number): Promise<Pago> {
    const response = await api.get(`/pagos/${id}/`);
    return response.data as Pago;
  },

  async createPago(data: PagoCreateData): Promise<Pago> {
    const response = await api.post('/pagos/', data);
    return response.data as Pago;
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
  }
};