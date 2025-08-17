import React, { useState, useEffect } from 'react';
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
  CheckCircle
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

export interface VentaFormData {
  // Customer Information
  customer: Cliente | null;
  isNewCustomer: boolean;
  
  // Guarantor Information
  needsGuarantor: boolean;
  guarantor: any | null;
  
  // Documents
  uploadedDocuments: File[];
  
  // Motorcycle Selection
  selectedMotorcycle: {
    tipo: 'modelo' | 'individual';
    modelo?: MotoModelo;
    moto?: Moto;
    color?: string;
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
}

interface NewVentaFormProps {
  onClose: () => void;
  onSave: (data: VentaFormData) => void;
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

const NewVentaForm: React.FC<NewVentaFormProps> = ({ onClose, onSave, initialData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<VentaFormData>({
    customer: null,
    isNewCustomer: false,
    needsGuarantor: false,
    guarantor: null,
    uploadedDocuments: [],
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
        return !formData.needsGuarantor || formData.guarantor !== null;
      
      case 'documents':
        return formData.uploadedDocuments.length > 0;
      
      case 'motorcycle':
        return formData.selectedMotorcycle !== null;
      
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

  const handleSave = () => {
    // Validar que todos los pasos requeridos estén completos
    const incompleteSteps = STEPS.filter((step, index) => 
      step.required && !completedSteps.has(index)
    );

    if (incompleteSteps.length > 0) {
      setErrors({
        form: `Por favor complete los siguientes pasos: ${incompleteSteps.map(s => s.title).join(', ')}`
      });
      return;
    }

    onSave(formData);
  };

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">Nueva Venta</h2>
            <p className="text-blue-100 mt-1">
              Paso {currentStep + 1} de {STEPS.length}: {STEPS[currentStep].title}
            </p>
          </div>
          <button
            onClick={onClose}
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

          <div className="flex items-center space-x-4">
            {currentStep === STEPS.length - 1 ? (
              <button
                onClick={handleSave}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Guardar Venta
              </button>
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