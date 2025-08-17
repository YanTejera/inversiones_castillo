import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  Calculator,
  Calendar,
  Percent,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText
} from 'lucide-react';
import type { VentaFormData } from '../NewVentaForm';

interface PaymentStepProps {
  data: VentaFormData;
  onUpdate: (updates: Partial<VentaFormData>) => void;
  errors: Record<string, string>;
}

type PaymentFrequency = 'mensual' | 'quincenal' | 'semanal' | 'diario';

interface PaymentScheduleItem {
  number: number;
  date: string;
  amount: number;
  interest: number;
  principal: number;
  balance: number;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ data, onUpdate, errors }) => {
  const [paymentType, setPaymentType] = useState<'contado' | 'financiado'>(data.paymentType);
  const [downPayment, setDownPayment] = useState<number>(data.downPayment);
  const [interestRate, setInterestRate] = useState<number>(data.financingDetails.interestRate);
  const [numberOfPayments, setNumberOfPayments] = useState<number>(data.financingDetails.numberOfPayments);
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(data.financingDetails.paymentFrequency);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);

  const getTotalAmount = () => {
    if (!data.selectedMotorcycle) return 0;
    return data.selectedMotorcycle.precio_unitario * data.selectedMotorcycle.cantidad;
  };

  const getFinancedAmount = () => {
    return getTotalAmount() - downPayment;
  };

  const getFrequencyDetails = (frequency: PaymentFrequency) => {
    switch (frequency) {
      case 'diario':
        return { name: 'Diario', periodsPerYear: 365, icon: '📅' };
      case 'semanal':
        return { name: 'Semanal', periodsPerYear: 52, icon: '📅' };
      case 'quincenal':
        return { name: 'Quincenal', periodsPerYear: 24, icon: '🗓️' };
      case 'mensual':
        return { name: 'Mensual', periodsPerYear: 12, icon: '📅' };
      default:
        return { name: 'Mensual', periodsPerYear: 12, icon: '📅' };
    }
  };

  const calculatePaymentSchedule = () => {
    if (paymentType === 'contado') {
      setPaymentSchedule([]);
      return;
    }

    const principal = getFinancedAmount();
    if (principal <= 0 || numberOfPayments <= 0 || interestRate <= 0) {
      setPaymentSchedule([]);
      return;
    }

    const monthlyRate = interestRate / 100 / 12;
    const frequencyDetails = getFrequencyDetails(paymentFrequency);
    const periodicRate = (interestRate / 100) / frequencyDetails.periodsPerYear;
    
    // Calcular pago periódico usando fórmula de amortización
    const paymentAmount = principal * (periodicRate * Math.pow(1 + periodicRate, numberOfPayments)) / 
                         (Math.pow(1 + periodicRate, numberOfPayments) - 1);

    const schedule: PaymentScheduleItem[] = [];
    let remainingBalance = principal;
    const startDate = new Date();

    for (let i = 1; i <= numberOfPayments; i++) {
      const interestPayment = remainingBalance * periodicRate;
      const principalPayment = paymentAmount - interestPayment;
      remainingBalance -= principalPayment;

      // Calcular fecha del pago
      const paymentDate = new Date(startDate);
      switch (paymentFrequency) {
        case 'diario':
          paymentDate.setDate(startDate.getDate() + i);
          break;
        case 'semanal':
          paymentDate.setDate(startDate.getDate() + (i * 7));
          break;
        case 'quincenal':
          paymentDate.setDate(startDate.getDate() + (i * 15));
          break;
        case 'mensual':
          paymentDate.setMonth(startDate.getMonth() + i);
          break;
      }

      schedule.push({
        number: i,
        date: paymentDate.toLocaleDateString('es-CO'),
        amount: paymentAmount,
        interest: interestPayment,
        principal: principalPayment,
        balance: Math.max(0, remainingBalance)
      });
    }

    setPaymentSchedule(schedule);
  };

  // Recalcular cuando cambien los parámetros
  useEffect(() => {
    calculatePaymentSchedule();
  }, [paymentType, downPayment, interestRate, numberOfPayments, paymentFrequency, data.selectedMotorcycle]);

  // Actualizar datos del formulario principal
  useEffect(() => {
    const paymentAmount = paymentSchedule.length > 0 ? paymentSchedule[0].amount : 0;
    
    onUpdate({
      paymentType,
      downPayment,
      financingDetails: {
        totalAmount: getTotalAmount(),
        financedAmount: getFinancedAmount(),
        interestRate,
        numberOfPayments,
        paymentFrequency,
        paymentAmount,
        paymentSchedule
      }
    });
  }, [paymentType, downPayment, interestRate, numberOfPayments, paymentFrequency, paymentSchedule]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalInterest = () => {
    return paymentSchedule.reduce((total, payment) => total + payment.interest, 0);
  };

  const getTotalToPay = () => {
    return downPayment + paymentSchedule.reduce((total, payment) => total + payment.amount, 0);
  };

  if (!data.selectedMotorcycle) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
        <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
        <span className="text-yellow-800">
          Debe seleccionar una motocicleta antes de configurar el pago.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Configuración de Pago
        </h3>
        <p className="text-gray-600">
          Configure el tipo de pago y las condiciones de financiamiento.
        </p>
      </div>

      {/* Resumen de la motocicleta seleccionada */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Resumen de la Compra
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Motocicleta:</span>
            <p className="font-medium text-blue-900">
              {data.selectedMotorcycle.tipo === 'modelo' 
                ? `${data.selectedMotorcycle.modelo?.marca} ${data.selectedMotorcycle.modelo?.modelo}`
                : `${data.selectedMotorcycle.moto?.marca} ${data.selectedMotorcycle.moto?.modelo}`
              }
            </p>
          </div>
          <div>
            <span className="text-blue-700">Cantidad:</span>
            <p className="font-medium text-blue-900">{data.selectedMotorcycle.cantidad}</p>
          </div>
          <div>
            <span className="text-blue-700">Precio Unitario:</span>
            <p className="font-medium text-blue-900">{formatCurrency(data.selectedMotorcycle.precio_unitario)}</p>
          </div>
          <div>
            <span className="text-blue-700">Total:</span>
            <p className="font-bold text-blue-900 text-lg">{formatCurrency(getTotalAmount())}</p>
          </div>
        </div>
      </div>

      {/* Selección de tipo de pago */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Tipo de Pago
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setPaymentType('contado')}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              paymentType === 'contado'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">Pago de Contado</h5>
                <p className="text-sm text-gray-600">Pago completo al momento de la compra</p>
              </div>
              {paymentType === 'contado' && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(getTotalAmount())}
              </p>
            </div>
          </div>

          <div
            onClick={() => setPaymentType('financiado')}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              paymentType === 'financiado'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">Financiado</h5>
                <p className="text-sm text-gray-600">Pago inicial + cuotas periódicas</p>
              </div>
              {paymentType === 'financiado' && <CheckCircle className="h-5 w-5 text-blue-600" />}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">Desde</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(getTotalAmount() * 0.1)} inicial
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración de financiamiento */}
      {paymentType === 'financiado' && (
        <div className="border border-gray-200 rounded-lg p-6 space-y-6">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Configuración del Financiamiento
          </h4>

          {/* Cuota inicial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cuota Inicial
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[10, 20, 30, 50].map((percentage) => {
                const amount = getTotalAmount() * (percentage / 100);
                return (
                  <button
                    key={percentage}
                    onClick={() => setDownPayment(amount)}
                    className={`p-3 text-center border rounded-lg transition-all ${
                      downPayment === amount
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold">{percentage}%</div>
                    <div className="text-xs">{formatCurrency(amount)}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-2">
              <input
                type="number"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                min={0}
                max={getTotalAmount()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese monto personalizado"
              />
            </div>
          </div>

          {/* Tasa de interés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasa de Interés Anual (%)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[12, 18, 24, 30, 36].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setInterestRate(rate)}
                  className={`p-2 text-center border rounded-lg transition-all ${
                    interestRate === rate
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
            <div className="mt-2">
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                min={0}
                max={100}
                step={0.1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Tasa personalizada"
              />
            </div>
          </div>

          {/* Frecuencia de pagos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frecuencia de Pagos
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['diario', 'semanal', 'quincenal', 'mensual'] as PaymentFrequency[]).map((frequency) => {
                const details = getFrequencyDetails(frequency);
                return (
                  <button
                    key={frequency}
                    onClick={() => setPaymentFrequency(frequency)}
                    className={`p-3 text-center border rounded-lg transition-all ${
                      paymentFrequency === frequency
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg">{details.icon}</div>
                    <div className="font-medium text-sm">{details.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Número de cuotas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Cuotas
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[12, 18, 24, 30, 36, 48].map((payments) => (
                <button
                  key={payments}
                  onClick={() => setNumberOfPayments(payments)}
                  className={`p-2 text-center border rounded-lg transition-all ${
                    numberOfPayments === payments
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {payments}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <input
                type="number"
                value={numberOfPayments}
                onChange={(e) => setNumberOfPayments(Number(e.target.value))}
                min={1}
                max={120}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Número personalizado"
              />
            </div>
          </div>

          {/* Resumen del financiamiento */}
          {paymentSchedule.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Resumen del Financiamiento
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Cuota Inicial:</span>
                  <p className="font-semibold text-green-600">{formatCurrency(downPayment)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Monto Financiado:</span>
                  <p className="font-semibold text-blue-600">{formatCurrency(getFinancedAmount())}</p>
                </div>
                <div>
                  <span className="text-gray-600">Cuota {getFrequencyDetails(paymentFrequency).name}:</span>
                  <p className="font-semibold text-purple-600">{formatCurrency(paymentSchedule[0].amount)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total a Pagar:</span>
                  <p className="font-semibold text-gray-900">{formatCurrency(getTotalToPay())}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Intereses:</span>
                  <p className="font-semibold text-orange-600">{formatCurrency(getTotalInterest())}</p>
                </div>
                <div>
                  <span className="text-gray-600">Número de Cuotas:</span>
                  <p className="font-semibold text-gray-900">{numberOfPayments}</p>
                </div>
                <div>
                  <span className="text-gray-600">Tasa de Interés:</span>
                  <p className="font-semibold text-gray-900">{interestRate}% anual</p>
                </div>
                <div>
                  <span className="text-gray-600">Frecuencia:</span>
                  <p className="font-semibold text-gray-900">{getFrequencyDetails(paymentFrequency).name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Cronograma de pagos (primeros 10) */}
          {paymentSchedule.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h5 className="font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Cronograma de Pagos (Primeros 10)
                </h5>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        #
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Cuota
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Capital
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Interés
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Saldo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentSchedule.slice(0, 10).map((payment) => (
                      <tr key={payment.number} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-900">{payment.number}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{payment.date}</td>
                        <td className="px-3 py-2 text-sm font-medium text-purple-600">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-3 py-2 text-sm text-blue-600">
                          {formatCurrency(payment.principal)}
                        </td>
                        <td className="px-3 py-2 text-sm text-orange-600">
                          {formatCurrency(payment.interest)}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {formatCurrency(payment.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {paymentSchedule.length > 10 && (
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-center text-sm text-gray-500">
                  ... y {paymentSchedule.length - 10} cuotas más
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentStep;