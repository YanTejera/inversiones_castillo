import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Shield,
  User,
  Key,
  Palette,
  Bell,
  Globe,
  BarChart3,
  UserPlus,
  UserCheck,
  UserX,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  FileText,
  FolderOpen,
  Bike,
  ShoppingCart
} from 'lucide-react';
import { usuarioService, type Usuario, type Rol, type EstadisticasUsuarios } from '../services/usuarioService';

const Configuracion: React.FC = () => {
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasUsuarios | null>(null);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para formularios
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password_actual: '',
    password_nueva: '',
    confirmar_password: '',
    showPasswords: false
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Cargar perfil del usuario actual
      const perfil = await usuarioService.getPerfilUsuario();
      setCurrentUser(perfil);

      // Cargar roles disponibles
      const rolesData = await usuarioService.getRoles();
      // Manejar respuesta vs array directo
      const roles = Array.isArray(rolesData) ? rolesData : rolesData.results || [];
      setRoles(roles);

      // Si tiene permisos, cargar usuarios y estadísticas
      if (perfil.rol_info.puede_gestionar_usuarios || perfil.es_admin) {
        const usuariosData = await usuarioService.getUsuarios();
        // Manejar respuesta paginada vs array directo
        const usuarios = Array.isArray(usuariosData) ? usuariosData : usuariosData.results || [];
        setUsuarios(usuarios);
      }

      if (perfil.rol_info.puede_ver_reportes || perfil.es_admin) {
        const stats = await usuarioService.getEstadisticasUsuarios();
        setEstadisticas(stats);
      }

    } catch (error: any) {
      setError('Error al cargar configuración: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePerfil = async (data: Partial<Usuario>) => {
    try {
      const updatedUser = await usuarioService.updatePerfilUsuario(data);
      setCurrentUser(updatedUser);
      setSuccess('Perfil actualizado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Error al actualizar perfil: ' + error.message);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usuarioService.cambiarPassword({
        password_actual: passwordForm.password_actual,
        password_nueva: passwordForm.password_nueva,
        confirmar_password: passwordForm.confirmar_password
      });
      setSuccess('Contraseña cambiada exitosamente');
      setPasswordForm({
        password_actual: '',
        password_nueva: '',
        confirmar_password: '',
        showPasswords: false
      });
      setShowPasswordForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Error al cambiar contraseña: ' + error.response?.data?.password_actual?.[0] || error.message);
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      const result = await usuarioService.toggleEstadoUsuario(userId);
      setSuccess(result.message);
      // Recargar usuarios
      const usuariosData = await usuarioService.getUsuarios();
      // Manejar respuesta paginada vs array directo
      const usuarios = Array.isArray(usuariosData) ? usuariosData : usuariosData.results || [];
      setUsuarios(usuarios);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Error al cambiar estado: ' + error.message);
    }
  };

  const tabs = [
    { 
      id: 'perfil', 
      label: 'Mi Perfil', 
      icon: User, 
      available: true 
    },
    { 
      id: 'usuarios', 
      label: 'Gestión de Usuarios', 
      icon: Users, 
      available: currentUser?.rol_info?.puede_gestionar_usuarios || currentUser?.es_admin 
    },
    { 
      id: 'roles', 
      label: 'Gestión de Roles', 
      icon: Shield, 
      available: currentUser?.es_master 
    },
    { 
      id: 'permisos', 
      label: 'Permisos Avanzados', 
      icon: Key, 
      available: currentUser?.es_admin || currentUser?.es_master 
    },
    { 
      id: 'documentos', 
      label: 'Configuración Documentos', 
      icon: FileText, 
      available: currentUser?.rol_info?.puede_configurar_sistema || currentUser?.es_admin 
    },
    { 
      id: 'estadisticas', 
      label: 'Estadísticas', 
      icon: BarChart3, 
      available: currentUser?.rol_info?.puede_ver_reportes || currentUser?.es_admin 
    },
  ].filter(tab => tab.available);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Settings className="h-8 w-8 mr-3" />
          Configuración del Sistema
        </h1>
        <p className="mt-2 text-gray-600">
          Gestiona tu perfil, usuarios y configuraciones del sistema
        </p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
          <button onClick={() => setSuccess('')} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <nav className="bg-white rounded-lg shadow p-4">
            <ul className="space-y-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="h-5 w-5 mr-3" />
                      {tab.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            {/* Mi Perfil */}
            {activeTab === 'perfil' && currentUser && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <User className="h-6 w-6 mr-2" />
                  Mi Perfil
                </h2>
                
                <div className="space-y-6">
                  {/* Información Personal */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-4">Información Personal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre de Usuario
                        </label>
                        <input
                          type="text"
                          value={currentUser.username}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={currentUser.email}
                          onChange={(e) => handleUpdatePerfil({ email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={currentUser.first_name}
                          onChange={(e) => handleUpdatePerfil({ first_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apellido
                        </label>
                        <input
                          type="text"
                          value={currentUser.last_name}
                          onChange={(e) => handleUpdatePerfil({ last_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono
                        </label>
                        <input
                          type="text"
                          value={currentUser.telefono || ''}
                          onChange={(e) => handleUpdatePerfil({ telefono: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rol
                        </label>
                        <input
                          type="text"
                          value={currentUser?.rol_info?.nombre_rol_display || 'No definido'}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Configuraciones */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-4">Configuraciones</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Palette className="h-5 w-5 mr-2 text-gray-500" />
                          <div>
                            <span>Tema Oscuro</span>
                            <p className="text-xs text-orange-600">En desarrollo</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                          <input
                            type="checkbox"
                            checked={false}
                            disabled
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Bell className="h-5 w-5 mr-2 text-gray-500" />
                          <div>
                            <span>Notificaciones Email</span>
                            <p className="text-xs text-orange-600">En desarrollo</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                          <input
                            type="checkbox"
                            checked={false}
                            disabled
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Globe className="h-5 w-5 mr-2 text-gray-500" />
                          <div>
                            <span>Idioma</span>
                            <p className="text-xs text-orange-600">En desarrollo</p>
                          </div>
                        </div>
                        <select
                          value="es"
                          disabled
                          className="px-3 py-1 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed opacity-50"
                        >
                          <option value="es">Español</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Cambiar Contraseña */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium flex items-center">
                        <Key className="h-5 w-5 mr-2" />
                        Seguridad
                      </h3>
                      <button
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Cambiar Contraseña
                      </button>
                    </div>

                    {showPasswordForm && (
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña Actual
                          </label>
                          <div className="relative">
                            <input
                              type={passwordForm.showPasswords ? 'text' : 'password'}
                              value={passwordForm.password_actual}
                              onChange={(e) => setPasswordForm(prev => ({...prev, password_actual: e.target.value}))}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setPasswordForm(prev => ({...prev, showPasswords: !prev.showPasswords}))}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {passwordForm.showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nueva Contraseña
                          </label>
                          <input
                            type={passwordForm.showPasswords ? 'text' : 'password'}
                            value={passwordForm.password_nueva}
                            onChange={(e) => setPasswordForm(prev => ({...prev, password_nueva: e.target.value}))}
                            required
                            minLength={8}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar Nueva Contraseña
                          </label>
                          <input
                            type={passwordForm.showPasswords ? 'text' : 'password'}
                            value={passwordForm.confirmar_password}
                            onChange={(e) => setPasswordForm(prev => ({...prev, confirmar_password: e.target.value}))}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex space-x-3">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Cambiar Contraseña
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPasswordForm(false)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Gestión de Usuarios */}
            {activeTab === 'usuarios' && (currentUser?.rol_info?.puede_gestionar_usuarios || currentUser?.es_admin) && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Users className="h-6 w-6 mr-2" />
                    Gestión de Usuarios
                  </h2>
                  <button
                    onClick={() => setShowUserForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Nuevo Usuario
                  </button>
                </div>

                {/* Lista de Usuarios */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Último Acceso
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(usuarios) && usuarios.map((usuario) => (
                        <tr key={usuario.id} className={usuario.estado ? '' : 'bg-red-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {usuario.nombre_completo}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {usuario.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {usuario.rol_info.nombre_rol_display}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              usuario.estado 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {usuario.estado ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {usuario.ultimo_acceso 
                              ? new Date(usuario.ultimo_acceso).toLocaleDateString()
                              : 'Nunca'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => setEditingUser(usuario)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              {usuario.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleToggleUserStatus(usuario.id)}
                                  className={`${
                                    usuario.estado 
                                      ? 'text-red-600 hover:text-red-900' 
                                      : 'text-green-600 hover:text-green-900'
                                  }`}
                                  title={usuario.estado ? 'Desactivar' : 'Activar'}
                                >
                                  {usuario.estado ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Estadísticas */}
            {activeTab === 'estadisticas' && estadisticas && (currentUser?.rol_info?.puede_ver_reportes || currentUser?.es_admin) && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2" />
                  Estadísticas de Usuarios
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">Total Usuarios</p>
                        <p className="text-2xl font-bold text-blue-900">{estadisticas.total_usuarios}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <UserCheck className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">Usuarios Activos</p>
                        <p className="text-2xl font-bold text-green-900">{estadisticas.usuarios_activos}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <UserX className="h-8 w-8 text-red-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-red-600">Usuarios Inactivos</p>
                        <p className="text-2xl font-bold text-red-900">{estadisticas.usuarios_inactivos}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usuarios por Rol */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Usuarios por Rol</h3>
                  <div className="space-y-4">
                    {Object.entries(estadisticas.usuarios_por_rol).map(([rol, cantidad]) => (
                      <div key={rol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{rol}</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">
                          {cantidad}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Gestión de Roles (solo master) */}
            {activeTab === 'roles' && currentUser?.es_master && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Shield className="h-6 w-6 mr-2" />
                  Gestión de Roles
                </h2>
                
                <div className="space-y-4">
                  {Array.isArray(roles) && roles.map((rol) => (
                    <div key={rol.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{rol.nombre_rol_display}</h3>
                        <button className="text-blue-600 hover:text-blue-900">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{rol.descripcion}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {[
                          { key: 'puede_gestionar_usuarios', label: 'Gestionar Usuarios' },
                          { key: 'puede_ver_reportes', label: 'Ver Reportes' },
                          { key: 'puede_gestionar_motos', label: 'Gestionar Motos' },
                          { key: 'puede_crear_ventas', label: 'Crear Ventas' },
                          { key: 'puede_gestionar_pagos', label: 'Gestionar Pagos' },
                          { key: 'puede_ver_finanzas', label: 'Ver Finanzas' },
                          { key: 'puede_configurar_sistema', label: 'Configurar Sistema' },
                        ].map((permiso) => (
                          <div 
                            key={permiso.key}
                            className={`px-2 py-1 rounded ${
                              (rol as any)[permiso.key] 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {permiso.label}: {(rol as any)[permiso.key] ? 'Sí' : 'No'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Permisos Avanzados */}
            {activeTab === 'permisos' && (currentUser?.es_admin || currentUser?.es_master) && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Key className="h-6 w-6 mr-2" />
                  Permisos Avanzados
                </h2>
                
                <div className="space-y-6">
                  {/* Otorgar todos los permisos */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      Gestión de Permisos Globales
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800">Otorgar Todos los Permisos</p>
                          <p className="text-sm text-green-600">Permite seleccionar usuarios y otorgarles acceso completo al sistema</p>
                        </div>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Gestionar
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.isArray(usuarios) && usuarios.map((usuario) => (
                          <div key={usuario.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{usuario.nombre_completo}</p>
                                <p className="text-sm text-gray-500">{usuario.rol_info.nombre_rol_display}</p>
                              </div>
                              <button 
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={() => {
                                  // TODO: Implementar función para otorgar todos los permisos
                                  setSuccess(`Todos los permisos otorgados a ${usuario.nombre_completo}`);
                                  setTimeout(() => setSuccess(''), 3000);
                                }}
                              >
                                Otorgar Todo
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Control de visibilidad de módulos */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-4 flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-blue-600" />
                      Control de Visibilidad de Módulos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { module: 'Documentos', icon: FileText, description: 'Controla quién puede ver y acceder a los documentos' },
                        { module: 'Motocicletas', icon: Bike, description: 'Controla quién puede gestionar las motocicletas' },
                        { module: 'Reportes', icon: BarChart3, description: 'Controla el acceso a reportes y estadísticas' },
                        { module: 'Ventas', icon: ShoppingCart, description: 'Controla quién puede crear y gestionar ventas' },
                      ].map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <div key={item.module} className="border rounded-lg p-3">
                            <div className="flex items-center mb-2">
                              <IconComponent className="h-5 w-5 mr-2 text-gray-600" />
                              <h4 className="font-medium">{item.module}</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-green-600">Visible</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Configuración de Documentos */}
            {activeTab === 'documentos' && (currentUser?.rol_info?.puede_configurar_sistema || currentUser?.es_admin) && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <FileText className="h-6 w-6 mr-2" />
                  Configuración de Documentos
                </h2>
                
                <div className="space-y-6">
                  {/* Permisos de documentos */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-4 flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-blue-600" />
                      Permisos de Acceso a Documentos
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-blue-800">Documentos Ocultos</p>
                          <p className="text-sm text-blue-600">Gestionar qué documentos están ocultos para usuarios específicos</p>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                          <EyeOff className="h-4 w-4 mr-2" />
                          Configurar
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium mb-2">Quién puede agregar documentos</h4>
                          <div className="space-y-2">
                            {Array.isArray(usuarios) && usuarios.map((usuario) => (
                              <label key={usuario.id} className="flex items-center">
                                <input 
                                  type="checkbox" 
                                  defaultChecked={usuario.rol_info.puede_configurar_sistema || usuario.es_admin}
                                  className="mr-2" 
                                />
                                <span className="text-sm">{usuario.nombre_completo}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium mb-2">Quién puede agregar motocicletas</h4>
                          <div className="space-y-2">
                            {Array.isArray(usuarios) && usuarios.map((usuario) => (
                              <label key={usuario.id} className="flex items-center">
                                <input 
                                  type="checkbox" 
                                  defaultChecked={usuario.rol_info.puede_gestionar_motos || usuario.es_admin}
                                  className="mr-2" 
                                />
                                <span className="text-sm">{usuario.nombre_completo}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Configuración de tipos de documentos */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-4 flex items-center">
                      <FolderOpen className="h-5 w-5 mr-2 text-orange-600" />
                      Tipos de Documentos Permitidos
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { type: 'PDF', extension: '.pdf', enabled: true },
                        { type: 'Word', extension: '.docx', enabled: true },
                        { type: 'Excel', extension: '.xlsx', enabled: true },
                        { type: 'Imágenes', extension: '.jpg, .png', enabled: true },
                        { type: 'PowerPoint', extension: '.pptx', enabled: false },
                        { type: 'Texto', extension: '.txt', enabled: false },
                        { type: 'Zip', extension: '.zip', enabled: false },
                        { type: 'Video', extension: '.mp4', enabled: false },
                      ].map((docType) => (
                        <div key={docType.type} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{docType.type}</h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked={docType.enabled} className="sr-only peer" />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">{docType.extension}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;