import api from './api';
import type { Documento } from '../types';

interface DocumentoCreateData {
  cliente: number;
  propietario: string;
  tipo_documento: string;
  descripcion: string;
}

interface DocumentoUpdateData extends Partial<DocumentoCreateData> {
  id: number;
}

export const documentoService = {
  async getDocumentos(clienteId: number): Promise<Documento[]> {
    const response = await api.get(`/usuarios/clientes/${clienteId}/documentos/`);
    return response.data as Documento[];
  },

  async getDocumento(id: number): Promise<Documento> {
    const response = await api.get(`/usuarios/documentos/${id}/`);
    return response.data as Documento;
  },

  async createDocumento(data: DocumentoCreateData, archivo?: File): Promise<Documento> {
    const formData = new FormData();
    formData.append('cliente', data.cliente.toString());
    formData.append('propietario', data.propietario);
    formData.append('tipo_documento', data.tipo_documento);
    formData.append('descripcion', data.descripcion);
    
    if (archivo) {
      formData.append('archivo', archivo);
    }

    const response = await api.post('/usuarios/documentos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as Documento;
  },

  async updateDocumento(data: DocumentoUpdateData, archivo?: File): Promise<Documento> {
    const { id, ...updateData } = data;
    const formData = new FormData();
    
    if (updateData.cliente) formData.append('cliente', updateData.cliente.toString());
    if (updateData.propietario) formData.append('propietario', updateData.propietario);
    if (updateData.tipo_documento) formData.append('tipo_documento', updateData.tipo_documento);
    if (updateData.descripcion) formData.append('descripcion', updateData.descripcion);
    
    if (archivo) {
      formData.append('archivo', archivo);
    }

    const response = await api.put(`/usuarios/documentos/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as Documento;
  },

  async deleteDocumento(id: number): Promise<void> {
    await api.delete(`/usuarios/documentos/${id}/`);
  }
};