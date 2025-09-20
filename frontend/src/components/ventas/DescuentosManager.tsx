import React, { useState, useEffect } from 'react';
import {
  Tag,
  Percent,
  Gift,
  DollarSign,
  Eye,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Info
} from 'lucide-react';
import { promocionService, PromocionActiva, DescuentoAplicado, Cliente, ProductoVenta } from '../../services/promoService';
import { useToast } from '../Toast';

interface DescuentosManagerProps {
  cliente: Cliente;
  productos: ProductoVenta[];
  montoSubtotal: number;
  descuentosAplicados: DescuentoAplicado[];
  onDescuentosChange: (descuentos: DescuentoAplicado[]) => void;
  onMontoFinalChange: (montoFinal: number) => void;
  permitirModificaciones?: boolean;
}

const DescuentosManager: React.FC<DescuentosManagerProps> = ({
  cliente,
  productos,
  montoSubtotal,
  descuentosAplicados,
  onDescuentosChange,
  onMontoFinalChange,
  permitirModificaciones = true
}) => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();

  const [promocionesDisponibles, setPromocionesDisponibles] = useState<Array<PromocionActiva & { es_aplicable: boolean; razon?: string }>>([]);
  const [codigoPromocional, setCodigoPromocional] = useState('');
  const [showPromocionesModal, setShowPromocionesModal] = useState(false);
  const [cargandoDescuentos, setCargandoDescuentos] = useState(false);

  useEffect(() => {
    cargarPromociones();
    aplicarDescuentosAutomaticos();
  }, [cliente, productos, montoSubtotal]);

  useEffect(() => {
    calcularMontoFinal();
  }, [descuentosAplicados, montoSubtotal]);

  const cargarPromociones = () => {
    const promociones = promocionService.getPromocionesParaVendedor(cliente, montoSubtotal);
    setPromocionesDisponibles(promociones);
  };

  const aplicarDescuentosAutomaticos = async () => {
    if (!permitirModificaciones) return;

    setCargandoDescuentos(true);
    try {
      const descuentosAutomaticos = promocionService.buscarPromocionesAutomaticas(
        cliente,
        productos,
        montoSubtotal
      );

      // Solo aplicar si no hay descuentos manuales ya aplicados
      const tieneDescuentosManuales = descuentosAplicados.some(d => d.origen === 'codigo' || d.origen === 'manual');

      if (descuentosAutomaticos.length > 0 && !tieneDescuentosManuales) {
        onDescuentosChange(descuentosAutomaticos);
        if (descuentosAutomaticos.length > 0) {
          info(`Descuento automático aplicado: ${descuentosAutomaticos[0].codigo}`);
        }
      }
    } finally {
      setCargandoDescuentos(false);
    }
  };

  const aplicarCodigoPromocional = () => {
    if (!codigoPromocional.trim()) {
      warning('Ingresa un código promocional');
      return;
    }

    const resultado = promocionService.aplicarCodigoPromocional(
      codigoPromocional,
      cliente,
      productos,
      montoSubtotal
    );

    if (resultado.success && resultado.descuento) {
      // Remover descuentos automáticos si se aplica uno manual
      const descuentosSinAutomaticos = descuentosAplicados.filter(d => d.origen !== 'automatico');

      // Verificar si ya está aplicado
      const yaAplicado = descuentosSinAutomaticos.some(d => d.codigo === resultado.descuento!.codigo);

      if (yaAplicado) {
        warning('Este código ya está aplicado');
        return;
      }

      const nuevosDescuentos = [...descuentosSinAutomaticos, resultado.descuento];
      onDescuentosChange(nuevosDescuentos);
      setCodigoPromocional('');
      success(`Código ${resultado.descuento.codigo} aplicado correctamente`);
    } else {
      showError(resultado.error || 'Error al aplicar código promocional');
    }
  };

  const aplicarPromocionManual = (promocion: PromocionActiva) => {
    const resultado = promocionService.aplicarCodigoPromocional(
      promocion.codigo,
      cliente,
      productos,
      montoSubtotal
    );

    if (resultado.success && resultado.descuento) {
      // Remover descuentos automáticos
      const descuentosSinAutomaticos = descuentosAplicados.filter(d => d.origen !== 'automatico');

      const nuevosDescuentos = [...descuentosSinAutomaticos, {
        ...resultado.descuento,
        origen: 'manual' as const
      }];

      onDescuentosChange(nuevosDescuentos);
      setShowPromocionesModal(false);
      success(`Promoción ${promocion.codigo} aplicada manualmente`);
    } else {
      showError(resultado.error || 'Error al aplicar promoción');
    }
  };

  const removerDescuento = (index: number) => {
    const descuento = descuentosAplicados[index];
    if (!descuento.puede_remover) {
      warning('Este descuento no puede ser removido');
      return;
    }

    const nuevosDescuentos = descuentosAplicados.filter((_, i) => i !== index);
    onDescuentosChange(nuevosDescuentos);
    success(`Descuento ${descuento.codigo} removido`);

    // Intentar aplicar descuentos automáticos si no quedan manuales
    setTimeout(() => {
      const tieneDescuentosManuales = nuevosDescuentos.some(d => d.origen === 'codigo' || d.origen === 'manual');
      if (!tieneDescuentosManuales) {
        aplicarDescuentosAutomaticos();
      }
    }, 100);
  };

  const calcularMontoFinal = () => {
    const totalDescuentos = descuentosAplicados.reduce((total, descuento) => {
      return total + descuento.valor_descuento;
    }, 0);

    const montoFinal = Math.max(0, montoSubtotal - totalDescuentos);
    onMontoFinalChange(montoFinal);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'porcentaje': return <Percent className="h-4 w-4" />;
      case 'monto_fijo': return <DollarSign className="h-4 w-4" />;
      case 'regalo': return <Gift className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getOrigenColor = (origen: string) => {
    switch (origen) {
      case 'automatico': return 'bg-green-100 text-green-800 border-green-200';
      case 'manual': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'codigo': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOrigenTexto = (origen: string) => {
    switch (origen) {
      case 'automatico': return 'Automático';
      case 'manual': return 'Manual';
      case 'codigo': return 'Código';
      default: return 'Desconocido';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalDescuentos = descuentosAplicados.reduce((total, d) => total + d.valor_descuento, 0);
  const montoFinal = montoSubtotal - totalDescuentos;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Tag className="h-6 w-6 text-green-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Descuentos y Promociones
          </h3>
        </div>

        {cargandoDescuentos && (
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1 animate-spin" />
            Verificando promociones...
          </div>
        )}
      </div>

      {/* Información del cliente */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{cliente.nombre}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Segmento: {cliente.segmento} •
              {cliente.es_primera_compra ? ' Primera compra' : ' Cliente recurrente'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Subtotal</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(montoSubtotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Descuentos aplicados */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900 dark:text-white">Descuentos Aplicados</h4>

        {descuentosAplicados.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No hay descuentos aplicados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {descuentosAplicados.map((descuento, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getOrigenColor(descuento.origen)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getTipoIcon(descuento.tipo)}
                    <div className="ml-3">
                      <div className="flex items-center">
                        <span className="font-medium text-sm">
                          {descuento.codigo}
                        </span>
                        <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-800">
                          {getOrigenTexto(descuento.origen)}
                        </span>
                      </div>
                      <p className="text-sm opacity-80">{descuento.descripcion}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="font-bold text-lg mr-3">
                      -{formatCurrency(descuento.valor_descuento)}
                    </span>

                    {permitirModificaciones && descuento.puede_remover && (
                      <button
                        onClick={() => removerDescuento(index)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Remover descuento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aplicar código promocional */}
      {permitirModificaciones && (
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white">Aplicar Código Promocional</h4>

          <div className="flex gap-3">
            <input
              type="text"
              value={codigoPromocional}
              onChange={(e) => setCodigoPromocional(e.target.value.toUpperCase())}
              placeholder="Ingresa código promocional"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && aplicarCodigoPromocional()}
            />
            <button
              onClick={aplicarCodigoPromocional}
              disabled={!codigoPromocional.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aplicar
            </button>
          </div>

          <button
            onClick={() => setShowPromocionesModal(true)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver promociones disponibles
          </button>
        </div>
      )}

      {/* Resumen de totales */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
            <span className="font-medium">{formatCurrency(montoSubtotal)}</span>
          </div>

          {totalDescuentos > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Total descuentos:</span>
              <span className="font-medium">-{formatCurrency(totalDescuentos)}</span>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-gray-900 dark:text-white">Total final:</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(montoFinal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de promociones disponibles */}
      {showPromocionesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Promociones Disponibles
                </h3>
                <button
                  onClick={() => setShowPromocionesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {promocionesDisponibles.length === 0 ? (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No hay promociones disponibles actualmente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {promocionesDisponibles.map((promocion) => (
                    <div
                      key={promocion.id}
                      className={`border rounded-lg p-4 ${
                        promocion.es_aplicable
                          ? 'border-green-200 bg-green-50 dark:bg-green-900 dark:border-green-700'
                          : 'border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {promocion.es_aplicable ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-gray-400 mr-3" />
                          )}

                          <div>
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {promocion.codigo}
                              </span>
                              <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {promocion.campana_nombre}
                              </span>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {promocion.tipo === 'porcentaje' && `${promocion.valor}% de descuento`}
                              {promocion.tipo === 'monto_fijo' && `$${promocion.valor.toLocaleString()} de descuento`}
                              {promocion.tipo === 'regalo' && promocion.descripcion}
                            </p>

                            {promocion.condiciones.monto_minimo && (
                              <p className="text-xs text-gray-500 mt-1">
                                Compra mínima: {formatCurrency(promocion.condiciones.monto_minimo)}
                              </p>
                            )}

                            {!promocion.es_aplicable && promocion.razon && (
                              <p className="text-xs text-red-600 mt-1">{promocion.razon}</p>
                            )}
                          </div>
                        </div>

                        {promocion.es_aplicable && permitirModificaciones && (
                          <button
                            onClick={() => aplicarPromocionManual(promocion)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Aplicar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowPromocionesModal(false)}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default DescuentosManager;