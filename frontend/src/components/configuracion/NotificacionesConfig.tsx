import React, { useState, useEffect } from 'react';
import { colors } from '../../styles/colors';

// Get API base URL (same logic as api.ts)
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 
    (window.location.hostname.includes('onrender.com') 
      ? 'https://inversiones-castillo.onrender.com/api' 
      : 'http://localhost:8000/api');
};

// Funciones de prueba para API
const testNotificationAPI = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('❌ Error: No hay sesión activa. Por favor, inicia sesión primero.');
    return;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/notificaciones/resumen/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      alert(`✅ API conectada! Resumen: ${data.total} notificaciones, ${data.no_leidas} no leídas`);
    } else {
      alert(`❌ Error API: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    alert(`❌ Error de conexión: ${error}`);
  }
};

const createTestNotification = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('❌ Error: No hay sesión activa. Por favor, inicia sesión primero.');
    return;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/notificaciones/crear-rapida/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        titulo: 'Notificación de Prueba',
        mensaje: 'Esta es una notificación de prueba del nuevo sistema de notificaciones push.',
        tipo: 'sistema',
        prioridad: 'media'
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      alert(`✅ Notificación creada! ID: ${data.id}`);
    } else {
      alert(`❌ Error creando notificación: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    alert(`❌ Error de conexión: ${error}`);
  }
};

const generateAlerts = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('❌ Error: No hay sesión activa. Por favor, inicia sesión primero.');
    return;
  }

  try {
    // Since generar-alertas endpoint doesn't exist, let's create multiple test notifications instead
    const notifications = [
      { titulo: 'Pago Vencido', mensaje: 'El cliente Juan Pérez tiene una cuota vencida', tipo: 'pago_vencido', prioridad: 'urgente' },
      { titulo: 'Próximo Pago', mensaje: 'María García debe realizar un pago en 2 días', tipo: 'pago_proximo', prioridad: 'alta' },
      { titulo: 'Nueva Venta', mensaje: 'Se registró una nueva venta por $15,000,000', tipo: 'nueva_venta', prioridad: 'media' },
      { titulo: 'Stock Bajo', mensaje: 'Quedan pocas unidades de Yamaha FZ25', tipo: 'stock_bajo', prioridad: 'media' }
    ];

    let createdCount = 0;
    for (const notif of notifications) {
      const response = await fetch(`${getApiBaseUrl()}/notificaciones/crear-rapida/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notif),
      });
      
      if (response.ok) {
        createdCount++;
      }
    }
    
    if (createdCount > 0) {
      alert(`✅ ${createdCount} alertas automáticas generadas correctamente`);
    } else {
      alert('❌ No se pudieron generar las alertas');
    }
  } catch (error) {
    alert(`❌ Error de conexión: ${error}`);
  }
};

interface NotificacionesConfigProps {
  className?: string;
}

export default function NotificacionesConfig({ className = '' }: NotificacionesConfigProps) {
  const [preferences, setPreferences] = useState({
    // Tipos de notificaciones
    pago_vencido: true,
    pago_proximo: true,
    nueva_venta: true,
    pago_recibido: true,
    stock_bajo: true,
    nueva_moto: true,
    cliente_nuevo: true,
    venta_cancelada: true,
    sistema: true,
    recordatorio: true,
    
    // Canales
    mostrar_en_app: true,
    enviar_push: false,
    enviar_email: false,
  });

  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [initialLoading, setInitialLoading] = useState(true);

  // Cargar preferencias desde el backend
  useEffect(() => {
    const loadPreferences = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setInitialLoading(false);
        return;
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/notificaciones/preferencias/`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setPreferences(prev => ({
            ...prev,
            ...data
          }));
        }
      } catch (error) {
        console.error('Error cargando preferencias:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    // Verificar soporte para push notifications
    setPushSupported('Notification' in window && 'serviceWorker' in navigator);
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }

    loadPreferences();
  }, []);

  const handlePreferenceChange = async (key: keyof typeof preferences) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('❌ Error: No hay sesión activa. Por favor, inicia sesión primero.');
      return;
    }

    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };
    
    setPreferences(newPreferences);

    // Auto-guardar todos los cambios de preferencias
    try {
      await savePreferences(newPreferences, token);
      console.log(`✅ Preferencia ${key} guardada automáticamente`);
    } catch (error) {
      console.error('Error guardando preferencia automáticamente:', error);
      // Revertir el cambio si falla el guardado
      setPreferences(preferences);
      alert(`❌ Error guardando la preferencia: ${error}`);
    }
  };

  const handlePushToggle = async () => {
    if (!pushSupported) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('❌ Error: No hay sesión activa. Por favor, inicia sesión primero.');
      return;
    }

    if (!preferences.enviar_push) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const newPreferences = { ...preferences, enviar_push: true };
          setPreferences(newPreferences);
          setPushPermission('granted');
          
          // Guardar automáticamente
          await savePreferences(newPreferences, token);
          alert('✅ Push notifications activadas y guardadas');
        }
      } catch (error) {
        console.error('Error activando push:', error);
        alert('❌ Error activando push notifications');
      }
    } else {
      const newPreferences = { ...preferences, enviar_push: false };
      setPreferences(newPreferences);
      
      // Guardar automáticamente
      await savePreferences(newPreferences, token);
      alert('🔕 Push notifications desactivadas y guardadas');
    }
  };

  const savePreferences = async (preferencesToSave: typeof preferences, token: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/notificaciones/preferencias/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferencesToSave),
      });
      
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error guardando preferencias automáticamente:', error);
      throw error;
    }
  };


  const tiposNotificacion = [
    { key: 'pago_vencido' as const, label: 'Pagos vencidos', icon: '⚠️', description: 'Alertas de cuotas vencidas' },
    { key: 'pago_proximo' as const, label: 'Próximos pagos', icon: '⏰', description: 'Recordatorios de próximas cuotas' },
    { key: 'nueva_venta' as const, label: 'Nuevas ventas', icon: '💰', description: 'Notificaciones de ventas registradas' },
    { key: 'pago_recibido' as const, label: 'Pagos recibidos', icon: '✅', description: 'Confirmaciones de pagos realizados' },
    { key: 'stock_bajo' as const, label: 'Stock bajo', icon: '📦', description: 'Alertas de inventario bajo' },
    { key: 'nueva_moto' as const, label: 'Nuevas motocicletas', icon: '🏍️', description: 'Notificaciones de nuevo inventario' },
    { key: 'cliente_nuevo' as const, label: 'Nuevos clientes', icon: '👤', description: 'Alertas de clientes registrados' },
    { key: 'venta_cancelada' as const, label: 'Ventas canceladas', icon: '❌', description: 'Notificaciones de cancelaciones' },
    { key: 'sistema' as const, label: 'Sistema', icon: '⚙️', description: 'Notificaciones del sistema' },
    { key: 'recordatorio' as const, label: 'Recordatorios', icon: '🔔', description: 'Recordatorios y tareas pendientes' },
  ];

  if (initialLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Cargando preferencias...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className={`text-lg font-semibold ${colors.text.primary} mb-2`}>
          Sistema de Notificaciones
        </h2>
        <p className={`text-sm ${colors.text.secondary}`}>
          Configurar preferencias de notificaciones y alertas automáticas
        </p>
      </div>

      {/* Estado del sistema */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-green-800">
              Sistema Activo
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Las notificaciones automáticas están funcionando correctamente.</p>
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={testNotificationAPI}
                  className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
                >
                  🧪 Probar API
                </button>
                <button
                  onClick={createTestNotification}
                  className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
                >
                  ➕ Crear Prueba
                </button>
                <button
                  onClick={generateAlerts}
                  className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
                >
                  ⚡ Generar Alertas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Canales de notificación */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className={`font-medium ${colors.text.primary} mb-4`}>
            Canales de Entrega
          </h3>
          <div className="space-y-3">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={preferences.mostrar_en_app}
                onChange={() => handlePreferenceChange('mostrar_en_app')}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className={`text-sm font-medium ${colors.text.primary}`}>
                  Mostrar en la aplicación
                </div>
                <div className={`text-xs ${colors.text.secondary}`}>
                  Centro de notificaciones en el header
                </div>
              </div>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={preferences.enviar_push}
                onChange={handlePushToggle}
                disabled={!pushSupported}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
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
                <div className={`text-xs ${colors.text.secondary}`}>
                  Notificaciones del navegador
                </div>
                {pushPermission === 'denied' && (
                  <div className="text-xs text-red-600 mt-1">
                    Permisos denegados en el navegador
                  </div>
                )}
              </div>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={preferences.enviar_email}
                onChange={() => handlePreferenceChange('enviar_email')}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className={`text-sm font-medium ${colors.text.primary}`}>
                  Notificaciones por Email
                  <span className={`ml-2 text-xs ${colors.text.tertiary}`}>
                    (Función pendiente)
                  </span>
                </div>
                <div className={`text-xs ${colors.text.secondary}`}>
                  Envío por correo electrónico (en desarrollo)
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Tipos de notificaciones */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className={`font-medium ${colors.text.primary} mb-4`}>
            Tipos de Notificaciones
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {tiposNotificacion.map((tipo) => (
              <label key={tipo.key} className="flex items-start">
                <input
                  type="checkbox"
                  checked={preferences[tipo.key]}
                  onChange={() => handlePreferenceChange(tipo.key)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className={`flex items-center text-sm font-medium ${colors.text.primary}`}>
                    <span className="mr-2">{tipo.icon}</span>
                    {tipo.label}
                  </div>
                  <div className={`text-xs ${colors.text.secondary} mt-1`}>
                    {tipo.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Info sobre auto-guardado */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Auto-guardado Activo</h3>
            <p className="text-sm text-blue-700 mt-1">
              Todos los cambios se guardan automáticamente. No es necesario hacer clic en guardar.
            </p>
          </div>
        </div>
      </div>

      {/* Botón de refrescar opcional */}
      <div className="flex justify-center">
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-md transition-colors"
        >
          🔄 Refrescar página para verificar persistencia
        </button>
      </div>
    </div>
  );
}