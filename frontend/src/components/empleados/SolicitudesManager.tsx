import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Check,
  X,
  Clock,
  Eye,
  Edit,
  Trash2,
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { solicitudesService, type SolicitudTiempo, type SolicitudTiempoCreate } from '../../services/solicitudesService';
import { empleadoService, type EmpleadoList } from '../../services/empleadoService';
import { useToast } from '../Toast';

interface SolicitudesManagerProps {}

const SolicitudesManager: React.FC<SolicitudesManagerProps> = () => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();

  // Estados principales
  const [solicitudes, setSolicitudes] = useState<SolicitudTiempo[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoList[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'lista' | 'pendientes' | 'crear'>('lista');

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroEmpleado, setFiltroEmpleado] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Estados del formulario
  const [showForm, setShowForm] = useState(false);
  const [editingSolicitud, setEditingSolicitud] = useState<SolicitudTiempo | null>(null);
  const [formData, setFormData] = useState<SolicitudTiempoCreate>({
    empleado: 0,
    tipo: 'vacaciones',
    fecha_inicio: '',
    fecha_fin: '',
    dias_solicitados: 0,
    motivo: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados de aprobación
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalSolicitud, setApprovalSolicitud] = useState<SolicitudTiempo | null>(null);
  const [approvalAction, setApprovalAction] = useState<'aprobar' | 'rechazar'>('aprobar');
  const [approvalComments, setApprovalComments] = useState('');

  // Estados del modal de detalles
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudTiempo | null>(null);

  useEffect(() => {
    loadSolicitudes();
    loadEmpleados();
  }, [currentPage, filtroTipo, filtroEstado, filtroEmpleado, searchTerm]);

  const loadSolicitudes = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        search: searchTerm || undefined,
        tipo: filtroTipo || undefined,
        estado: filtroEstado || undefined,
        empleado: filtroEmpleado || undefined
      };

      const response = await solicitudesService.getSolicitudes(params);
      setSolicitudes(response.results);
      setTotalPages(Math.ceil(response.count / 10));
    } catch (err: any) {
      showError(err.message || 'Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const loadEmpleados = async () => {
    try {
      const response = await empleadoService.getEmpleados({ estado: 'activo' });
      setEmpleados(response.results);
    } catch (err: any) {
      console.error('Error loading empleados:', err);
    }
  };

  const handleCreateSolicitud = async () => {
    try {
      if (editingSolicitud) {
        await solicitudesService.updateSolicitudWithFile(editingSolicitud.id, formData, selectedFile || undefined);
        success('Solicitud actualizada correctamente');
      } else {
        await solicitudesService.createSolicitudWithFile(formData, selectedFile || undefined);
        success('Solicitud creada correctamente');
      }

      setShowForm(false);
      setEditingSolicitud(null);
      resetForm();
      loadSolicitudes();
    } catch (err: any) {
      showError(err.message || 'Error al procesar solicitud');
    }
  };

  const handleDeleteSolicitud = async (solicitud: SolicitudTiempo) => {
    if (!window.confirm('¿Estás seguro de eliminar esta solicitud?')) return;

    try {
      await solicitudesService.deleteSolicitud(solicitud.id);
      success('Solicitud eliminada correctamente');
      loadSolicitudes();
    } catch (err: any) {
      showError(err.message || 'Error al eliminar solicitud');
    }
  };

  const handleApproval = async () => {
    if (!approvalSolicitud) return;

    try {
      if (approvalAction === 'aprobar') {
        await solicitudesService.aprobarSolicitud(approvalSolicitud.id, {
          comentarios: approvalComments
        });
        success('Solicitud aprobada correctamente');
      } else {
        await solicitudesService.rechazarSolicitud(approvalSolicitud.id, {
          comentarios: approvalComments
        });
        warning('Solicitud rechazada');
      }

      setShowApprovalModal(false);
      setApprovalSolicitud(null);
      setApprovalComments('');
      loadSolicitudes();
    } catch (err: any) {
      showError(err.message || 'Error al procesar aprobación');
    }
  };

  const openApprovalModal = (solicitud: SolicitudTiempo, action: 'aprobar' | 'rechazar') => {
    setApprovalSolicitud(solicitud);
    setApprovalAction(action);
    setApprovalComments('');
    setShowApprovalModal(true);
  };

  const openDetailsModal = (solicitud: SolicitudTiempo) => {
    setSelectedSolicitud(solicitud);
    setShowDetailsModal(true);
  };

  const handleDownloadDocument = (documentUrl: string) => {
    if (documentUrl) {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = 'documento_soporte';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleEditSolicitud = (solicitud: SolicitudTiempo) => {
    setEditingSolicitud(solicitud);
    setFormData({
      empleado: solicitud.empleado,
      tipo: solicitud.tipo,
      fecha_inicio: solicitud.fecha_inicio,
      fecha_fin: solicitud.fecha_fin,
      dias_solicitados: solicitud.dias_solicitados,
      motivo: solicitud.motivo
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      empleado: 0,
      tipo: 'vacaciones',
      fecha_inicio: '',
      fecha_fin: '',
      dias_solicitados: 0,
      motivo: ''
    });
    setSelectedFile(null);
  };

  const handleFechaChange = (field: 'fecha_inicio' | 'fecha_fin', value: string) => {
    const newFormData = { ...formData, [field]: value };

    if (newFormData.fecha_inicio && newFormData.fecha_fin) {
      const dias = solicitudesService.calcularDiasSolicitados(
        newFormData.fecha_inicio,
        newFormData.fecha_fin
      );
      newFormData.dias_solicitados = dias;
    }

    setFormData(newFormData);
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Clock className="h-4 w-4" />;
      case 'aprobada':
        return <CheckCircle className="h-4 w-4" />;
      case 'rechazada':
        return <XCircle className="h-4 w-4" />;
      case 'cancelada':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredSolicitudes = currentView === 'pendientes'
    ? solicitudes.filter(s => s.estado === 'pendiente')
    : solicitudes;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Gestión de Solicitudes
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView(currentView === 'lista' ? 'pendientes' : 'lista')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              currentView === 'pendientes'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {currentView === 'lista' ? 'Ver Pendientes' : 'Ver Todas'}
          </button>

          <button
            onClick={() => {
              resetForm();
              setEditingSolicitud(null);
              setShowForm(true);
            }}
            className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Solicitud
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar solicitudes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Todos los tipos</option>
          <option value="vacaciones">Vacaciones</option>
          <option value="enfermedad">Enfermedad</option>
          <option value="personal">Personal</option>
          <option value="maternidad">Maternidad/Paternidad</option>
          <option value="duelo">Duelo</option>
          <option value="compensatorio">Compensatorio</option>
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobada">Aprobada</option>
          <option value="rechazada">Rechazada</option>
          <option value="cancelada">Cancelada</option>
        </select>

        <select
          value={filtroEmpleado}
          onChange={(e) => setFiltroEmpleado(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Todos los empleados</option>
          {empleados.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nombre_completo}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de solicitudes */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando solicitudes...</span>
        </div>
      ) : filteredSolicitudes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {currentView === 'pendientes' ? 'No hay solicitudes pendientes' : 'No se encontraron solicitudes'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fechas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Días
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha Solicitud
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSolicitudes.map((solicitud) => {
                const estadoColors = solicitudesService.obtenerColorEstado(solicitud.estado);

                return (
                  <tr key={solicitud.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {solicitud.empleado_nombre}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2 text-lg">
                          {solicitudesService.obtenerIconoTipo(solicitud.tipo)}
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {solicitud.tipo_display}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div>
                        <div>{solicitudesService.formatearFecha(solicitud.fecha_inicio)}</div>
                        <div className="text-gray-500">a {solicitudesService.formatearFecha(solicitud.fecha_fin)}</div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {solicitud.dias_solicitados} día{solicitud.dias_solicitados !== 1 ? 's' : ''}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColors.bg} ${estadoColors.text}`}>
                        {getEstadoIcon(solicitud.estado)}
                        <span className="ml-1">{solicitud.estado_display}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES')}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailsModal(solicitud)}
                          className="text-purple-600 hover:text-purple-900 p-1"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {solicitud.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => openApprovalModal(solicitud, 'aprobar')}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Aprobar"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openApprovalModal(solicitud, 'rechazar')}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Rechazar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {(solicitud.estado === 'pendiente' || solicitud.estado === 'rechazada') && (
                          <button
                            onClick={() => handleEditSolicitud(solicitud)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteSolicitud(solicitud)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      {showForm && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[99999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingSolicitud ? 'Editar Solicitud' : 'Nueva Solicitud de Tiempo'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Empleado
                </label>
                <select
                  value={formData.empleado}
                  onChange={(e) => setFormData({ ...formData, empleado: Number(e.target.value) })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value={0}>Seleccionar empleado...</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Solicitud
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="vacaciones">Vacaciones</option>
                  <option value="enfermedad">Enfermedad</option>
                  <option value="personal">Personal</option>
                  <option value="maternidad">Maternidad/Paternidad</option>
                  <option value="duelo">Duelo</option>
                  <option value="compensatorio">Compensatorio</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => handleFechaChange('fecha_inicio', e.target.value)}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => handleFechaChange('fecha_fin', e.target.value)}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {formData.fecha_inicio && formData.fecha_fin && (
                <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-md">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Días solicitados:</strong> {formData.dias_solicitados} día{formData.dias_solicitados !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo
                </label>
                <textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe el motivo de la solicitud..."
                  required
                />
              </div>

              {/* Documento de soporte */}
              {(['enfermedad', 'maternidad', 'duelo'] as const).includes(formData.tipo) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Documento de Soporte {formData.tipo === 'enfermedad' ? '(Certificado Médico)' :
                                          formData.tipo === 'maternidad' ? '(Certificado de Nacimiento/Embarazo)' :
                                          formData.tipo === 'duelo' ? '(Certificado de Defunción)' : ''}
                    {formData.tipo === 'enfermedad' ? ' *' : ''}
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    required={formData.tipo === 'enfermedad'}
                  />
                  {selectedFile && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Archivo seleccionado: {selectedFile.name}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Formatos aceptados: PDF, JPG, PNG, DOC, DOCX (máx. 10MB)
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingSolicitud(null);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSolicitud}
                disabled={!formData.empleado || !formData.fecha_inicio || !formData.fecha_fin || !formData.motivo}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingSolicitud ? 'Actualizar' : 'Crear'} Solicitud
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de aprobación */}
      {showApprovalModal && approvalSolicitud && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[99999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {approvalAction === 'aprobar' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
              </h3>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Empleado:</strong> {approvalSolicitud.empleado_nombre}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Tipo:</strong> {approvalSolicitud.tipo_display}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Fechas:</strong> {solicitudesService.formatearFecha(approvalSolicitud.fecha_inicio)} - {solicitudesService.formatearFecha(approvalSolicitud.fecha_fin)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Comentarios {approvalAction === 'rechazar' ? '(requeridos)' : '(opcionales)'}
                </label>
                <textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={`Comentarios sobre la ${approvalAction === 'aprobar' ? 'aprobación' : 'rechazo'} de la solicitud...`}
                  required={approvalAction === 'rechazar'}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalSolicitud(null);
                  setApprovalComments('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleApproval}
                disabled={approvalAction === 'rechazar' && !approvalComments.trim()}
                className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  approvalAction === 'aprobar'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {approvalAction === 'aprobar' ? 'Aprobar' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de detalles */}
      {showDetailsModal && selectedSolicitud && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[99999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Detalles de la Solicitud
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información básica */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Información General
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Empleado</label>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">{selectedSolicitud.empleado_nombre}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Solicitud</label>
                      <div className="flex items-center mt-1">
                        <span className="mr-2 text-lg">
                          {solicitudesService.obtenerIconoTipo(selectedSolicitud.tipo)}
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white font-medium">
                          {selectedSolicitud.tipo_display}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          solicitudesService.obtenerColorEstado(selectedSolicitud.estado).bg
                        } ${
                          solicitudesService.obtenerColorEstado(selectedSolicitud.estado).text
                        }`}>
                          {getEstadoIcon(selectedSolicitud.estado)}
                          <span className="ml-1">{selectedSolicitud.estado_display}</span>
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Solicitud</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {solicitudesService.formatearFecha(selectedSolicitud.fecha_solicitud)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fechas y duración */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Período Solicitado
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Inicio</label>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {solicitudesService.formatearFecha(selectedSolicitud.fecha_inicio)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Fin</label>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {solicitudesService.formatearFecha(selectedSolicitud.fecha_fin)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Duración</label>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {selectedSolicitud.dias_solicitados} día{selectedSolicitud.dias_solicitados !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivo */}
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
                  Motivo
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {selectedSolicitud.motivo}
                  </p>
                </div>
              </div>

              {/* Documento de soporte */}
              {selectedSolicitud.documento_soporte && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
                    Documento de Soporte
                  </h4>
                  <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                        <span className="text-sm text-blue-900 dark:text-blue-200">Documento adjunto</span>
                      </div>
                      <button
                        onClick={() => handleDownloadDocument(selectedSolicitud.documento_soporte!)}
                        className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Descargar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Información de aprobación */}
              {(selectedSolicitud.estado === 'aprobada' || selectedSolicitud.estado === 'rechazada') && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
                    Información de {selectedSolicitud.estado === 'aprobada' ? 'Aprobación' : 'Rechazo'}
                  </h4>
                  <div className={`rounded-lg p-4 ${
                    selectedSolicitud.estado === 'aprobada'
                      ? 'bg-green-50 dark:bg-green-900'
                      : 'bg-red-50 dark:bg-red-900'
                  }`}>
                    <div className="space-y-2">
                      {selectedSolicitud.aprobada_por_nombre && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {selectedSolicitud.estado === 'aprobada' ? 'Aprobada por' : 'Rechazada por'}
                          </label>
                          <p className={`text-sm font-medium ${
                            selectedSolicitud.estado === 'aprobada'
                              ? 'text-green-900 dark:text-green-200'
                              : 'text-red-900 dark:text-red-200'
                          }`}>
                            {selectedSolicitud.aprobada_por_nombre}
                          </p>
                        </div>
                      )}

                      {selectedSolicitud.fecha_aprobacion && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Fecha de {selectedSolicitud.estado === 'aprobada' ? 'Aprobación' : 'Rechazo'}
                          </label>
                          <p className={`text-sm ${
                            selectedSolicitud.estado === 'aprobada'
                              ? 'text-green-900 dark:text-green-200'
                              : 'text-red-900 dark:text-red-200'
                          }`}>
                            {solicitudesService.formatearFecha(selectedSolicitud.fecha_aprobacion)}
                          </p>
                        </div>
                      )}

                      {selectedSolicitud.comentarios_aprobacion && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Comentarios
                          </label>
                          <p className={`text-sm whitespace-pre-wrap ${
                            selectedSolicitud.estado === 'aprobada'
                              ? 'text-green-900 dark:text-green-200'
                              : 'text-red-900 dark:text-red-200'
                          }`}>
                            {selectedSolicitud.comentarios_aprobacion}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
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

export default SolicitudesManager;