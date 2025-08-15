import api from './api';

interface VentaResumen {
  id: number;
  fecha_venta: string;
  tipo_venta: string;
  tipo_venta_display: string;
  monto_total: string;
  monto_inicial: string;
  cuotas: number;
  tasa_interes: string;
  pago_mensual: string;
  monto_total_con_intereses: string;
  estado: string;
  estado_display: string;
  saldo_pendiente: string;
  detalles: Array<{
    id: number;
    moto_info: {
      id: number;
      marca: string;
      modelo: string;
      año: number;
      precio_contado: string;
    };
    cantidad: number;
    precio_unitario: string;
    subtotal: string;
  }>;
}

interface ClienteVentasResponse {
  activas: VentaResumen[];
  finalizadas: VentaResumen[];
  resumen: {
    total_activas: number;
    total_finalizadas: number;
    monto_activo: number;
    saldo_pendiente: number;
  };
}

export const clienteVentasService = {
  async getVentasCliente(clienteId: number): Promise<ClienteVentasResponse> {
    const response = await api.get(`/ventas/cliente/${clienteId}/`);
    return response.data;
  }
};