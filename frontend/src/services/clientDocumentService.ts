import api from './api';

export interface ClientDocument {
  id: number;
  cliente_id: number;
  venta_id?: number;
  tipo_documento: string;
  nombre_archivo: string;
  archivo: string; // URL del archivo
  fecha_subida: string;
  descripcion?: string;
  es_legal: boolean;
  categoria: 'identificacion' | 'ingresos' | 'referencias' | 'legal' | 'factura' | 'contrato' | 'otro';
}

export interface DocumentUploadData {
  cliente_id: number;
  venta_id?: number;
  tipo_documento: string;
  archivo: File;
  descripcion?: string;
  es_legal?: boolean;
  categoria: 'identificacion' | 'ingresos' | 'referencias' | 'legal' | 'factura' | 'contrato' | 'otro';
}

export const clientDocumentService = {
  async getClientDocuments(clienteId: number): Promise<ClientDocument[]> {
    const response = await api.get(`/clientes/${clienteId}/documentos/`);
    return response.data;
  },

  async getVentaDocuments(ventaId: number): Promise<ClientDocument[]> {
    const response = await api.get(`/ventas/${ventaId}/documentos/`);
    return response.data;
  },

  async uploadDocument(data: DocumentUploadData): Promise<ClientDocument> {
    const formData = new FormData();
    formData.append('cliente_id', data.cliente_id.toString());
    if (data.venta_id) {
      formData.append('venta_id', data.venta_id.toString());
    }
    formData.append('tipo_documento', data.tipo_documento);
    formData.append('archivo', data.archivo);
    formData.append('categoria', data.categoria);
    formData.append('es_legal', (data.es_legal || false).toString());
    if (data.descripcion) {
      formData.append('descripcion', data.descripcion);
    }

    const response = await api.post('/documentos/cliente/', formData, {
      headers: {
        'Content-Type': undefined, // Let browser set it automatically with boundary
      },
      transformRequest: [(data) => data], // Don't transform FormData
    });
    return response.data;
  },

  async deleteDocument(documentId: number): Promise<void> {
    await api.delete(`/documentos/cliente/${documentId}/`);
  },

  async downloadDocument(documentId: number): Promise<Blob> {
    const response = await api.get(`/documentos/cliente/${documentId}/download/`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async generateContract(ventaId: number, templateType: string = 'compraventa'): Promise<ClientDocument> {
    const response = await api.post(`/ventas/${ventaId}/generar-contrato/`, {
      template: templateType
    });
    return response.data;
  },

  async generateInvoice(ventaId: number): Promise<ClientDocument> {
    const response = await api.post(`/ventas/${ventaId}/generar-factura/`);
    return response.data;
  },

  // Función para almacenar documentos de una venta específica
  async saveVentaDocuments(ventaId: number, clienteId: number, documents: File[], documentTypes: Record<string, string>): Promise<ClientDocument[]> {
    const uploadPromises = documents.map((file, index) => {
      const documentType = documentTypes[file.name] || 'otro';
      const categoria = this.getCategoriaFromType(documentType);
      
      return this.uploadDocument({
        cliente_id: clienteId,
        venta_id: ventaId,
        tipo_documento: documentType,
        archivo: file,
        categoria,
        es_legal: categoria === 'legal'
      });
    });

    return Promise.all(uploadPromises);
  },

  getCategoriaFromType(tipoDocumento: string): 'identificacion' | 'ingresos' | 'referencias' | 'legal' | 'factura' | 'contrato' | 'otro' {
    if (tipoDocumento.includes('cedula')) return 'identificacion';
    if (tipoDocumento.includes('ingresos') || tipoDocumento.includes('laboral')) return 'ingresos';
    if (tipoDocumento.includes('referencias')) return 'referencias';
    if (tipoDocumento.includes('contrato') || tipoDocumento.includes('compraventa')) return 'contrato';
    if (tipoDocumento.includes('factura') || tipoDocumento.includes('recibo')) return 'factura';
    if (tipoDocumento.includes('legal') || tipoDocumento.includes('autorizacion')) return 'legal';
    return 'otro';
  }
};