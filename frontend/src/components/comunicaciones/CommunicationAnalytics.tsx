import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Mail,
  Phone,
  MessageSquare,
  Users,
  DollarSign,
  Eye,
  MousePointer,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Target,
  Award,
  Activity
} from 'lucide-react';
import { communicationAnalytics } from '../../services/communicationAnalytics';
import type { DashboardMetrics, ChannelMetrics, AnalyticsFilters } from '../../services/communicationAnalytics';
import { useToast } from '../Toast';

const CommunicationAnalytics: React.FC = () => {
  const { success, error: showError, info, ToastContainer } = useToast();

  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['WhatsApp', 'Email', 'SMS', 'Telegram']);
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [selectedView, setSelectedView] = useState<'overview' | 'channels' | 'campaigns' | 'clients'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeframe, selectedChannels]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const filters = buildFilters();
      const data = communicationAnalytics.getDashboardMetrics(filters);
      setDashboardData(data);
    } catch (error) {
      showError('Error al cargar analytics');
    } finally {
      setLoading(false);
    }
  };

  const buildFilters = (): AnalyticsFilters => {
    const now = new Date();
    let fechaInicio: Date;

    switch (selectedTimeframe) {
      case '7d':
        fechaInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        fechaInicio = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        fechaInicio = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        fechaInicio = customDateStart ? new Date(customDateStart) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        fechaInicio = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      fecha_inicio: fechaInicio.toISOString().split('T')[0],
      fecha_fin: selectedTimeframe === 'custom' && customDateEnd ? customDateEnd : now.toISOString().split('T')[0],
      canales: selectedChannels
    };
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'WhatsApp': return <MessageCircle className="h-5 w-5 text-green-600" />;
      case 'Email': return <Mail className="h-5 w-5 text-blue-600" />;
      case 'SMS': return <Phone className="h-5 w-5 text-purple-600" />;
      case 'Telegram': return <MessageSquare className="h-5 w-5 text-cyan-600" />;
      default: return <MessageCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: React.ReactNode,
    trend?: number,
    trendLabel?: string,
    color = 'bg-white dark:bg-gray-800'
  ) => (
    <div className={`${color} rounded-lg shadow border p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              {getTrendIcon(trend)}
              <span className={`text-sm ml-1 ${getTrendColor(trend)}`}>
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                {trendLabel && <span className="text-gray-500 ml-1">{trendLabel}</span>}
              </span>
            </div>
          )}
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );

  const renderOverview = () => {
    if (!dashboardData) return null;

    return (
      <div className="space-y-6">
        {/* Métricas principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {renderMetricCard(
            'Total Mensajes',
            dashboardData.total_mensajes,
            <MessageCircle className="h-8 w-8" />,
            5.2,
            'vs mes anterior'
          )}
          {renderMetricCard(
            'Clientes Contactados',
            dashboardData.total_clientes_contactados,
            <Users className="h-8 w-8" />,
            8.1,
            'vs mes anterior'
          )}
          {renderMetricCard(
            'Conversiones',
            dashboardData.total_conversiones,
            <Target className="h-8 w-8" />,
            12.5,
            'vs mes anterior'
          )}
          {renderMetricCard(
            'ROI General',
            `${dashboardData.roi_general.toFixed(1)}%`,
            <TrendingUp className="h-8 w-8" />,
            15.3,
            'vs mes anterior'
          )}
        </div>

        {/* Métricas por canal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Rendimiento por Canal
            </h3>
            <button
              onClick={() => setSelectedView('channels')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver detalle →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardData.por_canal.map((channel) => (
              <div key={channel.canal} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {getChannelIcon(channel.canal)}
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {channel.canal}
                    </span>
                  </div>
                  {getTrendIcon(channel.tendencia_apertura)}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Enviados:</span>
                    <span className="font-medium">{formatNumber(channel.mensajes_enviados)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Apertura:</span>
                    <span className="font-medium">{channel.tasa_apertura.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Conversión:</span>
                    <span className="font-medium">{channel.tasa_conversion.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Costo:</span>
                    <span className="font-medium">{formatCurrency(channel.costo_total)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Campañas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Campañas
            </h3>
            <button
              onClick={() => setSelectedView('campaigns')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver todas →
            </button>
          </div>

          <div className="space-y-4">
            {dashboardData.top_campanas.slice(0, 3).map((campaign, index) => (
              <div key={campaign.campana_id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900 dark:text-white">{campaign.campana_nombre}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {campaign.canal} • {campaign.tipo}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {campaign.tasa_conversion.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatNumber(campaign.conversiones)} conversiones
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas y Predicciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alertas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Alertas
              </h3>
            </div>

            {dashboardData.alertas.length === 0 ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>Todo funcionando correctamente</span>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.alertas.map((alerta, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    alerta.tipo === 'warning' ? 'bg-orange-50 dark:bg-orange-900' :
                    alerta.tipo === 'error' ? 'bg-red-50 dark:bg-red-900' :
                    'bg-blue-50 dark:bg-blue-900'
                  }`}>
                    <p className="font-medium text-sm">{alerta.mensaje}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Actual: {alerta.valor_actual.toFixed(1)}% | Esperado: {alerta.valor_esperado}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Predicciones */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Predicciones
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Mensajes próximo mes:</span>
                <span className="font-medium">{formatNumber(dashboardData.predicciones.proximo_mes_mensajes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Conversiones estimadas:</span>
                <span className="font-medium">{formatNumber(dashboardData.predicciones.proximo_mes_conversiones)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ROI esperado:</span>
                <span className="font-medium">{dashboardData.predicciones.proximo_mes_roi}%</span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Confianza:</span>
                  <span className="text-green-600 font-medium">{dashboardData.predicciones.confianza}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChannelDetails = () => {
    if (!dashboardData) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Análisis Detallado por Canal
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboardData.por_canal.map((channel) => (
              <div key={channel.canal} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {getChannelIcon(channel.canal)}
                    <h4 className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
                      {channel.canal}
                    </h4>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    channel.tasa_conversion > 15 ? 'bg-green-100 text-green-800' :
                    channel.tasa_conversion > 10 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {channel.tasa_conversion > 15 ? 'Excelente' :
                     channel.tasa_conversion > 10 ? 'Bueno' : 'Necesita mejora'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Enviados</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(channel.mensajes_enviados)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tasa Entrega</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {channel.tasa_entrega.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tasa Apertura</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {channel.tasa_apertura.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Conversiones</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(channel.conversiones)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Costo Total</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(channel.costo_total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Costo/Mensaje</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(channel.costo_promedio)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Mejor hora:</p>
                      <p className="font-medium">{channel.mejor_hora_envio}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Mejor día:</p>
                      <p className="font-medium">{channel.mejor_dia_semana}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCampaignDetails = () => {
    if (!dashboardData) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Análisis de Campañas
          </h3>

          <div className="space-y-4">
            {dashboardData.top_campanas.map((campaign) => (
              <div key={campaign.campana_id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {campaign.campana_nombre}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {campaign.canal} • {campaign.tipo} • {campaign.estado}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {campaign.roi.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ROI</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">{formatNumber(campaign.mensajes_enviados)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Enviados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{campaign.tasa_apertura.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Apertura</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-purple-600">{campaign.tasa_respuesta.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Respuesta</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-orange-600">{formatNumber(campaign.conversiones)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Conversiones</p>
                  </div>
                </div>

                {campaign.promocion_aplicada && (
                  <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        Promoción: {campaign.codigo_promocional}
                      </span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {campaign.descuentos_aplicados} descuentos aplicados •
                      {formatCurrency(campaign.valor_descuentos || 0)} en descuentos
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
        <span className="text-gray-600 dark:text-gray-400">Cargando analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Analytics de Comunicaciones
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              showFilters
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>

          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Período
              </label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {selectedTimeframe === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={customDateStart}
                    onChange={(e) => setCustomDateStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={customDateEnd}
                    onChange={(e) => setCustomDateEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Canales
              </label>
              <div className="space-y-2">
                {['WhatsApp', 'Email', 'SMS', 'Telegram'].map(channel => (
                  <label key={channel} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(channel)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChannels([...selectedChannels, channel]);
                        } else {
                          setSelectedChannels(selectedChannels.filter(c => c !== channel));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{channel}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navegación de vistas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-1">
        <div className="flex flex-wrap gap-1">
          {[
            { key: 'overview', label: 'Resumen', icon: BarChart3 },
            { key: 'channels', label: 'Canales', icon: MessageCircle },
            { key: 'campaigns', label: 'Campañas', icon: Target },
            { key: 'clients', label: 'Clientes', icon: Users }
          ].map(view => (
            <button
              key={view.key}
              onClick={() => setSelectedView(view.key as any)}
              className={`flex items-center px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md flex-1 justify-center min-w-0 ${
                selectedView === view.key
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <view.icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">{view.label}</span>
              <span className="sm:hidden text-xs">{view.label.substring(0, 3)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido según vista seleccionada */}
      {selectedView === 'overview' && renderOverview()}
      {selectedView === 'channels' && renderChannelDetails()}
      {selectedView === 'campaigns' && renderCampaignDetails()}
      {selectedView === 'clients' && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Análisis de clientes en desarrollo...
          </p>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default CommunicationAnalytics;