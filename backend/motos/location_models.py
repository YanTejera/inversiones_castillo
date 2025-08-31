from django.db import models
from django.core.validators import RegexValidator
import uuid


class Almacen(models.Model):
    """Modelo para almacenes/bodegas principales"""
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=10, unique=True)
    direccion = models.TextField(blank=True)
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Almacén"
        verbose_name_plural = "Almacenes"
        
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Zona(models.Model):
    """Modelo para zonas dentro de un almacén"""
    TIPOS_ZONA = [
        ('nueva', 'Motocicletas Nuevas'),
        ('usada', 'Motocicletas Usadas'),
        ('reparacion', 'En Reparación'),
        ('exhibicion', 'Exhibición'),
        ('repuestos', 'Repuestos'),
        ('otros', 'Otros'),
    ]
    
    almacen = models.ForeignKey(Almacen, on_delete=models.CASCADE, related_name='zonas')
    nombre = models.CharField(max_length=50)
    codigo = models.CharField(max_length=20)
    tipo = models.CharField(max_length=20, choices=TIPOS_ZONA, default='nueva')
    capacidad_maxima = models.PositiveIntegerField(help_text="Número máximo de unidades")
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Zona"
        verbose_name_plural = "Zonas"
        unique_together = ['almacen', 'codigo']
        
    def __str__(self):
        return f"{self.almacen.codigo}-{self.codigo} ({self.nombre})"
    
    @property
    def ocupacion_actual(self):
        """Calcula cuántas unidades hay actualmente en esta zona"""
        return self.ubicaciones.filter(activo=True).count()  # Simplificado por ahora
    
    @property
    def porcentaje_ocupacion(self):
        """Calcula el porcentaje de ocupación"""
        if self.capacidad_maxima > 0:
            return min((self.ocupacion_actual / self.capacidad_maxima) * 100, 100)
        return 0


class Pasillo(models.Model):
    """Modelo para pasillos dentro de una zona"""
    zona = models.ForeignKey(Zona, on_delete=models.CASCADE, related_name='pasillos')
    nombre = models.CharField(max_length=50)
    codigo = models.CharField(max_length=20)
    numero_orden = models.PositiveIntegerField(default=1, help_text="Orden para mostrar en la UI")
    activo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Pasillo"
        verbose_name_plural = "Pasillos"
        unique_together = ['zona', 'codigo']
        ordering = ['numero_orden', 'codigo']
        
    def __str__(self):
        return f"{self.zona.almacen.codigo}-{self.zona.codigo}-{self.codigo}"


class Ubicacion(models.Model):
    """Modelo para ubicaciones específicas (estantes, espacios)"""
    TIPOS_UBICACION = [
        ('estante', 'Estante'),
        ('piso', 'Piso'),
        ('colgante', 'Colgante'),
        ('exterior', 'Exterior'),
        ('especial', 'Especial'),
    ]
    
    pasillo = models.ForeignKey(Pasillo, on_delete=models.CASCADE, related_name='ubicaciones')
    nombre = models.CharField(max_length=50)
    codigo = models.CharField(max_length=20)
    tipo = models.CharField(max_length=20, choices=TIPOS_UBICACION, default='estante')
    nivel = models.CharField(max_length=20, blank=True, help_text="Nivel del estante (A, B, C, etc.)")
    posicion = models.CharField(max_length=20, blank=True, help_text="Posición específica (1, 2, 3, etc.)")
    
    # Capacidad y dimensiones
    capacidad_maxima = models.PositiveIntegerField(default=1, help_text="Número máximo de unidades")
    largo_cm = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    ancho_cm = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    alto_cm = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    
    # QR Code
    qr_code_uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    qr_code_generado = models.BooleanField(default=False)
    fecha_ultimo_qr = models.DateTimeField(blank=True, null=True)
    
    # Estado
    activo = models.BooleanField(default=True)
    reservado = models.BooleanField(default=False, help_text="Ubicación reservada temporalmente")
    notas = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Ubicación"
        verbose_name_plural = "Ubicaciones"
        unique_together = ['pasillo', 'codigo']
        
    def __str__(self):
        return self.codigo_completo
    
    @property
    def codigo_completo(self):
        """Retorna el código completo de la ubicación"""
        return f"{self.pasillo.zona.almacen.codigo}-{self.pasillo.zona.codigo}-{self.pasillo.codigo}-{self.codigo}"
    
    @property
    def direccion_legible(self):
        """Retorna la dirección en formato legible"""
        partes = [
            f"Almacén {self.pasillo.zona.almacen.nombre}",
            f"Zona {self.pasillo.zona.nombre}",
            f"Pasillo {self.pasillo.nombre}",
            f"Ubicación {self.nombre}"
        ]
        if self.nivel:
            partes.append(f"Nivel {self.nivel}")
        if self.posicion:
            partes.append(f"Posición {self.posicion}")
        return " → ".join(partes)
    
    @property
    def ocupacion_actual(self):
        """Calcula cuántas unidades hay actualmente en esta ubicación"""
        return self.inventario_items.count()  # Simplificado por ahora
    
    @property
    def disponible(self):
        """Verifica si la ubicación tiene espacio disponible"""
        return self.activo and not self.reservado and self.ocupacion_actual < self.capacidad_maxima
    
    @property
    def espacios_libres(self):
        """Calcula cuántos espacios libres quedan"""
        return max(0, self.capacidad_maxima - self.ocupacion_actual)


