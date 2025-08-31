import React, { useState, useRef, useCallback } from 'react';
import {
  Download,
  Upload,
  FileText,
  Database,
  CheckCircle,
  AlertTriangle,
  X,
  File,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Save
} from 'lucide-react';

interface ImportExportManagerProps {
  onClose?: () => void;
  defaultType?: 'inventory' | 'clientes' | 'proveedores' | 'ventas' | 'pagos' | 'documentos' | 'locations';
}

interface ImportPreview {
  total_rows: number;
  preview_rows: number;
  items: any[];
  errors: string[];
  can_import: boolean;
  preview: boolean;
}

const ImportExportManager: React.FC<ImportExportManagerProps> = ({ onClose, defaultType = 'inventory' }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportType, setExportType] = useState<'inventory' | 'clientes' | 'proveedores' | 'ventas' | 'pagos' | 'documentos' | 'locations'>(defaultType);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'json'>('excel');
  const [importType, setImportType] = useState<'inventory' | 'locations'>('inventory');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(async () => {
    setIsProcessing(true);
    try {
      let endpoint = '';
      switch (exportType) {
        case 'inventory':
          endpoint = '/api/motos/export/inventory/';
          break;
        case 'clientes':
          endpoint = '/api/motos/export/clientes/';
          break;
        case 'proveedores':
          endpoint = '/api/motos/export/proveedores/';
          break;
        case 'ventas':
          endpoint = '/api/motos/export/ventas/';
          break;
        case 'pagos':
          endpoint = '/api/motos/export/pagos/';
          break;
        case 'documentos':
          endpoint = '/api/motos/export/documentos/';
          break;
        case 'locations':
          endpoint = '/api/motos/export/locations/';
          break;
        default:
          endpoint = '/api/motos/export/inventory/';
      }

      const response = await fetch(`${endpoint}?export_format=${exportFormat}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        let filename = '';
        const dateStr = new Date().toISOString().split('T')[0];
        const extension = exportFormat === 'excel' ? 'xlsx' : exportFormat;
        
        switch (exportType) {
          case 'inventory':
            filename = `inventario_${dateStr}.${extension}`;
            break;
          case 'clientes':
            filename = `clientes_${dateStr}.${extension}`;
            break;
          case 'proveedores':
            filename = `proveedores_${dateStr}.${extension}`;
            break;
          case 'ventas':
            filename = `ventas_${dateStr}.${extension}`;
            break;
          case 'pagos':
            filename = `pagos_${dateStr}.${extension}`;
            break;
          case 'documentos':
            filename = `documentos_${dateStr}.${extension}`;
            break;
          case 'locations':
            filename = `ubicaciones_${dateStr}.${extension}`;
            break;
          default:
            filename = `export_${dateStr}.${extension}`;
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setProcessResult({
          success: true,
          message: 'Exportación completada exitosamente'
        });
      } else {
        throw new Error('Error en la exportación');
      }
    } catch (error) {
      setProcessResult({
        success: false,
        message: 'Error durante la exportación'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [exportType, exportFormat]);

  const handleDownloadTemplate = useCallback(async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/motos/export/templates/?type=${importType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `plantilla_${importType}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setProcessResult({
          success: true,
          message: 'Plantilla descargada exitosamente'
        });
      }
    } catch (error) {
      setProcessResult({
        success: false,
        message: 'Error al descargar plantilla'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [importType]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportPreview(null);
      setProcessResult(null);
    }
  }, []);

  const handlePreviewImport = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('preview', 'true');

    try {
      const response = await fetch(`/api/motos/import/${importType}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setImportPreview(result);
        setShowPreview(true);
      } else {
        const error = await response.json();
        setProcessResult({
          success: false,
          message: error.error || 'Error en la vista previa'
        });
      }
    } catch (error) {
      setProcessResult({
        success: false,
        message: 'Error al procesar archivo'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, importType]);

  const handleExecuteImport = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('preview', 'false');

    try {
      const response = await fetch(`/api/motos/import/${importType}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setProcessResult(result);
        setImportPreview(null);
        setSelectedFile(null);
        setShowPreview(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const error = await response.json();
        setProcessResult({
          success: false,
          message: error.error || 'Error en la importación'
        });
      }
    } catch (error) {
      setProcessResult({
        success: false,
        message: 'Error durante la importación'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, importType]);

  const getExportIcon = (format: string) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'csv':
        return <FileText className="w-4 h-4" />;
      case 'json':
        return <Database className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-responsive max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Gestión de Datos - Importar/Exportar
          </h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'export' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('export')}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Exportar Datos
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'import' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('import')}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Importar Datos
          </button>
        </div>

        <div className="p-6">
          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Export Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Datos
                  </label>
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value as any)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="inventory">Inventario de Motocicletas</option>
                    <option value="clientes">Base de Datos de Clientes</option>
                    <option value="proveedores">Directorio de Proveedores</option>
                    <option value="ventas">Registro de Ventas</option>
                    <option value="pagos">Gestión de Pagos y Cobros</option>
                    <option value="documentos">Archivo de Documentos</option>
                    <option value="locations">Ubicaciones Físicas</option>
                  </select>
                </div>

                {/* Export Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formato de Archivo
                  </label>
                  <div className="space-y-2">
                    {['excel', 'csv', 'json'].map((format) => (
                      <label key={format} className="flex items-center">
                        <input
                          type="radio"
                          value={format}
                          checked={exportFormat === format}
                          onChange={(e) => setExportFormat(e.target.value as any)}
                          className="mr-2"
                        />
                        <span className="flex items-center">
                          {getExportIcon(format)}
                          <span className="ml-2 capitalize">{format}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleExport}
                  disabled={isProcessing}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5 mr-2" />
                  )}
                  {isProcessing ? 'Exportando...' : 'Exportar Datos'}
                </button>
              </div>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              {/* Import Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Importación
                </label>
                <select
                  value={importType}
                  onChange={(e) => {
                    setImportType(e.target.value as any);
                    setSelectedFile(null);
                    setImportPreview(null);
                    setProcessResult(null);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="inventory">Inventario de Motocicletas</option>
                  <option value="locations">Ubicaciones Físicas</option>
                </select>
              </div>

              {/* Download Template */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Descargar Plantilla</h3>
                <p className="text-blue-700 text-sm mb-3">
                  Descarga la plantilla con el formato correcto para tu importación
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  disabled={isProcessing}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Descargar Plantilla
                </button>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Archivo
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv,.json"
                  onChange={handleFileSelect}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Archivo seleccionado: {selectedFile.name}
                  </p>
                )}
              </div>

              {/* Import Actions */}
              {selectedFile && (
                <div className="flex gap-3">
                  <button
                    onClick={handlePreviewImport}
                    disabled={isProcessing}
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50 flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Vista Previa
                  </button>
                  <button
                    onClick={handleExecuteImport}
                    disabled={isProcessing || (importPreview && !importPreview.can_import)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Importar Ahora
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Preview Modal */}
          {showPreview && importPreview && (
            <div className="modal-overlay z-60">
              <div className="modal-responsive max-w-4xl max-h-[80vh]">
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="text-lg font-semibold">Vista Previa de Importación</h3>
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Total de filas: {importPreview.total_rows} | 
                      Mostrando: {importPreview.preview_rows} | 
                      Errores: {importPreview.errors.length}
                    </p>
                  </div>
                  
                  {importPreview.errors.length > 0 && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
                      <h4 className="font-medium text-red-800 mb-2">Errores encontrados:</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {importPreview.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">Fila</th>
                          <th className="border border-gray-300 p-2 text-left">Estado</th>
                          {importType === 'inventory' && (
                            <>
                              <th className="border border-gray-300 p-2 text-left">Marca</th>
                              <th className="border border-gray-300 p-2 text-left">Modelo</th>
                              <th className="border border-gray-300 p-2 text-left">Color</th>
                              <th className="border border-gray-300 p-2 text-left">Chasis</th>
                            </>
                          )}
                          {importType === 'locations' && (
                            <>
                              <th className="border border-gray-300 p-2 text-left">Almacén</th>
                              <th className="border border-gray-300 p-2 text-left">Zona</th>
                              <th className="border border-gray-300 p-2 text-left">Ubicación</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.items.map((item, index) => (
                          <tr key={index} className={item.status === 'error' ? 'bg-red-50' : 'bg-white'}>
                            <td className="border border-gray-300 p-2">{item.row}</td>
                            <td className="border border-gray-300 p-2">
                              {item.status === 'ok' ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                              )}
                            </td>
                            {importType === 'inventory' && (
                              <>
                                <td className="border border-gray-300 p-2">{item.marca}</td>
                                <td className="border border-gray-300 p-2">{item.modelo}</td>
                                <td className="border border-gray-300 p-2">{item.color}</td>
                                <td className="border border-gray-300 p-2">{item.numero_chasis}</td>
                              </>
                            )}
                            {importType === 'locations' && (
                              <>
                                <td className="border border-gray-300 p-2">{item.almacen_nombre}</td>
                                <td className="border border-gray-300 p-2">{item.zona_nombre}</td>
                                <td className="border border-gray-300 p-2">{item.ubicacion_nombre}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Result Messages */}
          {processResult && (
            <div className={`mt-6 p-4 rounded-lg ${
              processResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                {processResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span className={processResult.success ? 'text-green-700' : 'text-red-700'}>
                  {processResult.message}
                </span>
              </div>
              {processResult.created_count !== undefined && (
                <div className="mt-2 text-sm text-gray-600">
                  Registros creados: {processResult.created_count} | 
                  Errores: {processResult.error_count}
                </div>
              )}
              {processResult.errors && processResult.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-600">
                    Ver errores detallados
                  </summary>
                  <ul className="mt-2 text-sm text-red-700 space-y-1">
                    {processResult.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportManager;