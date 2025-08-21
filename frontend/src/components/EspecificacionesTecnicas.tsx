import React from 'react';
import {
  X,
  Bike,
  Zap,
  Gauge,
  Settings,
  Fuel,
  Weight,
  Wrench,
  Activity,
  Info,
  Calendar,
  Shield,
  Users
} from 'lucide-react';
import type { MotoModelo } from '../types';

interface EspecificacionesTecnicasProps {
  modelo: MotoModelo;
  onClose: () => void;
}

const EspecificacionesTecnicas: React.FC<EspecificacionesTecnicasProps> = ({
  modelo,
  onClose
}) => {
  const formatCurrency = (amount: number, currency: string = 'COP') => {
    const symbol = currency === 'USD' ? '$' : currency === 'RD' ? 'RD$' : '$';
    return `${symbol} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center text-white">
            <Bike className="h-6 w-6 mr-3" />
            <div>
              <h2 className="text-xl font-bold">Especificaciones Técnicas</h2>
              <p className="text-blue-100 text-sm">{modelo.marca} {modelo.modelo} {modelo.ano}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Información General */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Especificaciones del Motor */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-orange-500" />
                  Motor y Rendimiento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tipo de Motor</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.tipo_motor || 'Motor de 4 tiempos, monocilíndrico'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Cilindrada</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.cilindrada || '125'} cc
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Potencia Máxima</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.potencia || '8.5'} HP @ 7,500 rpm
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Sistema de Refrigeración</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.refrigeracion || 'Por aire'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Sistema de Arranque</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.arranque || 'Eléctrico y kick'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Transmisión</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.transmision || '5 velocidades'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dimensiones y Peso */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Weight className="h-5 w-5 mr-2 text-purple-500" />
                  Dimensiones y Peso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Largo x Ancho x Alto</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.dimensiones || '1,950 x 720 x 1,040'} mm
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Distancia entre Ejes</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.distancia_ejes || '1,285'} mm
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Altura del Asiento</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.altura_asiento || '785'} mm
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Peso en Seco</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.peso_seco || '115'} kg
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Capacidad de Combustible</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.tanque_combustible || '13'} litros
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Capacidad de Carga</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.capacidad_carga || '150'} kg
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sistema de Frenos y Suspensión */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-green-500" />
                  Frenos y Suspensión
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Freno Delantero</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.freno_delantero || 'Disco hidráulico de 220mm'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Freno Trasero</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.freno_trasero || 'Tambor de 130mm'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Llanta Delantera</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.llanta_delantera || '2.75-18'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Llanta Trasera</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.llanta_trasera || '3.00-18'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Suspensión Delantera</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.suspension_delantera || 'Telescópica'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Suspensión Trasera</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.suspension_trasera || 'Doble amortiguador'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consumo y Rendimiento */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Fuel className="h-5 w-5 mr-2 text-blue-500" />
                  Consumo y Rendimiento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Consumo de Combustible</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.consumo || '50'} km/litro (aprox.)
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Velocidad Máxima</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.velocidad_maxima || '95'} km/h
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Autonomía</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.autonomia || '650'} km (aprox.)
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Emisiones</label>
                      <p className="text-gray-900 font-medium">
                        {modelo.especificaciones?.emisiones || 'Euro 3'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Lateral */}
            <div className="space-y-6">
              
              {/* Imagen del Modelo */}
              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="aspect-square bg-gray-200">
                  {modelo.imagen ? (
                    <img
                      src={modelo.imagen}
                      alt={`${modelo.marca} ${modelo.modelo}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bike className="h-20 w-20 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Información General */}
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Información General
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Marca:</span>
                    <span className="font-medium">{modelo.marca}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Modelo:</span>
                    <span className="font-medium">{modelo.modelo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Año:</span>
                    <span className="font-medium">{modelo.ano}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Condición:</span>
                    <span className={`font-medium ${
                      modelo.condicion === 'nueva' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {modelo.condicion === 'nueva' ? 'Nueva' : 'Usada'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock Total:</span>
                    <span className="font-medium">{modelo.total_stock} unidades</span>
                  </div>
                </div>
              </div>

              {/* Precios */}
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Gauge className="h-4 w-4 mr-2" />
                  Información de Precios
                </h4>
                <div className="space-y-3">
                  <div className="bg-orange-50 p-3 rounded">
                    <label className="text-xs font-medium text-orange-600">PRECIO DE COMPRA</label>
                    <p className="text-lg font-bold text-orange-700">
                      {formatCurrency(modelo.precio_compra, modelo.moneda_compra)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <label className="text-xs font-medium text-green-600">PRECIO DE VENTA</label>
                    <p className="text-lg font-bold text-green-700">
                      {formatCurrency(modelo.precio_venta, modelo.moneda_venta)}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <label className="text-xs font-medium text-blue-600">GANANCIA</label>
                    <p className="text-lg font-bold text-blue-700">
                      {formatCurrency(modelo.ganancia)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Equipamiento */}
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Wrench className="h-4 w-4 mr-2" />
                  Equipamiento
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Shield className="h-3 w-3 mr-2 text-green-500" />
                    <span>Sistema de frenos ABS (opcional)</span>
                  </div>
                  <div className="flex items-center">
                    <Activity className="h-3 w-3 mr-2 text-blue-500" />
                    <span>Tablero digital</span>
                  </div>
                  <div className="flex items-center">
                    <Zap className="h-3 w-3 mr-2 text-yellow-500" />
                    <span>Luces LED</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-3 w-3 mr-2 text-purple-500" />
                    <span>Asiento para 2 personas</span>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Información de Registro
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Fecha de Creación:</span>
                    <p className="font-medium">{formatDate(modelo.fecha_creacion)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Última Actualización:</span>
                    <p className="font-medium">{formatDate(modelo.fecha_actualizacion)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EspecificacionesTecnicas;