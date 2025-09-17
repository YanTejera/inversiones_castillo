import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mail,
  Phone,
  MessageCircle,
  Send,
  Settings,
  Key,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  TestTube,
  RefreshCw,
  Shield,
  Server,
  Zap
} from 'lucide-react';
import { useToast } from '../Toast';

interface ConfiguracionComunicacion {
  // Información de la empresa
  empresa: {
    nombre: string;
    email_principal: string;
    telefono_principal: string;
    whatsapp_principal: string;
    direccion: string;
    sitio_web: string;
    logo_url: string;
  };

  // Configuración Email
  email: {
    habilitado: boolean;
    servidor_smtp: string;
    puerto_smtp: number;
    usuario_smtp: string;
    password_smtp: string;
    usar_tls: boolean;
    nombre_remitente: string;
    email_remitente: string;
    email_respuesta: string;
    limite_diario: number;
  };

  // Configuración WhatsApp
  whatsapp: {
    habilitado: boolean;
    tipo_api: 'whatsapp_business' | 'twilio' | 'chatapi' | 'otro';
    api_url: string;
    token_acceso: string;
    numero_telefono: string;
    id_telefono: string;
    webhook_url: string;
    webhook_token: string;
    limite_diario: number;
  };

  // Configuración SMS
  sms: {
    habilitado: boolean;
    proveedor: 'twilio' | 'nexmo' | 'clicksend' | 'otro';
    api_key: string;
    api_secret: string;
    numero_remitente: string;
    limite_diario: number;
  };

  // Configuración Telegram
  telegram: {
    habilitado: boolean;
    bot_token: string;
    nombre_bot: string;
    username_bot: string;
    canal_id: string;
    grupo_id: string;
    webhook_url: string;
  };
}

const ComunicacionesConfig: React.FC = () => {
  const { success, error: showError, warning, info, ToastContainer } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const [config, setConfig] = useState<ConfiguracionComunicacion>({
    empresa: {
      nombre: 'Inversiones C&C',
      email_principal: 'info@inversionescc.com',
      telefono_principal: '809-555-0100',
      whatsapp_principal: '18095550100',
      direccion: 'Santo Domingo, República Dominicana',
      sitio_web: 'https://inversionescc.com',
      logo_url: '/logo.png'
    },
    email: {
      habilitado: true,
      servidor_smtp: 'smtp.gmail.com',
      puerto_smtp: 587,
      usuario_smtp: 'marketing@inversionescc.com',
      password_smtp: '',
      usar_tls: true,
      nombre_remitente: 'Inversiones C&C',
      email_remitente: 'marketing@inversionescc.com',
      email_respuesta: 'info@inversionescc.com',
      limite_diario: 500
    },
    whatsapp: {
      habilitado: true,
      tipo_api: 'whatsapp_business',
      api_url: 'https://graph.facebook.com/v18.0',
      token_acceso: '',
      numero_telefono: '18095550100',
      id_telefono: '',
      webhook_url: '',
      webhook_token: '',
      limite_diario: 1000
    },
    sms: {
      habilitado: false,
      proveedor: 'twilio',
      api_key: '',
      api_secret: '',
      numero_remitente: '',
      limite_diario: 100
    },
    telegram: {
      habilitado: false,
      bot_token: '',
      nombre_bot: '',
      username_bot: '',
      canal_id: '',
      grupo_id: '',
      webhook_url: ''
    }
  });

  useEffect(() => {
    loadConfiguracion();
  }, []);

  const loadConfiguracion = async () => {
    try {
      setLoading(true);
      // Aquí iría la llamada real a la API para cargar la configuración
      // const response = await configuracionService.getComunicaciones();
      // setConfig(response.data);
    } catch (err: any) {
      showError(err.message || 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validaciones básicas
      if (!config.empresa.nombre.trim()) {
        showError('El nombre de la empresa es requerido');
        return;
      }

      if (config.email.habilitado && !config.email.servidor_smtp.trim()) {
        showError('El servidor SMTP es requerido para email');
        return;
      }

      if (config.whatsapp.habilitado && !config.whatsapp.token_acceso.trim()) {
        showError('El token de acceso es requerido para WhatsApp');
        return;
      }

      // Aquí iría la llamada real a la API
      // await configuracionService.updateComunicaciones(config);

      success('Configuración guardada correctamente');
    } catch (err: any) {
      showError(err.message || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (canal: string) => {
    try {
      setTesting(canal);

      // Aquí iría la llamada real para probar el canal
      // await comunicacionService.testCanal(canal, config);

      // Simular prueba
      await new Promise(resolve => setTimeout(resolve, 2000));

      success(`Prueba de ${canal} exitosa`);
    } catch (err: any) {
      showError(`Error en prueba de ${canal}: ${err.message}`);
    } finally {
      setTesting(null);
    }
  };

  const updateEmpresa = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      empresa: {
        ...prev.empresa,
        [field]: value
      }
    }));
  };

  const updateEmail = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [field]: value
      }
    }));
  };

  const updateWhatsApp = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      whatsapp: {
        ...prev.whatsapp,
        [field]: value
      }
    }));
  };

  const updateSMS = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      sms: {
        ...prev.sms,
        [field]: value
      }
    }));
  };

  const updateTelegram = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      telegram: {
        ...prev.telegram,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <MessageSquare className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Configuración de Comunicaciones
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {showPasswords ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPasswords ? 'Ocultar' : 'Mostrar'} Credenciales
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Configuración
          </button>
        </div>
      </div>

      {/* Información de la Empresa */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Globe className="h-5 w-5 mr-2 text-green-600" />
          Información de la Empresa
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre de la Empresa
            </label>
            <input
              type="text"
              value={config.empresa.nombre}
              onChange={(e) => updateEmpresa('nombre', e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Nombre completo de la empresa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Principal
            </label>
            <input
              type="email"
              value={config.empresa.email_principal}
              onChange={(e) => updateEmpresa('email_principal', e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="info@empresa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Teléfono Principal
            </label>
            <input
              type="tel"
              value={config.empresa.telefono_principal}
              onChange={(e) => updateEmpresa('telefono_principal', e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="809-555-0100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              WhatsApp Principal
            </label>
            <input
              type="tel"
              value={config.empresa.whatsapp_principal}
              onChange={(e) => updateEmpresa('whatsapp_principal', e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="18095550100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={config.empresa.direccion}
              onChange={(e) => updateEmpresa('direccion', e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Dirección completa de la empresa"
            />
          </div>
        </div>
      </div>

      {/* Configuración Email */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Mail className="h-5 w-5 mr-2 text-blue-600" />
            Configuración de Email
          </h3>

          <div className="flex items-center gap-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.email.habilitado}
                onChange={(e) => updateEmail('habilitado', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Habilitado</span>
            </label>

            <button
              onClick={() => handleTest('email')}
              disabled={!config.email.habilitado || testing === 'email'}
              className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 disabled:opacity-50"
            >
              {testing === 'email' ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-1" />
              )}
              Probar
            </button>
          </div>
        </div>

        {config.email.habilitado && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Servidor SMTP
              </label>
              <input
                type="text"
                value={config.email.servidor_smtp}
                onChange={(e) => updateEmail('servidor_smtp', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="smtp.gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Puerto
              </label>
              <input
                type="number"
                value={config.email.puerto_smtp}
                onChange={(e) => updateEmail('puerto_smtp', parseInt(e.target.value))}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="587"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Usuario SMTP
              </label>
              <input
                type="email"
                value={config.email.usuario_smtp}
                onChange={(e) => updateEmail('usuario_smtp', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="usuario@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña SMTP
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={config.email.password_smtp}
                onChange={(e) => updateEmail('password_smtp', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del Remitente
              </label>
              <input
                type="text"
                value={config.email.nombre_remitente}
                onChange={(e) => updateEmail('nombre_remitente', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Inversiones C&C"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email de Respuesta
              </label>
              <input
                type="email"
                value={config.email.email_respuesta}
                onChange={(e) => updateEmail('email_respuesta', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="respuesta@empresa.com"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.email.usar_tls}
                  onChange={(e) => updateEmail('usar_tls', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Usar TLS/SSL</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Límite Diario
              </label>
              <input
                type="number"
                value={config.email.limite_diario}
                onChange={(e) => updateEmail('limite_diario', parseInt(e.target.value))}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Configuración WhatsApp */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <MessageCircle className="h-5 w-5 mr-2 text-green-600" />
            Configuración de WhatsApp
          </h3>

          <div className="flex items-center gap-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.whatsapp.habilitado}
                onChange={(e) => updateWhatsApp('habilitado', e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Habilitado</span>
            </label>

            <button
              onClick={() => handleTest('whatsapp')}
              disabled={!config.whatsapp.habilitado || testing === 'whatsapp'}
              className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 disabled:opacity-50"
            >
              {testing === 'whatsapp' ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-1" />
              )}
              Probar
            </button>
          </div>
        </div>

        {config.whatsapp.habilitado && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de API
              </label>
              <select
                value={config.whatsapp.tipo_api}
                onChange={(e) => updateWhatsApp('tipo_api', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="whatsapp_business">WhatsApp Business API</option>
                <option value="twilio">Twilio</option>
                <option value="chatapi">ChatAPI</option>
                <option value="otro">Otro proveedor</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL de la API
                </label>
                <input
                  type="url"
                  value={config.whatsapp.api_url}
                  onChange={(e) => updateWhatsApp('api_url', e.target.value)}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://graph.facebook.com/v18.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Token de Acceso
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={config.whatsapp.token_acceso}
                  onChange={(e) => updateWhatsApp('token_acceso', e.target.value)}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número de Teléfono
                </label>
                <input
                  type="tel"
                  value={config.whatsapp.numero_telefono}
                  onChange={(e) => updateWhatsApp('numero_telefono', e.target.value)}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="18095550100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID del Teléfono
                </label>
                <input
                  type="text"
                  value={config.whatsapp.id_telefono}
                  onChange={(e) => updateWhatsApp('id_telefono', e.target.value)}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="ID del teléfono de WhatsApp Business"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Límite Diario
                </label>
                <input
                  type="number"
                  value={config.whatsapp.limite_diario}
                  onChange={(e) => updateWhatsApp('limite_diario', parseInt(e.target.value))}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="1000"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configuración SMS */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Phone className="h-5 w-5 mr-2 text-purple-600" />
            Configuración de SMS
          </h3>

          <div className="flex items-center gap-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.sms.habilitado}
                onChange={(e) => updateSMS('habilitado', e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Habilitado</span>
            </label>

            <button
              onClick={() => handleTest('sms')}
              disabled={!config.sms.habilitado || testing === 'sms'}
              className="flex items-center px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 disabled:opacity-50"
            >
              {testing === 'sms' ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-1" />
              )}
              Probar
            </button>
          </div>
        </div>

        {config.sms.habilitado && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Proveedor
              </label>
              <select
                value={config.sms.proveedor}
                onChange={(e) => updateSMS('proveedor', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="twilio">Twilio</option>
                <option value="nexmo">Vonage (Nexmo)</option>
                <option value="clicksend">ClickSend</option>
                <option value="otro">Otro proveedor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número Remitente
              </label>
              <input
                type="tel"
                value={config.sms.numero_remitente}
                onChange={(e) => updateSMS('numero_remitente', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="+18095550100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={config.sms.api_key}
                onChange={(e) => updateSMS('api_key', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Secret
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={config.sms.api_secret}
                onChange={(e) => updateSMS('api_secret', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Límite Diario
              </label>
              <input
                type="number"
                value={config.sms.limite_diario}
                onChange={(e) => updateSMS('limite_diario', parseInt(e.target.value))}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Configuración Telegram */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Send className="h-5 w-5 mr-2 text-cyan-600" />
            Configuración de Telegram
          </h3>

          <div className="flex items-center gap-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.telegram.habilitado}
                onChange={(e) => updateTelegram('habilitado', e.target.checked)}
                className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Habilitado</span>
            </label>

            <button
              onClick={() => handleTest('telegram')}
              disabled={!config.telegram.habilitado || testing === 'telegram'}
              className="flex items-center px-3 py-1 text-sm bg-cyan-100 text-cyan-800 rounded-md hover:bg-cyan-200 disabled:opacity-50"
            >
              {testing === 'telegram' ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-1" />
              )}
              Probar
            </button>
          </div>
        </div>

        {config.telegram.habilitado && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Token del Bot
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={config.telegram.bot_token}
                onChange={(e) => updateTelegram('bot_token', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del Bot
              </label>
              <input
                type="text"
                value={config.telegram.nombre_bot}
                onChange={(e) => updateTelegram('nombre_bot', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="InversionesCCBot"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username del Bot
              </label>
              <input
                type="text"
                value={config.telegram.username_bot}
                onChange={(e) => updateTelegram('username_bot', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="@inversionescc_bot"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ID del Canal
              </label>
              <input
                type="text"
                value={config.telegram.canal_id}
                onChange={(e) => updateTelegram('canal_id', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="@inversionescc"
              />
            </div>
          </div>
        )}
      </div>

      {/* Estado de los canales */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-gray-600" />
          Estado de los Canales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium">Email</span>
            </div>
            {config.email.habilitado ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium">WhatsApp</span>
            </div>
            {config.whatsapp.habilitado ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-sm font-medium">SMS</span>
            </div>
            {config.sms.habilitado ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center">
              <Send className="h-5 w-5 text-cyan-600 mr-2" />
              <span className="text-sm font-medium">Telegram</span>
            </div>
            {config.telegram.habilitado ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default ComunicacionesConfig;