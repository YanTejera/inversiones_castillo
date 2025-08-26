import React, { useState, useEffect, useCallback, useContext, createContext, ReactNode } from 'react';
import { notificationService, Notificacion, NotificacionResumen, PreferenciaNotificacion } from '../services/notificationService';

interface NotificationContextType {
  // Estado
  notificaciones: Notificacion[];
  resumen: NotificacionResumen | null;
  preferencias: PreferenciaNotificacion | null;
  loading: boolean;
  error: string | null;
  
  // Acciones
  cargarNotificaciones: (filtros?: { leidas?: boolean; tipo?: string; prioridad?: string }) => Promise<void>;
  cargarResumen: () => Promise<void>;
  cargarPreferencias: () => Promise<void>;
  marcarComoLeida: (ids: number[]) => Promise<void>;
  marcarTodasComoLeidas: () => Promise<void>;
  crearNotificacion: (titulo: string, mensaje: string, tipo?: string, prioridad?: string) => Promise<void>;
  actualizarPreferencias: (preferencias: Partial<PreferenciaNotificacion>) => Promise<void>;
  eliminarNotificacion: (id: number) => Promise<void>;
  
  // Web Push
  solicitarPermisoNotificaciones: () => Promise<boolean>;
  suscribirsePush: () => Promise<boolean>;
  desuscribirsePush: () => Promise<void>;
  
  // Utilidades
  mostrarNotificacionLocal: (titulo: string, mensaje: string, tipo?: string) => void;
  obtenerEstiloNotificacion: (tipo: string, prioridad: string) => { icon: string; color: string; borderColor: string };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [resumen, setResumen] = useState<NotificacionResumen | null>(null);
  const [preferencias, setPreferencias] = useState<PreferenciaNotificacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar notificaciones
  const cargarNotificaciones = useCallback(async (filtros?: { leidas?: boolean; tipo?: string; prioridad?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.getNotificaciones(filtros);
      setNotificaciones(response.results);
    } catch (err: any) {
      setError(err.message || 'Error al cargar notificaciones');
      console.error('Error cargando notificaciones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar resumen
  const cargarResumen = useCallback(async () => {
    try {
      const resumenData = await notificationService.getResumen();
      setResumen(resumenData);
    } catch (err: any) {
      console.error('Error cargando resumen:', err);
    }
  }, []);

  // Cargar preferencias
  const cargarPreferencias = useCallback(async () => {
    try {
      const preferenciasData = await notificationService.getPreferencias();
      setPreferencias(preferenciasData);
    } catch (err: any) {
      console.error('Error cargando preferencias:', err);
    }
  }, []);

  // Marcar como leída
  const marcarComoLeida = useCallback(async (ids: number[]) => {
    try {
      await notificationService.marcarLeida(ids);
      
      // Actualizar estado local
      setNotificaciones(prev => 
        prev.map(notif => 
          ids.includes(notif.id) 
            ? { ...notif, leida: true, fecha_leida: new Date().toISOString() }
            : notif
        )
      );
      
      // Actualizar resumen
      if (resumen) {
        setResumen(prev => prev ? {
          ...prev,
          no_leidas: Math.max(0, prev.no_leidas - ids.length),
          urgentes: Math.max(0, prev.urgentes - ids.filter(id => {
            const notif = notificaciones.find(n => n.id === id);
            return notif?.es_urgente && !notif.leida;
          }).length)
        } : null);
      }
      
    } catch (err: any) {
      setError(err.message || 'Error al marcar como leída');
      console.error('Error marcando como leída:', err);
    }
  }, [notificaciones, resumen]);

  // Marcar todas como leídas
  const marcarTodasComoLeidas = useCallback(async () => {
    try {
      await notificationService.marcarTodasLeidas();
      
      // Actualizar estado local
      setNotificaciones(prev => 
        prev.map(notif => ({ 
          ...notif, 
          leida: true, 
          fecha_leida: new Date().toISOString() 
        }))
      );
      
      // Actualizar resumen
      setResumen(prev => prev ? {
        ...prev,
        no_leidas: 0,
        urgentes: 0
      } : null);
      
    } catch (err: any) {
      setError(err.message || 'Error al marcar todas como leídas');
      console.error('Error marcando todas como leídas:', err);
    }
  }, []);

  // Crear notificación
  const crearNotificacion = useCallback(async (
    titulo: string, 
    mensaje: string, 
    tipo: string = 'sistema', 
    prioridad: string = 'normal'
  ) => {
    try {
      const nuevaNotificacion = await notificationService.crearNotificacionRapida({
        titulo,
        mensaje,
        tipo,
        prioridad
      });
      
      // Agregar al estado local
      setNotificaciones(prev => [nuevaNotificacion, ...prev]);
      
      // Actualizar resumen
      cargarResumen();
      
    } catch (err: any) {
      setError(err.message || 'Error al crear notificación');
      console.error('Error creando notificación:', err);
    }
  }, [cargarResumen]);

  // Actualizar preferencias
  const actualizarPreferencias = useCallback(async (nuevasPreferencias: Partial<PreferenciaNotificacion>) => {
    try {
      const preferenciasActualizadas = await notificationService.actualizarPreferencias(nuevasPreferencias);
      setPreferencias(preferenciasActualizadas);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar preferencias');
      console.error('Error actualizando preferencias:', err);
    }
  }, []);

  // Eliminar notificación
  const eliminarNotificacion = useCallback(async (id: number) => {
    try {
      await notificationService.eliminarNotificacion(id);
      
      // Remover del estado local
      setNotificaciones(prev => prev.filter(notif => notif.id !== id));
      
      // Actualizar resumen
      cargarResumen();
      
    } catch (err: any) {
      setError(err.message || 'Error al eliminar notificación');
      console.error('Error eliminando notificación:', err);
    }
  }, [cargarResumen]);

  // Solicitar permiso para notificaciones
  const solicitarPermisoNotificaciones = useCallback(async (): Promise<boolean> => {
    try {
      const permission = await notificationService.requestNotificationPermission();
      return permission === 'granted';
    } catch (err: any) {
      console.error('Error solicitando permiso:', err);
      return false;
    }
  }, []);

  // Suscribirse a push notifications
  const suscribirsePush = useCallback(async (): Promise<boolean> => {
    try {
      const subscription = await notificationService.subscribeToPush();
      if (subscription) {
        // Actualizar preferencias para reflejar la suscripción
        await cargarPreferencias();
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || 'Error al suscribirse a push notifications');
      console.error('Error suscribiéndose a push:', err);
      return false;
    }
  }, [cargarPreferencias]);

  // Desuscribirse de push notifications
  const desuscribirsePush = useCallback(async () => {
    try {
      await notificationService.desuscribirPush();
      await cargarPreferencias();
    } catch (err: any) {
      setError(err.message || 'Error al desuscribirse');
      console.error('Error desuscribiéndose:', err);
    }
  }, [cargarPreferencias]);

  // Mostrar notificación local
  const mostrarNotificacionLocal = useCallback((titulo: string, mensaje: string, tipo: string = 'sistema') => {
    const style = notificationService.getNotificationStyle(tipo, 'normal');
    
    notificationService.showLocalNotification(titulo, {
      body: mensaje,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `notification-${Date.now()}`,
      requireInteraction: tipo === 'pago_vencido' || tipo === 'urgente'
    });
  }, []);

  // Obtener estilo de notificación
  const obtenerEstiloNotificacion = useCallback((tipo: string, prioridad: string) => {
    return notificationService.getNotificationStyle(tipo, prioridad);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    // Evitar cargar datos si estamos en modo de desarrollo y el backend no está disponible
    const loadData = async () => {
      try {
        await cargarNotificaciones();
        await cargarResumen();
        await cargarPreferencias();
      } catch (err) {
        console.error('Error inicial cargando notificaciones:', err);
        setError('Sistema de notificaciones no disponible');
      }
    };

    loadData();
  }, [cargarNotificaciones, cargarResumen, cargarPreferencias]);

  // Polling para actualizaciones (cada 2 minutos)
  useEffect(() => {
    const interval = setInterval(() => {
      cargarResumen();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [cargarResumen]);

  const value: NotificationContextType = {
    // Estado
    notificaciones,
    resumen,
    preferencias,
    loading,
    error,
    
    // Acciones
    cargarNotificaciones,
    cargarResumen,
    cargarPreferencias,
    marcarComoLeida,
    marcarTodasComoLeidas,
    crearNotificacion,
    actualizarPreferencias,
    eliminarNotificacion,
    
    // Web Push
    solicitarPermisoNotificaciones,
    suscribirsePush,
    desuscribirsePush,
    
    // Utilidades
    mostrarNotificacionLocal,
    obtenerEstiloNotificacion,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications debe ser usado dentro de un NotificationProvider');
  }
  return context;
}