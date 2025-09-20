import React, { useState } from 'react';
import { ShoppingCart, User, DollarSign } from 'lucide-react';
import DescuentosManager from './DescuentosManager';
import { Cliente, ProductoVenta, DescuentoAplicado } from '../../services/promoService';

const VentaEjemplo: React.FC = () => {
  // Datos de ejemplo
  const clienteEjemplo: Cliente = {
    id: 1,
    nombre: 'Juan Pérez',
    email: 'juan.perez@email.com',
    telefono: '809-555-1234',
    segmento: 'VIP',
    es_primera_compra: false,
    fecha_registro: '2023-01-15'
  };

  const productosEjemplo: ProductoVenta[] = [
    {
      id: 1,
      nombre: 'Honda CB190R',
      precio: 180000,
      categoria: 'Motocicleta'
    },
    {
      id: 2,
      nombre: 'Casco Shoei',
      precio: 8500,
      categoria: 'Accesorios'
    }
  ];

  const [descuentosAplicados, setDescuentosAplicados] = useState<DescuentoAplicado[]>([]);
  const [montoFinal, setMontoFinal] = useState(0);
  const [ventaFinalizada, setVentaFinalizada] = useState(false);

  const subtotal = productosEjemplo.reduce((sum, producto) => sum + producto.precio, 0);

  const handleFinalizarVenta = () => {
    // Aquí registrarías los usos de promociones
    descuentosAplicados.forEach(descuento => {
      // promocionService.registrarUsoPromocion(descuento.promocion_id);
      console.log(`Registrando uso de promoción: ${descuento.codigo}`);
    });

    setVentaFinalizada(true);
    alert(`Venta finalizada por ${montoFinal.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sistema de Ventas con Promociones
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ejemplo de integración del sistema híbrido de descuentos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Venta */}
          <div className="space-y-6">
            {/* Información del Cliente */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
              <div className="flex items-center mb-4">
                <User className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cliente
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{clienteEjemplo.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Segmento:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{clienteEjemplo.segmento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {clienteEjemplo.es_primera_compra ? 'Primera compra' : 'Cliente recurrente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
              <div className="flex items-center mb-4">
                <ShoppingCart className="h-6 w-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Productos
                </h3>
              </div>

              <div className="space-y-3">
                {productosEjemplo.map((producto) => (
                  <div key={producto.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{producto.nombre}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{producto.categoria}</p>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(producto.precio)}
                    </span>
                  </div>
                ))}

                <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Subtotal:</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
              <div className="space-y-3">
                {!ventaFinalizada ? (
                  <>
                    <button
                      onClick={handleFinalizarVenta}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
                    >
                      <DollarSign className="h-5 w-5 inline mr-2" />
                      Finalizar Venta - {formatCurrency(montoFinal)}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Los descuentos se pueden modificar hasta finalizar la venta
                    </p>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-green-600 text-lg font-bold mb-2">
                      ¡Venta Finalizada!
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Total: {formatCurrency(montoFinal)}
                    </p>
                    <button
                      onClick={() => {
                        setVentaFinalizada(false);
                        setDescuentosAplicados([]);
                      }}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Nueva Venta
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel de Descuentos */}
          <div>
            <DescuentosManager
              cliente={clienteEjemplo}
              productos={productosEjemplo}
              montoSubtotal={subtotal}
              descuentosAplicados={descuentosAplicados}
              onDescuentosChange={setDescuentosAplicados}
              onMontoFinalChange={setMontoFinal}
              permitirModificaciones={!ventaFinalizada}
            />
          </div>
        </div>

        {/* Información del Sistema */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4">
            💡 Características del Sistema Híbrido
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Aplicación Automática:</h5>
              <ul className="space-y-1 text-blue-700 dark:text-blue-400">
                <li>• Detecta promociones aplicables al cliente</li>
                <li>• Verifica segmento, compra mínima, primera compra</li>
                <li>• Aplica el mejor descuento automáticamente</li>
                <li>• Se actualiza al cambiar productos o cliente</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Control Manual:</h5>
              <ul className="space-y-1 text-blue-700 dark:text-blue-400">
                <li>• Aplicar códigos promocionales manualmente</li>
                <li>• Ver todas las promociones disponibles</li>
                <li>• Remover descuentos si hay errores</li>
                <li>• Prevenir modificaciones después de la venta</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentaEjemplo;