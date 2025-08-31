import React, { useState, useEffect } from 'react';
import { X, Save, MapPin, Building2, Archive, Ruler } from 'lucide-react';
import { locationService } from '../../services/locationService';

interface LocationFormProps {
  location?: any;
  mode: 'create' | 'edit' | 'view';
  onClose: () => void;
  onSave: () => void;
}

interface Almacen {
  id: number;
  nombre: string;
  codigo: string;
}

interface Zona {
  id: number;
  nombre: string;
  codigo: string;
  tipo: string;
}

interface Pasillo {
  id: number;
  nombre: string;
  codigo: string;
}

const LocationForm: React.FC<LocationFormProps> = ({ 
  location, 
  mode, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    almacen_id: '',
    zona_id: '',
    pasillo_id: '',
    nombre: '',
    codigo: '',
    tipo: 'estante',
    nivel: '',
    posicion: '',
    capacidad_maxima: 1,
    largo_cm: '',
    ancho_cm: '',
    alto_cm: '',
    notas: ''
  });

  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [pasillos, setPasillos] = useState<Pasillo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isReadOnly = mode === 'view';

  // Cargar datos iniciales
  useEffect(() => {
    loadAlmacenes();
    if (location && mode !== 'create') {
      setFormData({
        almacen_id: location.pasillo?.zona?.almacen?.id || '',
        zona_id: location.pasillo?.zona?.id || '',
        pasillo_id: location.pasillo?.id || '',
        nombre: location.nombre || '',
        codigo: location.codigo || '',
        tipo: location.tipo || 'estante',
        nivel: location.nivel || '',
        posicion: location.posicion || '',
        capacidad_maxima: location.capacidad_maxima || 1,
        largo_cm: location.largo_cm || '',
        ancho_cm: location.ancho_cm || '',
        alto_cm: location.alto_cm || '',
        notas: location.notas || ''
      });
    }
  }, [location, mode]);

  // Cargar almacenes
  const loadAlmacenes = async () => {
    try {
      const data = await locationService.getAlmacenes();
      setAlmacenes(data);
    } catch (error) {
      console.error('Error loading almacenes:', error);
    }
  };

  // Cargar zonas cuando se selecciona almacén
  useEffect(() => {
    if (formData.almacen_id) {
      loadZonas(formData.almacen_id);
    } else {
      setZonas([]);
      setPasillos([]);
      setFormData(prev => ({ ...prev, zona_id: '', pasillo_id: '' }));
    }
  }, [formData.almacen_id]);

  // Cargar pasillos cuando se selecciona zona
  useEffect(() => {
    if (formData.zona_id) {
      loadPasillos(formData.zona_id);
    } else {
      setPasillos([]);
      setFormData(prev => ({ ...prev, pasillo_id: '' }));
    }
  }, [formData.zona_id]);

  const loadZonas = async (almacenId: string) => {
    try {
      const data = await locationService.getZonas({ almacen: almacenId });
      setZonas(data);
    } catch (error) {
      console.error('Error loading zonas:', error);
    }
  };

  const loadPasillos = async (zonaId: string) => {
    try {
      const data = await locationService.getPasillos({ zona: zonaId });
      setPasillos(data);
    } catch (error) {
      console.error('Error loading pasillos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setSaving(true);
    try {
      const submitData = {
        ...formData,
        almacen_id: parseInt(formData.almacen_id),
        zona_id: parseInt(formData.zona_id),
        pasillo_id: parseInt(formData.pasillo_id),
        capacidad_maxima: parseInt(formData.capacidad_maxima.toString()),
        largo_cm: formData.largo_cm ? parseFloat(formData.largo_cm.toString()) : null,
        ancho_cm: formData.ancho_cm ? parseFloat(formData.ancho_cm.toString()) : null,
        alto_cm: formData.alto_cm ? parseFloat(formData.alto_cm.toString()) : null,
      };

      if (mode === 'create') {
        await locationService.createUbicacion(submitData);
      } else if (mode === 'edit') {
        await locationService.updateUbicacion(location.id, submitData);
      }

      onSave();
    } catch (error) {
      console.error('Error saving location:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (isReadOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const tiposUbicacion = [
    { value: 'estante', label: 'Estante' },
    { value: 'piso', label: 'Piso' },
    { value: 'colgante', label: 'Colgante' },
    { value: 'exterior', label: 'Exterior' },
    { value: 'especial', label: 'Especial' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'create' ? 'Nueva Ubicación' : 
                 mode === 'edit' ? 'Editar Ubicación' : 
                 'Detalles de Ubicación'}
              </h2>
              {location && (
                <p className="text-sm text-gray-500">{location.codigo_completo}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ubicación jerárquica */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Ubicación Jerárquica
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Almacén *
                  </label>
                  <select
                    value={formData.almacen_id}
                    onChange={(e) => handleChange('almacen_id', e.target.value)}
                    disabled={isReadOnly}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar almacén</option>
                    {almacenes.map(almacen => (
                      <option key={almacen.id} value={almacen.id}>
                        {almacen.codigo} - {almacen.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zona *
                  </label>
                  <select
                    value={formData.zona_id}
                    onChange={(e) => handleChange('zona_id', e.target.value)}
                    disabled={isReadOnly || !formData.almacen_id}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar zona</option>
                    {zonas.map(zona => (
                      <option key={zona.id} value={zona.id}>
                        {zona.codigo} - {zona.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pasillo *
                  </label>
                  <select
                    value={formData.pasillo_id}
                    onChange={(e) => handleChange('pasillo_id', e.target.value)}
                    disabled={isReadOnly || !formData.zona_id}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar pasillo</option>
                    {pasillos.map(pasillo => (
                      <option key={pasillo.id} value={pasillo.id}>
                        {pasillo.codigo} - {pasillo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  disabled={isReadOnly}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Ej: Estante Principal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => handleChange('codigo', e.target.value)}
                  disabled={isReadOnly}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Ej: E01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => handleChange('tipo', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  {tiposUbicacion.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidad Máxima *
                </label>
                <input
                  type="number"
                  value={formData.capacidad_maxima}
                  onChange={(e) => handleChange('capacidad_maxima', e.target.value)}
                  disabled={isReadOnly}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel
                </label>
                <input
                  type="text"
                  value={formData.nivel}
                  onChange={(e) => handleChange('nivel', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Ej: A, B, C"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Posición
                </label>
                <input
                  type="text"
                  value={formData.posicion}
                  onChange={(e) => handleChange('posicion', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Ej: 1, 2, 3"
                />
              </div>
            </div>

            {/* Dimensiones */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Ruler className="h-5 w-5 mr-2" />
                Dimensiones (cm)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Largo
                  </label>
                  <input
                    type="number"
                    value={formData.largo_cm}
                    onChange={(e) => handleChange('largo_cm', e.target.value)}
                    disabled={isReadOnly}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ancho
                  </label>
                  <input
                    type="number"
                    value={formData.ancho_cm}
                    onChange={(e) => handleChange('ancho_cm', e.target.value)}
                    disabled={isReadOnly}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alto
                  </label>
                  <input
                    type="number"
                    value={formData.alto_cm}
                    onChange={(e) => handleChange('alto_cm', e.target.value)}
                    disabled={isReadOnly}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => handleChange('notas', e.target.value)}
                disabled={isReadOnly}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Información adicional sobre la ubicación..."
              />
            </div>

            {/* Información de ocupación (solo en modo ver/editar) */}
            {location && mode !== 'create' && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Archive className="h-5 w-5 mr-2" />
                  Estado Actual
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Ocupación Actual</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {location.ocupacion_actual} / {location.capacidad_maxima}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Espacios Libres</p>
                    <p className="text-lg font-semibold text-green-600">
                      {location.espacios_libres}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Estado</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {location.activo ? (location.reservado ? 'Reservada' : 'Activa') : 'Inactiva'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {isReadOnly ? 'Cerrar' : 'Cancelar'}
          </button>
          {!isReadOnly && (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationForm;