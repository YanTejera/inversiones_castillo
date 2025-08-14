import api from './api';
import type { Cliente } from '../types';

interface ClienteCreateData {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  estado_civil?: string;
  ocupacion?: string;
  ingresos?: number;
  referencias_personales?: string;
}

interface ClienteListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Cliente[];
}

export const clienteService = {
  async getClientes(page = 1, search = ''): Promise<ClienteListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (search) {
      params.append('search', search);
    }
    
    const response = await api.get(`/usuarios/clientes/?${params.toString()}`);
    return response.data as ClienteListResponse;
  },

  async getCliente(id: number): Promise<Cliente> {
    const response = await api.get(`/usuarios/clientes/${id}/`);
    return response.data as Cliente;
  },

  async createCliente(data: ClienteCreateData): Promise<Cliente> {
    const response = await api.post('/usuarios/clientes/', data);
    return response.data as Cliente;
  },

  async updateCliente(id: number, data: Partial<ClienteCreateData>): Promise<Cliente> {
    const response = await api.patch(`/usuarios/clientes/${id}/`, data);
    return response.data as Cliente;
  },

  async deleteCliente(id: number): Promise<void> {
    await api.delete(`/usuarios/clientes/${id}/`);
  },

  async searchClientes(query: string): Promise<Cliente[]> {
    const response = await api.get(`/usuarios/clientes/?search=${encodeURIComponent(query)}`);
    return response.data.results as Cliente[];
  }
};