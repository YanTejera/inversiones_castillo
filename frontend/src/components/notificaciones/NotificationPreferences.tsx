import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotificationsSimple';
import { colors } from '../../styles/colors';

interface NotificationPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPreferences({ isOpen, onClose }: NotificationPreferencesProps) {
  // Temporarily simplified - preferencias functionality not available in simple hook
  const { loading, error } = useNotifications();

  const [formData, setFormData] = useState({
    // Tipos de notificaciones
    pago_vencido: false,
    pago_proximo: false,
    nueva_venta: false,
    pago_recibido: false,
    stock_bajo: false,
    nueva_moto: false,
    cliente_nuevo: false,
    venta_cancelada: false,
    sistema: false,
    recordatorio: false,
    
    // Canales de notificación
    mostrar_en_app: true,
    enviar_push: false,
    enviar_email: false,
  });

  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (isOpen) {
      // Verificar soporte para push notifications
      setPushSupported('Notification' in window && 'serviceWorker' in navigator);
      if ('Notification' in window) {
        setPushPermission(Notification.permission);
      }
    }
  }, [isOpen]);

  const handleChange = (field: keyof typeof formData) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = async () => {
    // Temporarily simplified - will show alert instead of saving to backend
    alert('Preferencias guardadas localmente (funcionalidad completa próximamente)');
    onClose();
  };

  const handlePushToggle = async () => {
    if (!pushSupported) return;

    if (!formData.enviar_push) {
      // Request permission
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setFormData(prev => ({ ...prev, enviar_push: true }));
          setPushPermission('granted');
          alert('Notificaciones push activadas');
        }
      } catch (err) {
        console.error('Error requesting permission:', err);
      }
    } else {
      // Disable push notifications
      setFormData(prev => ({ ...prev, enviar_push: false }));
      alert('Notificaciones push desactivadas');
    }
  };

  const tiposNotificacion = [
    {
      key: 'pago_vencido' as const,
      label: 'Pagos vencidos',
      description: 'Notificaciones cuando una cuota está vencida',
      icon: '⚠️',
      color: 'text-red-600'
    },
    {
      key: 'pago_proximo' as const,
      label: 'Próximos pagos',
      description: 'Recordatorios de cuotas próximas a vencer',
      icon: '⏰',
      color: 'text-yellow-600'
    },
    {
      key: 'nueva_venta' as const,
      label: 'Nuevas ventas',
      description: 'Notificaciones cuando se registra una venta',
      icon: '💰',
      color: 'text-green-600'
    },
    {
      key: 'pago_recibido' as const,
      label: 'Pagos recibidos',
      description: 'Confirmaciones de pagos realizados',
      icon: '✅',
      color: 'text-green-600'
    },
    {
      key: 'stock_bajo' as const,
      label: 'Stock bajo',
      description: 'Alertas cuando el inventario está bajo',
      icon: '📦',
      color: 'text-orange-600'
    },
    {
      key: 'nueva_moto' as const,
      label: 'Nuevas motocicletas',
      description: 'Notificaciones de nuevo inventario',
      icon: '🏍️',
      color: 'text-blue-600'
    },
    {
      key: 'cliente_nuevo' as const,
      label: 'Nuevos clientes',
      description: 'Notificaciones de clientes registrados',
      icon: '👤',
      color: 'text-purple-600'
    },
    {
      key: 'venta_cancelada' as const,
      label: 'Ventas canceladas',
      description: 'Notificaciones de ventas canceladas',
      icon: '❌',
      color: 'text-red-600'
    },
    {
      key: 'sistema' as const,
      label: 'Sistema',
      description: 'Notificaciones del sistema y mantenimiento',
      icon: '⚙️',
      color: 'text-gray-600'
    },
    {
      key: 'recordatorio' as const,
      label: 'Recordatorios',
      description: 'Recordatorios y tareas pendientes',
      icon: '🔔',
      color: 'text-blue-600'
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 ${colors.border.light} border-b`}>
          <h2 className={`text-lg font-semibold ${colors.text.primary}`}>
            Preferencias de Notificaciones
          </h2>
          <button
            onClick={onClose}
            className={`${colors.text.secondary} hover:${colors.text.primary} transition-colors`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-6">
          {/* Canales de notificación */}
          <div>
            <h3 className={`text-md font-medium ${colors.text.primary} mb-3`}>
              Canales de Notificación
            </h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.mostrar_en_app}
                  onChange={() => handleChange('mostrar_en_app')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className={`text-sm font-medium ${colors.text.primary}`}>
                    Mostrar en la aplicación
                  </div>
                  <div className={`text-sm ${colors.text.secondary}`}>
                    Mostrar notificaciones en el centro de notificaciones
                  </div>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.enviar_push}
                  onChange={handlePushToggle}
                  disabled={!pushSupported || loading}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <div className="ml-3">
                  <div className={`text-sm font-medium ${colors.text.primary}`}>
                    Notificaciones Push
                    {!pushSupported && (
                      <span className={`ml-2 text-xs ${colors.text.tertiary}`}>
                        (No soportado)
                      </span>
                    )}
                  </div>
                  <div className={`text-sm ${colors.text.secondary}`}>
                    Recibir notificaciones en el navegador
                  </div>
                  {pushPermission === 'denied' && (
                    <div className="text-xs text-red-600 mt-1">
                      Permisos denegados. Actívalos desde la configuración del navegador.
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.enviar_email}
                  onChange={() => handleChange('enviar_email')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className={`text-sm font-medium ${colors.text.primary}`}>
                    Notificaciones por Email
                  </div>
                  <div className={`text-sm ${colors.text.secondary}`}>
                    Enviar notificaciones al correo electrónico
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Tipos de notificaciones */}
          <div>
            <h3 className={`text-md font-medium ${colors.text.primary} mb-3`}>
              Tipos de Notificaciones
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {tiposNotificacion.map((tipo) => (
                <label key={tipo.key} className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData[tipo.key]}
                    onChange={() => handleChange(tipo.key)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <div className={`flex items-center text-sm font-medium ${colors.text.primary}`}>
                      <span className="mr-2">{tipo.icon}</span>
                      {tipo.label}
                    </div>
                    <div className={`text-sm ${colors.text.secondary} mt-1`}>
                      {tipo.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium ${colors.text.secondary} ${colors.border.medium} border rounded-md hover:${colors.background.primaryHover} transition-colors`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white ${colors.background.accent} hover:${colors.background.accentHover} rounded-md transition-colors disabled:opacity-50`}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}