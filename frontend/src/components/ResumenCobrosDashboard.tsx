import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  ArrowRight,
  Eye,
  User
} from 'lucide-react';
import { cuotaService } from '../services/cuotaService';
import type { ResumenCobros, ClienteFinanciado } from '../types';

const ResumenCobrosDashboard: React.FC = () => {
  const [resumen, setResumen] = useState<ResumenCobros | null>(null);
  const [clientesUrgentes, setClientesUrgentes] = useState<ClienteFinanciado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Cargar resumen de cobros
        const resumenData = await cuotaService.getResumenCobros();
        setResumen(resumenData);
        
        // Cargar clientes con saldos pendientes (los más urgentes)
        const clientesData = await cuotaService.buscarClientesFinanciados();
        
        // Filtrar solo los que tienen pagos vencidos y ordenar por días vencidos
        const clientesVencidos = clientesData
          .filter(cliente => cliente.proxima_cuota && cliente.proxima_cuota.dias_vencido > 0)
          .sort((a, b) => (b.proxima_cuota?.dias_vencido || 0) - (a.proxima_cuota?.dias_vencido || 0))
          .slice(0, 5); // Solo los primeros 5
          
        setClientesUrgentes(clientesVencidos);
        
      } catch (error) {
        console.error('Error cargando resumen de cobros:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDiasVencidoColor = (dias: number) => {
    if (dias <= 7) return 'text-yellow-600';
    if (dias <= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!resumen) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Resumen de Cobros</h3>
        <Link 
          to="/cobros"
          className="text-blue-600 hover:text-blue-500 flex items-center text-sm"
        >
          Ver detalle
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-1" />
            <span className="text-sm font-medium text-red-600">Vencidas</span>
          </div>
          <div className="text-xl font-bold text-red-800">
            {resumen.cuotas_vencidas}
          </div>
          <div className="text-xs text-red-600 mt-1">
            {formatCurrency(resumen.total_monto_vencido)}
          </div>
        </div>

        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-5 w-5 text-yellow-600 mr-1" />
            <span className="text-sm font-medium text-yellow-600">Próximas</span>
          </div>
          <div className="text-xl font-bold text-yellow-800">
            {resumen.cuotas_proximas_vencer}
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            (7 días)
          </div>
        </div>

        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="h-5 w-5 text-orange-600 mr-1" />
            <span className="text-sm font-medium text-orange-600">Alertas</span>
          </div>
          <div className="text-xl font-bold text-orange-800">
            {resumen.alertas_activas}
          </div>
          <div className="text-xs text-orange-600 mt-1">
            activas
          </div>
        </div>

        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-center mb-2">
            <User className="h-5 w-5 text-purple-600 mr-1" />
            <span className="text-sm font-medium text-purple-600">Riesgo</span>
          </div>
          <div className="text-xl font-bold text-purple-800">
            {resumen.ventas_alto_riesgo}
          </div>
          <div className="text-xs text-purple-600 mt-1">
            ventas
          </div>
        </div>
      </div>

      {/* Clientes urgentes */}
      {clientesUrgentes.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
            Clientes con Pagos Vencidos
          </h4>
          <div className="space-y-2">
            {clientesUrgentes.map((cliente) => (
              <div key={`${cliente.cliente_id}-${cliente.venta_id}`} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {cliente.nombre_completo}
                  </div>
                  <div className="text-xs text-gray-500">
                    Venta #{cliente.venta_id} - {formatCurrency(cliente.saldo_pendiente)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium ${getDiasVencidoColor(cliente.proxima_cuota?.dias_vencido || 0)}`}>
                    {cliente.proxima_cuota?.dias_vencido || 0}d
                  </span>
                  <Link
                    to={`/clientes/${cliente.cliente_id}`}
                    className="text-blue-600 hover:text-blue-500"
                    title="Ver cliente"
                  >
                    <Eye className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {clientesUrgentes.length === 5 && (
            <div className="mt-3 text-center">
              <Link 
                to="/cobros?tab=clientes"
                className="text-xs text-blue-600 hover:text-blue-500"
              >
                Ver todos los clientes con pagos vencidos →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Estado general */}
      {resumen.cuotas_vencidas === 0 && resumen.cuotas_proximas_vencer === 0 && (
        <div className="text-center py-4">
          <div className="text-green-600 mb-2">
            <DollarSign className="h-8 w-8 mx-auto" />
          </div>
          <p className="text-sm text-green-600 font-medium">
            ¡Todos los pagos están al día!
          </p>
          <p className="text-xs text-gray-500 mt-1">
            No hay cuotas vencidas ni próximas a vencer
          </p>
        </div>
      )}
    </div>
  );
};

export default ResumenCobrosDashboard;