import React, { useState, useEffect } from 'react';
import { 
  Bell,
  BellRing,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Search,
  Filter,
  Eye,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import { cuotaService } from '../services/cuotaService';
import type { AlertaPago, ResumenCobros } from '../types';

const AlertasPago: React.FC = () => {
  const [alertas, setAlertas] = useState<AlertaPago[]>([]);
  const [resumen, setResumen] = useState<ResumenCobros | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    estado: '',
    tipo: '',
    activas_solo: true
  });

  const loadAlertas = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await cuotaService.getAlertas(
        currentPage,
        filters.estado || undefined,
        filters.tipo || undefined,
        filters.activas_solo
      );
      
      setAlertas(response.results);
      setTotalCount(response.count);
      setTotalPages(Math.ceil(response.count / 10));
      
    } catch (error: any) {
      console.error('Error loading alertas:', error);
      setError('Error al cargar las alertas de pago');
      setAlertas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadResumen = async () => {
    try {
      const resumenData = await cuotaService.getResumenCobros();
      setResumen(resumenData);
    } catch (error) {
      console.error('Error loading resumen:', error);
    }
  };

  useEffect(() => {
    loadAlertas();
  }, [currentPage, filters]);

  useEffect(() => {
    loadResumen();
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const filteredAlertas = alertas.filter(alerta => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      alerta.venta.toString().includes(searchLower) ||
      alerta.venta_info?.cliente_info?.nombre?.toLowerCase().includes(searchLower) ||
      alerta.venta_info?.cliente_info?.apellido?.toLowerCase().includes(searchLower) ||
      alerta.mensaje.toLowerCase().includes(searchLower) ||
      alerta.tipo_alerta_display.toLowerCase().includes(searchLower)
    );
  });

  const marcarComoLeida = async (alertaId: number) => {
    try {
      await cuotaService.marcarAlertaLeida(alertaId);
      await loadAlertas();
    } catch (error) {
      console.error('Error marking alert as read:', error);
      setError('Error al marcar la alerta como leída');
    }
  };

  const marcarComoResuelta = async (alertaId: number) => {
    try {
      await cuotaService.marcarAlertaResuelta(alertaId);
      await loadAlertas();
    } catch (error) {
      console.error('Error marking alert as resolved:', error);
      setError('Error al marcar la alerta como resuelta');
    }
  };

  const generarAlertas = async () => {
    try {
      setLoading(true);
      await cuotaService.generarAlertasAutomaticas();
      await loadAlertas();
      await loadResumen();
    } catch (error) {
      console.error('Error generating alerts:', error);
      setError('Error al generar alertas automáticas');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoAlertaIcon = (tipo: string) => {
    switch (tipo) {
      case 'proximo_vencer':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'vencida':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'multiple_vencidas':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTipoAlertaColor = (tipo: string) => {
    switch (tipo) {
      case 'proximo_vencer':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'vencida':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'multiple_vencidas':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activa':
        return <BellRing className="h-4 w-4 text-red-600" />;
      case 'leida':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'resuelta':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const clearFilters = () => {
    setFilters({
      estado: '',
      tipo: '',
      activas_solo: true
    });
    setCurrentPage(1);
  };

  if (loading && alertas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen Cards */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Cuotas Vencidas</p>
                <p className="text-2xl font-bold text-red-900">{resumen.cuotas_vencidas}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Próximas a Vencer</p>
                <p className="text-2xl font-bold text-yellow-900">{resumen.cuotas_proximas_vencer}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Ventas Alto Riesgo</p>
                <p className="text-2xl font-bold text-red-900">{resumen.ventas_alto_riesgo}</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <BellRing className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">Alertas Activas</p>
                <p className="text-2xl font-bold text-orange-900">{resumen.alertas_activas}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Total Vencido</p>
                <p className="text-lg font-bold text-red-900">{formatCurrency(resumen.total_monto_vencido)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alertas de Pago</h1>
            <p className="text-gray-600 mt-1">
              {totalCount} alerta{totalCount !== 1 ? 's' : ''} registrada{totalCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={generarAlertas}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Generar Alertas
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por venta, cliente, mensaje..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-md flex items-center ${
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-md space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={filters.estado}
                    onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los estados</option>
                    <option value="activa">Activa</option>
                    <option value="leida">Leída</option>
                    <option value="resuelta">Resuelta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Alerta
                  </label>
                  <select
                    value={filters.tipo}
                    onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="proximo_vencer">Próximo a Vencer</option>
                    <option value="vencida">Cuota Vencida</option>
                    <option value="multiple_vencidas">Múltiples Cuotas Vencidas</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.activas_solo}
                      onChange={(e) => setFilters(prev => ({ ...prev, activas_solo: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Solo alertas activas</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alertas List */}
      <div className="space-y-4">
        {filteredAlertas.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="text-gray-500">
              <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay alertas</h3>
              <p>No se encontraron alertas que coincidan con los criterios de búsqueda.</p>
            </div>
          </div>
        ) : (
          filteredAlertas.map((alerta) => (
            <div
              key={alerta.id}
              className={`bg-white shadow rounded-lg p-6 border-l-4 ${
                alerta.estado === 'activa' ? 'border-red-500' : 
                alerta.estado === 'leida' ? 'border-blue-500' : 'border-green-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mr-2 ${getTipoAlertaColor(alerta.tipo_alerta)}`}>
                      {getTipoAlertaIcon(alerta.tipo_alerta)}
                      <span className="ml-1">{alerta.tipo_alerta_display}</span>
                    </span>
                    
                    <span className="inline-flex items-center">
                      {getEstadoIcon(alerta.estado)}
                      <span className="ml-1 text-xs text-gray-600">{alerta.estado_display}</span>
                    </span>
                  </div>
                  
                  <p className="text-gray-900 mb-2">{alerta.mensaje}</p>
                  
                  <div className="text-sm text-gray-600">
                    <span>Creada el {formatDate(alerta.fecha_creacion)}</span>
                    {alerta.fecha_lectura && (
                      <span className="ml-4">Leída el {formatDate(alerta.fecha_lectura)}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {alerta.estado === 'activa' && (
                    <>
                      <button
                        onClick={() => marcarComoLeida(alerta.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Marcar como leída"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => marcarComoResuelta(alerta.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Marcar como resuelta"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  
                  {alerta.estado === 'leida' && (
                    <button
                      onClick={() => marcarComoResuelta(alerta.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Marcar como resuelta"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white shadow rounded-lg px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{totalPages}</span> ({totalCount} registros)
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertasPago;