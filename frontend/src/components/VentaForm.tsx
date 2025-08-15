import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  ShoppingCart, 
  User, 
  DollarSign, 
  CreditCard, 
  Calculator,
  Plus,
  Minus,
  Search,
  Bike
} from 'lucide-react';
import { ventaService } from '../services/ventaService';
import { clienteService } from '../services/clienteService';
import { motoService } from '../services/motoService';
import type { Venta, Cliente, Moto } from '../types';

interface VentaFormProps {
  venta?: Venta | null;
  mode: 'create' | 'edit' | 'view';
  onClose: () => void;
  onSave: () => void;
}

interface DetalleVenta {
  moto: number;
  moto_info?: Moto;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface FormData {
  cliente: number;
  tipo_venta: 'contado' | 'financiado';
  monto_inicial: string;
  cuotas: string;
  tasa_interes: string;
  detalles: DetalleVenta[];
}

interface VentaCalculation {
  monto_total: number;
  monto_inicial: number;
  saldo_financiado: number;
  pago_mensual: number;
  cuotas: number;
  tasa_interes: number;
  monto_total_con_intereses: number;
  total_intereses: number;
}

const VentaForm: React.FC<VentaFormProps> = ({ venta, mode, onClose, onSave }) => {
  const [formData, setFormData] = useState<FormData>({
    cliente: 0,
    tipo_venta: 'contado',
    monto_inicial: '',
    cuotas: '12',
    tasa_interes: '2.5',
    detalles: []
  });
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [motosDisponibles, setMotosDisponibles] = useState<Moto[]>([]);
  const [clienteSearch, setClienteSearch] = useState('');
  const [motoSearch, setMotoSearch] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [showMotoDropdown, setShowMotoDropdown] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  
  const [calculation, setCalculation] = useState<VentaCalculation>({
    monto_total: 0,
    monto_inicial: 0,
    saldo_financiado: 0,
    pago_mensual: 0,
    cuotas: 0,
    tasa_interes: 0,
    monto_total_con_intereses: 0,
    total_intereses: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>('');

  useEffect(() => {
    loadClientes();
    loadMotosDisponibles();
  }, []);

  useEffect(() => {
    if (venta && mode !== 'create') {
      setFormData({
        cliente: venta.cliente,
        tipo_venta: venta.tipo_venta as 'contado' | 'financiado',
        monto_inicial: venta.monto_inicial?.toString() || '',
        cuotas: venta.cuotas?.toString() || '12',
        tasa_interes: venta.tasa_interes?.toString() || '2.5',
        detalles: venta.detalles?.map(detalle => ({
          moto: detalle.moto,
          moto_info: detalle.moto_info,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          subtotal: detalle.subtotal
        })) || []
      });
      
      if (venta.cliente_info) {
        setSelectedCliente(venta.cliente_info);
      }
    }
  }, [venta, mode]);

  useEffect(() => {
    if (formData.detalles.length > 0) {
      calculateVenta();
    } else {
      setCalculation({
        monto_total: 0,
        monto_inicial: 0,
        saldo_financiado: 0,
        pago_mensual: 0,
        cuotas: 0,
        tasa_interes: 0,
        monto_total_con_intereses: 0,
        total_intereses: 0
      });
    }
  }, [formData.detalles, formData.tipo_venta, formData.monto_inicial, formData.cuotas, formData.tasa_interes]);

  const loadClientes = async () => {
    try {
      const response = await clienteService.getClientes(1, '');
      setClientes(response.results);
    } catch (error) {
      console.error('Error loading clientes:', error);
    }
  };

  const loadMotosDisponibles = async () => {
    try {
      const motos = await motoService.getMotosDisponibles();
      setMotosDisponibles(motos);
    } catch (error) {
      console.error('Error loading motos:', error);
    }
  };

  const searchClientes = async (query: string) => {
    if (query.length < 2) {
      loadClientes();
      return;
    }
    
    try {
      const response = await clienteService.getClientes(1, query);
      setClientes(response.results);
    } catch (error) {
      console.error('Error searching clientes:', error);
    }
  };

  const searchMotos = async (query: string) => {
    if (query.length < 2) {
      loadMotosDisponibles();
      return;
    }
    
    try {
      const motos = await motoService.searchMotos(query);
      setMotosDisponibles(motos.filter(moto => moto.disponible));
    } catch (error) {
      console.error('Error searching motos:', error);
    }
  };

  const calculateVenta = async () => {
    if (formData.detalles.length === 0) return;

    try {
      const detallesData = formData.detalles.map(detalle => ({
        moto: detalle.moto,
        cantidad: Number(detalle.cantidad),
        precio_unitario: Number(detalle.precio_unitario)
      }));

      console.log('Enviando datos para cálculo:', {
        detallesData,
        tipo_venta: formData.tipo_venta,
        monto_inicial: formData.monto_inicial ? Number(formData.monto_inicial) : undefined,
        cuotas: formData.cuotas ? Number(formData.cuotas) : undefined,
        tasa_interes: formData.tasa_interes ? Number(formData.tasa_interes) : undefined
      });

      const result = await ventaService.calculateVenta(
        detallesData,
        formData.tipo_venta,
        formData.monto_inicial ? Number(formData.monto_inicial) : 0,
        formData.cuotas ? Number(formData.cuotas) : 12,
        formData.tasa_interes ? Number(formData.tasa_interes) : 0
      );

      console.log('Resultado del cálculo:', result);
      setCalculation(result);
    } catch (error) {
      console.error('Error calculating venta:', error);
      // Calculate locally if API fails
      const total = formData.detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
      const inicial = formData.monto_inicial ? Number(formData.monto_inicial) : 0;
      const cuotas = formData.cuotas ? Number(formData.cuotas) : 12;
      const tasaInteres = formData.tasa_interes ? Number(formData.tasa_interes) : 0;
      const saldoFinanciado = total - inicial;
      
      let pagoMensual = 0;
      if (formData.tipo_venta === 'financiado') {
        if (tasaInteres > 0 && cuotas > 0) {
          // Fórmula de cuota fija con interés compuesto: C = P * [r(1+r)^n] / [(1+r)^n-1]
          const r = tasaInteres / 100; // Convertir porcentaje a decimal
          const factor = Math.pow(1 + r, cuotas);
          
          // Validar que el factor no sea infinito o demasiado grande
          if (factor > 1e10 || !isFinite(factor)) {
            pagoMensual = saldoFinanciado / cuotas; // Fallback sin interés
          } else {
            pagoMensual = saldoFinanciado * (r * factor) / (factor - 1);
            
            // Asegurar que el pago mensual sea válido
            if (!isFinite(pagoMensual) || pagoMensual <= 0) {
              pagoMensual = saldoFinanciado / cuotas;
            }
          }
        } else {
          // Sin interés, dividir en partes iguales
          pagoMensual = saldoFinanciado / cuotas;
        }
      }

      // Redondear todos los valores a 2 decimales
      pagoMensual = Math.round(pagoMensual * 100) / 100;
      const montoTotalConIntereses = Math.round((inicial + (pagoMensual * cuotas)) * 100) / 100;
      const totalIntereses = Math.round((montoTotalConIntereses - total) * 100) / 100;
      
      setCalculation({
        monto_total: Math.round(total * 100) / 100,
        monto_inicial: Math.round(inicial * 100) / 100,
        saldo_financiado: Math.round(saldoFinanciado * 100) / 100,
        pago_mensual: pagoMensual,
        cuotas: cuotas,
        tasa_interes: tasaInteres,
        monto_total_con_intereses: montoTotalConIntereses,
        total_intereses: totalIntereses
      });
    }
  };

  const handleClienteSelect = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormData(prev => ({ ...prev, cliente: cliente.id }));
    setClienteSearch(`${cliente.nombre} ${cliente.apellido}`);
    setShowClienteDropdown(false);
  };

  const handleAddMoto = (moto: Moto) => {
    const existingDetalle = formData.detalles.find(d => d.moto === moto.id);
    
    if (existingDetalle) {
      // Incrementar cantidad si ya existe
      handleUpdateDetalle(formData.detalles.indexOf(existingDetalle), 'cantidad', existingDetalle.cantidad + 1);
    } else {
      // Agregar nuevo detalle
      const nuevoDetalle: DetalleVenta = {
        moto: moto.id,
        moto_info: moto,
        cantidad: 1,
        precio_unitario: moto.precio_venta,
        subtotal: moto.precio_venta
      };
      
      setFormData(prev => ({
        ...prev,
        detalles: [...prev.detalles, nuevoDetalle]
      }));
    }
    
    setMotoSearch('');
    setShowMotoDropdown(false);
  };

  const handleUpdateDetalle = (index: number, field: string, value: number) => {
    const newDetalles = [...formData.detalles];
    newDetalles[index] = {
      ...newDetalles[index],
      [field]: value,
      subtotal: field === 'cantidad' || field === 'precio_unitario' 
        ? (field === 'cantidad' ? value : newDetalles[index].cantidad) * 
          (field === 'precio_unitario' ? value : newDetalles[index].precio_unitario)
        : newDetalles[index].subtotal
    };
    
    setFormData(prev => ({ ...prev, detalles: newDetalles }));
  };

  const handleRemoveDetalle = (index: number) => {
    setFormData(prev => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setServerError('');
    
    try {
      const submitData = {
        cliente: formData.cliente,
        tipo_venta: formData.tipo_venta,
        monto_total: Math.round(calculation.monto_total * 100) / 100,
        monto_inicial: formData.tipo_venta === 'financiado' ? Math.round(Number(formData.monto_inicial) * 100) / 100 : 0,
        cuotas: formData.tipo_venta === 'financiado' ? Number(formData.cuotas) : 1,
        tasa_interes: formData.tipo_venta === 'financiado' ? Math.round(Number(formData.tasa_interes) * 100) / 100 : 0,
        pago_mensual: formData.tipo_venta === 'financiado' ? Math.round(calculation.pago_mensual * 100) / 100 : 0,
        monto_total_con_intereses: formData.tipo_venta === 'financiado' ? Math.round(calculation.monto_total_con_intereses * 100) / 100 : Math.round(calculation.monto_total * 100) / 100,
        detalles: formData.detalles.map(detalle => ({
          moto: detalle.moto,
          cantidad: detalle.cantidad,
          precio_unitario: Math.round(detalle.precio_unitario * 100) / 100
        }))
      };

      console.log('Enviando datos de la venta:', submitData);

      if (mode === 'create') {
        await ventaService.createVenta(submitData);
      } else if (mode === 'edit' && venta) {
        await ventaService.updateVenta(venta.id, submitData);
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error completo al guardar venta:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      console.error('Status del error:', error.response?.status);
      
      let errorMessage = 'Error al guardar venta';
      
      if (error.response?.data) {
        console.error('Datos completos del error:', JSON.stringify(error.response.data, null, 2));
        
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else {
          const fieldErrors = [];
          for (const field in error.response.data) {
            if (Array.isArray(error.response.data[field])) {
              fieldErrors.push(`${field}: ${error.response.data[field].join(', ')}`);
            } else if (typeof error.response.data[field] === 'object') {
              fieldErrors.push(`${field}: ${JSON.stringify(error.response.data[field])}`);
            } else {
              fieldErrors.push(`${field}: ${error.response.data[field]}`);
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.cliente) {
      newErrors.cliente = 'Debe seleccionar un cliente';
    }
    if (formData.detalles.length === 0) {
      newErrors.detalles = 'Debe agregar al menos una motocicleta';
    }
    if (formData.tipo_venta === 'financiado') {
      if (!formData.monto_inicial) {
        newErrors.monto_inicial = 'El monto inicial es requerido para ventas financiadas';
      } else if (Number(formData.monto_inicial) <= 0) {
        newErrors.monto_inicial = 'El monto inicial debe ser mayor a 0';
      } else if (Number(formData.monto_inicial) >= calculation.monto_total) {
        newErrors.monto_inicial = 'El monto inicial debe ser menor al total';
      }
      if (!formData.cuotas || Number(formData.cuotas) < 1) {
        newErrors.cuotas = 'Las cuotas deben ser mayor a 0';
      }
      if (!formData.tasa_interes) {
        newErrors.tasa_interes = 'La tasa de interés es requerida para ventas financiadas';
      } else if (Number(formData.tasa_interes) < 0) {
        newErrors.tasa_interes = 'La tasa de interés no puede ser negativa';
      } else if (Number(formData.tasa_interes) > 15) {
        newErrors.tasa_interes = 'La tasa de interés no puede ser mayor a 15% mensual';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isReadOnly = mode === 'view';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' && 'Crear Nueva Venta'}
            {mode === 'edit' && 'Editar Venta'}
            {mode === 'view' && 'Detalles de la Venta'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selección de Cliente */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                  <User className="h-5 w-5 mr-2" />
                  Cliente
                </h3>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar cliente por nombre o cédula..."
                    value={clienteSearch}
                    onChange={(e) => {
                      setClienteSearch(e.target.value);
                      searchClientes(e.target.value);
                      setShowClienteDropdown(true);
                    }}
                    onFocus={() => setShowClienteDropdown(true)}
                    readOnly={isReadOnly}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.cliente ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                  
                  {showClienteDropdown && !isReadOnly && clientes.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {clientes.map(cliente => (
                        <div
                          key={cliente.id}
                          onClick={() => handleClienteSelect(cliente)}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                        >
                          <div className="font-medium">{cliente.nombre} {cliente.apellido}</div>
                          <div className="text-sm text-gray-500">CC: {cliente.cedula}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.cliente && <p className="text-red-500 text-sm mt-1">{errors.cliente}</p>}
              </div>

              {/* Tipo de Venta */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Tipo de Venta
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.tipo_venta === 'contado' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 hover:border-green-300'
                  } ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}>
                    <input
                      type="radio"
                      name="tipo_venta"
                      value="contado"
                      checked={formData.tipo_venta === 'contado'}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo_venta: e.target.value as 'contado' | 'financiado' }))}
                      disabled={isReadOnly}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <div className="font-medium">Contado</div>
                      <div className="text-sm text-gray-500">Pago completo</div>
                    </div>
                  </label>
                  
                  <label className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.tipo_venta === 'financiado' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-300'
                  } ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}>
                    <input
                      type="radio"
                      name="tipo_venta"
                      value="financiado"
                      checked={formData.tipo_venta === 'financiado'}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo_venta: e.target.value as 'contado' | 'financiado' }))}
                      disabled={isReadOnly}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <CreditCard className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                      <div className="font-medium">Financiado</div>
                      <div className="text-sm text-gray-500">Con cuotas</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Configuración de Financiamiento */}
              {formData.tipo_venta === 'financiado' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                    <Calculator className="h-5 w-5 mr-2" />
                    Configuración de Financiamiento
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto Inicial *
                      </label>
                      <input
                        type="number"
                        value={formData.monto_inicial}
                        onChange={(e) => setFormData(prev => ({ ...prev, monto_inicial: e.target.value }))}
                        readOnly={isReadOnly}
                        min="0"
                        step="1000"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.monto_inicial ? 'border-red-500' : 'border-gray-300'
                        } ${isReadOnly ? 'bg-gray-50' : ''}`}
                      />
                      {errors.monto_inicial && <p className="text-red-500 text-sm mt-1">{errors.monto_inicial}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tasa de Interés (% mensual) *
                      </label>
                      <input
                        type="number"
                        value={formData.tasa_interes}
                        onChange={(e) => setFormData(prev => ({ ...prev, tasa_interes: e.target.value }))}
                        readOnly={isReadOnly}
                        min="0"
                        max="15"
                        step="0.1"
                        placeholder="2.5"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.tasa_interes ? 'border-red-500' : 'border-gray-300'
                        } ${isReadOnly ? 'bg-gray-50' : ''}`}
                      />
                      {errors.tasa_interes && <p className="text-red-500 text-sm mt-1">{errors.tasa_interes}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Cuotas *
                      </label>
                      <select
                        value={formData.cuotas}
                        onChange={(e) => setFormData(prev => ({ ...prev, cuotas: e.target.value }))}
                        disabled={isReadOnly}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.cuotas ? 'border-red-500' : 'border-gray-300'
                        } ${isReadOnly ? 'bg-gray-50' : ''}`}
                      >
                        <option value="6">6 meses</option>
                        <option value="12">12 meses</option>
                        <option value="18">18 meses</option>
                        <option value="24">24 meses</option>
                        <option value="36">36 meses</option>
                      </select>
                      {errors.cuotas && <p className="text-red-500 text-sm mt-1">{errors.cuotas}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Selección de Motocicletas */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Motocicletas
                </h3>
                
                {!isReadOnly && (
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar motocicleta por marca o modelo..."
                      value={motoSearch}
                      onChange={(e) => {
                        setMotoSearch(e.target.value);
                        searchMotos(e.target.value);
                        setShowMotoDropdown(true);
                      }}
                      onFocus={() => setShowMotoDropdown(true)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {showMotoDropdown && motosDisponibles.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {motosDisponibles.map(moto => (
                          <div
                            key={moto.id}
                            onClick={() => handleAddMoto(moto)}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                          >
                            <div>
                              <div className="font-medium">
                                {moto.marca} {moto.modelo}
                                {moto.color && <span className="text-blue-600"> - {moto.color}</span>}
                              </div>
                              <div className="text-sm text-gray-500">
                                {moto.ano} • Stock: {moto.cantidad_stock}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-green-600">{formatCurrency(moto.precio_venta)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Lista de Motocicletas Seleccionadas */}
                <div className="space-y-3">
                  {formData.detalles.map((detalle, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Bike className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {detalle.moto_info ? (
                                <>
                                  {detalle.moto_info.marca} {detalle.moto_info.modelo}
                                  {detalle.moto_info.color && <span className="text-blue-600"> - {detalle.moto_info.color}</span>}
                                </>
                              ) : (
                                `Moto ID: ${detalle.moto}`
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              Precio unitario: {formatCurrency(detalle.precio_unitario)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {!isReadOnly && (
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateDetalle(index, 'cantidad', Math.max(1, detalle.cantidad - 1))}
                                className="p-1 text-gray-500 hover:text-gray-700"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-8 text-center">{detalle.cantidad}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateDetalle(index, 'cantidad', detalle.cantidad + 1)}
                                className="p-1 text-gray-500 hover:text-gray-700"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(detalle.subtotal)}</div>
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDetalle(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {formData.detalles.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {isReadOnly ? 'No hay motocicletas en esta venta' : 'Busca y selecciona motocicletas para agregar a la venta'}
                    </div>
                  )}
                </div>
                
                {errors.detalles && <p className="text-red-500 text-sm mt-1">{errors.detalles}</p>}
              </div>
            </div>

            {/* Resumen de Venta */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Resumen de Venta</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor de Productos:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(calculation.monto_total)}
                  </span>
                </div>
                
                {formData.tipo_venta === 'financiado' && (
                  <>
                    <hr />
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inicial:</span>
                      <span className="font-medium">
                        {formatCurrency(calculation.monto_inicial)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Saldo a Financiar:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(calculation.saldo_financiado)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cuotas:</span>
                      <span className="font-medium">{calculation.cuotas}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tasa de Interés:</span>
                      <span className="font-medium">{calculation.tasa_interes}% mensual</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pago Mensual:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(calculation.pago_mensual)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total de Intereses:</span>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(calculation.total_intereses)}
                      </span>
                    </div>
                    
                    <hr />
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Total a Pagar:</span>
                      <span className="font-bold text-xl text-green-600">
                        {formatCurrency(calculation.monto_total_con_intereses)}
                      </span>
                    </div>
                  </>
                )}
                
                {formData.tipo_venta === 'contado' && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Total a Pagar:</span>
                    <span className="font-bold text-xl text-green-600">
                      {formatCurrency(calculation.monto_total)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-500">
                <div>Items: {formData.detalles.length}</div>
                <div>Cliente: {selectedCliente ? `${selectedCliente.nombre} ${selectedCliente.apellido}` : 'No seleccionado'}</div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={loading || formData.detalles.length === 0 || !formData.cliente}
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
                    {mode === 'create' ? 'Crear Venta' : 'Guardar Cambios'}
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

export default VentaForm;