class MovimientoInventario(models.Model):
    """Historial de movimientos de inventario entre ubicaciones"""
    TIPOS_MOVIMIENTO = [
        ('ingreso', 'Ingreso Initial'),
        ('traslado', 'Traslado entre Ubicaciones'),
        ('venta', 'Venta'),
        ('ajuste', 'Ajuste de Inventario'),
        ('mantenimiento', 'Mantenimiento/Reparación'),
        ('devolucion', 'Devolución'),
    ]
    
    # Relación con inventario
    inventario_item = models.ForeignKey(
        'MotoInventario', 
        on_delete=models.CASCADE, 
        related_name='movimientos_ubicacion'
    )
    
    # Ubicaciones
    ubicacion_origen = models.ForeignKey(
        Ubicacion, 
        on_delete=models.CASCADE, 
        related_name='movimientos_salida',
        blank=True, 
        null=True
    )
    ubicacion_destino = models.ForeignKey(
        Ubicacion, 
        on_delete=models.CASCADE, 
        related_name='movimientos_entrada'
    )
    
    # Detalles del movimiento
    tipo_movimiento = models.CharField(max_length=20, choices=TIPOS_MOVIMIENTO)
    cantidad = models.PositiveIntegerField(default=1)
    motivo = models.TextField(help_text="Razón del movimiento")
    observaciones = models.TextField(blank=True)
    
    # Metadatos
    usuario_responsable = models.CharField(max_length=100, blank=True)
    fecha_movimiento = models.DateTimeField(auto_now_add=True)
    confirmado = models.BooleanField(default=True)
    
    # Referencias externas (opcional)
    numero_documento = models.CharField(max_length=50, blank=True, help_text="Número de orden, factura, etc.")
    
    class Meta:
        verbose_name = "Movimiento de Inventario"
        verbose_name_plural = "Movimientos de Inventario"
        ordering = ['-fecha_movimiento']
        
    def __str__(self):
        origen = self.ubicacion_origen.codigo_completo if self.ubicacion_origen else "N/A"
        destino = self.ubicacion_destino.codigo_completo
        return f"{self.inventario_item} | {origen} → {destino} ({self.fecha_movimiento.strftime('%Y-%m-%d')})"


# Extensión del modelo existente MotoInventario para agregar ubicación
class MotoInventarioLocation(models.Model):
    """Modelo intermedio para relacionar inventario con ubicaciones"""
    inventario = models.OneToOneField(
        'MotoInventario',
        on_delete=models.CASCADE,
        related_name='ubicacion_actual'
    )
    ubicacion = models.ForeignKey(
        Ubicacion,
        on_delete=models.CASCADE,
        related_name='inventario_items'
    )
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Asignación de Ubicación"
        verbose_name_plural = "Asignaciones de Ubicación"
        
    def __str__(self):
        return f"{self.inventario} en {self.ubicacion.codigo_completo}"