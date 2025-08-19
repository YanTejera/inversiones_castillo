import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  X, 
  Eye, 
  CheckCircle,
  RefreshCw 
} from 'lucide-react';
import { useNotificaciones } from '../hooks/useNotificaciones';

const NotificacionesBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notificaciones, 
    loading, 
    marcarAlertaLeida, 
    marcarAlertaResuelta,
    generarAlertas 
  } = useNotificaciones();

  const alertasActivas = notificaciones.alertas.filter(alerta => alerta.estado === 'activa');
  const totalAlertas = alertasActivas.length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoAlertaIcon = (tipo: string) => {
    switch (tipo) {
      case 'vencida':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'proximo_vencer':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'multiple_vencidas':
        return <AlertTriangle className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTipoAlertaColor = (tipo: string) => {
    switch (tipo) {
      case 'vencida':
        return 'border-l-red-500 bg-red-50';
      case 'proximo_vencer':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'multiple_vencidas':
        return 'border-l-purple-500 bg-purple-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
      >
        <Bell className="h-6 w-6" />
        {totalAlertas > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full animate-pulse">
            {totalAlertas > 9 ? '9+' : totalAlertas}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Notificaciones
                {totalAlertas > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {totalAlertas}
                  </span>
                )}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={generarAlertas}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Generar alertas automáticas"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Cargando notificaciones...</p>
                </div>
              ) : alertasActivas.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay alertas</h3>
                  <p className="text-sm text-gray-500">
                    Todas las notificaciones están al día.
                  </p>
                  <Link
                    to="/cobros"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Ver panel de cobros
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {alertasActivas.map((alerta) => (
                    <div 
                      key={alerta.id} 
                      className={`p-4 border-l-4 ${getTipoAlertaColor(alerta.tipo_alerta)} hover:bg-gray-50`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          {getTipoAlertaIcon(alerta.tipo_alerta)}
                        </div>
                        
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium">
                            {alerta.tipo_alerta === 'vencida' && 'Cuota Vencida'}
                            {alerta.tipo_alerta === 'proximo_vencer' && 'Próxima a Vencer'}
                            {alerta.tipo_alerta === 'multiple_vencidas' && 'Múltiples Vencidas'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 break-words">
                            {alerta.mensaje}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(alerta.fecha_creacion)}
                          </p>
                        </div>
                        
                        <div className="ml-3 flex-shrink-0 flex space-x-1">
                          <button
                            onClick={() => marcarAlertaLeida(alerta.id)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Marcar como leída"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => marcarAlertaResuelta(alerta.id)}
                            className="p-1 text-gray-400 hover:text-green-600"
                            title="Marcar como resuelta"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {alertasActivas.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {totalAlertas} alerta{totalAlertas !== 1 ? 's' : ''} activa{totalAlertas !== 1 ? 's' : ''}
                  </span>
                  <Link
                    to="/cobros"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    onClick={() => setIsOpen(false)}
                  >
                    Ver todas →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificacionesBell;