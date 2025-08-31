import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  Package, 
  Bell,
  Filter,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { AlertaInteligente, AlertasInteligentes } from '../../services/analyticsService';

interface IntelligentAlertsProps {
  data: AlertasInteligentes;
  loading?: boolean;
  onAlertAction?: (alerta: AlertaInteligente) => void;
}

const IntelligentAlerts: React.FC<IntelligentAlertsProps> = ({ data, loading = false, onAlertAction }) => {
  const [filtroTipo, setFiltroTipo] = useState<string>('all');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('all');
  const [mostrarResueltas, setMostrarResueltas] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getPrioridadColor = (prioridad: string) => {
    const colors = {
      urgente: 'bg-red-500 text-white border-red-600',
      alta: 'bg-orange-500 text-white border-orange-600',
      media: 'bg-yellow-500 text-white border-yellow-600',
      baja: 'bg-blue-500 text-white border-blue-600'
    };
    return colors[prioridad as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const getPrioridadBgColor = (prioridad: string) => {
    const colors = {
      urgente: 'bg-red-50 border-red-200',
      alta: 'bg-orange-50 border-orange-200',
      media: 'bg-yellow-50 border-yellow-200',
      baja: 'bg-blue-50 border-blue-200'
    };
    return colors[prioridad as keyof typeof colors] || 'bg-gray-50 border-gray-200';
  };

  const getTipoIcon = (tipo: string) => {
    const icons = {
      stock_bajo: <Package className="h-5 w-5" />,
      exceso_inventario: <TrendingDown className="h-5 w-5" />,
      sin_movimiento: <Clock className="h-5 w-5" />,
      alta_demanda: <TrendingUp className="h-5 w-5" />
    };
    return icons[tipo as keyof typeof icons] || <AlertTriangle className="h-5 w-5" />;
  };

  const getTipoLabel = (tipo: string) => {
    const labels = {
      stock_bajo: 'Stock Bajo',
      exceso_inventario: 'Exceso de Inventario',
      sin_movimiento: 'Sin Movimiento',
      alta_demanda: 'Alta Demanda'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filtrar alertas
  const alertasFiltradas = data.alertas.filter(alerta => {
    const coincideTipo = filtroTipo === 'all' || alerta.tipo === filtroTipo;
    const coincidePrioridad = filtroPrioridad === 'all' || alerta.prioridad === filtroPrioridad;
    return coincideTipo && coincidePrioridad;
  });

  const tiposUnicos = [...new Set(data.alertas.map(a => a.tipo))];
  const prioridadesUnicas = [...new Set(data.alertas.map(a => a.prioridad))];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Bell className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Alertas Inteligentes</h3>
            <p className="text-sm text-gray-600">Sistema automático de alertas de inventario</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Todos los tipos</option>
            {tiposUnicos.map(tipo => (
              <option key={tipo} value={tipo}>{getTipoLabel(tipo)}</option>
            ))}
          </select>
          <select
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Todas las prioridades</option>
            {prioridadesUnicas.map(prioridad => (
              <option key={prioridad} value={prioridad} className="capitalize">{prioridad}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumen de alertas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700 mb-1">Urgentes</p>
          <p className="text-2xl font-bold text-red-900">{data.resumen.por_prioridad.urgente}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-sm text-orange-700 mb-1">Alta Prioridad</p>
          <p className="text-2xl font-bold text-orange-900">{data.resumen.por_prioridad.alta}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-700 mb-1">Media Prioridad</p>
          <p className="text-2xl font-bold text-yellow-900">{data.resumen.por_prioridad.media}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700 mb-1">Baja Prioridad</p>
          <p className="text-2xl font-bold text-blue-900">{data.resumen.por_prioridad.baja}</p>
        </div>
      </div>

      {/* Lista de alertas */}
      <div className="space-y-4">
        {alertasFiltradas.map((alerta, index) => (
          <div 
            key={`${alerta.modelo_id}-${alerta.tipo}-${index}`} 
            className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${getPrioridadBgColor(alerta.prioridad)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg ${getPrioridadColor(alerta.prioridad)}`}>
                  {getTipoIcon(alerta.tipo)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{alerta.modelo}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadColor(alerta.prioridad)}`}>
                      {alerta.prioridad.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {getTipoLabel(alerta.tipo)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-2">{alerta.mensaje}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-500">Stock Actual:</span>
                      <span className="ml-2 font-medium">{alerta.stock_actual} unidades</span>
                    </div>
                    
                    {alerta.tipo === 'stock_bajo' && (
                      <>
                        <div>
                          <span className="text-gray-500">Días Restantes:</span>
                          <span className="ml-2 font-medium text-red-600">{alerta.dias_restantes?.toFixed(0)} días</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Cantidad Sugerida:</span>
                          <span className="ml-2 font-medium text-blue-600">{alerta.cantidad_sugerida} unidades</span>
                        </div>
                      </>
                    )}
                    
                    {alerta.tipo === 'exceso_inventario' && (
                      <>
                        <div>
                          <span className="text-gray-500">Meses de Stock:</span>
                          <span className="ml-2 font-medium text-orange-600">{alerta.meses_inventario} meses</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Valor Exceso:</span>
                          <span className="ml-2 font-medium text-red-600">{formatCurrency(alerta.valor_exceso || 0)}</span>
                        </div>
                      </>
                    )}
                    
                    {alerta.tipo === 'sin_movimiento' && (
                      <>
                        <div>
                          <span className="text-gray-500">Días Sin Venta:</span>
                          <span className="ml-2 font-medium text-red-600">{alerta.dias_sin_movimiento} días</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Valor en Riesgo:</span>
                          <span className="ml-2 font-medium text-red-600">{formatCurrency(alerta.valor_riesgo || 0)}</span>
                        </div>
                      </>
                    )}
                    
                    {alerta.tipo === 'alta_demanda' && (
                      <>
                        <div>
                          <span className="text-gray-500">Ventas del Mes:</span>
                          <span className="ml-2 font-medium text-green-600">{alerta.ventas_mes} unidades</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Ratio Demanda:</span>
                          <span className="ml-2 font-medium text-green-600">{alerta.ratio_demanda}x</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="bg-white/50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Acción Sugerida:</p>
                    <p className="text-sm text-gray-600">{alerta.accion_sugerida}</p>
                  </div>
                </div>
              </div>
              
              {onAlertAction && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => onAlertAction(alerta)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    title="Marcar como resuelta"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Descartar"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {alertasFiltradas.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay alertas que mostrar</p>
          <p className="text-gray-500 text-sm mt-1">
            {data.alertas.length === 0 
              ? 'El sistema está funcionando correctamente'
              : 'Todas las alertas están filtradas'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default IntelligentAlerts;