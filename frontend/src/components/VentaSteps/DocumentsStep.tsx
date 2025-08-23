import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  Download,
  Eye,
  Check,
  AlertCircle,
  Camera,
  Paperclip
} from 'lucide-react';
import type { VentaFormData } from '../NewVentaForm';

interface DocumentsStepProps {
  data: VentaFormData;
  onUpdate: (updates: Partial<VentaFormData>) => void;
  errors: Record<string, string>;
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedTypes: string[];
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'cedula_cliente',
    name: 'Cédula del Cliente',
    description: 'Copia de la cédula de ciudadanía del cliente',
    required: true,
    acceptedTypes: ['image/*', '.pdf']
  },
  {
    id: 'cedula_garante',
    name: 'Cédula del Garante',
    description: 'Copia de la cédula del garante (si aplica)',
    required: false,
    acceptedTypes: ['image/*', '.pdf']
  },
  {
    id: 'comprobante_ingresos_cliente',
    name: 'Comprobante de Ingresos - Cliente',
    description: 'Certificado laboral, desprendible de pago o declaración de renta del cliente',
    required: true,
    acceptedTypes: ['image/*', '.pdf']
  },
  {
    id: 'comprobante_ingresos_garante',
    name: 'Comprobante de Ingresos - Garante',
    description: 'Certificado laboral, desprendible de pago o declaración de renta del garante',
    required: false,
    acceptedTypes: ['image/*', '.pdf']
  },
  {
    id: 'referencias_comerciales',
    name: 'Referencias Comerciales',
    description: 'Cartas de referencias de establecimientos comerciales',
    required: false,
    acceptedTypes: ['image/*', '.pdf']
  },
  {
    id: 'servicios_publicos',
    name: 'Recibos de Servicios Públicos',
    description: 'Últimos recibos de servicios públicos del cliente',
    required: true,
    acceptedTypes: ['image/*', '.pdf']
  },
  {
    id: 'autorizacion_centrales_riesgo',
    name: 'Autorización Centrales de Riesgo',
    description: 'Autorización firmada para consulta en centrales de riesgo',
    required: true,
    acceptedTypes: ['image/*', '.pdf']
  },
  {
    id: 'otros',
    name: 'Otros Documentos',
    description: 'Cualquier otro documento relevante para la venta',
    required: false,
    acceptedTypes: ['image/*', '.pdf', '.doc', '.docx']
  }
];

interface UploadedFile {
  file: File;
  type: string;
  preview?: string;
  id: string;
}

const DocumentsStep: React.FC<DocumentsStepProps> = ({ data, onUpdate, errors }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');

  // Sincronizar con los datos del formulario principal
  React.useEffect(() => {
    if (data.uploadedDocuments) {
      const files = data.uploadedDocuments.map((file, index) => ({
        file,
        type: 'otros', // Por defecto, tendríamos que almacenar el tipo de alguna manera
        id: `${index}-${file.name}`
      }));
      setUploadedFiles(files);
    }
  }, []);

  const handleFileUpload = (files: FileList | null, documentType: string) => {
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    
    Array.from(files).forEach((file) => {
      const fileId = `${Date.now()}-${file.name}`;
      const uploadedFile: UploadedFile = {
        file,
        type: documentType,
        id: fileId
      };

      // Crear preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
          setUploadedFiles(prev => [...prev, uploadedFile]);
          updateDocuments([...uploadedFiles, uploadedFile]);
        };
        reader.readAsDataURL(file);
      } else {
        newFiles.push(uploadedFile);
      }
    });

    if (newFiles.length > 0) {
      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
      updateDocuments(updatedFiles);
    }
  };

  const updateDocuments = (files: UploadedFile[]) => {
    onUpdate({
      uploadedDocuments: files.map(f => f.file)
    });
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(updatedFiles);
    updateDocuments(updatedFiles);
  };

  const handleDragOver = (e: React.DragEvent, documentType: string) => {
    e.preventDefault();
    setDragOver(documentType);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, documentType: string) => {
    e.preventDefault();
    setDragOver(null);
    handleFileUpload(e.dataTransfer.files, documentType);
  };

  const openFileDialog = (documentType: string) => {
    setSelectedDocumentType(documentType);
    if (fileInputRef.current) {
      const docType = DOCUMENT_TYPES.find(dt => dt.id === documentType);
      if (docType) {
        fileInputRef.current.accept = docType.acceptedTypes.join(',');
      }
      fileInputRef.current.click();
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-8 w-8 text-blue-600" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-800" />;
      default:
        return <File className="h-8 w-8 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUploadedFilesForType = (documentType: string) => {
    return uploadedFiles.filter(f => f.type === documentType);
  };

  const isDocumentTypeComplete = (documentType: DocumentType) => {
    if (!documentType.required) return true;
    
    // Para garante, solo es requerido si se necesita garante
    if (documentType.id.includes('garante') && !data.needsGuarantor) {
      return true;
    }
    
    return getUploadedFilesForType(documentType.id).length > 0;
  };

  const getCompletedDocumentTypes = () => {
    return DOCUMENT_TYPES.filter(dt => isDocumentTypeComplete(dt)).length;
  };

  const getRequiredDocumentTypes = () => {
    return DOCUMENT_TYPES.filter(dt => {
      if (!dt.required) return false;
      if (dt.id.includes('garante') && !data.needsGuarantor) return false;
      return true;
    }).length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Documentación Requerida
        </h3>
        <p className="text-gray-600">
          Suba los documentos necesarios para procesar la venta. Los documentos marcados con * son obligatorios.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Paperclip className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-900">
              Progreso de Documentos
            </span>
          </div>
          <span className="text-blue-700 font-semibold">
            {getCompletedDocumentTypes()}/{getRequiredDocumentTypes()} completados
          </span>
        </div>
        <div className="mt-2 bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(getCompletedDocumentTypes() / getRequiredDocumentTypes()) * 100}%`
            }}
          ></div>
        </div>
      </div>

      {/* Document Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DOCUMENT_TYPES.filter((documentType) => {
          // Filtrar documentos del garante si no se necesita garante
          if (documentType.id.includes('garante') && !data.needsGuarantor) {
            return false;
          }
          return true;
        }).map((documentType) => {
          const uploadedFiles = getUploadedFilesForType(documentType.id);
          const isRequired = documentType.required && 
            (!documentType.id.includes('garante') || data.needsGuarantor);
          const isComplete = isDocumentTypeComplete(documentType);
          
          return (
            <div
              key={documentType.id}
              className={`border-2 border-dashed rounded-lg p-4 transition-all ${
                dragOver === documentType.id
                  ? 'border-blue-500 bg-blue-50'
                  : isComplete
                  ? 'border-green-300 bg-green-50'
                  : isRequired
                  ? 'border-gray-300 hover:border-gray-400'
                  : 'border-gray-200'
              }`}
              onDragOver={(e) => handleDragOver(e, documentType.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, documentType.id)}
            >
              <div className="text-center">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    {documentType.name}
                    {isRequired && <span className="text-red-500 ml-1">*</span>}
                  </h4>
                  {isComplete && (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {documentType.description}
                </p>

                {/* Upload Area */}
                <div
                  onClick={() => openFileDialog(documentType.id)}
                  className="cursor-pointer p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Haga clic para seleccionar archivos o arrástrelos aquí
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tipos permitidos: {documentType.acceptedTypes.join(', ')}
                  </p>
                </div>

                {/* Uploaded Files for this type */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((uploadedFile) => (
                      <div
                        key={uploadedFile.id}
                        className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {uploadedFile.preview ? (
                            <img
                              src={uploadedFile.preview}
                              alt="Preview"
                              className="h-10 w-10 object-cover rounded"
                            />
                          ) : (
                            getFileIcon(uploadedFile.file.name)
                          )}
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                              {uploadedFile.file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(uploadedFile.file.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {uploadedFile.preview && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Aquí podrías abrir un modal para ver la imagen completa
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Ver imagen"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(uploadedFile.id);
                            }}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Eliminar archivo"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files, selectedDocumentType)}
      />

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Resumen de Documentos
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {uploadedFiles.length}
            </div>
            <div className="text-sm text-gray-600">Total de archivos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {getCompletedDocumentTypes()}
            </div>
            <div className="text-sm text-gray-600">Tipos completados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {uploadedFiles.reduce((total, file) => total + file.file.size, 0) > 0
                ? formatFileSize(uploadedFiles.reduce((total, file) => total + file.file.size, 0))
                : '0 KB'
              }
            </div>
            <div className="text-sm text-gray-600">Tamaño total</div>
          </div>
        </div>

        {getCompletedDocumentTypes() < getRequiredDocumentTypes() && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 text-sm">
              Faltan {getRequiredDocumentTypes() - getCompletedDocumentTypes()} documentos requeridos para continuar.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsStep;