from django.db import models
from decimal import Decimal

class MotoModelo(models.Model):
    """Modelo base de motocicleta sin color específico"""
    CONDICION_CHOICES = [
        ('nueva', 'Nueva'),
        ('usada', 'Usada'),
    ]
    
    TIPO_MOTOR_CHOICES = [
        ('2_tiempos', '2 Tiempos'),
        ('4_tiempos', '4 Tiempos'),
        ('electrico', 'Eléctrico'),
    ]
    
    MONEDA_CHOICES = [
        ('USD', 'Dólares (USD)'),
        ('RD', 'Pesos Dominicanos (RD)'),
        ('EUR', 'Euros (EUR)'),
        ('COP', 'Pesos Colombianos (COP)'),
    ]
    
    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    ano = models.IntegerField(verbose_name='Año')
    condicion = models.CharField(max_length=10, choices=CONDICION_CHOICES, default='nueva', verbose_name='Condición')
    
    # Especificaciones técnicas
    cilindraje = models.IntegerField(blank=True, null=True, help_text="Cilindraje en CC")
    tipo_motor = models.CharField(max_length=20, choices=TIPO_MOTOR_CHOICES, blank=True, null=True)
    potencia = models.CharField(max_length=50, blank=True, null=True, help_text="Ej: 15 HP @ 8000 RPM")
    torque = models.CharField(max_length=50, blank=True, null=True, help_text="Ej: 12 Nm @ 6000 RPM")
    combustible = models.CharField(max_length=50, blank=True, null=True, default="Gasolina")
    transmision = models.CharField(max_length=50, blank=True, null=True, help_text="Ej: Manual 5 velocidades")
    peso = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True, help_text="Peso en kg")
    capacidad_tanque = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Capacidad del tanque en litros")
    
    descripcion = models.TextField(blank=True, null=True)
    imagen = models.ImageField(upload_to='motos/', blank=True, null=True)
    precio_compra = models.DecimalField(max_digits=12, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=12, decimal_places=2)
    moneda_compra = models.CharField(max_length=3, choices=MONEDA_CHOICES, default='USD', verbose_name='Moneda de Compra')
    moneda_venta = models.CharField(max_length=3, choices=MONEDA_CHOICES, default='RD', verbose_name='Moneda de Venta')
    activa = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Modelo de Moto'
        verbose_name_plural = 'Modelos de Motos'
        ordering = ['-fecha_creacion']
        unique_together = ['marca', 'modelo', 'ano']
    
    def __str__(self):
        return f"{self.marca} {self.modelo} {self.ano}"
    
    @property
    def ganancia(self):
        return self.precio_venta - self.precio_compra
    
    @property
    def total_stock(self):
        return sum(item.cantidad_stock for item in self.inventario.all())
    
    @property
    def disponible(self):
        return self.total_stock > 0 and self.activa

class MotoInventario(models.Model):
    """Inventario específico por color de cada modelo de moto"""
    modelo = models.ForeignKey(MotoModelo, on_delete=models.CASCADE, related_name='inventario')
    color = models.CharField(max_length=50)
    chasis = models.CharField(max_length=100, unique=True, blank=True, null=True)
    cantidad_stock = models.IntegerField(default=1)
    descuento_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Descuento en porcentaje para este color específico")
    fecha_ingreso = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Inventario de Moto'
        verbose_name_plural = 'Inventario de Motos'
        ordering = ['-fecha_ingreso']
        # Removed unique_together to allow multiple entries per color
    
    def __str__(self):
        chasis_str = f" - {self.chasis}" if self.chasis else ""
        return f"{self.modelo} {self.color} (Stock: {self.cantidad_stock}){chasis_str}"
    
    @property
    def precio_con_descuento(self):
        """Precio de venta del modelo con el descuento aplicado para este color"""
        if self.descuento_porcentaje > 0:
            descuento = self.modelo.precio_venta * (self.descuento_porcentaje / 100)
            return self.modelo.precio_venta - descuento
        return self.modelo.precio_venta

# Mantenemos el modelo Moto original para compatibilidad hacia atrás
class Moto(models.Model):
    CONDICION_CHOICES = [
        ('nueva', 'Nueva'),
        ('usada', 'Usada'),
    ]
    
    TIPO_MOTOR_CHOICES = [
        ('2_tiempos', '2 Tiempos'),
        ('4_tiempos', '4 Tiempos'),
        ('electrico', 'Eléctrico'),
    ]
    
    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    ano = models.IntegerField(verbose_name='Año')
    condicion = models.CharField(max_length=10, choices=CONDICION_CHOICES, default='nueva', verbose_name='Condición')
    color = models.CharField(max_length=50, blank=True, null=True)
    chasis = models.CharField(max_length=100, unique=True)
    
    # Especificaciones técnicas
    cilindraje = models.IntegerField(blank=True, null=True, help_text="Cilindraje en CC")
    tipo_motor = models.CharField(max_length=20, choices=TIPO_MOTOR_CHOICES, blank=True, null=True)
    potencia = models.CharField(max_length=50, blank=True, null=True, help_text="Ej: 15 HP @ 8000 RPM")
    torque = models.CharField(max_length=50, blank=True, null=True, help_text="Ej: 12 Nm @ 6000 RPM")
    combustible = models.CharField(max_length=50, blank=True, null=True, default="Gasolina")
    transmision = models.CharField(max_length=50, blank=True, null=True, help_text="Ej: Manual 5 velocidades")
    peso = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True, help_text="Peso en kg")
    capacidad_tanque = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Capacidad del tanque en litros")
    
    precio_compra = models.DecimalField(max_digits=12, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=12, decimal_places=2)
    cantidad_stock = models.IntegerField(default=1)
    descripcion = models.TextField(blank=True, null=True)
    imagen = models.ImageField(upload_to='motos/', blank=True, null=True)
    fecha_ingreso = models.DateTimeField(auto_now_add=True)
    activa = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Moto'
        verbose_name_plural = 'Motos'
        ordering = ['-fecha_ingreso']
    
    def __str__(self):
        color_str = f" {self.color}" if self.color else ""
        return f"{self.marca} {self.modelo} {self.ano}{color_str} - {self.chasis}"
    
    @property
    def ganancia(self):
        return self.precio_venta - self.precio_compra
    
    @property
    def disponible(self):
        return self.cantidad_stock > 0 and self.activa
