import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  FileText,
  CreditCard
} from 'lucide-react';
import { cuotaService } from '../services/cuotaService';
import { pagoService } from '../services/pagoService';
import type { Cliente, ClienteFinanciado, Pago, CuotaVencimiento } from '../types';

interface ClienteFinancieroProps {
  cliente: Cliente;
  onClose: () => void;
}

const ClienteFinanciero: React.FC<ClienteFinancieroProps> = ({ cliente, onClose }) => {
  const [clienteFinanciado, setClienteFinanciado] = useState<ClienteFinanciado | null>(null);
  const [cuotas, setCuotas] = useState<CuotaVencimiento[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'cuotas' | 'pagos'>('resumen');

  useEffect(() => {
    loadClienteFinanciero();
  }, [cliente.id]);

  const loadClienteFinanciero = async () => {
    try {
      setLoading(true);
      
      // Buscar si el cliente tiene financiamiento activo
      const clientesFinanciados = await cuotaService.buscarClientesFinanciados();
      const clienteFinanciadoData = clientesFinanciados.find(c => c.cliente_id === cliente.id);
      
      if (clienteFinanciadoData) {
        setClienteFinanciado(clienteFinanciadoData);
        
        // Cargar cuotas de la venta
        const cuotasResponse = await cuotaService.getCuotas(1, clienteFinanciadoData.venta_id);
        setCuotas(cuotasResponse.results);
        
        // Cargar pagos de la venta
        const pagosData = await pagoService.getPagosPorVenta(clienteFinanciadoData.venta_id);
        setPagos(pagosData);
      }
      
    } catch (error) {
      console.error('Error loading cliente financiero:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEstadoCuotaColor = (cuota: CuotaVencimiento) => {
    if (cuota.esta_vencida) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    switch (cuota.estado) {
      case 'pagada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'parcial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'vencida':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getEstadoCuotaIcon = (cuota: CuotaVencimiento) => {
    if (cuota.esta_vencida) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    switch (cuota.estado) {
      case 'pagada':
        return <CheckCircle className="h-4 w-4" />;
      case 'parcial':
        return <Clock className="h-4 w-4" />;
      case 'vencida':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Cargando información financiera...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Información Financiera - {cliente.nombre} {cliente.apellido}
            </h2>
            <p className="text-gray-600 text-sm mt-1">Cédula: {cliente.cedula}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {!clienteFinanciado ? (
          <div className="p-12 text-center">
            <CreditCard className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Financiamiento Activo</h3>
            <p className="text-gray-600">Este cliente no tiene ventas con financiamiento activo.</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="border-b">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'resumen', label: 'Resumen', icon: TrendingUp },
                  { id: 'cuotas', label: 'Cuotas', icon: Calendar },
                  { id: 'pagos', label: 'Historial de Pagos', icon: FileText }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'resumen' && (
                <div className="space-y-6">
                  {/* Cards Resumen */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">Total Financiado</p>
                          <p className="text-xl font-bold text-blue-900">{formatCurrency(clienteFinanciado.monto_con_intereses)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-600">Total Pagado</p>
                          <p className="text-xl font-bold text-green-900">{formatCurrency(clienteFinanciado.total_pagado)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-600">Saldo Pendiente</p>
                          <p className="text-xl font-bold text-red-900">{formatCurrency(clienteFinanciado.saldo_pendiente)}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`border rounded-lg p-4 ${clienteFinanciado.total_mora > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center">
                        <Clock className={`h-8 w-8 ${clienteFinanciado.total_mora > 0 ? 'text-red-600' : 'text-gray-600'}`} />
                        <div className="ml-3">
                          <p className={`text-sm font-medium ${clienteFinanciado.total_mora > 0 ? 'text-red-600' : 'text-gray-600'}`}>Mora Acumulada</p>
                          <p className={`text-xl font-bold ${clienteFinanciado.total_mora > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                            {formatCurrency(clienteFinanciado.total_mora)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información Detallada */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Detalles del Financiamiento</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Venta:</span>
                          <span className="font-medium">#{clienteFinanciado.venta_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fecha:</span>
                          <span className="font-medium">{formatDate(clienteFinanciado.fecha_venta)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monto Inicial:</span>
                          <span className="font-medium">{formatCurrency(clienteFinanciado.monto_total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tasa de Interés:</span>
                          <span className="font-medium">{clienteFinanciado.tasa_interes}% mensual</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pago Mensual:</span>
                          <span className="font-medium">{formatCurrency(clienteFinanciado.pago_mensual)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Estado de Cuotas</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total de Cuotas:</span>
                          <span className="font-medium">{clienteFinanciado.cuotas_totales}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cuotas Pagadas:</span>
                          <span className="font-medium text-green-600">{clienteFinanciado.cuotas_pagadas}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cuotas Restantes:</span>
                          <span className="font-medium text-blue-600">{clienteFinanciado.cuotas_restantes}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(clienteFinanciado.cuotas_pagadas / clienteFinanciado.cuotas_totales) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {Math.round((clienteFinanciado.cuotas_pagadas / clienteFinanciado.cuotas_totales) * 100)}% completado
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Próxima Cuota */}
                  {clienteFinanciado.proxima_cuota && (
                    <div className={`border rounded-lg p-6 ${clienteFinanciado.proxima_cuota.dias_vencido > 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Próxima Cuota</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-gray-600 text-sm">Número:</span>
                          <div className="font-medium">#{clienteFinanciado.proxima_cuota.numero}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 text-sm">Vencimiento:</span>
                          <div className="font-medium">{formatDate(clienteFinanciado.proxima_cuota.fecha_vencimiento)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 text-sm">Monto:</span>
                          <div className="font-medium">{formatCurrency(clienteFinanciado.proxima_cuota.monto)}</div>
                        </div>
                        <div>
                          {clienteFinanciado.proxima_cuota.dias_vencido > 0 ? (
                            <>
                              <span className="text-red-600 text-sm">Días Vencida:</span>
                              <div className="font-medium text-red-600">{clienteFinanciado.proxima_cuota.dias_vencido} días</div>
                            </>
                          ) : (
                            <>
                              <span className="text-green-600 text-sm">Estado:</span>
                              <div className="font-medium text-green-600">Al día</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'cuotas' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Cronograma de Cuotas</h3>
                  
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cuota
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vencimiento
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Monto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pagado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Saldo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cuotas.map((cuota) => (
                          <tr key={cuota.id} className={cuota.esta_vencida ? 'bg-red-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{cuota.numero_cuota}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(cuota.fecha_vencimiento)}
                              {cuota.dias_vencido > 0 && (
                                <div className="text-xs text-red-600">
                                  Vencida {cuota.dias_vencido} días
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(cuota.monto_cuota)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                              {formatCurrency(cuota.monto_pagado)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                              {formatCurrency(cuota.saldo_pendiente)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoCuotaColor(cuota)}`}>
                                {getEstadoCuotaIcon(cuota)}
                                <span className="ml-1">{cuota.estado_display}</span>
                              </span>
                              {cuota.monto_mora > 0 && (
                                <div className="text-xs text-red-600 mt-1">
                                  Mora: {formatCurrency(cuota.monto_mora)}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'pagos' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Historial de Pagos</h3>
                  
                  {pagos.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Sin pagos registrados</h3>
                      <p className="mt-1 text-sm text-gray-500">No se han registrado pagos para este financiamiento.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Monto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Observaciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pagos.map((pago) => (
                            <tr key={pago.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(pago.fecha_pago)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                {formatCurrency(pago.monto_pagado)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pago.tipo_pago_display}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {pago.observaciones || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClienteFinanciero;