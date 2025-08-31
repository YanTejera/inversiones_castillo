import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  UserCheck,
  FileText,
  Bike,
  DollarSign,
  Calendar,
  FileCheck,
  Receipt,
  AlertCircle,
  CheckCircle,
  Save
} from 'lucide-react';

// Importar los sub-componentes que crearemos
import CustomerStep from './VentaSteps/CustomerStep';
import GuarantorStep from './VentaSteps/GuarantorStep';
import DocumentsStep from './VentaSteps/DocumentsStep';
import MotorcycleStep from './VentaSteps/MotorcycleStep';
import PaymentStep from './VentaSteps/PaymentStep';
import LegalDocumentsStep from './VentaSteps/LegalDocumentsStep';
import ReviewStep from './VentaSteps/ReviewStep';

import type { Cliente, Moto, MotoModelo } from '../types';
import { ventaService } from '../services/ventaService';

export interface VentaFormData {
  // Customer Information
  customer: Cliente | null;
  isNewCustomer: boolean;
  
  // Guarantor Information
  needsGuarantor: boolean;
  guarantor: any | null;
  
  // Documents
  uploadedDocuments: File[];
  
  // Motorcycle Selection (Ahora soporta múltiples motocicletas)
  selectedMotorcycles: Array<{
    tipo: 'modelo' | 'individual';
    modelo?: MotoModelo;
    moto?: Moto;
    color?: string;
    chasis?: string;
    cantidad: number;
    precio_unitario: number;
  }>;
  
  // Para compatibilidad temporal (se eliminará después)
  selectedMotorcycle: {
    tipo: 'modelo' | 'individual';
    modelo?: MotoModelo;
    moto?: Moto;
    color?: string;
    chasis?: string;
    cantidad: number;
    precio_unitario: number;
  } | null;
  
  // Payment Information
  paymentType: 'contado' | 'financiado';
  downPayment: number;
  financingDetails: {
    totalAmount: number;
    financedAmount: number;
    interestRate: number;
    numberOfPayments: number;
    paymentFrequency: 'mensual' | 'quincenal' | 'semanal' | 'diario';
    paymentAmount: number;
    paymentSchedule: Array<{
      number: number;
      date: string;
      amount: number;
      interest: number;
      principal: number;
      balance: number;
    }>;
  };
  
  // Legal Documents
  legalDocuments: string[];
  
  // Additional Documents for Receipt
  additionalDocuments?: string[];
  allSelectedDocuments?: string[];
  
  // Final Information
  observations: string;
  
  // Draft Management
  isDraft?: boolean;
  draftId?: string;
  lastSaved?: string;
}

interface NewVentaFormProps {
  mode: 'create';
  initialData?: Partial<VentaFormData>;
}

const STEPS = [
  { 
    id: 'customer', 
    title: 'Cliente', 
    description: 'Seleccionar o registrar cliente',
    icon: User,
    required: true
  },
  { 
    id: 'guarantor', 
    title: 'Garante', 
    description: 'Información del garante (si aplica)',
    icon: UserCheck,
    required: false
  },
  { 
    id: 'documents', 
    title: 'Documentos', 
    description: 'Subir documentación requerida',
    icon: FileText,
    required: true
  },
  { 
    id: 'motorcycle', 
    title: 'Motocicleta', 
    description: 'Seleccionar motocicleta y color',
    icon: Bike,
    required: true
  },
  { 
    id: 'payment', 
    title: 'Pago', 
    description: 'Tipo de pago y financiamiento',
    icon: DollarSign,
    required: true
  },
  { 
    id: 'legal', 
    title: 'Documentos Legales', 
    description: 'Seleccionar documentos legales',
    icon: FileCheck,
    required: true
  },
  { 
    id: 'review', 
    title: 'Revisión', 
    description: 'Revisar y generar recibo',
    icon: Receipt,
    required: true
  }
];

