import React, { useState } from 'react';
import {
  FileText,
  User,
  UserCheck,
  Bike,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Building,
  Briefcase,
  Scale,
  CheckCircle,
  AlertCircle,
  Printer,
  Download,
  Save,
  Edit,
  Eye,
  FileCheck,
  FolderOpen,
  Plus,
  X,
  PlayCircle
} from 'lucide-react';
import type { VentaFormData } from '../NewVentaForm';
import DocumentPreviewWithData from '../DocumentPreviewWithData';

interface ReviewStepProps {
  data: VentaFormData;
  onUpdate: (updates: Partial<VentaFormData>) => void;
  errors: Record<string, string>;
  onPreviousStep: () => void;
  onSubmit: () => void;
}

interface AdditionalDocument {
  id: string;
  name: string;
  category: 'legal' | 'client';
  description: string;
  recommended: boolean;
}

// Definiciones de documentos con contenido para vista previa
const DOCUMENT_TEMPLATES = {
  'contrato_compraventa': {
    id: 'contrato_compraventa',
    name: 'Contrato de Compraventa',
    description: 'Contrato principal de compraventa del vehículo',
    content: `CONTRATO DE COMPRAVENTA DE VEHÍCULO

Entre los suscritos a saber: {{empresa_nombre}}, identificada con RNC {{empresa_rnc}}, con domicilio en {{empresa_direccion}}, quien en adelante se denominará EL VENDEDOR, y {{cliente_nombre_completo}}, identificado(a) con cédula de ciudadanía número {{cliente_cedula}}, con domicilio en {{cliente_direccion}}, quien en adelante se denominará EL COMPRADOR, hemos convenido celebrar el presente contrato de compraventa, que se regirá por las siguientes cláusulas:

PRIMERA: OBJETO DEL CONTRATO
EL VENDEDOR se obliga a transferir la propiedad y EL COMPRADOR se obliga a adquirir el siguiente vehículo:
- Marca: {{vehiculo_marca}}
- Modelo: {{vehiculo_modelo}}
- Año: {{vehiculo_ano}}
- Color: {{vehiculo_color}}
- Condición: {{vehiculo_condicion}}
- Cantidad: {{vehiculo_cantidad}} unidad(es)

SEGUNDA: PRECIO
El precio total de la venta es de {{precio_total}} ({{precio_total_letras}}), que EL COMPRADOR se obliga a pagar de la siguiente manera:
- Tipo de venta: {{tipo_venta}}
- Cuota inicial: {{cuota_inicial}}
- Monto financiado: {{monto_financiado}}
- Tasa de interés: {{tasa_interes}} anual
- Número de cuotas: {{numero_cuotas}}
- Valor de cada cuota: {{valor_cuota}}
- Frecuencia de pago: {{frecuencia_pago}}

TERCERA: ENTREGA
EL VENDEDOR se compromete a entregar el vehículo en perfecto estado de funcionamiento en un plazo no mayor a 15 días calendario a partir de la firma del presente contrato.

En constancia de lo anterior, firmamos en {{fecha_venta_completa}}.

_________________________________          _________________________________
{{cliente_nombre_completo}}                {{empresa_nombre}}
EL COMPRADOR                               EL VENDEDOR
C.C. {{cliente_cedula}}`
  },
  'pagare_notarial': {
    id: 'pagare_notarial',
    name: 'Pagaré Notarial',
    description: 'Documento notarial que formaliza la obligación de pago',
    content: `PAGARÉ NOTARIAL

Por el presente documento, yo {{cliente_nombre_completo}}, portador(a) de la cédula de ciudadanía número {{cliente_cedula}}, con domicilio en {{cliente_direccion}}, reconozco que debo y prometo pagar a la orden de {{empresa_nombre}}, la suma de {{precio_total}} ({{precio_total_letras}}).

CONDICIONES DE PAGO:
- Fecha de vencimiento: {{fecha_ultimo_pago}}
- Tipo de venta: {{tipo_venta}}
- Número de cuotas: {{numero_cuotas}}
- Valor de cada cuota: {{valor_cuota}}
- Frecuencia de pago: {{frecuencia_pago}}

Este pagaré corresponde a la compra del vehículo: {{vehiculo_descripcion_completa}}.

Dado en la ciudad de ____________, a los {{dia_actual}} días del mes de ____________ del año {{ano_actual}}.

_________________________________
{{cliente_nombre_completo}}
C.C. {{cliente_cedula}}`
  },
  'estado_cuenta': {
    id: 'estado_cuenta',
    name: 'Estado de Cuenta',
    description: 'Estado de cuenta del cliente',
    content: `ESTADO DE CUENTA

Cliente: {{cliente_nombre_completo}}
Cédula: {{cliente_cedula}}
Dirección: {{cliente_direccion}}
Teléfono: {{cliente_telefono}}

DETALLE DE LA CUENTA:
Fecha de compra: {{fecha_venta}}
Vehículo: {{vehiculo_descripcion_completa}}
Valor total: {{precio_total}}
Cuota inicial: {{cuota_inicial}}
Saldo financiado: {{monto_financiado}}

CONDICIONES DE PAGO:
Tasa de interés: {{tasa_interes}}
Número de cuotas: {{numero_cuotas}}
Valor cuota: {{valor_cuota}}
Frecuencia: {{frecuencia_pago}}
Próximo pago: {{fecha_primer_pago}}

Fecha de emisión: {{fecha_actual}}

{{empresa_nombre}}`
  }
};

