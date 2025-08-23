import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  User, 
  Bell, 
  Search, 
  Filter,
  RefreshCw,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Eye,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Target
} from 'lucide-react';
import { cuotaService } from '../services/cuotaService';
import { pagoService } from '../services/pagoService';
import { useToast } from './Toast';
import type { ResumenCobros, ClienteFinanciado, CuotaVencimiento, AlertaPago } from '../types';

const CobrosPendientes: React.FC = () => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();
  const [resumenCobros, setResumenCobros] = useState<ResumenCobros | null>(null);
  const [clientesFinanciados, setClientesFinanciados] = useState<ClienteFinanciado[]>([]);
  const [cuotasVencidas, setCuotasVencidas] = useState<CuotaVencimiento[]>([]);
  const [alertasActivas, setAlertasActivas] = useState<AlertaPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'clientes' | 'cuotas' | 'alertas'>('dashboard');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar resumen de cobros
      const resumen = await cuotaService.getResumenCobros();
      setResumenCobros(resumen);

      // Cargar clientes con saldos pendientes
      const clientes = await cuotaService.buscarClientesFinanciados(searchTerm);
      setClientesFinanciados(clientes);

      // Cargar cuotas vencidas
      const cuotasResponse = await cuotaService.getCuotas(1, undefined, undefined, true);
      setCuotasVencidas(cuotasResponse.results);

      // Cargar alertas activas
      const alertasResponse = await cuotaService.getAlertas(1, undefined, undefined, true);
      setAlertasActivas(alertasResponse.results);

    } catch (error: any) {
      console.error('Error loading cobros data:', error);
      const errorMsg = 'Error al cargar los datos de cobros';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm]);

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

  const getDiasVencidoColor = (dias: number) => {
    if (dias === 0) return 'text-green-600';
    if (dias <= 7) return 'text-yellow-600';
    if (dias <= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getEstadoPagoColor = (estado: string) => {
    switch (estado) {
      case 'al_dia': return 'bg-green-100 text-green-800';
      case 'proximo': return 'bg-yellow-100 text-yellow-800';
      case 'atrasado': return 'bg-red-100 text-red-800';
      case 'sin_deudas': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerarAlertas = async () => {
    try {
      setError('');
      await cuotaService.generarAlertasAutomaticas();
      await loadData();
      success('Alertas generadas exitosamente');
    } catch (error: any) {
      console.error('Error generando alertas:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error al generar alertas automáticas';
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  const handleMarcarAlertaLeida = async (alertaId: number) => {
    try {
      await cuotaService.marcarAlertaLeida(alertaId);
      await loadData();
    } catch (error) {
      console.error('Error marcando alerta como leída:', error);
    }
  };

  const handleMarcarAlertaResuelta = async (alertaId: number) => {
    try {
      await cuotaService.marcarAlertaResuelta(alertaId);
      await loadData();
    } catch (error) {
      console.error('Error marcando alerta como resuelta:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 page-fade-in">
        {/* Header skeleton */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Nav tabs skeleton */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded-t animate-pulse"></div>
            ))}
          </nav>
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 staggered-fade-in">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border shimmer">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gray-200 rounded animate-pulse mr-4"></div>
                <div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Cobros Pendientes</h1>
          <p className="text-gray-600">Seguimiento de saldos y notificaciones de vencimientos</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleGenerarAlertas}
            className="bg-orange-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-orange-700 btn-press micro-glow"
          >
            <Bell className="h-5 w-5" />
            <span>Generar Alertas</span>
          </button>
          <button
            onClick={loadData}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-gray-200 btn-press micro-scale"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>


      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { key: 'clientes', label: 'Clientes con Saldo', icon: User },
            { key: 'cuotas', label: 'Cuotas Vencidas', icon: Clock },
            { key: 'alertas', label: 'Alertas Activas', icon: Bell }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setCurrentView(key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                currentView === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard View */}
      {currentView === 'dashboard' && resumenCobros && (
        <div className="space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-red-600 text-sm font-medium">Cuotas Vencidas</p>
                  <p className="text-2xl font-bold text-red-800">{resumenCobros.cuotas_vencidas}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Próximas a Vencer</p>
                  <p className="text-2xl font-bold text-yellow-800">{resumenCobros.cuotas_proximas_vencer}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-orange-600 text-sm font-medium">Monto Vencido</p>
                  <p className="text-lg font-bold text-orange-800">{formatCurrency(resumenCobros.total_monto_vencido)}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-blue-600 text-sm font-medium">Alertas Activas</p>
                  <p className="text-2xl font-bold text-blue-800">{resumenCobros.alertas_activas}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-purple-600 text-sm font-medium">Ventas de Riesgo</p>
                  <p className="text-2xl font-bold text-purple-800">{resumenCobros.ventas_alto_riesgo}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos y resúmenes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 staggered-fade-in">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Cobros por Estado</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Cuotas Vencidas</span>
                  </div>
                  <span className="text-sm font-medium">{resumenCobros.cuotas_vencidas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Próximas a Vencer</span>
                  </div>
                  <span className="text-sm font-medium">{resumenCobros.cuotas_proximas_vencer}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Ventas de Alto Riesgo</span>
                  </div>
                  <span className="text-sm font-medium">{resumenCobros.ventas_alto_riesgo}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Estado del Sistema</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total de Clientes con Saldo</span>
                  <span className="text-sm font-medium">{clientesFinanciados.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Alertas Activas</span>
                  <span className="text-sm font-medium">{alertasActivas.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Monto Total Pendiente</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(clientesFinanciados.reduce((sum, cliente) => sum + cliente.saldo_pendiente, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clientes View */}
      {currentView === 'clientes' && (
        <div className="space-y-4">
          {/* Búsqueda */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre, cédula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Lista de clientes */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Venta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo Pendiente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Próxima Cuota
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
                  {clientesFinanciados.map((cliente) => (
                    <tr key={`${cliente.cliente_id}-${cliente.venta_id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{cliente.nombre_completo}</div>
                          <div className="text-sm text-gray-500">{cliente.cedula}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">Venta #{cliente.venta_id}</div>
                          <div className="text-sm text-gray-500">{formatDate(cliente.fecha_venta)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-orange-600">
                          {formatCurrency(cliente.saldo_pendiente)}
                        </div>
                        <div className="text-xs text-gray-500">
                          de {formatCurrency(cliente.monto_con_intereses)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cliente.proxima_cuota && (
                          <div>
                            <div className="text-sm text-gray-900">
                              {formatCurrency(cliente.proxima_cuota.monto)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(cliente.proxima_cuota.fecha_vencimiento)}
                            </div>
                            {cliente.proxima_cuota.dias_vencido > 0 && (
                              <div className={`text-xs ${getDiasVencidoColor(cliente.proxima_cuota.dias_vencido)}`}>
                                {cliente.proxima_cuota.dias_vencido} días vencido
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          cliente.proxima_cuota?.dias_vencido > 0 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {cliente.proxima_cuota?.dias_vencido > 0 ? 'Atrasado' : 'Al día'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => window.open(`/clientes/${cliente.cliente_id}`, '_blank')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver cliente"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => window.open(`/ventas/${cliente.venta_id}`, '_blank')}
                            className="text-green-600 hover:text-green-900"
                            title="Ver venta"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Cuotas Vencidas View */}
      {currentView === 'cuotas' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cuota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente / Venta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Días Vencido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cuotasVencidas.map((cuota) => (
                  <tr key={cuota.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Cuota #{cuota.numero_cuota}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {cuota.venta_info?.cliente_info?.nombre} {cuota.venta_info?.cliente_info?.apellido}
                        </div>
                        <div className="text-sm text-gray-500">Venta #{cuota.venta}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">
                        {formatCurrency(cuota.monto_cuota - cuota.monto_pagado)}
                      </div>
                      <div className="text-xs text-gray-500">
                        de {formatCurrency(cuota.monto_cuota)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {formatDate(cuota.fecha_vencimiento)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getDiasVencidoColor(cuota.dias_vencido || 0)}`}>
                        {cuota.dias_vencido || 0} días
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        cuota.estado === 'vencida' ? 'bg-red-100 text-red-800' :
                        cuota.estado === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {cuota.estado === 'vencida' ? 'Vencida' :
                         cuota.estado === 'parcial' ? 'Parcial' : 
                         cuota.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alertas View */}
      {currentView === 'alertas' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mensaje
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
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
                {alertasActivas.map((alerta) => (
                  <tr key={alerta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        alerta.tipo_alerta === 'vencida' ? 'bg-red-100 text-red-800' :
                        alerta.tipo_alerta === 'proximo_vencer' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {alerta.tipo_alerta === 'vencida' ? 'Vencida' :
                         alerta.tipo_alerta === 'proximo_vencer' ? 'Próxima' :
                         'Múltiples'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{alerta.mensaje}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(alerta.fecha_creacion)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        alerta.estado === 'activa' ? 'bg-blue-100 text-blue-800' :
                        alerta.estado === 'leida' ? 'bg-gray-100 text-gray-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {alerta.estado === 'activa' ? 'Activa' :
                         alerta.estado === 'leida' ? 'Leída' :
                         'Resuelta'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {alerta.estado === 'activa' && (
                          <>
                            <button
                              onClick={() => handleMarcarAlertaLeida(alerta.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Marcar como leída"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleMarcarAlertaResuelta(alerta.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Marcar como resuelta"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default CobrosPendientes;