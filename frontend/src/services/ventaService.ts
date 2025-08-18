import api from './api';
import type { Venta, VentaDetalle } from '../types';

interface VentaCreateData {
  cliente: number;
  tipo_venta: 'contado' | 'financiado';
  monto_total: number;
  monto_inicial?: number;
  cuotas?: number;
  tasa_interes?: number;
  pago_mensual?: number;
  monto_total_con_intereses?: number;
  detalles: {
    moto: number;
    cantidad: number;
    precio_unitario: number;
  }[];
}

interface VentaListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Venta[];
}

interface VentaCalculation {
  monto_total: number;
  monto_inicial: number;
  saldo_financiado: number;
  pago_mensual: number;
  cuotas: number;
  tasa_interes: number;
  monto_total_con_intereses: number;
  total_intereses: number;
}

export const ventaService = {
  async getVentas(page = 1, search = '', estado?: string): Promise<VentaListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (search) {
      params.append('search', search);
    }
    if (estado) {
      params.append('estado', estado);
    }
    
    const response = await api.get(`/ventas/?${params.toString()}`);
    return response.data as VentaListResponse;
  },

  async getVenta(id: number): Promise<Venta> {
    const response = await api.get(`/ventas/${id}/`);
    return response.data as Venta;
  },

  async createVenta(data: VentaCreateData): Promise<Venta> {
    const response = await api.post('/ventas/', data);
    return response.data as Venta;
  },

  async updateVenta(id: number, data: Partial<VentaCreateData>): Promise<Venta> {
    const response = await api.patch(`/ventas/${id}/`, data);
    return response.data as Venta;
  },

  async deleteVenta(id: number): Promise<void> {
    await api.delete(`/ventas/${id}/`);
  },

  async getVentasActivas(): Promise<Venta[]> {
    const response = await api.get('/ventas/?estado=activa');
    const data = response.data as VentaListResponse;
    return data.results;
  },

  async getVentasByCliente(clienteId: number): Promise<Venta[]> {
    const response = await api.get(`/ventas/?cliente=${clienteId}`);
    const data = response.data as VentaListResponse;
    return data.results;
  },

  async calculateVenta(
    detalles: { moto: number; cantidad: number; precio_unitario: number }[],
    tipo_venta: 'contado' | 'financiado',
    monto_inicial?: number,
    cuotas?: number,
    tasa_interes?: number
  ): Promise<VentaCalculation> {
    const response = await api.post('/ventas/calcular/', {
      detalles,
      tipo_venta,
      monto_inicial,
      cuotas,
      tasa_interes
    });
    return response.data as VentaCalculation;
  },

  async cambiarEstadoVenta(id: number, estado: 'activa' | 'finalizada' | 'cancelada'): Promise<Venta> {
    const response = await api.patch(`/ventas/${id}/`, { estado });
    return response.data as Venta;
  },

  async getVentaDetalles(ventaId: number): Promise<VentaDetalle[]> {
    const response = await api.get(`/ventas/detalles/?venta=${ventaId}`);
    const data = response.data as { results: VentaDetalle[] };
    return data.results;
  },

  async addVentaDetalle(ventaId: number, detalle: {
    moto: number;
    cantidad: number;
    precio_unitario: number;
  }): Promise<VentaDetalle> {
    const response = await api.post('/ventas/detalles/', {
      venta: ventaId,
      ...detalle
    });
    return response.data as VentaDetalle;
  },

  async updateVentaDetalle(detalleId: number, data: {
    cantidad?: number;
    precio_unitario?: number;
  }): Promise<VentaDetalle> {
    const response = await api.patch(`/ventas/detalles/${detalleId}/`, data);
    return response.data as VentaDetalle;
  },

  async deleteVentaDetalle(detalleId: number): Promise<void> {
    await api.delete(`/ventas/detalles/${detalleId}/`);
  },

  async generarFactura(ventaId: number): Promise<any> {
    const response = await api.get(`/ventas/${ventaId}/factura/`);
    return response.data;
  },

  // Nuevo método para crear venta desde formulario mejorado
  async createVentaFromForm(data: {
    cliente_id: number;
    tipo_venta: 'contado' | 'financiado';
    motorcycle: {
      tipo: 'modelo' | 'individual';
      modelo_id?: number;
      moto_id?: number;
      color?: string;
      chasis?: string;
      cantidad: number;
      precio_unitario: number;
    };
    payment: {
      monto_total: number;
      monto_inicial: number;
      cuotas?: number;
      tasa_interes?: number;
      pago_mensual?: number;
      monto_total_con_intereses?: number;
    };
    documentos?: string[];
    observaciones?: string;
  }): Promise<Venta> {
    const response = await api.post('/ventas/create-from-form/', data);
    return response.data as Venta;
  },

  async cancelarVenta(ventaId: number, cancelacionData?: { motivo: string, descripcion: string }): Promise<any> {
    const response = await api.post(`/ventas/${ventaId}/cancelar/`, cancelacionData || {});
    return response.data;
  }
};