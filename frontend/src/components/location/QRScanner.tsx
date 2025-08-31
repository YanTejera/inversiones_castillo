import React, { useState } from 'react';
import { X, QrCode, MapPin, Package, Upload, Search } from 'lucide-react';
import { locationService } from '../../services/locationService';

interface QRScannerProps {
  onClose: () => void;
  onLocationFound: (locationData: any) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onClose, onLocationFound }) => {
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleScanQR = async () => {
    if (!qrInput.trim()) {
      setError('Por favor ingresa el código QR');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await locationService.scanQR(qrInput.trim());
      setResult(response);
      onLocationFound(response);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar el código QR');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // En una implementación real, aquí usarías una librería como jsQR
    // para leer el QR desde la imagen
    setError('Función de subida de imagen no implementada aún');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <QrCode className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Escanear Código QR
              </h2>
              <p className="text-sm text-gray-500">
                Escanea o ingresa el código QR de una ubicación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Input manual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código QR
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Ej: UBICACION:123e4567-e89b-12d3-a456-426614174000"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleScanQR();
                  }
                }}
              />
              <button
                onClick={handleScanQR}
                disabled={loading || !qrInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Procesando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {/* Upload de imagen */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              O sube una imagen con el código QR
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="qr-upload"
            />
            <label
              htmlFor="qr-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Seleccionar imagen
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Resultado */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-green-900 mb-2">
                    Ubicación Encontrada
                  </h3>
                  
                  {result.ubicacion && (
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Código:</span>
                        <span className="ml-2 text-gray-900">{result.ubicacion.codigo}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Nombre:</span>
                        <span className="ml-2 text-gray-900">{result.ubicacion.nombre}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Dirección:</span>
                        <span className="ml-2 text-gray-900">{result.ubicacion.direccion}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Capacidad:</span>
                        <span className="ml-2 text-gray-900">
                          {result.ubicacion.ocupacion}/{result.ubicacion.capacidad}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Espacios libres:</span>
                        <span className="ml-2 text-green-600 font-medium">
                          {result.ubicacion.espacios_libres}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Inventario */}
                  {result.ubicacion?.inventario && result.ubicacion.inventario.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <h4 className="font-medium text-green-900 mb-2 flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        Inventario Actual ({result.ubicacion.inventario.length})
                      </h4>
                      <div className="space-y-2">
                        {result.ubicacion.inventario.map((item: any, index: number) => (
                          <div key={index} className="bg-white rounded p-3 border border-green-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{item.modelo}</p>
                                <p className="text-sm text-gray-600">Color: {item.color}</p>
                              </div>
                              <span className="text-sm font-medium text-green-600">
                                {item.cantidad} unidad{item.cantidad !== 1 ? 'es' : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;