const NewVentaForm: React.FC<NewVentaFormProps> = ({ mode, initialData }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<VentaFormData>({
    customer: null,
    isNewCustomer: false,
    needsGuarantor: false,
    guarantor: null,
    uploadedDocuments: [],
    selectedMotorcycles: [],
    selectedMotorcycle: null,
    paymentType: 'contado',
    downPayment: 0,
    financingDetails: {
      totalAmount: 0,
      financedAmount: 0,
      interestRate: 0,
      numberOfPayments: 0,
      paymentFrequency: 'mensual',
      paymentAmount: 0,
      paymentSchedule: []
    },
    legalDocuments: [],
    observations: '',
    ...initialData
  });

  // Autocompletar datos del cliente desde URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const clienteId = urlParams.get('cliente_id');
    
    if (clienteId) {
      const clienteData: Cliente = {
        id: parseInt(clienteId),
        nombre: urlParams.get('nombre') || '',
        apellido: urlParams.get('apellido') || '',
        cedula: urlParams.get('cedula') || '',
        telefono: urlParams.get('telefono') || '',
        email: urlParams.get('email') || '',
        direccion: decodeURIComponent(urlParams.get('direccion') || ''),
        fecha_registro: new Date().toISOString(),
        nombre_completo: `${urlParams.get('nombre')} ${urlParams.get('apellido')}`
      };
      
      setFormData(prev => ({
        ...prev,
        customer: clienteData,
        isNewCustomer: false
      }));
    }
  }, []);

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Función para validar si un paso está completo
  const isStepComplete = (stepIndex: number): boolean => {
    const step = STEPS[stepIndex];
    
    switch (step.id) {
      case 'customer':
        return formData.customer !== null;
      
      case 'guarantor':
        if (!formData.needsGuarantor) {
          return true; // No se necesita garante, paso completo
        }
        // Si se necesita garante, verificar si es existente (tiene ID) o si es nuevo con datos completos
        if (formData.guarantor) {
          if (formData.guarantor.id) {
            return true; // Garante existente seleccionado
          }
          // Garante nuevo, verificar campos mínimos
          return formData.guarantor.nombre && formData.guarantor.cedula && formData.guarantor.parentesco_cliente;
        }
        return false;
      
      case 'documents':
        return formData.uploadedDocuments.length > 0;
      
      case 'motorcycle':
        return formData.selectedMotorcycles.length > 0 || formData.selectedMotorcycle !== null;
      
      case 'payment':
        return formData.paymentType === 'contado' || 
               (formData.paymentType === 'financiado' && formData.financingDetails.paymentSchedule.length > 0);
      
      case 'legal':
        return formData.legalDocuments.length > 0;
      
      case 'review':
        return true; // Siempre disponible si llegamos aquí
      
      default:
        return false;
    }
  };

  // Actualizar pasos completados cuando cambie formData
  useEffect(() => {
    const newCompletedSteps = new Set<number>();
    STEPS.forEach((_, index) => {
      if (isStepComplete(index)) {
        newCompletedSteps.add(index);
      }
    });
    setCompletedSteps(newCompletedSteps);
  }, [formData]);

  const updateFormData = (updates: Partial<VentaFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canAdvanceToStep = (stepIndex: number): boolean => {
    // Puede avanzar si todos los pasos requeridos anteriores están completos
    for (let i = 0; i < stepIndex; i++) {
      if (STEPS[i].required && !completedSteps.has(i)) {
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      if (canAdvanceToStep(nextStep)) {
        setCurrentStep(nextStep);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (canAdvanceToStep(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  };


  const handleSaveVenta = async (data: VentaFormData) => {
    try {
      if (!data.customer || !data.selectedMotorcycle) {
        throw new Error('Faltan datos requeridos para la venta');
      }

      const totalAmount = data.selectedMotorcycle.precio_unitario * data.selectedMotorcycle.cantidad;

      const ventaData = {
        cliente_id: data.customer.id,
        tipo_venta: data.paymentType,
        motorcycle: {
          tipo: data.selectedMotorcycle.tipo,
          modelo_id: data.selectedMotorcycle.tipo === 'modelo' ? data.selectedMotorcycle.modelo?.id : undefined,
          moto_id: data.selectedMotorcycle.tipo === 'individual' ? data.selectedMotorcycle.moto?.id : undefined,
          color: data.selectedMotorcycle.color,
          chasis: data.selectedMotorcycle.chasis,
          cantidad: data.selectedMotorcycle.cantidad,
          precio_unitario: data.selectedMotorcycle.precio_unitario
        },
        payment: {
          monto_total: totalAmount,
          monto_inicial: data.paymentType === 'financiado' ? data.downPayment : totalAmount,
          cuotas: data.paymentType === 'financiado' ? data.financingDetails.numberOfPayments : undefined,
          tasa_interes: data.paymentType === 'financiado' ? data.financingDetails.interestRate : undefined,
          pago_mensual: data.paymentType === 'financiado' ? data.financingDetails.paymentAmount : undefined,
          monto_total_con_intereses: data.paymentType === 'financiado' ? data.financingDetails.totalAmount : totalAmount
        },
        documentos: data.allSelectedDocuments || [],
        observaciones: data.observations || ''
      };

      const newVenta = await ventaService.createVentaFromForm(ventaData);
      alert(`Venta #${newVenta.id} registrada exitosamente!`);
      navigate('/ventas');
      
    } catch (error) {
      console.error('Error saving venta:', error);
      alert(`Error al guardar la venta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleSaveDraft = async (data: VentaFormData) => {
    try {
      if (!data.customer) {
        throw new Error('Debe seleccionar un cliente para guardar el borrador');
      }

      const draftResult = await ventaService.saveDraft({
        cliente_id: data.customer.id,
        draft_data: data,
        draft_id: data.draftId
      });

      alert(`Borrador guardado exitosamente! ID: ${draftResult.id}`);
      
    } catch (error: any) {
      console.error('Error guardando borrador:', error);
      
      let errorMessage = 'Error al guardar el borrador';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleFinalizeSale = () => {
    // Validar que todos los pasos requeridos estén completos SOLO para finalizar
    const incompleteSteps = STEPS.filter((step, index) => 
      step.required && !completedSteps.has(index)
    );

    if (incompleteSteps.length > 0) {
      setErrors({
        form: `Para finalizar la venta, complete los siguientes pasos: ${incompleteSteps.map(s => s.title).join(', ')}`
      });
      return;
    }

    // Validación mínima para finalizar venta
    if (!formData.customer) {
      setErrors({ form: 'Debe seleccionar un cliente para finalizar la venta' });
      return;
    }

    if (!formData.selectedMotorcycles.length && !formData.selectedMotorcycle) {
      setErrors({ form: 'Debe seleccionar al menos una motocicleta para finalizar la venta' });
      return;
    }

    const finalData = {
      ...formData,
      isDraft: false,
      lastSaved: new Date().toISOString()
    };

    handleSaveVenta(finalData);
  };

  // Guardado automático cada 30 segundos (solo si hay datos mínimos)
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (formData.customer) {
        handleSaveDraft(formData);
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [formData]);

  const handleSave = handleFinalizeSale;

  const renderStepContent = () => {
    const step = STEPS[currentStep];
    
    switch (step.id) {
      case 'customer':
        return (
          <CustomerStep
            data={formData}
            onUpdate={updateFormData}
            errors={errors}
          />
        );
      
      case 'guarantor':
        return (
          <GuarantorStep
            data={formData}
            onUpdate={updateFormData}
            errors={errors}
          />
        );
      
      case 'documents':
        return (
          <DocumentsStep
            data={formData}
            onUpdate={updateFormData}
            errors={errors}
          />
        );
      
      case 'motorcycle':
        return (
          <MotorcycleStep
            data={formData}
            onUpdate={updateFormData}
            errors={errors}
          />
        );
      
      case 'payment':
        return (
          <PaymentStep
            data={formData}
            onUpdate={updateFormData}
            errors={errors}
          />
        );
      
      case 'legal':
        return (
          <LegalDocumentsStep
            data={formData}
            onUpdate={updateFormData}
            errors={errors}
          />
        );
      
      case 'review':
        return (
          <ReviewStep
            data={formData}
            onUpdate={updateFormData}
            errors={errors}
            onPreviousStep={handlePrevious}
            onSubmit={handleSave}
          />
        );
      
      default:
        return <div>Paso no encontrado</div>;
    }
  };

  return (
    <div className="page-fade-in">
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {formData.isDraft ? 'Venta en Borrador' : 'Nueva Venta'}
                </h2>
                <p className="text-blue-100 mt-1">
                  Paso {currentStep + 1} de {STEPS.length}: {STEPS[currentStep].title}
                </p>
              </div>
              
              {/* Indicador de estado de borrador */}
              {formData.isDraft && formData.lastSaved && (
                <div className="bg-blue-800 bg-opacity-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-blue-100">
                    Borrador guardado
                  </p>
                  <p className="text-xs text-blue-200">
                    {new Date(formData.lastSaved).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => navigate('/ventas')}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(index);
              const canAccess = canAdvanceToStep(index);
              
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center cursor-pointer transition-all ${
                    canAccess ? 'hover:scale-105' : 'cursor-not-allowed opacity-50'
                  }`}
                  onClick={() => handleStepClick(index)}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                        : isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center max-w-20 ${
                      isActive
                        ? 'text-blue-600 font-semibold'
                        : isCompleted
                        ? 'text-green-600 font-medium'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                  {step.required && !isCompleted && (
                    <span className="text-red-500 text-xs">*</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Error Messages */}
            {errors.form && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {errors.form}
              </div>
            )}

            {/* Step Content */}
            <div className="min-h-96">
              {renderStepContent()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </button>

          <div className="flex items-center space-x-3">
            {/* Botón de guardar borrador - siempre disponible si hay cliente */}
            {formData.customer && (
              <button
                onClick={() => handleSaveDraft(formData)}
                className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                title="Guardar como borrador para continuar más tarde"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Borrador
              </button>
            )}

            {currentStep === STEPS.length - 1 ? (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSaveDraft(formData)}
                  className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                  title="Guardar sin finalizar (se puede completar después)"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Sin Finalizar
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  title="Finalizar venta completamente"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar Venta
                </button>
              </div>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canAdvanceToStep(currentStep + 1)}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewVentaForm;