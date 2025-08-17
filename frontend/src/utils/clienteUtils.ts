import { AlertTriangle, Clock, CheckCircle, Star, Award, Medal, Crown } from 'lucide-react';

// Tipos definidos localmente para evitar problemas de importación
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
  // Fiador y documentos
  fiador?: Fiador;
  documentos?: Documento[];
}

export interface Fiador {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  direccion: string;
  telefono?: string;
  celular?: string;
  email?: string;
  fecha_nacimiento?: string;
  estado_civil?: string;
  ocupacion?: string;
  ingresos?: number;
  lugar_trabajo?: string;
  telefono_trabajo?: string;
  referencias_personales?: string;
  parentesco_cliente?: string;
  cliente: number;
  nombre_completo?: string;
}

export interface Documento {
  id: number;
  cliente: number;
  propietario: string;
  propietario_display: string;
  tipo_documento: string;
  tipo_documento_display: string;
  descripcion: string;
  archivo?: string;
  fecha_creacion: string;
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

export const getEstadoPagoInfo = (cliente: Cliente): EstadoPagoInfo => {
  if (!cliente.estado_pago || !cliente.proximo_pago) {
    return {
      estado: 'al_dia',
      mensaje: 'Sin pagos pendientes',
      color_clase: 'text-gray-500 bg-gray-50 border-gray-200',
      icono: 'CheckCircle'
    };
  }

  const hoy = new Date();
  const fechaPago = new Date(cliente.proximo_pago);
  const diffTime = fechaPago.getTime() - hoy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  switch (cliente.estado_pago) {
    case 'atrasado':
      return {
        estado: 'atrasado',
        dias_atraso: cliente.dias_atraso || 0,
        mensaje: `Pago atrasado por ${cliente.dias_atraso || 0} días`,
        color_clase: 'text-red-700 bg-red-50 border-red-200',
        icono: 'AlertTriangle'
      };
    
    case 'proximo':
      return {
        estado: 'proximo',
        dias_hasta_pago: diffDays,
        mensaje: diffDays === 0 ? 'Pago vence hoy' : `Pago en ${diffDays} días`,
        color_clase: 'text-yellow-700 bg-yellow-50 border-yellow-200',
        icono: 'Clock'
      };
    
    case 'al_dia':
    default:
      return {
        estado: 'al_dia',
        dias_hasta_pago: diffDays,
        mensaje: 'Pagos al día',
        color_clase: 'text-green-700 bg-green-50 border-green-200',
        icono: 'CheckCircle'
      };
  }
};

export const calcularSistemaCredito = (cliente: Cliente): SistemaCredito => {
  const pagosATiempo = cliente.pagos_a_tiempo || 0;
  const totalPagos = cliente.total_pagos || 0;
  const comprasHistoricas = cliente.compras_historicas || 0;
  
  // Calcular porcentaje de puntualidad
  const porcentajePuntualidad = totalPagos > 0 ? (pagosATiempo / totalPagos) * 100 : 0;
  
  // Calcular score base (0-1000)
  let score = 0;
  
  // Puntualidad de pagos (60% del score)
  score += porcentajePuntualidad * 6;
  
  // Historial de compras (25% del score)
  score += Math.min(comprasHistoricas * 10, 250);
  
  // Antigüedad como cliente (15% del score)
  if (cliente.cliente_desde) {
    const fechaRegistro = new Date(cliente.cliente_desde);
    const hoy = new Date();
    const mesesComoCliente = (hoy.getTime() - fechaRegistro.getTime()) / (1000 * 60 * 60 * 24 * 30);
    score += Math.min(mesesComoCliente * 5, 150);
  }
  
  // Determinar nivel basado en score
  let nivel: 'bronce' | 'plata' | 'oro' | 'platino';
  if (score >= 800) nivel = 'platino';
  else if (score >= 600) nivel = 'oro';
  else if (score >= 400) nivel = 'plata';
  else nivel = 'bronce';
  
  // Calcular puntos de lealtad
  const puntos = cliente.puntos_lealtad || Math.floor(score / 10);
  
  // Beneficios por nivel
  const beneficios = getBeneficios(nivel);
  
  return {
    score: Math.round(score),
    nivel,
    puntos,
    beneficios,
    historial_pagos: {
      total: totalPagos,
      puntuales: pagosATiempo,
      tardios: totalPagos - pagosATiempo,
      porcentaje_puntualidad: porcentajePuntualidad
    }
  };
};

export const getBeneficios = (nivel: string): string[] => {
  switch (nivel) {
    case 'platino':
      return [
        'Descuento del 15% en todas las compras',
        'Financiamiento preferencial',
        'Asesor personal dedicado',
        'Acceso anticipado a nuevos modelos',
        'Mantenimiento gratuito por 2 años'
      ];
    case 'oro':
      return [
        'Descuento del 10% en todas las compras',
        'Tasa de interés reducida',
        'Prioridad en servicio técnico',
        'Descuentos en accesorios'
      ];
    case 'plata':
      return [
        'Descuento del 5% en todas las compras',
        'Extensión de garantía',
        'Descuentos en mantenimiento'
      ];
    case 'bronce':
    default:
      return [
        'Programa de puntos por compras',
        'Ofertas especiales mensuales'
      ];
  }
};

export const getNivelIcon = (nivel: string) => {
  switch (nivel) {
    case 'platino': return Crown;
    case 'oro': return Award;
    case 'plata': return Medal;
    case 'bronce': 
    default: return Star;
  }
};

export const getNivelColor = (nivel: string): string => {
  switch (nivel) {
    case 'platino': return 'text-purple-600 bg-purple-100';
    case 'oro': return 'text-yellow-600 bg-yellow-100';
    case 'plata': return 'text-gray-600 bg-gray-100';
    case 'bronce':
    default: return 'text-orange-600 bg-orange-100';
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const calcularProximoPago = (cliente: Cliente): string => {
  if (!cliente.cuota_actual || !cliente.proximo_pago) {
    return 'Sin pagos pendientes';
  }

  const estadoPago = getEstadoPagoInfo(cliente);
  return `${formatCurrency(cliente.cuota_actual)} - ${estadoPago.mensaje}`;
};