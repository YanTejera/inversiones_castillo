import React from 'react';
import { 
  User, 
  DollarSign, 
  Calendar,
  CreditCard,
  ShoppingCart,
  Bike,
  Package,
  FileText,
  Building,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

// Define SearchFilter type locally to avoid import issues
interface SearchFilter {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number' | 'numberRange' | 'boolean';
  options?: { value: string; label: string }[];
  placeholder?: string;
  icon?: React.ReactNode;
}

// Filtros para Clientes
export const clientesFilters: SearchFilter[] = [
  {
    key: 'estado_credito',
    label: 'Estado de Crédito',
    type: 'select',
    icon: <CreditCard className="h-4 w-4" />,
    options: [
      { value: 'al_dia', label: 'Al Día' },
      { value: 'atrasado', label: 'Atrasado' },
      { value: 'muy_atrasado', label: 'Muy Atrasado' },
      { value: 'critico', label: 'Crítico' }
    ],
    placeholder: 'Todos los estados'
  },
  {
    key: 'saldo_pendiente',
    label: 'Saldo Pendiente',
    type: 'numberRange',
    icon: <DollarSign className="h-4 w-4" />,
    placeholder: 'Rango de saldo'
  },
  {
    key: 'fecha_registro',
    label: 'Fecha de Registro',
    type: 'dateRange',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    key: 'ciudad',
    label: 'Ciudad',
    type: 'text',
    icon: <MapPin className="h-4 w-4" />,
    placeholder: 'Filtrar por ciudad'
  },
  {
    key: 'tiene_ventas_activas',
    label: 'Ventas Activas',
    type: 'boolean',
    icon: <ShoppingCart className="h-4 w-4" />
  },
  {
    key: 'nivel_credito',
    label: 'Nivel de Crédito',
    type: 'select',
    icon: <User className="h-4 w-4" />,
    options: [
      { value: 'bronce', label: 'Bronce' },
      { value: 'plata', label: 'Plata' },
      { value: 'oro', label: 'Oro' },
      { value: 'platino', label: 'Platino' }
    ]
  }
];

// Filtros para Ventas
export const ventasFilters: SearchFilter[] = [
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    icon: <CheckCircle className="h-4 w-4" />,
    options: [
      { value: 'activa', label: 'Activa' },
      { value: 'pagada', label: 'Pagada' },
      { value: 'cancelada', label: 'Cancelada' },
      { value: 'vencida', label: 'Vencida' }
    ],
    placeholder: 'Todos los estados'
  },
  {
    key: 'tipo_venta',
    label: 'Tipo de Venta',
    type: 'select',
    icon: <CreditCard className="h-4 w-4" />,
    options: [
      { value: 'contado', label: 'Al Contado' },
      { value: 'financiado', label: 'Financiado' }
    ],
    placeholder: 'Todos los tipos'
  },
  {
    key: 'monto_total',
    label: 'Monto Total',
    type: 'numberRange',
    icon: <DollarSign className="h-4 w-4" />,
    placeholder: 'Rango de monto'
  },
  {
    key: 'fecha_venta',
    label: 'Fecha de Venta',
    type: 'dateRange',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    key: 'saldo_pendiente',
    label: 'Saldo Pendiente',
    type: 'numberRange',
    icon: <DollarSign className="h-4 w-4" />,
    placeholder: 'Rango de saldo pendiente'
  },
  {
    key: 'cliente_nombre',
    label: 'Cliente',
    type: 'text',
    icon: <User className="h-4 w-4" />,
    placeholder: 'Nombre del cliente'
  }
];

// Filtros para Motocicletas
export const motocicletasFilters: SearchFilter[] = [
  {
    key: 'marca',
    label: 'Marca',
    type: 'select',
    icon: <Bike className="h-4 w-4" />,
    options: [
      { value: 'yamaha', label: 'Yamaha' },
      { value: 'honda', label: 'Honda' },
      { value: 'suzuki', label: 'Suzuki' },
      { value: 'kawasaki', label: 'Kawasaki' },
      { value: 'bajaj', label: 'Bajaj' },
      { value: 'tvs', label: 'TVS' },
      { value: 'hero', label: 'Hero' }
    ],
    placeholder: 'Todas las marcas'
  },
  {
    key: 'condicion',
    label: 'Condición',
    type: 'select',
    icon: <Package className="h-4 w-4" />,
    options: [
      { value: 'nueva', label: 'Nueva' },
      { value: 'usada', label: 'Usada' }
    ],
    placeholder: 'Todas las condiciones'
  },
  {
    key: 'estado_disponibilidad',
    label: 'Disponibilidad',
    type: 'select',
    icon: <CheckCircle className="h-4 w-4" />,
    options: [
      { value: 'disponible', label: 'Disponible' },
      { value: 'vendida', label: 'Vendida' },
      { value: 'reservada', label: 'Reservada' }
    ],
    placeholder: 'Todas las disponibilidades'
  },
  {
    key: 'precio_venta',
    label: 'Precio de Venta',
    type: 'numberRange',
    icon: <DollarSign className="h-4 w-4" />,
    placeholder: 'Rango de precio'
  },
  {
    key: 'ano',
    label: 'Año',
    type: 'numberRange',
    icon: <Calendar className="h-4 w-4" />,
    placeholder: 'Rango de años'
  },
  {
    key: 'cilindraje',
    label: 'Cilindraje',
    type: 'numberRange',
    icon: <Bike className="h-4 w-4" />,
    placeholder: 'Rango de cilindraje'
  },
  {
    key: 'cantidad_stock',
    label: 'Stock Disponible',
    type: 'numberRange',
    icon: <Package className="h-4 w-4" />,
    placeholder: 'Cantidad en stock'
  }
];

// Filtros para Pagos
export const pagosFilters: SearchFilter[] = [
  {
    key: 'tipo_pago',
    label: 'Tipo de Pago',
    type: 'select',
    icon: <CreditCard className="h-4 w-4" />,
    options: [
      { value: 'efectivo', label: 'Efectivo' },
      { value: 'transferencia', label: 'Transferencia' },
      { value: 'cheque', label: 'Cheque' },
      { value: 'tarjeta', label: 'Tarjeta' }
    ],
    placeholder: 'Todos los tipos'
  },
  {
    key: 'estado_pago',
    label: 'Estado del Pago',
    type: 'select',
    icon: <CheckCircle className="h-4 w-4" />,
    options: [
      { value: 'procesado', label: 'Procesado' },
      { value: 'pendiente', label: 'Pendiente' },
      { value: 'cancelado', label: 'Cancelado' },
      { value: 'devuelto', label: 'Devuelto' }
    ],
    placeholder: 'Todos los estados'
  },
  {
    key: 'monto_pagado',
    label: 'Monto Pagado',
    type: 'numberRange',
    icon: <DollarSign className="h-4 w-4" />,
    placeholder: 'Rango de monto'
  },
  {
    key: 'fecha_pago',
    label: 'Fecha de Pago',
    type: 'dateRange',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    key: 'cliente_nombre',
    label: 'Cliente',
    type: 'text',
    icon: <User className="h-4 w-4" />,
    placeholder: 'Nombre del cliente'
  },
  {
    key: 'numero_recibo',
    label: 'Número de Recibo',
    type: 'text',
    icon: <FileText className="h-4 w-4" />,
    placeholder: 'Número de recibo'
  }
];

// Filtros para Proveedores
export const proveedoresFilters: SearchFilter[] = [
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    icon: <CheckCircle className="h-4 w-4" />,
    options: [
      { value: 'activo', label: 'Activo' },
      { value: 'inactivo', label: 'Inactivo' },
      { value: 'suspendido', label: 'Suspendido' }
    ],
    placeholder: 'Todos los estados'
  },
  {
    key: 'ciudad',
    label: 'Ciudad',
    type: 'text',
    icon: <MapPin className="h-4 w-4" />,
    placeholder: 'Filtrar por ciudad'
  },
  {
    key: 'telefono',
    label: 'Teléfono',
    type: 'text',
    icon: <Phone className="h-4 w-4" />,
    placeholder: 'Número de teléfono'
  },
  {
    key: 'email',
    label: 'Email',
    type: 'text',
    icon: <Mail className="h-4 w-4" />,
    placeholder: 'Dirección de email'
  },
  {
    key: 'fecha_registro',
    label: 'Fecha de Registro',
    type: 'dateRange',
    icon: <Calendar className="h-4 w-4" />
  }
];

// Filtros para Cobros Pendientes
export const cobrosPendientesFilters: SearchFilter[] = [
  {
    key: 'estado_cobro',
    label: 'Estado del Cobro',
    type: 'select',
    icon: <AlertTriangle className="h-4 w-4" />,
    options: [
      { value: 'pendiente', label: 'Pendiente' },
      { value: 'vencido', label: 'Vencido' },
      { value: 'muy_vencido', label: 'Muy Vencido' },
      { value: 'en_gestion', label: 'En Gestión' }
    ],
    placeholder: 'Todos los estados'
  },
  {
    key: 'dias_vencimiento',
    label: 'Días de Vencimiento',
    type: 'numberRange',
    icon: <Clock className="h-4 w-4" />,
    placeholder: 'Rango de días'
  },
  {
    key: 'monto_cuota',
    label: 'Monto de la Cuota',
    type: 'numberRange',
    icon: <DollarSign className="h-4 w-4" />,
    placeholder: 'Rango de monto'
  },
  {
    key: 'fecha_vencimiento',
    label: 'Fecha de Vencimiento',
    type: 'dateRange',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    key: 'cliente_nombre',
    label: 'Cliente',
    type: 'text',
    icon: <User className="h-4 w-4" />,
    placeholder: 'Nombre del cliente'
  },
  {
    key: 'numero_cuota',
    label: 'Número de Cuota',
    type: 'number',
    icon: <FileText className="h-4 w-4" />,
    placeholder: 'Número de cuota'
  }
];

// Filtros para Documentos
export const documentosFilters: SearchFilter[] = [
  {
    key: 'category',
    label: 'Categoría',
    type: 'select',
    icon: <FileText className="h-4 w-4" />,
    options: [
      { value: 'contratos', label: 'Contratos' },
      { value: 'facturas', label: 'Facturas' },
      { value: 'recibos', label: 'Recibos' },
      { value: 'documentos_legales', label: 'Documentos Legales' },
      { value: 'garantias', label: 'Garantías' },
      { value: 'otros', label: 'Otros' }
    ],
    placeholder: 'Todas las categorías'
  },
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    icon: <CheckCircle className="h-4 w-4" />,
    options: [
      { value: 'activo', label: 'Activo' },
      { value: 'archivado', label: 'Archivado' },
      { value: 'vencido', label: 'Vencido' }
    ],
    placeholder: 'Todos los estados'
  },
  {
    key: 'fecha_creacion',
    label: 'Fecha de Creación',
    type: 'dateRange',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    key: 'cliente_asociado',
    label: 'Cliente Asociado',
    type: 'text',
    icon: <User className="h-4 w-4" />,
    placeholder: 'Nombre del cliente'
  }
];

// Función helper para obtener filtros según el tipo de entidad
export const getFiltersForEntity = (entityType: string): SearchFilter[] => {
  switch (entityType) {
    case 'clientes':
      return clientesFilters;
    case 'ventas':
      return ventasFilters;
    case 'motocicletas':
      return motocicletasFilters;
    case 'pagos':
      return pagosFilters;
    case 'proveedores':
      return proveedoresFilters;
    case 'cobros-pendientes':
      return cobrosPendientesFilters;
    case 'documentos':
      return documentosFilters;
    default:
      return [];
  }
};

// Configuraciones predefinidas para placeholders de búsqueda
export const getSearchPlaceholder = (entityType: string): string => {
  switch (entityType) {
    case 'clientes':
      return 'Buscar por nombre, cédula, teléfono o email...';
    case 'ventas':
      return 'Buscar por cliente, número de venta o monto...';
    case 'motocicletas':
      return 'Buscar por marca, modelo, año o número de serie...';
    case 'pagos':
      return 'Buscar por cliente, recibo o monto...';
    case 'proveedores':
      return 'Buscar por nombre, NIT o contacto...';
    case 'cobros-pendientes':
      return 'Buscar por cliente o número de cuota...';
    case 'documentos':
      return 'Buscar por nombre, descripción o cliente...';
    default:
      return 'Buscar...';
  }
};