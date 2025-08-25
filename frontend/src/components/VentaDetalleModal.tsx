import React, { useState } from 'react';
import { 
  X, 
  User, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  FileText, 
  Bike,
  Clock,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  Banknote,
  Calculator,
  Clipboard,
  Download
} from 'lucide-react';
import { componentStyles, colors, statusColors } from '../styles/colors';
import type { Venta } from '../types';

interface VentaDetalleModalProps {
  venta: Venta;
  onClose: () => void;
}

const VentaDetalleModal: React.FC<VentaDetalleModalProps> = ({ venta, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    };
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa':
        return statusColors.venta.activa;
      case 'finalizada':
        return statusColors.venta.finalizada;
      case 'cancelada':
        return statusColors.venta.cancelada;
      default:
        return colors.badge.neutral;
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'pagos', label: 'Plan de Pagos', icon: CreditCard },
    { id: 'documentos', label: 'Documentos', icon: FileText },
    { id: 'motocicleta', label: 'Motocicleta', icon: Bike }
  ];

  const dateTime = formatDateTime(venta.fecha_venta);

  return (
    <div className={componentStyles.modalOverlay}>
      <div className={componentStyles.modalContainer}>
        {/* Header */}
        <div className={componentStyles.modalHeader}>
          <div>
            <h2 className={`text-2xl font-bold ${colors.text.primary}`}>
              Venta #{venta.id}
            </h2>
            <div className={`flex items-center gap-4 mt-2 text-sm ${colors.text.secondary}`}>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{dateTime.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{dateTime.time}</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(venta.estado)}`}>
                {venta.estado_display}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`${colors.text.muted} hover:${colors.text.secondary} p-2 ${colors.hover.light} rounded-lg transition-colors`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`${colors.border.medium} border-b-4`}>
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 font-medium text-sm flex items-center gap-2 transition-all ${
                    activeTab === tab.id
                      ? componentStyles.tabActive
                      : componentStyles.tabInactive
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className={`${componentStyles.modalContent} max-h-[calc(95vh-200px)]`}>
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Información de la Venta */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      Información de la Venta
                    </h3>
                    <div className="bg-slate-50 border-3 border-slate-300 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-700">Tipo de Venta:</span>
                        <span className={`font-medium ${venta.tipo_venta === 'contado' ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {venta.tipo_venta_display}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-700">Monto Total:</span>
                        <span className="font-bold text-lg text-emerald-600">
                          {formatCurrency(venta.monto_total)}
                        </span>
                      </div>
                      {venta.tipo_venta === 'financiado' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Monto Inicial:</span>
                            <span className="font-medium">
                              {formatCurrency(venta.monto_inicial)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Saldo Pendiente:</span>
                            <span className={`font-medium ${venta.saldo_pendiente > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {formatCurrency(venta.saldo_pendiente)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Información del Vendedor */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-blue-600" />
                      Vendedor
                    </h3>
                    <div className="bg-slate-50 border-3 border-slate-300 rounded-lg p-4">
                      {venta.usuario_info ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-500" />
                            <span className="font-medium">
                              {venta.usuario_info.first_name} {venta.usuario_info.last_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-500" />
                            <span className="text-sm text-slate-700">
                              {venta.usuario_info.email}
                            </span>
                          </div>
                          {venta.usuario_info.telefono && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-slate-500" />
                              <span className="text-sm text-slate-700">
                                {venta.usuario_info.telefono}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">Información del vendedor no disponible</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información del Cliente */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    Información del Cliente
                  </h3>
                  {venta.cliente_info ? (
                    <div className="bg-slate-50 border-3 border-slate-300 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-slate-700">Nombre Completo:</span>
                        <p className="font-medium text-lg">
                          {venta.cliente_info.nombre} {venta.cliente_info.apellido}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-700 text-sm">Cédula:</span>
                          <p className="font-medium">{venta.cliente_info.cedula}</p>
                        </div>
                        <div>
                          <span className="text-slate-700 text-sm">Teléfono:</span>
                          <p className="font-medium">{venta.cliente_info.telefono}</p>
                        </div>
                      </div>
                      {venta.cliente_info.email && (
                        <div>
                          <span className="text-slate-700 text-sm">Email:</span>
                          <p className="font-medium">{venta.cliente_info.email}</p>
                        </div>
                      )}
                      {venta.cliente_info.direccion && (
                        <div>
                          <span className="text-slate-700 text-sm flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Dirección:
                          </span>
                          <p className="font-medium">{venta.cliente_info.direccion}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border-3 border-slate-300 rounded-lg p-4">
                      <p className="text-slate-500">Información del cliente no disponible</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Plan de Pagos Tab */}
          {activeTab === 'pagos' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Resumen Financiero */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-emerald-600" />
                    Resumen Financiero
                  </h3>
                  <div className="bg-slate-50 border-3 border-slate-300 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Monto Total:</span>
                      <span className="font-bold text-xl text-emerald-600">
                        {formatCurrency(venta.monto_total)}
                      </span>
                    </div>
                    
                    {venta.tipo_venta === 'financiado' ? (
                      <>
                        <div className="border-t pt-3">
                          <div className="flex justify-between">
                            <span className="text-slate-700">Monto Inicial:</span>
                            <span className="font-medium">
                              {formatCurrency(venta.monto_inicial)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Total con Intereses:</span>
                            <span className="font-medium">
                              {formatCurrency(venta.monto_total_con_intereses)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Número de Cuotas:</span>
                            <span className="font-medium">{venta.cuotas}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Tasa de Interés:</span>
                            <span className="font-medium">{venta.tasa_interes}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Pago Mensual:</span>
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(venta.pago_mensual)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="border-t pt-3">
                          <div className="flex justify-between">
                            <span className="text-slate-700">Saldo Pendiente:</span>
                            <span className={`font-bold ${venta.saldo_pendiente > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {formatCurrency(venta.saldo_pendiente)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="border-t pt-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-green-700">
                            <Banknote className="h-4 w-4" />
                            <span className="font-medium">Venta al Contado - Pagada Completamente</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cronograma de Pagos (solo para financiado) */}
                {venta.tipo_venta === 'financiado' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      Cronograma de Pagos
                    </h3>
                    <div className="bg-slate-50 border-3 border-slate-300 rounded-lg p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-white rounded p-3 border">
                          <div>
                            <span className="text-sm text-slate-700">Pago Inicial</span>
                            <p className="font-medium">{formatDateTime(venta.fecha_venta).date}</p>
                          </div>
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(venta.monto_inicial)}
                          </span>
                        </div>
                        
                        {/* Generar cuotas ficticias para mostrar el cronograma */}
                        {Array.from({ length: Math.min(6, venta.cuotas) }, (_, i) => {
                          const fechaCuota = new Date(venta.fecha_venta);
                          fechaCuota.setMonth(fechaCuota.getMonth() + i + 1);
                          
                          return (
                            <div key={i} className="flex justify-between items-center bg-white rounded p-3 border">
                              <div>
                                <span className="text-sm text-slate-700">Cuota #{i + 1}</span>
                                <p className="font-medium">
                                  {fechaCuota.toLocaleDateString('es-CO')}
                                </p>
                              </div>
                              <span className="font-semibold text-blue-600">
                                {formatCurrency(venta.pago_mensual)}
                              </span>
                            </div>
                          );
                        })}
                        
                        {venta.cuotas > 6 && (
                          <div className="text-center text-sm text-slate-500 py-2">
                            ... y {venta.cuotas - 6} cuotas más
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documentos Tab */}
          {activeTab === 'documentos' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Documentos de la Venta
                  </h3>
                  <div className="space-y-3">
                    {venta.documentos_generados && venta.documentos_generados.length > 0 ? (
                      venta.documentos_generados.map((doc, index) => (
                        <div key={index} className="bg-slate-50 border-3 border-slate-300 border rounded-lg p-4 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900">{doc.nombre}</h4>
                                <p className="text-sm text-slate-700">
                                  {doc.fecha_creacion ? formatDateTime(doc.fecha_creacion).date : 'Disponible'}
                                </p>
                              </div>
                            </div>
                            <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-50 border-3 border-slate-300 rounded-lg p-6 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-slate-700">No hay documentos generados para esta venta</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clipboard className="h-5 w-5 text-orange-600" />
                    Documentos del Cliente
                  </h3>
                  <div className="bg-slate-50 border-3 border-slate-300 rounded-lg p-4">
                    <p className="text-slate-700 text-sm mb-3">
                      Documentos asociados al perfil del cliente
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white rounded p-3 border">
                        <span className="text-sm">Cédula de Identidad</span>
                        <span className="text-xs text-emerald-600 bg-green-100 px-2 py-1 rounded">Verificado</span>
                      </div>
                      <div className="flex items-center justify-between bg-white rounded p-3 border">
                        <span className="text-sm">Comprobante de Ingresos</span>
                        <span className="text-xs text-emerald-600 bg-green-100 px-2 py-1 rounded">Verificado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Motocicleta Tab */}
          {activeTab === 'motocicleta' && (
            <div className="space-y-6">
              {venta.detalles && venta.detalles.length > 0 ? (
                venta.detalles.map((detalle, index) => (
                  <div key={index} className="bg-slate-50 border-3 border-slate-300 rounded-lg p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Imagen y detalles básicos */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Bike className="h-5 w-5 text-blue-600" />
                          {detalle.producto_info?.marca} {detalle.producto_info?.modelo} {detalle.producto_info?.ano}
                        </h3>
                        
                        {detalle.producto_info?.imagen && (
                          <div className="mb-4">
                            <img 
                              src={detalle.producto_info.imagen} 
                              alt={`${detalle.producto_info.marca} ${detalle.producto_info.modelo}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-slate-700 text-sm">Marca:</span>
                              <p className="font-medium">{detalle.producto_info?.marca}</p>
                            </div>
                            <div>
                              <span className="text-slate-700 text-sm">Modelo:</span>
                              <p className="font-medium">{detalle.producto_info?.modelo}</p>
                            </div>
                            <div>
                              <span className="text-slate-700 text-sm">Año:</span>
                              <p className="font-medium">{detalle.producto_info?.ano}</p>
                            </div>
                            <div>
                              <span className="text-slate-700 text-sm">Color:</span>
                              <p className="font-medium">{detalle.producto_info?.color}</p>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-3 border">
                            <span className="text-slate-700 text-sm">Número de Chasis:</span>
                            <p className="font-mono font-bold text-lg text-blue-600">
                              {detalle.producto_info?.chasis}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Especificaciones técnicas */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Especificaciones Técnicas</h4>
                        <div className="bg-white rounded-lg p-4 space-y-3">
                          {detalle.producto_info?.cilindraje && (
                            <div className="flex justify-between">
                              <span className="text-slate-700">Cilindraje:</span>
                              <span className="font-medium">{detalle.producto_info.cilindraje} CC</span>
                            </div>
                          )}
                          {detalle.producto_info?.tipo_motor && (
                            <div className="flex justify-between">
                              <span className="text-slate-700">Tipo de Motor:</span>
                              <span className="font-medium">{detalle.producto_info.tipo_motor}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-700">Condición:</span>
                            <span className="font-medium capitalize">{detalle.producto_info?.condicion}</span>
                          </div>
                          
                          <div className="border-t pt-3">
                            <h5 className="font-medium mb-2">Detalles de la Venta</h5>
                            <div className="flex justify-between">
                              <span className="text-slate-700">Cantidad:</span>
                              <span className="font-medium">{detalle.cantidad}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-700">Precio Unitario:</span>
                              <span className="font-medium">{formatCurrency(detalle.precio_unitario)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-700">Subtotal:</span>
                              <span className="font-bold text-emerald-600">{formatCurrency(detalle.subtotal)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 border-3 border-slate-300 rounded-lg p-8 text-center">
                  <Bike className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-slate-700">No hay información de motocicletas para esta venta</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VentaDetalleModal;