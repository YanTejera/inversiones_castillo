// Interfaces para Analytics de Comunicaciones

export interface CommunicationEvent {
  id: string;
  tipo: 'envio' | 'entrega' | 'lectura' | 'respuesta' | 'conversion' | 'error';
  canal: 'WhatsApp' | 'Email' | 'SMS' | 'Telegram';
  cliente_id: number;
  campana_id?: number;
  plantilla_id?: number;
  promocion_id?: number;
  mensaje_id: string;
  contenido?: string;
  timestamp: string;
  metadata?: {
    error_tipo?: string;
    error_mensaje?: string;
    dispositivo?: string;
    ubicacion?: string;
    tiempo_lectura?: number;
    tiempo_respuesta?: number;
  };
}

export interface CampaignMetrics {
  campana_id: number;
  campana_nombre: string;
  canal: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin?: string;
  estado: string;

  // Métricas básicas
  destinatarios_total: number;
  mensajes_enviados: number;
  mensajes_entregados: number;
  mensajes_leidos: number;
  mensajes_respondidos: number;
  conversiones: number;
  errores: number;

  // Tasas calculadas
  tasa_entrega: number;      // entregados / enviados
  tasa_apertura: number;     // leidos / entregados
  tasa_respuesta: number;    // respondidos / leidos
  tasa_conversion: number;   // conversiones / respondidos
  tasa_error: number;        // errores / enviados

  // Métricas de tiempo
  tiempo_promedio_lectura: number;    // minutos
  tiempo_promedio_respuesta: number;  // horas

  // Métricas financieras
  costo_total: number;
  costo_por_mensaje: number;
  costo_por_conversion: number;
  roi: number;

  // Métricas de promociones (si aplica)
  promocion_aplicada?: boolean;
  codigo_promocional?: string;
  descuentos_aplicados?: number;
  valor_descuentos?: number;

  // Segmentación
  por_segmento: { [segmento: string]: SegmentMetrics };
  por_dispositivo: { [dispositivo: string]: number };
  por_hora: { [hora: string]: number };
  por_dia: { [dia: string]: number };
}

export interface SegmentMetrics {
  segmento: string;
  total_clientes: number;
  mensajes_enviados: number;
  tasa_apertura: number;
  tasa_respuesta: number;
  tasa_conversion: number;
  valor_promedio_conversion: number;
}

export interface ChannelMetrics {
  canal: 'WhatsApp' | 'Email' | 'SMS' | 'Telegram';

  // Métricas del período
  mensajes_enviados: number;
  mensajes_entregados: number;
  mensajes_leidos: number;
  mensajes_respondidos: number;
  conversiones: number;
  errores: number;

  // Tasas
  tasa_entrega: number;
  tasa_apertura: number;
  tasa_respuesta: number;
  tasa_conversion: number;

  // Costos
  costo_total: number;
  costo_promedio: number;

  // Tendencias (comparación con período anterior)
  tendencia_envios: number;      // % cambio
  tendencia_apertura: number;    // % cambio
  tendencia_conversion: number;  // % cambio

  // Mejor hora para envío
  mejor_hora_envio: string;
  mejor_dia_semana: string;
}

export interface ClientCommunicationProfile {
  cliente_id: number;
  cliente_nombre: string;
  cliente_segmento: string;

  // Preferencias identificadas
  canal_preferido: string;
  hora_preferida_lectura: string;
  dia_preferido_comunicacion: string;
  frecuencia_optima: number; // días entre mensajes

  // Métricas históricas
  total_mensajes_recibidos: number;
  total_mensajes_leidos: number;
  total_mensajes_respondidos: number;
  total_conversiones: number;
  valor_total_conversiones: number;

  // Tasas personales
  tasa_apertura_personal: number;
  tasa_respuesta_personal: number;
  tasa_conversion_personal: number;

  // Historial de engagement
  ultimo_mensaje: string;
  ultima_lectura: string;
  ultima_respuesta: string;
  ultima_conversion: string;

  // Score de engagement (0-100)
  engagement_score: number;

  // Recomendaciones
  recomendaciones: string[];
}

export interface CommunicationTrend {
  fecha: string;
  canal: string;

  mensajes_enviados: number;
  tasa_apertura: number;
  tasa_respuesta: number;
  tasa_conversion: number;

  // Comparación con promedios
  vs_promedio_apertura: number;   // % diferencia
  vs_promedio_respuesta: number;  // % diferencia
  vs_promedio_conversion: number; // % diferencia
}

export interface AnalyticsFilters {
  fecha_inicio: string;
  fecha_fin: string;
  canales?: string[];
  segmentos?: string[];
  campanas?: number[];
  tipos_mensaje?: string[];
  incluir_promociones?: boolean;
}

export interface DashboardMetrics {
  // Resumen general
  periodo: string;
  total_mensajes: number;
  total_clientes_contactados: number;
  total_conversiones: number;
  inversion_total: number;
  roi_general: number;

  // Métricas por canal
  por_canal: ChannelMetrics[];

  // Top performers
  top_campanas: CampaignMetrics[];
  top_plantillas: {
    plantilla_id: number;
    nombre: string;
    usos: number;
    tasa_exito: number;
  }[];

  // Tendencias
  tendencias_7_dias: CommunicationTrend[];
  tendencias_30_dias: CommunicationTrend[];

  // Alertas
  alertas: {
    tipo: 'warning' | 'info' | 'success' | 'error';
    mensaje: string;
    metrica: string;
    valor_actual: number;
    valor_esperado: number;
  }[];

  // Predicciones
  predicciones: {
    proximo_mes_mensajes: number;
    proximo_mes_conversiones: number;
    proximo_mes_roi: number;
    confianza: number; // 0-100%
  };
}

class CommunicationAnalyticsService {
  private events: CommunicationEvent[] = [];
  private campaigns: CampaignMetrics[] = [];

  constructor() {
    this.loadData();
    this.generateMockData();
  }

  private loadData() {
    // Cargar eventos desde localStorage
    const savedEvents = localStorage.getItem('communication_events');
    if (savedEvents) {
      this.events = JSON.parse(savedEvents);
    }

    // Cargar métricas de campañas
    const savedCampaigns = localStorage.getItem('campaign_metrics');
    if (savedCampaigns) {
      this.campaigns = JSON.parse(savedCampaigns);
    }
  }

  private saveData() {
    localStorage.setItem('communication_events', JSON.stringify(this.events));
    localStorage.setItem('campaign_metrics', JSON.stringify(this.campaigns));
  }

  // Registrar evento de comunicación
  trackEvent(event: Omit<CommunicationEvent, 'id' | 'timestamp'>): void {
    const newEvent: CommunicationEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.events.push(newEvent);
    this.saveData();

    console.log('📊 Evento registrado:', newEvent);
  }

  // Obtener métricas del dashboard
  getDashboardMetrics(filters?: AnalyticsFilters): DashboardMetrics {
    const filteredEvents = this.filterEvents(filters);
    const filteredCampaigns = this.filterCampaigns(filters);

    return {
      periodo: this.getPeriodString(filters),
      total_mensajes: filteredEvents.filter(e => e.tipo === 'envio').length,
      total_clientes_contactados: new Set(filteredEvents.map(e => e.cliente_id)).size,
      total_conversiones: filteredEvents.filter(e => e.tipo === 'conversion').length,
      inversion_total: this.calculateTotalInvestment(filteredCampaigns),
      roi_general: this.calculateROI(filteredCampaigns),

      por_canal: this.calculateChannelMetrics(filteredEvents),
      top_campanas: filteredCampaigns.slice(0, 5),
      top_plantillas: this.getTopPlantillas(filteredEvents),

      tendencias_7_dias: this.getTrends(filteredEvents, 7),
      tendencias_30_dias: this.getTrends(filteredEvents, 30),

      alertas: this.generateAlerts(filteredEvents, filteredCampaigns),
      predicciones: this.generatePredictions(filteredEvents)
    };
  }

  // Obtener métricas de campañas
  getCampaignMetrics(campaignId?: number, filters?: AnalyticsFilters): CampaignMetrics[] {
    let campaigns = this.campaigns;

    if (campaignId) {
      campaigns = campaigns.filter(c => c.campana_id === campaignId);
    }

    if (filters) {
      campaigns = this.filterCampaigns(filters, campaigns);
    }

    return campaigns;
  }

  // Obtener perfil de comunicación de cliente
  getClientProfile(clienteId: number): ClientCommunicationProfile {
    const clientEvents = this.events.filter(e => e.cliente_id === clienteId);

    return this.calculateClientProfile(clienteId, clientEvents);
  }

  // Obtener métricas por canal
  getChannelMetrics(canal?: string, filters?: AnalyticsFilters): ChannelMetrics[] {
    const filteredEvents = this.filterEvents(filters);

    if (canal) {
      const channelEvents = filteredEvents.filter(e => e.canal === canal);
      return [this.calculateSingleChannelMetrics(canal as any, channelEvents)];
    }

    return this.calculateChannelMetrics(filteredEvents);
  }

  // Métodos auxiliares privados
  private filterEvents(filters?: AnalyticsFilters): CommunicationEvent[] {
    if (!filters) return this.events;

    return this.events.filter(event => {
      const eventDate = new Date(event.timestamp);
      const startDate = new Date(filters.fecha_inicio);
      const endDate = new Date(filters.fecha_fin);

      let matches = eventDate >= startDate && eventDate <= endDate;

      if (filters.canales) {
        matches = matches && filters.canales.includes(event.canal);
      }

      if (filters.campanas && event.campana_id) {
        matches = matches && filters.campanas.includes(event.campana_id);
      }

      return matches;
    });
  }

  private filterCampaigns(filters?: AnalyticsFilters, campaigns = this.campaigns): CampaignMetrics[] {
    if (!filters) return campaigns;

    return campaigns.filter(campaign => {
      const startDate = new Date(filters.fecha_inicio);
      const endDate = new Date(filters.fecha_fin);
      const campaignStart = new Date(campaign.fecha_inicio);

      let matches = campaignStart >= startDate && campaignStart <= endDate;

      if (filters.canales) {
        matches = matches && filters.canales.includes(campaign.canal);
      }

      return matches;
    });
  }

  private calculateChannelMetrics(events: CommunicationEvent[]): ChannelMetrics[] {
    const channels = ['WhatsApp', 'Email', 'SMS', 'Telegram'] as const;

    return channels.map(canal => this.calculateSingleChannelMetrics(canal, events));
  }

  private calculateSingleChannelMetrics(canal: string, events: CommunicationEvent[]): ChannelMetrics {
    const channelEvents = events.filter(e => e.canal === canal);

    const enviados = channelEvents.filter(e => e.tipo === 'envio').length;
    const entregados = channelEvents.filter(e => e.tipo === 'entrega').length;
    const leidos = channelEvents.filter(e => e.tipo === 'lectura').length;
    const respondidos = channelEvents.filter(e => e.tipo === 'respuesta').length;
    const conversiones = channelEvents.filter(e => e.tipo === 'conversion').length;
    const errores = channelEvents.filter(e => e.tipo === 'error').length;

    return {
      canal: canal as any,
      mensajes_enviados: enviados,
      mensajes_entregados: entregados,
      mensajes_leidos: leidos,
      mensajes_respondidos: respondidos,
      conversiones,
      errores,

      tasa_entrega: enviados > 0 ? (entregados / enviados) * 100 : 0,
      tasa_apertura: entregados > 0 ? (leidos / entregados) * 100 : 0,
      tasa_respuesta: leidos > 0 ? (respondidos / leidos) * 100 : 0,
      tasa_conversion: respondidos > 0 ? (conversiones / respondidos) * 100 : 0,

      costo_total: this.calculateChannelCost(canal, enviados),
      costo_promedio: enviados > 0 ? this.calculateChannelCost(canal, enviados) / enviados : 0,

      tendencia_envios: this.calculateTrend(canal, 'envio'),
      tendencia_apertura: this.calculateTrend(canal, 'apertura'),
      tendencia_conversion: this.calculateTrend(canal, 'conversion'),

      mejor_hora_envio: this.getBestSendingTime(channelEvents),
      mejor_dia_semana: this.getBestSendingDay(channelEvents)
    };
  }

  private calculateChannelCost(canal: string, mensajes: number): number {
    const costos = {
      'WhatsApp': 0.05,
      'Email': 0.01,
      'SMS': 0.08,
      'Telegram': 0.02
    };

    return mensajes * (costos[canal as keyof typeof costos] || 0);
  }

  private calculateTrend(canal: string, metrica: string): number {
    // Simular cálculo de tendencia (% cambio vs período anterior)
    return Math.random() * 20 - 10; // -10% a +10%
  }

  private getBestSendingTime(events: CommunicationEvent[]): string {
    const horasCounts: { [hora: string]: number } = {};

    events.filter(e => e.tipo === 'lectura').forEach(event => {
      const hora = new Date(event.timestamp).getHours();
      const horaKey = `${hora}:00`;
      horasCounts[horaKey] = (horasCounts[horaKey] || 0) + 1;
    });

    const mejorHora = Object.entries(horasCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return mejorHora ? mejorHora[0] : '10:00';
  }

  private getBestSendingDay(events: CommunicationEvent[]): string {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diasCounts: { [dia: string]: number } = {};

    events.filter(e => e.tipo === 'lectura').forEach(event => {
      const dia = dias[new Date(event.timestamp).getDay()];
      diasCounts[dia] = (diasCounts[dia] || 0) + 1;
    });

    const mejorDia = Object.entries(diasCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return mejorDia ? mejorDia[0] : 'Martes';
  }

  private calculateClientProfile(clienteId: number, events: CommunicationEvent[]): ClientCommunicationProfile {
    // Implementación del perfil de cliente
    // Por ahora retorno un perfil mock
    return {
      cliente_id: clienteId,
      cliente_nombre: `Cliente ${clienteId}`,
      cliente_segmento: 'Regular',
      canal_preferido: 'WhatsApp',
      hora_preferida_lectura: '10:00',
      dia_preferido_comunicacion: 'Martes',
      frecuencia_optima: 7,
      total_mensajes_recibidos: events.length,
      total_mensajes_leidos: events.filter(e => e.tipo === 'lectura').length,
      total_mensajes_respondidos: events.filter(e => e.tipo === 'respuesta').length,
      total_conversiones: events.filter(e => e.tipo === 'conversion').length,
      valor_total_conversiones: 0,
      tasa_apertura_personal: 75,
      tasa_respuesta_personal: 45,
      tasa_conversion_personal: 12,
      ultimo_mensaje: events[events.length - 1]?.timestamp || '',
      ultima_lectura: '',
      ultima_respuesta: '',
      ultima_conversion: '',
      engagement_score: 78,
      recomendaciones: ['Enviar por WhatsApp', 'Horario matutino preferido']
    };
  }

  private getTopPlantillas(events: CommunicationEvent[]) {
    // Agrupar por plantilla y calcular métricas
    const plantillasMap: { [id: string]: any } = {};

    events.forEach(event => {
      if (event.plantilla_id) {
        const key = event.plantilla_id.toString();
        if (!plantillasMap[key]) {
          plantillasMap[key] = {
            plantilla_id: event.plantilla_id,
            nombre: `Plantilla ${event.plantilla_id}`,
            usos: 0,
            exitos: 0
          };
        }

        if (event.tipo === 'envio') {
          plantillasMap[key].usos++;
        }
        if (event.tipo === 'conversion') {
          plantillasMap[key].exitos++;
        }
      }
    });

    return Object.values(plantillasMap)
      .map((p: any) => ({
        ...p,
        tasa_exito: p.usos > 0 ? (p.exitos / p.usos) * 100 : 0
      }))
      .sort((a, b) => b.tasa_exito - a.tasa_exito)
      .slice(0, 5);
  }

  private getTrends(events: CommunicationEvent[], days: number): CommunicationTrend[] {
    const trends: CommunicationTrend[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const dayEvents = events.filter(e =>
        e.timestamp.startsWith(dateString)
      );

      ['WhatsApp', 'Email', 'SMS', 'Telegram'].forEach(canal => {
        const canalEvents = dayEvents.filter(e => e.canal === canal);
        const enviados = canalEvents.filter(e => e.tipo === 'envio').length;
        const leidos = canalEvents.filter(e => e.tipo === 'lectura').length;
        const respondidos = canalEvents.filter(e => e.tipo === 'respuesta').length;
        const conversiones = canalEvents.filter(e => e.tipo === 'conversion').length;

        trends.push({
          fecha: dateString,
          canal,
          mensajes_enviados: enviados,
          tasa_apertura: enviados > 0 ? (leidos / enviados) * 100 : 0,
          tasa_respuesta: leidos > 0 ? (respondidos / leidos) * 100 : 0,
          tasa_conversion: respondidos > 0 ? (conversiones / respondidos) * 100 : 0,
          vs_promedio_apertura: 0,
          vs_promedio_respuesta: 0,
          vs_promedio_conversion: 0
        });
      });
    }

    return trends;
  }

  private generateAlerts(events: CommunicationEvent[], campaigns: CampaignMetrics[]) {
    const alerts: any[] = [];

    // Alertas de ejemplo
    const errorRate = events.filter(e => e.tipo === 'error').length / events.length;
    if (errorRate > 0.05) {
      alerts.push({
        tipo: 'warning',
        mensaje: 'Alta tasa de errores de entrega',
        metrica: 'error_rate',
        valor_actual: errorRate * 100,
        valor_esperado: 5
      });
    }

    return alerts;
  }

  private generatePredictions(events: CommunicationEvent[]) {
    // Predicciones simples basadas en tendencias
    const totalMensajes = events.filter(e => e.tipo === 'envio').length;
    const totalConversiones = events.filter(e => e.tipo === 'conversion').length;

    return {
      proximo_mes_mensajes: Math.round(totalMensajes * 1.1),
      proximo_mes_conversiones: Math.round(totalConversiones * 1.05),
      proximo_mes_roi: 125,
      confianza: 75
    };
  }

  private calculateTotalInvestment(campaigns: CampaignMetrics[]): number {
    return campaigns.reduce((total, campaign) => total + campaign.costo_total, 0);
  }

  private calculateROI(campaigns: CampaignMetrics[]): number {
    const totalInversion = this.calculateTotalInvestment(campaigns);
    const totalROI = campaigns.reduce((total, campaign) => total + campaign.roi, 0);

    return campaigns.length > 0 ? totalROI / campaigns.length : 0;
  }

  private getPeriodString(filters?: AnalyticsFilters): string {
    if (!filters) return 'Todos los tiempos';

    const start = new Date(filters.fecha_inicio).toLocaleDateString('es-ES');
    const end = new Date(filters.fecha_fin).toLocaleDateString('es-ES');

    return `${start} - ${end}`;
  }

  // Generar datos mock para demonstración
  private generateMockData() {
    if (this.events.length > 0) return; // Ya hay datos

    const now = new Date();
    const canales: (keyof typeof this.events[0]['canal'])[] = ['WhatsApp', 'Email', 'SMS', 'Telegram'];
    const tipos: (keyof typeof this.events[0]['tipo'])[] = ['envio', 'entrega', 'lectura', 'respuesta', 'conversion'];

    // Generar eventos de los últimos 30 días
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Generar 10-50 eventos por día
      const eventsPerDay = Math.floor(Math.random() * 40) + 10;

      for (let j = 0; j < eventsPerDay; j++) {
        const canal = canales[Math.floor(Math.random() * canales.length)];
        const clienteId = Math.floor(Math.random() * 100) + 1;

        // Simular flujo de eventos para un mensaje
        const baseTimestamp = new Date(date);
        baseTimestamp.setHours(Math.floor(Math.random() * 24));
        baseTimestamp.setMinutes(Math.floor(Math.random() * 60));

        const messageId = `msg_${baseTimestamp.getTime()}_${clienteId}`;

        // Envío (siempre ocurre)
        this.trackEvent({
          tipo: 'envio',
          canal,
          cliente_id: clienteId,
          campana_id: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : undefined,
          plantilla_id: Math.floor(Math.random() * 10) + 1,
          mensaje_id: messageId,
          contenido: `Mensaje de prueba para cliente ${clienteId}`
        });

        // Entrega (85% probabilidad)
        if (Math.random() < 0.85) {
          const entregaTime = new Date(baseTimestamp.getTime() + Math.random() * 5 * 60 * 1000); // 0-5 min después
          this.trackEvent({
            tipo: 'entrega',
            canal,
            cliente_id: clienteId,
            mensaje_id: messageId
          });

          // Lectura (60% de los entregados)
          if (Math.random() < 0.6) {
            const lecturaTime = new Date(entregaTime.getTime() + Math.random() * 30 * 60 * 1000); // 0-30 min después
            this.trackEvent({
              tipo: 'lectura',
              canal,
              cliente_id: clienteId,
              mensaje_id: messageId,
              metadata: {
                tiempo_lectura: Math.floor(Math.random() * 120) + 10 // 10-130 segundos
              }
            });

            // Respuesta (25% de los leídos)
            if (Math.random() < 0.25) {
              const respuestaTime = new Date(lecturaTime.getTime() + Math.random() * 2 * 60 * 60 * 1000); // 0-2 horas después
              this.trackEvent({
                tipo: 'respuesta',
                canal,
                cliente_id: clienteId,
                mensaje_id: messageId,
                metadata: {
                  tiempo_respuesta: Math.floor((respuestaTime.getTime() - lecturaTime.getTime()) / (1000 * 60)) // en minutos
                }
              });

              // Conversión (15% de los que responden)
              if (Math.random() < 0.15) {
                const conversionTime = new Date(respuestaTime.getTime() + Math.random() * 24 * 60 * 60 * 1000); // 0-24 horas después
                this.trackEvent({
                  tipo: 'conversion',
                  canal,
                  cliente_id: clienteId,
                  mensaje_id: messageId
                });
              }
            }
          }
        } else {
          // Error de entrega (15%)
          this.trackEvent({
            tipo: 'error',
            canal,
            cliente_id: clienteId,
            mensaje_id: messageId,
            metadata: {
              error_tipo: 'delivery_failed',
              error_mensaje: 'Número no válido'
            }
          });
        }
      }
    }

    // Generar métricas de campañas mock
    this.generateMockCampaignMetrics();
    this.saveData();
  }

  private generateMockCampaignMetrics() {
    const mockCampaigns: CampaignMetrics[] = [
      {
        campana_id: 1,
        campana_nombre: "Promoción Motocicletas Septiembre",
        canal: "WhatsApp",
        tipo: "Marketing",
        fecha_inicio: "2024-09-01",
        fecha_fin: "2024-09-30",
        estado: "Completada",
        destinatarios_total: 500,
        mensajes_enviados: 500,
        mensajes_entregados: 475,
        mensajes_leidos: 380,
        mensajes_respondidos: 95,
        conversiones: 23,
        errores: 25,
        tasa_entrega: 95,
        tasa_apertura: 80,
        tasa_respuesta: 25,
        tasa_conversion: 24.2,
        tasa_error: 5,
        tiempo_promedio_lectura: 15,
        tiempo_promedio_respuesta: 2.5,
        costo_total: 2500,
        costo_por_mensaje: 5,
        costo_por_conversion: 108.7,
        roi: 245.8,
        promocion_aplicada: true,
        codigo_promocional: "MOTO15",
        descuentos_aplicados: 18,
        valor_descuentos: 45000,
        por_segmento: {
          "VIP": { segmento: "VIP", total_clientes: 150, mensajes_enviados: 150, tasa_apertura: 85, tasa_respuesta: 30, tasa_conversion: 28, valor_promedio_conversion: 25000 },
          "Regular": { segmento: "Regular", total_clientes: 350, mensajes_enviados: 350, tasa_apertura: 78, tasa_respuesta: 22, tasa_conversion: 22, valor_promedio_conversion: 18000 }
        },
        por_dispositivo: { "mobile": 85, "desktop": 15 },
        por_hora: { "9": 15, "10": 25, "11": 20, "14": 18, "15": 22 },
        por_dia: { "lunes": 18, "martes": 22, "miercoles": 20, "jueves": 19, "viernes": 21 }
      }
    ];

    this.campaigns = mockCampaigns;
  }
}

export const communicationAnalytics = new CommunicationAnalyticsService();
export default CommunicationAnalyticsService;

// Re-export interfaces for use in components
export type {
  CommunicationEvent,
  CampaignMetrics,
  SegmentMetrics,
  ChannelMetrics,
  ClientCommunicationProfile,
  CommunicationTrend,
  AnalyticsFilters,
  DashboardMetrics
};