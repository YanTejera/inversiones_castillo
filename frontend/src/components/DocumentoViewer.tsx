import React from 'react';
import { X, Download } from 'lucide-react';
import LazyImage from './LazyImage';

interface DocumentoViewerProps {
  archivo: string;
  titulo: string;
  onClose: () => void;
}

const DocumentoViewer: React.FC<DocumentoViewerProps> = ({ archivo, titulo, onClose }) => {
  const isImage = archivo.match(/\.(jpeg|jpg|gif|png)$/i);
  const isPdf = archivo.match(/\.pdf$/i);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = archivo;
    link.download = titulo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{titulo}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Descargar"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[calc(90vh-80px)] overflow-auto">
          {isImage ? (
            <div className="flex justify-center">
              <LazyImage
                src={archivo}
                alt={titulo}
                className="max-w-full max-h-full object-contain"
                containerClassName="max-w-full max-h-full"
                fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23f3f4f6'/><text x='100' y='100' text-anchor='middle' dy='.3em' fill='%236b7280'>Error al cargar imagen</text></svg>"
                showLoader={true}
                fadeInDuration={400}
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={archivo}
              className="w-full h-96 border rounded"
              title={titulo}
            />
          ) : (
            <div className="text-center py-12">
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m6 0h6m-6 6h6m-6 6h6M9 24h6m6 0h6M9 30h6m6 0h6"/>
                </svg>
              </div>
              <p className="text-gray-600 mb-4">Vista previa no disponible para este tipo de archivo</p>
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center mx-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar archivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentoViewer;