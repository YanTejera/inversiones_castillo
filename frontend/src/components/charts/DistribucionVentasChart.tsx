import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface DistribucionVentasChartProps {
  data: {
    contado: { cantidad: number; porcentaje: number };
    financiado: { cantidad: number; porcentaje: number };
  };
  height?: number;
}

const DistribucionVentasChart: React.FC<DistribucionVentasChartProps> = ({ data, height = 300 }) => {
  const chartData = [
    {
      name: 'Ventas al Contado',
      value: data.contado.cantidad,
      porcentaje: data.contado.porcentaje,
      color: '#10B981'
    },
    {
      name: 'Ventas Financiadas',
      value: data.financiado.cantidad,
      porcentaje: data.financiado.porcentaje,
      color: '#3B82F6'
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 dark:text-white">{data.name}</p>
          <p className="text-blue-600">
            Cantidad: {data.value} ventas
          </p>
          <p className="text-green-600">
            Porcentaje: {data.porcentaje.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, porcentaje }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${porcentaje.toFixed(1)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={CustomLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value, entry: any) => (
            <span style={{ color: entry.color }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DistribucionVentasChart;