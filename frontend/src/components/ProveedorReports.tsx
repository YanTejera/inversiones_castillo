import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Package,
  Building,
  FileText,
  Download,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react';
import { proveedorService } from '../services/proveedorService';
import { useWindowSize } from '../hooks/useWindowSize';

interface ProveedorListItem {
  id: number;
  nombre_completo: string;
  tipo_proveedor: string;
  ciudad: string;
  pais: string;
  contacto_principal: string;
  telefono_principal: string;
  email: string;
  estado: string;
  esta_activo: boolean;
  total_motocicletas: number;
  fecha_creacion: string;
}

interface ProveedorReportData {
  proveedores_activos: number;
  proveedores_inactivos: number;
  total_proveedores: number;
  total_motocicletas: number;
  valor_total_inventario: number;
  promedio_motocicletas_por_proveedor: number;
  por_tipo: Array<{
    tipo: string;
    count: number;
    porcentaje: number;
  }>;
  por_pais: Array<{
    pais: string;
    count: number;
    porcentaje: number;
  }>;
  top_proveedores: Array<{
    id: number;
    nombre: string;
    motocicletas: number;
    valor_inventario: number;
  }>;
  tendencia_mensual?: Array<{
    mes: string;
    nuevos_proveedores: number;
    total_acumulado: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const ProveedorReports: React.FC = () => {
  const [reportData, setReportData] = useState<ProveedorReportData | null>(null);
  const [proveedores, setProveedores] = useState<ProveedorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Inicio del año
    end: new Date().toISOString().split('T')[0] // Hoy
  });
  const { isMobile } = useWindowSize();

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const response = await proveedorService.getProveedores();
      const proveedoresList = response.results;
      setProveedores(proveedoresList);
      
      // Generar datos del reporte basados en los proveedores
      const reportData = generateReportData(proveedoresList);
      setReportData(reportData);
    } catch (err) {
      setError('Error al cargar datos del reporte');
      console.error('Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = (proveedoresList: ProveedorListItem[]): ProveedorReportData => {
    const activos = proveedoresList.filter(p => p.esta_activo).length;
    const inactivos = proveedoresList.length - activos;
    const totalMotocicletas = proveedoresList.reduce((sum, p) => sum + p.total_motocicletas, 0);

    // Agrupar por tipo
    const tipoCount: Record<string, number> = {};
    proveedoresList.forEach(p => {
      tipoCount[p.tipo_proveedor] = (tipoCount[p.tipo_proveedor] || 0) + 1;
    });

    const porTipo = Object.entries(tipoCount).map(([tipo, count]) => ({
      tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
      count,
      porcentaje: (count / proveedoresList.length) * 100
    }));

    // Agrupar por país
    const paisCount: Record<string, number> = {};
    proveedoresList.forEach(p => {
      paisCount[p.pais] = (paisCount[p.pais] || 0) + 1;
    });

    const porPais = Object.entries(paisCount).map(([pais, count]) => ({
      pais,
      count,
      porcentaje: (count / proveedoresList.length) * 100
    }));

    // Top proveedores por motocicletas
    const topProveedores = proveedoresList
      .sort((a, b) => b.total_motocicletas - a.total_motocicletas)
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        nombre: p.nombre_completo.length > 30 
          ? p.nombre_completo.substring(0, 30) + '...' 
          : p.nombre_completo,
        motocicletas: p.total_motocicletas,
        valor_inventario: 0 // Placeholder - requeriría datos adicionales
      }));

    // Simular tendencia mensual (placeholder)
    const tendenciaMensual = generateMockTendencia();

    return {
      proveedores_activos: activos,
      proveedores_inactivos: inactivos,
      total_proveedores: proveedoresList.length,
      total_motocicletas: totalMotocicletas,
      valor_total_inventario: 0, // Placeholder
      promedio_motocicletas_por_proveedor: proveedoresList.length > 0 
        ? Math.round(totalMotocicletas / proveedoresList.length) 
        : 0,
      por_tipo: porTipo,
      por_pais: porPais,
      top_proveedores: topProveedores,
      tendencia_mensual: tendenciaMensual
    };
  };

  const generateMockTendencia = () => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses.map((mes, index) => ({
      mes,
      nuevos_proveedores: Math.floor(Math.random() * 5) + 1,
      total_acumulado: (index + 1) * 3 + Math.floor(Math.random() * 10)
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const exportToCSV = () => {
    if (!proveedores.length) return;
    
    const csvContent = [
      ['Nombre', 'Tipo', 'Ciudad', 'País', 'Estado', 'Motocicletas', 'Fecha Creación'],
      ...proveedores.map(p => [
        p.nombre_completo,
        p.tipo_proveedor,
        p.ciudad,
        p.pais,
        p.esta_activo ? 'Activo' : 'Inactivo',
        p.total_motocicletas.toString(),
        new Date(p.fecha_creacion).toLocaleDateString('es-DO')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `proveedores-reporte-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
        <p className="mt-1 text-sm text-gray-500">{error || 'No se pudieron cargar los datos'}</p>
        <button
          onClick={() => loadReportData()}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes de Proveedores</h1>
          <p className="text-gray-600 mt-1">Análisis detallado del desempeño y estadísticas de proveedores</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </button>
          <button
            onClick={loadReportData}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Período:</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Proveedores</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.total_proveedores}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-green-600 font-medium">{reportData.proveedores_activos} activos</span>
              <span className="text-gray-400 mx-2">•</span>
              <span className="text-red-600 font-medium">{reportData.proveedores_inactivos} inactivos</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Motocicletas</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.total_motocicletas}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Promedio: {reportData.promedio_motocicletas_por_proveedor} por proveedor
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Proveedores Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.total_proveedores > 0 
                  ? Math.round((reportData.proveedores_activos / reportData.total_proveedores) * 100)
                  : 0}%
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              {reportData.proveedores_activos} de {reportData.total_proveedores} proveedores
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Valor Inventario</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(reportData.valor_total_inventario)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">Estimado total</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proveedores por Tipo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Proveedores por Tipo</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.por_tipo}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 30 : 40}
                  outerRadius={isMobile ? 70 : 80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {reportData.por_tipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, name: any, props: any) => [
                  `${value} proveedores (${props.payload.porcentaje.toFixed(1)}%)`,
                  props.payload.tipo
                ]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {reportData.por_tipo.map((item, index) => (
              <div key={item.tipo} className="flex items-center text-sm">
                <div 
                  className="w-3 h-3 rounded mr-2" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-700">{item.tipo}: {item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Proveedores */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Proveedores por Motocicletas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.top_proveedores} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="nombre" 
                  type="category" 
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  width={isMobile ? 80 : 120}
                />
                <Tooltip 
                  formatter={(value: any) => [value, 'Motocicletas']}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="motocicletas" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución por País */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución por País</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.por_pais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="pais" 
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [value, 'Proveedores']}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tendencia de Nuevos Proveedores */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tendencia de Nuevos Proveedores</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.tendencia_mensual}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: isMobile ? 10 : 12 }} />
                <YAxis />
                <Tooltip 
                  labelStyle={{ color: '#374151' }}
                  formatter={(value: any, name: string) => [
                    value, 
                    name === 'nuevos_proveedores' ? 'Nuevos' : 'Total Acumulado'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="total_acumulado" 
                  stackId="1"
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="nuevos_proveedores" 
                  stackId="2"
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Resumen Detallado de Proveedores</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motocicletas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Registro
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proveedores.slice(0, 10).map((proveedor) => (
                <tr key={proveedor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{proveedor.nombre_completo}</div>
                    <div className="text-sm text-gray-500">{proveedor.contacto_principal}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {proveedor.tipo_proveedor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {proveedor.ciudad}, {proveedor.pais}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      proveedor.esta_activo 
                        ? 'text-green-700 bg-green-50' 
                        : 'text-red-700 bg-red-50'
                    }`}>
                      {proveedor.esta_activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {proveedor.total_motocicletas}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(proveedor.fecha_creacion).toLocaleDateString('es-DO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {proveedores.length > 10 && (
          <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500 text-center">
            Mostrando 10 de {proveedores.length} proveedores. Usa los filtros para ver más.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProveedorReports;