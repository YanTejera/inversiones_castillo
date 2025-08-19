import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface TopProductosChartProps {
  data: Array<{ 
    nombre: string; 
    cantidad_vendida: number; 
    ingresos: number;
    margen: number;
  }>;
  height?: number;
}

const TopProductosChart: React.FC<TopProductosChartProps> = ({ data, height = 300 }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-blue-600">
            Ingresos: {formatCurrency(data.ingresos)}
          </p>
          <p className="text-green-600">
            Unidades: {data.cantidad_vendida}
          </p>
          <p className="text-purple-600">
            Margen: {data.margen.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="nombre" 
          angle={-45}
          textAnchor="end"
          height={80}
          className="text-xs"
        />
        <YAxis 
          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          className="text-xs"
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="ingresos" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopProductosChart;