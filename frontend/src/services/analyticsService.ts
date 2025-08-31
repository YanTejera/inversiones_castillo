import api from './api';

export interface ABCAnalysis {
  categoria_a: {
    modelos: Array<{
      modelo_id: number;
      nombre: string;
      stock: number;
      valor_inventario: number;
      porcentaje_valor: number;
    }>;
    cantidad_modelos: number;
    porcentaje_modelos: number;
  };
  categoria_b: {
    modelos: Array<{
      modelo_id: number;
      nombre: string;
      stock: number;
      valor_inventario: number;
      porcentaje_valor: number;
    }>;
    cantidad_modelos: number;
    porcentaje_modelos: number;
  };
  categoria_c: {
    modelos: Array<{
      modelo_id: number;
      nombre: string;
      stock: number;
      valor_inventario: number;
      porcentaje_valor: number;
    }>;
    cantidad_modelos: number;
    porcentaje_modelos: number;
  };
}

export interface MetricaRotacion {
  modelo_id: number;
  nombre: string;
  stock_actual: number;
  ventas_ano: number;
  rotacion_anual: number;
  dias_promedio_venta: number;
  eficiencia: 'alta' | 'media' | 'baja';
  ingresos_ano: number;
}

export interface MetricasGenerales {
  valor_total_inventario: number;
  total_modelos_activos: number;
  stock_total_unidades: number;
  rotacion_promedio: number;
  valor_promedio_por_unidad: number;
}

export interface RiesgoObsolescencia {
  modelos: Array<{
    modelo_id: number;
    nombre: string;
    stock: number;
    valor_riesgo: number;
    dias_sin_venta: number;
  }>;
  cantidad_modelos: number;
  valor_total_riesgo: number;
}

export interface AnalyticsAvanzados {
  abc_analysis: ABCAnalysis;
  rotacion_inventario: MetricaRotacion[];
  metricas_generales: MetricasGenerales;
  riesgo_obsolescencia: RiesgoObsolescencia;
}

export interface AlertaInteligente {
  tipo: 'stock_bajo' | 'exceso_inventario' | 'sin_movimiento' | 'alta_demanda';
  prioridad: 'urgente' | 'alta' | 'media' | 'baja';
  modelo_id: number;
  modelo: string;
  stock_actual: number;
  mensaje: string;
  accion_sugerida: string;
  // Campos específicos según el tipo de alerta
  punto_reorden?: number;
  dias_restantes?: number;
  venta_mensual?: number;
  cantidad_sugerida?: number;
  meses_inventario?: number;
  exceso_unidades?: number;
  valor_exceso?: number;
  dias_sin_movimiento?: number;
  valor_riesgo?: number;
  ventas_mes?: number;
  ratio_demanda?: number;
}

export interface ResumenAlertas {
  total_alertas: number;
  por_prioridad: {
    urgente: number;
    alta: number;
    media: number;
    baja: number;
  };
  por_tipo: {
    stock_bajo: number;
    exceso_inventario: number;
    sin_movimiento: number;
    alta_demanda: number;
  };
}

export interface AlertasInteligentes {
  alertas: AlertaInteligente[];
  resumen: ResumenAlertas;
}

export const analyticsService = {
  async getAnalyticsAvanzados(): Promise<AnalyticsAvanzados> {
    const response = await api.get('/motos/analytics/');
    return response.data;
  },

  async getAlertasInteligentes(): Promise<AlertasInteligentes> {
    const response = await api.get('/motos/alertas/');
    return response.data;
  }
};

export default analyticsService;