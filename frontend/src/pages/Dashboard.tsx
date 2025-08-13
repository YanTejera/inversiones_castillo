import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  CreditCard, 
  AlertTriangle,
  Users,
  TrendingUp 
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { DashboardData } from '../types';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const dashboardData = await dashboardService.getDashboardData();
        setData(dashboardData);
      } catch (err: any) {
        setError('Error al cargar datos del dashboard');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      name: 'Ventas Hoy',
      value: formatCurrency(data.ventas_hoy.total),
      count: `${data.ventas_hoy.count} ventas`,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      name: 'Ventas del Mes',
      value: formatCurrency(data.ventas_mes.total),
      count: `${data.ventas_mes.count} ventas`,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      name: 'Pagos Hoy',
      value: formatCurrency(data.pagos_hoy.total),
      count: `${data.pagos_hoy.count} pagos`,
      icon: CreditCard,
      color: 'bg-yellow-500',
    },
    {
      name: 'Stock Crítico',
      value: data.stock_critico.toString(),
      count: 'motocicletas',
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen general del sistema de gestión
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
            >
              <dt>
                <div className={`absolute ${stat.color} rounded-md p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </p>
              </dt>
              <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className="ml-2 flex items-baseline text-sm font-semibold text-gray-600">
                  {stat.count}
                </p>
              </dd>
            </div>
          );
        })}
      </div>

      {/* Cobros Pendientes */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Cobros Pendientes
          </h3>
          {data.ventas_con_saldo.length > 0 ? (
            <div className="space-y-3">
              {data.ventas_con_saldo.map((venta) => (
                <div
                  key={venta.venta_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {venta.cliente}
                      </p>
                      <p className="text-sm text-gray-500">
                        Venta #{venta.venta_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      {formatCurrency(venta.saldo)}
                    </p>
                    <p className="text-xs text-gray-500">pendiente</p>
                  </div>
                </div>
              ))}
              {data.cobros_pendientes > data.ventas_con_saldo.length && (
                <p className="text-sm text-gray-500 text-center py-2">
                  Y {data.cobros_pendientes - data.ventas_con_saldo.length} más...
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No hay cobros pendientes
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;