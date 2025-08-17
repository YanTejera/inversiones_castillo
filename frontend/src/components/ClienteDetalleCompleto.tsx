import React, { useState, useRef } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Camera,
  Upload,
  Download,
  FileText,
  CreditCard,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Award,
  Medal,
  Crown,
  Edit,
  Save,
  Trash2,
  Plus,
  UserCheck
} from 'lucide-react';
import { getEstadoPagoInfo, calcularSistemaCredito, getNivelIcon, getNivelColor, formatCurrency, formatDate, getBeneficios, type Cliente, type CompraCliente, type PagoCliente, type Fiador } from '../utils/clienteUtils';

interface ClienteDetalleCompletoProps {
  cliente: Cliente;
  onClose: () => void;
  onUpdate: (cliente: Cliente) => void;
  onVentaRapida: (cliente: Cliente) => void;
}

interface ModalState {
  type: 'none' | 'pago' | 'documento' | 'fiador-opciones' | 'fiador-form' | 'success' | 'info';
  isOpen: boolean;
  title?: string;
  message?: string;
  data?: any;
}

const ClienteDetalleCompleto: React.FC<ClienteDetalleCompletoProps> = ({
  cliente,
  onClose,
  onUpdate,
  onVentaRapida
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'pagos' | 'compras' | 'documentos' | 'fiador' | 'credito'>('info');
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({ type: 'none', isOpen: false });
  const [formData, setFormData] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const estadoPago = getEstadoPagoInfo(cliente);
  const sistemaCredito = calcularSistemaCredito(cliente);
  const NivelIcon = getNivelIcon(sistemaCredito.nivel);

  // Funciones helper para modales
  const showModal = (type: ModalState['type'], title?: string, message?: string, data?: any) => {
    setModalState({ type, isOpen: true, title, message, data });
  };

  const closeModal = () => {
    setModalState({ type: 'none', isOpen: false });
    setFormData({});
  };

  const showSuccessModal = (message: string) => {
    showModal('success', 'Éxito', message);
  };

  const showInfoModal = (message: string) => {
    showModal('info', 'Información', message);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newCliente = {
          ...cliente,
          foto_perfil: e.target?.result as string
        };
        onUpdate(newCliente);
        setEditingPhoto(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVentaRapidaClick = () => {
    // Mostrar mensaje informativo en lugar de redireccionar
    showInfoModal(`Función Nueva Venta para ${cliente.nombre} ${cliente.apellido}\n\nEsta función se integrará con el sistema de ventas próximamente.`);
  };

  const handlePagoCuota = () => {
    // Mostrar modal de pago
    showModal('pago', 'Registrar Pago de Cuota', `Registrar pago para ${cliente.nombre} ${cliente.apellido}`);
  };

  const procesarPago = (montoPago: number) => {
    const nuevoCliente = {
      ...cliente,
      deuda_total: Math.max(0, (cliente.deuda_total || 0) - montoPago),
      pagos_a_tiempo: (cliente.pagos_a_tiempo || 0) + 1,
      total_pagos: (cliente.total_pagos || 0) + 1
    };
    onUpdate(nuevoCliente);
    closeModal();
    showSuccessModal(`Pago de $${montoPago.toLocaleString()} registrado exitosamente.`);
  };

  const handleSubirDocumento = () => {
    showModal('documento', 'Subir Documentos', 'Seleccione los documentos que desea subir');
  };

  const procesarSubidaDocumento = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.multiple = true;
    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const fileNames = Array.from(files).map(f => f.name).join(', ');
        closeModal();
        showInfoModal(`Documentos seleccionados: ${fileNames}\n\nEn una implementación completa, estos se subirían al servidor.`);
      }
    };
    input.click();
  };

  const handleEditarFiador = () => {
    if (cliente.fiador) {
      // Mostrar opciones para fiador existente
      showModal('fiador-opciones', 'Gestión de Fiador', `Fiador actual: ${cliente.fiador.nombre_completo}`, cliente.fiador);
    } else {
      // Mostrar formulario para agregar nuevo fiador
      showModal('fiador-form', 'Agregar Nuevo Fiador', 'Complete los datos del fiador');
    }
  };

  const procesarFiador = (fiadorData: any, esEdicion: boolean = false) => {
    const fiadorActualizado = {
      id: esEdicion ? cliente.fiador?.id || Date.now() : Date.now(),
      nombre: fiadorData.nombre_completo?.split(' ')[0] || '',
      apellido: fiadorData.nombre_completo?.split(' ').slice(1).join(' ') || '',
      nombre_completo: fiadorData.nombre_completo,
      cedula: fiadorData.cedula || '',
      direccion: fiadorData.direccion || '',
      telefono: fiadorData.telefono || '',
      parentesco_cliente: fiadorData.parentesco_cliente || '',
      ocupacion: fiadorData.ocupacion || undefined,
      cliente: cliente.id
    };
    
    const clienteActualizado = {
      ...cliente,
      fiador: fiadorActualizado
    };
    onUpdate(clienteActualizado);
    closeModal();
    showSuccessModal(esEdicion ? 'Fiador editado exitosamente!' : 'Fiador agregado exitosamente!');
  };

  // Datos de ejemplo para pagos y compras
  const comprasEjemplo: CompraCliente[] = [
    {
      id: 1,
      venta_id: 101,
      fecha_compra: '2024-01-15',
      productos: [
        { id: 1, nombre: 'Yamaha FZ25', cantidad: 1, precio_unitario: 8500000, subtotal: 8500000 }
      ],
      monto_total: 8500000,
      tipo_venta: 'financiado',
      estado: 'activa',
      cuotas_totales: 24,
      cuotas_pagadas: 8,
      saldo_pendiente: 5100000,
      fecha_ultimo_pago: '2024-08-15'
    },
    {
      id: 2,
      venta_id: 102,
      fecha_compra: '2023-06-10',
      productos: [
        { id: 2, nombre: 'Honda CB160F', cantidad: 1, precio_unitario: 6200000, subtotal: 6200000 }
      ],
      monto_total: 6200000,
      tipo_venta: 'contado',
      estado: 'pagada'
    }
  ];

  const pagosEjemplo: PagoCliente[] = [
    {
      id: 1,
      compra_id: 1,
      numero_cuota: 8,
      fecha_pago: '2024-08-15',
      monto_pagado: 380000,
      metodo_pago: 'Transferencia',
      referencia: 'TRF-001',
      fue_puntual: true,
      factura_url: '/facturas/pago-001.pdf'
    },
    {
      id: 2,
      compra_id: 1,
      numero_cuota: 7,
      fecha_pago: '2024-07-20',
      monto_pagado: 380000,
      metodo_pago: 'Efectivo',
      fue_puntual: false,
      dias_atraso: 5,
      mora_aplicada: 15000,
      factura_url: '/facturas/pago-002.pdf'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {/* Foto de perfil */}
            <div className="relative group">
              {cliente.foto_perfil ? (
                <img 
                  src={cliente.foto_perfil} 
                  alt={`${cliente.nombre} ${cliente.apellido}`}
                  className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="bg-blue-100 rounded-full p-4">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              )}
              
              {/* Badge de nivel */}
              <div className={`absolute -bottom-1 -right-1 ${getNivelColor(sistemaCredito.nivel)} rounded-full p-1`}>
                <NivelIcon className="h-4 w-4" />
              </div>
              
              {/* Botón de editar foto */}
              <button
                onClick={() => setEditingPhoto(true)}
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {cliente.nombre} {cliente.apellido}
              </h2>
              <p className="text-gray-600">CC: {cliente.cedula}</p>
              <div className="flex items-center mt-2 space-x-3">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${getNivelColor(sistemaCredito.nivel)}`}>
                  {sistemaCredito.nivel.toUpperCase()} - {sistemaCredito.score} pts
                </span>
                <span className="text-sm text-gray-500">
                  Cliente desde {cliente.cliente_desde ? formatDate(cliente.cliente_desde) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative group">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Gestión
              </button>
              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-1">
                  <button
                    onClick={handleVentaRapidaClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Nueva Venta
                  </button>
                  <button
                    onClick={handlePagoCuota}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Pago de Cuota
                  </button>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'info', label: 'Información General', icon: User },
              { id: 'pagos', label: 'Historial de Pagos', icon: CreditCard },
              { id: 'compras', label: 'Compras', icon: ShoppingCart },
              { id: 'documentos', label: 'Documentos', icon: FileText },
              { id: 'fiador', label: 'Fiador', icon: UserCheck },
              { id: 'credito', label: 'Crédito y Lealtad', icon: Star }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Estado de pago destacado */}
              <div className={`p-4 rounded-lg border-2 ${estadoPago.color_clase}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {estadoPago.estado === 'atrasado' && <AlertTriangle className="h-5 w-5 mr-2" />}
                    {estadoPago.estado === 'proximo' && <Clock className="h-5 w-5 mr-2" />}
                    {estadoPago.estado === 'al_dia' && <CheckCircle className="h-5 w-5 mr-2" />}
                    <div>
                      <h3 className="font-semibold">Estado de Pagos</h3>
                      <p className="text-sm">{estadoPago.mensaje}</p>
                    </div>
                  </div>
                  {cliente.cuota_actual && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Cuota Actual</p>
                      <p className="text-lg font-bold">{formatCurrency(cliente.cuota_actual)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Información personal en grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Información Personal</h4>
                  <div className="space-y-2">
                    {cliente.telefono && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">{cliente.telefono}</span>
                      </div>
                    )}
                    {cliente.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">{cliente.email}</span>
                      </div>
                    )}
                    {cliente.direccion && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">{cliente.direccion}</span>
                      </div>
                    )}
                    {cliente.fecha_nacimiento && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">{formatDate(cliente.fecha_nacimiento)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Información Financiera</h4>
                  <div className="space-y-2">
                    {cliente.deuda_total && (
                      <div>
                        <p className="text-sm text-gray-600">Deuda Total</p>
                        <p className="font-semibold text-red-600">{formatCurrency(cliente.deuda_total)}</p>
                      </div>
                    )}
                    {cliente.ingresos && (
                      <div>
                        <p className="text-sm text-gray-600">Ingresos Declarados</p>
                        <p className="font-semibold text-green-600">{formatCurrency(cliente.ingresos)}</p>
                      </div>
                    )}
                    {cliente.proximo_pago && (
                      <div>
                        <p className="text-sm text-gray-600">Próximo Pago</p>
                        <p className="font-semibold">{formatDate(cliente.proximo_pago)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Información Adicional</h4>
                  <div className="space-y-2">
                    {cliente.ocupacion && (
                      <div>
                        <p className="text-sm text-gray-600">Ocupación</p>
                        <p className="font-semibold">{cliente.ocupacion}</p>
                      </div>
                    )}
                    {cliente.estado_civil && (
                      <div>
                        <p className="text-sm text-gray-600">Estado Civil</p>
                        <p className="font-semibold">{cliente.estado_civil}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Fecha de Registro</p>
                      <p className="font-semibold">{formatDate(cliente.fecha_registro)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pagos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Historial de Pagos</h3>
                <button 
                  onClick={handlePagoCuota}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Registrar Pago
                </button>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cuota #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Método
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pagosEjemplo.map((pago) => (
                      <tr key={pago.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(pago.fecha_pago)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pago.numero_cuota || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(pago.monto_pagado)}
                          {pago.mora_aplicada && (
                            <span className="text-red-600 text-xs block">
                              +{formatCurrency(pago.mora_aplicada)} mora
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pago.metodo_pago}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            pago.fue_puntual 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {pago.fue_puntual ? 'Puntual' : `${pago.dias_atraso} días tarde`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {pago.factura_url && (
                            <button className="text-blue-600 hover:text-blue-900 mr-2">
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'compras' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Historial de Compras y Contratos</h3>
              </div>

              <div className="space-y-4">
                {comprasEjemplo.map((compra) => (
                  <div key={compra.id} className="bg-white border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Venta #{compra.venta_id}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(compra.fecha_compra)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          compra.estado === 'activa' ? 'bg-blue-100 text-blue-800' :
                          compra.estado === 'pagada' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {compra.estado.toUpperCase()}
                        </span>
                        <button 
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 flex items-center gap-1 text-sm"
                          title="Ver contrato"
                        >
                          <FileText className="h-3 w-3" />
                          Contrato
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Monto Total</p>
                        <p className="font-semibold">{formatCurrency(compra.monto_total)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tipo de Venta</p>
                        <p className="font-semibold capitalize">{compra.tipo_venta}</p>
                      </div>
                      {compra.cuotas_totales && (
                        <div>
                          <p className="text-sm text-gray-600">Cuotas</p>
                          <p className="font-semibold">
                            {compra.cuotas_pagadas}/{compra.cuotas_totales}
                          </p>
                        </div>
                      )}
                      {compra.saldo_pendiente && (
                        <div>
                          <p className="text-sm text-gray-600">Saldo Pendiente</p>
                          <p className="font-semibold text-red-600">
                            {formatCurrency(compra.saldo_pendiente)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-gray-900">Productos</h5>
                        {compra.estado === 'activa' && (
                          <button className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                            Ver Recibos Históricos
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {compra.productos.map((producto) => (
                          <div key={producto.id} className="flex justify-between items-center">
                            <span className="text-sm text-gray-900">
                              {producto.nombre} (x{producto.cantidad})
                            </span>
                            <span className="text-sm font-medium">
                              {formatCurrency(producto.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sección de documentos del contrato */}
                    <div className="border-t mt-4 pt-4">
                      <h6 className="font-medium text-gray-900 mb-3">Documentos del Contrato</h6>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { nombre: 'Contrato Original', tipo: 'PDF', icono: FileText },
                          { nombre: 'Pagos Realizados', tipo: 'PDF', icono: CreditCard },
                          { nombre: 'Garantías', tipo: 'PDF', icono: FileText },
                          { nombre: 'Recibos', tipo: 'ZIP', icono: Download }
                        ].map((doc, index) => {
                          const IconComponent = doc.icono;
                          return (
                            <button 
                              key={index}
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                            >
                              <IconComponent className="h-4 w-4 text-blue-600" />
                              <div className="text-left">
                                <p className="text-xs font-medium text-gray-900">{doc.nombre}</p>
                                <p className="text-xs text-gray-500">{doc.tipo}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documentos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Documentos del Cliente</h3>
                <button 
                  onClick={handleSubirDocumento}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Subir Documento
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Foto de perfil como documento */}
                {cliente.foto_perfil && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <img 
                          src={cliente.foto_perfil} 
                          alt="Foto de perfil"
                          className="h-12 w-12 rounded-lg object-cover mr-3"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">Foto de Perfil</h4>
                          <p className="text-sm text-gray-600">{formatDate(cliente.fecha_registro)}</p>
                          <span className="text-xs text-blue-600 font-medium">IMAGEN</span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-yellow-600 hover:bg-yellow-50 rounded">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Documentos regulares */}
                {[
                  { nombre: 'Cédula de Ciudadanía', fecha: '2024-01-15', tipo: 'PDF' },
                  { nombre: 'Comprobante de Ingresos', fecha: '2024-01-10', tipo: 'PDF' },
                  { nombre: 'Referencias Comerciales', fecha: '2024-01-08', tipo: 'PDF' }
                ].map((doc, index) => (
                  <div key={index} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.nombre}</h4>
                          <p className="text-sm text-gray-600">{formatDate(doc.fecha)}</p>
                          <span className="text-xs text-gray-500">{doc.tipo}</span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'fiador' && (
            <div className="space-y-6">
              {cliente.fiador ? (
                <div className="bg-white">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Información del Fiador</h3>
                    <button 
                      onClick={handleEditarFiador}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar Fiador
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Información Personal */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Datos Personales</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Nombre Completo</p>
                          <p className="font-semibold">{cliente.fiador.nombre_completo}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Cédula</p>
                          <p className="font-semibold">{cliente.fiador.cedula}</p>
                        </div>
                        {cliente.fiador.fecha_nacimiento && (
                          <div>
                            <p className="text-sm text-gray-600">Fecha de Nacimiento</p>
                            <p className="font-semibold">{formatDate(cliente.fiador.fecha_nacimiento)}</p>
                          </div>
                        )}
                        {cliente.fiador.estado_civil && (
                          <div>
                            <p className="text-sm text-gray-600">Estado Civil</p>
                            <p className="font-semibold">{cliente.fiador.estado_civil}</p>
                          </div>
                        )}
                        {cliente.fiador.parentesco_cliente && (
                          <div>
                            <p className="text-sm text-gray-600">Parentesco</p>
                            <p className="font-semibold text-blue-600">{cliente.fiador.parentesco_cliente}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información de Contacto */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Contacto</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Dirección</p>
                          <p className="font-semibold">{cliente.fiador.direccion}</p>
                        </div>
                        {cliente.fiador.telefono && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-500 mr-2" />
                            <div>
                              <p className="text-sm text-gray-600">Teléfono</p>
                              <p className="font-semibold">{cliente.fiador.telefono}</p>
                            </div>
                          </div>
                        )}
                        {cliente.fiador.celular && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-500 mr-2" />
                            <div>
                              <p className="text-sm text-gray-600">Celular</p>
                              <p className="font-semibold">{cliente.fiador.celular}</p>
                            </div>
                          </div>
                        )}
                        {cliente.fiador.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-500 mr-2" />
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-semibold">{cliente.fiador.email}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información Laboral */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Información Laboral</h4>
                      <div className="space-y-2">
                        {cliente.fiador.ocupacion && (
                          <div>
                            <p className="text-sm text-gray-600">Ocupación</p>
                            <p className="font-semibold">{cliente.fiador.ocupacion}</p>
                          </div>
                        )}
                        {cliente.fiador.lugar_trabajo && (
                          <div>
                            <p className="text-sm text-gray-600">Lugar de Trabajo</p>
                            <p className="font-semibold">{cliente.fiador.lugar_trabajo}</p>
                          </div>
                        )}
                        {cliente.fiador.telefono_trabajo && (
                          <div>
                            <p className="text-sm text-gray-600">Teléfono de Trabajo</p>
                            <p className="font-semibold">{cliente.fiador.telefono_trabajo}</p>
                          </div>
                        )}
                        {cliente.fiador.ingresos && (
                          <div>
                            <p className="text-sm text-gray-600">Ingresos</p>
                            <p className="font-semibold text-green-600">{formatCurrency(cliente.fiador.ingresos)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Referencias */}
                  {cliente.fiador.referencias_personales && (
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Referencias Personales</h4>
                      <p className="text-gray-700">{cliente.fiador.referencias_personales}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Fiador Registrado</h3>
                  <p className="text-gray-500 mb-6">Este cliente no tiene un fiador asignado.</p>
                  <button 
                    onClick={handleEditarFiador}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Fiador
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'credito' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Nivel {sistemaCredito.nivel.toUpperCase()}</h3>
                    <p className="text-blue-100">Score de Crédito: {sistemaCredito.score}/1000</p>
                  </div>
                  <div className="text-right">
                    <NivelIcon className="h-12 w-12 mb-2" />
                    <p className="text-sm text-blue-100">{sistemaCredito.puntos} puntos</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Historial de Pagos</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total de Pagos:</span>
                      <span className="font-semibold">{sistemaCredito.historial_pagos.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pagos Puntuales:</span>
                      <span className="font-semibold text-green-600">
                        {sistemaCredito.historial_pagos.puntuales}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pagos Tardíos:</span>
                      <span className="font-semibold text-red-600">
                        {sistemaCredito.historial_pagos.tardios}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>% Puntualidad:</span>
                      <span className="font-semibold">
                        {sistemaCredito.historial_pagos.porcentaje_puntualidad.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Beneficios Actuales</h4>
                  <div className="space-y-2">
                    {sistemaCredito.beneficios.map((beneficio, index) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        <span className="text-sm">{beneficio}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de edición de foto */}
        {editingPhoto && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Cambiar Foto de Perfil</h3>
              <div className="space-y-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Upload className="h-5 w-5" />
                  Seleccionar Archivo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingPhoto(false)}
                    className="flex-1 bg-gray-300 text-gray-700 p-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modales personalizados */}
        {modalState.isOpen && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-2xl">
              {/* Modal de pago */}
              {modalState.type === 'pago' && (
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">{modalState.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{modalState.message}</p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto del pago
                    </label>
                    <input
                      type="number"
                      placeholder="Ingrese el monto"
                      value={formData.monto || ''}
                      onChange={(e) => setFormData({...formData, monto: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={closeModal}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (formData.monto && !isNaN(Number(formData.monto))) {
                          procesarPago(Number(formData.monto));
                        }
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                    >
                      Registrar Pago
                    </button>
                  </div>
                </div>
              )}

              {/* Modal de documentos */}
              {modalState.type === 'documento' && (
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <Upload className="h-6 w-6 text-blue-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">{modalState.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-6">{modalState.message}</p>
                  <div className="flex space-x-3">
                    <button
                      onClick={closeModal}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={procesarSubidaDocumento}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                    >
                      Seleccionar Archivos
                    </button>
                  </div>
                </div>
              )}

              {/* Modal de opciones de fiador */}
              {modalState.type === 'fiador-opciones' && (
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <UserCheck className="h-6 w-6 text-blue-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">{modalState.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-6">{modalState.message}</p>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        showModal('fiador-form', 'Editar Fiador', 'Modifique los datos del fiador', modalState.data);
                      }}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar Fiador Actual
                    </button>
                    <button
                      onClick={() => {
                        showModal('fiador-form', 'Agregar Nuevo Fiador', 'Complete los datos del nuevo fiador');
                      }}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Nuevo Fiador
                    </button>
                    <button
                      onClick={closeModal}
                      className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Modal de formulario de fiador */}
              {modalState.type === 'fiador-form' && (
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center mb-4">
                    <UserCheck className="h-6 w-6 text-blue-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">{modalState.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{modalState.message}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        placeholder="Nombre y apellidos"
                        value={formData.nombre_completo || modalState.data?.nombre_completo || ''}
                        onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cédula *
                      </label>
                      <input
                        type="text"
                        placeholder="Número de cédula"
                        value={formData.cedula || modalState.data?.cedula || ''}
                        onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección *
                      </label>
                      <input
                        type="text"
                        placeholder="Dirección de residencia"
                        value={formData.direccion || modalState.data?.direccion || ''}
                        onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        placeholder="Número de teléfono"
                        value={formData.telefono || modalState.data?.telefono || ''}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parentesco con el Cliente
                      </label>
                      <select
                        value={formData.parentesco_cliente || modalState.data?.parentesco_cliente || ''}
                        onChange={(e) => setFormData({...formData, parentesco_cliente: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccione parentesco</option>
                        <option value="Padre/Madre">Padre/Madre</option>
                        <option value="Hermano/a">Hermano/a</option>
                        <option value="Tío/a">Tío/a</option>
                        <option value="Primo/a">Primo/a</option>
                        <option value="Cónyuge">Cónyuge</option>
                        <option value="Amigo/a">Amigo/a</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ocupación
                      </label>
                      <input
                        type="text"
                        placeholder="Ocupación (opcional)"
                        value={formData.ocupacion || modalState.data?.ocupacion || ''}
                        onChange={(e) => setFormData({...formData, ocupacion: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={closeModal}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (formData.nombre_completo && formData.cedula && formData.direccion) {
                          procesarFiador(formData, !!modalState.data);
                        }
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                    >
                      {modalState.data ? 'Actualizar' : 'Agregar'} Fiador
                    </button>
                  </div>
                </div>
              )}

              {/* Modal de éxito */}
              {modalState.type === 'success' && (
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">{modalState.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-6 whitespace-pre-line">{modalState.message}</p>
                  <button
                    onClick={closeModal}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                  >
                    Aceptar
                  </button>
                </div>
              )}

              {/* Modal de información */}
              {modalState.type === 'info' && (
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-blue-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">{modalState.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-6 whitespace-pre-line">{modalState.message}</p>
                  <button
                    onClick={closeModal}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    Aceptar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClienteDetalleCompleto;