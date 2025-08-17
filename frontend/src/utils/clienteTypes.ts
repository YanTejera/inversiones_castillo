// Tipos para el sistema de clientes (temporal)
export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  cedula: string;
  telefono?: string;
  celular?: string;
  email?: string;
  estado_civil?: string;
  fecha_nacimiento?: string;
  ocupacion?: string;
  ingresos?: number;
  referencias_personales?: string;
  fecha_registro: string;
  nombre_completo: string;
  foto_perfil?: string;
  // Información financiera
  deuda_total?: number;
  cuota_actual?: number;
  proximo_pago?: string;
  dias_atraso?: number;
  estado_pago?: 'al_dia' | 'proximo' | 'atrasado';
  // Sistema de crédito y lealtad
  score_credito?: number;
  nivel_lealtad?: 'bronce' | 'plata' | 'oro' | 'platino';
  puntos_lealtad?: number;
  compras_historicas?: number;
  pagos_a_tiempo?: number;
  total_pagos?: number;
  cliente_desde?: string;
}

export interface EstadoPagoInfo {
  estado: 'al_dia' | 'proximo' | 'atrasado';
  dias_hasta_pago?: number;
  dias_atraso?: number;
  mensaje: string;
  color_clase: string;
  icono: string;
}

export interface SistemaCredito {
  score: number;
  nivel: 'bronce' | 'plata' | 'oro' | 'platino';
  puntos: number;
  beneficios: string[];
  historial_pagos: {
    total: number;
    puntuales: number;
    tardios: number;
    porcentaje_puntualidad: number;
  };
}

export interface CompraCliente {
  id: number;
  venta_id: number;
  fecha_compra: string;
  productos: Array<{
    id: number;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  monto_total: number;
  tipo_venta: 'contado' | 'financiado';
  estado: 'activa' | 'pagada' | 'cancelada';
  cuotas_totales?: number;
  cuotas_pagadas?: number;
  saldo_pendiente?: number;
  fecha_ultimo_pago?: string;
}

export interface PagoCliente {
  id: number;
  compra_id: number;
  numero_cuota?: number;
  fecha_pago: string;
  monto_pagado: number;
  metodo_pago: string;
  referencia?: string;
  factura_url?: string;
  fue_puntual: boolean;
  dias_atraso?: number;
  mora_aplicada?: number;
  nota?: string;
}