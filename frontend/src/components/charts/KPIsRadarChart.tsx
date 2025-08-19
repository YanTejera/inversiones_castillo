import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface KPIsRadarChartProps {
  data: {
    efectividad_cobranza: number;
    rotacion_inventario: number;
    margen_promedio: number;
    satisfaccion_cliente: number;
    crecimiento_mensual: number;
  };
  height?: number;
}

const KPIsRadarChart: React.FC<KPIsRadarChartProps> = ({ data, height = 300 }) => {
  // Normalizar los datos para el radar chart (0-100 scale)
  const chartData = [
    {
      indicador: 'Efectividad Cobranza',
      valor: data.efectividad_cobranza,
      fullMark: 100
    },
    {
      indicador: 'Rotación Inventario',
      valor: Math.min((data.rotacion_inventario / 6) * 100, 100), // Normalize to 6 as max
      fullMark: 100
    },
    {
      indicador: 'Margen Promedio',
      valor: Math.min(data.margen_promedio * 2, 100), // Normalize for display
      fullMark: 100
    },
    {
      indicador: 'Satisfacción Cliente',
      valor: (data.satisfaccion_cliente / 5) * 100, // Convert 5-point scale to percentage
      fullMark: 100
    },
    {
      indicador: 'Crecimiento Mensual',
      valor: Math.min(Math.max(data.crecimiento_mensual + 50, 0), 100), // Center around 50
      fullMark: 100
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const originalData = payload[0].payload;
      let displayValue = '';
      
      switch (label) {
        case 'Efectividad Cobranza':
          displayValue = `${data.efectividad_cobranza.toFixed(1)}%`;
          break;
        case 'Rotación Inventario':
          displayValue = `${data.rotacion_inventario.toFixed(1)}x`;
          break;
        case 'Margen Promedio':
          displayValue = `${data.margen_promedio.toFixed(1)}%`;
          break;
        case 'Satisfacción Cliente':
          displayValue = `${data.satisfaccion_cliente.toFixed(1)}/5`;
          break;
        case 'Crecimiento Mensual':
          displayValue = `${data.crecimiento_mensual.toFixed(1)}%`;
          break;
        default:
          displayValue = `${originalData.valor.toFixed(1)}`;
      }

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-blue-600">{displayValue}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={chartData}>
        <PolarGrid gridType="polygon" />
        <PolarAngleAxis 
          dataKey="indicador" 
          className="text-xs"
          tick={{ fontSize: 11 }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          className="text-xs"
          tick={{ fontSize: 10 }}
        />
        <Radar
          name="KPIs"
          dataKey="valor"
          stroke="#3B82F6"
          fill="#3B82F6"
          fillOpacity={0.3}
          strokeWidth={2}
          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default KPIsRadarChart;