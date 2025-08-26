import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotificationsSimple';
import { colors } from '../../styles/colors';
import NotificationPreferences from './NotificationPreferences';

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'todas' | 'no-leidas'>('no-leidas');
  const [showPreferences, setShowPreferences] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    resumen,
    notificaciones,
    loading,
    cargarNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    obtenerEstiloNotificacion,
    eliminarNotificacion
  } = useNotifications();

  // Filtrar notificaciones según la pestaña activa
  const notificacionesFiltradas = notificaciones.filter(notif => 
    activeTab === 'no-leidas' ? !notif.leida : true
  );

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Cargar notificaciones al abrir
      cargarNotificaciones({ leidas: activeTab === 'todas' ? undefined : false });
    }
  };

  const handleTabChange = (tab: 'todas' | 'no-leidas') => {
    setActiveTab(tab);
    cargarNotificaciones({ leidas: tab === 'todas' ? undefined : false });
  };

  const handleMarcarLeida = async (id: number) => {
    await marcarComoLeida([id]);
  };

  const handleMarcarTodasLeidas = async () => {
    await marcarTodasComoLeidas();
    if (activeTab === 'no-leidas') {
      cargarNotificaciones({ leidas: false });
    }
  };

  const handleEliminar = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta notificación?')) {
      await eliminarNotificacion(id);
    }
  };

  const formatearTiempo = (fechaCreacion: string) => {
    const fecha = new Date(fechaCreacion);
    const ahora = new Date();
    const diff = ahora.getTime() - fecha.getTime();
    
    const minutos = Math.floor(diff / (1000 * 60));
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (dias > 0) return `${dias}d`;
    if (horas > 0) return `${horas}h`;
    if (minutos > 0) return `${minutos}m`;
    return 'Ahora';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botón de notificaciones */}
      <button
        onClick={handleToggleDropdown}
        className={`relative p-2 rounded-lg transition-colors ${
          isOpen 
            ? `${colors.background.primaryHover} ${colors.text.primary}` 
            : `hover:${colors.background.primaryHover} ${colors.text.secondary} hover:${colors.text.primary}`
        }`}
        title="Centro de notificaciones"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-3-3.5V9a6 6 0 10-12 0v4.5L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Badge con cantidad de no leídas */}
        {resumen && resumen.no_leidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {resumen.no_leidas > 99 ? '99+' : resumen.no_leidas}
          </span>
        )}
        
        {/* Badge urgente */}
        {resumen && resumen.urgentes > 0 && (
          <span className="absolute -bottom-1 -right-1 bg-orange-500 rounded-full h-2 w-2 animate-pulse"></span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-50 max-h-96" style={{ backgroundColor: 'rgba(255, 255, 255, 1)', borderColor: '#d1d5db', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)' }}>
          {/* Header */}
          <div className="p-4 border-b-2 border-gray-200" style={{ backgroundColor: '#f8fafc', borderBottomColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPreferences(true)}
                  className="p-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                  title="Preferencias de notificaciones"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                {resumen && resumen.no_leidas > 0 && (
                  <button
                    onClick={handleMarcarTodasLeidas}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>
            </div>

            {/* Pestañas */}
            <div className="flex space-x-1">
              <button
                onClick={() => handleTabChange('no-leidas')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  activeTab === 'no-leidas'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                No leídas {resumen && `(${resumen.no_leidas})`}
              </button>
              <button
                onClick={() => handleTabChange('todas')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  activeTab === 'todas'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                Todas {resumen && `(${resumen.total})`}
              </button>
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div style={{ maxHeight: '320px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
            {loading ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', backgroundColor: '#ffffff' }}>
                <div style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', height: '24px', width: '24px', borderBottom: '2px solid #3b82f6', margin: '0 auto' }}></div>
                <p style={{ marginTop: '8px', color: '#374151' }}>Cargando notificaciones...</p>
              </div>
            ) : notificacionesFiltradas.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', backgroundColor: '#ffffff' }}>
                <svg style={{ width: '48px', height: '48px', margin: '0 auto 8px', opacity: '0.5' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12" />
                </svg>
                <p style={{ color: '#374151' }}>No hay notificaciones {activeTab === 'no-leidas' ? 'sin leer' : ''}</p>
              </div>
            ) : (
              <div style={{ borderTop: '1px solid #e5e7eb' }}>
                {notificacionesFiltradas.map((notificacion) => {
                  const estilo = obtenerEstiloNotificacion(notificacion.tipo, notificacion.prioridad);
                  
                  return (
                    <div
                      key={notificacion.id}
                      style={{
                        padding: '16px',
                        backgroundColor: !notificacion.leida ? '#f0f9ff' : '#ffffff',
                        borderBottom: '1px solid #e5e7eb',
                        borderLeft: '4px solid',
                        borderLeftColor: estilo.borderColor === 'border-l-red-400' ? '#f87171' : 
                                       estilo.borderColor === 'border-l-yellow-400' ? '#fbbf24' :
                                       estilo.borderColor === 'border-l-blue-400' ? '#60a5fa' : '#9ca3af',
                        transition: 'background-color 0.15s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = !notificacion.leida ? '#e0f2fe' : '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = !notificacion.leida ? '#f0f9ff' : '#ffffff';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        {/* Icono */}
                        <div style={{
                          flexShrink: 0,
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: estilo.color.includes('red') ? '#fee2e2' :
                                         estilo.color.includes('yellow') ? '#fef3c7' :
                                         estilo.color.includes('green') ? '#d1fae5' :
                                         estilo.color.includes('blue') ? '#dbeafe' :
                                         estilo.color.includes('purple') ? '#ede9fe' :
                                         estilo.color.includes('orange') ? '#fed7aa' : '#f3f4f6',
                          color: estilo.color.includes('red') ? '#dc2626' :
                                estilo.color.includes('yellow') ? '#d97706' :
                                estilo.color.includes('green') ? '#16a34a' :
                                estilo.color.includes('blue') ? '#2563eb' :
                                estilo.color.includes('purple') ? '#7c3aed' :
                                estilo.color.includes('orange') ? '#ea580c' : '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px'
                        }}>
                          {estilo.icon}
                        </div>

                        {/* Contenido */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <h4 style={{
                              fontWeight: !notificacion.leida ? '600' : '500',
                              color: '#111827',
                              fontSize: '14px'
                            }}>
                              {notificacion.titulo}
                            </h4>
                            <span style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              flexShrink: 0
                            }}>
                              {formatearTiempo(notificacion.fecha_creacion)}
                            </span>
                          </div>
                          
                          <p style={{
                            fontSize: '13px',
                            color: '#374151',
                            marginBottom: '8px',
                            lineHeight: '1.4'
                          }}>
                            {notificacion.mensaje}
                          </p>

                          {/* Metadatos */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: estilo.color.includes('red') ? '#dc2626' :
                                               estilo.color.includes('yellow') ? '#d97706' :
                                               estilo.color.includes('green') ? '#16a34a' :
                                               estilo.color.includes('blue') ? '#2563eb' :
                                               estilo.color.includes('purple') ? '#7c3aed' :
                                               estilo.color.includes('orange') ? '#ea580c' : '#6b7280',
                                color: '#ffffff'
                              }}>
                                {notificacion.tipo_display || notificacion.tipo}
                              </span>
                              {notificacion.prioridad !== 'normal' && (
                                <span style={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: notificacion.prioridad === 'urgente' ? '#fecaca' :
                                                 notificacion.prioridad === 'alta' ? '#fed7aa' : '#f3f4f6',
                                  color: notificacion.prioridad === 'urgente' ? '#dc2626' :
                                        notificacion.prioridad === 'alta' ? '#d97706' : '#374151'
                                }}>
                                  {notificacion.prioridad_display || notificacion.prioridad}
                                </span>
                              )}
                            </div>

                            {/* Acciones */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {!notificacion.leida && (
                                <button
                                  onClick={() => handleMarcarLeida(notificacion.id)}
                                  style={{
                                    padding: '4px',
                                    fontSize: '12px',
                                    color: '#2563eb',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'color 0.15s ease-in-out'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = '#1d4ed8'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = '#2563eb'; }}
                                  title="Marcar como leída"
                                >
                                  <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => handleEliminar(notificacion.id)}
                                style={{
                                  padding: '4px',
                                  fontSize: '12px',
                                  color: '#6b7280',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'color 0.15s ease-in-out'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
                                title="Eliminar notificación"
                              >
                                <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notificacionesFiltradas.length > 0 && (
            <div style={{
              padding: '12px',
              borderTop: '2px solid #e2e8f0',
              textAlign: 'center',
              backgroundColor: '#ffffff'
            }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Aquí podrías navegar a una página completa de notificaciones
                }}
                style={{
                  fontSize: '14px',
                  color: '#2563eb',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease-in-out'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#1d4ed8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#2563eb'; }}
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preferences Modal */}
      <NotificationPreferences 
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </div>
  );
}