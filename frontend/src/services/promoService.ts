interface PromocionActiva {
  id: number;
  codigo: string;
  tipo: 'porcentaje' | 'monto_fijo' | 'regalo';
  valor: number;
  descripcion: string;
  campana_id: number;
  campana_nombre: string;
  condiciones: {
    monto_minimo?: number;
    productos_incluidos?: string[];
    solo_primera_compra?: boolean;
    fecha_inicio: string;
    fecha_fin: string;
  };
  usos_maximos?: number;
  usos_actuales: number;
  aplicacion_automatica: boolean;
  segmento_objetivo: string[];
}

interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  segmento: string;
  es_primera_compra: boolean;
  fecha_registro: string;
}

interface ProductoVenta {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
}

interface DescuentoAplicado {
  promocion_id: number;
  codigo: string;
  tipo: 'porcentaje' | 'monto_fijo' | 'regalo';
  valor_descuento: number;
  descripcion: string;
  puede_remover: boolean;
  origen: 'automatico' | 'manual' | 'codigo';
}

class PromocionService {
  // Simular base de datos de promociones activas
  private promocionesActivas: PromocionActiva[] = [];

  constructor() {
    this.cargarPromociones();
  }

  private cargarPromociones() {
    // Cargar desde localStorage o API
    const campanasGuardadas = localStorage.getItem('campanas_comunicaciones');
    if (campanasGuardadas) {
      const campanas = JSON.parse(campanasGuardadas);
      this.promocionesActivas = campanas
        .filter((campana: any) =>
          campana.promocion?.activa &&
          campana.estado === 'Activa' &&
          this.esPromocionVigente(campana.promocion)
        )
        .map((campana: any) => ({
          id: campana.promocion.id || campana.id,
          codigo: campana.promocion.codigo_promocional,
          tipo: campana.promocion.tipo,
          valor: campana.promocion.valor,
          descripcion: campana.promocion.descripcion,
          campana_id: campana.id,
          campana_nombre: campana.nombre,
          condiciones: campana.promocion.condiciones,
          usos_maximos: campana.promocion.usos_maximos,
          usos_actuales: campana.promocion.usos_actuales || 0,
          aplicacion_automatica: campana.promocion.aplicacion_automatica,
          segmento_objetivo: campana.segmento_objetivo
        }));
    }
  }

  private esPromocionVigente(promocion: any): boolean {
    const hoy = new Date();
    const fechaInicio = new Date(promocion.condiciones.fecha_inicio);
    const fechaFin = new Date(promocion.condiciones.fecha_fin);

    return hoy >= fechaInicio && hoy <= fechaFin;
  }

  /**
   * Obtiene todas las promociones activas
   */
  getPromocionesActivas(): PromocionActiva[] {
    this.cargarPromociones(); // Actualizar antes de retornar
    return this.promocionesActivas;
  }

  /**
   * Busca promociones aplicables automáticamente para un cliente y productos
   */
  buscarPromocionesAutomaticas(
    cliente: Cliente,
    productos: ProductoVenta[],
    montoTotal: number
  ): DescuentoAplicado[] {
    const descuentos: DescuentoAplicado[] = [];

    for (const promo of this.promocionesActivas) {
      if (!promo.aplicacion_automatica) continue;

      if (this.validarPromocion(promo, cliente, productos, montoTotal)) {
        const descuento = this.calcularDescuento(promo, montoTotal, productos);
        if (descuento.valor_descuento > 0) {
          descuentos.push({
            ...descuento,
            promocion_id: promo.id,
            codigo: promo.codigo,
            origen: 'automatico',
            puede_remover: true
          });
        }
      }
    }

    // Ordenar por mejor descuento y retornar solo el mejor
    descuentos.sort((a, b) => b.valor_descuento - a.valor_descuento);
    return descuentos.slice(0, 1); // Solo el mejor descuento automático
  }

  /**
   * Valida y aplica un código promocional manualmente
   */
  aplicarCodigoPromocional(
    codigo: string,
    cliente: Cliente,
    productos: ProductoVenta[],
    montoTotal: number
  ): { success: boolean; descuento?: DescuentoAplicado; error?: string } {
    const promo = this.promocionesActivas.find(p => p.codigo === codigo.toUpperCase());

    if (!promo) {
      return { success: false, error: 'Código promocional no válido' };
    }

    if (!this.validarPromocion(promo, cliente, productos, montoTotal)) {
      return { success: false, error: 'Este código no es aplicable para esta compra' };
    }

    // Verificar usos máximos
    if (promo.usos_maximos && promo.usos_actuales >= promo.usos_maximos) {
      return { success: false, error: 'Este código promocional ha alcanzado su límite de usos' };
    }

    const descuento = this.calcularDescuento(promo, montoTotal, productos);

    if (descuento.valor_descuento <= 0) {
      return { success: false, error: 'No se puede aplicar descuento con este código' };
    }

    return {
      success: true,
      descuento: {
        ...descuento,
        promocion_id: promo.id,
        codigo: promo.codigo,
        origen: 'codigo',
        puede_remover: true
      }
    };
  }

  /**
   * Valida si una promoción es aplicable
   */
  private validarPromocion(
    promo: PromocionActiva,
    cliente: Cliente,
    productos: ProductoVenta[],
    montoTotal: number
  ): boolean {
    // Verificar segmento del cliente
    if (promo.segmento_objetivo.length > 0 && !promo.segmento_objetivo.includes(cliente.segmento)) {
      return false;
    }

    // Verificar si es solo para primera compra
    if (promo.condiciones.solo_primera_compra && !cliente.es_primera_compra) {
      return false;
    }

    // Verificar monto mínimo
    if (promo.condiciones.monto_minimo && montoTotal < promo.condiciones.monto_minimo) {
      return false;
    }

    // Verificar productos incluidos
    if (promo.condiciones.productos_incluidos && promo.condiciones.productos_incluidos.length > 0) {
      const tieneProductoIncluido = productos.some(producto =>
        promo.condiciones.productos_incluidos!.includes(producto.categoria) ||
        promo.condiciones.productos_incluidos!.includes(producto.nombre)
      );
      if (!tieneProductoIncluido) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calcula el descuento a aplicar
   */
  private calcularDescuento(
    promo: PromocionActiva,
    montoTotal: number,
    productos: ProductoVenta[]
  ): Omit<DescuentoAplicado, 'promocion_id' | 'codigo' | 'origen' | 'puede_remover'> {
    switch (promo.tipo) {
      case 'porcentaje':
        const descuentoPorcentaje = (montoTotal * promo.valor) / 100;
        return {
          tipo: 'porcentaje',
          valor_descuento: descuentoPorcentaje,
          descripcion: `${promo.valor}% de descuento - ${promo.descripcion || promo.campana_nombre}`
        };

      case 'monto_fijo':
        const descuentoFijo = Math.min(promo.valor, montoTotal);
        return {
          tipo: 'monto_fijo',
          valor_descuento: descuentoFijo,
          descripcion: `$${promo.valor.toLocaleString()} de descuento - ${promo.descripcion || promo.campana_nombre}`
        };

      case 'regalo':
        return {
          tipo: 'regalo',
          valor_descuento: 0,
          descripcion: `Regalo: ${promo.descripcion} - ${promo.campana_nombre}`
        };

      default:
        return {
          tipo: 'porcentaje',
          valor_descuento: 0,
          descripcion: 'Descuento no válido'
        };
    }
  }

  /**
   * Registra el uso de una promoción
   */
  registrarUsoPromocion(promocionId: number): void {
    const promo = this.promocionesActivas.find(p => p.id === promocionId);
    if (promo) {
      promo.usos_actuales++;
      // Aquí se guardaría en la base de datos real
      console.log(`Promoción ${promo.codigo} usada. Usos actuales: ${promo.usos_actuales}`);
    }
  }

  /**
   * Obtiene promociones aplicables para mostrar al vendedor
   */
  getPromocionesParaVendedor(
    cliente: Cliente,
    montoTotal: number
  ): Array<PromocionActiva & { es_aplicable: boolean; razon?: string }> {
    return this.promocionesActivas.map(promo => {
      let es_aplicable = true;
      let razon = '';

      // Verificar segmento
      if (promo.segmento_objetivo.length > 0 && !promo.segmento_objetivo.includes(cliente.segmento)) {
        es_aplicable = false;
        razon = `No aplica para segmento ${cliente.segmento}`;
      }

      // Verificar primera compra
      if (promo.condiciones.solo_primera_compra && !cliente.es_primera_compra) {
        es_aplicable = false;
        razon = 'Solo para primera compra';
      }

      // Verificar monto mínimo
      if (promo.condiciones.monto_minimo && montoTotal < promo.condiciones.monto_minimo) {
        es_aplicable = false;
        razon = `Monto mínimo $${promo.condiciones.monto_minimo.toLocaleString()}`;
      }

      // Verificar usos máximos
      if (promo.usos_maximos && promo.usos_actuales >= promo.usos_maximos) {
        es_aplicable = false;
        razon = 'Límite de usos alcanzado';
      }

      return {
        ...promo,
        es_aplicable,
        razon
      };
    });
  }
}

export const promocionService = new PromocionService();
export type { PromocionActiva, DescuentoAplicado, Cliente, ProductoVenta };