import React, { useState } from 'react';
import {
  FileCheck,
  CheckSquare,
  Square,
  AlertCircle,
  FileText,
  Scale,
  Shield,
  Users,
  Home,
  Car
} from 'lucide-react';
import type { VentaFormData } from '../NewVentaForm';

interface LegalDocumentsStepProps {
  data: VentaFormData;
  onUpdate: (updates: Partial<VentaFormData>) => void;
  errors: Record<string, string>;
}

interface LegalDocument {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: 'venta' | 'financiamiento' | 'garantias' | 'otros';
  icon: React.ComponentType<{ className?: string }>;
}

const LEGAL_DOCUMENTS: LegalDocument[] = [
  // Documentos de Venta
  {
    id: 'contrato_compraventa',
    name: 'Contrato de Compraventa',
    description: 'Contrato principal que establece los términos y condiciones de la venta',
    required: true,
    category: 'venta',
    icon: FileText
  },
  {
    id: 'factura_venta',
    name: 'Factura de Venta',
    description: 'Documento fiscal que respalda la transacción comercial',
    required: true,
    category: 'venta',
    icon: FileCheck
  },
  {
    id: 'registro_mercantil',
    name: 'Certificado de Registro Mercantil',
    description: 'Documento que acredita la inscripción del negocio en el registro mercantil',
    required: true,
    category: 'venta',
    icon: Scale
  },

  // Documentos de Financiamiento
  {
    id: 'pagare',
    name: 'Pagaré',
    description: 'Documento que formaliza la obligación de pago del cliente',
    required: true,
    category: 'financiamiento',
    icon: FileText
  },
  {
    id: 'tabla_amortizacion',
    name: 'Tabla de Amortización',
    description: 'Cronograma detallado de pagos con fechas y montos',
    required: true,
    category: 'financiamiento',
    icon: FileCheck
  },
  {
    id: 'autorizacion_centrales_riesgo',
    name: 'Autorización Centrales de Riesgo',
    description: 'Autorización para consultar historial crediticio del cliente',
    required: true,
    category: 'financiamiento',
    icon: Shield
  },

  // Documentos de Garantías
  {
    id: 'carta_autorizacion_garante',
    name: 'Carta de Autorización del Garante',
    description: 'Documento donde el garante acepta su responsabilidad',
    required: false,
    category: 'garantias',
    icon: Users
  },
  {
    id: 'promesa_compraventa_inmueble',
    name: 'Promesa de Compraventa de Inmueble',
    description: 'Garantía hipotecaria sobre bienes inmuebles',
    required: false,
    category: 'garantias',
    icon: Home
  },
  {
    id: 'prenda_vehiculo',
    name: 'Prenda sobre Vehículo',
    description: 'Garantía prendaria sobre vehículos del cliente',
    required: false,
    category: 'garantias',
    icon: Car
  },

  // Otros Documentos
  {
    id: 'manual_usuario',
    name: 'Manual del Usuario',
    description: 'Guía de uso y mantenimiento de la motocicleta',
    required: false,
    category: 'otros',
    icon: FileText
  },
  {
    id: 'certificado_garantia',
    name: 'Certificado de Garantía',
    description: 'Documento que establece los términos de la garantía del producto',
    required: false,
    category: 'otros',
    icon: Shield
  },
  {
    id: 'poliza_seguro',
    name: 'Póliza de Seguro',
    description: 'Documento de seguro para la motocicleta (si aplica)',
    required: false,
    category: 'otros',
    icon: Shield
  }
];

const CATEGORY_INFO = {
  venta: {
    name: 'Documentos de Venta',
    description: 'Documentos esenciales para formalizar la venta',
    color: 'blue'
  },
  financiamiento: {
    name: 'Documentos de Financiamiento',
    description: 'Documentos requeridos para el financiamiento',
    color: 'green'
  },
  garantias: {
    name: 'Documentos de Garantías',
    description: 'Documentos relacionados con garantías y avales',
    color: 'purple'
  },
  otros: {
    name: 'Otros Documentos',
    description: 'Documentos adicionales y complementarios',
    color: 'gray'
  }
};

