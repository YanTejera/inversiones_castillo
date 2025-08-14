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
  cliente: number;
}

export interface Documento {
  id: number;
  cliente: number;
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
  pago_mensual: number;
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
  venta_info: Venta;
  fecha_pago: string;
  monto_pagado: number;
  tipo_pago: string;
  tipo_pago_display: string;
  observaciones?: string;
  usuario_cobrador: number;
  usuario_cobrador_info: User;
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