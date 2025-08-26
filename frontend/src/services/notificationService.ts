import api from './api';

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: 'pago_vencido' | 'pago_proximo' | 'nueva_venta' | 'pago_recibido' | 'stock_bajo' | 'nueva_moto' | 'cliente_nuevo' | 'venta_cancelada' | 'sistema' | 'recordatorio';
  tipo_display: string;
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
  prioridad_display: string;
  usuario: number | null;
  usuario_info?: {
    id: number;
    username: string;
    nombre_completo: string;
  };
  es_global: boolean;
  roles_destinatarios: string;
  leida: boolean;
  fecha_leida: string | null;
  fecha_creacion: string;
  fecha_expiracion: string | null;
  datos_adicionales: Record<string, any>;
  enviada_push: boolean;
  fecha_envio_push: string | null;
  esta_expirada: boolean;
  es_urgente: boolean;
  tiempo_transcurrido: string;
}

export interface NotificacionCreate {
  titulo: string;
  mensaje: string;
  tipo: string;
  prioridad: string;
  usuario?: number;
  es_global?: boolean;
  roles_destinatarios?: string;
  datos_adicionales?: Record<string, any>;
  fecha_expiracion?: string;
}

export interface PreferenciaNotificacion {
  id: number;
  usuario: number;
  usuario_info: {
    id: number;
    username: string;
    nombre_completo: string;
  };
  pago_vencido: boolean;
  pago_proximo: boolean;
  nueva_venta: boolean;
  pago_recibido: boolean;
  stock_bajo: boolean;
  nueva_moto: boolean;
  cliente_nuevo: boolean;
  venta_cancelada: boolean;
  sistema: boolean;
  recordatorio: boolean;
  mostrar_en_app: boolean;
  enviar_push: boolean;
  enviar_email: boolean;
  push_subscription: any;
  fecha_actualizacion: string;
}

export interface NotificacionResumen {
  total: number;
  no_leidas: number;
  urgentes: number;
  por_tipo: Record<string, number>;
  recientes: Notificacion[];
}

export interface MarcarLeidaRequest {
  notificacion_ids: number[];
}

class NotificationService {
  private readonly baseURL = '/api/notificaciones';

  // CRUD básico
  async getNotificaciones(params?: {
    leidas?: boolean;
    tipo?: string;
    prioridad?: string;
    incluir_expiradas?: boolean;
  }): Promise<{ results: Notificacion[]; count: number; next: string | null; previous: string | null }> {
    const queryParams = new URLSearchParams();
    
    if (params?.leidas !== undefined) {
      queryParams.append('leidas', params.leidas.toString());
    }
    if (params?.tipo) {
      queryParams.append('tipo', params.tipo);
    }
    if (params?.prioridad) {
      queryParams.append('prioridad', params.prioridad);
    }
    if (params?.incluir_expiradas) {
      queryParams.append('incluir_expiradas', params.incluir_expiradas.toString());
    }

    const response = await api.get(`${this.baseURL}/?${queryParams.toString()}`);
    return response.data;
  }

  async getNotificacion(id: number): Promise<Notificacion> {
    const response = await api.get(`${this.baseURL}/${id}/`);
    return response.data;
  }

  async crearNotificacion(data: NotificacionCreate): Promise<Notificacion> {
    const response = await api.post(`${this.baseURL}/crear/`, data);
    return response.data;
  }

  async actualizarNotificacion(id: number, data: Partial<NotificacionCreate>): Promise<Notificacion> {
    const response = await api.patch(`${this.baseURL}/${id}/`, data);
    return response.data;
  }

  async eliminarNotificacion(id: number): Promise<void> {
    await api.delete(`${this.baseURL}/${id}/`);
  }

  // Funciones especiales
  async getResumen(): Promise<NotificacionResumen> {
    const response = await api.get(`${this.baseURL}/resumen/`);
    return response.data;
  }

  async marcarLeida(notificacionIds: number[]): Promise<{ message: string; updated_count: number }> {
    const response = await api.post(`${this.baseURL}/marcar-leida/`, {
      notificacion_ids: notificacionIds
    });
    return response.data;
  }

  async marcarTodasLeidas(): Promise<{ message: string; updated_count: number }> {
    const response = await api.post(`${this.baseURL}/marcar-todas-leidas/`);
    return response.data;
  }

  // Preferencias
  async getPreferencias(): Promise<PreferenciaNotificacion> {
    const response = await api.get(`${this.baseURL}/preferencias/`);
    return response.data;
  }

  async actualizarPreferencias(data: Partial<PreferenciaNotificacion>): Promise<PreferenciaNotificacion> {
    const response = await api.patch(`${this.baseURL}/preferencias/`, data);
    return response.data;
  }

  // Notificación rápida
  async crearNotificacionRapida(data: NotificacionCreate): Promise<Notificacion> {
    const response = await api.post(`${this.baseURL}/crear-rapida/`, data);
    return response.data;
  }

  // Web Push API
  async suscribirPush(subscription: PushSubscription): Promise<{ message: string }> {
    const response = await api.post(`${this.baseURL}/push/suscribir/`, {
      subscription: subscription.toJSON()
    });
    return response.data;
  }

  async desuscribirPush(): Promise<{ message: string }> {
    const response = await api.post(`${this.baseURL}/push/desuscribir/`);
    return response.data;
  }

  // Utilidades para Web Push
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones push');
      return 'denied';
    }

    return await Notification.requestPermission();
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging no está soportado');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // VAPID public key - deberá configurarse
          'BEl62iUYgUivxIkv69yViEuiBIa40HI8J9aLVa0I8-5C0Z0IiIgZI4P0_F8r8aDh2kgIgSHmgZ3YBcL1lEg6RnM'
        )
      });

      await this.suscribirPush(subscription);
      return subscription;
    } catch (error) {
      console.error('Error al suscribirse a push notifications:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Helpers para mostrar notificaciones locales
  showLocalNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    }
  }

  // Obtener color y icono según tipo de notificación
  getNotificationStyle(tipo: string, prioridad: string) {
    const tipos: Record<string, { icon: string; color: string }> = {
      pago_vencido: { icon: '⚠️', color: 'text-red-600 bg-red-50' },
      pago_proximo: { icon: '⏰', color: 'text-yellow-600 bg-yellow-50' },
      nueva_venta: { icon: '💰', color: 'text-green-600 bg-green-50' },
      pago_recibido: { icon: '✅', color: 'text-green-600 bg-green-50' },
      stock_bajo: { icon: '📦', color: 'text-orange-600 bg-orange-50' },
      nueva_moto: { icon: '🏍️', color: 'text-blue-600 bg-blue-50' },
      cliente_nuevo: { icon: '👤', color: 'text-purple-600 bg-purple-50' },
      venta_cancelada: { icon: '❌', color: 'text-red-600 bg-red-50' },
      sistema: { icon: '⚙️', color: 'text-gray-600 bg-gray-50' },
      recordatorio: { icon: '🔔', color: 'text-blue-600 bg-blue-50' },
    };

    const prioridades: Record<string, string> = {
      baja: 'border-l-gray-400',
      normal: 'border-l-blue-400',
      alta: 'border-l-yellow-400',
      urgente: 'border-l-red-400'
    };

    return {
      ...tipos[tipo] || tipos.sistema,
      borderColor: prioridades[prioridad] || prioridades.normal
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;