import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  CreditCard,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Bike,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { proveedorService } from '../services/proveedorService';
import { useWindowSize } from '../hooks/useWindowSize';

interface Proveedor {
  id?: number;
  nombre: string;
  nombre_comercial?: string;
  tipo_proveedor: 'distribuidor' | 'importador' | 'mayorista' | 'fabricante' | 'particular';
  ruc?: string;
  cedula?: string;
  registro_mercantil?: string;
  telefono?: string;
  telefono2?: string;
  email?: string;
  sitio_web?: string;
  direccion: string;
  ciudad: string;
  provincia?: string;
  pais: string;
  codigo_postal?: string;
  persona_contacto?: string;
  cargo_contacto?: string;
  telefono_contacto?: string;
  email_contacto?: string;
  moneda_preferida: 'USD' | 'RD' | 'EUR' | 'COP';
  terminos_pago?: string;
  limite_credito?: number;
  descuento_general?: number;
  estado: 'activo' | 'inactivo' | 'suspendido';
  fecha_inicio_relacion?: string;
  notas?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  creado_por?: number;
  nombre_completo?: string;
  contacto_principal?: string;
  telefono_principal?: string;
  email_principal?: string;
  esta_activo?: boolean;
  total_compras?: number;
  total_motocicletas?: number;
}

interface ProveedorEstadisticas {
  proveedor_info: {
    id: number;
    nombre_completo: string;
    tipo_proveedor: string;
    estado: string;
    contacto_principal: string;
    telefono_principal: string;
    email_principal: string;
    ciudad: string;
    pais: string;
    moneda_preferida: string;
    terminos_pago?: string;
    limite_credito?: number;
    descuento_general: number;
    fecha_inicio_relacion?: string;
  };
  inventario_actual: {
    modelos_suministrados: number;
    motos_legacy_suministradas: number;
    stock_total: number;
    valor_inventario_total: number;
    resumen_por_marca: Record<string, {
      modelos_count: number;
      stock_total: number;
      valor_inventario: number;
    }>;
  };
  performance: {
    total_motocicletas_suministradas: number;
    total_compras_realizadas: number;
    total_vendidas_estimadas: number;
    ingresos_por_ventas_estimados: number;
    ganancias_estimadas: number;
  };
  resumen: {
    promedio_precio_compra: number;
    rotacion_estimada: number;
    rentabilidad_estimada: number;
  };
}

// Métodos utilitarios
const getTiposProveedor = () => [
  { value: 'distribuidor', label: 'Distribuidor Oficial' },
  { value: 'importador', label: 'Importador' },
  { value: 'mayorista', label: 'Mayorista' },
  { value: 'fabricante', label: 'Fabricante' },
  { value: 'particular', label: 'Particular' }
];

const getMonedas = () => [
  { value: 'USD', label: 'Dólares (USD)' },
  { value: 'RD', label: 'Pesos Dominicanos (RD)' },
  { value: 'EUR', label: 'Euros (EUR)' },
  { value: 'COP', label: 'Pesos Colombianos (COP)' }
];

const ProveedorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();
  
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [estadisticas, setEstadisticas] = useState<ProveedorEstadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'stats' | 'motocicletas'>('info');

  useEffect(() => {
    if (id) {
      loadProveedorData();
    }
  }, [id]);

  const loadProveedorData = async () => {
    try {
      setLoading(true);
      const [proveedorData, statsData] = await Promise.all([
        proveedorService.getProveedor(parseInt(id!)),
        proveedorService.getProveedorEstadisticas(parseInt(id!)).catch(() => null)
      ]);
      
      setProveedor(proveedorData);
      setEstadisticas(statsData);
    } catch (err) {
      setError('Error al cargar datos del proveedor');
      console.error('Error loading proveedor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Está seguro de que desea eliminar este proveedor? Esta acción no se puede deshacer.')) {
      try {
        await proveedorService.deleteProveedor(parseInt(id!));
        navigate('/proveedores');
      } catch (err) {
        setError('Error al eliminar proveedor');
        console.error('Error deleting proveedor:', err);
      }
    }
  };

  const getEstadoIcon = (estado: string, activo?: boolean) => {
    if (activo) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (estado === 'suspendido') {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: currency === 'RD' ? 'DOP' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificado';
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !proveedor) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
        <p className="mt-1 text-sm text-gray-500">{error || 'Proveedor no encontrado'}</p>
        <div className="mt-6">
          <Link
            to="/proveedores"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Proveedores
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Información', icon: Building },
    { id: 'stats', label: 'Estadísticas', icon: TrendingUp },
    { id: 'motocicletas', label: 'Motocicletas', icon: Bike }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/proveedores')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {proveedor.nombre_completo}
              </h1>
              {getEstadoIcon(proveedor.estado, proveedor.esta_activo)}
            </div>
            <p className="text-gray-600">
              {proveedor.tipo_proveedor && getTiposProveedor().find(t => t.value === proveedor.tipo_proveedor)?.label} • {proveedor.ciudad}, {proveedor.pais}
            </p>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            to={`/proveedores/${id}/editar`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Stock Total</p>
                <p className="text-lg font-semibold text-gray-900">
                  {estadisticas.inventario_actual.stock_total}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Bike className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Modelos</p>
                <p className="text-lg font-semibold text-gray-900">
                  {estadisticas.inventario_actual.modelos_suministrados}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Valor Inventario</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(estadisticas.inventario_actual.valor_inventario_total, proveedor.moneda_preferida)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Compras</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(estadisticas.performance.total_compras_realizadas, proveedor.moneda_preferida)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } flex-1 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center justify-center`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Información Tab */}
          {activeTab === 'info' && (
            <div className="space-y-8">
              {/* Información Básica */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nombre Legal</p>
                      <p className="text-sm text-gray-900">{proveedor.nombre}</p>
                    </div>
                  </div>
                  
                  {proveedor.nombre_comercial && (
                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Nombre Comercial</p>
                        <p className="text-sm text-gray-900">{proveedor.nombre_comercial}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">RUC</p>
                      <p className="text-sm text-gray-900">{proveedor.ruc || 'No especificado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Cédula</p>
                      <p className="text-sm text-gray-900">{proveedor.cedula || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {proveedor.telefono && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Teléfono Principal</p>
                        <p className="text-sm text-gray-900">{proveedor.telefono}</p>
                      </div>
                    </div>
                  )}

                  {proveedor.telefono2 && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Teléfono Alternativo</p>
                        <p className="text-sm text-gray-900">{proveedor.telefono2}</p>
                      </div>
                    </div>
                  )}

                  {proveedor.email && (
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-sm text-gray-900">{proveedor.email}</p>
                      </div>
                    </div>
                  )}

                  {proveedor.sitio_web && (
                    <div className="flex items-center">
                      <ExternalLink className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Sitio Web</p>
                        <a 
                          href={proveedor.sitio_web} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {proveedor.sitio_web}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dirección */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección</h3>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">{proveedor.direccion}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {proveedor.ciudad}
                      {proveedor.provincia && `, ${proveedor.provincia}`}
                      {proveedor.codigo_postal && ` ${proveedor.codigo_postal}`}
                    </p>
                    <p className="text-sm text-gray-500">{proveedor.pais}</p>
                  </div>
                </div>
              </div>

              {/* Persona de Contacto */}
              {(proveedor.persona_contacto || proveedor.telefono_contacto || proveedor.email_contacto) && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Persona de Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {proveedor.persona_contacto && (
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Nombre</p>
                          <p className="text-sm text-gray-900">
                            {proveedor.persona_contacto}
                            {proveedor.cargo_contacto && (
                              <span className="text-gray-500"> - {proveedor.cargo_contacto}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {proveedor.telefono_contacto && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Teléfono</p>
                          <p className="text-sm text-gray-900">{proveedor.telefono_contacto}</p>
                        </div>
                      </div>
                    )}

                    {proveedor.email_contacto && (
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p className="text-sm text-gray-900">{proveedor.email_contacto}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Información Comercial */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Comercial</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Moneda Preferida</p>
                      <p className="text-sm text-gray-900">
                        {getMonedas().find(m => m.value === proveedor.moneda_preferida)?.label}
                      </p>
                    </div>
                  </div>

                  {proveedor.terminos_pago && (
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Términos de Pago</p>
                        <p className="text-sm text-gray-900">{proveedor.terminos_pago}</p>
                      </div>
                    </div>
                  )}

                  {proveedor.limite_credito && proveedor.limite_credito > 0 && (
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Límite de Crédito</p>
                        <p className="text-sm text-gray-900">
                          {formatCurrency(proveedor.limite_credito, proveedor.moneda_preferida)}
                        </p>
                      </div>
                    </div>
                  )}

                  {proveedor.descuento_general && proveedor.descuento_general > 0 && (
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Descuento General</p>
                        <p className="text-sm text-gray-900">{proveedor.descuento_general}%</p>
                      </div>
                    </div>
                  )}

                  {proveedor.fecha_inicio_relacion && (
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Inicio de Relación</p>
                        <p className="text-sm text-gray-900">{formatDate(proveedor.fecha_inicio_relacion)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas */}
              {proveedor.notas && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notas Adicionales</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-md">
                    {proveedor.notas}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Estadísticas Tab */}
          {activeTab === 'stats' && estadisticas && (
            <div className="space-y-8">
              {/* Performance General */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance General</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Package className="h-8 w-8 text-blue-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-600">Total Motocicletas</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {estadisticas.performance.total_motocicletas_suministradas}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <DollarSign className="h-8 w-8 text-green-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-600">Total Compras</p>
                        <p className="text-2xl font-bold text-green-900">
                          {formatCurrency(estadisticas.performance.total_compras_realizadas, proveedor.moneda_preferida)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-purple-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-600">Promedio por Moto</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {formatCurrency(estadisticas.resumen.promedio_precio_compra, proveedor.moneda_preferida)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen por Marca */}
              {Object.keys(estadisticas.inventario_actual.resumen_por_marca).length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen por Marca</h3>
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelos</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {Object.entries(estadisticas.inventario_actual.resumen_por_marca).map(([marca, datos]) => (
                          <tr key={marca}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {marca}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {datos.modelos_count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {datos.stock_total}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(datos.valor_inventario, proveedor.moneda_preferida)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Motocicletas Tab */}
          {activeTab === 'motocicletas' && (
            <div>
              <div className="text-center py-8">
                <Bike className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Lista de Motocicletas</h3>
                <p className="mt-1 text-sm text-gray-500">
                  La vista detallada de motocicletas por proveedor estará disponible próximamente.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProveedorDetail;