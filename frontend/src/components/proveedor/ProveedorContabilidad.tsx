import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  FileText,
  DollarSign,
  AlertTriangle,
  Calendar,
  Plus,
  Eye,
  Download,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import api from '../../services/api';

interface Proveedor {
  id: number;
  nombre_completo: string;
  limite_credito?: number;
}

interface FacturaProveedor {
  id: number;
  numero_factura: string;
  proveedor_nombre: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  total: number;
  moneda: string;
  estado: 'pendiente' | 'pagada' | 'vencida' | 'anulada';
  dias_vencimiento: number;
  esta_vencida: boolean;
  monto_pendiente: number;
}

interface PagoProveedor {
  id: number;
  numero_pago: string;
  proveedor_nombre: string;
  fecha_pago: string;
  monto: number;
  moneda: string;
  metodo_pago: string;
  factura_numero?: string;
}

interface EstadisticasFinancieras {
  proveedor: string;
  limite_credito: number;
  credito_disponible: number;
  total_deuda: number;
  total_vencido: number;
  facturas_pendientes_count: number;
  facturas_vencidas_count: number;
  total_pagado_30_dias: number;
  ordenes_pendientes_count: number;
}

interface ProveedorContabilidadProps {
  proveedorId: number;
}

const ProveedorContabilidad: React.FC<ProveedorContabilidadProps> = ({ proveedorId }) => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasFinancieras | null>(null);
  const [facturas, setFacturas] = useState<FacturaProveedor[]>([]);
  const [pagos, setPagos] = useState<PagoProveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'facturas' | 'pagos'>('resumen');

  useEffect(() => {
    loadData();
  }, [proveedorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas financieras
      const statsResponse = await api.get(`/motos/proveedores/${proveedorId}/estadisticas-financieras/`);
      setEstadisticas(statsResponse.data);

      // Cargar facturas
      const facturasResponse = await api.get('/motos/facturas/', {
        params: { proveedor: proveedorId }
      });
      setFacturas(facturasResponse.data.results || facturasResponse.data);

      // Cargar pagos
      const pagosResponse = await api.get('/motos/pagos/', {
        params: { proveedor: proveedorId }
      });
      setPagos(pagosResponse.data.results || pagosResponse.data);

    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number, currency: string = 'USD') => {
    const symbol = currency === 'USD' ? '$' : currency === 'RD' ? 'RD$' : currency;
    return `${symbol}${amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pagada': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'vencida': return 'bg-red-100 text-red-800';
      case 'anulada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const descargarFacturaPDF = async (facturaId: number) => {
    try {
      const response = await api.get(`/motos/facturas/${facturaId}/pdf/`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura_${facturaId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'resumen', label: 'Resumen Financiero', icon: TrendingUp },
            { key: 'facturas', label: 'Facturas', icon: FileText },
            { key: 'pagos', label: 'Pagos', icon: DollarSign }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Resumen Financiero */}
      {activeTab === 'resumen' && estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Límite de Crédito */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <CreditCard className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Límite de Crédito</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatMoney(estadisticas.limite_credito)}
                </p>
              </div>
            </div>
          </div>

          {/* Crédito Disponible */}
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Crédito Disponible</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatMoney(estadisticas.credito_disponible)}
                </p>
              </div>
            </div>
          </div>

          {/* Deuda Total */}
          <div className="bg-yellow-50 p-6 rounded-lg">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">Deuda Pendiente</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {formatMoney(estadisticas.total_deuda)}
                </p>
              </div>
            </div>
          </div>

          {/* Deuda Vencida */}
          <div className="bg-red-50 p-6 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Deuda Vencida</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatMoney(estadisticas.total_vencido)}
                </p>
              </div>
            </div>
          </div>

          {/* Facturas Pendientes */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Facturas Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {estadisticas.facturas_pendientes_count}
                </p>
              </div>
            </div>
          </div>

          {/* Facturas Vencidas */}
          <div className="bg-red-50 p-6 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Facturas Vencidas</p>
                <p className="text-2xl font-bold text-red-900">
                  {estadisticas.facturas_vencidas_count}
                </p>
              </div>
            </div>
          </div>

          {/* Pagos Últimos 30 Días */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Pagos (30 días)</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatMoney(estadisticas.total_pagado_30_dias)}
                </p>
              </div>
            </div>
          </div>

          {/* Órdenes Pendientes */}
          <div className="bg-orange-50 p-6 rounded-lg">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Órdenes Pendientes</p>
                <p className="text-2xl font-bold text-orange-900">
                  {estadisticas.ordenes_pendientes_count}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Facturas */}
      {activeTab === 'facturas' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Facturas</h3>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Factura
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Emisión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {facturas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {factura.numero_factura}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(factura.fecha_emision).toLocaleDateString('es-DO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(factura.fecha_vencimiento).toLocaleDateString('es-DO')}
                      {factura.esta_vencida && (
                        <span className="ml-2 text-red-600 text-xs">
                          (Vencida)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatMoney(factura.total, factura.moneda)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(factura.estado)}`}>
                        {factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => descargarFacturaPDF(factura.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Descargar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lista de Pagos */}
      {activeTab === 'pagos' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Pagos Realizados</h3>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Pago
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pago.numero_pago}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(pago.fecha_pago).toLocaleDateString('es-DO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatMoney(pago.monto, pago.moneda)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pago.metodo_pago}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pago.factura_numero || 'Pago general'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProveedorContabilidad;