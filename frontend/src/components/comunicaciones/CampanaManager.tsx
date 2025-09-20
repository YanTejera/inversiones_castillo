import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { communicationAnalytics } from '../../services/communicationAnalytics';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Send,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  MessageSquare,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Target,
  Settings,
  Copy,
  Download,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../Toast';

interface Promocion {
  activa: boolean;
  tipo: 'porcentaje' | 'monto_fijo' | 'regalo';
  valor: number;
  descripcion: string;
  codigo_promocional: string;
  condiciones: {
    monto_minimo?: number;
    productos_incluidos?: string[];
    solo_primera_compra?: boolean;
    fecha_inicio: string;
    fecha_fin: string;
  };
  usos_maximos?: number;
  usos_actuales: number;
  aplicacion_automatica: boolean;
}

interface Campana {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: 'Cobranza' | 'Marketing' | 'Recordatorio' | 'Promocion';
  canal: 'WhatsApp' | 'Email' | 'SMS' | 'Telegram' | 'Todos';
  estado: 'Borrador' | 'Programada' | 'Activa' | 'Pausada' | 'Completada' | 'Cancelada';
  segmento_objetivo: string[];
  plantilla_id: number | null;
  contenido: string;
  fecha_creacion: string;
  fecha_programada: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  destinatarios_total: number;
  enviados: number;
  entregados: number;
  leidos: number;
  respondidos: number;
  conversiones: number;
  tasa_apertura: number;
  tasa_respuesta: number;
  tasa_conversion: number;
  costo_estimado: number;
  roi: number;
  creado_por: string;
  promocion?: Promocion;
}

interface CampanaForm {
  nombre: string;
  descripcion: string;
  tipo: 'Cobranza' | 'Marketing' | 'Recordatorio' | 'Promocion';
  canal: 'WhatsApp' | 'Email' | 'SMS' | 'Telegram' | 'Todos';
  segmento_objetivo: string[];
  contenido: string;
  fecha_programada: string;
  hora_programada: string;
  envio_inmediato: boolean;
  incluir_promocion: boolean;
  promocion: {
    tipo: 'porcentaje' | 'monto_fijo' | 'regalo';
    valor: number;
    descripcion: string;
    codigo_promocional: string;
    monto_minimo: number;
    solo_primera_compra: boolean;
    fecha_inicio: string;
    fecha_fin: string;
    usos_maximos: number;
    aplicacion_automatica: boolean;
  };
}

const CampanaManager: React.FC = () => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();

  // Estados principales
  const [loading, setLoading] = useState(false);
  const [campanas, setCampanas] = useState<Campana[]>([]);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('all');
  const [filtroCanal, setFiltroCanal] = useState<string>('all');
  const [filtroEstado, setFiltroEstado] = useState<string>('all');

  // Estados de modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCampana, setSelectedCampana] = useState<Campana | null>(null);
  const [editingCampana, setEditingCampana] = useState<Campana | null>(null);

  // Estados del formulario
  const [formData, setFormData] = useState<CampanaForm>({
    nombre: '',
    descripcion: '',
    tipo: 'Marketing',
    canal: 'WhatsApp',
    segmento_objetivo: [],
    contenido: '',
    fecha_programada: '',
    hora_programada: '',
    envio_inmediato: false,
    incluir_promocion: false,
    promocion: {
      tipo: 'porcentaje',
      valor: 0,
      descripcion: '',
      codigo_promocional: '',
      monto_minimo: 0,
      solo_primera_compra: false,
      fecha_inicio: '',
      fecha_fin: '',
      usos_maximos: 0,
      aplicacion_automatica: true
    }
  });

  useEffect(() => {
    loadCampanas();
  }, []);

  // Cargar datos en el formulario cuando se edita una campaña
  useEffect(() => {
    if (editingCampana) {
      setFormData({
        nombre: editingCampana.nombre,
        descripcion: editingCampana.descripcion,
        tipo: editingCampana.tipo,
        canal: editingCampana.canal,
        segmento_objetivo: editingCampana.segmento_objetivo,
        contenido: editingCampana.contenido,
        fecha_programada: editingCampana.fecha_programada ? editingCampana.fecha_programada.split('T')[0] : '',
        hora_programada: editingCampana.fecha_programada ? editingCampana.fecha_programada.split('T')[1]?.slice(0, 5) || '' : '',
        envio_inmediato: !editingCampana.fecha_programada,
        incluir_promocion: !!editingCampana.promocion,
        promocion: editingCampana.promocion ? {
          tipo: editingCampana.promocion.tipo,
          valor: editingCampana.promocion.valor,
          descripcion: editingCampana.promocion.descripcion,
          codigo_promocional: editingCampana.promocion.codigo_promocional,
          monto_minimo: editingCampana.promocion.condiciones.monto_minimo || 0,
          solo_primera_compra: editingCampana.promocion.condiciones.solo_primera_compra || false,
          fecha_inicio: editingCampana.promocion.condiciones.fecha_inicio,
          fecha_fin: editingCampana.promocion.condiciones.fecha_fin,
          usos_maximos: editingCampana.promocion.usos_maximos || 0,
          aplicacion_automatica: editingCampana.promocion.aplicacion_automatica
        } : {
          tipo: 'porcentaje',
          valor: 0,
          descripcion: '',
          codigo_promocional: '',
          monto_minimo: 0,
          solo_primera_compra: false,
          fecha_inicio: '',
          fecha_fin: '',
          usos_maximos: 0,
          aplicacion_automatica: true
        }
      });
    }
  }, [editingCampana]);

  // Función para generar código promocional
  const generarCodigoPromocional = (nombre: string, tipo: string) => {
    const prefijo = tipo === 'Marketing' ? 'PROMO' :
                    tipo === 'Promocion' ? 'DESC' : 'CAMP';
    const nombreLimpio = nombre.replace(/\s+/g, '').substring(0, 6).toUpperCase();
    const numero = Math.floor(Math.random() * 100);
    return `${prefijo}${nombreLimpio}${numero}`;
  };

  const loadCampanas = async () => {
    try {
      setLoading(true);

      // Cargar campañas desde localStorage
      const savedCampanas = localStorage.getItem('campanas_comunicaciones');
      if (savedCampanas) {
        const campanasData = JSON.parse(savedCampanas);
        setCampanas(campanasData);
        setLoading(false);
        return;
      }

      // Datos mock solo la primera vez
      const mockCampanas: Campana[] = [
        {
          id: 1,
          nombre: "Promoción Motocicletas Septiembre",
          descripcion: "Campaña de promoción para motocicletas nuevas con descuentos especiales",
          tipo: "Marketing",
          canal: "WhatsApp",
          estado: "Activa",
          segmento_objetivo: ["VIP", "Regular"],
          plantilla_id: 1,
          contenido: "🏍️ ¡Oferta especial! Descuento del 15% en motocicletas nuevas. Solo en septiembre.",
          fecha_creacion: "2024-09-15",
          fecha_programada: "2024-09-16",
          fecha_inicio: "2024-09-16",
          fecha_fin: null,
          destinatarios_total: 500,
          enviados: 450,
          entregados: 440,
          leidos: 380,
          respondidos: 95,
          conversiones: 23,
          tasa_apertura: 86.4,
          tasa_respuesta: 25.0,
          tasa_conversion: 5.1,
          costo_estimado: 2500,
          roi: 345.8,
          creado_por: "Admin"
        },
        {
          id: 2,
          nombre: "Recordatorio Pagos Pendientes",
          descripcion: "Recordatorio automático para clientes con pagos vencidos",
          tipo: "Cobranza",
          canal: "SMS",
          estado: "Completada",
          segmento_objetivo: ["Moroso"],
          plantilla_id: 2,
          contenido: "Estimado cliente, le recordamos que tiene un pago pendiente. Favor comunicarse.",
          fecha_creacion: "2024-09-10",
          fecha_programada: "2024-09-11",
          fecha_inicio: "2024-09-11",
          fecha_fin: "2024-09-11",
          destinatarios_total: 89,
          enviados: 89,
          entregados: 87,
          leidos: 75,
          respondidos: 34,
          conversiones: 12,
          tasa_apertura: 86.2,
          tasa_respuesta: 45.3,
          tasa_conversion: 13.5,
          costo_estimado: 450,
          roi: 2800.0,
          creado_por: "Admin"
        },
        {
          id: 3,
          nombre: "Invitación Evento Aniversario",
          descripcion: "Invitación exclusiva para evento del 5to aniversario",
          tipo: "Promocion",
          canal: "Email",
          estado: "Programada",
          segmento_objetivo: ["VIP"],
          plantilla_id: 3,
          contenido: "Te invitamos a celebrar nuestro 5to aniversario. Evento especial con sorpresas.",
          fecha_creacion: "2024-09-14",
          fecha_programada: "2024-09-25",
          fecha_inicio: null,
          fecha_fin: null,
          destinatarios_total: 150,
          enviados: 0,
          entregados: 0,
          leidos: 0,
          respondidos: 0,
          conversiones: 0,
          tasa_apertura: 0,
          tasa_respuesta: 0,
          tasa_conversion: 0,
          costo_estimado: 75,
          roi: 0,
          creado_por: "Marketing"
        }
      ];
      setCampanas(mockCampanas);
      // Guardar las campañas mock en localStorage la primera vez
      localStorage.setItem('campanas_comunicaciones', JSON.stringify(mockCampanas));
    } catch (err: any) {
      showError(err.message || 'Error al cargar campañas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampana = async () => {
    try {
      // Validaciones
      if (!formData.nombre.trim()) {
        showError('El nombre de la campaña es requerido');
        return;
      }
      if (!formData.contenido.trim()) {
        showError('El contenido de la campaña es requerido');
        return;
      }
      if (!formData.envio_inmediato && !formData.fecha_programada) {
        showError('Debe seleccionar una fecha de envío o marcarlo como inmediato');
        return;
      }

      // Validaciones adicionales para promociones
      if (formData.incluir_promocion) {
        if (!formData.promocion.codigo_promocional.trim()) {
          showError('El código promocional es requerido');
          return;
        }
        if (formData.promocion.tipo !== 'regalo' && formData.promocion.valor <= 0) {
          showError('El valor del descuento debe ser mayor a 0');
          return;
        }
        if (formData.promocion.tipo === 'porcentaje' && formData.promocion.valor > 100) {
          showError('El porcentaje de descuento no puede ser mayor a 100%');
          return;
        }
        if (!formData.promocion.fecha_inicio || !formData.promocion.fecha_fin) {
          showError('Las fechas de inicio y fin de la promoción son requeridas');
          return;
        }
        if (new Date(formData.promocion.fecha_inicio) >= new Date(formData.promocion.fecha_fin)) {
          showError('La fecha de fin debe ser posterior a la fecha de inicio');
          return;
        }
        if (formData.promocion.tipo === 'regalo' && !formData.promocion.descripcion.trim()) {
          showError('La descripción del regalo es requerida');
          return;
        }
      }

      // Crear objeto de campaña
      const fechaProgramadaCompleta = formData.fecha_programada && formData.hora_programada
        ? `${formData.fecha_programada}T${formData.hora_programada}:00`
        : formData.fecha_programada ? `${formData.fecha_programada}T00:00:00` : null;

      if (editingCampana) {
        // Actualizar campaña existente
        const campanaActualizada: Campana = {
          ...editingCampana,
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          tipo: formData.tipo,
          canal: formData.canal,
          segmento_objetivo: formData.segmento_objetivo,
          contenido: formData.contenido.trim(),
          fecha_programada: fechaProgramadaCompleta,
          promocion: formData.incluir_promocion ? {
            activa: true,
            tipo: formData.promocion.tipo,
            valor: formData.promocion.valor,
            descripcion: formData.promocion.descripcion || formData.nombre,
            codigo_promocional: formData.promocion.codigo_promocional,
            condiciones: {
              monto_minimo: formData.promocion.monto_minimo,
              solo_primera_compra: formData.promocion.solo_primera_compra,
              fecha_inicio: formData.promocion.fecha_inicio,
              fecha_fin: formData.promocion.fecha_fin
            },
            usos_maximos: formData.promocion.usos_maximos,
            usos_actuales: editingCampana.promocion?.usos_actuales || 0,
            aplicacion_automatica: formData.promocion.aplicacion_automatica
          } : undefined
        };

        // Actualizar en localStorage
        const campanasActualizadas = campanas.map(c =>
          c.id === editingCampana.id ? campanaActualizada : c
        );
        setCampanas(campanasActualizadas);
        localStorage.setItem('campanas_comunicaciones', JSON.stringify(campanasActualizadas));

        // Tracking de analytics para actualización de campaña
        communicationAnalytics.trackCampaignCreated({
          campaign_id: editingCampana.id.toString(),
          campaign_name: formData.nombre.trim(),
          campaign_type: formData.tipo,
          channel: formData.canal.toLowerCase() as 'whatsapp' | 'email' | 'sms',
          has_promotion: formData.incluir_promocion,
          promotion_type: formData.incluir_promocion ? formData.promocion.tipo : undefined,
          promotion_value: formData.incluir_promocion ? formData.promocion.valor : undefined,
          is_scheduled: !formData.envio_inmediato,
          action_type: 'updated'
        });

        success('Campaña actualizada exitosamente');
      } else {
        // Crear nueva campaña
        const nuevaCampana: Campana = {
          id: Math.max(...campanas.map(c => c.id), 0) + 1,
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          tipo: formData.tipo,
          canal: formData.canal,
          estado: formData.envio_inmediato ? 'Activa' : 'Programada',
          segmento_objetivo: formData.segmento_objetivo,
          plantilla_id: null,
          contenido: formData.contenido.trim(),
          fecha_creacion: new Date().toISOString().split('T')[0],
          fecha_programada: fechaProgramadaCompleta,
          fecha_inicio: formData.envio_inmediato ? new Date().toISOString().split('T')[0] : null,
          fecha_fin: null,
          destinatarios_total: 0,
          enviados: 0,
          entregados: 0,
          leidos: 0,
          respondidos: 0,
          conversiones: 0,
          tasa_apertura: 0,
          tasa_respuesta: 0,
          tasa_conversion: 0,
          costo_estimado: 0,
          roi: 0,
          creado_por: 'Usuario Actual',
          promocion: formData.incluir_promocion ? {
            activa: true,
            tipo: formData.promocion.tipo,
            valor: formData.promocion.valor,
            descripcion: formData.promocion.descripcion || formData.nombre,
            codigo_promocional: formData.promocion.codigo_promocional,
            condiciones: {
              monto_minimo: formData.promocion.monto_minimo,
              solo_primera_compra: formData.promocion.solo_primera_compra,
              fecha_inicio: formData.promocion.fecha_inicio,
              fecha_fin: formData.promocion.fecha_fin
            },
            usos_maximos: formData.promocion.usos_maximos,
            usos_actuales: 0,
            aplicacion_automatica: formData.promocion.aplicacion_automatica
          } : undefined
        };

        // Guardar en localStorage
        const campanasActualizadas = [...campanas, nuevaCampana];
        setCampanas(campanasActualizadas);
        localStorage.setItem('campanas_comunicaciones', JSON.stringify(campanasActualizadas));

        // Tracking de analytics para nueva campaña
        communicationAnalytics.trackCampaignCreated({
          campaign_id: nuevaCampana.id.toString(),
          campaign_name: formData.nombre.trim(),
          campaign_type: formData.tipo,
          channel: formData.canal.toLowerCase() as 'whatsapp' | 'email' | 'sms',
          has_promotion: formData.incluir_promocion,
          promotion_type: formData.incluir_promocion ? formData.promocion.tipo : undefined,
          promotion_value: formData.incluir_promocion ? formData.promocion.valor : undefined,
          is_scheduled: !formData.envio_inmediato,
          action_type: 'created'
        });

        success('Campaña creada exitosamente');
      }

      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      showError(err.message || 'Error al crear campaña');
    }
  };

  const handleDeleteCampana = async (campana: Campana) => {
    if (!window.confirm(`¿Estás seguro de eliminar la campaña "${campana.nombre}"?`)) return;

    try {
      // Aquí iría la llamada real a la API
      success('Campaña eliminada correctamente');
      loadCampanas();
    } catch (err: any) {
      showError(err.message || 'Error al eliminar campaña');
    }
  };

  const handlePausarCampana = async (campana: Campana) => {
    try {
      // Aquí iría la llamada real a la API
      success(`Campaña ${campana.estado === 'Activa' ? 'pausada' : 'reanudada'} correctamente`);
      loadCampanas();
    } catch (err: any) {
      showError(err.message || 'Error al cambiar estado de campaña');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      tipo: 'Marketing',
      canal: 'WhatsApp',
      segmento_objetivo: [],
      contenido: '',
      fecha_programada: '',
      hora_programada: '',
      envio_inmediato: false,
      incluir_promocion: false,
      promocion: {
        tipo: 'porcentaje',
        valor: 0,
        descripcion: '',
        codigo_promocional: '',
        monto_minimo: 0,
        solo_primera_compra: false,
        fecha_inicio: '',
        fecha_fin: '',
        usos_maximos: 0,
        aplicacion_automatica: true
      }
    });
    setEditingCampana(null);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activa': return 'bg-green-100 text-green-800';
      case 'Programada': return 'bg-blue-100 text-blue-800';
      case 'Completada': return 'bg-gray-100 text-gray-800';
      case 'Pausada': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelada': return 'bg-red-100 text-red-800';
      case 'Borrador': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Marketing': return 'bg-blue-100 text-blue-800';
      case 'Cobranza': return 'bg-red-100 text-red-800';
      case 'Recordatorio': return 'bg-yellow-100 text-yellow-800';
      case 'Promocion': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCanalIcon = (canal: string) => {
    switch (canal) {
      case 'WhatsApp': return <MessageCircle className="h-4 w-4 text-green-600" />;
      case 'Email': return <Mail className="h-4 w-4 text-blue-600" />;
      case 'SMS': return <Phone className="h-4 w-4 text-purple-600" />;
      case 'Telegram': return <MessageSquare className="h-4 w-4 text-cyan-600" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredCampanas = campanas.filter(campana => {
    const matchesSearch = campana.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campana.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filtroTipo === 'all' || campana.tipo === filtroTipo;
    const matchesCanal = filtroCanal === 'all' || campana.canal === filtroCanal;
    const matchesEstado = filtroEstado === 'all' || campana.estado === filtroEstado;

    return matchesSearch && matchesTipo && matchesCanal && matchesEstado;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Megaphone className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Gestión de Campañas
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={loadCampanas}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Campaña
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar campañas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Todos los tipos</option>
          <option value="Marketing">Marketing</option>
          <option value="Cobranza">Cobranza</option>
          <option value="Recordatorio">Recordatorio</option>
          <option value="Promocion">Promoción</option>
        </select>

        <select
          value={filtroCanal}
          onChange={(e) => setFiltroCanal(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Todos los canales</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Email">Email</option>
          <option value="SMS">SMS</option>
          <option value="Telegram">Telegram</option>
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Todos los estados</option>
          <option value="Borrador">Borrador</option>
          <option value="Programada">Programada</option>
          <option value="Activa">Activa</option>
          <option value="Pausada">Pausada</option>
          <option value="Completada">Completada</option>
          <option value="Cancelada">Cancelada</option>
        </select>
      </div>

      {/* Lista de campañas */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-24 rounded-lg"></div>
          ))}
        </div>
      ) : filteredCampanas.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No se encontraron campañas
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Campaña
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo/Canal
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Progreso
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rendimiento
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCampanas.map((campana) => (
                <tr key={campana.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {campana.nombre}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {campana.descripcion}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Creada: {new Date(campana.fecha_creacion).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </td>

                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(campana.tipo)}`}>
                        {campana.tipo}
                      </span>
                      <div className="flex items-center">
                        {getCanalIcon(campana.canal)}
                        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{campana.canal}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(campana.estado)}`}>
                      {campana.estado}
                    </span>
                    {campana.fecha_programada && campana.estado === 'Programada' && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(campana.fecha_programada).toLocaleDateString('es-ES')}
                      </div>
                    )}
                  </td>

                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Enviados:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {campana.enviados}/{campana.destinatarios_total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${campana.destinatarios_total > 0 ? (campana.enviados / campana.destinatarios_total) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Apertura:</span>
                        <span className="font-medium">{campana.tasa_apertura.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Respuesta:</span>
                        <span className="font-medium">{campana.tasa_respuesta.toFixed(1)}%</span>
                      </div>
                      {campana.roi > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">ROI:</span>
                          <span className="font-medium text-green-600">{campana.roi.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedCampana(campana);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {(campana.estado === 'Activa' || campana.estado === 'Pausada') && (
                        <button
                          onClick={() => handlePausarCampana(campana)}
                          className={`p-1 ${
                            campana.estado === 'Activa'
                              ? 'text-yellow-600 hover:text-yellow-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={campana.estado === 'Activa' ? 'Pausar' : 'Reanudar'}
                        >
                          {campana.estado === 'Activa' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                      )}

                      {(campana.estado === 'Borrador' || campana.estado === 'Programada') && (
                        <button
                          onClick={() => {
                            setEditingCampana(campana);
                            setShowCreateModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteCampana(campana)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de crear/editar campaña */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[99999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCampana ? 'Editar Campaña' : 'Nueva Campaña'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre de la Campaña
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ej: Promoción Septiembre 2024"
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
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Descripción de la campaña..."
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Campaña
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Marketing">Marketing</option>
                    <option value="Cobranza">Cobranza</option>
                    <option value="Recordatorio">Recordatorio</option>
                    <option value="Promocion">Promoción</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Canal de Comunicación
                  </label>
                  <select
                    value={formData.canal}
                    onChange={(e) => setFormData({ ...formData, canal: e.target.value as any })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="Telegram">Telegram</option>
                    <option value="Todos">Todos los canales</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contenido del Mensaje
                </label>
                <textarea
                  value={formData.contenido}
                  onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                  rows={4}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Escriba el contenido de su mensaje aquí..."
                  required
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Puede usar variables como {'{nombre}'}, {'{deuda}'}, {'{empresa}'}
                </p>
              </div>

              {/* Sección de Promoción */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="incluir_promocion"
                    checked={formData.incluir_promocion}
                    onChange={(e) => {
                      const incluir = e.target.checked;
                      setFormData({
                        ...formData,
                        incluir_promocion: incluir,
                        promocion: {
                          ...formData.promocion,
                          codigo_promocional: incluir && !formData.promocion.codigo_promocional
                            ? generarCodigoPromocional(formData.nombre || 'NUEVA', formData.tipo)
                            : formData.promocion.codigo_promocional
                        }
                      });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="incluir_promocion" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Incluir promoción/descuento en esta campaña
                  </label>
                </div>

                {formData.incluir_promocion && (
                  <div className="space-y-4 bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                    <h4 className="text-md font-medium text-blue-900 dark:text-blue-200">Configuración de Promoción</h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Tipo de Descuento
                        </label>
                        <select
                          value={formData.promocion.tipo}
                          onChange={(e) => setFormData({
                            ...formData,
                            promocion: { ...formData.promocion, tipo: e.target.value as any }
                          })}
                          className="w-full rounded-md border-blue-300 dark:border-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-blue-800 text-gray-900 dark:text-white"
                        >
                          <option value="porcentaje">Porcentaje (%)</option>
                          <option value="monto_fijo">Monto Fijo ($)</option>
                          <option value="regalo">Regalo/Obsequio</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                          {formData.promocion.tipo === 'porcentaje' ? 'Porcentaje' :
                           formData.promocion.tipo === 'monto_fijo' ? 'Monto' : 'Descripción del Regalo'}
                        </label>
                        {formData.promocion.tipo === 'regalo' ? (
                          <input
                            type="text"
                            value={formData.promocion.descripcion}
                            onChange={(e) => setFormData({
                              ...formData,
                              promocion: { ...formData.promocion, descripcion: e.target.value }
                            })}
                            className="w-full rounded-md border-blue-300 dark:border-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-blue-800 text-gray-900 dark:text-white"
                            placeholder="Ej: Casco gratis"
                          />
                        ) : (
                          <input
                            type="number"
                            value={formData.promocion.valor}
                            onChange={(e) => setFormData({
                              ...formData,
                              promocion: { ...formData.promocion, valor: parseFloat(e.target.value) || 0 }
                            })}
                            className="w-full rounded-md border-blue-300 dark:border-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-blue-800 text-gray-900 dark:text-white"
                            placeholder={formData.promocion.tipo === 'porcentaje' ? '10' : '5000'}
                            min="0"
                            max={formData.promocion.tipo === 'porcentaje' ? '100' : undefined}
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Código Promocional
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            value={formData.promocion.codigo_promocional}
                            onChange={(e) => setFormData({
                              ...formData,
                              promocion: { ...formData.promocion, codigo_promocional: e.target.value.toUpperCase() }
                            })}
                            className="flex-1 rounded-l-md border-blue-300 dark:border-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-blue-800 text-gray-900 dark:text-white"
                            placeholder="DESCUENTO10"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              promocion: {
                                ...formData.promocion,
                                codigo_promocional: generarCodigoPromocional(formData.nombre || 'NUEVA', formData.tipo)
                              }
                            })}
                            className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 text-sm"
                          >
                            Generar
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Compra Mínima ($)
                        </label>
                        <input
                          type="number"
                          value={formData.promocion.monto_minimo}
                          onChange={(e) => setFormData({
                            ...formData,
                            promocion: { ...formData.promocion, monto_minimo: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full rounded-md border-blue-300 dark:border-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-blue-800 text-gray-900 dark:text-white"
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Fecha de Inicio
                        </label>
                        <input
                          type="date"
                          value={formData.promocion.fecha_inicio}
                          onChange={(e) => setFormData({
                            ...formData,
                            promocion: { ...formData.promocion, fecha_inicio: e.target.value }
                          })}
                          className="w-full rounded-md border-blue-300 dark:border-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-blue-800 text-gray-900 dark:text-white"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Fecha de Fin
                        </label>
                        <input
                          type="date"
                          value={formData.promocion.fecha_fin}
                          onChange={(e) => setFormData({
                            ...formData,
                            promocion: { ...formData.promocion, fecha_fin: e.target.value }
                          })}
                          className="w-full rounded-md border-blue-300 dark:border-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-blue-800 text-gray-900 dark:text-white"
                          min={formData.promocion.fecha_inicio || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Usos Máximos (0 = ilimitado)
                        </label>
                        <input
                          type="number"
                          value={formData.promocion.usos_maximos}
                          onChange={(e) => setFormData({
                            ...formData,
                            promocion: { ...formData.promocion, usos_maximos: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full rounded-md border-blue-300 dark:border-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-blue-800 text-gray-900 dark:text-white"
                          placeholder="100"
                          min="0"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="solo_primera_compra"
                            checked={formData.promocion.solo_primera_compra}
                            onChange={(e) => setFormData({
                              ...formData,
                              promocion: { ...formData.promocion, solo_primera_compra: e.target.checked }
                            })}
                            className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="solo_primera_compra" className="ml-2 text-sm text-blue-800 dark:text-blue-200">
                            Solo para primera compra
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="aplicacion_automatica"
                            checked={formData.promocion.aplicacion_automatica}
                            onChange={(e) => setFormData({
                              ...formData,
                              promocion: { ...formData.promocion, aplicacion_automatica: e.target.checked }
                            })}
                            className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="aplicacion_automatica" className="ml-2 text-sm text-blue-800 dark:text-blue-200">
                            Aplicación automática en ventas
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Vista previa del código en el mensaje */}
                    {formData.promocion.codigo_promocional && (
                      <div className="bg-white dark:bg-blue-800 rounded-lg p-3 border border-blue-200 dark:border-blue-600">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                          Vista previa en el mensaje:
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          "... Usa el código <strong className="text-blue-600 dark:text-blue-400">{formData.promocion.codigo_promocional}</strong> y obtén{' '}
                          {formData.promocion.tipo === 'porcentaje' && `${formData.promocion.valor}% de descuento`}
                          {formData.promocion.tipo === 'monto_fijo' && `$${formData.promocion.valor.toLocaleString()} de descuento`}
                          {formData.promocion.tipo === 'regalo' && `${formData.promocion.descripcion || 'un regalo especial'}`}
                          {formData.promocion.fecha_fin && ` válido hasta ${new Date(formData.promocion.fecha_fin).toLocaleDateString('es-ES')}`}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="envio_inmediato"
                    checked={formData.envio_inmediato}
                    onChange={(e) => setFormData({ ...formData, envio_inmediato: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="envio_inmediato" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enviar inmediatamente
                  </label>
                </div>

                {!formData.envio_inmediato && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Envío
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_programada}
                        onChange={(e) => setFormData({ ...formData, fecha_programada: e.target.value })}
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hora de Envío
                      </label>
                      <input
                        type="time"
                        value={formData.hora_programada}
                        onChange={(e) => setFormData({ ...formData, hora_programada: e.target.value })}
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
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
                onClick={handleCreateCampana}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
              >
                {editingCampana ? 'Actualizar' : 'Crear'} Campaña
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de detalles de campaña */}
      {showDetailsModal && selectedCampana && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[99999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Detalles de la Campaña: {selectedCampana.nombre}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información general */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Información General</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Nombre:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedCampana.nombre}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Descripción:</span>
                        <span className="text-sm text-gray-900 dark:text-white text-right">{selectedCampana.descripcion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tipo:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(selectedCampana.tipo)}`}>
                          {selectedCampana.tipo}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Canal:</span>
                        <div className="flex items-center">
                          {getCanalIcon(selectedCampana.canal)}
                          <span className="ml-1 text-sm text-gray-900 dark:text-white">{selectedCampana.canal}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Estado:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(selectedCampana.estado)}`}>
                          {selectedCampana.estado}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Creado por:</span>
                        <span className="text-sm text-gray-900 dark:text-white">{selectedCampana.creado_por}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fechas importantes */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Fechas</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Fecha de creación:</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {new Date(selectedCampana.fecha_creacion).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      {selectedCampana.fecha_programada && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Fecha programada:</span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {new Date(selectedCampana.fecha_programada).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      )}
                      {selectedCampana.fecha_inicio && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Fecha de inicio:</span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {new Date(selectedCampana.fecha_inicio).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      )}
                      {selectedCampana.fecha_fin && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Fecha de fin:</span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {new Date(selectedCampana.fecha_fin).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contenido del mensaje */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contenido del Mensaje</h4>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {selectedCampana.contenido}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estadísticas y métricas */}
                <div className="space-y-6">
                  {/* Progreso de envío */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Progreso de Envío</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Enviados:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedCampana.enviados} / {selectedCampana.destinatarios_total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${selectedCampana.destinatarios_total > 0 ? (selectedCampana.enviados / selectedCampana.destinatarios_total) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-lg font-bold text-green-600">{selectedCampana.entregados}</div>
                          <div className="text-gray-600 dark:text-gray-400">Entregados</div>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">{selectedCampana.leidos}</div>
                          <div className="text-gray-600 dark:text-gray-400">Leídos</div>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-lg font-bold text-purple-600">{selectedCampana.respondidos}</div>
                          <div className="text-gray-600 dark:text-gray-400">Respondidos</div>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-lg font-bold text-orange-600">{selectedCampana.conversiones}</div>
                          <div className="text-gray-600 dark:text-gray-400">Conversiones</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Métricas de rendimiento */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Métricas de Rendimiento</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tasa de Apertura:</span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-3">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${selectedCampana.tasa_apertura}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedCampana.tasa_apertura.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tasa de Respuesta:</span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-3">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${selectedCampana.tasa_respuesta}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedCampana.tasa_respuesta.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tasa de Conversión:</span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-3">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${selectedCampana.tasa_conversion}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedCampana.tasa_conversion.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información financiera */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Información Financiera</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Costo estimado:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(selectedCampana.costo_estimado)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">ROI:</span>
                        <span className={`text-sm font-bold ${selectedCampana.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedCampana.roi.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Segmento objetivo */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Segmento Objetivo</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCampana.segmento_objetivo.map((segmento, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                          {segmento}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Información de promoción */}
                  {selectedCampana.promocion && (
                    <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-green-900 dark:text-green-200 mb-4">
                        🎯 Promoción Incluida
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700 dark:text-green-300">Código:</span>
                          <span className="text-sm font-bold text-green-900 dark:text-green-100">
                            {selectedCampana.promocion.codigo_promocional}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700 dark:text-green-300">Tipo:</span>
                          <span className="text-sm font-medium text-green-900 dark:text-green-100">
                            {selectedCampana.promocion.tipo === 'porcentaje' && `${selectedCampana.promocion.valor}% de descuento`}
                            {selectedCampana.promocion.tipo === 'monto_fijo' && `$${selectedCampana.promocion.valor.toLocaleString()} de descuento`}
                            {selectedCampana.promocion.tipo === 'regalo' && `Regalo: ${selectedCampana.promocion.descripcion}`}
                          </span>
                        </div>
                        {selectedCampana.promocion.condiciones.monto_minimo && (
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700 dark:text-green-300">Compra mínima:</span>
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">
                              {formatCurrency(selectedCampana.promocion.condiciones.monto_minimo)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700 dark:text-green-300">Vigencia:</span>
                          <span className="text-sm font-medium text-green-900 dark:text-green-100">
                            {new Date(selectedCampana.promocion.condiciones.fecha_inicio).toLocaleDateString('es-ES')} -{' '}
                            {new Date(selectedCampana.promocion.condiciones.fecha_fin).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700 dark:text-green-300">Usos:</span>
                          <span className="text-sm font-medium text-green-900 dark:text-green-100">
                            {selectedCampana.promocion.usos_actuales}
                            {selectedCampana.promocion.usos_maximos ? ` / ${selectedCampana.promocion.usos_maximos}` : ' / ∞'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700 dark:text-green-300">Aplicación:</span>
                          <span className="text-sm font-medium text-green-900 dark:text-green-100">
                            {selectedCampana.promocion.aplicacion_automatica ? 'Automática' : 'Manual'}
                          </span>
                        </div>
                        {selectedCampana.promocion.condiciones.solo_primera_compra && (
                          <div className="text-sm text-green-700 dark:text-green-300">
                            ✅ Solo para primera compra
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <div className="flex gap-3">
                {(selectedCampana.estado === 'Activa' || selectedCampana.estado === 'Pausada') && (
                  <button
                    onClick={() => {
                      handlePausarCampana(selectedCampana);
                      setShowDetailsModal(false);
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      selectedCampana.estado === 'Activa'
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedCampana.estado === 'Activa' ? 'Pausar Campaña' : 'Reanudar Campaña'}
                  </button>
                )}

                {(selectedCampana.estado === 'Borrador' || selectedCampana.estado === 'Programada') && (
                  <button
                    onClick={() => {
                      setEditingCampana(selectedCampana);
                      setShowDetailsModal(false);
                      setShowCreateModal(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Editar Campaña
                  </button>
                )}

                <button
                  onClick={() => {
                    handleDeleteCampana(selectedCampana);
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Eliminar Campaña
                </button>
              </div>

              <button
                onClick={() => setShowDetailsModal(false)}
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

export default CampanaManager;