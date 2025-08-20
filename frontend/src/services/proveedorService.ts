import api from './api';

export interface ProveedorListItem {
  id: number;
  nombre_completo: string;
  tipo_proveedor: string;
  ciudad: string;
  pais: string;
  contacto_principal: string;
  telefono_principal: string;
  email: string;
  estado: string;
  esta_activo: boolean;
  total_motocicletas: number;
  fecha_creacion: string;
}

export interface Proveedor {
  id?: number;
  nombre: string;
  nombre_comercial?: string;
  tipo_proveedor: 'distribuidor' | 'importador' | 'mayorista' | 'fabricante' | 'particular';
  ruc?: string;
  cedula?: string;
  registro_mercantil?: string;
  telefono?: string;
  telefono2?: string;
  email?: string;
  sitio_web?: string;
  direccion: string;
  ciudad: string;
  provincia?: string;
  pais: string;
  codigo_postal?: string;
  persona_contacto?: string;
  cargo_contacto?: string;
  telefono_contacto?: string;
  email_contacto?: string;
  moneda_preferida: 'USD' | 'RD' | 'EUR' | 'COP';
  terminos_pago?: string;
  limite_credito?: number;
  descuento_general?: number;
  estado: 'activo' | 'inactivo' | 'suspendido';
  fecha_inicio_relacion?: string;
  notas?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  creado_por?: number;
  nombre_completo?: string;
  contacto_principal?: string;
  telefono_principal?: string;
  email_principal?: string;
  esta_activo?: boolean;
  total_compras?: number;
  total_motocicletas?: number;
}

class ProveedorService {
  private basePath = '/motos/proveedores';

  async getProveedores(params?: {
    search?: string;
    estado?: string;
    tipo_proveedor?: string;
    pais?: string;
    activo?: boolean;
    ordering?: string;
  }): Promise<{ results: ProveedorListItem[], count: number }> {
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.estado) queryParams.append('estado', params.estado);
    if (params?.tipo_proveedor) queryParams.append('tipo_proveedor', params.tipo_proveedor);
    if (params?.pais) queryParams.append('pais', params.pais);
    if (params?.activo !== undefined) queryParams.append('activo', params.activo.toString());
    if (params?.ordering) queryParams.append('ordering', params.ordering);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}/?${queryString}` : `${this.basePath}/`;
    
    const response = await api.get(url);
    return response.data;
  }

  async getProveedor(id: number): Promise<Proveedor> {
    const response = await api.get(`${this.basePath}/${id}/`);
    return response.data;
  }

  async createProveedor(proveedorData: Omit<Proveedor, 'id' | 'fecha_creacion' | 'fecha_actualizacion' | 'creado_por'>): Promise<Proveedor> {
    const response = await api.post(`${this.basePath}/`, proveedorData);
    return response.data;
  }

  async updateProveedor(id: number, proveedorData: Partial<Proveedor>): Promise<Proveedor> {
    const response = await api.put(`${this.basePath}/${id}/`, proveedorData);
    return response.data;
  }

  async patchProveedor(id: number, proveedorData: Partial<Proveedor>): Promise<Proveedor> {
    const response = await api.patch(`${this.basePath}/${id}/`, proveedorData);
    return response.data;
  }

  async deleteProveedor(id: number): Promise<void> {
    await api.delete(`${this.basePath}/${id}/`);
  }

  async getProveedorEstadisticas(id: number): Promise<any> {
    try {
      const response = await api.get(`${this.basePath}/${id}/estadisticas/`);
      return response.data;
    } catch (error) {
      console.warn('Estadísticas no disponibles:', error);
      return null;
    }
  }

  async getProveedorMotocicletas(id: number): Promise<any> {
    try {
      const response = await api.get(`${this.basePath}/${id}/motocicletas/`);
      return response.data;
    } catch (error) {
      console.warn('Motocicletas del proveedor no disponibles:', error);
      return null;
    }
  }

  static getTiposProveedor() {
    return [
      { value: 'distribuidor', label: 'Distribuidor Oficial' },
      { value: 'importador', label: 'Importador' },
      { value: 'mayorista', label: 'Mayorista' },
      { value: 'fabricante', label: 'Fabricante' },
      { value: 'particular', label: 'Particular' }
    ];
  }

  static getEstados() {
    return [
      { value: 'activo', label: 'Activo' },
      { value: 'inactivo', label: 'Inactivo' },
      { value: 'suspendido', label: 'Suspendido' }
    ];
  }

  static getMonedas() {
    return [
      { value: 'USD', label: 'Dólares (USD)' },
      { value: 'RD', label: 'Pesos Dominicanos (RD)' },
      { value: 'EUR', label: 'Euros (EUR)' },
      { value: 'COP', label: 'Pesos Colombianos (COP)' }
    ];
  }

  static getPaises() {
    return [
      'República Dominicana',
      'Colombia',
      'Estados Unidos',
      'España',
      'México',
      'Brasil',
      'Argentina',
      'Otro'
    ];
  }
}

export const proveedorService = new ProveedorService();