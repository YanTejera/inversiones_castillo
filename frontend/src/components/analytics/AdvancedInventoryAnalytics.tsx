import React, { useState, useEffect } from 'react';
import { RefreshCw, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import ABCAnalysisChart from './ABCAnalysisChart';
import InventoryRotationChart from './InventoryRotationChart';
import IntelligentAlerts from './IntelligentAlerts';
import analyticsService, { type AnalyticsAvanzados, type AlertasInteligentes, type AlertaInteligente } from '../../services/analyticsService';

const AdvancedInventoryAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsAvanzados | null>(null);
  const [alertas, setAlertas] = useState<AlertasInteligentes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'abc' | 'rotation' | 'alerts'>('overview');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [analyticsData, alertasData] = await Promise.all([
        analyticsService.getAnalyticsAvanzados(),
        analyticsService.getAlertasInteligentes()
      ]);
      
      setAnalytics(analyticsData);
      setAlertas(alertasData);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError('Error al cargar los datos de análisis. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAlertAction = (alerta: AlertaInteligente) => {
    console.log('Procesando alerta:', alerta);
    // Aquí se puede implementar la lógica para manejar las alertas
    // Por ejemplo, marcarlas como resueltas, crear órdenes de compra, etc.
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Error al cargar análisis</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={loadData}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con tabs */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              Analytics Avanzados de Inventario
            </h1>
            <p className="text-gray-600 mt-1">
              Análisis inteligente para optimizar la gestión de inventario
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Resumen General', icon: BarChart3 },
            { id: 'abc', label: 'Análisis ABC', icon: TrendingUp },
            { id: 'rotation', label: 'Rotación', icon: RefreshCw },
            { id: 'alerts', label: 'Alertas', icon: AlertTriangle }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.id === 'alerts' && alertas && alertas.resumen.total_alertas > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                  {alertas.resumen.total_alertas}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido por tabs */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Métricas generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Valor Total Inventario</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.metricas_generales.valor_total_inventario)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Modelos Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.metricas_generales.total_modelos_activos}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <RefreshCw className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Rotación Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.metricas_generales.rotacion_promedio.toFixed(1)}x
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Stock Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.metricas_generales.stock_total_unidades}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview de componentes principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ABCAnalysisChart data={analytics.abc_analysis} loading={loading} />
            {alertas && (
              <IntelligentAlerts 
                data={alertas} 
                loading={loading} 
                onAlertAction={handleAlertAction}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'abc' && analytics && (
        <ABCAnalysisChart data={analytics.abc_analysis} loading={loading} />
      )}

      {activeTab === 'rotation' && analytics && (
        <InventoryRotationChart data={analytics.rotacion_inventario} loading={loading} />
      )}

      {activeTab === 'alerts' && alertas && (
        <IntelligentAlerts 
          data={alertas} 
          loading={loading} 
          onAlertAction={handleAlertAction}
        />
      )}
    </div>
  );
};

export default AdvancedInventoryAnalytics;