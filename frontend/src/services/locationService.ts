import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/motos';

class LocationService {
  // Almacenes
  async getAlmacenes() {
    const response = await axios.get(`${API_BASE_URL}/almacenes/`);
    return response.data;
  }

  async createAlmacen(data: any) {
    const response = await axios.post(`${API_BASE_URL}/almacenes/`, data);
    return response.data;
  }

  async updateAlmacen(id: number, data: any) {
    const response = await axios.put(`${API_BASE_URL}/almacenes/${id}/`, data);
    return response.data;
  }

  async deleteAlmacen(id: number) {
    await axios.delete(`${API_BASE_URL}/almacenes/${id}/`);
  }

  async getAlmacenStats(id: number) {
    const response = await axios.get(`${API_BASE_URL}/almacenes/${id}/estadisticas/`);
    return response.data;
  }

  // Zonas
  async getZonas(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
    }
    
    const response = await axios.get(`${API_BASE_URL}/zonas/?${params.toString()}`);
    return response.data;
  }

  async createZona(data: any) {
    const response = await axios.post(`${API_BASE_URL}/zonas/`, data);
    return response.data;
  }

  async updateZona(id: number, data: any) {
    const response = await axios.put(`${API_BASE_URL}/zonas/${id}/`, data);
    return response.data;
  }

  async deleteZona(id: number) {
    await axios.delete(`${API_BASE_URL}/zonas/${id}/`);
  }

  // Pasillos
  async getPasillos(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
    }
    
    const response = await axios.get(`${API_BASE_URL}/pasillos/?${params.toString()}`);
    return response.data;
  }

  async createPasillo(data: any) {
    const response = await axios.post(`${API_BASE_URL}/pasillos/`, data);
    return response.data;
  }

  async updatePasillo(id: number, data: any) {
    const response = await axios.put(`${API_BASE_URL}/pasillos/${id}/`, data);
    return response.data;
  }

  async deletePasillo(id: number) {
    await axios.delete(`${API_BASE_URL}/pasillos/${id}/`);
  }

  // Ubicaciones
  async getUbicaciones(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
    }
    
    const response = await axios.get(`${API_BASE_URL}/ubicaciones/?${params.toString()}`);
    return response.data;
  }

  async getUbicacion(id: number) {
    const response = await axios.get(`${API_BASE_URL}/ubicaciones/${id}/`);
    return response.data;
  }

  async createUbicacion(data: any) {
    const response = await axios.post(`${API_BASE_URL}/ubicaciones/`, data);
    return response.data;
  }

  async updateUbicacion(id: number, data: any) {
    const response = await axios.put(`${API_BASE_URL}/ubicaciones/${id}/`, data);
    return response.data;
  }

  async deleteUbicacion(id: number) {
    await axios.delete(`${API_BASE_URL}/ubicaciones/${id}/`);
  }

  // Generar QR para ubicación
  async generateQR(ubicacionId: number) {
    const response = await axios.post(`${API_BASE_URL}/ubicaciones/${ubicacionId}/generar_qr/`);
    return response.data;
  }

  // Obtener inventario de ubicación
  async getUbicacionInventario(ubicacionId: number) {
    const response = await axios.get(`${API_BASE_URL}/ubicaciones/${ubicacionId}/inventario/`);
    return response.data;
  }

  // Movimientos de inventario
  async getMovimientos(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
    }
    
    const response = await axios.get(`${API_BASE_URL}/movimientos/?${params.toString()}`);
    return response.data;
  }

  async createMovimiento(data: any) {
    const response = await axios.post(`${API_BASE_URL}/movimientos/`, data);
    return response.data;
  }

  // Estadísticas generales del sistema de ubicaciones
  async getLocationStats() {
    const response = await axios.get(`${API_BASE_URL}/locations/`);
    return response.data;
  }

  // Escanear código QR
  async scanQR(qrData: string) {
    const response = await axios.post(`${API_BASE_URL}/qr-scan/`, {
      qr_data: qrData
    });
    return response.data;
  }

  // Buscar ubicaciones disponibles
  async getUbicacionesDisponibles(filters?: any) {
    const params = new URLSearchParams();
    params.append('disponible', 'true');
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
    }
    
    const response = await axios.get(`${API_BASE_URL}/ubicaciones/?${params.toString()}`);
    return response.data;
  }

  // Asignar inventario a ubicación
  async asignarInventarioAUbicacion(inventarioId: number, ubicacionId: number) {
    const response = await axios.post(`${API_BASE_URL}/movimientos/`, {
      inventario_item: inventarioId,
      ubicacion_destino: ubicacionId,
      tipo_movimiento: 'ingreso',
      motivo: 'Asignación inicial de ubicación',
      cantidad: 1
    });
    return response.data;
  }

  // Mover inventario entre ubicaciones
  async moverInventario(data: {
    inventario_item: number;
    ubicacion_origen: number;
    ubicacion_destino: number;
    motivo: string;
    cantidad?: number;
  }) {
    const response = await axios.post(`${API_BASE_URL}/movimientos/`, {
      ...data,
      tipo_movimiento: 'traslado',
      cantidad: data.cantidad || 1
    });
    return response.data;
  }

  // Obtener historial de movimientos de una ubicación
  async getHistorialUbicacion(ubicacionId: number) {
    const response = await axios.get(`${API_BASE_URL}/movimientos/?ubicacion_destino=${ubicacionId}`);
    return response.data;
  }

  // Reservar/Liberar ubicación
  async toggleReservaUbicacion(ubicacionId: number, reservado: boolean) {
    const response = await axios.patch(`${API_BASE_URL}/ubicaciones/${ubicacionId}/`, {
      reservado: reservado
    });
    return response.data;
  }

  // Activar/Desactivar ubicación
  async toggleActivoUbicacion(ubicacionId: number, activo: boolean) {
    const response = await axios.patch(`${API_BASE_URL}/ubicaciones/${ubicacionId}/`, {
      activo: activo
    });
    return response.data;
  }

  // Buscar ubicaciones por código QR UUID
  async findUbicacionByUUID(uuid: string) {
    const response = await axios.get(`${API_BASE_URL}/ubicaciones/?qr_code_uuid=${uuid}`);
    return response.data;
  }

  // Obtener reporte de ocupación por zona
  async getReporteOcupacionZonas() {
    const response = await axios.get(`${API_BASE_URL}/locations/`);
    return response.data.distribucion_zonas;
  }

  // Obtener ubicaciones con mayor ocupación
  async getUbicacionesMasOcupadas() {
    const response = await axios.get(`${API_BASE_URL}/locations/`);
    return response.data.ubicaciones_mas_ocupadas;
  }

  // Obtener movimientos recientes
  async getMovimientosRecientes() {
    const response = await axios.get(`${API_BASE_URL}/locations/`);
    return response.data.movimientos_recientes;
  }
}

export const locationService = new LocationService();