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
  AlertCircle,
  Upload,
  File
} from 'lucide-react';
import { getAvailableVariables } from '../services/documentVariables';
import ViewToggle from '../components/common/ViewToggle';
import { useToast } from '../components/Toast';
import { FileImportService } from '../services/fileImportService';
import RichTextEditor from '../components/RichTextEditor';

interface DocumentTemplate {
  id: string;
  name: string;
  category: 'legal' | 'client' | 'administrative' | 'commercial' | 'management';
  description: string;
  content: string;
  isVisible: boolean;
  isEditable: boolean;
  isComplete: boolean; // Si el documento está completo o en edición
  lastModified: string;
  createdBy: string;
  variables: string[]; // Variables que se pueden rellenar automáticamente
  allowedRoles: string[]; // Roles que pueden ver este documento
}

const LEGAL_DOCUMENTS: Omit<DocumentTemplate, 'lastModified' | 'createdBy'>[] = [
  {
    id: 'pagare_notarial',
    name: 'Pagaré Notarial',
    category: 'legal',
    description: 'Documento notarial que formaliza la obligación de pago',
    content: `PAGARÉ NOTARIAL AUTENTICO

ACTO NUMERO____________, FOLIO_____________ En la ciudad de Santo Domingo, República Dominicana,
a los {{dia_actual}} días del mes de {{mes_actual}} del año {{ano_actual}}, por ante mí, Dra. MILAGROS
JIMÉNEZ A., dominicana, mayor de edad, casada, Abogado Notario de los Número del Distrito Nacional,
debidamente inscrito en el COLEGIO DOMINICANO DE NOTARIOS, INC., matrícula No. 2649, domiciliada y
residente en esta ciudad, compareció libre y voluntariamente, EL SEÑOR {{cliente_nombre_completo|upper}},
dominicano, mayor de edad, portador de Cédula de Identidad y Electoral No. {{cliente_cedula}}
domiciliado y residente en {{cliente_direccion}},
quien en lo sucesivo se denominará EL DEUDOR, y me ha declarado bajo la fe del juramento lo siguiente:

PRIMERO: Que el señor {{cliente_nombre_completo|upper}}, por medio del presente acto, se reconoce deudor
de {{empresa_nombre|upper}}, con cédula de identidad y electoral No. {{empresa_rnc}}, domiciliada y residente en {{empresa_direccion}} por la suma de {{precio_total}} ({{precio_total_letras|upper}}), moneda de curso legal, los cuales pagará de la siguiente manera: En un plazo de {{numero_cuotas}} CUOTAS,
una cada mes, la suma de {{valor_cuota}} cada una,
moneda de curso legal, hasta saldar dicha deuda, a partir de la fecha de este acto;

SEGUNDO: Que el concepto de la presente deuda es la venta a crédito de lo que sigue:
{{vehiculo_descripcion_completa|upper}}, # DE CHASIS {{vehiculo_numero_chasis}};

TERCERO: Que dicha deuda devengará un interés de {{tasa_interes}} de interés mensual, y hasta la ejecución del pagaré, y un cinco por ciento (5%) por concepto de mora si el atraso excede cinco (5) días después del vencimiento;

CUARTO: Que el no pago de DOS (2) cuotas consecutivas o acumuladas, dará lugar a la ejecución del cobro de la totalidad del monto adeudado más los intereses y moras generados, renunciando así al término del pagaré para hacerse cobrable en lo inmediato y que el presente acto tiene fuerza ejecutoria con las disposiciones del artículo 545 del código de procedimiento civil.

QUINTO: Para lo no estipulado en el presente pagaré notarial, las partes se remiten al derecho común.

SEXTO: Por medio del presente acto el señor, {{cliente_nombre_completo|upper}} autoriza a la ACREEDORA {{empresa_nombre|upper}}, tanto a suministrar como a requerir a los centros de información crediticia la información necesaria a los fines de permitir la evaluación de su historial crediticio por parte de aquellas instituciones financieras suscritas a dichos centros de información.

En consecuencia, renuncia formal y expresamente a ejercer cualquier acción, demanda o reclamación a fines de obtener una compensación de daños y perjuicios por la revelación de información o por haber suministrado una información inexacta;

SÉPTIMO: El deudor, el señor {{cliente_nombre_completo|upper}}, acepta que para los fines y consecuencias legales del presente acto reconoce la operatividad del artículo 545 del Código de Procedimiento Civil de la República Dominicana.

OCTAVO: Que las partes contratantes, han decidido dar fe pública al otorgamiento de este pagaré notarial, a fin de que el mismo, como título ejecutorio tenga la misma fuerza de una SENTENCIA con la autoridad de la cosa irrevocablemente juzgada y renunciando al fuero de domicilio y comprometiendo el señor {{cliente_nombre_completo|upper}} todos sus bienes, habidos y por haber, presente y futuro, para el cumplimiento de esta obligación;

NOVENO: Finalmente me ha manifestado y declarado el compareciente que ratifica todo lo hecho y expresado anteriormente, en presencia de los testigos: {{testigo_1_nombre|upper}} Y {{testigo_2_nombre|upper}}, ambos dominicanos, mayores de edad, portadores de las cédulas de identidad y electoral Nos. {{testigo_1_cedula}} y {{testigo_2_cedula}} domiciliados y residentes en esta misma ciudad de Santo Domingo, testigos aptos y capaces según me lo han manifestado y es de mi personal conocimiento, acto del cual doy fe y se le ha dado lectura en alta e inteligible voz ante los comparecientes y testigos, quienes después de aprobarlos, han firmado junto a mí, luego consignando el deudor, la mención de bueno y válido por la suma de {{precio_total}} ({{precio_total_letras|upper}}), moneda de curso legal.

ACREEDORA                                    DEUDOR
{{empresa_nombre|upper}}                     {{cliente_nombre_completo|upper}}

{{testigo_1_nombre|upper}}                   {{testigo_2_nombre|upper}}
TESTIGO                                      TESTIGO

                    Dra. MILAGROS JIMÉNEZ A.
                    NOTARIO PÚBLICO
                    MAT. (67-78)
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
    content: `# Carta de Ruta para Vehículos

## Datos del Vehículo
- **Marca:** {{vehiculo_marca}}
- **Modelo:** {{vehiculo_modelo}} 
- **Año:** {{vehiculo_ano}}
- **Color:** {{vehiculo_color}}
- **Placa:** {{vehiculo_placa}}

## Información de Traslado

### Origen
**Dirección:** {{origen_direccion}}  
**Fecha de salida:** {{fecha_salida}}  
**Hora:** {{hora_salida}}  

### Destino
**Dirección:** {{destino_direccion}}  
**Fecha estimada de llegada:** {{fecha_llegada}}  
**Hora estimada:** {{hora_llegada}}  

## Responsable del Traslado
**Nombre:** {{conductor_nombre}}  
**Cédula:** {{conductor_cedula}}  
**Licencia:** {{conductor_licencia}}  

## Observaciones
{{observaciones}}

---

*Documento generado el {{fecha_actual}} por {{empresa_nombre}}*`,
    isVisible: true,
    isEditable: true,
    variables: ['vehiculo_marca', 'vehiculo_modelo', 'vehiculo_ano', 'vehiculo_color', 'vehiculo_placa', 'origen_direccion', 'fecha_salida', 'hora_salida', 'destino_direccion', 'fecha_llegada', 'hora_llegada', 'conductor_nombre', 'conductor_cedula', 'conductor_licencia', 'observaciones', 'fecha_actual', 'empresa_nombre']
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
  },
  // Documentos basados en los archivos encontrados
  {
    id: 'carta_saldo',
    name: 'Carta de Saldo',
    category: 'administrative',
    description: 'Carta informando que no hay objeciones para traspaso de vehículo por pago completo',
    content: `{{empresa_nombre|upper}}
{{empresa_direccion}}
RNC: {{empresa_rnc}}

CARTA DE SALDO

{{fecha_actual_completa}}

Señor
DIRECTOR GENERAL DE IMPUESTOS INTERNOS
CIUDAD.-

DISTINGUIDO SEÑOR:

POR ESTE MEDIO LE INFORMAMOS QUE ESTA COMPAÑÍA NO PONE NINGUNA OBJECIÓN PARA EL TRASPASO DEL VEHÍCULO

MARCA: {{vehiculo_marca|upper}} CHASSIS {{vehiculo_numero_chasis}}
REGISTRO No. {{vehiculo_numero_placa}} COLOR {{vehiculo_color|upper}}
MODELO {{vehiculo_modelo|upper}} VENDIDO POR ESTA COMPAÑÍA BAJO CONTRATO DE VENTA CONDICIONAL A: {{cliente_nombre_completo|upper}}, PORTADOR DE LA CÉDULA DE IDENTIDAD No. {{cliente_cedula}}, POR HABER SIDO PAGADO EN SU TOTALIDAD.

SIN MAS QUE TRATAR POR EL MOMENTO, APROVECHAMOS LA OCASIÓN PARA SALUDARLE.

MUY ATENTAMENTE,

_________________________________
Encargado de Ventas
ENC. COMPRAS

{{empresa_nombre|upper}}
{{empresa_direccion}} / Tel. {{empresa_telefono}}`,
    isVisible: true,
    isEditable: true,
    variables: ['empresa_nombre', 'empresa_direccion', 'empresa_rnc', 'fecha_actual_completa', 'vehiculo_marca', 'vehiculo_numero_chasis', 'vehiculo_numero_placa', 'vehiculo_color', 'vehiculo_modelo', 'cliente_nombre_completo', 'cliente_cedula', 'empresa_telefono']
  },
  {
    id: 'autorizacion_entrega_placa',
    name: 'Autorización Entrega de Placa',
    category: 'administrative',
    description: 'Documento para autorizar la entrega de placa de vehículo',
    content: `AUTORIZACIÓN PARA ENTREGA DE PLACA

Fecha: {{fecha_actual}}

Por medio de la presente, yo {{cliente_nombre_completo}}, portador(a) de la cédula de ciudadanía No. {{cliente_cedula}}, domiciliado(a) en {{cliente_direccion}}, AUTORIZO a {{persona_autorizada}}, portador(a) de la cédula No. {{cedula_persona_autorizada}}, para que en mi nombre y representación pueda retirar la placa del vehículo:

MARCA: {{vehiculo_marca}}
MODELO: {{vehiculo_modelo}}  
AÑO: {{vehiculo_ano}}
COLOR: {{vehiculo_color}}
CHASIS: {{vehiculo_numero_chasis}}

Esta autorización es otorgada de manera libre y voluntaria, y será válida hasta el día {{fecha_vencimiento_autorizacion}}.

Sin otro particular,

_________________________________
{{cliente_nombre_completo}}
C.C. {{cliente_cedula}}

_________________________________
{{persona_autorizada}}
C.C. {{cedula_persona_autorizada}}`,
    isVisible: true,
    isEditable: true,
    variables: ['cliente_nombre_completo', 'cliente_cedula', 'cliente_direccion', 'fecha_actual', 'persona_autorizada', 'cedula_persona_autorizada', 'vehiculo_marca', 'vehiculo_modelo', 'vehiculo_ano', 'vehiculo_color', 'vehiculo_numero_chasis', 'fecha_vencimiento_autorizacion']
  },
  {
    id: 'intimacion_pago_management',
    name: 'Intimación de Pago',
    category: 'management',
    description: 'Documento formal de intimación de pago conforme a la ley 483',
    content: `INTIMACIÓN DE PAGO
(Conforme a la Ley 483-08)

{{fecha_actual_completa}}

Señor(a)
{{cliente_nombre_completo}}
C.C. No. {{cliente_cedula}}
{{cliente_direccion}}

Distinguido(a) cliente:

Por medio de la presente le INTIMAMOS formalmente al pago de la deuda contraída con {{empresa_nombre}}, correspondiente a:

CONCEPTO: {{concepto_deuda}}
VEHÍCULO: {{vehiculo_descripcion_completa}}
CHASIS: {{vehiculo_numero_chasis}}

DETALLE DE LA DEUDA:
- Monto original: {{precio_total}}
- Pagado a la fecha: {{monto_pagado}}
- Saldo pendiente: {{saldo_pendiente}}
- Cuotas vencidas: {{cuotas_vencidas}}
- Mora acumulada: {{mora_acumulada}}
- TOTAL ADEUDADO: {{total_adeudado}}

Le concedemos un plazo de DIEZ (10) DÍAS CALENDARIOS, contados a partir de la fecha de recibo de esta comunicación, para que proceda a saldar su deuda.

El incumplimiento de este requerimiento conllevará a iniciar las acciones legales correspondientes para el cobro de la deuda, sin perjuicio de los intereses y costas del proceso.

Esperamos su pronta respuesta.

Atentamente,

_________________________________
{{empresa_nombre}}
Departamento de Cobranzas
{{empresa_telefono}}`,
    isVisible: true,
    isEditable: true,
    variables: ['fecha_actual_completa', 'cliente_nombre_completo', 'cliente_cedula', 'cliente_direccion', 'empresa_nombre', 'concepto_deuda', 'vehiculo_descripcion_completa', 'vehiculo_numero_chasis', 'precio_total', 'monto_pagado', 'saldo_pendiente', 'cuotas_vencidas', 'mora_acumulada', 'total_adeudado', 'empresa_telefono']
  },
  {
    id: 'carta_autorizacion_retiro',
    name: 'Carta Autorización Retiro Vehículo AMET/DIGESETT',
    category: 'administrative',
    description: 'Autorización para retirar vehículo incautado por las autoridades de tránsito',
    content: `CARTA DE AUTORIZACIÓN

{{fecha_actual_completa}}

Señores
AUTORIDAD METROPOLITANA DE TRANSPORTE (AMET)
DIRECCIÓN GENERAL DE SEGURIDAD DE TRÁNSITO Y TRANSPORTE TERRESTRE (DIGESETT)
CIUDAD.-

Muy distinguidos señores:

Por medio de la presente, {{empresa_nombre}}, con RNC {{empresa_rnc}}, domiciliada en {{empresa_direccion}}, en su calidad de PROPIETARIO LEGAL del vehículo:

MARCA: {{vehiculo_marca}}
MODELO: {{vehiculo_modelo}}
AÑO: {{vehiculo_ano}}
PLACA: {{vehiculo_numero_placa}}
CHASIS: {{vehiculo_numero_chasis}}
COLOR: {{vehiculo_color}}

AUTORIZA a {{cliente_nombre_completo}}, portador(a) de la cédula No. {{cliente_cedula}}, para que proceda al retiro del referido vehículo de sus instalaciones, quien tiene la POSESIÓN LEGÍTIMA del mismo bajo contrato de venta condicional.

Adjuntamos los siguientes documentos:
- Contrato de venta condicional
- Copia del registro del vehículo
- Cédula del autorizado

Sin otro particular, les saludamos atentamente,

_________________________________
{{empresa_nombre}}
Representante Legal`,
    isVisible: true,
    isEditable: true,
    variables: ['fecha_actual_completa', 'empresa_nombre', 'empresa_rnc', 'empresa_direccion', 'vehiculo_marca', 'vehiculo_modelo', 'vehiculo_ano', 'vehiculo_numero_placa', 'vehiculo_numero_chasis', 'vehiculo_color', 'cliente_nombre_completo', 'cliente_cedula']
  },
  {
    id: 'solicitud_certificacion',
    name: 'Solicitud de Certificación',
    category: 'administrative',
    description: 'Solicitud oficial para certificación de documentos o procesos',
    content: `SOLICITUD DE CERTIFICACIÓN

{{fecha_actual_completa}}

Señores
{{entidad_destinataria}}
CIUDAD.-

Muy respetados señores:

Por medio de la presente, {{empresa_nombre}}, con RNC {{empresa_rnc}}, representada por {{representante_nombre}}, con cédula No. {{representante_cedula}}, solicita respetuosamente se sirvan certificar la siguiente documentación:

MOTIVO DE LA SOLICITUD: {{motivo_solicitud}}

DOCUMENTOS A CERTIFICAR:
{{lista_documentos}}

VEHÍCULO RELACIONADO (si aplica):
- Marca: {{vehiculo_marca}}
- Modelo: {{vehiculo_modelo}}
- Año: {{vehiculo_ano}}
- Chasis: {{vehiculo_numero_chasis}}
- Placa: {{vehiculo_numero_placa}}

PROPÓSITO: {{proposito_certificacion}}

Adjuntamos los documentos originales y copias correspondientes para su revisión y certificación.

Agradeciendo su atención y pronta respuesta, quedamos de ustedes,

Atentamente,

_________________________________
{{representante_nombre}}
{{empresa_nombre}}
Teléfono: {{empresa_telefono}}`,
    isVisible: true,
    isEditable: true,
    variables: ['fecha_actual_completa', 'entidad_destinataria', 'empresa_nombre', 'empresa_rnc', 'representante_nombre', 'representante_cedula', 'motivo_solicitud', 'lista_documentos', 'vehiculo_marca', 'vehiculo_modelo', 'vehiculo_ano', 'vehiculo_numero_chasis', 'vehiculo_numero_placa', 'proposito_certificacion', 'empresa_telefono']
  },
  {
    id: 'carta_liberacion_evidencia',
    name: 'Carta de Liberación Control de Evidencia',
    category: 'legal',
    description: 'Documento para liberación de vehículo bajo control de evidencia judicial',
    content: `CARTA DE LIBERACIÓN - CONTROL DE EVIDENCIA

{{fecha_actual_completa}}

Señores
{{autoridad_judicial}}
{{direccion_autoridad}}
CIUDAD.-

REF: LIBERACIÓN DE VEHÍCULO BAJO EVIDENCIA
EXPEDIENTE No. {{numero_expediente}}

Muy honorables magistrados:

Por medio de la presente, {{empresa_nombre}}, con RNC {{empresa_rnc}}, en su calidad de PROPIETARIO LEGAL del vehículo que se describe a continuación:

MARCA: {{vehiculo_marca}}
MODELO: {{vehiculo_modelo}}
AÑO: {{vehiculo_ano}}
PLACA: {{vehiculo_numero_placa}}
CHASIS: {{vehiculo_numero_chasis}}
COLOR: {{vehiculo_color}}

Solicita respetuosamente se ordene la LIBERACIÓN del referido vehículo, el cual se encuentra bajo control de evidencia en relación al expediente de referencia.

FUNDAMENTOS DE LA SOLICITUD:
{{fundamentos_solicitud}}

El vehículo fue vendido bajo contrato de venta condicional al señor(a) {{cliente_nombre_completo}}, C.C. {{cliente_cedula}}, quien mantiene la posesión legítima del bien.

Adjuntamos:
- Contrato de venta condicional
- Registro del vehículo
- Documentos de identidad

Esperamos su favorable consideración.

Atentamente,

_________________________________
{{representante_legal}}
{{empresa_nombre}}
Teléfono: {{empresa_telefono}}`,
    isVisible: true,
    isEditable: true,
    variables: ['fecha_actual_completa', 'autoridad_judicial', 'direccion_autoridad', 'numero_expediente', 'empresa_nombre', 'empresa_rnc', 'vehiculo_marca', 'vehiculo_modelo', 'vehiculo_ano', 'vehiculo_numero_placa', 'vehiculo_numero_chasis', 'vehiculo_color', 'fundamentos_solicitud', 'cliente_nombre_completo', 'cliente_cedula', 'representante_legal', 'empresa_telefono']
  },
  {
    id: 'solicitud_entrega',
    name: 'Solicitud de Entrega',
    category: 'administrative',
    description: 'Solicitud formal para entrega de vehículo o documentos',
    content: `SOLICITUD DE ENTREGA

{{fecha_actual_completa}}

Señores
{{entidad_destinataria}}
{{direccion_entidad}}
CIUDAD.-

Muy distinguidos señores:

Por medio de la presente, {{solicitante_nombre}}, portador(a) de la cédula de ciudadanía No. {{solicitante_cedula}}, domiciliado(a) en {{solicitante_direccion}}, en representación de {{empresa_nombre}}, solicita respetuosamente la entrega de:

OBJETO DE LA SOLICITUD: {{objeto_solicitud}}

DETALLES:
{{detalles_solicitud}}

VEHÍCULO RELACIONADO (si aplica):
- Marca: {{vehiculo_marca}}
- Modelo: {{vehiculo_modelo}}  
- Año: {{vehiculo_ano}}
- Chasis: {{vehiculo_numero_chasis}}
- Placa: {{vehiculo_numero_placa}}
- Color: {{vehiculo_color}}

JUSTIFICACIÓN: {{justificacion_solicitud}}

DOCUMENTOS QUE SE ADJUNTAN:
{{documentos_adjuntos}}

Agradeciendo su pronta atención y quedando en espera de una respuesta favorable.

Atentamente,

_________________________________
{{solicitante_nombre}}
C.C. {{solicitante_cedula}}
{{empresa_nombre}}
Teléfono: {{telefono_contacto}}`,
    isVisible: true,
    isEditable: true,
    variables: ['fecha_actual_completa', 'entidad_destinataria', 'direccion_entidad', 'solicitante_nombre', 'solicitante_cedula', 'solicitante_direccion', 'empresa_nombre', 'objeto_solicitud', 'detalles_solicitud', 'vehiculo_marca', 'vehiculo_modelo', 'vehiculo_ano', 'vehiculo_numero_chasis', 'vehiculo_numero_placa', 'vehiculo_color', 'justificacion_solicitud', 'documentos_adjuntos', 'telefono_contacto']
  },
  {
    id: 'cambio_maquina',
    name: 'Cambio de Máquina',
    category: 'administrative', 
    description: 'Documento para gestionar cambio o reemplazo de vehículo',
    content: `SOLICITUD DE CAMBIO DE MÁQUINA

{{fecha_actual_completa}}

Señores
{{entidad_destinataria}}
CIUDAD.-

Muy estimados señores:

{{empresa_nombre}}, con RNC {{empresa_rnc}}, por medio de la presente informa y solicita el cambio de la máquina (vehículo) descrita a continuación:

VEHÍCULO ACTUAL:
- Marca: {{vehiculo_actual_marca}}
- Modelo: {{vehiculo_actual_modelo}}
- Año: {{vehiculo_actual_ano}}
- Chasis: {{vehiculo_actual_chasis}}
- Placa: {{vehiculo_actual_placa}}
- Color: {{vehiculo_actual_color}}

VEHÍCULO DE REEMPLAZO:
- Marca: {{vehiculo_nuevo_marca}}
- Modelo: {{vehiculo_nuevo_modelo}}
- Año: {{vehiculo_nuevo_ano}}
- Chasis: {{vehiculo_nuevo_chasis}}
- Color: {{vehiculo_nuevo_color}}

MOTIVO DEL CAMBIO: {{motivo_cambio}}

CLIENTE: {{cliente_nombre_completo}}
CÉDULA: {{cliente_cedula}}
CONTRATO No.: {{numero_contrato}}

El cambio se realiza manteniendo las mismas condiciones del contrato original, sin variación en los términos de pago establecidos.

Adjuntamos los documentos requeridos para este proceso.

Atentamente,

_________________________________
{{representante_empresa}}
{{empresa_nombre}}
Teléfono: {{empresa_telefono}}`,
    isVisible: true,
    isEditable: true,
    variables: ['fecha_actual_completa', 'entidad_destinataria', 'empresa_nombre', 'empresa_rnc', 'vehiculo_actual_marca', 'vehiculo_actual_modelo', 'vehiculo_actual_ano', 'vehiculo_actual_chasis', 'vehiculo_actual_placa', 'vehiculo_actual_color', 'vehiculo_nuevo_marca', 'vehiculo_nuevo_modelo', 'vehiculo_nuevo_ano', 'vehiculo_nuevo_chasis', 'vehiculo_nuevo_color', 'motivo_cambio', 'cliente_nombre_completo', 'cliente_cedula', 'numero_contrato', 'representante_empresa', 'empresa_telefono']
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
    id: 'carta_saldo_client',
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
  const { success, error: showError, warning, info, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState<'legal' | 'client' | 'management'>('legal');
  const [documents, setDocuments] = useState<DocumentTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisible, setFilterVisible] = useState('all'); // all, visible, hidden
  const [selectedDocument, setSelectedDocument] = useState<DocumentTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSaving, setIsSaving] = useState(false);

  // Funciones de persistencia
  const saveDocuments = (docs: DocumentTemplate[]) => {
    setIsSaving(true);
    try {
      localStorage.setItem('documentsData', JSON.stringify(docs));
      setDocuments(docs);
      // Mostrar indicador de guardado por un momento
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      console.error('Error saving documents:', error);
      showError('Error al guardar los cambios');
      setIsSaving(false);
    }
  };

  // Función para resetear documentos a valores por defecto
  const resetDocuments = () => {
    if (confirm('¿Estás seguro de que deseas resetear todos los documentos a su configuración original? Esto eliminará todos los cambios de permisos y configuraciones personalizadas.')) {
      localStorage.removeItem('documentsData');
      const availableVariables = getAvailableVariables();
      const allDocuments: DocumentTemplate[] = [
        ...LEGAL_DOCUMENTS.map(doc => ({
          ...doc,
          variables: availableVariables,
          lastModified: new Date().toISOString(),
          createdBy: 'Sistema',
          isComplete: true,
          allowedRoles: ['master', 'admin', 'vendedor']
        })),
        ...CLIENT_DOCUMENTS.map(doc => ({
          ...doc,
          variables: availableVariables,
          lastModified: new Date().toISOString(),
          createdBy: 'Sistema',
          isComplete: true,
          allowedRoles: ['master', 'admin', 'vendedor']
        }))
      ];
      saveDocuments(allDocuments);
      success('Documentos restablecidos a configuración original');
    }
  };

  const loadDocuments = () => {
    try {
      const savedDocuments = localStorage.getItem('documentsData');
      if (savedDocuments) {
        const parsed = JSON.parse(savedDocuments) as DocumentTemplate[];
        // Verificar que los documentos tengan la estructura correcta
        const validDocuments = parsed.filter(doc => 
          doc.id && doc.name && doc.category && typeof doc.allowedRoles !== 'undefined'
        );
        if (validDocuments.length > 0) {
          return validDocuments;
        }
      }
    } catch (error) {
      console.error('Error loading documents from localStorage:', error);
      localStorage.removeItem('documentsData');
    }
    return null;
  };

  // Inicializar documentos
  useEffect(() => {
    const savedDocuments = loadDocuments();
    
    if (savedDocuments) {
      setDocuments(savedDocuments);
    } else {
      const availableVariables = getAvailableVariables();
      const allDocuments: DocumentTemplate[] = [
        ...LEGAL_DOCUMENTS.map(doc => ({
          ...doc,
          variables: availableVariables,
          lastModified: new Date().toISOString(),
          createdBy: 'Sistema',
          isComplete: true,
          allowedRoles: ['master', 'admin', 'vendedor'] // Roles por defecto
        })),
        ...CLIENT_DOCUMENTS.map(doc => ({
          ...doc,
          variables: availableVariables,
          lastModified: new Date().toISOString(),
          createdBy: 'Sistema',
          isComplete: true,
          allowedRoles: ['master', 'admin', 'vendedor']
        }))
      ];
      saveDocuments(allDocuments);
    }
  }, []);

  // Filtrar documentos
  const filteredDocuments = documents.filter(doc => {
    // Si estamos en la pestaña de gestión, mostrar todos los documentos
    if (activeTab === 'management') {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVisibility = filterVisible === 'all' || 
                               (filterVisible === 'visible' && doc.isVisible) ||
                               (filterVisible === 'hidden' && !doc.isVisible);
      return matchesSearch && matchesVisibility;
    }
    
    // Para las pestañas principales (legal/client), solo mostrar documentos visibles
    const matchesTab = doc.category === activeTab;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const isVisible = doc.isVisible; // Solo documentos visibles en pestañas principales
    
    return matchesTab && matchesSearch && isVisible;
  });

  const handleToggleVisibility = (docId: string) => {
    const updatedDocuments = documents.map(doc => 
      doc.id === docId ? { ...doc, isVisible: !doc.isVisible } : doc
    );
    saveDocuments(updatedDocuments);
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
      const updatedDocuments = documents.map(doc => 
        doc.id === selectedDocument.id 
          ? { ...doc, content, lastModified: new Date().toISOString() }
          : doc
      );
      saveDocuments(updatedDocuments);
      setShowEditor(false);
      setSelectedDocument(null);
      success('Documento guardado exitosamente');
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
    info(`Función de envío para ${document.name} (por implementar)`);
  };

  return (
    <div className="space-y-6 page-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Documentos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra plantillas de documentos legales y para clientes
          </p>
        </div>
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
          <button
            onClick={() => setActiveTab('management')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'management'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Gestión de Documentos
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

      {/* Contenido basado en la pestaña activa */}
      {activeTab === 'management' ? (
        <DocumentManagement 
          documents={documents}
          onDocumentUpdate={saveDocuments}
          onResetDocuments={resetDocuments}
          isSaving={isSaving}
          showToast={(message, type) => {
            if (type === 'success') success(message);
            else if (type === 'error') showError(message);
            else if (type === 'warning') warning(message);
            else info(message);
          }}
        />
      ) : (
        /* Documents Display */
        viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500"
            >
              {/* Header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {document.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {document.description}
                </p>
              </div>

              {/* Estado y Etiquetas */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {/* Etiqueta de Estado */}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    document.isComplete 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {document.isComplete ? 'Completo' : 'En Edición'}
                  </span>
                  
                  
                  {/* Roles permitidos */}
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    {document.allowedRoles.length} rol{document.allowedRoles.length !== 1 ? 'es' : ''}
                  </span>
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
              <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handlePreviewDocument(document)}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Vista previa"
                >
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">Vista Previa</span>
                </button>
                <button
                  onClick={() => handlePrintDocument(document)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Imprimir"
                >
                  <Printer className="h-4 w-4" />
                  <span className="text-sm font-medium">Imprimir</span>
                </button>
                <button
                  onClick={() => handleSendDocument(document)}
                  className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Enviar"
                >
                  <Send className="h-4 w-4" />
                  <span className="text-sm font-medium">Enviar</span>
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
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          document.isComplete 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {document.isComplete ? 'Completo' : 'En Edición'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          document.isVisible
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {document.isVisible ? 'Visible' : 'Oculto'}
                      </span>
                      </div>
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
        )
      )}

      {filteredDocuments.length === 0 && activeTab !== 'management' && (
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

      {/* Toast Container */}
      <ToastContainer />
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
  const [content, setContent] = useState(document.content || '');
  const [showVariables, setShowVariables] = useState(false);

  const insertVariable = (variable: string) => {
    // Insertar variable en el contenido actual
    const variableMarkup = `<span class="variable-placeholder" style="background-color: #e3f2fd; padding: 2px 4px; border-radius: 3px; border: 1px solid #2196f3; color: #0277bd;">{{${variable}}}</span>`;
    setContent(prev => prev + ' ' + variableMarkup + ' ');
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
              className={`px-3 py-2 text-sm rounded-lg ${showVariables ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Formato A4:</strong> Las páginas están configuradas para impresión en formato A4 (210x297mm) con márgenes de 1 pulgada.
                </p>
              </div>
            </div>
          )}

          {/* Editor Area */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <div className="text-sm text-gray-600">
                Editor profesional con herramientas de formato. Las variables aparecerán resaltadas en azul.
              </div>
            </div>
            <div className="flex-1 p-4">
              <RichTextEditor
                value={content}
                onChange={setContent}
                height={500}
                placeholder="Escriba o pegue el contenido del documento aquí. Use las herramientas de formato para dar estilo profesional al texto..."
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
          <div 
            className="document-preview" 
            style={{
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              fontSize: '12pt',
              lineHeight: 1.5,
              maxWidth: '8.5in',
              margin: '0 auto',
              backgroundColor: 'white',
              padding: '1in',
              minHeight: '11in',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            {document.content ? (
              <div dangerouslySetInnerHTML={{ __html: document.content }} />
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

// Componente de Gestión de Documentos
interface DocumentManagementProps {
  documents: DocumentTemplate[];
  onDocumentUpdate: (documents: DocumentTemplate[]) => void;
  onResetDocuments: () => void;
  isSaving: boolean;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const DocumentManagement: React.FC<DocumentManagementProps> = ({ 
  documents, 
  onDocumentUpdate, 
  onResetDocuments,
  isSaving,
  showToast 
}) => {
  const [selectedDocument, setSelectedDocument] = useState<DocumentTemplate | null>(null);
  const [showNewDocumentForm, setShowNewDocumentForm] = useState(false);
  const [showImportDocumentForm, setShowImportDocumentForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentTemplate | null>(null);

  const handleToggleVisibility = (document: DocumentTemplate) => {
    const updatedDocuments = documents.map(doc => 
      doc.id === document.id 
        ? { ...doc, isVisible: !doc.isVisible }
        : doc
    );
    onDocumentUpdate(updatedDocuments);
    showToast(
      `Documento ${document.isVisible ? 'ocultado' : 'mostrado'} exitosamente`, 
      'success'
    );
  };

  const handleToggleComplete = (document: DocumentTemplate) => {
    const updatedDocuments = documents.map(doc => 
      doc.id === document.id 
        ? { ...doc, isComplete: !doc.isComplete }
        : doc
    );
    onDocumentUpdate(updatedDocuments);
    showToast(
      `Documento marcado como ${document.isComplete ? 'incompleto' : 'completo'}`, 
      'info'
    );
  };

  const handleDeleteDocument = (document: DocumentTemplate) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      const updatedDocuments = documents.filter(doc => doc.id !== document.id);
      onDocumentUpdate(updatedDocuments);
      showToast('Documento eliminado exitosamente', 'success');
    }
  };

  const handleUpdateRoles = (document: DocumentTemplate, newRoles: string[]) => {
    const updatedDocuments = documents.map(doc => 
      doc.id === document.id 
        ? { ...doc, allowedRoles: newRoles }
        : doc
    );
    onDocumentUpdate(updatedDocuments);
    showToast('Permisos de documento actualizados', 'success');
  };

  const availableRoles = ['master', 'admin', 'vendedor', 'cobrador'];
  const categories = [
    { value: 'legal', label: 'Documentos Legales' },
    { value: 'client', label: 'Documentos para Clientes' },
    { value: 'administrative', label: 'Documentos Administrativos' },
    { value: 'commercial', label: 'Documentos Comerciales' },
    { value: 'management', label: 'Documentos de Gestión' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Gestión de Documentos</h2>
            {isSaving && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                Guardando...
              </div>
            )}
          </div>
          <p className="text-gray-600">Crear, editar y administrar documentos del sistema</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onResetDocuments}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 btn-press"
            title="Restablecer documentos a configuración original"
          >
            <AlertCircle className="h-4 w-4" />
            Resetear
          </button>
          <button 
            onClick={() => setShowImportDocumentForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 btn-press"
            title="Importar documento desde archivo local"
          >
            <Upload className="h-4 w-4" />
            Importar Documento
          </button>
          <button 
            onClick={() => setShowNewDocumentForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 btn-press"
          >
            <Plus className="h-4 w-4" />
            Nuevo Documento
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Check className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completos</p>
              <p className="text-2xl font-bold text-gray-900">{documents.filter(d => d.isComplete).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">En Edición</p>
              <p className="text-2xl font-bold text-gray-900">{documents.filter(d => !d.isComplete).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center">
            <EyeOff className="h-8 w-8 text-gray-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ocultos</p>
              <p className="text-2xl font-bold text-gray-900">{documents.filter(d => !d.isVisible).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Documentos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Todos los Documentos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visibilidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permisos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{document.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{document.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {categories.find(c => c.value === document.category)?.label || document.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleComplete(document)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        document.isComplete 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      }`}
                    >
                      {document.isComplete ? 'Completo' : 'En Edición'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleVisibility(document)}
                      className={`p-1 rounded ${
                        document.isVisible 
                          ? 'text-green-600 hover:bg-green-100' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={document.isVisible ? 'Ocultar documento' : 'Mostrar documento'}
                    >
                      {document.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {document.allowedRoles.map(role => (
                        <span key={role} className="inline-flex px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingDocument(document)}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-100 rounded"
                        title="Editar documento"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setSelectedDocument(document)}
                        className="text-green-600 hover:text-green-900 p-1 hover:bg-green-100 rounded"
                        title="Gestionar permisos"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(document)}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-100 rounded"
                        title="Eliminar documento"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Nuevo Documento */}
      {showNewDocumentForm && (
        <NewDocumentModal
          onClose={() => setShowNewDocumentForm(false)}
          onSave={(newDoc) => {
            onDocumentUpdate([...documents, newDoc]);
            setShowNewDocumentForm(false);
            showToast('Documento creado exitosamente', 'success');
          }}
          categories={categories}
          availableRoles={availableRoles}
          showToast={showToast}
        />
      )}

      {/* Modal para Editar Documento */}
      {editingDocument && (
        <EditDocumentModal
          document={editingDocument}
          onClose={() => setEditingDocument(null)}
          onSave={(updatedDoc) => {
            const updatedDocuments = documents.map(doc => 
              doc.id === updatedDoc.id ? updatedDoc : doc
            );
            onDocumentUpdate(updatedDocuments);
            setEditingDocument(null);
            showToast('Documento actualizado exitosamente', 'success');
          }}
          categories={categories}
          availableRoles={availableRoles}
        />
      )}

      {/* Modal para Gestionar Permisos */}
      {selectedDocument && (
        <RoleManagementModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onUpdateRoles={(newRoles) => {
            handleUpdateRoles(selectedDocument, newRoles);
            setSelectedDocument(null);
          }}
          availableRoles={availableRoles}
        />
      )}

      {/* Modal para Importar Documento */}
      {showImportDocumentForm && (
        <ImportDocumentModal
          onClose={() => setShowImportDocumentForm(false)}
          onSave={(newDoc) => {
            onDocumentUpdate([...documents, newDoc]);
            setShowImportDocumentForm(false);
            showToast('Documento importado exitosamente', 'success');
          }}
          categories={categories}
          availableRoles={availableRoles}
          showToast={showToast}
        />
      )}
    </div>
  );
};

// Modal para Crear Nuevo Documento
interface NewDocumentModalProps {
  onClose: () => void;
  onSave: (document: DocumentTemplate) => void;
  categories: { value: string; label: string }[];
  availableRoles: string[];
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const NewDocumentModal: React.FC<NewDocumentModalProps> = ({ 
  onClose, 
  onSave, 
  categories, 
  availableRoles,
  showToast 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'legal' as DocumentTemplate['category'],
    description: '',
    content: '',
    isVisible: true,
    isComplete: false,
    allowedRoles: ['master', 'admin'] as string[]
  });
  const [showVariables, setShowVariables] = useState(false);
  const availableVariables = getAvailableVariables();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Extraer variables del contenido
    const variableMatches = formData.content.match(/\{\{([^}]+)\}\}/g) || [];
    const extractedVariables = [...new Set(
      variableMatches.map(match => match.slice(2, -2).split('|')[0])
    )];
    
    const newDocument: DocumentTemplate = {
      id: Date.now().toString(),
      ...formData,
      isEditable: true,
      lastModified: new Date().toISOString(),
      createdBy: 'Usuario Actual',
      variables: extractedVariables
    };
    onSave(newDocument);
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      allowedRoles: prev.allowedRoles.includes(role)
        ? prev.allowedRoles.filter(r => r !== role)
        : [...prev.allowedRoles, role]
    }));
  };

  const insertVariable = (variable: string) => {
    // Insertar variable en el contenido del nuevo documento
    const variableMarkup = `<span class="variable-placeholder" style="background-color: #e3f2fd; padding: 2px 4px; border-radius: 3px; border: 1px solid #2196f3; color: #0277bd;">{{${variable}}}</span>`;
    setFormData(prev => ({ ...prev, content: prev.content + ' ' + variableMarkup + ' ' }));
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Nuevo Documento</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Documento
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Contrato de Venta"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                category: e.target.value as DocumentTemplate['category'] 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Descripción del documento..."
            />
          </div>


          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Contenido del Documento
              </label>
              <button
                type="button"
                onClick={() => setShowVariables(!showVariables)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
                {showVariables ? 'Ocultar' : 'Mostrar'} Variables
              </button>
            </div>
            
            <div className="flex gap-4">
              {/* Editor de contenido */}
              <div className="flex-1">
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  height={500}
                  placeholder="Contenido del documento con variables como {{variable_nombre}}... Use las herramientas de formato para crear documentos profesionales."
                />
              </div>
              
              {/* Panel de variables */}
              {showVariables && (
                <div className="w-80 bg-gray-50 rounded-lg p-4 border">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Variables Disponibles</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {availableVariables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertVariable(variable)}
                        className="w-full text-left px-3 py-2 text-xs bg-white hover:bg-blue-50 hover:text-blue-700 rounded border transition-colors"
                      >
                        <span className="font-mono text-blue-600">{'{{'}</span>
                        <span className="font-mono">{variable}</span>
                        <span className="font-mono text-blue-600">{'}}'}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      Haz clic en cualquier variable para insertarla en el cursor.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Indicador de variables encontradas */}
            {formData.content && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  Variables detectadas: {(formData.content.match(/\{\{([^}]+)\}\}/g) || []).length}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isVisible}
                  onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Visible para usuarios</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isComplete}
                  onChange={(e) => setFormData(prev => ({ ...prev, isComplete: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Documento completo</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles con Acceso
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableRoles.map(role => (
                <label key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowedRoles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 capitalize">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Crear Documento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para Importar Documento
interface ImportDocumentModalProps {
  onClose: () => void;
  onSave: (document: DocumentTemplate) => void;
  categories: { value: string; label: string }[];
  availableRoles: string[];
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const ImportDocumentModal: React.FC<ImportDocumentModalProps> = ({ 
  onClose, 
  onSave, 
  categories, 
  availableRoles,
  showToast
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'legal' as DocumentTemplate['category'],
    description: '',
    content: '',
    allowedRoles: ['master', 'admin'] as string[]
  });
  
  const [isImporting, setIsImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      showToast('Por favor, importe un archivo antes de guardar', 'warning');
      return;
    }

    const extractedVariables = (formData.content.match(/\{\{([^}]+)\}\}/g) || [])
      .map(match => match.slice(2, -2).trim());

    const newDocument: DocumentTemplate = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      description: formData.description,
      content: formData.content,
      isVisible: true,
      isEditable: true,
      isComplete: true,
      allowedRoles: formData.allowedRoles,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      createdBy: 'Usuario Actual',
      variables: extractedVariables
    };
    
    onSave(newDocument);
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      allowedRoles: prev.allowedRoles.includes(role)
        ? prev.allowedRoles.filter(r => r !== role)
        : [...prev.allowedRoles, role]
    }));
  };

  const handleFileImport = async (file: File) => {
    setIsImporting(true);
    try {
      // Verificar que el archivo sea soportado
      if (!FileImportService.isFileSupported(file)) {
        const formats = FileImportService.getSupportedFormats();
        const formatList = Object.entries(formats)
          .map(([category, exts]) => `• ${category}: ${exts.join(', ')}`)
          .join('\n');
        throw new Error(`Formato de archivo no soportado: ${file.name}\n\nFormatos soportados:\n${formatList}`);
      }

      const result = await FileImportService.extractTextFromFile(file);
      
      if (result.success && result.content) {
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({
          ...prev,
          name: prev.name || fileName,
          content: result.content,
          description: prev.description || `Documento importado desde ${file.name}`
        }));
        showToast(`Archivo "${file.name}" importado exitosamente. ${result.content.length} caracteres extraídos.`, 'success');
      } else {
        throw new Error(result.error || 'No se pudo extraer contenido del archivo');
      }
    } catch (error) {
      console.error('Error importing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al importar el archivo. Por favor, inténtalo de nuevo.';
      showToast(errorMessage, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileImport(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileImport(files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Importar Documento</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Área de Import */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Importar desde Archivo
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
                dragOver 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${
                isImporting ? 'opacity-50 pointer-events-none' : ''
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isImporting ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Importando archivo...</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    <strong>Arrastra un archivo aquí</strong> o{' '}
                    <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                      <span>selecciona un archivo</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.html,.htm,.rtf,.txt,.md,.csv,.json,.xml"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Formatos soportados: PDF, DOCX, HTML, RTF, TXT, MD, CSV, JSON, XML
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Configuración del documento */}
          {formData.content && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Documento
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del documento"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as DocumentTemplate['category'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Descripción del documento..."
                />
              </div>

              {/* Roles permitidos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roles Permitidos
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableRoles.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleToggle(role)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        formData.allowedRoles.includes(role)
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vista previa del contenido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vista Previa del Contenido
                </label>
                <div 
                  className="max-h-40 overflow-y-auto p-3 bg-gray-50 border rounded-md text-sm"
                  dangerouslySetInnerHTML={{ __html: formData.content.substring(0, 500) + (formData.content.length > 500 ? '...' : '') }}
                />
              </div>
            </>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formData.content.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Importar Documento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para Editar Documento
interface EditDocumentModalProps {
  document: DocumentTemplate;
  onClose: () => void;
  onSave: (document: DocumentTemplate) => void;
  categories: { value: string; label: string }[];
  availableRoles: string[];
}

const EditDocumentModal: React.FC<EditDocumentModalProps> = ({ 
  document, 
  onClose, 
  onSave, 
  categories, 
  availableRoles 
}) => {
  const [formData, setFormData] = useState({
    name: document.name,
    category: document.category,
    description: document.description,
    content: document.content,
    isVisible: document.isVisible,
    isComplete: document.isComplete,
    allowedRoles: [...document.allowedRoles]
  });
  const [showVariables, setShowVariables] = useState(false);
  const availableVariables = getAvailableVariables();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Extraer variables del contenido
    const variableMatches = formData.content.match(/\{\{([^}]+)\}\}/g) || [];
    const extractedVariables = [...new Set(
      variableMatches.map(match => match.slice(2, -2).split('|')[0])
    )];
    
    const updatedDocument: DocumentTemplate = {
      ...document,
      ...formData,
      lastModified: new Date().toISOString(),
      variables: extractedVariables
    };
    onSave(updatedDocument);
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      allowedRoles: prev.allowedRoles.includes(role)
        ? prev.allowedRoles.filter(r => r !== role)
        : [...prev.allowedRoles, role]
    }));
  };

  const insertVariable = (variable: string) => {
    // Insertar variable en el contenido del documento
    const variableMarkup = `<span class="variable-placeholder" style="background-color: #e3f2fd; padding: 2px 4px; border-radius: 3px; border: 1px solid #2196f3; color: #0277bd;">{{${variable}}}</span>`;
    setFormData(prev => ({ ...prev, content: prev.content + ' ' + variableMarkup + ' ' }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Editar Documento</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Documento
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Contrato de Venta"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                category: e.target.value as DocumentTemplate['category'] 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Descripción del documento..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Contenido del Documento
              </label>
              <button
                type="button"
                onClick={() => setShowVariables(!showVariables)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
                {showVariables ? 'Ocultar' : 'Mostrar'} Variables
              </button>
            </div>
            
            <div className="flex gap-4">
              {/* Editor de contenido */}
              <div className="flex-1">
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  height={500}
                  placeholder="Contenido del documento con variables como {{variable_nombre}}... Use las herramientas de formato para crear documentos profesionales."
                />
              </div>
              
              {/* Panel de variables */}
              {showVariables && (
                <div className="w-80 bg-gray-50 rounded-lg p-4 border">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Variables Disponibles</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {availableVariables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertVariable(variable)}
                        className="w-full text-left px-3 py-2 text-xs bg-white hover:bg-blue-50 hover:text-blue-700 rounded border transition-colors"
                      >
                        <span className="font-mono text-blue-600">{"{"}</span>
                        <span className="font-mono text-blue-600">{"{"}</span>
                        <span className="font-mono">{variable}</span>
                        <span className="font-mono text-blue-600">{"}"}</span>
                        <span className="font-mono text-blue-600">{"}"}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      Haz clic en cualquier variable para insertarla en el cursor.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Indicador de variables encontradas */}
            {formData.content && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  Variables detectadas: {(formData.content.match(/\{\{([^}]+)\}\}/g) || []).length}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isVisible}
                  onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Visible para usuarios</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isComplete}
                  onChange={(e) => setFormData(prev => ({ ...prev, isComplete: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Documento completo</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles con Acceso
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableRoles.map(role => (
                <label key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowedRoles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 capitalize">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para Gestión de Permisos
interface RoleManagementModalProps {
  document: DocumentTemplate;
  onClose: () => void;
  onUpdateRoles: (roles: string[]) => void;
  availableRoles: string[];
}

const RoleManagementModal: React.FC<RoleManagementModalProps> = ({ 
  document, 
  onClose, 
  onUpdateRoles, 
  availableRoles 
}) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([...document.allowedRoles]);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRoles(selectedRoles);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Gestionar Permisos</h2>
            <p className="text-gray-600">{document.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Roles con Acceso</h3>
              <p className="text-sm text-gray-600 mb-4">
                Selecciona qué roles pueden ver y usar este documento.
              </p>
            </div>

            <div className="space-y-3">
              {availableRoles.map(role => (
                <label key={role} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    className="mr-3 h-4 w-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 capitalize">{role}</span>
                    <p className="text-xs text-gray-500">
                      {role === 'master' && 'Acceso total al sistema'}
                      {role === 'admin' && 'Administrador con permisos avanzados'}
                      {role === 'vendedor' && 'Vendedor con acceso a documentos comerciales'}
                      {role === 'cobrador' && 'Cobrador con acceso a documentos de cobranza'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Actualizar Permisos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Documentos;