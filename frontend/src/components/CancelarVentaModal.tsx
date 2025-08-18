import React, { useState } from 'react';
import { X, AlertTriangle, Save } from 'lucide-react';

interface CancelarVentaModalProps {
  venta: any;
  onClose: () => void;
  onConfirm: (motivo: string, descripcion: string) => Promise<void>;
}

const MOTIVOS_CANCELACION_VENTA = [
  { value: 'venta_erronea', label: 'Venta Errónea', description: 'Los datos de la venta son incorrectos' },
  { value: 'cliente_equivocado', label: 'Cliente Equivocado', description: 'La venta fue asignada al cliente incorrecto' },
  { value: 'cancelado_por_cliente', label: 'Cancelado por el Cliente', description: 'El cliente solicitó la cancelación de la venta' },
  { value: 'moto_no_disponible', label: 'Moto No Disponible', description: 'La motocicleta vendida no está disponible' },
  { value: 'problema_financiacion', label: 'Problema de Financiación', description: 'Problemas con el proceso de financiamiento' },
  { value: 'error_sistema', label: 'Error del Sistema', description: 'Error técnico en el registro de la venta' },
  { value: 'precio_incorrecto', label: 'Precio Incorrecto', description: 'El precio registrado es incorrecto' },
  { value: 'documentacion_incompleta', label: 'Documentación Incompleta', description: 'Falta documentación requerida' },
  { value: 'otros', label: 'Otros', description: 'Especificar razón en la descripción' }
];

const CancelarVentaModal: React.FC<CancelarVentaModalProps> = ({ venta, onClose, onConfirm }) => {
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleConfirm = async () => {
    if (!motivoSeleccionado) {
      setError('Debe seleccionar un motivo de cancelación');
      return;
    }

    if (motivoSeleccionado === 'otros' && !descripcion.trim()) {
      setError('Debe proporcionar una descripción cuando selecciona "Otros"');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onConfirm(motivoSeleccionado, descripcion);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Error al cancelar la venta');
    } finally {
      setLoading(false);
    }
  };

  const motivoDetalle = MOTIVOS_CANCELACION_VENTA.find(m => m.value === motivoSeleccionado);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Cancelar Venta
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Información de la venta */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Información de la Venta</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <div className="font-medium text-gray-700">Venta ID:</div>
                <div>#{venta.id}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Fecha:</div>
                <div>{new Date(venta.fecha_venta).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Cliente:</div>
                <div>{venta.cliente_info?.nombre} {venta.cliente_info?.apellido}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Monto Total:</div>
                <div className="font-semibold text-green-600">{formatCurrency(venta.monto_total)}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Tipo de Venta:</div>
                <div>{venta.tipo_venta === 'contado' ? 'Al Contado' : 'Financiado'}</div>
              </div>
              {venta.tipo_venta === 'financiado' && (
                <div>
                  <div className="font-medium text-gray-700">Saldo Pendiente:</div>
                  <div className="font-semibold text-red-600">{formatCurrency(venta.saldo_pendiente || 0)}</div>
                </div>
              )}
            </div>

            {/* Detalles de productos */}
            {venta.detalles && venta.detalles.length > 0 && (
              <div className="mt-4">
                <div className="font-medium text-gray-700 mb-2">Motocicletas:</div>
                <div className="space-y-1">
                  {venta.detalles.map((detalle: any, index: number) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {detalle.moto_info?.marca} {detalle.moto_info?.modelo} 
                      {detalle.cantidad > 1 && ` (${detalle.cantidad} unidades)`}
                      - {formatCurrency(detalle.precio_unitario)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Atención:</p>
                <p className="text-yellow-700 mb-2">
                  Al cancelar esta venta:
                </p>
                <ul className="text-yellow-700 text-xs space-y-1 ml-4">
                  <li>• Se devolverá automáticamente el stock de las motocicletas al inventario</li>
                  <li>• Si hay pagos registrados, estos también deberán ser cancelados por separado</li>
                  <li>• Se cancelarán todas las cuotas programadas pendientes</li>
                  <li>• Esta acción quedará registrada en el sistema para auditoría</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Motivo de cancelación */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo de Cancelación *
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {MOTIVOS_CANCELACION_VENTA.map((motivo) => (
                <label
                  key={motivo.value}
                  className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                    motivoSeleccionado === motivo.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="motivo"
                    value={motivo.value}
                    checked={motivoSeleccionado === motivo.value}
                    onChange={(e) => setMotivoSeleccionado(e.target.value)}
                    className="sr-only"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{motivo.label}</div>
                    <div className="text-sm text-gray-600">{motivo.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Descripción adicional */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción Adicional {motivoSeleccionado === 'otros' && '*'}
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={
                motivoSeleccionado === 'otros' 
                  ? 'Describa detalladamente el motivo de cancelación...'
                  : 'Información adicional opcional...'
              }
            />
          </div>

          {/* Resumen del motivo seleccionado */}
          {motivoDetalle && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-6">
              <div className="text-sm">
                <span className="font-medium text-blue-900">Motivo seleccionado: </span>
                <span className="text-blue-800">{motivoDetalle.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !motivoSeleccionado}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Cancelando...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Confirmar Cancelación
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelarVentaModal;