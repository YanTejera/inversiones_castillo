import React, { useState, useEffect, useCallback, useContext, createContext, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Interfaces simplificadas
interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  prioridad: string;
  leida: boolean;
  fecha_creacion: string;
  tiempo_transcurrido?: string;
}

interface NotificacionResumen {
  total: number;
  no_leidas: number;
  urgentes: number;
  por_tipo: Record<string, number>;
  recientes: Notificacion[];
}

interface NotificationContextType {
  // Estado
  notificaciones: Notificacion[];
  resumen: NotificacionResumen | null;
  loading: boolean;
  error: string | null;
  
  // Acciones básicas
  cargarNotificaciones: () => Promise<void>;
  cargarResumen: () => Promise<void>;
  marcarComoLeida: (ids: number[]) => Promise<void>;
  marcarTodasComoLeidas: () => Promise<void>;
  crearNotificacion: (titulo: string, mensaje: string, tipo?: string, prioridad?: string) => Promise<void>;
  eliminarNotificacion: (id: number) => Promise<void>;
  
  // Utilidades
  obtenerEstiloNotificacion: (tipo: string, prioridad: string) => { icon: string; color: string; borderColor: string };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

// Función helper para obtener estilos
const getNotificationStyle = (tipo: string, prioridad: string) => {
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
    media: 'border-l-blue-400',
    alta: 'border-l-yellow-400',
    urgente: 'border-l-red-400'
  };

  return {
    ...tipos[tipo] || tipos.sistema,
    borderColor: prioridades[prioridad] || prioridades.media
  };
};

// Get API base URL (same logic as api.ts)
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 
    (window.location.hostname.includes('onrender.com') 
      ? 'https://inversiones-castillo.onrender.com/api' 
      : 'http://localhost:8000/api');
};

// Función helper para hacer llamadas a la API
const apiCall = async (url: string, options?: RequestInit) => {
  const token = localStorage.getItem('token');
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      'Authorization': token ? `Token ${token}` : '',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { isAuthenticated } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [resumen, setResumen] = useState<NotificacionResumen | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar notificaciones
  const cargarNotificaciones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall('/notificaciones/');
      setNotificaciones(response.results || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar notificaciones');
      console.error('Error cargando notificaciones:', err);
      setNotificaciones([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar resumen
  const cargarResumen = useCallback(async () => {
    try {
      const resumenData = await apiCall('/notificaciones/resumen/');
      setResumen(resumenData);
    } catch (err: any) {
      console.error('Error cargando resumen:', err);
      // Set default values on error
      setResumen({
        total: 0,
        no_leidas: 0,
        urgentes: 0,
        por_tipo: {},
        recientes: []
      });
    }
  }, []);

  // Marcar como leída
  const marcarComoLeida = useCallback(async (ids: number[]) => {
    try {
      await apiCall('/notificaciones/marcar-leida/', {
        method: 'POST',
        body: JSON.stringify({ notificacion_ids: ids }),
      });
      
      // Actualizar estado local
      setNotificaciones(prev => 
        prev.map(notif => 
          ids.includes(notif.id) 
            ? { ...notif, leida: true }
            : notif
        )
      );
      
      // Actualizar resumen
      if (resumen) {
        setResumen(prev => prev ? {
          ...prev,
          no_leidas: Math.max(0, prev.no_leidas - ids.length)
        } : null);
      }
      
    } catch (err: any) {
      setError(err.message || 'Error al marcar como leída');
      console.error('Error marcando como leída:', err);
    }
  }, [resumen]);

  // Marcar todas como leídas
  const marcarTodasComoLeidas = useCallback(async () => {
    try {
      await apiCall('/notificaciones/marcar-todas-leidas/', {
        method: 'POST',
      });
      
      // Actualizar estado local
      setNotificaciones(prev => 
        prev.map(notif => ({ ...notif, leida: true }))
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
    prioridad: string = 'media'
  ) => {
    try {
      const nuevaNotificacion = await apiCall('/notificaciones/crear-rapida/', {
        method: 'POST',
        body: JSON.stringify({ titulo, mensaje, tipo, prioridad }),
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

  // Eliminar notificación
  const eliminarNotificacion = useCallback(async (id: number) => {
    try {
      await apiCall(`/notificaciones/${id}/`, {
        method: 'DELETE',
      });
      
      // Remover del estado local
      setNotificaciones(prev => prev.filter(notif => notif.id !== id));
      
      // Actualizar resumen
      cargarResumen();
      
    } catch (err: any) {
      setError(err.message || 'Error al eliminar notificación');
      console.error('Error eliminando notificación:', err);
    }
  }, [cargarResumen]);

  // Obtener estilo de notificación
  const obtenerEstiloNotificacion = useCallback((tipo: string, prioridad: string) => {
    return getNotificationStyle(tipo, prioridad);
  }, []);

  // Cargar datos cuando el usuario se autentica
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping notification loading');
      // Limpiar datos cuando no está autenticado
      setNotificaciones([]);
      setResumen(null);
      setError(null);
      return;
    }

    const loadData = async () => {
      try {
        await cargarResumen();
        await cargarNotificaciones();
      } catch (err) {
        console.error('Error inicial cargando notificaciones:', err);
        setError('Sistema de notificaciones no disponible');
      }
    };

    loadData();
  }, [isAuthenticated, cargarNotificaciones, cargarResumen]);

  const value: NotificationContextType = {
    // Estado
    notificaciones,
    resumen,
    loading,
    error,
    
    // Acciones
    cargarNotificaciones,
    cargarResumen,
    marcarComoLeida,
    marcarTodasComoLeidas,
    crearNotificacion,
    eliminarNotificacion,
    
    // Utilidades
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