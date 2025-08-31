import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  X, 
  Save, 
  DollarSign,
  CreditCard,
  Banknote,
  Receipt,
  Search,
  User,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { pagoService } from '../services/pagoService';
import { cuotaService } from '../services/cuotaService';
import type { Pago, Venta, ClienteFinanciado } from '../types';

interface PagoFormProps {
  mode: 'create' | 'edit' | 'view';
}

interface FormData {
  monto_pagado: string;
  tipo_pago: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque';
  observaciones: string;
  tipo_monto: 'pago_completo' | 'total_adeudado' | 'otro_monto';
}

const PagoForm: React.FC<PagoFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [pago, setPago] = useState<Pago | null>(null);
  const [venta, setVenta] = useState<Venta | null>(null);
  const [cliente, setCliente] = useState<ClienteFinanciado | null>(null);
  const [formData, setFormData] = useState<FormData>({
    monto_pagado: pago?.monto_pagado?.toString() || '',
    tipo_pago: (pago?.tipo_pago as 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque') || 'efectivo',
    observaciones: pago?.observaciones || '',
    tipo_monto: mode === 'create' ? 'pago_completo' : 'otro_monto' // Por defecto pago completo para nuevos pagos
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>('');
  
  // Estado para búsqueda de clientes financiados
  const [showClientSearch, setShowClientSearch] = useState(!venta && !cliente);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientesFinanciados, setClientesFinanciados] = useState<ClienteFinanciado[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteFinanciado | null>(cliente || null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load initial data for edit mode
  useEffect(() => {
    const loadInitialData = async () => {
      if (mode === 'edit' && id) {
        try {
          const pagoResponse = await pagoService.getPago(Number(id));
          setPago(pagoResponse);
          if (pagoResponse.venta_info) {
            setVenta(pagoResponse.venta_info);
          }
          setFormData({
            monto_pagado: pagoResponse.monto_pagado?.toString() || '',
            tipo_pago: pagoResponse.tipo_pago as 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque',
            observaciones: pagoResponse.observaciones || '',
            tipo_monto: 'otro_monto'
          });
        } catch (error) {
          console.error('Error loading pago:', error);
        }
      }
    };
    loadInitialData();
  }, [mode, id]);

  // Función para buscar clientes
  const buscarClientes = useCallback(async (term: string) => {
    try {
      setSearchLoading(true);
      const clientes = await cuotaService.buscarClientesFinanciados(term);
      setClientesFinanciados(clientes);
    } catch (error) {
      console.error('Error buscando clientes:', error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Cargar clientes financiados al inicio
  useEffect(() => {
    if (showClientSearch) {
      buscarClientes('');
    }
  }, [showClientSearch, buscarClientes]);

  // Función para calcular monto automáticamente
  const calculateMonto = useCallback((tipoMonto: string, clienteInfo?: ClienteFinanciado | null) => {
    const ventaActual = venta || clienteInfo || selectedCliente;
    if (!ventaActual) return;

    let nuevoMonto = '';
    
    if (tipoMonto === 'pago_completo') {
      // Para pago completo, usar el monto de la próxima cuota o pago mensual
      if ('proxima_cuota' in ventaActual && ventaActual.proxima_cuota && 
          typeof ventaActual.proxima_cuota.monto === 'number') {
        nuevoMonto = ventaActual.proxima_cuota.monto.toFixed(2);
      } else if ('pago_mensual' in ventaActual && typeof ventaActual.pago_mensual === 'number') {
        nuevoMonto = ventaActual.pago_mensual.toFixed(2);
      }
    } else if (tipoMonto === 'total_adeudado') {
      // Para total adeudado, usar todo el saldo pendiente
      if (typeof ventaActual.saldo_pendiente === 'number') {
        nuevoMonto = ventaActual.saldo_pendiente.toFixed(2);
      }
    }
    
    if (nuevoMonto) {
      setFormData(prev => ({ ...prev, monto_pagado: nuevoMonto }));
    }
  }, [venta, selectedCliente]);

  // Calcular monto automáticamente cuando cambia la venta o el tipo de monto
  useEffect(() => {
    if (mode === 'create' && formData.tipo_monto !== 'otro_monto') {
      calculateMonto(formData.tipo_monto);
    }
  }, [venta, selectedCliente, formData.tipo_monto, mode, calculateMonto]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2 || value.length === 0) {
      buscarClientes(value);
    }
  };

  const handleClienteSelect = (cliente: ClienteFinanciado) => {
    setSelectedCliente(cliente);
    setShowClientSearch(false);
    setSearchTerm('');
    // Si el tipo de monto no es 'otro_monto', calcular automáticamente
    if (formData.tipo_monto !== 'otro_monto') {
      calculateMonto(formData.tipo_monto, cliente);
    }
  };

  const handleTipoMontoChange = (tipoMonto: 'pago_completo' | 'total_adeudado' | 'otro_monto') => {
    setFormData(prev => ({ ...prev, tipo_monto: tipoMonto }));
    
    if (tipoMonto !== 'otro_monto') {
      calculateMonto(tipoMonto);
    } else {
      // Si selecciona "otro monto", limpiar el campo para que pueda escribir
      setFormData(prev => ({ ...prev, monto_pagado: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar que se haya seleccionado un cliente/venta
    const ventaActual = venta || (selectedCliente ? { id: selectedCliente.venta_id, saldo_pendiente: selectedCliente.saldo_pendiente } : null);
    if (!ventaActual) {
      newErrors.cliente = 'Debe seleccionar un cliente con saldo pendiente';
    }

    if (!formData.monto_pagado || formData.monto_pagado.trim() === '') {
      newErrors.monto_pagado = 'El monto del pago es requerido';
    } else {
      const montoNumerico = parseFloat(formData.monto_pagado);
      if (isNaN(montoNumerico) || montoNumerico <= 0) {
        newErrors.monto_pagado = 'El monto debe ser un número válido mayor a 0';
      } else if (ventaActual && montoNumerico > ventaActual.saldo_pendiente) {
        newErrors.monto_pagado = `El monto no puede ser mayor al saldo pendiente (${formatCurrency(ventaActual.saldo_pendiente)})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!validateForm()) {
        return;
      }

      const ventaActual = venta || (selectedCliente ? { id: selectedCliente.venta_id } : null);
      if (!ventaActual) {
        setServerError('No se ha seleccionado una venta válida para procesar el pago');
        return;
      }

      // Additional validation for venta ID
      if (!ventaActual.id || isNaN(ventaActual.id) || ventaActual.id <= 0) {
        setServerError(`ID de venta inválido: ${ventaActual.id}. No se puede procesar el pago.`);
        console.error('Invalid venta ID:', ventaActual.id, 'selectedCliente:', selectedCliente, 'venta:', venta);
        return;
      }

      setLoading(true);
      setServerError('');

      // Verify that the venta exists before creating payment
      try {
        console.log(`Verifying venta ${ventaActual.id} exists...`);
        const { ventaService } = await import('../services/ventaService');
        await ventaService.getVenta(ventaActual.id);
        console.log(`Venta ${ventaActual.id} verified successfully`);
      } catch (ventaError: any) {
        console.error('Venta verification failed:', ventaError);
        setServerError(`La venta #${ventaActual.id} no existe o no es accesible. No se puede procesar el pago.`);
        setLoading(false);
        return;
      }
      const submitData = {
        venta: ventaActual.id,
        monto_pagado: parseFloat(formData.monto_pagado),
        tipo_pago: formData.tipo_pago,
        observaciones: formData.observaciones || undefined
      };

      // Debug: Log the data being sent
      console.log('=== PAGO FORM DEBUG ===');
      console.log('ventaActual:', ventaActual);
      console.log('selectedCliente:', selectedCliente);
      console.log('submitData:', submitData);
      console.log('formData:', formData);
      console.log('========================');

      let pagoCreado;
      if (mode === 'create') {
        pagoCreado = await pagoService.createPago(submitData);
      } else if (mode === 'edit' && pago) {
        pagoCreado = await pagoService.updatePago(pago.id, submitData);
      }
      
      // Generar factura automáticamente para nuevos pagos
      if (mode === 'create' && pagoCreado && pagoCreado.id) {
        try {
          console.log(`Generating invoice for payment ID: ${pagoCreado.id}`);
          await pagoService.generarFacturaPago(pagoCreado.id);
          console.log(`Invoice generated successfully for payment ID: ${pagoCreado.id}`);
        } catch (facturaError) {
          console.warn('No se pudo generar la factura automáticamente:', facturaError);
          // This is not a critical error, payment was created successfully
        }
      } else {
        console.log('Skipping invoice generation:', {
          mode,
          pagoCreado: !!pagoCreado,
          pagoId: pagoCreado?.id
        });
      }
      
      navigate('/pagos');
    } catch (error: any) {
      console.error('=== ERROR DETAILS ===');
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error response statusText:', error.response?.statusText);
      console.error('API Error Response:', error.response?.data);
      console.error('======================');
      
      let errorMessage = 'Error al guardar pago';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else {
          const fieldErrors = [];
          for (const field in error.response.data) {
            if (Array.isArray(error.response.data[field])) {
              fieldErrors.push(`${field}: ${error.response.data[field].join(', ')}`);
            }
          }
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('\n');
          }
        }
      }
      
      setServerError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTipoPagoIcon = (tipo: string) => {
    switch (tipo) {
      case 'efectivo':
        return <Banknote className="h-5 w-5" />;
      case 'transferencia':
        return <DollarSign className="h-5 w-5" />;
      case 'tarjeta':
        return <CreditCard className="h-5 w-5" />;
      case 'cheque':
        return <Receipt className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const isReadOnly = mode === 'view';
  const ventaInfo = venta || selectedCliente;

  return (
    <div className="page-fade-in">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' && 'Registrar Nuevo Pago'}
            {mode === 'edit' && 'Editar Pago'}
            {mode === 'view' && 'Detalles del Pago'}
          </h2>
          <button onClick={() => navigate('/pagos')} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Server Error */}
          {serverError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm font-medium">Error al guardar:</p>
              <pre className="text-xs mt-1 whitespace-pre-wrap">{serverError}</pre>
            </div>
          )}

          {/* Error de selección de cliente */}
          {errors.cliente && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm">{errors.cliente}</p>
            </div>
          )}

          {/* Mensaje si el cliente no tiene saldo pendiente */}
          {cliente && !cliente.saldo_pendiente && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              <p className="text-sm font-medium">
                El cliente {cliente.nombre_completo} no tiene saldo pendiente.
              </p>
              <p className="text-sm">
                Todas sus cuentas están al día.
              </p>
            </div>
          )}

          {/* Búsqueda de Clientes con Saldo Pendiente */}
          {showClientSearch && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Seleccionar Cliente con Saldo Pendiente</h3>
              
              {/* Búsqueda */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, cédula..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Lista de Clientes */}
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                {searchLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Buscando clientes...
                  </div>
                ) : clientesFinanciados.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    No se encontraron clientes con saldo pendiente
                  </div>
                ) : (
                  clientesFinanciados.map((cliente) => (
                    <div
                      key={`${cliente.cliente_id}-${cliente.venta_id}`}
                      onClick={() => handleClienteSelect(cliente)}
                      className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{cliente.nombre_completo}</h4>
                          <p className="text-sm text-gray-600">Cédula: {cliente.cedula}</p>
                          <p className="text-xs text-gray-500">Venta #{cliente.venta_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-600">
                            Saldo: {formatCurrency(cliente.saldo_pendiente)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {cliente.cuotas_restantes > 0 ? `${cliente.cuotas_restantes} cuotas restantes` : 'Venta al contado'}
                          </p>
                          {cliente.total_mora > 0 && (
                            <p className="text-xs text-red-600 flex items-center mt-1">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Mora: {formatCurrency(cliente.total_mora)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {cliente.proxima_cuota && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                          <span className="font-medium">Próxima cuota:</span>
                          <span className="ml-2">#{cliente.proxima_cuota.numero}</span>
                          <span className="ml-2">{new Date(cliente.proxima_cuota.fecha_vencimiento).toLocaleDateString()}</span>
                          <span className="ml-2">{formatCurrency(cliente.proxima_cuota.monto)}</span>
                          {cliente.proxima_cuota.dias_vencido > 0 && (
                            <span className="ml-2 text-red-600">({cliente.proxima_cuota.dias_vencido} días vencida)</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Información del Cliente/Venta Seleccionado */}
          {ventaInfo && !showClientSearch && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-sm font-medium text-gray-900">
                  {cliente ? 
                    `Registrar pago para ${cliente.nombre_completo}` : 
                    ('cuotas_restantes' in ventaInfo && ventaInfo.cuotas_restantes > 0 ? 'Información del Financiamiento' : 'Información de la Venta')
                  }
                </h3>
                {!venta && !cliente && (
                  <button
                    type="button"
                    onClick={() => setShowClientSearch(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Cambiar cliente
                  </button>
                )}
                {cliente && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCliente(null);
                      setShowClientSearch(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Seleccionar otro cliente
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Cliente</div>
                  <div className="font-medium">
                    {'nombre_completo' in ventaInfo ? ventaInfo.nombre_completo : `${venta?.cliente_info?.nombre} ${venta?.cliente_info?.apellido}`}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Venta</div>
                  <div className="font-medium">
                    #{'venta_id' in ventaInfo ? ventaInfo.venta_id : ventaInfo.id}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">
                    {'cuotas_restantes' in ventaInfo && ventaInfo.cuotas_restantes > 0 ? 'Total Financiado' : 'Total Venta'}
                  </div>
                  <div className="font-medium">
                    {formatCurrency('monto_con_intereses' in ventaInfo ? ventaInfo.monto_con_intereses : ventaInfo.monto_total)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Saldo Pendiente</div>
                  <div className="font-medium text-red-600">
                    {formatCurrency(ventaInfo.saldo_pendiente)}
                  </div>
                </div>
                {'cuotas_restantes' in ventaInfo && (
                  <>
                    <div>
                      <div className="text-gray-600">Cuotas Restantes</div>
                      <div className="font-medium">{ventaInfo.cuotas_restantes} de {ventaInfo.cuotas_totales}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Pago Mensual</div>
                      <div className="font-medium">{formatCurrency(ventaInfo.pago_mensual)}</div>
                    </div>
                  </>
                )}
                {'total_mora' in ventaInfo && ventaInfo.total_mora > 0 && (
                  <div className="col-span-2">
                    <div className="text-red-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Mora Acumulada: {formatCurrency(ventaInfo.total_mora)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Tipo de Monto */}
            {!isReadOnly && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Pago *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'pago_completo', label: 'Pago de Cuota Mensual', 
                      description: ventaInfo && 'proxima_cuota' in ventaInfo && ventaInfo.proxima_cuota 
                        ? `Próxima cuota: ${formatCurrency(ventaInfo.proxima_cuota.monto)}` 
                        : ventaInfo && 'pago_mensual' in ventaInfo 
                        ? `Cuota mensual: ${formatCurrency(ventaInfo.pago_mensual)}` 
                        : 'Cuota mensual' },
                    { value: 'total_adeudado', label: 'Pago Total (Saldar Deuda)', 
                      description: ventaInfo ? `Total adeudado: ${formatCurrency(ventaInfo.saldo_pendiente)}` : 'Pagar todo el saldo pendiente' },
                    { value: 'otro_monto', label: 'Otro Monto', description: 'Especificar monto personalizado' }
                  ].map((tipo) => (
                    <label
                      key={tipo.value}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.tipo_monto === tipo.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipo_monto"
                        value={tipo.value}
                        checked={formData.tipo_monto === tipo.value}
                        onChange={(e) => handleTipoMontoChange(e.target.value as any)}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{tipo.label}</div>
                          <div className="text-xs text-gray-600 mt-1">{tipo.description}</div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          formData.tipo_monto === tipo.value
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.tipo_monto === tipo.value && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Monto del Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.tipo_monto === 'otro_monto' ? 'Monto del Pago *' : 'Monto Calculado *'}
              </label>
              <input
                type="number"
                value={formData.monto_pagado}
                onChange={(e) => setFormData(prev => ({ ...prev, monto_pagado: e.target.value }))}
                readOnly={isReadOnly || formData.tipo_monto !== 'otro_monto'}
                min="0"
                step="0.01"
                placeholder="0.00"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.monto_pagado ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-50' : ''}`}
              />
              {errors.monto_pagado && <p className="text-red-500 text-sm mt-1">{errors.monto_pagado}</p>}
              {formData.tipo_monto !== 'otro_monto' && (
                <p className="text-sm text-blue-600 mt-1">
                  💡 El monto se calculó automáticamente según la opción seleccionada
                </p>
              )}
            </div>

            {/* Tipo de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Pago *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'efectivo', label: 'Efectivo' },
                  { value: 'transferencia', label: 'Transferencia' },
                  { value: 'tarjeta', label: 'Tarjeta' },
                  { value: 'cheque', label: 'Cheque' }
                ].map((tipo) => (
                  <label
                    key={tipo.value}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-colors flex items-center space-x-2 ${
                      formData.tipo_pago === tipo.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    } ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <input
                      type="radio"
                      name="tipo_pago"
                      value={tipo.value}
                      checked={formData.tipo_pago === tipo.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo_pago: e.target.value as any }))}
                      disabled={isReadOnly}
                      className="sr-only"
                    />
                    {getTipoPagoIcon(tipo.value)}
                    <span className="text-sm font-medium">{tipo.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                readOnly={isReadOnly}
                rows={3}
                placeholder="Notas adicionales sobre el pago..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isReadOnly ? 'bg-gray-50' : 'border-gray-300'
                }`}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/pagos')}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === 'create' ? 'Registrar Pago' : 'Guardar Cambios'}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PagoForm;