import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  ShoppingCart,
  CreditCard,
  Loader,
  AlertCircle
} from 'lucide-react';
import { reporteService } from '../services/reporteService';

const Reportes: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickStats, setQuickStats] = useState<any>(null);

  const reportTypes = [
    {
      id: 'ventas-periodo',
      title: 'Reportes de Ventas por Período',
      description: 'Análisis de ventas diarias, semanales, mensuales y anuales',
      icon: <TrendingUp className="h-8 w-8" />,
      color: 'bg-blue-500',
      features: ['Ventas por día/semana/mes', 'Comparativas de períodos', 'Top productos vendidos', 'Rendimiento por vendedor']
    },
    {
      id: 'inventario',
      title: 'Reportes de Inventario',
      description: 'Estado actual del inventario y valoración',
      icon: <Package className="h-8 w-8" />,
      color: 'bg-green-500',
      features: ['Stock actual por producto', 'Valoración del inventario', 'Productos con stock crítico', 'Rotación de inventario']
    },
    {
      id: 'cobranza',
      title: 'Reportes de Cobranza',
      description: 'Seguimiento de pagos y cuentas por cobrar',
      icon: <CreditCard className="h-8 w-8" />,
      color: 'bg-orange-500',
      features: ['Cuentas por cobrar', 'Pagos vencidos', 'Historial de pagos', 'Análisis de morosidad']
    },
    {
      id: 'financieros',
      title: 'Estados Financieros',
      description: 'Reportes financieros y análisis de rentabilidad',
      icon: <DollarSign className="h-8 w-8" />,
      color: 'bg-purple-500',
      features: ['Estado de resultados', 'Flujo de caja', 'Análisis de rentabilidad', 'Resumen financiero']
    }
  ];

  // Cargar estadísticas rápidas al montar el componente
  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      // Cargar datos básicos para el dashboard
      const [ventasData, inventarioData, cobranzaData, financieroData] = await Promise.all([
        reporteService.getReporteVentas({ periodo: 'mensual' }),
        reporteService.getReporteInventario(),
        reporteService.getReporteCobranza(),
        reporteService.getReporteFinanciero()
      ]);

      setQuickStats({
        ventasMes: ventasData.estadisticas_generales?.total_ingresos || 0,
        valorInventario: inventarioData.valoracion_total?.valor_total_compra || 0,
        cuentasPorCobrar: cobranzaData.analisis_morosidad?.total_por_cobrar || 0,
        gananciaMensual: financieroData.pagos_estadisticas?.total_recaudado || 0
      });
    } catch (error) {
      console.error('Error loading quick stats:', error);
    }
  };

  const handleGenerateReport = async (reportId: string) => {
    setSelectedReport(reportId);
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      let data;
      const params = {
        fecha_inicio: dateRange.startDate || undefined,
        fecha_fin: dateRange.endDate || undefined
      };

      switch (reportId) {
        case 'ventas-periodo':
          data = await reporteService.getReporteVentas({ ...params, periodo: 'mensual' });
          break;
        case 'inventario':
          data = await reporteService.getReporteInventario();
          break;
        case 'cobranza':
          data = await reporteService.getReporteCobranza(params);
          break;
        case 'financieros':
          data = await reporteService.getReporteFinanciero(params);
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }

      setReportData(data);
    } catch (error: any) {
      setError(error.message || 'Error al generar el reporte');
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (reportId: string) => {
    try {
      const params = {
        fecha_inicio: dateRange.startDate || undefined,
        fecha_fin: dateRange.endDate || undefined
      };

      // Agregar parámetros específicos según el tipo de reporte
      let exportParams = { ...params };
      
      if (reportId === 'ventas-periodo') {
        exportParams = { ...exportParams, periodo: 'mensual' };
      }

      await reporteService.exportToPDF(reportId, exportParams);
    } catch (error: any) {
      setError(error.message || 'Error al exportar el PDF');
      console.error('Error exporting PDF:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CO');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Reportes</h1>
            <p className="mt-1 text-sm text-gray-500">
              Genera reportes detallados de ventas, inventario, cobranza y estados financieros
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Fecha inicio"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Fecha fin"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <div key={report.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`${report.color} text-white p-3 rounded-lg mr-4`}>
                    {report.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Incluye:</h4>
                <ul className="space-y-1">
                  {report.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleGenerateReport(report.id)}
                  className={`flex-1 ${report.color} text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center text-sm font-medium`}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Reporte
                </button>
                <button
                  onClick={() => handleExportPDF(report.id)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center text-sm"
                  title="Exportar PDF"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Report Content */}
      {selectedReport && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {reportTypes.find(r => r.id === selectedReport)?.title}
              </h3>
              <div className="flex items-center space-x-3">
                {dateRange.startDate && dateRange.endDate && (
                  <span className="text-sm text-gray-500">
                    {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
                  </span>
                )}
                <button 
                  onClick={() => handleExportPDF(selectedReport)}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading && (
              <div className="text-center py-12">
                <Loader className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-500">Generando reporte...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Error al generar reporte</h4>
                <p className="text-red-500">{error}</p>
              </div>
            )}

            {!loading && !error && reportData && selectedReport === 'ventas-periodo' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900">Total Ventas</h5>
                    <p className="text-2xl font-bold text-blue-600">{reportData.estadisticas_generales?.total_ventas || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium text-green-900">Ingresos Totales</h5>
                    <p className="text-2xl font-bold text-green-600">{reporteService.formatCurrency(reportData.estadisticas_generales?.total_ingresos || 0)}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h5 className="font-medium text-purple-900">Promedio por Venta</h5>
                    <p className="text-2xl font-bold text-purple-600">{reporteService.formatCurrency(reportData.estadisticas_generales?.promedio_venta || 0)}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h5 className="font-medium text-orange-900">Total Vendedores</h5>
                    <p className="text-2xl font-bold text-orange-600">{reportData.rendimiento_vendedores?.length || 0}</p>
                  </div>
                </div>

                {reportData.top_productos && reportData.top_productos.length > 0 && (
                  <div>
                    <h5 className="font-semibold mb-3">Top Productos Vendidos</h5>
                    <div className="space-y-2">
                      {reportData.top_productos.slice(0, 5).map((producto: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">{producto.moto__marca} {producto.moto__modelo}</span>
                          <div className="text-right">
                            <div className="font-semibold">{producto.total_vendidos} unidades</div>
                            <div className="text-sm text-gray-600">{reporteService.formatCurrency(producto.total_ingresos)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && !error && reportData && selectedReport === 'inventario' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900">Total Unidades</h5>
                    <p className="text-2xl font-bold text-blue-600">{reportData.valoracion_total?.total_unidades || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium text-green-900">Valor Inventario</h5>
                    <p className="text-2xl font-bold text-green-600">{reporteService.formatCurrency(reportData.valoracion_total?.valor_total_compra || 0)}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h5 className="font-medium text-purple-900">Valor Venta Potencial</h5>
                    <p className="text-2xl font-bold text-purple-600">{reporteService.formatCurrency(reportData.valoracion_total?.valor_total_venta || 0)}</p>
                  </div>
                </div>

                {reportData.stock_critico && reportData.stock_critico.length > 0 && (
                  <div>
                    <h5 className="font-semibold mb-3 text-red-600">⚠️ Stock Crítico</h5>
                    <div className="space-y-2">
                      {reportData.stock_critico.map((producto: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded border border-red-200">
                          <span className="font-medium">{producto.modelo__marca} {producto.modelo__modelo} - {producto.color}</span>
                          <span className="text-red-600 font-semibold">{producto.cantidad_stock} unidades</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && !error && reportData && selectedReport === 'cobranza' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900">Total Cuentas</h5>
                    <p className="text-2xl font-bold text-blue-600">{reportData.analisis_morosidad?.total_cuentas || 0}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h5 className="font-medium text-orange-900">Total por Cobrar</h5>
                    <p className="text-2xl font-bold text-orange-600">{reporteService.formatCurrency(reportData.analisis_morosidad?.total_por_cobrar || 0)}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h5 className="font-medium text-red-900">Cuentas Críticas</h5>
                    <p className="text-2xl font-bold text-red-600">{reportData.analisis_morosidad?.cuentas_criticas?.cantidad || 0}</p>
                  </div>
                </div>

                {reportData.cuentas_por_cobrar && reportData.cuentas_por_cobrar.length > 0 && (
                  <div>
                    <h5 className="font-semibold mb-3">Cuentas por Cobrar</h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Cliente</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Fecha Venta</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Saldo</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.cuentas_por_cobrar.slice(0, 10).map((cuenta: any, index: number) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-2 text-sm">{cuenta.cliente_nombre}</td>
                              <td className="px-4 py-2 text-sm">{formatDate(cuenta.fecha_venta)}</td>
                              <td className="px-4 py-2 text-sm font-medium">{reporteService.formatCurrency(cuenta.saldo_pendiente)}</td>
                              <td className="px-4 py-2 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  cuenta.estado_morosidad === 'Al día' ? 'bg-green-100 text-green-800' :
                                  cuenta.estado_morosidad === 'Moroso' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {cuenta.estado_morosidad}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && !error && reportData && selectedReport === 'financieros' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 p-6 rounded-lg">
                    <h5 className="font-semibold mb-4 text-gray-900">Resumen de Ventas</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Ventas Brutas:</span>
                        <span className="font-semibold">{reporteService.formatCurrency(reportData.ventas_estadisticas?.total_ingresos || 0)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Total Ventas:</span>
                        <span className="font-semibold text-green-600">{reportData.ventas_estadisticas?.total_ventas || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 p-6 rounded-lg">
                    <h5 className="font-semibold mb-4 text-gray-900">Resumen Financiero</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Efectivo Recaudado:</span>
                        <span className="font-semibold">{reporteService.formatCurrency(reportData.resumen_financiero?.activos?.efectivo_recaudado || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cuentas por Cobrar:</span>
                        <span className="font-semibold">{reporteService.formatCurrency(reportData.resumen_financiero?.activos?.cuentas_por_cobrar || 0)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Total Activos:</span>
                        <span className="font-semibold text-blue-600">{reporteService.formatCurrency(reportData.resumen_financiero?.activos?.total_activos || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {reportData.pagos_por_metodo && reportData.pagos_por_metodo.length > 0 && (
                  <div>
                    <h5 className="font-semibold mb-3">Ingresos por Método de Pago</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {reportData.pagos_por_metodo.map((metodo: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="font-medium capitalize">{metodo.tipo_pago}</div>
                          <div className="text-xl font-bold text-green-600">{reporteService.formatCurrency(metodo.total)}</div>
                          <div className="text-sm text-gray-600">{metodo.cantidad} transacciones</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && !error && !reportData && selectedReport && (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">No hay datos disponibles</h4>
                <p className="text-gray-500">No se encontraron datos para el período seleccionado</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {!selectedReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ventas Este Mes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {quickStats ? reporteService.formatCurrency(quickStats.ventasMes) : '--'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Valor Inventario</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {quickStats ? reporteService.formatCurrency(quickStats.valorInventario) : '--'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cuentas por Cobrar</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {quickStats ? reporteService.formatCurrency(quickStats.cuentasPorCobrar) : '--'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ganancia Mensual</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {quickStats ? reporteService.formatCurrency(quickStats.gananciaMensual) : '--'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes;