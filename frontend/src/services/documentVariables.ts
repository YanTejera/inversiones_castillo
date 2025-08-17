import type { VentaFormData } from '../components/NewVentaForm';

// Interfaz para los datos que se pueden usar en los documentos
export interface DocumentVariables {
  // Información del cliente
  cliente_nombre: string;
  cliente_apellido: string;
  cliente_nombre_completo: string;
  cliente_cedula: string;
  cliente_telefono: string;
  cliente_celular: string;
  cliente_email: string;
  cliente_direccion: string;
  cliente_fecha_nacimiento: string;
  cliente_estado_civil: string;
  cliente_ocupacion: string;
  cliente_ingresos: string;
  
  // Información del garante (si aplica)
  garante_nombre: string;
  garante_apellido: string;
  garante_nombre_completo: string;
  garante_cedula: string;
  garante_telefono: string;
  garante_direccion: string;
  garante_parentesco: string;
  garante_ocupacion: string;
  garante_ingresos: string;
  
  // Información de la motocicleta
  vehiculo_marca: string;
  vehiculo_modelo: string;
  vehiculo_ano: string;
  vehiculo_color: string;
  vehiculo_descripcion_completa: string;
  vehiculo_precio_unitario: string;
  vehiculo_cantidad: string;
  vehiculo_numero_placa: string;
  vehiculo_numero_chasis: string;
  vehiculo_numero_motor: string;
  vehiculo_condicion: string;
  
  // Información financiera
  precio_total: string;
  precio_total_letras: string;
  cuota_inicial: string;
  monto_financiado: string;
  tasa_interes: string;
  numero_cuotas: string;
  valor_cuota: string;
  frecuencia_pago: string;
  tipo_venta: string;
  fecha_primer_pago: string;
  fecha_ultimo_pago: string;
  
  // Información de la empresa
  empresa_nombre: string;
  empresa_direccion: string;
  empresa_telefono: string;
  empresa_email: string;
  empresa_rnc: string;
  
  // Información de la venta
  fecha_venta: string;
  fecha_venta_completa: string;
  numero_venta: string;
  vendedor_nombre: string;
  
  // Fechas útiles
  fecha_actual: string;
  fecha_actual_completa: string;
  ano_actual: string;
  mes_actual: string;
  dia_actual: string;
}

// Función para convertir números a letras (básica)
function numeroALetras(numero: number): string {
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  
  if (numero === 0) return 'cero';
  if (numero === 100) return 'cien';
  
  let resultado = '';
  
  // Simplificación básica - se puede expandir para números más grandes
  if (numero < 10) {
    return unidades[numero];
  } else if (numero < 100) {
    const dec = Math.floor(numero / 10);
    const uni = numero % 10;
    if (numero >= 11 && numero <= 19) {
      const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
      return especiales[numero - 10];
    } else if (numero === 20) {
      return 'veinte';
    } else if (numero > 20) {
      return decenas[dec] + (uni > 0 ? ' y ' + unidades[uni] : '');
    }
  } else if (numero < 1000) {
    const cen = Math.floor(numero / 100);
    const resto = numero % 100;
    return centenas[cen] + (resto > 0 ? ' ' + numeroALetras(resto) : '');
  }
  
  // Para números más grandes, simplificamos
  return numero.toLocaleString('es-CO');
}

// Función principal para generar variables desde los datos de la venta
export function generateDocumentVariables(ventaData: VentaFormData): DocumentVariables {
  const ahora = new Date();
  const formatoFecha = (fecha: Date) => fecha.toLocaleDateString('es-CO');
  const formatoFechaCompleta = (fecha: Date) => fecha.toLocaleDateString('es-CO', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const formatoCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getFrequencyName = (frequency: string) => {
    const frequencies: { [key: string]: string } = {
      'diario': 'Diaria',
      'semanal': 'Semanal',
      'quincenal': 'Quincenal',
      'mensual': 'Mensual'
    };
    return frequencies[frequency] || frequency;
  };

  // Calcular fechas de pagos
  const calcularFechaPrimerPago = () => {
    const fecha = new Date();
    if (ventaData.financingDetails?.paymentFrequency === 'mensual') {
      fecha.setMonth(fecha.getMonth() + 1);
    } else if (ventaData.financingDetails?.paymentFrequency === 'quincenal') {
      fecha.setDate(fecha.getDate() + 15);
    } else if (ventaData.financingDetails?.paymentFrequency === 'semanal') {
      fecha.setDate(fecha.getDate() + 7);
    } else if (ventaData.financingDetails?.paymentFrequency === 'diario') {
      fecha.setDate(fecha.getDate() + 1);
    }
    return formatoFecha(fecha);
  };

  const calcularFechaUltimoPago = () => {
    if (!ventaData.financingDetails?.paymentSchedule?.length) return '';
    const ultimoPago = ventaData.financingDetails.paymentSchedule[ventaData.financingDetails.paymentSchedule.length - 1];
    return ultimoPago.date;
  };

  const totalAmount = ventaData.selectedMotorcycle ? 
    ventaData.selectedMotorcycle.precio_unitario * ventaData.selectedMotorcycle.cantidad : 0;

  return {
    // Información del cliente
    cliente_nombre: ventaData.customer?.nombre || '',
    cliente_apellido: ventaData.customer?.apellido || '',
    cliente_nombre_completo: ventaData.customer ? `${ventaData.customer.nombre} ${ventaData.customer.apellido}` : '',
    cliente_cedula: ventaData.customer?.cedula || '',
    cliente_telefono: ventaData.customer?.telefono || '',
    cliente_celular: ventaData.customer?.celular || '',
    cliente_email: ventaData.customer?.email || '',
    cliente_direccion: ventaData.customer?.direccion || '',
    cliente_fecha_nacimiento: ventaData.customer?.fecha_nacimiento || '',
    cliente_estado_civil: ventaData.customer?.estado_civil || '',
    cliente_ocupacion: ventaData.customer?.ocupacion || '',
    cliente_ingresos: ventaData.customer?.ingresos ? formatoCurrency(ventaData.customer.ingresos) : '',
    
    // Información del garante
    garante_nombre: ventaData.guarantor?.nombre || '',
    garante_apellido: ventaData.guarantor?.apellido || '',
    garante_nombre_completo: ventaData.guarantor ? `${ventaData.guarantor.nombre} ${ventaData.guarantor.apellido}` : '',
    garante_cedula: ventaData.guarantor?.cedula || '',
    garante_telefono: ventaData.guarantor?.telefono || ventaData.guarantor?.celular || '',
    garante_direccion: ventaData.guarantor?.direccion || '',
    garante_parentesco: ventaData.guarantor?.parentesco_cliente || '',
    garante_ocupacion: ventaData.guarantor?.ocupacion || '',
    garante_ingresos: ventaData.guarantor?.ingresos ? formatoCurrency(ventaData.guarantor.ingresos) : '',
    
    // Información de la motocicleta
    vehiculo_marca: ventaData.selectedMotorcycle?.tipo === 'modelo' ? 
      ventaData.selectedMotorcycle.modelo?.marca || '' : 
      ventaData.selectedMotorcycle?.moto?.marca || '',
    vehiculo_modelo: ventaData.selectedMotorcycle?.tipo === 'modelo' ? 
      ventaData.selectedMotorcycle.modelo?.modelo || '' : 
      ventaData.selectedMotorcycle?.moto?.modelo || '',
    vehiculo_ano: ventaData.selectedMotorcycle?.tipo === 'modelo' ? 
      ventaData.selectedMotorcycle.modelo?.ano?.toString() || '' : 
      ventaData.selectedMotorcycle?.moto?.ano?.toString() || '',
    vehiculo_color: ventaData.selectedMotorcycle?.color || '',
    vehiculo_descripcion_completa: ventaData.selectedMotorcycle ? 
      `${ventaData.selectedMotorcycle.tipo === 'modelo' ? 
        `${ventaData.selectedMotorcycle.modelo?.marca} ${ventaData.selectedMotorcycle.modelo?.modelo} ${ventaData.selectedMotorcycle.modelo?.ano}` :
        `${ventaData.selectedMotorcycle.moto?.marca} ${ventaData.selectedMotorcycle.moto?.modelo} ${ventaData.selectedMotorcycle.moto?.ano}`
      }${ventaData.selectedMotorcycle.color ? ` - Color: ${ventaData.selectedMotorcycle.color}` : ''}` : '',
    vehiculo_precio_unitario: ventaData.selectedMotorcycle ? formatoCurrency(ventaData.selectedMotorcycle.precio_unitario) : '',
    vehiculo_cantidad: ventaData.selectedMotorcycle?.cantidad?.toString() || '',
    vehiculo_numero_placa: '', // Se llenará después de la venta
    vehiculo_numero_chasis: ventaData.selectedMotorcycle?.tipo === 'individual' ? 
      ventaData.selectedMotorcycle.moto?.numero_chasis || '' : '',
    vehiculo_numero_motor: ventaData.selectedMotorcycle?.tipo === 'individual' ? 
      ventaData.selectedMotorcycle.moto?.numero_motor || '' : '',
    vehiculo_condicion: ventaData.selectedMotorcycle?.tipo === 'modelo' ? 
      ventaData.selectedMotorcycle.modelo?.condicion || '' : 
      ventaData.selectedMotorcycle?.moto?.condicion || '',
    
    // Información financiera
    precio_total: formatoCurrency(totalAmount),
    precio_total_letras: numeroALetras(totalAmount) + ' pesos',
    cuota_inicial: formatoCurrency(ventaData.downPayment || 0),
    monto_financiado: formatoCurrency(ventaData.financingDetails?.financedAmount || 0),
    tasa_interes: ventaData.financingDetails?.interestRate ? `${ventaData.financingDetails.interestRate}%` : '',
    numero_cuotas: ventaData.financingDetails?.numberOfPayments?.toString() || '',
    valor_cuota: formatoCurrency(ventaData.financingDetails?.paymentAmount || 0),
    frecuencia_pago: getFrequencyName(ventaData.financingDetails?.paymentFrequency || ''),
    tipo_venta: ventaData.paymentType === 'contado' ? 'Contado' : 'Financiado',
    fecha_primer_pago: calcularFechaPrimerPago(),
    fecha_ultimo_pago: calcularFechaUltimoPago(),
    
    // Información de la empresa
    empresa_nombre: 'Inversiones Castillo',
    empresa_direccion: 'Dirección de la empresa', // Se puede configurar
    empresa_telefono: 'Teléfono de la empresa', // Se puede configurar
    empresa_email: 'info@inversionescastillo.com', // Se puede configurar
    empresa_rnc: 'RNC de la empresa', // Se puede configurar
    
    // Información de la venta
    fecha_venta: formatoFecha(ahora),
    fecha_venta_completa: formatoFechaCompleta(ahora),
    numero_venta: `VT-${Date.now()}`, // Se puede mejorar con un sistema de numeración
    vendedor_nombre: 'Vendedor', // Se puede obtener del usuario actual
    
    // Fechas útiles
    fecha_actual: formatoFecha(ahora),
    fecha_actual_completa: formatoFechaCompleta(ahora),
    ano_actual: ahora.getFullYear().toString(),
    mes_actual: (ahora.getMonth() + 1).toString().padStart(2, '0'),
    dia_actual: ahora.getDate().toString().padStart(2, '0'),
  };
}

// Función para reemplazar variables en el contenido del documento
export function replaceDocumentVariables(content: string, variables: DocumentVariables): string {
  let processedContent = content;
  
  // Reemplazar cada variable en el formato {{variable}}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedContent = processedContent.replace(regex, value || '[No disponible]');
  });
  
  // Reemplazar variables no encontradas con un placeholder
  processedContent = processedContent.replace(/{{([^}]+)}}/g, '[Variable no encontrada: $1]');
  
  return processedContent;
}

// Función para obtener variables disponibles para un tipo de documento
export function getAvailableVariables(): string[] {
  return [
    // Cliente
    'cliente_nombre', 'cliente_apellido', 'cliente_nombre_completo', 'cliente_cedula',
    'cliente_telefono', 'cliente_email', 'cliente_direccion', 'cliente_fecha_nacimiento',
    'cliente_estado_civil', 'cliente_ocupacion', 'cliente_ingresos',
    
    // Garante
    'garante_nombre', 'garante_apellido', 'garante_nombre_completo', 'garante_cedula',
    'garante_telefono', 'garante_direccion', 'garante_parentesco', 'garante_ocupacion',
    'garante_ingresos',
    
    // Vehículo
    'vehiculo_marca', 'vehiculo_modelo', 'vehiculo_ano', 'vehiculo_color',
    'vehiculo_descripcion_completa', 'vehiculo_precio_unitario', 'vehiculo_cantidad',
    'vehiculo_numero_placa', 'vehiculo_numero_chasis', 'vehiculo_numero_motor',
    'vehiculo_condicion',
    
    // Financiero
    'precio_total', 'precio_total_letras', 'cuota_inicial', 'monto_financiado',
    'tasa_interes', 'numero_cuotas', 'valor_cuota', 'frecuencia_pago',
    'tipo_venta', 'fecha_primer_pago', 'fecha_ultimo_pago',
    
    // Empresa
    'empresa_nombre', 'empresa_direccion', 'empresa_telefono', 'empresa_email', 'empresa_rnc',
    
    // Venta
    'fecha_venta', 'fecha_venta_completa', 'numero_venta', 'vendedor_nombre',
    
    // Fechas
    'fecha_actual', 'fecha_actual_completa', 'ano_actual', 'mes_actual', 'dia_actual'
  ];
}