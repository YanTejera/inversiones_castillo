import api from './api';
import type { Fiador } from '../types';

interface FiadorCreateData {
  nombre: string;
  apellido: string;
  cedula: string;
  direccion: string;
  telefono?: string;
  cliente: number;
}

interface FiadorUpdateData extends Partial<FiadorCreateData> {
  id: number;
}

export const fiadorService = {
  async getFiador(clienteId: number): Promise<Fiador | null> {
    try {
      const response = await api.get(`/usuarios/clientes/${clienteId}/fiador/`);
      return response.data as Fiador;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No tiene fiador
      }
      throw error;
    }
  },

  async createFiador(data: FiadorCreateData): Promise<Fiador> {
    console.log('🔗 fiadorService.createFiador called with:', data);
    try {
      const response = await api.post('/usuarios/fiadores/', data);
      console.log('✅ fiadorService.createFiador success:', response.data);
      return response.data as Fiador;
    } catch (error: any) {
      console.error('❌ fiadorService.createFiador error:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  async createFiadorWithDocuments(fiadorData: FiadorCreateData, documentos?: Array<{tipo_documento: string, descripcion: string, archivo?: File}>): Promise<Fiador> {
    // Primero crear el fiador
    const fiador = await this.createFiador(fiadorData);
    
    // Luego crear los documentos si existen
    if (documentos && documentos.length > 0) {
      const { documentoService } = await import('./documentoService');
      
      for (const doc of documentos) {
        if (doc.descripcion.trim()) {
          await documentoService.createDocumento({
            cliente: fiadorData.cliente,
            propietario: 'fiador',
            tipo_documento: doc.tipo_documento,
            descripcion: doc.descripcion
          }, doc.archivo);
        }
      }
    }
    
    return fiador;
  },

  async updateFiador(data: FiadorUpdateData): Promise<Fiador> {
    console.log('🔗 fiadorService.updateFiador called with:', data);
    try {
      const { id, ...updateData } = data;
      console.log('Update data (without ID):', updateData);
      console.log('Updating fiador ID:', id);
      const response = await api.put(`/usuarios/fiadores/${id}/`, updateData);
      console.log('✅ fiadorService.updateFiador success:', response.data);
      return response.data as Fiador;
    } catch (error: any) {
      console.error('❌ fiadorService.updateFiador error:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  async deleteFiador(id: number): Promise<void> {
    await api.delete(`/usuarios/fiadores/${id}/`);
  }
};