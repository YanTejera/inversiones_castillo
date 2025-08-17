import React, { useState, useEffect } from 'react';
import {
  FileText,
  Scale,
  User,
  Edit,
  Eye,
  EyeOff,
  Printer,
  Send,
  Plus,
  Search,
  Filter,
  Download,
  Settings,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { getAvailableVariables } from '../services/documentVariables';
import ViewToggle from '../components/common/ViewToggle';

interface DocumentTemplate {
  id: string;
  name: string;
  category: 'legal' | 'client';
  description: string;
  content: string;
  isVisible: boolean;
  isEditable: boolean;
  lastModified: string;
  createdBy: string;
  variables: string[]; // Variables que se pueden rellenar automáticamente
}

const LEGAL_DOCUMENTS: Omit<DocumentTemplate, 'lastModified' | 'createdBy'>[] = [
  {
    id: 'pagare_notarial',
    name: 'Pagaré Notarial',
    category: 'legal',
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

En caso de incumplimiento, me obligo a pagar intereses moratorios del 1.5% mensual sobre el saldo insoluto.

Dado en la ciudad de ____________, a los {{dia_actual}} días del mes de ____________ del año {{ano_actual}}.

_________________________________
{{cliente_nombre_completo}}
C.C. {{cliente_cedula}}

_________________________________
Testigo

_________________________________
{{empresa_nombre}}`,
    isVisible: true,
    isEditable: true,
    variables: []
  },
  {
    id: 'carta_ruta',
    name: 'Carta de Ruta',
    category: 'legal',
    description: 'Documento de ruta para traslado de vehículos',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['vehiculo', 'origen', 'destino', 'fecha']
  },
  {
    id: 'entrega_voluntaria',
    name: 'Entrega Voluntaria',
    category: 'legal',
    description: 'Documento de entrega voluntaria del vehículo',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'vehiculo', 'fecha']
  },
  {
    id: 'contrato_compraventa',
    name: 'Contrato de Compraventa',
    category: 'legal',
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
{{#if cuota_inicial}}
- Cuota inicial: {{cuota_inicial}}
- Monto financiado: {{monto_financiado}}
- Tasa de interés: {{tasa_interes}} anual
- Número de cuotas: {{numero_cuotas}}
- Valor de cada cuota: {{valor_cuota}}
- Frecuencia de pago: {{frecuencia_pago}}
{{/if}}

TERCERA: ENTREGA
EL VENDEDOR se compromete a entregar el vehículo en perfecto estado de funcionamiento en un plazo no mayor a 15 días calendario a partir de la firma del presente contrato.

CUARTA: GARANTÍA
EL VENDEDOR otorga garantía sobre el vehículo por defectos de fábrica por un período de 6 meses o 10,000 kilómetros, lo que ocurra primero.

QUINTA: TRANSFERENCIA
Los gastos de transferencia de la propiedad del vehículo serán por cuenta de EL COMPRADOR.

En constancia de lo anterior, firmamos en {{fecha_venta_completa}}.

_________________________________          _________________________________
{{cliente_nombre_completo}}                {{empresa_nombre}}
EL COMPRADOR                               EL VENDEDOR
C.C. {{cliente_cedula}}`,
    isVisible: true,
    isEditable: true,
    variables: []
  },
  {
    id: 'contrato_cliente',
    name: 'Contrato de Cliente',
    category: 'legal',
    description: 'Contrato específico con el cliente',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'terminos', 'fecha']
  },
  {
    id: 'solicitud_endoso',
    name: 'Solicitud de Endoso',
    category: 'legal',
    description: 'Solicitud para endoso del vehículo',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['vehiculo', 'cliente_nombre', 'numero_placa']
  },
  {
    id: 'intimacion_compulsa',
    name: 'Intimación y Compulsa Notarial',
    category: 'legal',
    description: 'Documento de intimación y compulsa notarial',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'monto_adeudado', 'fecha']
  },
  {
    id: 'factura_endoso_dgii',
    name: 'Factura para Realizar el Endoso en la DGII',
    category: 'legal',
    description: 'Factura específica para trámites de endoso en DGII',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['vehiculo', 'monto', 'numero_factura']
  },
  {
    id: 'carta_primera_placa',
    name: 'Carta de Solicitud de la Primera Placa',
    category: 'legal',
    description: 'Solicitud para obtener la primera placa del vehículo',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['vehiculo', 'cliente_nombre', 'fecha']
  },
  {
    id: 'carta_placa_importado',
    name: 'Carta de Solicitud Primera Placa Vehículo Importado',
    category: 'legal',
    description: 'Solicitud de placa para vehículos recién importados',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['vehiculo', 'numero_importacion', 'cliente_nombre']
  },
  {
    id: 'programa_conozca_cliente',
    name: 'Programa "Conozca su Cliente"',
    category: 'legal',
    description: 'Formulario de conocimiento del cliente',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_datos', 'ocupacion', 'ingresos']
  },
  {
    id: 'programa_cliente_fisico',
    name: 'Programa "Conozca su Cliente" (Cliente Físico)',
    category: 'legal',
    description: 'Formulario específico para personas físicas',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'cedula', 'direccion', 'telefono']
  },
  {
    id: 'carta_oposicion_dgii',
    name: 'Carta de Oposición a la DGII',
    category: 'legal',
    description: 'Carta de oposición dirigida a la DGII',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'motivo', 'fecha']
  },
  {
    id: 'carta_levantamiento_oposicion',
    name: 'Carta de Levantamiento de Oposición',
    category: 'legal',
    description: 'Solicitud de levantamiento de oposición',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'numero_oposicion', 'fecha']
  },
  {
    id: 'intimacion_pago',
    name: 'Intimación de Pago',
    category: 'legal',
    description: 'Documento de intimación de pago',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'monto_adeudado', 'fecha_limite']
  },
  {
    id: 'carta_referencias_comerciales',
    name: 'Carta Referencias Comerciales Cliente',
    category: 'legal',
    description: 'Solicitud de referencias comerciales del cliente',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'referencias', 'fecha']
  },
  {
    id: 'autorizacion_buro_credito',
    name: 'Autorización Consulta Buró de Crédito',
    category: 'legal',
    description: 'Autorización para consultar buró de crédito',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'cedula', 'fecha']
  },
  {
    id: 'intimacion_amigable',
    name: 'Carta de Intimación Amigable',
    category: 'legal',
    description: 'Intimación amigable de pago',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'monto', 'fecha']
  },
  {
    id: 'solicitud_credito_legal',
    name: 'Solicitud de Crédito',
    category: 'legal',
    description: 'Formulario legal de solicitud de crédito',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_datos', 'monto_solicitado', 'garantias']
  },
  {
    id: 'descargo_responsabilidad',
    name: 'Descargo de Responsabilidad Civil y/o Penal',
    category: 'legal',
    description: 'Documento de descargo de responsabilidad',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'vehiculo', 'fecha']
  },
  {
    id: 'factura_recibo',
    name: 'Factura-Recibo',
    category: 'legal',
    description: 'Factura que funciona como recibo',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'productos', 'monto_total']
  },
  {
    id: 'declaracion_responsabilidad',
    name: 'Declaración de Responsabilidad',
    category: 'legal',
    description: 'Declaración de responsabilidad del cliente',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'declaracion', 'fecha']
  },
  {
    id: 'autorizacion_entrega_documentos',
    name: 'Autorización para Entrega de Documentos',
    category: 'legal',
    description: 'Autorización para entrega de documentos a terceros',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'persona_autorizada', 'documentos']
  },
  {
    id: 'carta_garantia',
    name: 'A Quien Pueda Interesar (Garantía)',
    category: 'legal',
    description: 'Carta de garantía dirigida a quien pueda interesar',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'garantia', 'fecha']
  },
  {
    id: 'certificacion_apartado',
    name: 'Certificación de Apartado',
    category: 'legal',
    description: 'Certificación de apartado de vehículo',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['vehiculo', 'cliente_nombre', 'monto_apartado']
  },
  {
    id: 'contrato_dos_partes',
    name: 'Contrato entre Dos Partes',
    category: 'legal',
    description: 'Contrato general entre dos partes',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['parte_a', 'parte_b', 'terminos', 'fecha']
  },
  {
    id: 'datos_localizacion_cliente',
    name: 'Datos para Localización del Cliente',
    category: 'legal',
    description: 'Formulario de datos de localización',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_datos', 'referencias_personales', 'direcciones']
  },
  {
    id: 'contrato_prestamo_empresa',
    name: 'Contrato de Préstamo (Empresa)',
    category: 'legal',
    description: 'Contrato de préstamo empresarial',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['empresa', 'monto', 'interes', 'plazo']
  }
];

const CLIENT_DOCUMENTS: Omit<DocumentTemplate, 'lastModified' | 'createdBy'>[] = [
  {
    id: 'solicitud_credito_cliente',
    name: 'Solicitud de Crédito',
    category: 'client',
    description: 'Formulario de solicitud de crédito para el cliente',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'monto_solicitado', 'ingresos']
  },
  {
    id: 'solicitud_endoso_cliente',
    name: 'Solicitud de Endoso',
    category: 'client',
    description: 'Formulario de solicitud de endoso',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['vehiculo', 'numero_placa', 'cliente_nombre']
  },
  {
    id: 'carta_solicitar_placa',
    name: 'Carta para Solicitar Placa',
    category: 'client',
    description: 'Carta para solicitar placa del vehículo',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['vehiculo', 'cliente_nombre', 'documentos']
  },
  {
    id: 'listado_solicitudes_placa',
    name: 'Listado de Solicitudes de Placa',
    category: 'client',
    description: 'Lista de solicitudes de placa pendientes',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['fecha', 'solicitudes']
  },
  {
    id: 'seleccion_solicitudes_placa',
    name: 'Selección de Solicitudes de Placa',
    category: 'client',
    description: 'Formulario de selección de solicitudes',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['solicitudes_seleccionadas', 'fecha']
  },
  {
    id: 'estado_cuenta',
    name: 'Estado de Cuenta',
    category: 'client',
    description: 'Estado de cuenta del cliente',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'saldo_actual', 'movimientos', 'fecha']
  },
  {
    id: 'carta_saldo',
    name: 'Carta de Saldo',
    category: 'client',
    description: 'Carta informativa del saldo actual',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'saldo', 'fecha_corte']
  },
  {
    id: 'carta_levantamiento_oposicion_cliente',
    name: 'Carta de Levantamiento de Oposición',
    category: 'client',
    description: 'Carta para levantar oposición del cliente',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'numero_oposicion', 'motivo']
  },
  {
    id: 'carta_aprobacion_prestamo',
    name: 'Carta de Aprobación de Préstamo',
    category: 'client',
    description: 'Carta de aprobación de préstamo',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'monto_aprobado', 'condiciones']
  },
  {
    id: 'pagare_notarial_cliente',
    name: 'Pagaré Notarial',
    category: 'client',
    description: 'Pagaré notarial para el cliente',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'monto', 'fecha_vencimiento']
  },
  {
    id: 'contrato_cliente_personal',
    name: 'Contrato de Cliente',
    category: 'client',
    description: 'Contrato personalizado del cliente',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'servicios', 'condiciones']
  },
  {
    id: 'entrega_voluntaria_cliente',
    name: 'Entrega Voluntaria',
    category: 'client',
    description: 'Documento de entrega voluntaria del cliente',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'vehiculo', 'fecha']
  },
  {
    id: 'carta_ruta_cliente',
    name: 'Carta de Ruta',
    category: 'client',
    description: 'Carta de ruta para el cliente',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['origen', 'destino', 'vehiculo', 'fecha']
  },
  {
    id: 'factura_conduce',
    name: 'Factura y Conduce',
    category: 'client',
    description: 'Factura con documento de conduce',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['productos', 'cantidad', 'precio', 'destino']
  },
  {
    id: 'factura_recibo_cliente',
    name: 'Factura - Recibo',
    category: 'client',
    description: 'Factura que sirve como recibo',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'productos', 'total']
  },
  {
    id: 'contrato_alquiler',
    name: 'Contrato de Alquiler',
    category: 'client',
    description: 'Contrato de alquiler de vehículo',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'vehiculo', 'precio_alquiler', 'periodo']
  },
  {
    id: 'acto_venta_condicional',
    name: 'Acto de Venta (Contrato de Venta Condicional)',
    category: 'client',
    description: 'Contrato de venta condicional',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'vehiculo', 'condiciones', 'precio']
  },
  {
    id: 'acuerdo_traspaso_particulares',
    name: 'Acuerdo de Traspaso entre Particulares',
    category: 'client',
    description: 'Acuerdo de traspaso entre personas particulares',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['vendedor', 'comprador', 'vehiculo', 'precio']
  },
  {
    id: 'intimacion_acto_oposicion',
    name: 'Intimación de Pago y Acto de Oposición',
    category: 'client',
    description: 'Documento de intimación y oposición',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'monto_adeudado', 'fecha_limite']
  },
  {
    id: 'carta_descargo_cliente',
    name: 'Carta de Descargo',
    category: 'client',
    description: 'Carta de descargo del cliente',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre', 'motivo_descargo', 'fecha']
  },
  {
    id: 'carta_amet_vehiculo_preso',
    name: 'Carta AMET (Vehículo Preso)',
    category: 'client',
    description: 'Carta dirigida a AMET por vehículo retenido',
    content: '',
    isVisible: true,
    isEditable: true,
    variables: ['vehiculo', 'numero_placa', 'motivo_retencion', 'cliente_nombre']
  }
];

