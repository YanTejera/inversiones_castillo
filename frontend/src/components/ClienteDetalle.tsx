import React, { useState, useEffect } from 'react';
import {
  User,
  Users,
  FileText,
  Plus,
  Edit,
  Eye,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Download
} from 'lucide-react';
import { fiadorService } from '../services/fiadorService';
import { documentoService } from '../services/documentoService';
import { clienteVentasService } from '../services/clienteVentasService';
import FiadorFormMejorado from './FiadorFormMejorado';
import DocumentoForm from './DocumentoForm';
import DocumentoViewer from './DocumentoViewer';
import type { Cliente, Fiador, Documento } from '../types';

interface VentaResumen {
  id: number;
  fecha_venta: string;
  tipo_venta: string;
  tipo_venta_display: string;
  monto_total: string;
  monto_inicial: string;
  cuotas: number;
  estado: string;
  estado_display: string;
  saldo_pendiente: string;
  detalles: Array<{
    moto_info: {
      marca: string;
      modelo: string;
      año: number;
    };
  }>;
}

interface ClienteDetalleProps {
  cliente: Cliente;
  onBack: () => void;
}

const ClienteDetalle: React.FC<ClienteDetalleProps> = ({ cliente, onBack }) => {
  const [fiador, setFiador] = useState<Fiador | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [ventasActivas, setVentasActivas] = useState<VentaResumen[]>([]);
  const [ventasFinalizadas, setVentasFinalizadas] = useState<VentaResumen[]>([]);
  const [resumenVentas, setResumenVentas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showFiadorForm, setShowFiadorForm] = useState(false);
  const [showDocumentoForm, setShowDocumentoForm] = useState(false);
  const [selectedFiador, setSelectedFiador] = useState<Fiador | null>(null);
  const [selectedDocumento, setSelectedDocumento] = useState<Documento | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [showDocumentoViewer, setShowDocumentoViewer] = useState(false);
  const [documentoParaVer, setDocumentoParaVer] = useState<Documento | null>(null);

  useEffect(() => {
    loadData();
  }, [cliente.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fiadorData, documentosData, ventasData] = await Promise.all([
        fiadorService.getFiador(cliente.id),
        documentoService.getDocumentos(cliente.id),
        clienteVentasService.getVentasCliente(cliente.id)
      ]);
      
      setFiador(fiadorData);
      setDocumentos(documentosData);
      setVentasActivas(ventasData.activas);
      setVentasFinalizadas(ventasData.finalizadas);
      setResumenVentas(ventasData.resumen);
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fiador handlers
  const handleCreateFiador = () => {
    setSelectedFiador(null);
    setFormMode('create');
    setShowFiadorForm(true);
  };

  const handleEditFiador = (fiadorData: Fiador) => {
    setSelectedFiador(fiadorData);
    setFormMode('edit');
    setShowFiadorForm(true);
  };

  const handleViewFiador = (fiadorData: Fiador) => {
    setSelectedFiador(fiadorData);
    setFormMode('view');
    setShowFiadorForm(true);
  };

  const handleSaveFiador = async (fiadorData: Partial<Fiador>, documentos?: Array<{tipo_documento: string, descripcion: string, archivo?: File}>) => {
    console.log('=== HANDLE SAVE FIADOR ===');
    console.log('fiadorData received:', fiadorData);
    console.log('documentos received:', documentos);
    console.log('formMode:', formMode);
    
    try {
      if (formMode === 'create') {
        console.log('🆕 Creating new fiador...');
        if (documentos && documentos.length > 0) {
          console.log('Creating with documents...');
          await fiadorService.createFiadorWithDocuments(fiadorData as any, documentos);
        } else {
          console.log('Creating without documents...');
          await fiadorService.createFiador(fiadorData as any);
        }
      } else if (formMode === 'edit' && fiadorData.id) {
        console.log('✏️ Updating existing fiador with ID:', fiadorData.id);
        await fiadorService.updateFiador(fiadorData as any);
      }
      console.log('✅ Fiador operation completed, reloading data...');
      await loadData();
      console.log('✅ Data reloaded, closing form...');
      setShowFiadorForm(false); // Cerrar el formulario después de guardar exitosamente
      console.log('✅ Form closed successfully');
    } catch (error: any) {
      console.error('Error saving fiador:', error);
      
      // Mostrar el error al usuario
      let errorMessage = 'Error al guardar el fiador';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        } else {
          // Mostrar errores de campo específico
          const fieldErrors = Object.entries(error.response.data)
            .map(([field, errors]: [string, any]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors[0]}`;
              }
              return `${field}: ${errors}`;
            })
            .join(', ');
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      throw error;
    }
  };

  const handleDeleteFiador = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este fiador?')) {
      try {
        await fiadorService.deleteFiador(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting fiador:', error);
        alert('Error al eliminar el fiador');
      }
    }
  };

  // Documento handlers
  const handleCreateDocumento = () => {
    setSelectedDocumento(null);
    setFormMode('create');
    setShowDocumentoForm(true);
  };

  const handleEditDocumento = (documento: Documento) => {
    setSelectedDocumento(documento);
    setFormMode('edit');
    setShowDocumentoForm(true);
  };

  const handleViewDocumento = (documento: Documento) => {
    setSelectedDocumento(documento);
    setFormMode('view');
    setShowDocumentoForm(true);
  };

  const handleSaveDocumento = async (documentoData: Partial<Documento>, archivo?: File) => {
    try {
      if (formMode === 'create') {
        await documentoService.createDocumento(documentoData as any, archivo);
      } else if (formMode === 'edit' && documentoData.id) {
        await documentoService.updateDocumento(documentoData as any, archivo);
      }
      await loadData();
    } catch (error) {
      console.error('Error saving documento:', error);
      throw error;
    }
  };

  const handleDeleteDocumento = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este documento?')) {
      try {
        await documentoService.deleteDocumento(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting documento:', error);
        alert('Error al eliminar el documento');
      }
    }
  };

  const handleShowDocumento = (documento: Documento) => {
    setDocumentoParaVer(documento);
    setShowDocumentoViewer(true);
  };

  const getDocumentStatus = () => {
    const tiposRequeridos = ['cedula', 'prueba_direccion'];
    const tiposExistentes = documentos.map(doc => doc.tipo_documento);
    const faltantes = tiposRequeridos.filter(tipo => !tiposExistentes.includes(tipo));
    
    return {
      completo: faltantes.length === 0,
      faltantes: faltantes.length,
      total: tiposRequeridos.length
    };
  };

  const getDocumentsByPropietario = (propietario: string) => {
    return documentos.filter(doc => doc.propietario === propietario);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const docStatus = getDocumentStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Volver a la lista
          </button>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 rounded-full p-3">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {cliente.nombre_completo}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
              <div className="flex items-center text-gray-600">
                <CreditCard className="h-4 w-4 mr-2" />
                <span>Cédula: {cliente.cedula}</span>
              </div>
              {cliente.telefono && (
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{cliente.telefono}</span>
                </div>
              )}
              {cliente.email && (
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{cliente.email}</span>
                </div>
              )}
              {cliente.direccion && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{cliente.direccion}</span>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Registrado: {formatDate(cliente.fecha_registro)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fiador Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Fiador
            </h2>
            {fiador ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {fiador ? 'Fiador registrado' : 'No hay fiador registrado'}
          </p>
          {!fiador && (
            <button
              onClick={handleCreateFiador}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Fiador
            </button>
          )}
        </div>

        {/* Documents Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Documentos
            </h2>
            {docStatus.completo ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {documentos.length} documentos • {docStatus.faltantes} faltantes
          </p>
          <button
            onClick={handleCreateDocumento}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Documento
          </button>
        </div>
      </div>

      {/* Fiador Details */}
      {fiador && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Información del Fiador</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Información Personal */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Información Personal</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Nombre Completo</label>
                    <p className="text-sm text-gray-900">{fiador.nombre} {fiador.apellido}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Cédula</label>
                    <p className="text-sm text-gray-900">{fiador.cedula}</p>
                  </div>
                  {fiador.parentesco_cliente && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Parentesco</label>
                      <p className="text-sm text-gray-900">{fiador.parentesco_cliente}</p>
                    </div>
                  )}
                  {fiador.fecha_nacimiento && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Fecha de Nacimiento</label>
                      <p className="text-sm text-gray-900">{formatDate(fiador.fecha_nacimiento)}</p>
                    </div>
                  )}
                  {fiador.estado_civil && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Estado Civil</label>
                      <p className="text-sm text-gray-900">{fiador.estado_civil}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de Contacto */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Contacto</h4>
                <div className="space-y-3">
                  {fiador.telefono && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Teléfono</label>
                      <p className="text-sm text-gray-900">{fiador.telefono}</p>
                    </div>
                  )}
                  {fiador.celular && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Celular</label>
                      <p className="text-sm text-gray-900">{fiador.celular}</p>
                    </div>
                  )}
                  {fiador.email && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900">{fiador.email}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-500">Dirección</label>
                    <p className="text-sm text-gray-900">{fiador.direccion}</p>
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Información Laboral</h4>
                <div className="space-y-3">
                  {fiador.ocupacion && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Ocupación</label>
                      <p className="text-sm text-gray-900">{fiador.ocupacion}</p>
                    </div>
                  )}
                  {fiador.lugar_trabajo && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Lugar de Trabajo</label>
                      <p className="text-sm text-gray-900">{fiador.lugar_trabajo}</p>
                    </div>
                  )}
                  {fiador.telefono_trabajo && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Tel. Trabajo</label>
                      <p className="text-sm text-gray-900">{fiador.telefono_trabajo}</p>
                    </div>
                  )}
                  {fiador.ingresos && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Ingresos Mensuales</label>
                      <p className="text-sm text-gray-900">{formatCurrency(fiador.ingresos)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {fiador.referencias_personales && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-500">Referencias Personales</label>
                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{fiador.referencias_personales}</p>
              </div>
            )}

            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => handleViewFiador(fiador)}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </button>
              <button
                onClick={() => handleEditFiador(fiador)}
                className="text-green-600 hover:text-green-800 flex items-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </button>
              <button
                onClick={() => handleDeleteFiador(fiador.id!)}
                className="text-red-600 hover:text-red-800 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compras Activas */}
      {ventasActivas.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              Compras Activas
              <span className="ml-2 bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {ventasActivas.length}
              </span>
            </h3>
          </div>
          <div className="p-6">
            <div className="grid gap-4">
              {ventasActivas.map((venta) => (
                <div key={venta.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Venta #{venta.id} - {venta.tipo_venta_display}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(venta.fecha_venta)}
                      </p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                      {venta.estado_display}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Total:</span>
                      <p className="font-medium">{formatCurrency(venta.monto_total)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Inicial:</span>
                      <p className="font-medium">{formatCurrency(venta.monto_inicial)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Cuotas:</span>
                      <p className="font-medium">{venta.cuotas}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Saldo:</span>
                      <p className="font-medium text-orange-600">{formatCurrency(venta.saldo_pendiente)}</p>
                    </div>
                  </div>
                  {venta.detalles && venta.detalles.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">Productos:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {venta.detalles.map((detalle, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {detalle.moto_info?.marca} {detalle.moto_info?.modelo}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compras Finalizadas */}
      {ventasFinalizadas.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              Compras Finalizadas
              <span className="ml-2 bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {ventasFinalizadas.length}
              </span>
            </h3>
          </div>
          <div className="p-6">
            <div className="grid gap-4">
              {ventasFinalizadas.slice(0, 3).map((venta) => (
                <div key={venta.id} className="border border-gray-200 rounded-lg p-4 opacity-75">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Venta #{venta.id} - {venta.tipo_venta_display}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(venta.fecha_venta)}
                      </p>
                    </div>
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                      {venta.estado_display}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Total:</span>
                      <p className="font-medium">{formatCurrency(venta.monto_total)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Cuotas:</span>
                      <p className="font-medium">{venta.cuotas}</p>
                    </div>
                  </div>
                </div>
              ))}
              {ventasFinalizadas.length > 3 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  ... y {ventasFinalizadas.length - 3} compras más
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Documentos</h3>
        </div>
        <div className="p-6">
          {documentos.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay documentos registrados</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Documentos del Cliente */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Documentos del Cliente ({getDocumentsByPropietario('cliente').length})
                </h4>
                {getDocumentsByPropietario('cliente').length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Sin documentos del cliente</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getDocumentsByPropietario('cliente').map((documento) => (
                      <div key={documento.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {documento.tipo_documento_display}
                            </h5>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {documento.descripcion}
                            </p>
                          </div>
                        </div>
                        {documento.archivo && (
                          <div className="mt-3 mb-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowDocumento(documento);
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Ver archivo
                            </button>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mb-3">
                          {documento.fecha_creacion && formatDate(documento.fecha_creacion)}
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewDocumento(documento)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditDocumento(documento)}
                            className="text-green-600 hover:text-green-800"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocumento(documento.id!)}
                            className="text-red-600 hover:text-red-800"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documentos del Fiador */}
              {fiador && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Documentos del Fiador ({getDocumentsByPropietario('fiador').length})
                  </h4>
                  {getDocumentsByPropietario('fiador').length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Sin documentos del fiador</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getDocumentsByPropietario('fiador').map((documento) => (
                        <div key={documento.id} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5 className="font-medium text-gray-900">
                                {documento.tipo_documento_display}
                              </h5>
                              <p className="text-sm text-blue-600 font-medium">
                                {fiador.nombre} {fiador.apellido}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {documento.descripcion}
                              </p>
                            </div>
                          </div>
                          {documento.archivo && (
                            <div className="mt-3 mb-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShowDocumento(documento);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Ver archivo
                              </button>
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mb-3">
                            {documento.fecha_creacion && formatDate(documento.fecha_creacion)}
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleViewDocumento(documento)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditDocumento(documento)}
                              className="text-green-600 hover:text-green-800"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocumento(documento.id!)}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Forms */}
      {showFiadorForm && (
        <FiadorFormMejorado
          fiador={selectedFiador}
          clienteId={cliente.id}
          clienteNombre={cliente.nombre_completo}
          mode={formMode}
          onClose={() => setShowFiadorForm(false)}
          onSave={handleSaveFiador}
        />
      )}

      {showDocumentoForm && (
        <DocumentoForm
          documento={selectedDocumento}
          clienteId={cliente.id}
          clienteNombre={cliente.nombre_completo}
          mode={formMode}
          onClose={() => setShowDocumentoForm(false)}
          onSave={handleSaveDocumento}
        />
      )}

      {showDocumentoViewer && documentoParaVer && (
        <DocumentoViewer
          archivo={documentoParaVer.archivo!}
          titulo={`${documentoParaVer.tipo_documento_display} - ${documentoParaVer.propietario_display}`}
          onClose={() => {
            setShowDocumentoViewer(false);
            setDocumentoParaVer(null);
          }}
        />
      )}
    </div>
  );
};

export default ClienteDetalle;