// Documentos adicionales que se pueden incluir en el recibo
const ADDITIONAL_DOCUMENTS: AdditionalDocument[] = [
  // Documentos legales comunes para ventas
  {
    id: 'contrato_compraventa',
    name: 'Contrato de Compraventa',
    category: 'legal',
    description: 'Contrato principal de compraventa del vehículo',
    recommended: true
  },
  {
    id: 'pagare_notarial',
    name: 'Pagaré Notarial',
    category: 'legal',
    description: 'Documento notarial que formaliza la obligación de pago',
    recommended: true
  },
  {
    id: 'carta_primera_placa',
    name: 'Carta de Solicitud de Primera Placa',
    category: 'legal',
    description: 'Solicitud para obtener la primera placa del vehículo',
    recommended: true
  },
  {
    id: 'autorizacion_buro_credito',
    name: 'Autorización Consulta Buró de Crédito',
    category: 'legal',
    description: 'Autorización para consultar buró de crédito',
    recommended: false
  },
  {
    id: 'programa_conozca_cliente',
    name: 'Programa "Conozca su Cliente"',
    category: 'legal',
    description: 'Formulario de conocimiento del cliente',
    recommended: false
  },
  
  // Documentos para clientes
  {
    id: 'estado_cuenta',
    name: 'Estado de Cuenta',
    category: 'client',
    description: 'Estado de cuenta del cliente',
    recommended: true
  },
  {
    id: 'carta_aprobacion_prestamo',
    name: 'Carta de Aprobación de Préstamo',
    category: 'client',
    description: 'Carta de aprobación de préstamo',
    recommended: true
  },
  {
    id: 'contrato_cliente_personal',
    name: 'Contrato de Cliente',
    category: 'client',
    description: 'Contrato personalizado del cliente',
    recommended: false
  },
  {
    id: 'factura_recibo_cliente',
    name: 'Factura - Recibo',
    category: 'client',
    description: 'Factura que sirve como recibo',
    recommended: true
  }
];

