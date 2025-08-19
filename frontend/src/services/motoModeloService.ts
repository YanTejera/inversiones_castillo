import api from './api';
import type { MotoModelo, MotoInventario } from '../types';

interface CreateMotoModeloData {
  marca: string;
  modelo: string;
  ano: number;
  condicion?: 'nueva' | 'usada';
  descripcion?: string;
  imagen?: File;
  precio_compra: number;
  precio_venta: number;
  moneda_compra?: 'USD' | 'RD' | 'EUR' | 'COP';
  moneda_venta?: 'USD' | 'RD' | 'EUR' | 'COP';
  activa: boolean;
  inventario_data?: Array<{
    color: string;
    chasis?: string;
    chasis_list?: string[];
    cantidad_stock: number;
    descuento_porcentaje?: number;
  }>;
}

interface UpdateMotoModeloData extends Partial<CreateMotoModeloData> {
  id: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const motoModeloService = {
  async getModelos(page = 1, search = ''): Promise<PaginatedResponse<MotoModelo>> {
    const params = new URLSearchParams({
      page: page.toString(),
      ...(search && { search })
    });
    
    const response = await api.get(`/motos/modelos/?${params}`);
    return response.data;
  },

  async getModelo(id: number): Promise<MotoModelo> {
    const response = await api.get(`/motos/modelos/${id}/`);
    return response.data;
  },

  async createModelo(data: CreateMotoModeloData): Promise<MotoModelo> {
    const formData = new FormData();
    
    formData.append('marca', data.marca);
    formData.append('modelo', data.modelo);
    formData.append('ano', data.ano.toString());
    formData.append('precio_compra', data.precio_compra.toString());
    formData.append('precio_venta', data.precio_venta.toString());
    formData.append('activa', data.activa.toString());
    
    if (data.condicion) {
      formData.append('condicion', data.condicion);
    }
    
    if (data.moneda_compra) {
      formData.append('moneda_compra', data.moneda_compra);
    }
    
    if (data.moneda_venta) {
      formData.append('moneda_venta', data.moneda_venta);
    }
    
    if (data.descripcion) {
      formData.append('descripcion', data.descripcion);
    }
    
    if (data.imagen && data.imagen instanceof File) {
      console.log('Image details:', {
        name: data.imagen.name,
        size: data.imagen.size,
        type: data.imagen.type,
        lastModified: data.imagen.lastModified
      });
      formData.append('imagen', data.imagen);
      console.log('Successfully added image to FormData');
    } else {
      console.log('No valid image file to add');
    }
    
    if (data.inventario_data) {
      console.log('Adding inventario_data:', data.inventario_data);
      // Convert chasis_list to chasis for backend compatibility
      const cleanedInventarioData = data.inventario_data.map(item => {
        const { chasis_list, ...cleanItem } = item;
        // Use first chasis from chasis_list if available, otherwise keep existing chasis
        if (chasis_list && chasis_list.length > 0) {
          cleanItem.chasis = chasis_list[0];
        }
        return cleanItem;
      });
      console.log('Cleaned inventario_data:', cleanedInventarioData);
      formData.append('inventario_data', JSON.stringify(cleanedInventarioData));
    }

    console.log('Making POST request to /motos/modelos/');
    console.log('Auth token from localStorage:', localStorage.getItem('token'));
    
    try {
      const response = await api.post('/motos/modelos/', formData, {
        headers: {
          'Content-Type': undefined, // Let browser set it automatically
        },
        transformRequest: [(data) => data], // Don't transform FormData
      });
      console.log('Success response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Service error:', error);
      console.error('Service error response:', error.response?.data);
      console.error('Service error status:', error.response?.status);
      throw error;
    }
  },

  async updateModelo(data: UpdateMotoModeloData): Promise<MotoModelo> {
    const { id, ...updateData } = data;
    const formData = new FormData();
    
    console.log('🔄 === ACTUALIZANDO MODELO ===');
    console.log('📝 Data recibida:', updateData);
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'imagen' && value instanceof File) {
          console.log('🖼️ Agregando imagen:', value.name);
          formData.append(key, value);
        } else if (key === 'inventario_data' && Array.isArray(value)) {
          console.log('📦 Agregando inventario_data:', value);
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'boolean') {
          console.log(`✅ Agregando ${key}:`, value.toString());
          formData.append(key, value.toString());
        } else if (typeof value === 'number') {
          console.log(`🔢 Agregando ${key}:`, value.toString());
          formData.append(key, value.toString());
        } else if (typeof value === 'string') {
          console.log(`📝 Agregando ${key}:`, value);
          formData.append(key, value);
        } else {
          console.log(`⚠️ Tipo no manejado para ${key}:`, typeof value, value);
        }
      }
    });

    console.log('📤 Enviando PUT request a /motos/modelos/' + id + '/');

    try {
      const response = await api.put(`/motos/modelos/${id}/`, formData, {
        headers: {
          'Content-Type': undefined, // Let browser set it automatically
        },
        transformRequest: [(data) => data], // Don't transform FormData
      });
      console.log('✅ Update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Update error:', error);
      console.error('❌ Update error response:', error.response?.data);
      console.error('❌ Update error status:', error.response?.status);
      throw error;
    }
  },

  async deleteModelo(id: number): Promise<void> {
    await api.delete(`/motos/modelos/${id}/`);
  },

  // Inventario específico
  async getInventario(modeloId: number): Promise<MotoInventario[]> {
    const response = await api.get(`/motos/modelos/${modeloId}/inventario/`);
    return response.data;
  },

  async createInventario(modeloId: number, data: Omit<MotoInventario, 'id' | 'fecha_ingreso'>): Promise<MotoInventario> {
    const response = await api.post(`/motos/modelos/${modeloId}/inventario/`, data);
    return response.data;
  },

  async updateInventario(id: number, data: Partial<MotoInventario>): Promise<MotoInventario> {
    const response = await api.put(`/motos/inventario/${id}/`, data);
    return response.data;
  },

  async deleteInventario(id: number): Promise<void> {
    await api.delete(`/motos/inventario/${id}/`);
  },

  // Venta directa
  async prepararVentaDirecta(data: {
    modelo_id: number;
    color: string;
    cantidad: number;
    cliente_id: number;
  }): Promise<any> {
    const response = await api.post('/motos/venta-directa/', data);
    return response.data;
  },

  // Estadísticas del modelo
  async getEstadisticasModelo(modeloId: number): Promise<any> {
    const response = await api.get(`/motos/modelos/${modeloId}/estadisticas/`);
    return response.data;
  }
};