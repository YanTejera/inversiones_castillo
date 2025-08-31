import api from './api';

export interface PermisoGranular {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  categoria_display: string;
  es_critico: boolean;
  activo: boolean;
  fecha_creacion: string;
}

export interface RolPermiso {
  id: number;
  rol: number;
  permiso: number;
  permiso_info: PermisoGranular;
  concedido_por: number | null;
  concedido_por_info: string | null;
  fecha_asignacion: string;
  activo: boolean;
}

export interface RolConPermisos {
  id: number;
  nombre_rol: string;
  nombre_rol_display: string;
  descripcion: string;
  puede_gestionar_usuarios: boolean;
  puede_ver_reportes: boolean;
  puede_gestionar_motos: boolean;
  puede_crear_ventas: boolean;
  puede_gestionar_pagos: boolean;
  puede_ver_finanzas: boolean;
  puede_configurar_sistema: boolean;
  permisos_granulares: RolPermiso[];
  permisos_activos: number;
  total_permisos: number;
}

export interface PermisosUsuario {
  permisos: string[];
  permisos_por_categoria: { [categoria: string]: PermisoInfo[] };
  rol: string;
  es_master: boolean;
  es_admin: boolean;
}

export interface PermisoInfo {
  codigo: string;
  nombre: string;
  descripcion: string;
}

export interface EstadisticasPermisos {
  total_permisos: number;
  permisos_criticos: number;
  permisos_por_categoria: { [categoria: string]: number };
  roles_estadisticas: {
    rol: string;
    permisos_asignados: number;
    usuarios_activos: number;
  }[];
}

class PermisosService {
  private basePath = '/usuarios';

  // === GESTIÓN DE PERMISOS ===

  async getPermisos(categoria?: string): Promise<PermisoGranular[]> {
    let allPermisos: PermisoGranular[] = [];
    let page = 1;
    let hasMore = true;

    const baseParams = categoria ? { categoria } : {};
    
    while (hasMore) {
      const params = { ...baseParams, page, page_size: 100 };
      const response = await api.get(`${this.basePath}/permisos/`, { params });
      
      if (Array.isArray(response.data)) {
        // Respuesta directa (sin paginación)
        allPermisos = response.data;
        hasMore = false;
      } else {
        // Respuesta paginada
        const results = response.data.results || [];
        allPermisos = [...allPermisos, ...results];
        
        // Verificar si hay más páginas
        hasMore = !!response.data.next;
        page++;
      }
    }
    
    return allPermisos;
  }

  async getPermisosUsuario(): Promise<PermisosUsuario> {
    const response = await api.get(`${this.basePath}/permisos/usuario/`);
    return response.data;
  }

  async validarPermiso(codigo_permiso: string): Promise<{
    codigo_permiso: string;
    tiene_permiso: boolean;
    usuario: string;
    rol: string;
  }> {
    const response = await api.post(`${this.basePath}/permisos/validar/`, {
      codigo_permiso
    });
    return response.data;
  }

  async getEstadisticasPermisos(): Promise<EstadisticasPermisos> {
    const response = await api.get(`${this.basePath}/permisos/estadisticas/`);
    return response.data;
  }

  // === GESTIÓN DE ROLES CON PERMISOS ===

  async getRolesConPermisos(): Promise<RolConPermisos[]> {
    const response = await api.get(`${this.basePath}/roles-permisos/`, { params: { page_size: 1000 } });
    // Manejar respuesta paginada o directa
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  }

  async getRolConPermisos(rolId: number): Promise<RolConPermisos> {
    const response = await api.get(`${this.basePath}/roles-permisos/${rolId}/`);
    return response.data;
  }

  async asignarPermiso(rolId: number, permisoId: number, activo: boolean = true): Promise<RolPermiso> {
    const response = await api.post(`${this.basePath}/asignar-permiso/`, {
      rol_id: rolId,
      permiso_id: permisoId,
      activo
    });
    return response.data;
  }

  async removerPermiso(rolId: number, permisoId: number): Promise<void> {
    await api.delete(`${this.basePath}/asignar-permiso/`, {
      data: {
        rol_id: rolId,
        permiso_id: permisoId
      }
    });
  }

  // === UTILIDADES ===

  /**
   * Verifica si el usuario tiene un permiso específico
   * Útil para condicionales en el frontend
   */
  static tienePermiso(permisos: string[], codigoPermiso: string): boolean {
    return permisos.includes(codigoPermiso);
  }

  /**
   * Verifica si el usuario tiene alguno de los permisos especificados
   */
  static tieneAlgunPermiso(permisos: string[], codigosPermisos: string[]): boolean {
    return codigosPermisos.some(codigo => permisos.includes(codigo));
  }

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   */
  static tieneTodosPermisos(permisos: string[], codigosPermisos: string[]): boolean {
    return codigosPermisos.every(codigo => permisos.includes(codigo));
  }

  /**
   * Obtiene permisos de una categoría específica
   */
  static getPermisosPorCategoria(permisosPorCategoria: { [categoria: string]: PermisoInfo[] }, categoria: string): PermisoInfo[] {
    return permisosPorCategoria[categoria] || [];
  }

  /**
   * Obtiene todas las categorías disponibles
   */
  static getCategorias(): { value: string; label: string }[] {
    return [
      { value: 'motos', label: 'Motocicletas e Inventario' },
      { value: 'proveedores', label: 'Proveedores y Compras' },
      { value: 'clientes', label: 'Clientes y Ventas' },
      { value: 'finanzas', label: 'Finanzas y Contabilidad' },
      { value: 'reportes', label: 'Reportes y Analytics' },
      { value: 'usuarios', label: 'Usuarios y Sistema' },
      { value: 'configuracion', label: 'Configuración' },
    ];
  }

  /**
   * Agrupa permisos por categoría para mostrar en la interfaz
   */
  static agruparPermisosPorCategoria(permisos: PermisoGranular[]): { [categoria: string]: PermisoGranular[] } {
    return permisos.reduce((grupos, permiso) => {
      if (!grupos[permiso.categoria]) {
        grupos[permiso.categoria] = [];
      }
      grupos[permiso.categoria].push(permiso);
      return grupos;
    }, {} as { [categoria: string]: PermisoGranular[] });
  }

  /**
   * Formatea el nombre de una categoría
   */
  static formatearCategoria(categoria: string): string {
    const categorias = this.getCategorias();
    const found = categorias.find(c => c.value === categoria);
    return found ? found.label : categoria;
  }
}

export const permisosService = new PermisosService();

// Funciones utilitarias - se usan desde el contexto principal

export default PermisosService;

// Explicit re-export to ensure availability
export type { PermisoGranular, RolPermiso, RolConPermisos, PermisosUsuario, PermisoInfo, EstadisticasPermisos };