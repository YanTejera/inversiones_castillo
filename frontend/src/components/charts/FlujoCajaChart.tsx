import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface FlujoCajaChartProps {
  data: {
    ingresos_mes: number;
    egresos_mes: number;
    balance: number;
    proyeccion_mes_siguiente: number;
  };
  height?: number;
}

const FlujoCajaChart: React.FC<FlujoCajaChartProps> = ({ data, height = 300 }) => {
  // Crear datos para el gráfico
  const chartData = [
    {
      categoria: 'Ingresos',
      actual: data.ingresos_mes,
      proyeccion: data.ingresos_mes * 1.1,
      tipo: 'ingreso'
    },
    {
      categoria: 'Egresos',
      actual: data.egresos_mes,
      proyeccion: data.egresos_mes * 1.05,
      tipo: 'egreso'
    },
    {
      categoria: 'Balance',
      actual: data.balance,
      proyeccion: data.proyeccion_mes_siguiente,
      tipo: 'balance'
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={chartData}
        margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis dataKey="categoria" className="text-xs" />
        <YAxis 
          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          className="text-xs"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="actual" 
          fill="#3B82F6" 
          name="Mes Actual"
          radius={[4, 4, 0, 0]}
        />
        <Line 
          type="monotone" 
          dataKey="proyeccion" 
          stroke="#10B981" 
          strokeWidth={3}
          name="Proyección"
          dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default FlujoCajaChart;