import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  QrCode, 
  Package, 
  Building2, 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Archive,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { locationService } from '../../services/locationService';
import QRScanner from './QRScanner';
import LocationForm from './LocationForm';
import { useToast } from '../Toast';

interface Location {
  id: number;
  codigo_completo: string;
  nombre: string;
  direccion_legible: string;
  tipo: string;
  capacidad_maxima: number;
  ocupacion_actual: number;
  espacios_libres: number;
  activo: boolean;
  reservado: boolean;
  qr_code_generado: boolean;
  pasillo: {
    nombre: string;
    zona: {
      nombre: string;
      tipo: string;
      almacen: {
        nombre: string;
        codigo: string;
      };
    };
  };
}

interface LocationStats {
  resumen: {
    total_almacenes: number;
    total_zonas: number;
    total_ubicaciones: number;
    capacidad_total: number;
    ocupacion_total: number;
    porcentaje_ocupacion: number;
  };
  distribucion_zonas: Array<{
    tipo: string;
    count: number;
    capacidad: number;
  }>;
  ubicaciones_mas_ocupadas: Array<{
    codigo: string;
    nombre: string;
    ocupacion: number;
    capacidad: number;
    porcentaje: number;
  }>;
  movimientos_recientes: Array<{
    tipo: string;
    modelo: string;
    destino: string;
    fecha: string;
    usuario: string;
  }>;
}

const LocationManager: React.FC = () => {
  const { success, error, info, ToastContainer } = useToast();
  
  // Estados principales
  const [locations, setLocations] = useState<Location[]>([]);
  const [stats, setStats] = useState<LocationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'available' | 'occupied' | 'reserved'>('all');
  
  // Estados de modals
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  // Cargar datos iniciales
  useEffect(() => {
    loadLocationData();
  }, []);

  const loadLocationData = async () => {
    try {
      setLoading(true);
      const [locationsData, statsData] = await Promise.all([
        locationService.getUbicaciones(),
        locationService.getLocationStats()
      ]);
      
      setLocations(locationsData);
      setStats(statsData);
    } catch (err) {
      error('Error al cargar datos de ubicaciones');
      console.error('Error loading location data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar ubicaciones
  const filteredLocations = locations.filter(location => {
    // Filtro por búsqueda
    const matchesSearch = !searchTerm || 
      location.codigo_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.direccion_legible.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por tipo
    let matchesFilter = true;
    switch (filterType) {
      case 'available':
        matchesFilter = location.activo && !location.reservado && location.espacios_libres > 0;
        break;
      case 'occupied':
        matchesFilter = location.ocupacion_actual > 0;
        break;
      case 'reserved':
        matchesFilter = location.reservado;
        break;
      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesFilter;
  });

  // Generar QR para ubicación
  const handleGenerateQR = async (location: Location) => {
    try {
      const qrData = await locationService.generateQR(location.id);
      
      // Crear y descargar QR
      const link = document.createElement('a');
      link.href = qrData.qr_code;
      link.download = `QR_${location.codigo_completo}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      success(`Código QR generado para ${location.codigo_completo}`);
      loadLocationData(); // Actualizar datos
    } catch (err) {
      error('Error al generar código QR');
      console.error('Error generating QR:', err);
    }
  };

  // Manejar formulario de ubicación
  const handleOpenForm = (mode: 'create' | 'edit' | 'view', location?: Location) => {
    setFormMode(mode);
    setSelectedLocation(location || null);
    setShowLocationForm(true);
  };

  const handleCloseForm = () => {
    setShowLocationForm(false);
    setSelectedLocation(null);
  };

  const handleFormSave = () => {
    handleCloseForm();
    loadLocationData();
    success(`Ubicación ${formMode === 'create' ? 'creada' : 'actualizada'} exitosamente`);
  };

  // Obtener icono de estado
  const getStatusIcon = (location: Location) => {
    if (!location.activo) return <XCircle className="h-4 w-4 text-red-500" />;
    if (location.reservado) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (location.espacios_libres === 0) return <Archive className="h-4 w-4 text-orange-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = (location: Location) => {
    if (!location.activo) return 'Inactiva';
    if (location.reservado) return 'Reservada';
    if (location.espacios_libres === 0) return 'Llena';
    return 'Disponible';
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        
        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Ubicaciones</h2>
          <p className="text-gray-600">Administra la ubicación física del inventario</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowQRScanner(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <QrCode className="h-4 w-4 mr-2" />
            Escanear QR
          </button>
          <button
            onClick={() => handleOpenForm('create')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Ubicación
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Almacenes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resumen.total_almacenes}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Archive className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Zonas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resumen.total_zonas}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Ubicaciones</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resumen.total_ubicaciones}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Ocupación</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.resumen.porcentaje_ocupacion.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controles de búsqueda y filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar ubicaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas</option>
              <option value="available">Disponibles</option>
              <option value="occupied">Ocupadas</option>
              <option value="reserved">Reservadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de ubicaciones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Ubicaciones ({filteredLocations.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ocupación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLocations.map((location) => {
                const occupancyPercentage = location.capacidad_maxima > 0 
                  ? (location.ocupacion_actual / location.capacidad_maxima) * 100 
                  : 0;
                
                return (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {location.codigo_completo}
                        </div>
                        <div className="text-sm text-gray-500">{location.nombre}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {location.direccion_legible}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(location)}
                        <span className="ml-2 text-sm text-gray-900">
                          {getStatusText(location)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${getOccupancyColor(occupancyPercentage)}`}
                            style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {location.ocupacion_actual}/{location.capacidad_maxima}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {location.qr_code_generado ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Generado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenForm('view', location)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenForm('edit', location)}
                          className="text-green-600 hover:text-green-900"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleGenerateQR(location)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Generar QR"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredLocations.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron ubicaciones</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando tu primera ubicación'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showQRScanner && (
        <QRScanner
          onClose={() => setShowQRScanner(false)}
          onLocationFound={(locationData) => {
            info(`Ubicación encontrada: ${locationData.codigo}`);
            setShowQRScanner(false);
          }}
        />
      )}

      {showLocationForm && (
        <LocationForm
          location={selectedLocation}
          mode={formMode}
          onClose={handleCloseForm}
          onSave={handleFormSave}
        />
      )}

      <ToastContainer />
    </div>
  );
};

export default LocationManager;