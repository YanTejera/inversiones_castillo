import { useState, useEffect, useCallback } from 'react';
import { cuotaService } from '../services/cuotaService';
import type { AlertaPago, ResumenCobros } from '../types';

interface NotificacionData {
  alertas: AlertaPago[];
  resumen: ResumenCobros | null;
  ultimaActualizacion: Date;
}

export const useNotificaciones = (intervaloMs: number = 60000) => { // 1 minuto por defecto
  const [notificaciones, setNotificaciones] = useState<NotificacionData>({
    alertas: [],
    resumen: null,
    ultimaActualizacion: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const cargarNotificaciones = useCallback(async () => {
    try {
      setError('');
      
      // Cargar alertas activas
      const alertasResponse = await cuotaService.getAlertas(1, undefined, undefined, true);
      
      // Cargar resumen de cobros
      const resumen = await cuotaService.getResumenCobros();
      
      setNotificaciones({
        alertas: alertasResponse.results,
        resumen,
        ultimaActualizacion: new Date()
      });
      
    } catch (error: any) {
      console.error('Error cargando notificaciones:', error);
      setError('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar inicialmente
  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  // Configurar intervalo de actualización
  useEffect(() => {
    const interval = setInterval(cargarNotificaciones, intervaloMs);
    return () => clearInterval(interval);
  }, [cargarNotificaciones, intervaloMs]);

  // Función para marcar alerta como leída
  const marcarAlertaLeida = useCallback(async (alertaId: number) => {
    try {
      await cuotaService.marcarAlertaLeida(alertaId);
      // Actualizar el estado local
      setNotificaciones(prev => ({
        ...prev,
        alertas: prev.alertas.map(alerta => 
          alerta.id === alertaId 
            ? { ...alerta, estado: 'leida' }
            : alerta
        )
      }));
    } catch (error) {
      console.error('Error marcando alerta como leída:', error);
    }
  }, []);

  // Función para marcar alerta como resuelta
  const marcarAlertaResuelta = useCallback(async (alertaId: number) => {
    try {
      await cuotaService.marcarAlertaResuelta(alertaId);
      // Remover del estado local
      setNotificaciones(prev => ({
        ...prev,
        alertas: prev.alertas.filter(alerta => alerta.id !== alertaId)
      }));
    } catch (error) {
      console.error('Error marcando alerta como resuelta:', error);
    }
  }, []);

  // Función para generar nuevas alertas
  const generarAlertas = useCallback(async () => {
    try {
      await cuotaService.generarAlertasAutomaticas();
      await cargarNotificaciones(); // Recargar después de generar
    } catch (error) {
      console.error('Error generando alertas:', error);
      setError('Error al generar alertas automáticas');
    }
  }, [cargarNotificaciones]);

  return {
    notificaciones,
    loading,
    error,
    cargarNotificaciones,
    marcarAlertaLeida,
    marcarAlertaResuelta,
    generarAlertas
  };
};