const ReviewStep: React.FC<ReviewStepProps> = ({ 
  data, 
  onUpdate, 
  errors, 
  onPreviousStep, 
  onSubmit 
}) => {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedAdditionalDocuments, setSelectedAdditionalDocuments] = useState<string[]>([]);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ id: string; name: string; content: string; description: string } | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPaymentFrequencyName = (frequency: string) => {
    const frequencies: { [key: string]: string } = {
      'diario': 'Diario',
      'semanal': 'Semanal',
      'quincenal': 'Quincenal',
      'mensual': 'Mensual'
    };
    return frequencies[frequency] || frequency;
  };

  const validateFormCompletion = () => {
    const issues: string[] = [];
    
    if (!data.customer) {
      issues.push('Información del cliente');
    }
    
    if (data.needsGuarantor && !data.guarantor) {
      issues.push('Información del garante');
    }
    
    if (!data.uploadedDocuments || data.uploadedDocuments.length === 0) {
      issues.push('Documentos requeridos');
    }
    
    if (!data.selectedMotorcycle) {
      issues.push('Selección de motocicleta');
    }
    
    if (!data.paymentType) {
      issues.push('Configuración de pago');
    }
    
    if (!data.legalDocuments || data.legalDocuments.length === 0) {
      issues.push('Documentos legales');
    }
    
    return issues;
  };

  const handlePrint = () => {
    // Crear contenido completo para impresión incluyendo documentos
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = generatePrintContent();
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generatePrintContent = () => {
    const selectedDocs = getAllSelectedDocuments();
    const documentContents = selectedDocs.map(docId => {
      const template = DOCUMENT_TEMPLATES[docId as keyof typeof DOCUMENT_TEMPLATES];
      if (template) {
        return {
          name: template.name,
          content: processDocumentTemplate(template.content)
        };
      }
      return null;
    }).filter(Boolean);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Venta - ${data.customer?.nombre} ${data.customer?.apellido}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .page-break { page-break-before: always; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; }
          .signature { margin-top: 80px; text-align: center; border-top: 1px solid #000; padding-top: 10px; }
          .document-content { white-space: pre-line; line-height: 1.5; }
        </style>
      </head>
      <body>
        <!-- Recibo Principal -->
        <div class="header">
          <h1>RECIBO DE VENTA</h1>
          <p>Inversiones Castillo</p>
          <p>Fecha: ${formatDate(new Date().toISOString())}</p>
        </div>

        <div class="grid">
          <div class="section">
            <h3>INFORMACIÓN DEL CLIENTE</h3>
            <p><strong>Nombre:</strong> ${data.customer?.nombre} ${data.customer?.apellido}</p>
            <p><strong>Cédula:</strong> ${data.customer?.cedula}</p>
            <p><strong>Teléfono:</strong> ${data.customer?.telefono}</p>
            <p><strong>Dirección:</strong> ${data.customer?.direccion}</p>
          </div>

          ${data.needsGuarantor && data.guarantor ? `
          <div class="section">
            <h3>INFORMACIÓN DEL GARANTE</h3>
            <p><strong>Nombre:</strong> ${data.guarantor.nombre} ${data.guarantor.apellido}</p>
            <p><strong>Cédula:</strong> ${data.guarantor.cedula}</p>
            <p><strong>Parentesco:</strong> ${data.guarantor.parentesco_cliente}</p>
            <p><strong>Teléfono:</strong> ${data.guarantor.telefono || data.guarantor.celular}</p>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <h3>DETALLE DEL PRODUCTO</h3>
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  ${data.selectedMotorcycle?.tipo === 'modelo'
                    ? `${data.selectedMotorcycle.modelo?.marca} ${data.selectedMotorcycle.modelo?.modelo} ${data.selectedMotorcycle.modelo?.ano}`
                    : `${data.selectedMotorcycle?.moto?.marca} ${data.selectedMotorcycle?.moto?.modelo} ${data.selectedMotorcycle?.moto?.ano}`
                  }
                  ${data.selectedMotorcycle?.color ? ` - Color: ${data.selectedMotorcycle.color}` : ''}
                  ${data.selectedMotorcycle?.chasis ? ` - Chasis: ${data.selectedMotorcycle.chasis}` : ''}
                </td>
                <td>${data.selectedMotorcycle?.cantidad}</td>
                <td>${formatCurrency(data.selectedMotorcycle?.precio_unitario || 0)}</td>
                <td><strong>${formatCurrency(getTotalAmount())}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>CONDICIONES DE PAGO</h3>
          <div class="grid">
            <div>
              <p><strong>Tipo de pago:</strong> ${data.paymentType === 'contado' ? 'Contado' : 'Financiado'}</p>
              ${data.paymentType === 'financiado' && data.financingDetails ? `
                <p><strong>Cuota inicial:</strong> ${formatCurrency(data.downPayment)}</p>
                <p><strong>Monto financiado:</strong> ${formatCurrency(data.financingDetails.financedAmount)}</p>
                <p><strong>Tasa de interés:</strong> ${data.financingDetails.interestRate}% anual</p>
              ` : ''}
            </div>
            <div>
              ${data.paymentType === 'financiado' && data.financingDetails ? `
                <p><strong>Número de cuotas:</strong> ${data.financingDetails.numberOfPayments}</p>
                <p><strong>Frecuencia:</strong> ${getPaymentFrequencyName(data.financingDetails.paymentFrequency)}</p>
                <p><strong>Valor cuota:</strong> ${formatCurrency(data.financingDetails.paymentAmount)}</p>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="grid" style="margin-top: 60px;">
          <div class="signature">
            <p>Firma del Cliente<br>${data.customer?.nombre} ${data.customer?.apellido}<br>C.C. ${data.customer?.cedula}</p>
          </div>
          <div class="signature">
            <p>Firma Autorizada<br>Inversiones Castillo</p>
          </div>
        </div>

        <!-- Documentos Adicionales -->
        ${documentContents.map(doc => `
          <div class="page-break">
            <div class="header">
              <h2>${doc?.name}</h2>
              <p>Inversiones Castillo</p>
            </div>
            <div class="document-content">
              ${doc?.content}
            </div>
          </div>
        `).join('')}

      </body>
      </html>
    `;
  };

  const processDocumentTemplate = (template: string) => {
    // Reemplazar variables del template con datos reales
    return template
      .replace(/\{\{empresa_nombre\}\}/g, 'Inversiones Castillo')
      .replace(/\{\{empresa_rnc\}\}/g, '123456789') // Agregar RNC real
      .replace(/\{\{empresa_direccion\}\}/g, 'Dirección de la empresa') // Agregar dirección real
      .replace(/\{\{cliente_nombre_completo\}\}/g, `${data.customer?.nombre} ${data.customer?.apellido}`)
      .replace(/\{\{cliente_nombre\}\}/g, data.customer?.nombre || '')
      .replace(/\{\{cliente_apellido\}\}/g, data.customer?.apellido || '')
      .replace(/\{\{cliente_cedula\}\}/g, data.customer?.cedula || '')
      .replace(/\{\{cliente_direccion\}\}/g, data.customer?.direccion || '')
      .replace(/\{\{cliente_telefono\}\}/g, data.customer?.telefono || '')
      .replace(/\{\{vehiculo_marca\}\}/g, data.selectedMotorcycle?.tipo === 'modelo' ? data.selectedMotorcycle.modelo?.marca || '' : data.selectedMotorcycle?.moto?.marca || '')
      .replace(/\{\{vehiculo_modelo\}\}/g, data.selectedMotorcycle?.tipo === 'modelo' ? data.selectedMotorcycle.modelo?.modelo || '' : data.selectedMotorcycle?.moto?.modelo || '')
      .replace(/\{\{vehiculo_ano\}\}/g, data.selectedMotorcycle?.tipo === 'modelo' ? data.selectedMotorcycle.modelo?.ano?.toString() || '' : data.selectedMotorcycle?.moto?.ano?.toString() || '')
      .replace(/\{\{vehiculo_color\}\}/g, data.selectedMotorcycle?.color || 'No especificado')
      .replace(/\{\{vehiculo_chasis\}\}/g, data.selectedMotorcycle?.chasis || 'No especificado')
      .replace(/\{\{vehiculo_condicion\}\}/g, data.selectedMotorcycle?.tipo === 'modelo' ? data.selectedMotorcycle.modelo?.condicion || '' : data.selectedMotorcycle?.moto?.condicion || '')
      .replace(/\{\{vehiculo_cantidad\}\}/g, data.selectedMotorcycle?.cantidad?.toString() || '1')
      .replace(/\{\{vehiculo_descripcion_completa\}\}/g, `${data.selectedMotorcycle?.tipo === 'modelo' ? `${data.selectedMotorcycle.modelo?.marca} ${data.selectedMotorcycle.modelo?.modelo} ${data.selectedMotorcycle.modelo?.ano}` : `${data.selectedMotorcycle?.moto?.marca} ${data.selectedMotorcycle?.moto?.modelo} ${data.selectedMotorcycle?.moto?.ano}`} ${data.selectedMotorcycle?.color ? `- ${data.selectedMotorcycle.color}` : ''} ${data.selectedMotorcycle?.chasis ? `- Chasis: ${data.selectedMotorcycle.chasis}` : ''}`)
      .replace(/\{\{precio_total\}\}/g, formatCurrency(getTotalAmount()))
      .replace(/\{\{precio_total_letras\}\}/g, 'CANTIDAD EN LETRAS') // Implementar conversión a letras
      .replace(/\{\{tipo_venta\}\}/g, data.paymentType === 'contado' ? 'Contado' : 'Financiado')
      .replace(/\{\{cuota_inicial\}\}/g, formatCurrency(data.downPayment))
      .replace(/\{\{monto_financiado\}\}/g, formatCurrency(data.financingDetails?.financedAmount || 0))
      .replace(/\{\{tasa_interes\}\}/g, data.financingDetails?.interestRate?.toString() || '0')
      .replace(/\{\{numero_cuotas\}\}/g, data.financingDetails?.numberOfPayments?.toString() || '0')
      .replace(/\{\{valor_cuota\}\}/g, formatCurrency(data.financingDetails?.paymentAmount || 0))
      .replace(/\{\{frecuencia_pago\}\}/g, getPaymentFrequencyName(data.financingDetails?.paymentFrequency || 'mensual'))
      .replace(/\{\{fecha_venta\}\}/g, formatDate(new Date().toISOString()))
      .replace(/\{\{fecha_venta_completa\}\}/g, formatDate(new Date().toISOString()))
      .replace(/\{\{fecha_actual\}\}/g, formatDate(new Date().toISOString()))
      .replace(/\{\{dia_actual\}\}/g, new Date().getDate().toString())
      .replace(/\{\{ano_actual\}\}/g, new Date().getFullYear().toString())
      .replace(/\{\{fecha_primer_pago\}\}/g, data.financingDetails?.paymentSchedule?.[0]?.date || 'No especificado')
      .replace(/\{\{fecha_ultimo_pago\}\}/g, data.financingDetails?.paymentSchedule?.[data.financingDetails.paymentSchedule.length - 1]?.date || 'No especificado');
  };

  const handleSave = async () => {
    setProcessing(true);
    try {
      // Actualizar los datos con los documentos adicionales seleccionados
      onUpdate({
        additionalDocuments: selectedAdditionalDocuments,
        allSelectedDocuments: getAllSelectedDocuments()
      });
      await onSubmit();
    } finally {
      setProcessing(false);
    }
  };

  const validationIssues = validateFormCompletion();
  const canProceed = validationIssues.length === 0;

  const getTotalAmount = () => {
    if (!data.selectedMotorcycle) return 0;
    return data.selectedMotorcycle.precio_unitario * data.selectedMotorcycle.cantidad;
  };

  const handleToggleAdditionalDocument = (docId: string) => {
    setSelectedAdditionalDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const getRecommendedDocuments = () => {
    return ADDITIONAL_DOCUMENTS.filter(doc => {
      if (doc.recommended) {
        // Documentos recomendados según el tipo de venta
        if (data.paymentType === 'financiado' && 
            ['pagare_notarial', 'carta_aprobacion_prestamo', 'estado_cuenta'].includes(doc.id)) {
          return true;
        }
        if (data.paymentType === 'contado' && 
            ['contrato_compraventa', 'factura_recibo_cliente'].includes(doc.id)) {
          return true;
        }
      }
      return false;
    });
  };

  const getAllSelectedDocuments = () => {
    return [...(data.legalDocuments || []), ...selectedAdditionalDocuments];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Revisión Final y Recibo
        </h3>
        <p className="text-gray-600">
          Revise toda la información antes de generar el recibo final de la venta.
        </p>
      </div>

      {/* Validación general */}
      {!canProceed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <h4 className="font-medium text-red-800">Información incompleta</h4>
              <p className="text-red-700 text-sm mt-1">
                Complete las siguientes secciones antes de continuar:
              </p>
              <ul className="text-red-700 text-sm mt-2 list-disc list-inside">
                {validationIssues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {canProceed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
          <span className="text-green-800">
            Toda la información está completa. Puede proceder a generar el recibo.
          </span>
        </div>
      )}

      {/* Información del Cliente */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Información del Cliente
          </h4>
          <button
            onClick={() => onPreviousStep()}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </button>
        </div>
        
        {data.customer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Nombre completo:</span>
              <p className="font-medium">{data.customer.nombre} {data.customer.apellido}</p>
            </div>
            <div>
              <span className="text-gray-600">Cédula:</span>
              <p className="font-medium">{data.customer.cedula}</p>
            </div>
            <div>
              <span className="text-gray-600">Teléfono:</span>
              <p className="font-medium">{data.customer.telefono}</p>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <p className="font-medium">{data.customer.email || 'No proporcionado'}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-gray-600">Dirección:</span>
              <p className="font-medium">{data.customer.direccion}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 italic">No hay información del cliente</p>
        )}
      </div>

      {/* Información del Garante */}
      {data.needsGuarantor && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Información del Garante
          </h4>
          
          {data.guarantor ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Nombre completo:</span>
                <p className="font-medium">{data.guarantor.nombre} {data.guarantor.apellido}</p>
              </div>
              <div>
                <span className="text-gray-600">Cédula:</span>
                <p className="font-medium">{data.guarantor.cedula}</p>
              </div>
              <div>
                <span className="text-gray-600">Parentesco:</span>
                <p className="font-medium">{data.guarantor.parentesco_cliente}</p>
              </div>
              <div>
                <span className="text-gray-600">Teléfono:</span>
                <p className="font-medium">{data.guarantor.telefono || data.guarantor.celular}</p>
              </div>
              <div>
                <span className="text-gray-600">Ocupación:</span>
                <p className="font-medium">{data.guarantor.ocupacion}</p>
              </div>
              <div>
                <span className="text-gray-600">Ingresos:</span>
                <p className="font-medium">
                  {data.guarantor.ingresos ? formatCurrency(data.guarantor.ingresos) : 'No especificado'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No hay información del garante</p>
          )}
        </div>
      )}

      {/* Motocicleta Seleccionada */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Bike className="h-5 w-5 mr-2" />
          Motocicleta Seleccionada
        </h4>
        
        {data.selectedMotorcycle ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Motocicleta:</span>
              <p className="font-medium">
                {data.selectedMotorcycle.tipo === 'modelo'
                  ? `${data.selectedMotorcycle.modelo?.marca} ${data.selectedMotorcycle.modelo?.modelo}`
                  : `${data.selectedMotorcycle.moto?.marca} ${data.selectedMotorcycle.moto?.modelo}`
                }
              </p>
            </div>
            <div>
              <span className="text-gray-600">Año:</span>
              <p className="font-medium">
                {data.selectedMotorcycle.tipo === 'modelo'
                  ? data.selectedMotorcycle.modelo?.ano
                  : data.selectedMotorcycle.moto?.ano
                }
              </p>
            </div>
            {data.selectedMotorcycle.color && (
              <div>
                <span className="text-gray-600">Color:</span>
                <p className="font-medium">{data.selectedMotorcycle.color}</p>
              </div>
            )}
            {data.selectedMotorcycle.chasis && (
              <div>
                <span className="text-gray-600">Chasis:</span>
                <p className="font-medium">{data.selectedMotorcycle.chasis}</p>
              </div>
            )}
            <div>
              <span className="text-gray-600">Cantidad:</span>
              <p className="font-medium">{data.selectedMotorcycle.cantidad}</p>
            </div>
            <div>
              <span className="text-gray-600">Precio unitario:</span>
              <p className="font-medium">{formatCurrency(data.selectedMotorcycle.precio_unitario)}</p>
            </div>
            <div>
              <span className="text-gray-600">Total:</span>
              <p className="font-bold text-lg text-blue-600">{formatCurrency(getTotalAmount())}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 italic">No hay motocicleta seleccionada</p>
        )}
      </div>

      {/* Información de Pago */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Información de Pago
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Tipo de pago:</span>
            <p className="font-medium capitalize">{data.paymentType}</p>
          </div>
          
          {data.paymentType === 'financiado' && data.financingDetails && (
            <>
              <div>
                <span className="text-gray-600">Cuota inicial:</span>
                <p className="font-medium">{formatCurrency(data.downPayment)}</p>
              </div>
              <div>
                <span className="text-gray-600">Monto financiado:</span>
                <p className="font-medium">{formatCurrency(data.financingDetails.financedAmount)}</p>
              </div>
              <div>
                <span className="text-gray-600">Tasa de interés:</span>
                <p className="font-medium">{data.financingDetails.interestRate}% anual</p>
              </div>
              <div>
                <span className="text-gray-600">Número de cuotas:</span>
                <p className="font-medium">{data.financingDetails.numberOfPayments}</p>
              </div>
              <div>
                <span className="text-gray-600">Frecuencia:</span>
                <p className="font-medium">{getPaymentFrequencyName(data.financingDetails.paymentFrequency)}</p>
              </div>
              <div>
                <span className="text-gray-600">Cuota {getPaymentFrequencyName(data.financingDetails.paymentFrequency).toLowerCase()}:</span>
                <p className="font-medium">{formatCurrency(data.financingDetails.paymentAmount)}</p>
              </div>
            </>
          )}
        </div>

        {/* Cronograma de pagos resumido */}
        {data.paymentType === 'financiado' && data.financingDetails?.paymentSchedule && (
          <div className="mt-4">
            <h5 className="font-medium text-gray-900 mb-2">Próximos 5 pagos:</h5>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600 mb-2">
                <span>Fecha</span>
                <span>Cuota</span>
                <span>Saldo</span>
              </div>
              {data.financingDetails.paymentSchedule.slice(0, 5).map((payment) => (
                <div key={payment.number} className="grid grid-cols-3 gap-2 text-xs text-gray-900 py-1">
                  <span>{payment.date}</span>
                  <span>{formatCurrency(payment.amount)}</span>
                  <span>{formatCurrency(payment.balance)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Documentos */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Documentos
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Documentos Subidos</h5>
            {data.uploadedDocuments && data.uploadedDocuments.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {data.uploadedDocuments.map((doc, index) => (
                  <li key={index} className="flex items-center">
                    <FileCheck className="h-4 w-4 text-green-600 mr-2" />
                    {doc.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic text-sm">No hay documentos subidos</p>
            )}
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Documentos Legales Seleccionados</h5>
            {data.legalDocuments && data.legalDocuments.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {data.legalDocuments.map((docId, index) => (
                  <li key={index} className="flex items-center">
                    <Scale className="h-4 w-4 text-blue-600 mr-2" />
                    {docId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic text-sm">No hay documentos legales seleccionados</p>
            )}
          </div>
        </div>
      </div>

      {/* Documentos Adicionales para el Recibo */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <FolderOpen className="h-5 w-5 mr-2" />
            Documentos Adicionales para el Recibo
          </h4>
          <button
            onClick={() => setShowDocumentSelector(!showDocumentSelector)}
            className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            <Plus className="h-4 w-4 mr-1" />
            {showDocumentSelector ? 'Ocultar' : 'Agregar'} Documentos
          </button>
        </div>

        {/* Documentos recomendados */}
        {getRecommendedDocuments().length > 0 && (
          <div className="mb-4">
            <h5 className="font-medium text-gray-900 mb-2">Documentos Recomendados para esta Venta</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getRecommendedDocuments().map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleToggleAdditionalDocument(doc.id)}
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    selectedAdditionalDocuments.includes(doc.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h6 className="font-medium text-gray-900 text-sm">{doc.name}</h6>
                      <p className="text-xs text-gray-600">{doc.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {DOCUMENT_TEMPLATES[doc.id as keyof typeof DOCUMENT_TEMPLATES] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDocument(DOCUMENT_TEMPLATES[doc.id as keyof typeof DOCUMENT_TEMPLATES]);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800 rounded"
                          title="Vista previa con datos reales"
                        >
                          <PlayCircle className="h-4 w-4" />
                        </button>
                      )}
                      {selectedAdditionalDocuments.includes(doc.id) && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selector expandible de todos los documentos */}
        {showDocumentSelector && (
          <div className="border-t pt-4">
            <h5 className="font-medium text-gray-900 mb-3">Todos los Documentos Disponibles</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {ADDITIONAL_DOCUMENTS.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleToggleAdditionalDocument(doc.id)}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedAdditionalDocuments.includes(doc.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h6 className="font-medium text-gray-900 text-sm">{doc.name}</h6>
                        {doc.recommended && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Recomendado
                          </span>
                        )}
                        <span className={`ml-2 text-xs px-2 py-1 rounded ${
                          doc.category === 'legal' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {doc.category === 'legal' ? 'Legal' : 'Cliente'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
                    </div>
                    {selectedAdditionalDocuments.includes(doc.id) && (
                      <CheckCircle className="h-5 w-5 text-blue-600 ml-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen de documentos seleccionados */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h6 className="font-medium text-gray-900 mb-2">
            Documentos que se incluirán en el recibo ({getAllSelectedDocuments().length})
          </h6>
          {getAllSelectedDocuments().length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {getAllSelectedDocuments().map((docId) => {
                const document = ADDITIONAL_DOCUMENTS.find(d => d.id === docId);
                const isLegalDoc = data.legalDocuments?.includes(docId);
                return (
                  <span
                    key={docId}
                    className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      isLegalDoc 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {document ? document.name : docId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {DOCUMENT_TEMPLATES[docId as keyof typeof DOCUMENT_TEMPLATES] && (
                      <button
                        onClick={() => setPreviewDocument(DOCUMENT_TEMPLATES[docId as keyof typeof DOCUMENT_TEMPLATES])}
                        className="ml-1 hover:text-blue-600"
                        title="Vista previa con datos reales"
                      >
                        <PlayCircle className="h-3 w-3" />
                      </button>
                    )}
                    {!isLegalDoc && (
                      <button
                        onClick={() => handleToggleAdditionalDocument(docId)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              Solo se incluirán los documentos legales seleccionados en pasos anteriores
            </p>
          )}
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Resumen Financiero
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(getTotalAmount())}</div>
            <div className="text-sm text-blue-700">Valor Total</div>
          </div>
          
          {data.paymentType === 'financiado' && (
            <>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(data.downPayment)}</div>
                <div className="text-sm text-green-700">Cuota Inicial</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {data.financingDetails ? formatCurrency(data.financingDetails.paymentAmount) : '$0'}
                </div>
                <div className="text-sm text-purple-700">
                  Cuota {data.financingDetails ? getPaymentFrequencyName(data.financingDetails.paymentFrequency) : ''}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <button
          onClick={() => setShowPrintPreview(!showPrintPreview)}
          className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          <Eye className="h-4 w-4 mr-2" />
          {showPrintPreview ? 'Ocultar' : 'Vista'} Previa
        </button>
        
        <button
          onClick={handlePrint}
          disabled={!canProceed}
          className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </button>
        
        <button
          onClick={handleSave}
          disabled={!canProceed || processing}
          className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          {processing ? 'Guardando...' : 'Guardar Venta'}
        </button>
      </div>

      {/* Vista previa para impresión */}
      {showPrintPreview && (
        <div className="block">
          <div className="bg-white p-8 border border-gray-300 rounded-lg max-w-4xl mx-auto print:shadow-none print:border-0">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">RECIBO DE VENTA</h1>
              <p className="text-gray-600">Inversiones Castillo</p>
              <p className="text-sm text-gray-500">Fecha: {formatDate(new Date().toISOString())}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">INFORMACIÓN DEL CLIENTE</h3>
                {data.customer && (
                  <div className="space-y-1 text-sm">
                    <p><strong>Nombre:</strong> {data.customer.nombre} {data.customer.apellido}</p>
                    <p><strong>Cédula:</strong> {data.customer.cedula}</p>
                    <p><strong>Teléfono:</strong> {data.customer.telefono}</p>
                    <p><strong>Dirección:</strong> {data.customer.direccion}</p>
                  </div>
                )}
              </div>

              {data.needsGuarantor && data.guarantor && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">INFORMACIÓN DEL GARANTE</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Nombre:</strong> {data.guarantor.nombre} {data.guarantor.apellido}</p>
                    <p><strong>Cédula:</strong> {data.guarantor.cedula}</p>
                    <p><strong>Parentesco:</strong> {data.guarantor.parentesco_cliente}</p>
                    <p><strong>Teléfono:</strong> {data.guarantor.telefono || data.guarantor.celular}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">DETALLE DEL PRODUCTO</h3>
              {data.selectedMotorcycle && (
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">Descripción</th>
                      <th className="border border-gray-300 p-2 text-center">Cantidad</th>
                      <th className="border border-gray-300 p-2 text-right">Precio Unit.</th>
                      <th className="border border-gray-300 p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2">
                        {data.selectedMotorcycle.tipo === 'modelo'
                          ? `${data.selectedMotorcycle.modelo?.marca} ${data.selectedMotorcycle.modelo?.modelo} ${data.selectedMotorcycle.modelo?.ano}`
                          : `${data.selectedMotorcycle.moto?.marca} ${data.selectedMotorcycle.moto?.modelo} ${data.selectedMotorcycle.moto?.ano}`
                        }
                        {data.selectedMotorcycle.color && ` - Color: ${data.selectedMotorcycle.color}`}
                        {data.selectedMotorcycle.chasis && ` - Chasis: ${data.selectedMotorcycle.chasis}`}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">{data.selectedMotorcycle.cantidad}</td>
                      <td className="border border-gray-300 p-2 text-right">{formatCurrency(data.selectedMotorcycle.precio_unitario)}</td>
                      <td className="border border-gray-300 p-2 text-right font-bold">{formatCurrency(getTotalAmount())}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">CONDICIONES DE PAGO</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong>Tipo de pago:</strong> {data.paymentType === 'contado' ? 'Contado' : 'Financiado'}</p>
                {data.paymentType === 'financiado' && data.financingDetails && (
                  <>
                    <p><strong>Cuota inicial:</strong> {formatCurrency(data.downPayment)}</p>
                    <p><strong>Monto financiado:</strong> {formatCurrency(data.financingDetails.financedAmount)}</p>
                    <p><strong>Tasa de interés:</strong> {data.financingDetails.interestRate}% anual</p>
                    <p><strong>Número de cuotas:</strong> {data.financingDetails.numberOfPayments}</p>
                    <p><strong>Frecuencia:</strong> {getPaymentFrequencyName(data.financingDetails.paymentFrequency)}</p>
                    <p><strong>Valor cuota:</strong> {formatCurrency(data.financingDetails.paymentAmount)}</p>
                  </>
                )}
              </div>
            </div>

            {/* Documentos incluidos en la venta */}
            {getAllSelectedDocuments().length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-2">DOCUMENTOS INCLUIDOS</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {getAllSelectedDocuments().map((docId, index) => {
                    const document = ADDITIONAL_DOCUMENTS.find(d => d.id === docId);
                    const isLegalDoc = data.legalDocuments?.includes(docId);
                    return (
                      <div key={docId} className="flex items-center">
                        <span className="mr-2">{index + 1}.</span>
                        <span>
                          {document ? document.name : docId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          {isLegalDoc && <span className="text-xs text-green-600 ml-1">(Legal)</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-xs text-gray-600">
                  <p><strong>Nota:</strong> Los documentos marcados se entregarán junto con este recibo.</p>
                </div>
              </div>
            )}

            <div className="mt-12 grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="border-t border-gray-400 pt-2">
                  <p className="text-sm">Firma del Cliente</p>
                  <p className="text-xs">{data.customer?.nombre} {data.customer?.apellido}</p>
                  <p className="text-xs">C.C. {data.customer?.cedula}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 pt-2">
                  <p className="text-sm">Firma Autorizada</p>
                  <p className="text-xs">Inversiones Castillo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista previa de documento con datos reales */}
      {previewDocument && (
        <DocumentPreviewWithData
          document={previewDocument}
          ventaData={data}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
};

export default ReviewStep;