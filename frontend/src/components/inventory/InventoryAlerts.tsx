import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  TrendingDown,
  Package,
  Bell,
  BellOff,
  Settings,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Calendar,
  BarChart3,
  PackageX,
  Zap,
  Shield,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AlertRule {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: 'stock_bajo' | 'sin_stock' | 'vencimiento' | 'rotacion_lenta' | 'precio_bajo' | 'custom';
  activa: boolean;
  condiciones: {
    stock_minimo?: number;
    dias_vencimiento?: number;
    dias_sin_movimiento?: number;
    porcentaje_precio?: number;
    [key: string]: any;
  };
  marca?: string;
  modelo?: string;
  fecha_creacion: string;
  usuario_creador: string;
}

interface Alert {
  id: number;
  tipo: 'stock_bajo' | 'sin_stock' | 'vencimiento' | 'rotacion_lenta' | 'precio_bajo' | 'custom';
  prioridad: 'alta' | 'media' | 'baja';
  titulo: string;
  descripcion: string;
  motocicleta: {
    id: number;
    marca: string;
    modelo: string;
    ano: number;
    color?: string;
    chasis?: string;
  };
  stock_actual: number;
  stock_minimo?: number;
  valor_actual?: number;
  fecha_generacion: string;
  fecha_vencimiento?: string;
  leida: boolean;
  resuelta: boolean;
  resuelto_por?: string;
  fecha_resolucion?: string;
  acciones_sugeridas: string[];
}

const InventoryAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'alerts' | 'rules'>('alerts');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);

  // Mock data - en producción esto vendría del backend
  const mockAlerts: Alert[] = [
    {
      id: 1,
      tipo: 'sin_stock',
      prioridad: 'alta',
      titulo: 'Sin Stock - YAMAHA YBR 125',
      descripcion: 'No hay unidades disponibles en inventario',
      motocicleta: {
        id: 101,
        marca: 'YAMAHA',
        modelo: 'YBR 125',
        ano: 2024,
        color: 'Rojo'
      },
      stock_actual: 0,
      stock_minimo: 3,
      fecha_generacion: '2024-01-15T10:30:00Z',
      leida: false,
      resuelta: false,
      acciones_sugeridas: [
        'Generar orden de compra',
        'Contactar proveedor',
        'Revisar ventas recientes'
      ]
    },
    {
      id: 2,
      tipo: 'stock_bajo',
      prioridad: 'media',
      titulo: 'Stock Bajo - HONDA XR 150L',
      descripcion: 'Stock por debajo del mínimo establecido',
      motocicleta: {
        id: 102,
        marca: 'HONDA',
        modelo: 'XR 150L',
        ano: 2023,
        color: 'Negro'
      },
      stock_actual: 2,
      stock_minimo: 5,
      fecha_generacion: '2024-01-14T14:45:00Z',
      leida: true,
      resuelta: false,
      acciones_sugeridas: [
        'Reabastecer stock',
        'Ajustar stock mínimo',
        'Verificar demanda'
      ]
    },
    {
      id: 3,
      tipo: 'rotacion_lenta',
      prioridad: 'baja',
      titulo: 'Rotación Lenta - SUZUKI GN 125',
      descripcion: 'Sin movimiento en los últimos 90 días',
      motocicleta: {
        id: 103,
        marca: 'SUZUKI',
        modelo: 'GN 125',
        ano: 2023,
        color: 'Azul'
      },
      stock_actual: 8,
      fecha_generacion: '2024-01-13T09:15:00Z',
      leida: false,
      resuelta: false,
      acciones_sugeridas: [
        'Crear promoción especial',
        'Revisar pricing',
        'Evaluar descontinuación'
      ]
    },
    {
      id: 4,
      tipo: 'precio_bajo',
      prioridad: 'media',
      titulo: 'Precio Competitivo - YAMAHA MT-03',
      descripcion: 'Precio 15% por debajo del mercado',
      motocicleta: {
        id: 104,
        marca: 'YAMAHA',
        modelo: 'MT-03',
        ano: 2024,
        color: 'Blanco'
      },
      stock_actual: 4,
      valor_actual: 3200000,
      fecha_generacion: '2024-01-12T16:20:00Z',
      leida: true,
      resuelta: true,
      resuelto_por: 'Juan Pérez',
      fecha_resolucion: '2024-01-13T10:00:00Z',
      acciones_sugeridas: [
        'Revisar precios de mercado',
        'Ajustar precio de venta',
        'Analizar márgenes'
      ]
    }
  ];

  const mockRules: AlertRule[] = [
    {
      id: 1,
      nombre: 'Stock Mínimo General',
      descripcion: 'Alerta cuando el stock esté por debajo de 3 unidades',
      tipo: 'stock_bajo',
      activa: true,
      condiciones: {
        stock_minimo: 3
      },
      fecha_creacion: '2024-01-01T00:00:00Z',
      usuario_creador: 'Admin'
    },
    {
      id: 2,
      nombre: 'Sin Stock Crítico',
      descripcion: 'Alerta inmediata cuando no hay stock disponible',
      tipo: 'sin_stock',
      activa: true,
      condiciones: {},
      fecha_creacion: '2024-01-01T00:00:00Z',
      usuario_creador: 'Admin'
    },
    {
      id: 3,
      nombre: 'Rotación Lenta - 90 días',
      descripcion: 'Productos sin movimiento en 90 días',
      tipo: 'rotacion_lenta',
      activa: true,
      condiciones: {
        dias_sin_movimiento: 90
      },
      fecha_creacion: '2024-01-01T00:00:00Z',
      usuario_creador: 'Admin'
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Aquí irían las llamadas al API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAlerts(mockAlerts);
      setAlertRules(mockRules);
      setLoading(false);
    };

    loadData();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'baja':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'alta':
        return <AlertTriangle className="h-4 w-4" />;
      case 'media':
        return <AlertCircle className="h-4 w-4" />;
      case 'baja':
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'sin_stock':
        return <PackageX className="h-4 w-4 text-red-600" />;
      case 'stock_bajo':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      case 'rotacion_lenta':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'precio_bajo':
        return <BarChart3 className="h-4 w-4 text-green-600" />;
      case 'vencimiento':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sin_stock: 'Sin Stock',
      stock_bajo: 'Stock Bajo',
      rotacion_lenta: 'Rotación Lenta',
      precio_bajo: 'Precio Bajo',
      vencimiento: 'Vencimiento',
      custom: 'Personalizada'
    };
    return labels[type] || type;
  };

  const handleMarkAsRead = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, leida: true } : alert
    ));
  };

  const handleResolveAlert = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { 
        ...alert, 
        resuelta: true, 
        resuelto_por: 'Usuario Actual',
        fecha_resolucion: new Date().toISOString()
      } : alert
    ));
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = searchTerm === '' || 
      alert.motocicleta.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.motocicleta.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.titulo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = filterPriority === 'all' || alert.prioridad === filterPriority;
    const matchesType = filterType === 'all' || alert.tipo === filterType;
    const matchesUnread = !showOnlyUnread || !alert.leida;

    return matchesSearch && matchesPriority && matchesType && matchesUnread;
  });

  const totalAlerts = alerts.length;
  const unreadAlerts = alerts.filter(a => !a.leida).length;
  const highPriorityAlerts = alerts.filter(a => a.prioridad === 'alta' && !a.resuelta).length;
  const resolvedAlerts = alerts.filter(a => a.resuelta).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
          <div className="animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Bell className="h-5 w-5 mr-2 text-blue-600" />
              Alertas de Inventario
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Sistema de notificaciones automáticas para control de stock
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRuleModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
            >
              <Settings className="h-4 w-4" />
              Configurar Reglas
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg mr-3">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Alertas</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{totalAlerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg mr-3">
              <BellOff className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sin Leer</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{unreadAlerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg mr-3">
              <Zap className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alta Prioridad</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{highPriorityAlerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg mr-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resueltas</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{resolvedAlerts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Bell className="h-4 w-4 mr-2" />
              Alertas Activas
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'rules'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Settings className="h-4 w-4 mr-2" />
              Reglas ({alertRules.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'alerts' ? (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar alertas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">Todas las prioridades</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="sin_stock">Sin Stock</option>
                    <option value="stock_bajo">Stock Bajo</option>
                    <option value="rotacion_lenta">Rotación Lenta</option>
                    <option value="precio_bajo">Precio Bajo</option>
                  </select>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showOnlyUnread}
                    onChange={(e) => setShowOnlyUnread(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Solo no leídas</span>
                </label>
              </div>

              {/* Alerts List */}
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow border p-4 ${
                      !alert.leida ? 'border-l-4 border-l-blue-500' : ''
                    } ${alert.resuelta ? 'opacity-75' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getAlertTypeIcon(alert.tipo)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {alert.titulo}
                            </h3>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(alert.prioridad)}`}>
                              {getPriorityIcon(alert.prioridad)}
                              <span className="ml-1 capitalize">{alert.prioridad}</span>
                            </span>
                            {!alert.leida && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                            {alert.resuelta && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resuelta
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {alert.descripcion}
                          </p>
                          
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <Package className="h-3 w-3 mr-1" />
                            <span className="font-medium">
                              {alert.motocicleta.marca} {alert.motocicleta.modelo} {alert.motocicleta.ano}
                            </span>
                            {alert.motocicleta.color && (
                              <span className="ml-2">• {alert.motocicleta.color}</span>
                            )}
                            {alert.stock_actual !== undefined && (
                              <span className="ml-2">• Stock: {alert.stock_actual}</span>
                            )}
                            <span className="ml-auto">
                              {format(new Date(alert.fecha_generacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </span>
                          </div>
                          
                          {alert.acciones_sugeridas.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Acciones sugeridas:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {alert.acciones_sugeridas.map((accion, index) => (
                                  <span 
                                    key={index}
                                    className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                                  >
                                    {accion}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {alert.resuelta && alert.resuelto_por && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Resuelta por {alert.resuelto_por} el {format(new Date(alert.fecha_resolucion!), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!alert.leida && (
                          <button
                            onClick={() => handleMarkAsRead(alert.id)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            title="Marcar como leída"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        
                        {!alert.resuelta && (
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="text-green-600 hover:text-green-700 dark:text-green-400"
                            title="Marcar como resuelta"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredAlerts.length === 0 && (
                  <div className="text-center py-12">
                    <Shield className="mx-auto h-12 w-12 text-green-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      ¡Todo bajo control!
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {searchTerm || filterPriority !== 'all' || filterType !== 'all' || showOnlyUnread
                        ? 'No hay alertas que coincidan con los filtros aplicados.'
                        : 'No hay alertas activas en este momento.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Rules Tab */
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Reglas de Alerta
                </h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium">
                  <Plus className="h-4 w-4" />
                  Nueva Regla
                </button>
              </div>
              
              <div className="space-y-4">
                {alertRules.map((rule) => (
                  <div key={rule.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${rule.activa ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{rule.nombre}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{rule.descripcion}</p>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span className="capitalize">{getAlertTypeLabel(rule.tipo)}</span>
                            <span className="mx-2">•</span>
                            <span>Creada por {rule.usuario_creador}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-700">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rule Modal Placeholder */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Configurar Reglas
                </h3>
                <button 
                  onClick={() => setShowRuleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  La configuración avanzada de reglas estará disponible en la próxima actualización.
                </p>
                <button 
                  onClick={() => setShowRuleModal(false)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAlerts;