import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageCircle,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Eye,
  Mail,
  Phone,
  MessageSquare,
  Save,
  RefreshCw,
  FileText,
  Zap,
  Star,
  Clock,
  Users
} from 'lucide-react';
import { useToast } from '../Toast';

interface Plantilla {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: 'Cobranza' | 'Marketing' | 'Recordatorio' | 'Promocion' | 'Servicio';
  canal: 'WhatsApp' | 'Email' | 'SMS' | 'Telegram' | 'Universal';
  categoria: 'Formal' | 'Amigable' | 'Urgente' | 'Promocional';
  contenido: string;
  variables: string[];
  es_favorita: boolean;
  usos_total: number;
  efectividad: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  creado_por: string;
  estado: 'Activa' | 'Inactiva' | 'Borrador';
}

interface PlantillaForm {
  nombre: string;
  descripcion: string;
  tipo: 'Cobranza' | 'Marketing' | 'Recordatorio' | 'Promocion' | 'Servicio';
  canal: 'WhatsApp' | 'Email' | 'SMS' | 'Telegram' | 'Universal';
  categoria: 'Formal' | 'Amigable' | 'Urgente' | 'Promocional';
  contenido: string;
  es_favorita: boolean;
}

const PlantillasManager: React.FC = () => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();

  // Estados principales
  const [loading, setLoading] = useState(false);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('all');
  const [filtroCanal, setFiltroCanal] = useState<string>('all');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('all');
  const [soloFavoritas, setSoloFavoritas] = useState(false);

  // Estados de modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPlantilla, setSelectedPlantilla] = useState<Plantilla | null>(null);
  const [editingPlantilla, setEditingPlantilla] = useState<Plantilla | null>(null);

  // Estados del formulario
  const [formData, setFormData] = useState<PlantillaForm>({
    nombre: '',
    descripcion: '',
    tipo: 'Marketing',
    canal: 'WhatsApp',
    categoria: 'Amigable',
    contenido: '',
    es_favorita: false
  });

  // Estado de preview
  const [previewData, setPreviewData] = useState({
    nombre: 'Juan Pérez',
    deuda: '45,000',
    empresa: 'Inversiones C&C',
    fecha: new Date().toLocaleDateString('es-ES'),
    producto: 'Motocicleta Honda CB190R'
  });

  useEffect(() => {
    loadPlantillas();
  }, []);

  // Guardar plantillas en localStorage cuando cambien
  useEffect(() => {
    if (plantillas.length > 0) {
      localStorage.setItem('plantillas_comunicaciones', JSON.stringify(plantillas));
    }
  }, [plantillas]);

  const loadPlantillas = async () => {
    try {
      setLoading(true);

      // Cargar plantillas desde localStorage o usar datos mock
      const savedPlantillas = localStorage.getItem('plantillas_comunicaciones');
      if (savedPlantillas) {
        setPlantillas(JSON.parse(savedPlantillas));
        setLoading(false);
        return;
      }

      // Simulando datos por ahora
      const mockPlantillas: Plantilla[] = [
        {
          id: 1,
          nombre: "Recordatorio Pago Amigable",
          descripcion: "Recordatorio cordial para pagos con pocos días de atraso",
          tipo: "Cobranza",
          canal: "WhatsApp",
          categoria: "Amigable",
          contenido: "Hola {nombre}, espero que estés bien. Te escribo para recordarte que tienes un pago pendiente de {deuda} con vencimiento hace {dias_vencido} días. Si ya realizaste el pago, por favor ignora este mensaje. ¡Gracias! 😊",
          variables: ["nombre", "deuda", "dias_vencido"],
          es_favorita: true,
          usos_total: 156,
          efectividad: 78.5,
          fecha_creacion: "2024-08-15",
          fecha_actualizacion: "2024-09-10",
          creado_por: "Admin",
          estado: "Activa"
        },
        {
          id: 2,
          nombre: "Notificación Pago Formal",
          descripcion: "Notificación formal para pagos con mayor atraso",
          tipo: "Cobranza",
          canal: "Email",
          categoria: "Formal",
          contenido: "Estimado/a {nombre},\n\nNos dirigimos a usted para informarle que registra un saldo pendiente de {deuda} con {dias_vencido} días de atraso.\n\nLe solicitamos regularizar su situación a la brevedad posible.\n\nSaludos cordiales,\n{empresa}",
          variables: ["nombre", "deuda", "dias_vencido", "empresa"],
          es_favorita: false,
          usos_total: 89,
          efectividad: 65.2,
          fecha_creacion: "2024-08-20",
          fecha_actualizacion: "2024-09-05",
          creado_por: "Admin",
          estado: "Activa"
        },
        {
          id: 3,
          nombre: "Promoción Motocicletas",
          descripcion: "Plantilla para promociones de motocicletas nuevas",
          tipo: "Marketing",
          canal: "WhatsApp",
          categoria: "Promocional",
          contenido: "🏍️ ¡Hola {nombre}! Tenemos una oferta especial para ti: {descuento}% de descuento en motocicletas nuevas. Válido hasta {fecha_limite}. ¡No te lo pierdas! Visítanos en {empresa}.",
          variables: ["nombre", "descuento", "fecha_limite", "empresa"],
          es_favorita: true,
          usos_total: 324,
          efectividad: 45.8,
          fecha_creacion: "2024-09-01",
          fecha_actualizacion: "2024-09-12",
          creado_por: "Marketing",
          estado: "Activa"
        },
        {
          id: 4,
          nombre: "Recordatorio Mantenimiento",
          descripcion: "Recordatorio para servicios de mantenimiento",
          tipo: "Servicio",
          canal: "SMS",
          categoria: "Amigable",
          contenido: "Hola {nombre}, tu {producto} está próxima a cumplir {kilometraje} km. Es hora del mantenimiento. Agenda tu cita en {empresa}. Tel: {telefono}",
          variables: ["nombre", "producto", "kilometraje", "empresa", "telefono"],
          es_favorita: false,
          usos_total: 67,
          efectividad: 82.1,
          fecha_creacion: "2024-09-05",
          fecha_actualizacion: "2024-09-05",
          creado_por: "Servicio",
          estado: "Activa"
        }
      ];
      setPlantillas(mockPlantillas);
      // Guardar las plantillas mock en localStorage la primera vez
      localStorage.setItem('plantillas_comunicaciones', JSON.stringify(mockPlantillas));
    } catch (err: any) {
      showError(err.message || 'Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlantilla = async () => {
    try {
      // Validaciones
      if (!formData.nombre.trim()) {
        showError('El nombre de la plantilla es requerido');
        return;
      }
      if (!formData.contenido.trim()) {
        showError('El contenido de la plantilla es requerido');
        return;
      }

      // Extraer variables del contenido
      const variablesEncontradas = formData.contenido.match(/\{([^}]+)\}/g)?.map(v => v.slice(1, -1)) || [];

      if (editingPlantilla) {
        // Editar plantilla existente
        const plantillaActualizada: Plantilla = {
          ...editingPlantilla,
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          tipo: formData.tipo,
          canal: formData.canal,
          categoria: formData.categoria,
          contenido: formData.contenido.trim(),
          variables: variablesEncontradas,
          es_favorita: formData.es_favorita,
          fecha_actualizacion: new Date().toISOString().split('T')[0]
        };

        // Actualizar en el estado
        setPlantillas(prev => prev.map(p =>
          p.id === editingPlantilla.id ? plantillaActualizada : p
        ));

        success('Plantilla actualizada exitosamente');
      } else {
        // Crear nueva plantilla
        const nuevaPlantilla: Plantilla = {
          id: Math.max(...plantillas.map(p => p.id), 0) + 1,
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          tipo: formData.tipo,
          canal: formData.canal,
          categoria: formData.categoria,
          contenido: formData.contenido.trim(),
          variables: variablesEncontradas,
          es_favorita: formData.es_favorita,
          usos_total: 0,
          efectividad: 0,
          fecha_creacion: new Date().toISOString().split('T')[0],
          fecha_actualizacion: new Date().toISOString().split('T')[0],
          creado_por: 'Usuario Actual',
          estado: 'Activa'
        };

        // Actualizar estado con la nueva plantilla
        setPlantillas(prev => [...prev, nuevaPlantilla]);

        success('Plantilla guardada exitosamente');
      }

      setShowCreateModal(false);
      setEditingPlantilla(null);
      resetForm();
    } catch (err: any) {
      showError(err.message || 'Error al guardar plantilla');
    }
  };

  const handleDeletePlantilla = async (plantilla: Plantilla) => {
    if (!window.confirm(`¿Estás seguro de eliminar la plantilla "${plantilla.nombre}"?`)) return;

    try {
      // Eliminar del estado local
      setPlantillas(prev => prev.filter(p => p.id !== plantilla.id));
      success('Plantilla eliminada correctamente');
    } catch (err: any) {
      showError(err.message || 'Error al eliminar plantilla');
    }
  };

  const handleToggleFavorita = async (plantilla: Plantilla) => {
    try {
      // Actualizar estado local
      setPlantillas(prev => prev.map(p =>
        p.id === plantilla.id
          ? { ...p, es_favorita: !p.es_favorita }
          : p
      ));
      success(`Plantilla ${plantilla.es_favorita ? 'removida de' : 'agregada a'} favoritas`);
    } catch (err: any) {
      showError(err.message || 'Error al actualizar favorita');
    }
  };

  const handleDuplicarPlantilla = async (plantilla: Plantilla) => {
    setFormData({
      nombre: `${plantilla.nombre} (Copia)`,
      descripcion: plantilla.descripcion,
      tipo: plantilla.tipo,
      canal: plantilla.canal,
      categoria: plantilla.categoria,
      contenido: plantilla.contenido,
      es_favorita: false
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      tipo: 'Marketing',
      canal: 'WhatsApp',
      categoria: 'Amigable',
      contenido: '',
      es_favorita: false
    });
    setEditingPlantilla(null);
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Marketing': return 'bg-blue-100 text-blue-800';
      case 'Cobranza': return 'bg-red-100 text-red-800';
      case 'Recordatorio': return 'bg-yellow-100 text-yellow-800';
      case 'Promocion': return 'bg-purple-100 text-purple-800';
      case 'Servicio': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Formal': return 'bg-gray-100 text-gray-800';
      case 'Amigable': return 'bg-green-100 text-green-800';
      case 'Urgente': return 'bg-red-100 text-red-800';
      case 'Promocional': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCanalIcon = (canal: string) => {
    switch (canal) {
      case 'WhatsApp': return <MessageCircle className="h-4 w-4 text-green-600" />;
      case 'Email': return <Mail className="h-4 w-4 text-blue-600" />;
      case 'SMS': return <Phone className="h-4 w-4 text-purple-600" />;
      case 'Telegram': return <MessageSquare className="h-4 w-4 text-cyan-600" />;
      case 'Universal': return <Users className="h-4 w-4 text-gray-600" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const renderPreview = (contenido: string) => {
    let preview = contenido;
    Object.entries(previewData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return preview;
  };

  const filteredPlantillas = plantillas.filter(plantilla => {
    const matchesSearch = plantilla.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plantilla.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plantilla.contenido.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filtroTipo === 'all' || plantilla.tipo === filtroTipo;
    const matchesCanal = filtroCanal === 'all' || plantilla.canal === filtroCanal;
    const matchesCategoria = filtroCategoria === 'all' || plantilla.categoria === filtroCategoria;
    const matchesFavorita = !soloFavoritas || plantilla.es_favorita;

    return matchesSearch && matchesTipo && matchesCanal && matchesCategoria && matchesFavorita;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <MessageCircle className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Plantillas de Mensajes
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPlantillas}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Plantilla
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar plantillas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Todos los tipos</option>
          <option value="Marketing">Marketing</option>
          <option value="Cobranza">Cobranza</option>
          <option value="Recordatorio">Recordatorio</option>
          <option value="Promocion">Promoción</option>
          <option value="Servicio">Servicio</option>
        </select>

        <select
          value={filtroCanal}
          onChange={(e) => setFiltroCanal(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Todos los canales</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Email">Email</option>
          <option value="SMS">SMS</option>
          <option value="Telegram">Telegram</option>
          <option value="Universal">Universal</option>
        </select>

        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Todas las categorías</option>
          <option value="Formal">Formal</option>
          <option value="Amigable">Amigable</option>
          <option value="Urgente">Urgente</option>
          <option value="Promocional">Promocional</option>
        </select>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="solo_favoritas"
            checked={soloFavoritas}
            onChange={(e) => setSoloFavoritas(e.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500 mr-2"
          />
          <label htmlFor="solo_favoritas" className="text-sm text-gray-700 dark:text-gray-300">
            Solo favoritas
          </label>
        </div>
      </div>

      {/* Lista de plantillas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
          ))}
        </div>
      ) : filteredPlantillas.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No se encontraron plantillas
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlantillas.map((plantilla) => (
            <div key={plantilla.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              {/* Header de la card */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  {getCanalIcon(plantilla.canal)}
                  <h3 className="ml-2 text-sm font-medium text-gray-900 dark:text-white truncate">
                    {plantilla.nombre}
                  </h3>
                </div>
                <button
                  onClick={() => handleToggleFavorita(plantilla)}
                  className={`p-1 rounded ${
                    plantilla.es_favorita
                      ? 'text-yellow-500 hover:text-yellow-600'
                      : 'text-gray-400 hover:text-yellow-500'
                  }`}
                >
                  <Star className={`h-4 w-4 ${plantilla.es_favorita ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Descripción */}
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {plantilla.descripcion}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(plantilla.tipo)}`}>
                  {plantilla.tipo}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoriaColor(plantilla.categoria)}`}>
                  {plantilla.categoria}
                </span>
              </div>

              {/* Preview del contenido */}
              <div className="bg-white dark:bg-gray-800 rounded p-3 mb-3 border">
                <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">
                  {plantilla.contenido}
                </p>
              </div>

              {/* Estadísticas */}
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span>Usos: {plantilla.usos_total}</span>
                <span>Efectividad: {plantilla.efectividad.toFixed(1)}%</span>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedPlantilla(plantilla);
                      setShowPreviewModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Vista previa"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicarPlantilla(plantilla)}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="Duplicar"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingPlantilla(plantilla);
                      setFormData({
                        nombre: plantilla.nombre,
                        descripcion: plantilla.descripcion,
                        tipo: plantilla.tipo,
                        canal: plantilla.canal,
                        categoria: plantilla.categoria,
                        contenido: plantilla.contenido,
                        es_favorita: plantilla.es_favorita
                      });
                      setShowCreateModal(true);
                    }}
                    className="text-orange-600 hover:text-orange-800 p-1"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => handleDeletePlantilla(plantilla)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de crear/editar plantilla */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[99999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingPlantilla ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulario */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre de la Plantilla
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: Recordatorio Pago Amigable"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      rows={2}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Descripción de la plantilla..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo
                      </label>
                      <select
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="Marketing">Marketing</option>
                        <option value="Cobranza">Cobranza</option>
                        <option value="Recordatorio">Recordatorio</option>
                        <option value="Promocion">Promoción</option>
                        <option value="Servicio">Servicio</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Canal
                      </label>
                      <select
                        value={formData.canal}
                        onChange={(e) => setFormData({ ...formData, canal: e.target.value as any })}
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Email">Email</option>
                        <option value="SMS">SMS</option>
                        <option value="Telegram">Telegram</option>
                        <option value="Universal">Universal</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoría
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Formal">Formal</option>
                      <option value="Amigable">Amigable</option>
                      <option value="Urgente">Urgente</option>
                      <option value="Promocional">Promocional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contenido del Mensaje
                    </label>
                    <textarea
                      value={formData.contenido}
                      onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                      rows={8}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                      placeholder="Escriba el contenido de su mensaje aquí..."
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Variables disponibles: {'{nombre}'}, {'{deuda}'}, {'{empresa}'}, {'{fecha}'}, {'{producto}'}, {'{dias_vencido}'}, {'{telefono}'}
                    </p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="es_favorita"
                      checked={formData.es_favorita}
                      onChange={(e) => setFormData({ ...formData, es_favorita: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="es_favorita" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Marcar como favorita
                    </label>
                  </div>
                </div>

                {/* Vista previa */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Vista Previa</h4>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border">
                    <div className="flex items-center mb-3">
                      {getCanalIcon(formData.canal)}
                      <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formData.canal}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border min-h-[200px]">
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {formData.contenido ? renderPreview(formData.contenido) : 'Escriba contenido para ver la vista previa...'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                      Datos de ejemplo utilizados:
                    </h5>
                    <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                      <div>Nombre: {previewData.nombre}</div>
                      <div>Deuda: {previewData.deuda}</div>
                      <div>Empresa: {previewData.empresa}</div>
                      <div>Fecha: {previewData.fecha}</div>
                      <div>Producto: {previewData.producto}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePlantilla}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2 inline" />
                {editingPlantilla ? 'Actualizar' : 'Guardar'} Plantilla
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de vista previa */}
      {showPreviewModal && selectedPlantilla && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[99999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Vista Previa: {selectedPlantilla.nombre}
                </h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                {getCanalIcon(selectedPlantilla.canal)}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedPlantilla.canal}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(selectedPlantilla.tipo)}`}>
                  {selectedPlantilla.tipo}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoriaColor(selectedPlantilla.categoria)}`}>
                  {selectedPlantilla.categoria}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Contenido Original:</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
                  {selectedPlantilla.contenido}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Vista Previa con Datos:</h4>
                <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                  {renderPreview(selectedPlantilla.contenido)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Variables detectadas:</span>
                  <div className="mt-1">
                    {selectedPlantilla.variables.map((variable, index) => (
                      <span key={index} className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-xs mr-1 mb-1">
                        {'{' + variable + '}'}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Estadísticas:</span>
                  <div className="mt-1 space-y-1">
                    <div>Usos: {selectedPlantilla.usos_total}</div>
                    <div>Efectividad: {selectedPlantilla.efectividad.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ToastContainer />
    </div>
  );
};

export default PlantillasManager;