import React from 'react';
import { Package, TrendingUp, AlertTriangle } from 'lucide-react';
import type { ABCAnalysis } from '../../services/analyticsService';

interface ABCAnalysisChartProps {
  data: ABCAnalysis;
  loading?: boolean;
}

const ABCAnalysisChart: React.FC<ABCAnalysisChartProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const getColorByCategory = (category: string) => {
    const colors = {
      A: 'bg-red-500 border-red-200 text-red-700',
      B: 'bg-yellow-500 border-yellow-200 text-yellow-700', 
      C: 'bg-green-500 border-green-200 text-green-700'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const getDescriptionByCategory = (category: string) => {
    const descriptions = {
      A: 'Alta prioridad: 80% del valor con pocos modelos',
      B: 'Media prioridad: 15% del valor',
      C: 'Baja prioridad: 5% del valor con muchos modelos'
    };
    return descriptions[category as keyof typeof descriptions] || '';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-6">
        <Package className="h-6 w-6 text-blue-600 mr-3" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Análisis ABC de Inventario</h3>
          <p className="text-sm text-gray-600">Clasificación por valor de inventario</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {(['A', 'B', 'C'] as const).map((category) => {
          const categoryData = data[`categoria_${category.toLowerCase()}` as keyof ABCAnalysis];
          const totalValue = categoryData.modelos.reduce((sum, modelo) => sum + modelo.valor_inventario, 0);
          
          return (
            <div key={category} className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 ${getColorByCategory(category)} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                  {category}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{categoryData.cantidad_modelos}</p>
                  <p className="text-xs text-gray-500">modelos</p>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {categoryData.porcentaje_modelos.toFixed(1)}% de los modelos
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Valor: {formatCurrency(totalValue)}
                </p>
                <p className="text-xs text-gray-500">
                  {getDescriptionByCategory(category)}
                </p>
              </div>

              {/* Progreso visual */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className={`${getColorByCategory(category).split(' ')[0]} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(categoryData.porcentaje_modelos, 100)}%` }}
                ></div>
              </div>

              {/* Top 3 modelos de esta categoría */}
              {categoryData.modelos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-2">Top modelos:</p>
                  <div className="space-y-1">
                    {categoryData.modelos.slice(0, 3).map((modelo, index) => (
                      <div key={modelo.modelo_id} className="flex justify-between items-center text-xs">
                        <span className="text-gray-700 truncate mr-2">{modelo.nombre}</span>
                        <div className="text-right">
                          <span className="font-medium text-gray-900">{modelo.stock}</span>
                          <span className="text-gray-500"> un.</span>
                        </div>
                      </div>
                    ))}
                    {categoryData.modelos.length > 3 && (
                      <p className="text-xs text-gray-500 italic">+{categoryData.modelos.length - 3} más...</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumen y recomendaciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <TrendingUp className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-2">Recomendaciones del Análisis ABC:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Categoría A:</strong> Controla estrictamente, stock óptimo, prioridad en reposición</p>
              <p>• <strong>Categoría B:</strong> Control moderado, revisiones periódicas</p>
              <p>• <strong>Categoría C:</strong> Control simple, posible optimización de stock</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ABCAnalysisChart;