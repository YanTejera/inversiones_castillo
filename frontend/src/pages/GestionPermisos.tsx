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
  BarChart3
} from 'lucide-react';
import { permisosService } from '../services/permisosService';
import type {
  PermisoGranular,
  RolConPermisos,
  EstadisticasPermisos
} from '../services/permisosService';
import { usePermisos } from '../contexts/PermisosContext';

const GestionPermisos: React.FC = () => {
  const { tienePermiso, esMaster } = usePermisos();
  
  // Estados principales
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'permisos'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para datos
  const [estadisticas, setEstadisticas] = useState<EstadisticasPermisos | null>(null);
  const [roles, setRoles] = useState<RolConPermisos[]>([]);
  const [permisos, setPermisos] = useState<PermisoGranular[]>([]);
  const [permisosFiltrados, setPermisosFiltrados] = useState<PermisoGranular[]>([]);

  // Estados para filtros
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');
  const [mostrarCriticos, setMostrarCriticos] = useState<boolean>(false);

  // Estados para edición
  const [rolSeleccionado, setRolSeleccionado] = useState<RolConPermisos | null>(null);
  const [permisosRolOriginal, setPermisosRolOriginal] = useState<Set<number>>(new Set());
  const [permisosRolActual, setPermisosRolActual] = useState<Set<number>>(new Set());
  const [cambiosPendientes, setCambiosPendientes] = useState<boolean>(false);

  useEffect(() => {
    if (!tienePermiso('usuarios.manage_permissions') && !esMaster) {
      setError('No tienes permisos para acceder a la gestión de permisos');
      setLoading(false);
      return;
    }
    
    cargarDatos();
  }, [tienePermiso, esMaster]);

  useEffect(() => {
    // Aplicar filtros
    let filtrados = permisos;
    
    if (filtroCategoria !== 'todas') {
      filtrados = filtrados.filter(p => p.categoria === filtroCategoria);
    }
    
    if (filtroBusqueda) {
      filtrados = filtrados.filter(p => 
        p.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
        p.codigo.toLowerCase().includes(filtroBusqueda.toLowerCase())
      );
    }
    
    if (mostrarCriticos) {
      filtrados = filtrados.filter(p => p.es_critico);
    }
    
    setPermisosFiltrados(filtrados);
  }, [permisos, filtroCategoria, filtroBusqueda, mostrarCriticos]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const [estadisticasData, rolesData, permisosData] = await Promise.all([
        permisosService.getEstadisticasPermisos(),
        permisosService.getRolesConPermisos(),
        permisosService.getPermisos()
      ]);

      setEstadisticas(estadisticasData);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setPermisos(Array.isArray(permisosData) ? permisosData : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar datos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarRol = (rol: RolConPermisos) => {
    setRolSeleccionado(rol);
    const permisosIds = new Set(rol.permisos_granulares.map(rp => rp.permiso));
    setPermisosRolOriginal(permisosIds);
    setPermisosRolActual(new Set(permisosIds));
    setCambiosPendientes(false);
  };

  const togglePermisoRol = (permisoId: number) => {
    const nuevosPermisos = new Set(permisosRolActual);
    if (nuevosPermisos.has(permisoId)) {
      nuevosPermisos.delete(permisoId);
    } else {
      nuevosPermisos.add(permisoId);
    }
    setPermisosRolActual(nuevosPermisos);
    
    // Verificar si hay cambios
    const hayDiferencias = 
      nuevosPermisos.size !== permisosRolOriginal.size ||
      [...nuevosPermisos].some(id => !permisosRolOriginal.has(id));
    
    setCambiosPendientes(hayDiferencias);
  };

  const guardarCambiosRol = async () => {
    if (!rolSeleccionado) return;
    
    try {
      setLoading(true);
      
      // Obtener permisos a agregar y remover
      const permisosAgregar = [...permisosRolActual].filter(id => !permisosRolOriginal.has(id));
      const permisosRemover = [...permisosRolOriginal].filter(id => !permisosRolActual.has(id));
      
      // Asignar nuevos permisos
      for (const permisoId of permisosAgregar) {
        await permisosService.asignarPermiso(rolSeleccionado.id, permisoId, true);
      }
      
      // Remover permisos
      for (const permisoId of permisosRemover) {
        await permisosService.removerPermiso(rolSeleccionado.id, permisoId);
      }
      
      // Recargar datos
      await cargarDatos();
      
      // Actualizar estados
      setPermisosRolOriginal(new Set(permisosRolActual));
      setCambiosPendientes(false);
      
      alert('Cambios guardados exitosamente');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar cambios');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelarCambios = () => {
    setPermisosRolActual(new Set(permisosRolOriginal));
    setCambiosPendientes(false);
  };

  const getCategorias = () => {
    return [
      { value: 'todas', label: 'Todas las categorías' },
      { value: 'motos', label: 'Motocicletas e Inventario' },
      { value: 'proveedores', label: 'Proveedores y Compras' },
      { value: 'clientes', label: 'Clientes y Ventas' },
      { value: 'finanzas', label: 'Finanzas y Contabilidad' },
      { value: 'reportes', label: 'Reportes y Analytics' },
      { value: 'usuarios', label: 'Usuarios y Sistema' },
      { value: 'configuracion', label: 'Configuración' },
    ];
  };

  if (loading && !estadisticas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de Acceso</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Permisos</h1>
            <p className="text-gray-600 mt-1">
              Administra roles y permisos del sistema de manera granular
            </p>
          </div>
          <Shield className="w-12 h-12 text-blue-600" />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white rounded-t-lg">
        <nav className="-mb-px flex space-x-8 px-6 pt-4">
          {[
            { key: 'overview', label: 'Resumen', icon: BarChart3 },
            { key: 'roles', label: 'Gestión de Roles', icon: Users },
            { key: 'permisos', label: 'Todos los Permisos', icon: Settings }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de Tabs */}
      {activeTab === 'overview' && estadisticas && (
        <div className="space-y-6">
          {/* Cards de Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total Permisos</p>
                  <p className="text-2xl font-bold text-blue-900">{estadisticas.total_permisos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">Permisos Críticos</p>
                  <p className="text-2xl font-bold text-red-900">{estadisticas.permisos_criticos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Roles Activos</p>
                  <p className="text-2xl font-bold text-green-900">{roles.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Settings className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">Categorías</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {Object.keys(estadisticas.permisos_por_categoria).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Permisos por Categoría */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Permisos por Categoría</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(estadisticas.permisos_por_categoria).map(([categoria, count]) => (
                <div key={categoria} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="font-medium text-gray-700">{categoria}</span>
                  <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Estadísticas de Roles */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas por Rol</h3>
            <div className="space-y-4">
              {estadisticas.roles_estadisticas.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{stat.rol}</h4>
                    <p className="text-sm text-gray-500">{stat.usuarios_activos} usuarios activos</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">{stat.permisos_asignados}</span>
                    <p className="text-sm text-gray-500">permisos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Roles */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Roles del Sistema</h3>
            </div>
            <div className="p-4 space-y-2">
              {Array.isArray(roles) && roles.map((rol) => (
                <button
                  key={rol.id}
                  onClick={() => seleccionarRol(rol)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    rolSeleccionado?.id === rol.id
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
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
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
            {rolSeleccionado ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Permisos de {rolSeleccionado.nombre_rol_display}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {permisosRolActual.size} de {permisos.length} permisos asignados
                      </p>
                    </div>
                    {cambiosPendientes && (
                      <div className="flex space-x-2">
                        <button
                          onClick={cancelarCambios}
                          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={guardarCambiosRol}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Guardar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Filtros */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      value={filtroCategoria}
                      onChange={(e) => setFiltroCategoria(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      {getCategorias().map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar permisos..."
                        value={filtroBusqueda}
                        onChange={(e) => setFiltroBusqueda(e.target.value)}
                        className="border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm w-full"
                      />
                    </div>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={mostrarCriticos}
                        onChange={(e) => setMostrarCriticos(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Solo críticos</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {permisosFiltrados.map((permiso) => {
                      const tienePermiso = permisosRolActual.has(permiso.id);
                      return (
                        <div
                          key={permiso.id}
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            tienePermiso ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900">{permiso.nombre}</h4>
                              {permiso.es_critico && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{permiso.descripcion}</p>
                            <p className="text-xs text-gray-400">{permiso.codigo}</p>
                          </div>
                          <button
                            onClick={() => togglePermisoRol(permiso.id)}
                            className={`p-2 rounded-lg ${
                              tienePermiso
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {tienePermiso ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecciona un Rol
                  </h3>
                  <p className="text-gray-500">
                    Elige un rol de la lista para gestionar sus permisos
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'permisos' && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Todos los Permisos del Sistema</h3>
            <p className="text-sm text-gray-500 mt-1">
              Vista completa de todos los permisos disponibles
            </p>
          </div>

          {/* Filtros */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {getCategorias().map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar permisos..."
                  value={filtroBusqueda}
                  onChange={(e) => setFiltroBusqueda(e.target.value)}
                  className="border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm w-full"
                />
              </div>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={mostrarCriticos}
                  onChange={(e) => setMostrarCriticos(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Solo críticos</span>
              </label>
            </div>
          </div>

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permiso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crítico
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roles con Acceso
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {permisosFiltrados.map((permiso) => {
                    const rolesConPermiso = roles.filter(rol => 
                      rol.permisos_granulares.some(rp => rp.permiso === permiso.id && rp.activo)
                    );
                    
                    return (
                      <tr key={permiso.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{permiso.nombre}</div>
                            <div className="text-sm text-gray-500">{permiso.descripcion}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {permiso.categoria_display}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                          {permiso.codigo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {permiso.es_critico ? (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          ) : (
                            <div className="w-4 h-4"></div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-wrap gap-1">
                            {rolesConPermiso.map(rol => (
                              <span
                                key={rol.id}
                                className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs"
                              >
                                {rol.nombre_rol_display}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionPermisos;