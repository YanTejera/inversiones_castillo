import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname.includes('onrender.com') 
    ? 'https://inversiones-castillo.onrender.com/api' 
    : 'http://localhost:8000/api');

const api = axios.create({
  baseURL: `${API_URL}/usuarios/`,
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export interface Usuario {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  nombre_completo: string;
  telefono?: string;
  rol: number;
  rol_info: {
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
  };
  estado: boolean;
  fecha_creacion: string;
  ultimo_acceso?: string;
  foto_perfil?: string;
  tema_oscuro: boolean;
  notificaciones_email: boolean;
  idioma: string;
  es_master: boolean;
  es_admin: boolean;
}

export interface Rol {
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
}

export interface EstadisticasUsuarios {
  total_usuarios: number;
  usuarios_activos: number;
  usuarios_inactivos: number;
  usuarios_por_rol: Record<string, number>;
}

export interface ConfiguracionSistema {
  version_sistema: string;
  roles_disponibles: Array<{value: string; label: string}>;
  idiomas_disponibles: Array<{value: string; label: string}>;
  configuraciones_usuario: {
    tema_oscuro_disponible: boolean;
    notificaciones_disponibles: boolean;
    cambio_idioma_disponible: boolean;
  };
}

export const usuarioService = {
  // Perfil de usuario
  async getPerfilUsuario(): Promise<Usuario> {
    const response = await api.get('perfil/');
    return response.data;
  },

  async updatePerfilUsuario(data: Partial<Usuario>): Promise<Usuario> {
    const response = await api.put('perfil/', data);
    return response.data;
  },

  async cambiarPassword(data: {
    password_actual: string;
    password_nueva: string;
    confirmar_password: string;
  }): Promise<{message: string}> {
    const response = await api.post('cambiar-password/', data);
    return response.data;
  },

  // Gestión de usuarios
  async getUsuarios(params?: {rol?: string}): Promise<any> {
    const response = await api.get('usuarios/', { params });
    return response.data;
  },

  async createUsuario(data: Partial<Usuario> & {password: string}): Promise<Usuario> {
    const response = await api.post('usuarios/', data);
    return response.data;
  },

  async updateUsuario(id: number, data: Partial<Usuario>): Promise<Usuario> {
    const response = await api.put(`usuarios/${id}/`, data);
    return response.data;
  },

  async deleteUsuario(id: number): Promise<void> {
    await api.delete(`usuarios/${id}/`);
  },

  async toggleEstadoUsuario(id: number): Promise<{message: string; estado: boolean}> {
    const response = await api.post(`usuarios/${id}/toggle-estado/`);
    return response.data;
  },

  // Roles
  async getRoles(): Promise<Rol[]> {
    const response = await api.get('roles/');
    return response.data;
  },

  async gestionGetRoles(): Promise<Rol[]> {
    const response = await api.get('gestion/roles/');
    return response.data;
  },

  async createRol(data: Partial<Rol>): Promise<Rol> {
    const response = await api.post('gestion/roles/', data);
    return response.data;
  },

  async updateRol(id: number, data: Partial<Rol>): Promise<Rol> {
    const response = await api.put(`gestion/roles/${id}/`, data);
    return response.data;
  },

  // Estadísticas
  async getEstadisticasUsuarios(): Promise<EstadisticasUsuarios> {
    const response = await api.get('estadisticas/');
    return response.data;
  },

  // Configuración del sistema
  async getConfiguracionSistema(): Promise<ConfiguracionSistema> {
    const response = await api.get('configuracion/');
    return response.data;
  }
};

export default usuarioService;