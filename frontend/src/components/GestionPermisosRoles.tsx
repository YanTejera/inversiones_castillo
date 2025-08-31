import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Settings,
  Eye,
  EyeOff,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  BarChart3,
  Edit,
  Save,
  X
} from 'lucide-react';
import { permisosService } from '../services/permisosService';
import type {
  PermisoGranular,
  RolConPermisos,
  EstadisticasPermisos
} from '../services/permisosService';
import { usuarioService, type Usuario, type Rol } from '../services/usuarioService';

interface GestionPermisosRolesProps {
  currentUser: Usuario | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const GestionPermisosRoles: React.FC<GestionPermisosRolesProps> = ({ 
  currentUser, 
  onSuccess, 
  onError 
}) => {
  const [loading, setLoading] = useState(true);
  const [permisos, setPermisos] = useState<PermisoGranular[]>([]);
  const [rolesConPermisos, setRolesConPermisos] = useState<RolConPermisos[]>([]);
  const [estadisticasPermisos, setEstadisticasPermisos] = useState<EstadisticasPermisos | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState<RolConPermisos | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');
  const [busquedaPermiso, setBusquedaPermiso] = useState('');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  
  // Estados para edición de roles básicos
  const [editingRole, setEditingRole] = useState<Rol | null>(null);
  const [roleForm, setRoleForm] = useState<Partial<Rol>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [estadisticasPermisosData, rolesConPermisosData, permisosData, rolesData] = await Promise.all([
        permisosService.getEstadisticasPermisos(),
        permisosService.getRolesConPermisos(),
        permisosService.getPermisos(),
        usuarioService.getRoles()
      ]);

      setEstadisticasPermisos(estadisticasPermisosData);
      setRolesConPermisos(Array.isArray(rolesConPermisosData) ? rolesConPermisosData : []);
      setPermisos(Array.isArray(permisosData) ? permisosData : []);
      
      const rolesArray = Array.isArray(rolesData) ? rolesData : rolesData.results || [];
      setRoles(rolesArray);
      
    } catch (error: any) {
      onError('Error al cargar datos de permisos: ' + error.message);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarRol = (rol: RolConPermisos) => {
    setRolSeleccionado(rol);
  };

  const togglePermiso = async (permisoId: number) => {
    if (!rolSeleccionado) return;
    
    try {
      const permisoActual = rolSeleccionado.permisos_granulares.find(p => p.permiso === permisoId);
      
      if (permisoActual) {
        await permisosService.removerPermiso(rolSeleccionado.id, permisoId);
      } else {
        await permisosService.asignarPermiso(rolSeleccionado.id, permisoId);
      }
      
      // Recargar datos
      const rolesConPermisosData = await permisosService.getRolesConPermisos();
      setRolesConPermisos(Array.isArray(rolesConPermisosData) ? rolesConPermisosData : []);
      
      // Actualizar rol seleccionado
      const rolActualizado = rolesConPermisosData.find((r: RolConPermisos) => r.id === rolSeleccionado.id);
      if (rolActualizado) {
        setRolSeleccionado(rolActualizado);
      }
      
      onSuccess('Permiso actualizado exitosamente');
    } catch (error: any) {
      onError('Error al actualizar permiso: ' + error.message);
    }
  };

  // Funciones para gestión básica de roles
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
      onSuccess('Rol actualizado exitosamente');
      
      // Recargar roles
      const rolesData = await usuarioService.getRoles();
      const rolesArray = Array.isArray(rolesData) ? rolesData : rolesData.results || [];
      setRoles(rolesArray);
      
      setEditingRole(null);
      setRoleForm({});
    } catch (error: any) {
      onError('Error al actualizar rol: ' + error.message);
    }
  };

  const handleCancelEditRole = () => {
    setEditingRole(null);
    setRoleForm({});
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
    { value: 'inventario', label: 'Inventario y Ubicaciones' },
    { value: 'servicios', label: 'Servicios y Mantenimiento' },
    { value: 'analytics', label: 'Analytics y KPIs' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Estadísticas de Permisos */}
      {estadisticasPermisos && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold mb-4 text-blue-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Estadísticas del Sistema de Permisos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{estadisticasPermisos.total_permisos}</div>
              <div className="text-sm text-blue-700">Total de Permisos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{estadisticasPermisos.permisos_criticos}</div>
              <div className="text-sm text-orange-700">Permisos Críticos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{Object.keys(estadisticasPermisos.permisos_por_categoria).length}</div>
              <div className="text-sm text-green-700">Categorías</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Roles */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Roles del Sistema
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {Array.isArray(rolesConPermisos) && rolesConPermisos.map((rol) => (
              <button
                key={rol.id}
                onClick={() => seleccionarRol(rol)}
                className={`w-full text-left p-3 rounded-lg transition-colors border-2 ${
                  rolSeleccionado?.id === rol.id
                    ? 'bg-blue-50 border-blue-200 shadow-md'
                    : 'bg-gray-50 hover:bg-gray-100 border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">{rol.nombre_rol_display}</h4>
                    <p className="text-sm text-gray-500">{rol.permisos_activos} permisos activos</p>
                  </div>
                  <div className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {rol.total_permisos}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor de Permisos del Rol */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
          {rolSeleccionado ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Permisos de {rolSeleccionado.nombre_rol_display}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {rolSeleccionado.permisos_activos} de {rolSeleccionado.total_permisos} permisos asignados
                </p>
                
                {/* Controles de búsqueda y filtro */}
                <div className="mt-4 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar permisos..."
                      value={busquedaPermiso}
                      onChange={(e) => setBusquedaPermiso(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <select
                      value={categoriaFiltro}
                      onChange={(e) => setCategoriaFiltro(e.target.value)}
                      className="w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {categorias.map((categoria) => (
                        <option key={categoria.value} value={categoria.value}>
                          {categoria.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="text-center">
                  <div className="mb-4">
                    <Settings className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Gestionar Permisos Detallados
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Con {rolSeleccionado.total_permisos} permisos disponibles, utiliza el editor completo 
                      para una mejor experiencia de gestión
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPermissionsModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Settings className="h-5 w-5" />
                    Abrir Editor de Permisos
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Selecciona un rol para gestionar sus permisos</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gestión Básica de Roles (solo master) */}
      {currentUser?.es_master && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Configuración Básica de Roles
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona los permisos básicos del sistema para cada rol
            </p>
          </div>
          <div className="p-4 space-y-4">
            {Array.isArray(roles) && roles.map((rol) => (
              <div key={rol.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{rol.nombre_rol_display}</h3>
                  {editingRole?.id === rol.id ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={handleSaveRole}
                        className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50"
                        title="Guardar cambios"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={handleCancelEditRole}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-50"
                        title="Cancelar edición"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleEditRole(rol)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                      title="Editar rol"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {editingRole?.id === rol.id ? (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={roleForm.descripcion || ''}
                      onChange={(e) => setRoleForm({...roleForm, descripcion: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mb-3">{rol.descripcion}</p>
                )}
                
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
                    <div key={permiso.key}>
                      {editingRole?.id === rol.id ? (
                        <label className="flex items-center gap-2 px-2 py-1 rounded bg-gray-50 cursor-pointer hover:bg-gray-100">
                          <input
                            type="checkbox"
                            checked={roleForm[permiso.key as keyof typeof roleForm] as boolean || false}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              [permiso.key]: e.target.checked
                            })}
                            className="text-blue-600"
                          />
                          <span className="text-xs">{permiso.label}</span>
                        </label>
                      ) : (
                        <div 
                          className={`px-2 py-1 rounded ${
                            (rol as any)[permiso.key] 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {permiso.label}: {(rol as any)[permiso.key] ? 'Sí' : 'No'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Modal de Gestión de Permisos Completo */}
      {showPermissionsModal && rolSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Permisos de {rolSeleccionado.nombre_rol_display}
                </h2>
                <p className="text-gray-600">
                  {rolSeleccionado.permisos_activos} de {rolSeleccionado.total_permisos} permisos asignados
                </p>
              </div>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Controles de búsqueda */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar permisos por nombre, descripción o código..."
                    value={busquedaPermiso}
                    onChange={(e) => setBusquedaPermiso(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className="pl-11 pr-8 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-48"
                  >
                    {categorias.map((categoria) => (
                      <option key={categoria.value} value={categoria.value}>
                        {categoria.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto p-6">
              {Object.keys(permisosAgrupados).length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(permisosAgrupados).map(([categoria, permisos]) => (
                    <div key={categoria} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <Shield className="h-5 w-5 mr-2 text-blue-600" />
                          {categorias.find(c => c.value === categoria)?.label || categoria}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {permisos.length} permisos
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {permisos.map((permiso) => {
                          const tienePermiso = rolSeleccionado.permisos_granulares.some(p => p.permiso === permiso.id);
                          return (
                            <label
                              key={permiso.id}
                              className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                                tienePermiso 
                                  ? 'bg-green-50 hover:bg-green-100 border-green-200 shadow-sm' 
                                  : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex-shrink-0 mt-1">
                                <input
                                  type="checkbox"
                                  checked={tienePermiso}
                                  onChange={() => togglePermiso(permiso.id)}
                                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-gray-900 text-sm">{permiso.nombre}</h4>
                                  {permiso.es_critico && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Crítico
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{permiso.descripcion}</p>
                                <p className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {permiso.codigo}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron permisos</h3>
                  <p className="text-gray-600">
                    Intenta cambiar los filtros de búsqueda o categoría
                  </p>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {Object.values(permisosAgrupados).flat().length} permisos
                  {busquedaPermiso || categoriaFiltro ? ' (filtrados)' : ''}
                </div>
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionPermisosRoles;