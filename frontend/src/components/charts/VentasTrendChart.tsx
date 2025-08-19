import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface VentasTrendChartProps {
  data: Array<{ fecha: string; total: number; cantidad: number }>;
  height?: number;
}

const VentasTrendChart: React.FC<VentasTrendChartProps> = ({ data, height = 300 }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-gray-600 text-sm">{formatDate(label)}</p>
          <p className="text-blue-600 font-semibold">
            Ventas: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-green-600 text-sm">
            {payload[0].payload.cantidad} operaciones
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="fecha" 
          tickFormatter={formatDate}
          className="text-xs"
        />
        <YAxis 
          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          className="text-xs"
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#3B82F6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorVentas)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default VentasTrendChart;