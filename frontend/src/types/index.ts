export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telefono?: string;
  rol: number;
  rol_nombre: string;
  estado: boolean;
  fecha_creacion: string;
}

export interface Rol {
  id: number;
  nombre_rol: string;
  descripcion?: string;
}

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

export interface Moto {
  id: number;
  marca: string;
  modelo: string;
  ano: number;
  color?: string;
  chasis: string;
  precio_compra: number;
  precio_venta: number;
  ganancia: number;
  cantidad_stock: number;
  descripcion?: string;
  imagen?: string;
  fecha_ingreso: string;
  activa: boolean;
  disponible: boolean;
  nombre_completo: string;
}

export interface MotoInventario {
  id: number;
  color: string;
  chasis?: string;
  cantidad_stock: number;
  descuento_porcentaje: number;
  precio_con_descuento: number;
  fecha_ingreso: string;
}

export interface MotoModelo {
  id: number;
  marca: string;
  modelo: string;
  ano: number;
  descripcion?: string;
  imagen?: string;
  precio_compra: number;
  precio_venta: number;
  ganancia: number;
  activa: boolean;
  fecha_creacion: string;
  total_stock: number;
  disponible: boolean;
  nombre_completo: string;
  inventario: MotoInventario[];
  colores_disponibles: { [color: string]: number };
}

export interface Venta {
  id: number;
  cliente: number;
  cliente_info: Cliente;
  usuario: number;
  usuario_info: User;
  fecha_venta: string;
  tipo_venta: string;
  tipo_venta_display: string;
  monto_total: number;
  monto_inicial: number;
  cuotas: number;
  tasa_interes: number;
  pago_mensual: number;
  monto_total_con_intereses: number;
  estado: string;
  estado_display: string;
  detalles: VentaDetalle[];
  saldo_pendiente: number;
}

export interface VentaDetalle {
  id: number;
  venta: number;
  moto: number;
  moto_info: Moto;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Pago {
  id: number;
  venta: number;
  venta_info?: Venta;
  fecha_pago: string;
  monto_pagado: number;
  tipo_pago: string;
  tipo_pago_display: string;
  observaciones?: string;
  usuario_cobrador: number;
  usuario_cobrador_info?: User;
}

export interface DashboardData {
  ventas_hoy: {
    total: number;
    count: number;
  };
  ventas_mes: {
    total: number;
    count: number;
  };
  pagos_hoy: {
    total: number;
    count: number;
  };
  stock_critico: number;
  cobros_pendientes: number;
  ventas_con_saldo: Array<{
    venta_id: number;
    cliente: string;
    saldo: number;
  }>;
}

export interface CuotaVencimiento {
  id: number;
  venta: number;
  venta_info?: Venta;
  numero_cuota: number;
  fecha_vencimiento: string;
  monto_cuota: number;
  monto_pagado: number;
  estado: string;
  estado_display: string;
  saldo_pendiente: number;
  esta_vencida: boolean;
  dias_vencido: number;
  tiene_mora: boolean;
  monto_mora: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface AlertaPago {
  id: number;
  venta: number;
  venta_info?: Venta;
  cuota?: number;
  cuota_info?: CuotaVencimiento;
  tipo_alerta: string;
  tipo_alerta_display: string;
  mensaje: string;
  fecha_creacion: string;
  fecha_lectura?: string;
  estado: string;
  estado_display: string;
  usuario_asignado?: number;
  usuario_asignado_info?: User;
}

export interface ResumenCobros {
  cuotas_vencidas: number;
  cuotas_proximas_vencer: number;
  total_monto_vencido: number;
  alertas_activas: number;
  ventas_alto_riesgo: number;
}

export interface ClienteFinanciado {
  cliente_id: number;
  nombre_completo: string;
  cedula: string;
  venta_id: number;
  fecha_venta: string;
  monto_total: number;
  monto_con_intereses: number;
  saldo_pendiente: number;
  total_pagado: number;
  cuotas_totales: number;
  cuotas_pagadas: number;
  cuotas_restantes: number;
  pago_mensual: number;
  tasa_interes: number;
  total_mora: number;
  proxima_cuota?: {
    numero: number;
    fecha_vencimiento: string;
    monto: number;
    dias_vencido: number;
    tiene_mora: boolean;
  };
}