const Documentos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'legal' | 'client'>('legal');
  const [documents, setDocuments] = useState<DocumentTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisible, setFilterVisible] = useState('all'); // all, visible, hidden
  const [selectedDocument, setSelectedDocument] = useState<DocumentTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Inicializar documentos
  useEffect(() => {
    const availableVariables = getAvailableVariables();
    const allDocuments: DocumentTemplate[] = [
      ...LEGAL_DOCUMENTS.map(doc => ({
        ...doc,
        variables: availableVariables, // Usar todas las variables disponibles
        lastModified: new Date().toISOString(),
        createdBy: 'Sistema'
      })),
      ...CLIENT_DOCUMENTS.map(doc => ({
        ...doc,
        variables: availableVariables, // Usar todas las variables disponibles
        lastModified: new Date().toISOString(),
        createdBy: 'Sistema'
      }))
    ];
    setDocuments(allDocuments);
  }, []);

  // Filtrar documentos
  const filteredDocuments = documents.filter(doc => {
    const matchesTab = doc.category === activeTab;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVisibility = filterVisible === 'all' || 
                             (filterVisible === 'visible' && doc.isVisible) ||
                             (filterVisible === 'hidden' && !doc.isVisible);
    
    return matchesTab && matchesSearch && matchesVisibility;
  });

  const handleToggleVisibility = (docId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId ? { ...doc, isVisible: !doc.isVisible } : doc
    ));
  };

  const handleEditDocument = (document: DocumentTemplate) => {
    setSelectedDocument(document);
    setShowEditor(true);
  };

  const handlePreviewDocument = (document: DocumentTemplate) => {
    setSelectedDocument(document);
    setShowPreview(true);
  };

  const handleSaveDocument = (content: string) => {
    if (selectedDocument) {
      setDocuments(prev => prev.map(doc => 
        doc.id === selectedDocument.id 
          ? { ...doc, content, lastModified: new Date().toISOString() }
          : doc
      ));
      setShowEditor(false);
      setSelectedDocument(null);
    }
  };

  const handlePrintDocument = (document: DocumentTemplate) => {
    // Crear ventana de impresión
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${document.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .content { margin-top: 20px; line-height: 1.6; }
            </style>
          </head>
          <body>
            <h1>${document.name}</h1>
            <div class="content">${document.content || 'Documento sin contenido'}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSendDocument = (document: DocumentTemplate) => {
    // Aquí iría la lógica para enviar el documento por email
    alert(`Función de envío para ${document.name} (por implementar)`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Documentos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra plantillas de documentos legales y para clientes
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Documento
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('legal')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'legal'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Scale className="h-4 w-4 mr-2" />
              Documentos Legales
              <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                {documents.filter(d => d.category === 'legal').length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('client')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'client'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Documentos para Clientes
              <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                {documents.filter(d => d.category === 'client').length}
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterVisible}
          onChange={(e) => setFilterVisible(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los documentos</option>
          <option value="visible">Solo visibles</option>
          <option value="hidden">Solo ocultos</option>
        </select>

        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Documents Display */}
      {viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${
                !document.isVisible ? 'opacity-60 border-l-4 border-gray-400' : 'border-l-4 border-blue-500'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {document.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {document.description}
                  </p>
                </div>
                <div className="ml-2">
                  {document.isVisible ? (
                    <Eye className="h-5 w-5 text-green-600" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Variables */}
              {document.variables.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Variables disponibles:</p>
                  <div className="flex flex-wrap gap-1">
                    {document.variables.slice(0, 3).map((variable) => (
                      <span
                        key={variable}
                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {variable}
                      </span>
                    ))}
                    {document.variables.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{document.variables.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="text-xs text-gray-500 mb-4">
                <p>Modificado: {new Date(document.lastModified).toLocaleDateString('es-CO')}</p>
                <p>Por: {document.createdBy}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePreviewDocument(document)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Vista previa"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditDocument(document)}
                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handlePrintDocument(document)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    title="Imprimir"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleSendDocument(document)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    title="Enviar"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => handleToggleVisibility(document.id)}
                  className={`p-2 rounded-lg ${
                    document.isVisible
                      ? 'text-gray-600 hover:bg-gray-50'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                  title={document.isVisible ? 'Ocultar' : 'Mostrar'}
                >
                  {document.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modificado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variables
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          !document.isVisible ? 'bg-gray-400' : 'bg-blue-500'
                        }`}></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {document.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {document.category === 'legal' ? 'Legal' : 'Cliente'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {document.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        document.isVisible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {document.isVisible ? 'Visible' : 'Oculto'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(document.lastModified).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500">
                        {document.variables.length} variables
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handlePreviewDocument(document)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Vista previa"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditDocument(document)}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePrintDocument(document)}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="Imprimir"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleSendDocument(document)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Enviar"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleVisibility(document.id)}
                          className={`p-1 rounded ${
                            document.isVisible
                              ? 'text-gray-600 hover:bg-gray-50'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                          title={document.isVisible ? 'Ocultar' : 'Mostrar'}
                        >
                          {document.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay documentos</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron documentos con ese criterio de búsqueda.' : 'No hay documentos disponibles en esta categoría.'}
          </p>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && selectedDocument && (
        <DocumentEditor
          document={selectedDocument}
          onSave={handleSaveDocument}
          onClose={() => {
            setShowEditor(false);
            setSelectedDocument(null);
          }}
        />
      )}

      {/* Preview Modal */}
      {showPreview && selectedDocument && (
        <DocumentPreview
          document={selectedDocument}
          onClose={() => {
            setShowPreview(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </div>
  );
};

// Componente Editor de Documentos
interface DocumentEditorProps {
  document: DocumentTemplate;
  onSave: (content: string) => void;
  onClose: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ document, onSave, onClose }) => {
  const [content, setContent] = useState(document.content);
  const [showVariables, setShowVariables] = useState(false);

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('document-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + `{{${variable}}}` + content.substring(end);
      setContent(newContent);
      
      // Restaurar el cursor después de la variable insertada
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Editar Documento</h2>
            <p className="text-gray-600">{document.name}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowVariables(!showVariables)}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Variables
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Variables Panel */}
          {showVariables && (
            <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
              <h3 className="font-semibold text-gray-900 mb-3">Variables Disponibles</h3>
              <div className="space-y-2">
                {document.variables.map((variable) => (
                  <button
                    key={variable}
                    onClick={() => insertVariable(variable)}
                    className="w-full text-left p-2 text-sm bg-white border rounded-lg hover:bg-blue-50 hover:border-blue-300"
                  >
                    {variable}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Editor */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <div className="text-sm text-gray-600">
                Use <code>{'{{variable}}'}</code> para insertar variables dinámicas
              </div>
            </div>
            <div className="flex-1 p-4">
              <textarea
                id="document-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full border border-gray-300 rounded-lg p-4 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Escriba el contenido del documento aquí..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(content)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Guardar Documento
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente Vista Previa de Documentos
interface DocumentPreviewProps {
  document: DocumentTemplate;
  onClose: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vista Previa</h2>
            <p className="text-gray-600">{document.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose max-w-none">
            {document.content ? (
              <div className="whitespace-pre-wrap">{document.content}</div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p>Este documento no tiene contenido aún.</p>
                <p className="text-sm">Haga clic en "Editar" para agregar contenido.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Documentos;