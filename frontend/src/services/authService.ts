import api from './api';
import type { User } from '../types';

interface LoginResponse {
  token: string;
  user: User;
  permisos?: string[];
  permisos_por_categoria?: { [categoria: string]: any[] };
}

interface LoginCredentials {
  username: string;
  password: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post('/usuarios/login/', credentials);
    const data = response.data as LoginResponse;
    const { token, user, permisos, permisos_por_categoria } = data;
    
    // Store token, user data and permissions
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    if (permisos) {
      localStorage.setItem('permisos', JSON.stringify(permisos));
    }
    
    if (permisos_por_categoria) {
      localStorage.setItem('permisos_por_categoria', JSON.stringify(permisos_por_categoria));
    }
    
    return { token, user, permisos, permisos_por_categoria };
  },

  async logout(): Promise<void> {
    try {
      await api.post('/usuarios/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('permisos');
      localStorage.removeItem('permisos_por_categoria');
    }
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
    return null;
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getPermisos(): string[] {
    const permisosStr = localStorage.getItem('permisos');
    if (permisosStr) {
      try {
        return JSON.parse(permisosStr);
      } catch (error) {
        console.error('Error parsing permisos data:', error);
        localStorage.removeItem('permisos');
      }
    }
    return [];
  },

  getPermisosPorCategoria(): { [categoria: string]: any[] } {
    const permisosStr = localStorage.getItem('permisos_por_categoria');
    if (permisosStr) {
      try {
        return JSON.parse(permisosStr);
      } catch (error) {
        console.error('Error parsing permisos_por_categoria data:', error);
        localStorage.removeItem('permisos_por_categoria');
      }
    }
    return {};
  }
};