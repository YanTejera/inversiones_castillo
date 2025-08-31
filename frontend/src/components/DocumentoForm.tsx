import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Upload,
  File,
  FileText,
  Eye,
  Download,
  Trash2
} from 'lucide-react';

interface Documento {
  id?: number;
  cliente: number;
  propietario: string;
  propietario_display?: string;
  tipo_documento: string;
  tipo_documento_display?: string;
  descripcion: string;
  archivo?: string;
  fecha_creacion?: string;
}

interface DocumentoFormProps {
  documento?: Documento | null;
  clienteId: number;
  clienteNombre: string;
  onClose: () => void;
  onSave: (documento: Partial<Documento>, archivo?: File) => Promise<void>;
  mode: 'create' | 'edit' | 'view';
}

interface FormData {
  propietario: string;
  tipo_documento: string;
  descripcion: string;
}

const tiposDocumento = [
  { value: 'cedula', label: 'Cédula' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'licencia_conducir', label: 'Licencia de Conducir' },
  { value: 'prueba_direccion', label: 'Prueba de Dirección' },
];

const DocumentoForm: React.FC<DocumentoFormProps> = ({ 
  documento, 
  clienteId, 
  clienteNombre, 
  onClose, 
  onSave, 
  mode 
}) => {
  const [formData, setFormData] = useState<FormData>({
    propietario: documento?.propietario || 'cliente',
    tipo_documento: documento?.tipo_documento || 'cedula',
    descripcion: documento?.descripcion || ''
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }

    if (mode === 'create' && !selectedFile && !documento?.archivo) {
      newErrors.archivo = 'Debe seleccionar un archivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, archivo: 'El archivo no debe superar los 10MB' }));
        return;
      }
      
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, archivo: 'Tipo de archivo no válido. Solo se permiten imágenes, PDF y documentos de Word' }));
        return;
      }

      setSelectedFile(file);
      setErrors(prev => ({ ...prev, archivo: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        cliente: clienteId,
        ...(documento?.id && { id: documento.id })
      };

      await onSave(submitData, selectedFile || undefined);
      onClose();
    } catch (error) {
      console.error('Error saving documento:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <File className="h-5 w-5 text-red-600" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Eye className="h-5 w-5 text-green-600" />;
      default:
        return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isReadOnly = mode === 'view';

  return (
    <div className="modal-overlay">
      <div className="modal-responsive max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' && 'Agregar Documento'}
            {mode === 'edit' && 'Editar Documento'}
            {mode === 'view' && 'Detalles del Documento'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Client Info */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-gray-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Documento para:
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {clienteNombre}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Propietario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documento para *
              </label>
              <select
                value={formData.propietario}
                onChange={(e) => setFormData(prev => ({ ...prev, propietario: e.target.value }))}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isReadOnly ? 'bg-gray-50' : 'border-gray-300'
                }`}
              >
                <option value="cliente">Cliente</option>
                <option value="fiador">Fiador</option>
              </select>
            </div>

            {/* Tipo de Documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Documento *
              </label>
              <select
                value={formData.tipo_documento}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo_documento: e.target.value }))}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isReadOnly ? 'bg-gray-50' : 'border-gray-300'
                }`}
              >
                {tiposDocumento.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción *
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                readOnly={isReadOnly}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.descripcion ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-50' : ''}`}
                placeholder="Descripción detallada del documento..."
              />
              {errors.descripcion && <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>}
            </div>

            {/* Archivo Actual (si existe) */}
            {documento?.archivo && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo Actual
                </label>
                <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getFileIcon(documento.archivo)}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {documento.archivo.split('/').pop()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Subido el {documento.fecha_creacion ? new Date(documento.fecha_creacion).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={documento.archivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(documento.archivo, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Ver archivo"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <a
                        href={documento.archivo}
                        download
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="text-green-600 hover:text-green-800"
                        title="Descargar archivo"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload de Archivo */}
            {!isReadOnly && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {documento?.archivo ? 'Reemplazar Archivo' : 'Archivo *'}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    className="hidden"
                    id="archivo-upload"
                  />
                  <label
                    htmlFor="archivo-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile ? selectedFile.name : 'Seleccionar archivo'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, PDF, DOC hasta 10MB
                    </p>
                    {selectedFile && (
                      <p className="text-xs text-blue-600 mt-1">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    )}
                  </label>
                </div>
                {errors.archivo && <p className="text-red-500 text-sm mt-1">{errors.archivo}</p>}
              </div>
            )}

            {/* Información de Formatos */}
            {!isReadOnly && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Formatos Aceptados
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Imágenes:</strong> JPG, JPEG, PNG</li>
                  <li>• <strong>Documentos:</strong> PDF, DOC, DOCX</li>
                  <li>• <strong>Tamaño máximo:</strong> 10MB</li>
                </ul>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === 'create' ? 'Agregar Documento' : 'Guardar Cambios'}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentoForm;