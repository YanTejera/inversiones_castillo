import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare,
  Mail,
  Phone,
  Send,
  Users,
  AlertTriangle,
  DollarSign,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Target,
  TrendingUp,
  Megaphone,
  CreditCard,
  UserCheck,
  MessageCircle,
  PhoneCall,
  AtSign,
  Zap
} from 'lucide-react';
import { useToast } from '../components/Toast';
import CampanaManager from '../components/comunicaciones/CampanaManager';
import PlantillasManager from '../components/comunicaciones/PlantillasManager';

interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  whatsapp: string;
  deuda_total: number;
  dias_vencido: number;
  ultima_compra: string;
  preferencias_contacto: string[];
  segmento: 'VIP' | 'Regular' | 'Nuevo' | 'Moroso';
  estado: 'Activo' | 'Inactivo' | 'Bloqueado';
}

interface Campana {
  id: number;
  nombre: string;
  tipo: 'Cobranza' | 'Marketing' | 'Recordatorio';
  canal: 'WhatsApp' | 'Email' | 'SMS' | 'Telegram';
  estado: 'Activa' | 'Programada' | 'Completada' | 'Pausada';
  destinatarios: number;
  enviados: number;
  leidos: number;
  respondidos: number;
  fecha_creacion: string;
  fecha_envio: string;
}

interface EstadisticasComunicacion {
  total_clientes: number;
  clientes_con_deuda: number;
  deuda_total: number;
  mensajes_enviados_hoy: number;
  tasa_apertura: number;
  tasa_respuesta: number;
  recuperacion_deuda: number;
  campanas_activas: number;
}

interface Plantilla {
  id: number;
  nombre: string;
  tipo: 'Cobranza' | 'Marketing' | 'Recordatorio' | 'Promocional';
  canal: 'WhatsApp' | 'Email' | 'SMS' | 'Telegram' | 'Todos';
  asunto?: string;
  contenido: string;
  variables: string[];
}

const Comunicaciones: React.FC = () => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();

  // Estados principales
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'deudores' | 'campanas' | 'plantillas' | 'analytics'>('dashboard');

  // Estados de datos
  const [stats, setStats] = useState<EstadisticasComunicacion | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSegmento, setFiltroSegmento] = useState<string>('all');
  const [filtroCanal, setFiltroCanal] = useState<string>('all');
  const [filtroTipo, setFiltroTipo] = useState<string>('all');

  // Estados de modales
  const [showCampanaModal, setShowCampanaModal] = useState(false);
  const [showPlantillaModal, setShowPlantillaModal] = useState(false);
  const [selectedClientes, setSelectedClientes] = useState<number[]>([]);
  const [showMensajeModal, setShowMensajeModal] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [canalSeleccionado, setCanalSeleccionado] = useState<'WhatsApp' | 'Email' | 'SMS' | 'Telegram'>('WhatsApp');
  const [mensajeTexto, setMensajeTexto] = useState('');
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState('');
  const [asunto, setAsunto] = useState('');
  const [programarEnvio, setProgramarEnvio] = useState(false);
  const [fechaEnvio, setFechaEnvio] = useState('');

  useEffect(() => {
    loadData();
  }, [viewMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadEstadisticas(),
        loadClientes(),
        loadCampanas(),
        loadPlantillas()
      ]);
    } catch (err: any) {
      showError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadEstadisticas = async () => {
    // Simulando datos por ahora
    const mockStats: EstadisticasComunicacion = {
      total_clientes: 1250,
      clientes_con_deuda: 89,
      deuda_total: 2450000,
      mensajes_enviados_hoy: 156,
      tasa_apertura: 78.5,
      tasa_respuesta: 23.4,
      recuperacion_deuda: 450000,
      campanas_activas: 3
    };
    setStats(mockStats);
  };

  const loadClientes = async () => {
    // Simulando datos de clientes con deuda
    const mockClientes: Cliente[] = [
      {
        id: 1,
        nombre: "Carlos Rodríguez",
        email: "carlos@email.com",
        telefono: "809-555-0101",
        whatsapp: "809-555-0101",
        deuda_total: 45000,
        dias_vencido: 15,
        ultima_compra: "2024-08-15",
        preferencias_contacto: ["WhatsApp", "Email"],
        segmento: "Regular",
        estado: "Activo"
      },
      {
        id: 2,
        nombre: "Ana Martínez",
        email: "ana.martinez@email.com",
        telefono: "809-555-0102",
        whatsapp: "809-555-0102",
        deuda_total: 125000,
        dias_vencido: 45,
        ultima_compra: "2024-07-01",
        preferencias_contacto: ["Email", "SMS"],
        segmento: "VIP",
        estado: "Activo"
      },
      {
        id: 3,
        nombre: "Luis Fernández",
        email: "luis.f@email.com",
        telefono: "809-555-0103",
        whatsapp: "809-555-0103",
        deuda_total: 28000,
        dias_vencido: 7,
        ultima_compra: "2024-09-01",
        preferencias_contacto: ["WhatsApp"],
        segmento: "Nuevo",
        estado: "Activo"
      }
    ];
    setClientes(mockClientes);
  };

  const loadCampanas = async () => {
    // Simulando datos de campañas
    const mockCampanas: Campana[] = [
      {
        id: 1,
        nombre: "Recordatorio Pagos Septiembre",
        tipo: "Cobranza",
        canal: "WhatsApp",
        estado: "Activa",
        destinatarios: 89,
        enviados: 89,
        leidos: 67,
        respondidos: 23,
        fecha_creacion: "2024-09-15",
        fecha_envio: "2024-09-15"
      },
      {
        id: 2,
        nombre: "Promoción Motocicletas Nuevas",
        tipo: "Marketing",
        canal: "Email",
        estado: "Programada",
        destinatarios: 500,
        enviados: 0,
        leidos: 0,
        respondidos: 0,
        fecha_creacion: "2024-09-14",
        fecha_envio: "2024-09-20"
      }
    ];
    setCampanas(mockCampanas);
  };

  const loadPlantillas = async () => {
    try {
      // Cargar plantillas desde localStorage
      const savedPlantillas = localStorage.getItem('plantillas_comunicaciones');
      if (savedPlantillas) {
        const plantillasData = JSON.parse(savedPlantillas);
        // Convertir formato de PlantillasManager al formato simple del modal
        const plantillasSimples = plantillasData.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          tipo: p.tipo,
          canal: p.canal,
          asunto: p.asunto || undefined,
          contenido: p.contenido,
          variables: p.variables || []
        }));
        setPlantillas(plantillasSimples);
        return;
      }

      // Datos mock de plantillas como respaldo
      const mockPlantillas: Plantilla[] = [
        {
          id: 1,
          nombre: "Recordatorio de Pago Amigable",
          tipo: "Cobranza",
          canal: "WhatsApp",
          contenido: "Hola {nombre}, te recordamos que tienes un pago pendiente de {monto} vencido desde hace {dias_vencido} días. ¿Podrías contactarnos para coordinarlo? ¡Gracias! 🏍️",
          variables: ["nombre", "monto", "dias_vencido"]
        },
        {
          id: 2,
          nombre: "Pago Urgente",
          tipo: "Cobranza",
          canal: "SMS",
          contenido: "URGENTE: {nombre}, tienes {dias_vencido} días de atraso. Monto: {monto}. Contacta ya: (809) 555-0123",
          variables: ["nombre", "monto", "dias_vencido"]
        },
        {
          id: 3,
          nombre: "Email Formal de Cobranza",
          tipo: "Cobranza",
          canal: "Email",
          asunto: "Pago Pendiente - {nombre}",
          contenido: "Estimado/a {nombre},\n\nEsperamos que se encuentre bien. Le escribimos para informarle que tiene un pago pendiente por {monto} que venció hace {dias_vencido} días.\n\nPor favor, póngase en contacto con nosotros para coordinar el pago.\n\nSaludos cordiales,\nInversiones Castillo",
          variables: ["nombre", "monto", "dias_vencido"]
        },
        {
          id: 4,
          nombre: "Promoción Motocicletas",
          tipo: "Marketing",
          canal: "WhatsApp",
          contenido: "🏍️ ¡Oferta especial para ti {nombre}! Nuevas motocicletas con 20% de descuento. Visítanos y aprovecha esta oportunidad única. ¡Te esperamos!",
          variables: ["nombre"]
        },
        {
          id: 5,
          nombre: "Email Promocional",
          tipo: "Promocional",
          canal: "Email",
          asunto: "¡Oferta especial solo para ti, {nombre}!",
          contenido: "Querido/a {nombre},\n\n¡Tenemos una oferta especial solo para ti! Descuentos de hasta 25% en motocicletas seleccionadas.\n\nNo pierdas esta oportunidad única.\n\n¡Te esperamos!\nEquipo Inversiones Castillo",
          variables: ["nombre"]
        }
      ];
      setPlantillas(mockPlantillas);
    } catch (error) {
      console.error('Error loading plantillas:', error);
      setPlantillas([]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSegmentoColor = (segmento: string) => {
    switch (segmento) {
      case 'VIP': return 'bg-purple-100 text-purple-800';
      case 'Regular': return 'bg-blue-100 text-blue-800';
      case 'Nuevo': return 'bg-green-100 text-green-800';
      case 'Moroso': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiesgoColor = (dias: number) => {
    if (dias <= 7) return 'bg-green-100 text-green-800';
    if (dias <= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getRiesgoLabel = (dias: number) => {
    if (dias <= 7) return 'Bajo';
    if (dias <= 30) return 'Medio';
    return 'Alto';
  };

  // Funciones de acciones para botones
  const handleEnviarWhatsApp = (cliente: Cliente) => {
    resetModal();
    setClienteSeleccionado(cliente);
    setCanalSeleccionado('WhatsApp');
    setShowMensajeModal(true);
    info(`Preparando mensaje de WhatsApp para ${cliente.nombre}`);
  };

  const handleEnviarEmail = (cliente: Cliente) => {
    resetModal();
    setClienteSeleccionado(cliente);
    setCanalSeleccionado('Email');
    setShowMensajeModal(true);
    info(`Preparando email para ${cliente.nombre}`);
  };

  const handleEnviarSMS = (cliente: Cliente) => {
    resetModal();
    setClienteSeleccionado(cliente);
    setCanalSeleccionado('SMS');
    setShowMensajeModal(true);
    info(`Preparando SMS para ${cliente.nombre}`);
  };

  const handleVerHistorial = (cliente: Cliente) => {
    info(`Abriendo historial de comunicaciones para ${cliente.nombre}`);
    // Aquí se podría abrir un modal con el historial
  };

  const handleEnvioMasivo = () => {
    if (selectedClientes.length === 0) {
      warning('Selecciona al menos un cliente para el envío masivo');
      return;
    }
    info(`Preparando envío masivo para ${selectedClientes.length} clientes`);
    setShowCampanaModal(true);
  };

  const handleLimpiarFiltros = () => {
    setSearchTerm('');
    setFiltroSegmento('all');
    success('Filtros limpiados');
  };

  // Funciones para el modal mejorado
  const handleSeleccionarPlantilla = (plantillaId: string) => {
    const plantilla = plantillas.find(p => p.id.toString() === plantillaId);
    if (plantilla && clienteSeleccionado) {
      let contenidoPersonalizado = plantilla.contenido;

      // Reemplazar variables
      contenidoPersonalizado = contenidoPersonalizado.replace(/{nombre}/g, clienteSeleccionado.nombre);
      contenidoPersonalizado = contenidoPersonalizado.replace(/{monto}/g, formatCurrency(clienteSeleccionado.deuda_total));
      contenidoPersonalizado = contenidoPersonalizado.replace(/{dias_vencido}/g, clienteSeleccionado.dias_vencido.toString());

      setMensajeTexto(contenidoPersonalizado);
      if (plantilla.asunto) {
        const asuntoPersonalizado = plantilla.asunto.replace(/{nombre}/g, clienteSeleccionado.nombre);
        setAsunto(asuntoPersonalizado);
      }
    }
  };

  const resetModal = () => {
    setMensajeTexto('');
    setPlantillaSeleccionada('');
    setAsunto('');
    setProgramarEnvio(false);
    setFechaEnvio('');
  };

  const getPlantillasFiltradas = () => {
    return plantillas.filter(plantilla =>
      plantilla.canal === canalSeleccionado || plantilla.canal === 'Todos'
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Métricas principales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Clientes</p>
                <p className="text-3xl font-bold">{stats.total_clientes.toLocaleString()}</p>
                <p className="text-blue-100 text-sm mt-1">
                  {stats.clientes_con_deuda} con deuda
                </p>
              </div>
              <Users className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Deuda Total</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.deuda_total)}</p>
                <p className="text-red-100 text-sm mt-1">
                  {stats.clientes_con_deuda} clientes
                </p>
              </div>
              <AlertTriangle className="h-12 w-12 text-red-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Recuperado Hoy</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.recuperacion_deuda)}</p>
                <p className="text-green-100 text-sm mt-1">
                  {((stats.recuperacion_deuda / stats.deuda_total) * 100).toFixed(1)}% del total
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Mensajes Hoy</p>
                <p className="text-3xl font-bold">{stats.mensajes_enviados_hoy}</p>
                <p className="text-purple-100 text-sm mt-1">
                  {stats.tasa_apertura}% apertura
                </p>
              </div>
              <MessageSquare className="h-12 w-12 text-purple-200" />
            </div>
          </div>
        </div>
      )}

      {/* Métricas de rendimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Rendimiento de Comunicaciones
          </h3>
          {stats && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tasa de Apertura</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${stats.tasa_apertura}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {stats.tasa_apertura}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tasa de Respuesta</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${stats.tasa_respuesta}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {stats.tasa_respuesta}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Campañas Activas</span>
                <span className="text-lg font-bold text-purple-600">{stats.campanas_activas}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-green-600" />
            Acciones Rápidas
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => setViewMode('deudores')}
              className="w-full flex items-center justify-between p-3 bg-red-50 dark:bg-red-900 rounded-lg hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
            >
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <span className="font-medium text-red-900 dark:text-red-200">Gestionar Cobranza</span>
              </div>
              <span className="text-sm text-red-600 dark:text-red-400">
                {stats?.clientes_con_deuda} pendientes
              </span>
            </button>

            <button
              onClick={() => setShowCampanaModal(true)}
              className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
            >
              <div className="flex items-center">
                <Megaphone className="h-5 w-5 text-blue-600 mr-3" />
                <span className="font-medium text-blue-900 dark:text-blue-200">Nueva Campaña</span>
              </div>
              <Plus className="h-5 w-5 text-blue-600" />
            </button>

            <button
              onClick={() => setViewMode('plantillas')}
              className="w-full flex items-center justify-between p-3 bg-green-50 dark:bg-green-900 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
            >
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 text-green-600 mr-3" />
                <span className="font-medium text-green-900 dark:text-green-200">Plantillas</span>
              </div>
              <Edit className="h-5 w-5 text-green-600" />
            </button>

            <button
              onClick={() => setViewMode('analytics')}
              className="w-full flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors"
            >
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 text-purple-600 mr-3" />
                <span className="font-medium text-purple-900 dark:text-purple-200">Analytics</span>
              </div>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Últimas campañas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
            Campañas Recientes
          </h3>
          <button
            onClick={() => setViewMode('campanas')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Ver todas
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Campaña
                </th>
                <th className="text-left py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tipo
                </th>
                <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Enviados
                </th>
                <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Apertura
                </th>
                <th className="text-center py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {campanas.slice(0, 5).map((campana) => (
                <tr key={campana.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {campana.nombre}
                  </td>
                  <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      campana.tipo === 'Cobranza' ? 'bg-red-100 text-red-800' :
                      campana.tipo === 'Marketing' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {campana.tipo}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                    {campana.enviados}/{campana.destinatarios}
                  </td>
                  <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                    {campana.enviados > 0 ? ((campana.leidos / campana.enviados) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="py-3 text-sm text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      campana.estado === 'Activa' ? 'bg-green-100 text-green-800' :
                      campana.estado === 'Programada' ? 'bg-yellow-100 text-yellow-800' :
                      campana.estado === 'Completada' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campana.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDeudores = () => (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            Gestión de Cobranza
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleEnvioMasivo}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Envío Masivo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={filtroSegmento}
            onChange={(e) => setFiltroSegmento(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Todos los segmentos</option>
            <option value="VIP">VIP</option>
            <option value="Regular">Regular</option>
            <option value="Nuevo">Nuevo</option>
            <option value="Moroso">Moroso</option>
          </select>

          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Todos los riesgos</option>
            <option value="bajo">Riesgo Bajo (1-7 días)</option>
            <option value="medio">Riesgo Medio (8-30 días)</option>
            <option value="alto">Riesgo Alto (30+ días)</option>
          </select>

          <button
            onClick={handleLimpiarFiltros}
            className="flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Filter className="h-4 w-4 mr-2" />
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Lista de deudores */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Deuda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Días Vencido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Riesgo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedClientes.includes(cliente.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClientes([...selectedClientes, cliente.id]);
                        } else {
                          setSelectedClientes(selectedClientes.filter(id => id !== cliente.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {cliente.nombre}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {cliente.email}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSegmentoColor(cliente.segmento)}`}>
                        {cliente.segmento}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-red-600">
                      {formatCurrency(cliente.deuda_total)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {cliente.dias_vencido} días
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiesgoColor(cliente.dias_vencido)}`}>
                      {getRiesgoLabel(cliente.dias_vencido)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {cliente.preferencias_contacto.includes('WhatsApp') && (
                        <MessageCircle className="h-5 w-5 text-green-600" title="WhatsApp" />
                      )}
                      {cliente.preferencias_contacto.includes('Email') && (
                        <Mail className="h-5 w-5 text-blue-600" title="Email" />
                      )}
                      {cliente.preferencias_contacto.includes('SMS') && (
                        <Phone className="h-5 w-5 text-purple-600" title="SMS" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEnviarWhatsApp(cliente)}
                        className="text-green-600 hover:text-green-900"
                        title="WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEnviarEmail(cliente)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEnviarSMS(cliente)}
                        className="text-purple-600 hover:text-purple-900"
                        title="SMS"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleVerHistorial(cliente)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Ver historial"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
          <div className="animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <MessageSquare className="h-8 w-8 mr-3 text-blue-600" />
              Comunicaciones y Marketing
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestiona cobranza, campañas de marketing y comunicación con clientes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </div>
            </button>
            <button
              onClick={() => setViewMode('deudores')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'deudores'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Cobranza
                {stats && stats.clientes_con_deuda > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {stats.clientes_con_deuda}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setViewMode('campanas')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'campanas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Megaphone className="h-4 w-4 mr-2" />
                Campañas
              </div>
            </button>
            <button
              onClick={() => setViewMode('plantillas')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'plantillas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                Plantillas
              </div>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'dashboard' && renderDashboard()}
      {viewMode === 'deudores' && renderDeudores()}
      {viewMode === 'campanas' && <CampanaManager />}
      {viewMode === 'plantillas' && <PlantillasManager />}
      {viewMode === 'analytics' && (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Analytics de comunicaciones en desarrollo...
          </p>
        </div>
      )}

      {/* Modal mejorado para enviar mensaje individual */}
      {showMensajeModal && clienteSeleccionado && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ zIndex: 10000 }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                {canalSeleccionado === 'WhatsApp' && <MessageCircle className="h-6 w-6 text-green-600 mr-2" />}
                {canalSeleccionado === 'Email' && <Mail className="h-6 w-6 text-blue-600 mr-2" />}
                {canalSeleccionado === 'SMS' && <Phone className="h-6 w-6 text-purple-600 mr-2" />}
                {canalSeleccionado === 'Telegram' && <AtSign className="h-6 w-6 text-blue-500 mr-2" />}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Enviar {canalSeleccionado}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowMensajeModal(false);
                  resetModal();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información del cliente */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Información del Cliente</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Nombre:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{clienteSeleccionado.nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{clienteSeleccionado.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Teléfono:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{clienteSeleccionado.telefono}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Deuda Total:</span>
                      <span className="text-sm font-bold text-red-600">{formatCurrency(clienteSeleccionado.deuda_total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Días Vencido:</span>
                      <span className="text-sm font-medium text-orange-600">{clienteSeleccionado.dias_vencido} días</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Segmento:</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getSegmentoColor(clienteSeleccionado.segmento)}`}>
                        {clienteSeleccionado.segmento}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selección de plantilla */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Seleccionar Plantilla (Opcional)
                  </label>
                  <select
                    value={plantillaSeleccionada}
                    onChange={(e) => {
                      setPlantillaSeleccionada(e.target.value);
                      if (e.target.value) {
                        handleSeleccionarPlantilla(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Mensaje personalizado</option>
                    {getPlantillasFiltradas().map(plantilla => (
                      <option key={plantilla.id} value={plantilla.id.toString()}>
                        {plantilla.nombre} ({plantilla.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Opciones adicionales */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="programar-envio"
                      checked={programarEnvio}
                      onChange={(e) => setProgramarEnvio(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="programar-envio" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Programar envío
                    </label>
                  </div>

                  {programarEnvio && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha y hora de envío
                      </label>
                      <input
                        type="datetime-local"
                        value={fechaEnvio}
                        onChange={(e) => setFechaEnvio(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Composición del mensaje */}
              <div className="space-y-4">
                {/* Asunto para email */}
                {canalSeleccionado === 'Email' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Asunto del Email
                    </label>
                    <input
                      type="text"
                      value={asunto}
                      onChange={(e) => setAsunto(e.target.value)}
                      placeholder="Asunto del email..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                {/* Contenido del mensaje */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contenido del Mensaje
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {mensajeTexto.length} caracteres
                    </span>
                  </div>
                  <textarea
                    value={mensajeTexto}
                    onChange={(e) => setMensajeTexto(e.target.value)}
                    placeholder={`Escribe tu mensaje de ${canalSeleccionado.toLowerCase()}...`}
                    className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>

                {/* Variables disponibles */}
                {plantillaSeleccionada && (
                  <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Variables disponibles:
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {['nombre', 'monto', 'dias_vencido'].map(variable => (
                        <span key={variable} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                          {'{' + variable + '}'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vista previa */}
                {mensajeTexto && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Vista Previa:
                    </h5>
                    <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap border-l-4 border-blue-500 pl-3">
                      {canalSeleccionado === 'Email' && asunto && (
                        <div className="font-medium mb-2">Asunto: {asunto}</div>
                      )}
                      {mensajeTexto}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  if (!mensajeTexto.trim()) {
                    warning('Por favor escribe un mensaje antes de enviar');
                    return;
                  }
                  if (canalSeleccionado === 'Email' && !asunto.trim()) {
                    warning('Por favor escribe un asunto para el email');
                    return;
                  }

                  const tipoEnvio = programarEnvio ? 'programado' : 'inmediato';
                  success(`Mensaje de ${canalSeleccionado} ${tipoEnvio} para ${clienteSeleccionado.nombre}`);
                  setShowMensajeModal(false);
                  resetModal();
                }}
                disabled={!mensajeTexto.trim() || (canalSeleccionado === 'Email' && !asunto.trim())}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                {programarEnvio ? 'Programar Envío' : 'Enviar Ahora'}
              </button>
              <button
                onClick={() => {
                  setShowMensajeModal(false);
                  resetModal();
                }}
                className="flex-1 bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300 py-3 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancelar
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

export default Comunicaciones;