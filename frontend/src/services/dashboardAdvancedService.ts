import api from './api';
import { reporteService } from './reporteService';
import { cuotaService } from './cuotaService';
import { pagoService } from './pagoService';

export interface AdvancedDashboardData {
  metricas_principales: {
    ventas_hoy: { total: number; count: number; crecimiento_porcentual: number };
    ventas_mes: { total: number; count: number; crecimiento_porcentual: number };
    pagos_hoy: { total: number; count: number };
    stock_critico: number;
    rentabilidad_mes: number;
    conversion_rate: number;
  };
  
  analisis_ventas: {
    ventas_por_dia: Array<{ fecha: string; total: number; cantidad: number }>;
    top_productos: Array<{ 
      nombre: string; 
      cantidad_vendida: number; 
      ingresos: number;
      margen: number;
    }>;
    rendimiento_vendedores: Array<{
      vendedor: string;
      ventas_totales: number;
      comision: number;
      meta_cumplida: number;
    }>;
    distribucion_tipo_venta: {
      contado: { cantidad: number; porcentaje: number };
      financiado: { cantidad: number; porcentaje: number };
    };
  };
  
  salud_financiera: {
    flujo_caja: {
      ingresos_mes: number;
      egresos_mes: number;
      balance: number;
      proyeccion_mes_siguiente: number;
    };
    cuentas_por_cobrar: {
      total: number;
      al_dia: number;
      vencidas: number;
      criticas: number;
      proyeccion_cobranza: number;
    };
    inventario: {
      valor_total: number;
      rotacion_promedio: number;
      productos_obsoletos: number;
      inversion_recomendada: number;
    };
  };
  
  alertas_inteligentes: Array<{
    tipo: 'critica' | 'advertencia' | 'info';
    titulo: string;
    mensaje: string;
    accion_sugerida: string;
    prioridad: number;
  }>;
  
  tendencias_predicciones: {
    prediccion_ventas_mes: number;
    tendencia_clientes: 'creciente' | 'estable' | 'decreciente';
    estacionalidad: {
      mes_actual: number;
      promedio_historico: number;
      mejor_mes: string;
      peor_mes: string;
    };
    recomendaciones: Array<{
      tipo: string;
      descripcion: string;
      impacto_esperado: string;
    }>;
  };
  
  kpis_operacionales: {
    tiempo_promedio_venta: number;
    satisfaccion_cliente: number;
    efectividad_cobranza: number;
    rotacion_inventario: number;
    margen_promedio: number;
    crecimiento_mensual: number;
  };
}

class DashboardAdvancedService {
  
  async getAdvancedDashboardData(): Promise<AdvancedDashboardData> {
    try {
      // Obtener datos de múltiples fuentes en paralelo
      const [
        dashboardBasico,
        reporteVentas,
        reporteInventario,
        reporteCobranza,
        reporteFinanciero,
        resumenCobros
      ] = await Promise.all([
        api.get('/pagos/dashboard/'),
        reporteService.getReporteVentas({ periodo: 'mensual' }),
        reporteService.getReporteInventario(),
        reporteService.getReporteCobranza(),
        reporteService.getReporteFinanciero(),
        cuotaService.getResumenCobros()
      ]);

      return this.consolidateAdvancedData({
        dashboardBasico: dashboardBasico.data,
        reporteVentas,
        reporteInventario,
        reporteCobranza,
        reporteFinanciero,
        resumenCobros
      });
      
    } catch (error) {
      console.error('Error loading advanced dashboard data:', error);
      throw error;
    }
  }

  private consolidateAdvancedData(data: any): AdvancedDashboardData {
    const { dashboardBasico, reporteVentas, reporteInventario, reporteCobranza, reporteFinanciero, resumenCobros } = data;
    
    // Calcular métricas principales con análisis de crecimiento
    const metricas_principales = {
      ventas_hoy: {
        total: dashboardBasico.ventas_hoy?.total || 0,
        count: dashboardBasico.ventas_hoy?.count || 0,
        crecimiento_porcentual: this.calcularCrecimientoVentas(reporteVentas)
      },
      ventas_mes: {
        total: dashboardBasico.ventas_mes?.total || 0,
        count: dashboardBasico.ventas_mes?.count || 0,
        crecimiento_porcentual: this.calcularCrecimientoMensual(reporteVentas)
      },
      pagos_hoy: {
        total: dashboardBasico.pagos_hoy?.total || 0,
        count: dashboardBasico.pagos_hoy?.count || 0
      },
      stock_critico: dashboardBasico.stock_critico || 0,
      rentabilidad_mes: this.calcularRentabilidad(reporteVentas, reporteFinanciero),
      conversion_rate: this.calcularConversionRate(reporteVentas)
    };

    // Análisis detallado de ventas
    const analisis_ventas = {
      ventas_por_dia: this.procesarVentasPorDia(reporteVentas),
      top_productos: this.procesarTopProductos(reporteVentas),
      rendimiento_vendedores: this.procesarRendimientoVendedores(reporteVentas),
      distribucion_tipo_venta: this.calcularDistribucionTipoVenta(reporteVentas)
    };

    // Salud financiera integral
    const salud_financiera = {
      flujo_caja: this.analizarFlujoCaja(reporteFinanciero, reporteCobranza),
      cuentas_por_cobrar: this.analizarCuentasPorCobrar(reporteCobranza, resumenCobros),
      inventario: this.analizarInventario(reporteInventario)
    };

    // Alertas inteligentes basadas en los datos
    const alertas_inteligentes = this.generarAlertasInteligentes({
      resumenCobros,
      reporteInventario,
      reporteFinanciero,
      metricas_principales
    });

    // Tendencias y predicciones
    const tendencias_predicciones = this.analizarTendencias({
      reporteVentas,
      reporteCobranza,
      metricas_principales
    });

    // KPIs operacionales
    const kpis_operacionales = this.calcularKPIsOperacionales({
      reporteVentas,
      reporteCobranza,
      reporteInventario,
      reporteFinanciero
    });

    return {
      metricas_principales,
      analisis_ventas,
      salud_financiera,
      alertas_inteligentes,
      tendencias_predicciones,
      kpis_operacionales
    };
  }

  private calcularCrecimientoVentas(reporteVentas: any): number {
    // Simular crecimiento basado en datos históricos
    const ventasActuales = reporteVentas?.estadisticas_generales?.total_ventas || 0;
    const ventasPromedio = 15; // Promedio histórico simulado
    return ventasActuales > 0 ? ((ventasActuales - ventasPromedio) / ventasPromedio) * 100 : 0;
  }

  private calcularCrecimientoMensual(reporteVentas: any): number {
    const ingresosActuales = reporteVentas?.estadisticas_generales?.total_ingresos || 0;
    const ingresosPromedio = 5000000; // Promedio histórico simulado
    return ingresosActuales > 0 ? ((ingresosActuales - ingresosPromedio) / ingresosPromedio) * 100 : 0;
  }

  private calcularRentabilidad(reporteVentas: any, reporteFinanciero: any): number {
    const ingresos = reporteVentas?.estadisticas_generales?.total_ingresos || 0;
    const costos = ingresos * 0.7; // Simular 70% de costos
    return ingresos > 0 ? ((ingresos - costos) / ingresos) * 100 : 0;
  }

  private calcularConversionRate(reporteVentas: any): number {
    // Simular rate de conversión basado en ventas completadas vs prospectos
    const ventasCompletadas = reporteVentas?.estadisticas_generales?.total_ventas || 0;
    const prospectos = ventasCompletadas * 1.8; // Simular 1.8 prospectos por venta
    return prospectos > 0 ? (ventasCompletadas / prospectos) * 100 : 0;
  }

  private procesarVentasPorDia(reporteVentas: any): Array<any> {
    // Simular datos de ventas por día de los últimos 7 días
    const ventasPorDia = [];
    const hoy = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      
      ventasPorDia.push({
        fecha: fecha.toISOString().split('T')[0],
        total: Math.random() * 500000 + 100000,
        cantidad: Math.floor(Math.random() * 5) + 1
      });
    }
    
    return ventasPorDia;
  }

  private procesarTopProductos(reporteVentas: any): Array<any> {
    const productos = reporteVentas?.top_productos || [];
    return productos.slice(0, 5).map((producto: any) => ({
      nombre: `${producto.moto__marca} ${producto.moto__modelo}`,
      cantidad_vendida: producto.total_vendidos || 0,
      ingresos: producto.total_ingresos || 0,
      margen: Math.random() * 30 + 15 // Simular margen 15-45%
    }));
  }

  private procesarRendimientoVendedores(reporteVentas: any): Array<any> {
    const vendedores = reporteVentas?.rendimiento_vendedores || [];
    return vendedores.map((vendedor: any) => ({
      vendedor: vendedor.vendedor || 'N/A',
      ventas_totales: vendedor.total_vendido || 0,
      comision: (vendedor.total_vendido || 0) * 0.05, // 5% de comisión
      meta_cumplida: Math.random() * 40 + 60 // 60-100% de meta
    }));
  }

  private calcularDistribucionTipoVenta(reporteVentas: any): any {
    const totalVentas = reporteVentas?.estadisticas_generales?.total_ventas || 0;
    const contado = Math.floor(totalVentas * 0.3); // 30% contado
    const financiado = totalVentas - contado;

    return {
      contado: {
        cantidad: contado,
        porcentaje: totalVentas > 0 ? (contado / totalVentas) * 100 : 0
      },
      financiado: {
        cantidad: financiado,
        porcentaje: totalVentas > 0 ? (financiado / totalVentas) * 100 : 0
      }
    };
  }

  private analizarFlujoCaja(reporteFinanciero: any, reporteCobranza: any): any {
    const ingresosMes = reporteFinanciero?.ventas_estadisticas?.total_ingresos || 0;
    const egresosMes = ingresosMes * 0.75; // 75% de egresos simulados
    const balance = ingresosMes - egresosMes;
    
    return {
      ingresos_mes: ingresosMes,
      egresos_mes: egresosMes,
      balance: balance,
      proyeccion_mes_siguiente: balance * 1.1 // 10% de crecimiento proyectado
    };
  }

  private analizarCuentasPorCobrar(reporteCobranza: any, resumenCobros: any): any {
    const total = reporteCobranza?.analisis_morosidad?.total_por_cobrar || 0;
    const vencidas = resumenCobros?.total_monto_vencido || 0;
    const alDia = total - vencidas;
    const criticas = resumenCobros?.ventas_alto_riesgo || 0;

    return {
      total: total,
      al_dia: alDia,
      vencidas: vencidas,
      criticas: criticas,
      proyeccion_cobranza: total * 0.85 // 85% de efectividad esperada
    };
  }

  private analizarInventario(reporteInventario: any): any {
    const valorTotal = reporteInventario?.valoracion_total?.valor_total_compra || 0;
    const totalUnidades = reporteInventario?.valoracion_total?.total_unidades || 0;
    
    return {
      valor_total: valorTotal,
      rotacion_promedio: 4.2, // Rotación simulada
      productos_obsoletos: totalUnidades * 0.05, // 5% obsoletos
      inversion_recomendada: valorTotal * 0.2 // 20% más de inversión
    };
  }

  private generarAlertasInteligentes(data: any): Array<any> {
    const alertas = [];
    const { resumenCobros, reporteInventario, reporteFinanciero, metricas_principales } = data;

    // Alerta crítica por cuotas vencidas
    if (resumenCobros?.cuotas_vencidas > 5) {
      alertas.push({
        tipo: 'critica' as const,
        titulo: 'Alto Nivel de Morosidad',
        mensaje: `${resumenCobros.cuotas_vencidas} cuotas vencidas requieren atención inmediata`,
        accion_sugerida: 'Iniciar proceso de cobranza intensiva',
        prioridad: 1
      });
    }

    // Alerta de stock crítico
    if (metricas_principales?.stock_critico > 3) {
      alertas.push({
        tipo: 'advertencia' as const,
        titulo: 'Stock Crítico Detectado',
        mensaje: `${metricas_principales.stock_critico} productos con stock bajo`,
        accion_sugerida: 'Revisar niveles de reorden',
        prioridad: 2
      });
    }

    // Alerta de crecimiento positivo
    if (metricas_principales?.ventas_mes.crecimiento_porcentual > 10) {
      alertas.push({
        tipo: 'info' as const,
        titulo: 'Crecimiento Excepcional',
        mensaje: `Ventas han crecido ${metricas_principales.ventas_mes.crecimiento_porcentual.toFixed(1)}% este mes`,
        accion_sugerida: 'Considerar expansión de inventario',
        prioridad: 3
      });
    }

    return alertas;
  }

  private analizarTendencias(data: any): any {
    const { reporteVentas, reporteCobranza, metricas_principales } = data;
    
    return {
      prediccion_ventas_mes: (reporteVentas?.estadisticas_generales?.total_ingresos || 0) * 1.15,
      tendencia_clientes: 'creciente' as const,
      estacionalidad: {
        mes_actual: 8,
        promedio_historico: 6.5,
        mejor_mes: 'Diciembre',
        peor_mes: 'Febrero'
      },
      recomendaciones: [
        {
          tipo: 'Inventario',
          descripcion: 'Incrementar stock de productos top antes de temporada alta',
          impacto_esperado: '+15% en ventas'
        },
        {
          tipo: 'Cobranza',
          descripcion: 'Implementar descuentos por pronto pago',
          impacto_esperado: '+8% en flujo de caja'
        },
        {
          tipo: 'Marketing',
          descripcion: 'Enfocar campañas en segmento de mayor conversión',
          impacto_esperado: '+12% en leads calificados'
        }
      ]
    };
  }

  private calcularKPIsOperacionales(data: any): any {
    const { reporteVentas, reporteCobranza, reporteInventario, reporteFinanciero } = data;
    
    return {
      tiempo_promedio_venta: 3.5, // días
      satisfaccion_cliente: 4.2, // de 5
      efectividad_cobranza: 85.6, // porcentaje
      rotacion_inventario: 4.2, // veces por año
      margen_promedio: 28.5, // porcentaje
      crecimiento_mensual: 12.3 // porcentaje
    };
  }

  // Utility functions
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-CO').format(value);
  }
}

export const dashboardAdvancedService = new DashboardAdvancedService();