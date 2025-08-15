import api from './api';
import type { Moto } from '../types';

interface MotoCreateData {
  marca: string;
  modelo: string;
  ano: number;
  color?: string;
  chasis?: string;
  precio_compra: number;
  precio_venta: number;
  cantidad_stock: number;
  descripcion?: string;
  imagen?: File;
  activa?: boolean;
}

interface MotoListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Moto[];
}

export const motoService = {
  async getMotos(page = 1, search = ''): Promise<MotoListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (search) {
      params.append('search', search);
    }
    
    const response = await api.get(`/motos/?${params.toString()}`);
    return response.data as MotoListResponse;
  },

  async getMoto(id: number): Promise<Moto> {
    const response = await api.get(`/motos/${id}/`);
    return response.data as Moto;
  },

  async createMoto(data: MotoCreateData): Promise<Moto> {
    const formData = new FormData();
    
    // Agregar campos básicos
    formData.append('marca', data.marca);
    formData.append('modelo', data.modelo);
    formData.append('ano', data.ano.toString());
    formData.append('precio_compra', data.precio_compra.toString());
    formData.append('precio_venta', data.precio_venta.toString());
    formData.append('cantidad_stock', data.cantidad_stock.toString());
    
    // Agregar campos opcionales
    if (data.color) formData.append('color', data.color);
    if (data.chasis) formData.append('chasis', data.chasis);
    if (data.descripcion) formData.append('descripcion', data.descripcion);
    if (data.activa !== undefined) formData.append('activa', data.activa.toString());
    
    // Agregar imagen si existe
    if (data.imagen) {
      formData.append('imagen', data.imagen);
    }

    const response = await api.post('/motos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as Moto;
  },

  async updateMoto(id: number, data: Partial<MotoCreateData>): Promise<Moto> {
    const formData = new FormData();
    
    // Agregar solo los campos que se están actualizando
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'imagen' && value instanceof File) {
          formData.append(key, value);
        } else if (key !== 'imagen') {
          formData.append(key, value.toString());
        }
      }
    });

    const response = await api.patch(`/motos/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as Moto;
  },

  async deleteMoto(id: number): Promise<void> {
    await api.delete(`/motos/${id}/`);
  },

  async searchMotos(query: string): Promise<Moto[]> {
    const response = await api.get(`/motos/?search=${encodeURIComponent(query)}`);
    const data = response.data as MotoListResponse;
    return data.results;
  },

  async getMotosDisponibles(): Promise<Moto[]> {
    const response = await api.get('/motos/?disponible=true');
    const data = response.data as MotoListResponse;
    return data.results;
  },

  async updateStock(id: number, cantidad: number): Promise<Moto> {
    const response = await api.patch(`/motos/${id}/`, {
      cantidad_stock: cantidad
    });
    return response.data as Moto;
  }
};