const LegalDocumentsStep: React.FC<LegalDocumentsStepProps> = ({ data, onUpdate, errors }) => {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>(data.legalDocuments || []);

  const handleDocumentToggle = (documentId: string) => {
    const updatedDocuments = selectedDocuments.includes(documentId)
      ? selectedDocuments.filter(id => id !== documentId)
      : [...selectedDocuments, documentId];
    
    setSelectedDocuments(updatedDocuments);
    onUpdate({ legalDocuments: updatedDocuments });
  };

  const getDocumentsByCategory = (category: string) => {
    return LEGAL_DOCUMENTS.filter(doc => doc.category === category);
  };

  const getRequiredDocuments = () => {
    let required = LEGAL_DOCUMENTS.filter(doc => doc.required);
    
    // Agregar documentos requeridos según el contexto
    if (data.paymentType === 'financiado') {
      required = required.concat(
        LEGAL_DOCUMENTS.filter(doc => 
          doc.category === 'financiamiento' || 
          (doc.category === 'garantias' && data.needsGuarantor)
        )
      );
    }
    
    return required;
  };

  const getSelectedRequiredCount = () => {
    const requiredDocs = getRequiredDocuments();
    return requiredDocs.filter(doc => selectedDocuments.includes(doc.id)).length;
  };

  const isDocumentSelected = (documentId: string) => {
    return selectedDocuments.includes(documentId);
  };

  const getCategoryColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'gray':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Documentos Legales de la Venta
        </h3>
        <p className="text-gray-600">
          Seleccione los documentos legales que se incluirán en la transacción de venta.
        </p>
      </div>

      {/* Resumen de progreso */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileCheck className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-900">
              Progreso de Documentos Legales
            </span>
          </div>
          <span className="text-blue-700 font-semibold">
            {getSelectedRequiredCount()}/{getRequiredDocuments().length} requeridos
          </span>
        </div>
        <div className="mt-2 bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(getSelectedRequiredCount() / Math.max(getRequiredDocuments().length, 1)) * 100}%`
            }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-blue-700">
          {selectedDocuments.length} documentos seleccionados en total
        </div>
      </div>

      {/* Documentos por categoría */}
      {Object.entries(CATEGORY_INFO).map(([categoryKey, categoryInfo]) => {
        const documents = getDocumentsByCategory(categoryKey);
        
        // No mostrar categoría de financiamiento si es pago de contado
        if (categoryKey === 'financiamiento' && data.paymentType === 'contado') {
          return null;
        }
        
        // No mostrar categoría de garantías si no hay garante
        if (categoryKey === 'garantias' && !data.needsGuarantor) {
          return null;
        }

        return (
          <div key={categoryKey} className="space-y-4">
            <div className={`border rounded-lg p-4 ${getCategoryColorClasses(categoryInfo.color)}`}>
              <h4 className="font-semibold mb-1">{categoryInfo.name}</h4>
              <p className="text-sm opacity-90">{categoryInfo.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((document) => {
                const IconComponent = document.icon;
                const isSelected = isDocumentSelected(document.id);
                const isRequired = getRequiredDocuments().some(req => req.id === document.id);

                return (
                  <div
                    key={document.id}
                    onClick={() => handleDocumentToggle(document.id)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          isSelected ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <IconComponent className={`h-5 w-5 ${
                            isSelected ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h5 className="font-medium text-gray-900">
                              {document.name}
                            </h5>
                            {isRequired && (
                              <span className="ml-2 text-red-500 text-sm">*</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {document.description}
                          </p>
                          {isRequired && (
                            <div className="flex items-center mt-2">
                              <AlertCircle className="h-4 w-4 text-orange-500 mr-1" />
                              <span className="text-xs text-orange-600 font-medium">
                                Documento requerido
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-3">
                        {isSelected ? (
                          <CheckSquare className="h-6 w-6 text-blue-600" />
                        ) : (
                          <Square className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Resumen final */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Resumen de Documentos Seleccionados
        </h4>
        
        {selectedDocuments.length > 0 ? (
          <div className="space-y-2">
            {selectedDocuments.map((docId) => {
              const document = LEGAL_DOCUMENTS.find(d => d.id === docId);
              if (!document) return null;
              
              return (
                <div key={docId} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                  <div className="flex items-center">
                    <document.icon className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {document.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDocumentToggle(docId)}
                    className="text-red-600 hover:text-red-800"
                    title="Remover documento"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 italic">No hay documentos seleccionados</p>
        )}
      </div>

      {/* Validación */}
      {getSelectedRequiredCount() < getRequiredDocuments().length && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
          <div>
            <p className="text-yellow-800 font-medium">
              Documentos requeridos faltantes
            </p>
            <p className="text-yellow-700 text-sm">
              Debe seleccionar {getRequiredDocuments().length - getSelectedRequiredCount()} documentos requeridos adicionales para continuar.
            </p>
          </div>
        </div>
      )}

      {getSelectedRequiredCount() === getRequiredDocuments().length && selectedDocuments.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <FileCheck className="h-5 w-5 text-green-600 mr-3" />
          <div>
            <p className="text-green-800 font-medium">
              Documentos legales completos
            </p>
            <p className="text-green-700 text-sm">
              Se han seleccionado todos los documentos requeridos para esta venta.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalDocumentsStep;