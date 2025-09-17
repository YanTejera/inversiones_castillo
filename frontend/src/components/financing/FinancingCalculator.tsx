import React, { useState } from 'react';
import {
  Calculator,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  Download,
  RefreshCw,
  Info
} from 'lucide-react';
import { financingService, type LoanCalculation, type LoanParams } from '../../services/financingService';

interface FinancingCalculatorProps {
  vehiclePrice?: number;
  onCalculated?: (calculation: LoanCalculation) => void;
}

const FinancingCalculator: React.FC<FinancingCalculatorProps> = ({
  vehiclePrice = 0,
  onCalculated
}) => {
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<LoanParams>({
    monto: vehiclePrice,
    inicial: 0,
    tasa: 12,
    plazo: 48
  });

  const [showAmortization, setShowAmortization] = useState(false);

  // Actualizar monto cuando cambia el precio del vehículo
  React.useEffect(() => {
    if (vehiclePrice > 0 && formData.monto !== vehiclePrice) {
      setFormData(prev => ({ ...prev, monto: vehiclePrice }));
    }
  }, [vehiclePrice, formData.monto]);

  const calculateLoan = async () => {
    if (formData.monto <= 0) {
      setError('El monto del vehículo debe ser mayor a 0');
      return;
    }

    if (formData.inicial >= formData.monto) {
      setError('La cuota inicial debe ser menor al precio del vehículo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await financingService.calculateLoan(formData);
      setCalculation(result);
      if (onCalculated) {
        onCalculated(result);
      }
    } catch (err) {
      setError('Error al calcular el financiamiento. Intente nuevamente.');
      console.error('Error calculating loan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoanParams, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar cálculo anterior cuando cambian los valores
    if (calculation) {
      setCalculation(null);
    }
  };

  const exportCalculation = () => {
    if (!calculation) return;

    const data = {
      ...calculation,
      parametros: formData,
      fecha_calculo: new Date().toLocaleDateString('es-CO')
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulacion_credito_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const initialPercentage = formData.monto > 0 ? (formData.inicial / formData.monto * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calculator className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Calculadora de Financiamiento
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Simula tu crédito y conoce las cuotas
              </p>
            </div>
          </div>
          {calculation && (
            <button
              onClick={exportCalculation}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Formulario de parámetros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Precio del Vehículo
            </label>
            <input
              type="number"
              value={formData.monto}
              onChange={(e) => handleInputChange('monto', Number(e.target.value))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="$0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Cuota Inicial ({initialPercentage.toFixed(1)}%)
            </label>
            <input
              type="number"
              value={formData.inicial}
              onChange={(e) => handleInputChange('inicial', Number(e.target.value))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="$0"
              min="0"
              max={formData.monto}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <TrendingUp className="h-4 w-4 inline mr-1" />
              Tasa de Interés Anual (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.tasa}
              onChange={(e) => handleInputChange('tasa', Number(e.target.value))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="12.0"
              min="0"
              max="50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Plazo (meses)
            </label>
            <select
              value={formData.plazo}
              onChange={(e) => handleInputChange('plazo', Number(e.target.value))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={12}>12 meses (1 año)</option>
              <option value={18}>18 meses</option>
              <option value={24}>24 meses (2 años)</option>
              <option value={36}>36 meses (3 años)</option>
              <option value={48}>48 meses (4 años)</option>
              <option value={60}>60 meses (5 años)</option>
              <option value={72}>72 meses (6 años)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={calculateLoan}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
        >
          {loading ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Calculator className="h-5 w-5" />
          )}
          {loading ? 'Calculando...' : 'Calcular Financiamiento'}
        </button>

        {/* Resultados */}
        {calculation && (
          <div className="mt-8 space-y-6">
            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-lg border border-green-200 dark:border-green-700">
                <h3 className="font-medium text-green-800 dark:text-green-200 text-sm">Cuota Mensual</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-300">
                  {financingService.formatCurrency(calculation.cuota_mensual)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Por {formData.plazo} meses
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                <h3 className="font-medium text-blue-800 dark:text-blue-200 text-sm">Total Intereses</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                  {financingService.formatCurrency(calculation.total_intereses)}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {((calculation.total_intereses / calculation.resumen.monto_financiar) * 100).toFixed(1)}% del capital
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                <h3 className="font-medium text-purple-800 dark:text-purple-200 text-sm">Total a Pagar</h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                  {financingService.formatCurrency(calculation.total_pagar)}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Inicial + Cuotas
                </p>
              </div>
            </div>

            {/* Resumen detallado */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Resumen del Financiamiento
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Precio Vehículo:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {financingService.formatCurrency(calculation.resumen.monto_vehiculo)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Cuota Inicial:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {financingService.formatCurrency(calculation.resumen.inicial)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Monto a Financiar:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {financingService.formatCurrency(calculation.resumen.monto_financiar)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Tasa Mensual:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {calculation.resumen.tasa_mensual.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Tabla de amortización */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setShowAmortization(!showAmortization)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Tabla de Amortización
                  </h3>
                  <span className="text-gray-500 dark:text-gray-400">
                    {showAmortization ? '▼' : '▶'}
                  </span>
                </button>
              </div>
              
              {showAmortization && (
                <div className="p-4">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-600 sticky top-0">
                        <tr>
                          <th className="p-2 text-left text-gray-700 dark:text-gray-300">Mes</th>
                          <th className="p-2 text-right text-gray-700 dark:text-gray-300">Cuota</th>
                          <th className="p-2 text-right text-gray-700 dark:text-gray-300">Capital</th>
                          <th className="p-2 text-right text-gray-700 dark:text-gray-300">Interés</th>
                          <th className="p-2 text-right text-gray-700 dark:text-gray-300">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculation.tabla_amortizacion.map((row) => (
                          <tr key={row.mes} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="p-2 font-medium text-gray-900 dark:text-white">{row.mes}</td>
                            <td className="p-2 text-right text-gray-900 dark:text-white">
                              {financingService.formatCurrency(row.cuota)}
                            </td>
                            <td className="p-2 text-right text-green-600 dark:text-green-400">
                              {financingService.formatCurrency(row.capital)}
                            </td>
                            <td className="p-2 text-right text-red-600 dark:text-red-400">
                              {financingService.formatCurrency(row.interes)}
                            </td>
                            <td className="p-2 text-right text-gray-900 dark:text-white">
                              {financingService.formatCurrency(row.saldo)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancingCalculator;