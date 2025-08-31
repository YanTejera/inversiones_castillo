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
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Filter,
  XCircle
} from 'lucide-react';
import { usuarioService, type Usuario, type Rol, type EstadisticasUsuarios } from '../services/usuarioService';
import { permisosService } from '../services/permisosService';
import type {
  PermisoGranular,
  RolConPermisos,
  EstadisticasPermisos
} from '../services/permisosService';
import { usePermisos } from '../contexts/PermisosContext';
import NotificacionesConfig from '../components/configuracion/NotificacionesConfig';
import GestionPermisosRoles from '../components/GestionPermisosRoles';

const Configuracion: React.FC = () => {
  const { tienePermiso: tienePermisoCtx, esMaster } = usePermisos();
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
  
  // Estados para edición de roles
  const [editingRole, setEditingRole] = useState<Rol | null>(null);
  const [roleForm, setRoleForm] = useState<Partial<Rol>>({});
  
  // Estados para crear/editar usuarios
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    telefono: '',
    rol: '',
    estado: true
  });
  
  // Estados para gestión avanzada de permisos
  const [permisos, setPermisos] = useState<PermisoGranular[]>([]);
  const [rolesConPermisos, setRolesConPermisos] = useState<RolConPermisos[]>([]);
  const [estadisticasPermisos, setEstadisticasPermisos] = useState<EstadisticasPermisos | null>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState<RolConPermisos | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');
  const [busquedaPermiso, setBusquedaPermiso] = useState('');

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

      // Cargar datos de permisos avanzados si tiene acceso
      if (perfil.es_admin || perfil.es_master) {
        const [estadisticasPermisosData, rolesConPermisosData, permisosData] = await Promise.all([
          permisosService.getEstadisticasPermisos(),
          permisosService.getRolesConPermisos(),
          permisosService.getPermisos()
        ]);

        setEstadisticasPermisos(estadisticasPermisosData);
        setRolesConPermisos(Array.isArray(rolesConPermisosData) ? rolesConPermisosData : []);
        setPermisos(Array.isArray(permisosData) ? permisosData : []);
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

  // Funciones para gestión de roles
  const handleEditRole = (role: Rol) => {
    setEditingRole(role);
    setRoleForm({
      descripcion: role.descripcion,
      puede_gestionar_usuarios: role.puede_gestionar_usuarios,
      puede_ver_reportes: role.puede_ver_reportes,
      puede_gestionar_motos: role.puede_gestionar_motos,
      puede_crear_ventas: role.puede_crear_ventas,
      puede_gestionar_pagos: role.puede_gestionar_pagos,
      puede_ver_finanzas: role.puede_ver_finanzas,
      puede_configurar_sistema: role.puede_configurar_sistema
    });
  };

  const handleSaveRole = async () => {
    if (!editingRole) return;
    
    try {
      await usuarioService.updateRol(editingRole.id, roleForm);
      setSuccess('Rol actualizado exitosamente');
      
      // Recargar roles
      const rolesData = await usuarioService.getRoles();
      const roles = Array.isArray(rolesData) ? rolesData : rolesData.results || [];
      setRoles(roles);
      
      setEditingRole(null);
      setRoleForm({});
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Error al actualizar rol: ' + error.message);
    }
  };

  const handleCancelEditRole = () => {
    setEditingRole(null);
    setRoleForm({});
  };

  // Funciones para gestión de usuarios
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usuarioService.createUsuario({
        username: userForm.username,
        email: userForm.email,
        password: userForm.password,
        telefono: userForm.telefono,
        rol: parseInt(userForm.rol),
        estado: userForm.estado
      });
      
      setSuccess('Usuario creado exitosamente');
      
      // Recargar usuarios
      const usuariosData = await usuarioService.getUsuarios();
      const usuarios = Array.isArray(usuariosData) ? usuariosData : usuariosData.results || [];
      setUsuarios(usuarios);
      
      // Limpiar formulario y cerrar modal
      setUserForm({
        username: '',
        email: '',
        password: '',
        telefono: '',
        rol: '',
        estado: true
      });
      setShowUserForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Error al crear usuario: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCancelCreateUser = () => {
    setUserForm({
      username: '',
      email: '',
      password: '',
      telefono: '',
      rol: '',
      estado: true
    });
    setShowUserForm(false);
  };

  // Funciones para gestión avanzada de permisos
  const seleccionarRol = (rol: RolConPermisos) => {
    setRolSeleccionado(rol);
  };

  const togglePermiso = async (permisoId: number) => {
    if (!rolSeleccionado) return;
    
    try {
      const permisoActual = rolSeleccionado.permisos_granulares.find(p => p.permiso.id === permisoId);
      
      if (permisoActual) {
        // Si ya tiene el permiso, lo removemos
        await permisosService.removerPermiso(rolSeleccionado.id, permisoId);
      } else {
        // Si no tiene el permiso, lo asignamos
        await permisosService.asignarPermiso(rolSeleccionado.id, permisoId);
      }
      
      // Recargar datos
      const rolesConPermisosData = await permisosService.getRolesConPermisos();
      setRolesConPermisos(Array.isArray(rolesConPermisosData) ? rolesConPermisosData : []);
      
      // Actualizar rol seleccionado
      const rolActualizado = rolesConPermisosData.find(r => r.id === rolSeleccionado.id);
      if (rolActualizado) {
        setRolSeleccionado(rolActualizado);
      }
      
      setSuccess('Permiso actualizado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Error al actualizar permiso: ' + error.message);
    }
  };

  const permisosFiltrados = permisos.filter(permiso => {
    const coincideBusqueda = !busquedaPermiso || 
      permiso.nombre.toLowerCase().includes(busquedaPermiso.toLowerCase()) ||
      permiso.descripcion.toLowerCase().includes(busquedaPermiso.toLowerCase()) ||
      permiso.codigo.toLowerCase().includes(busquedaPermiso.toLowerCase());
    
    const coincideCategoria = !categoriaFiltro || permiso.categoria === categoriaFiltro;
    
    return coincideBusqueda && coincideCategoria;
  });

  const permisosAgrupados = permisosFiltrados.reduce((grupos, permiso) => {
    if (!grupos[permiso.categoria]) {
      grupos[permiso.categoria] = [];
    }
    grupos[permiso.categoria].push(permiso);
    return grupos;
  }, {} as { [categoria: string]: PermisoGranular[] });

  const categorias = [
    { value: '', label: 'Todas las categorías' },
    { value: 'motos', label: 'Motocicletas e Inventario' },
    { value: 'proveedores', label: 'Proveedores y Compras' },
    { value: 'clientes', label: 'Clientes y Ventas' },
    { value: 'finanzas', label: 'Finanzas y Contabilidad' },
    { value: 'reportes', label: 'Reportes y Analytics' },
    { value: 'usuarios', label: 'Usuarios y Sistema' },
    { value: 'configuracion', label: 'Configuración' },
  ];

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
      id: 'permisos-roles', 
      label: 'Permisos y Roles', 
      icon: Shield, 
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
    { 
      id: 'notificaciones', 
      label: 'Notificaciones', 
      icon: Bell, 
      available: true 
    },
  ].filter(tab => tab.available);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Tabs skeleton */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded-t animate-pulse"></div>
            ))}
          </nav>
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border shimmer">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border shimmer">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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

            {/* Gestión Consolidada de Permisos y Roles */}
            {activeTab === 'permisos-roles' && (currentUser?.es_admin || currentUser?.es_master) && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Shield className="h-6 w-6 mr-2" />
                  Gestión de Permisos y Roles
                </h2>
                
                <GestionPermisosRoles 
                  currentUser={currentUser}
                  onSuccess={setSuccess}
                  onError={setError}
                />
              </div>
            )}

                  onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
