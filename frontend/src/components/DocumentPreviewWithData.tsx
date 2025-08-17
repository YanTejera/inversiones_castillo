import React, { useState } from 'react';
import {
  FileText,
  X,
  Printer,
  Download,
  Eye,
  Edit,
  RefreshCw
} from 'lucide-react';
import { generateDocumentVariables, replaceDocumentVariables } from '../services/documentVariables';
import type { VentaFormData } from './NewVentaForm';

interface DocumentTemplate {
  id: string;
  name: string;
  content: string;
  description: string;
}

interface DocumentPreviewWithDataProps {
  document: DocumentTemplate;
  ventaData: VentaFormData;
  onClose: () => void;
  onEdit?: () => void;
}

const DocumentPreviewWithData: React.FC<DocumentPreviewWithDataProps> = ({
  document,
  ventaData,
  onClose,
  onEdit
}) => {
  const [showVariables, setShowVariables] = useState(false);

  // Generar variables dinámicas desde los datos de la venta
  const variables = generateDocumentVariables(ventaData);
  
  // Procesar el contenido del documento con las variables
  const processedContent = replaceDocumentVariables(document.content, variables);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${document.name}</title>
            <style>
              body { 
                font-family: 'Times New Roman', serif; 
                margin: 40px; 
                line-height: 1.6;
                font-size: 12pt;
              }
              h1, h2, h3 { 
                text-align: center; 
                margin-bottom: 20px;
                font-weight: bold;
              }
              .content { 
                margin-top: 20px; 
                white-space: pre-line;
              }
              .signature-section {
                margin-top: 50px;
                text-align: center;
              }
              .signature-line {
                border-top: 1px solid #000;
                width: 300px;
                margin: 20px auto;
                padding-top: 5px;
              }
              @media print {
                body { margin: 20px; }
              }
            </style>
          </head>
          <body>
            <div class="content">${processedContent.replace(/\n/g, '<br>')}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    const blob = new Blob([processedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${document.name.replace(/\s+/g, '_')}_${ventaData.customer?.nombre || 'documento'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vista Previa con Datos Reales</h2>
            <p className="text-gray-600">{document.name}</p>
            <p className="text-sm text-gray-500">Cliente: {ventaData.customer?.nombre} {ventaData.customer?.apellido}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowVariables(!showVariables)}
              className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Variables
            </button>
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
            >
              <Printer className="h-4 w-4 mr-1" />
              Imprimir
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
            >
              <Download className="h-4 w-4 mr-1" />
              Descargar
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Variables Panel */}
          {showVariables && (
            <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
              <h3 className="font-semibold text-gray-900 mb-3">Variables y Valores Actuales</h3>
              <div className="space-y-3">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="bg-white p-3 rounded-lg border">
                    <div className="text-xs font-mono text-gray-500 mb-1">
                      {`{{${key}}}`}
                    </div>
                    <div className="text-sm text-gray-900 break-words">
                      {value || <span className="text-gray-400 italic">[Sin valor]</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Preview */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8 bg-white">
              {processedContent ? (
                <div className="prose max-w-none">
                  <div 
                    className="whitespace-pre-line font-serif leading-relaxed"
                    style={{ fontFamily: 'Times New Roman, serif' }}
                  >
                    {processedContent}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 mb-4" />
                  <p>Este documento no tiene contenido aún.</p>
                  <p className="text-sm">Configure el contenido del documento para ver la vista previa.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            <span className="inline-flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              Documento generado automáticamente con datos de la venta
            </span>
          </div>
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

export default DocumentPreviewWithData;