import React, { useState } from 'react';
import { RotateCcw, TrendingUp, TrendingDown, Minus, Filter } from 'lucide-react';
import type { MetricaRotacion } from '../../services/analyticsService';

interface InventoryRotationChartProps {
  data: MetricaRotacion[];
  loading?: boolean;
}

const InventoryRotationChart: React.FC<InventoryRotationChartProps> = ({ data, loading = false }) => {
  const [filtroEficiencia, setFiltroEficiencia] = useState<'all' | 'alta' | 'media' | 'baja'>('all');
  const [mostrarTop, setMostrarTop] = useState(10);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getEficienciaColor = (eficiencia: string) => {
    const colors = {
      alta: 'text-green-700 bg-green-100 border-green-200',
      media: 'text-yellow-700 bg-yellow-100 border-yellow-200',
      baja: 'text-red-700 bg-red-100 border-red-200'
    };
    return colors[eficiencia as keyof typeof colors] || 'text-gray-700 bg-gray-100';
  };

  const getEficienciaIcon = (eficiencia: string) => {
    switch (eficiencia) {
      case 'alta': return <TrendingUp className="h-4 w-4" />;
      case 'media': return <Minus className="h-4 w-4" />;
      case 'baja': return <TrendingDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filtrar datos
  const datosFiltrados = data.filter(item => 
    filtroEficiencia === 'all' || item.eficiencia === filtroEficiencia
  ).slice(0, mostrarTop);

  // Estadísticas generales
  const rotacionPromedio = data.reduce((sum, item) => sum + item.rotacion_anual, 0) / data.length;
  const eficienciaCount = {
    alta: data.filter(item => item.eficiencia === 'alta').length,
    media: data.filter(item => item.eficiencia === 'media').length,
    baja: data.filter(item => item.eficiencia === 'baja').length
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <RotateCcw className="h-6 w-6 text-purple-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Rotación de Inventario</h3>
            <p className="text-sm text-gray-600">Análisis de eficiencia por modelo</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={filtroEficiencia}
            onChange={(e) => setFiltroEficiencia(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todas las eficiencias</option>
            <option value="alta">Alta eficiencia</option>
            <option value="media">Media eficiencia</option>
            <option value="baja">Baja eficiencia</option>
          </select>
          <select
            value={mostrarTop}
            onChange={(e) => setMostrarTop(parseInt(e.target.value))}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
            <option value={data.length}>Todos</option>
          </select>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 border">
          <p className="text-sm text-gray-600 mb-1">Rotación Promedio</p>
          <p className="text-2xl font-bold text-gray-900">{rotacionPromedio.toFixed(1)}x</p>
          <p className="text-xs text-gray-500">por año</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-700 mb-1">Alta Eficiencia</p>
          <p className="text-2xl font-bold text-green-900">{eficienciaCount.alta}</p>
          <p className="text-xs text-green-600">modelos (≥6x/año)</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-yellow-700 mb-1">Media Eficiencia</p>
          <p className="text-2xl font-bold text-yellow-900">{eficienciaCount.media}</p>
          <p className="text-xs text-yellow-600">modelos (2-6x/año)</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-red-700 mb-1">Baja Eficiencia</p>
          <p className="text-2xl font-bold text-red-900">{eficienciaCount.baja}</p>
          <p className="text-xs text-red-600">modelos (&lt;2x/año)</p>
        </div>
      </div>

      {/* Lista de modelos */}
      <div className="space-y-3">
        {datosFiltrados.map((modelo, index) => (
          <div key={modelo.modelo_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-500 w-8">
                  #{index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{modelo.nombre}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEficienciaColor(modelo.eficiencia)}`}>
                      {getEficienciaIcon(modelo.eficiencia)}
                      <span className="ml-1 capitalize">{modelo.eficiencia}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-sm text-gray-500">Stock</p>
                  <p className="text-lg font-semibold text-gray-900">{modelo.stock_actual}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ventas/Año</p>
                  <p className="text-lg font-semibold text-blue-600">{modelo.ventas_ano}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rotación</p>
                  <p className="text-lg font-semibold text-purple-600">{modelo.rotacion_anual}x</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Días Promedio</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {modelo.dias_promedio_venta > 0 ? Math.round(modelo.dias_promedio_venta) : '∞'}
                  </p>
                </div>
              </div>
            </div>

            {/* Barra de progreso para rotación */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">Progreso de rotación</span>
                <span className="text-xs text-gray-500">{formatCurrency(modelo.ingresos_ano)} ingresos</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    modelo.eficiencia === 'alta' 
                      ? 'bg-green-500' 
                      : modelo.eficiencia === 'media' 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${Math.min((modelo.rotacion_anual / 10) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8">
          <RotateCcw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay datos de rotación disponibles</p>
        </div>
      )}
    </div>
  );
};

export default InventoryRotationChart;