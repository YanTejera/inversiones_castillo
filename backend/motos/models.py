from django.db import models
from decimal import Decimal
from django.core.validators import RegexValidator

class Proveedor(models.Model):
    """Modelo para gestionar proveedores de motocicletas"""
    TIPO_PROVEEDOR_CHOICES = [
        ('distribuidor', 'Distribuidor Oficial'),
        ('importador', 'Importador'),
        ('mayorista', 'Mayorista'),
        ('fabricante', 'Fabricante'),
        ('particular', 'Particular'),
    ]
    
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('suspendido', 'Suspendido'),
    ]
    
    MONEDA_CHOICES = [
        ('USD', 'Dólares (USD)'),
        ('RD', 'Pesos Dominicanos (RD)'),
        ('EUR', 'Euros (EUR)'),
        ('COP', 'Pesos Colombianos (COP)'),
    ]
    
    # Información básica
    nombre = models.CharField(max_length=200, verbose_name='Nombre del Proveedor')
    nombre_comercial = models.CharField(max_length=200, blank=True, null=True, verbose_name='Nombre Comercial')
    tipo_proveedor = models.CharField(max_length=20, choices=TIPO_PROVEEDOR_CHOICES, default='distribuidor')
    
    # Documentos legales
    ruc = models.CharField(max_length=20, unique=True, blank=True, null=True, verbose_name='RUC/NIT')
    cedula = models.CharField(max_length=20, unique=True, blank=True, null=True, verbose_name='Cédula')
    registro_mercantil = models.CharField(max_length=50, blank=True, null=True, verbose_name='Registro Mercantil')
    
    # Contacto
    telefono = models.CharField(
        max_length=15, 
        blank=True, 
        null=True,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$', 'Ingrese un número de teléfono válido')]
    )
    telefono2 = models.CharField(
        max_length=15, 
        blank=True, 
        null=True,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$', 'Ingrese un número de teléfono válido')],
        verbose_name='Teléfono Alternativo'
    )
    email = models.EmailField(blank=True, null=True, verbose_name='Correo Electrónico')
    sitio_web = models.URLField(blank=True, null=True, verbose_name='Sitio Web')
    
    # Dirección
    direccion = models.TextField(verbose_name='Dirección')
    ciudad = models.CharField(max_length=100)
    provincia = models.CharField(max_length=100, blank=True, null=True)
    pais = models.CharField(max_length=100, default='República Dominicana')
    codigo_postal = models.CharField(max_length=10, blank=True, null=True, verbose_name='Código Postal')
    
    # Información comercial
    persona_contacto = models.CharField(max_length=200, blank=True, null=True, verbose_name='Persona de Contacto')
    cargo_contacto = models.CharField(max_length=100, blank=True, null=True, verbose_name='Cargo del Contacto')
    telefono_contacto = models.CharField(
        max_length=15, 
        blank=True, 
        null=True,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$', 'Ingrese un número de teléfono válido')],
        verbose_name='Teléfono del Contacto'
    )
    email_contacto = models.EmailField(blank=True, null=True, verbose_name='Email del Contacto')
    
    # Condiciones comerciales
    moneda_preferida = models.CharField(max_length=3, choices=MONEDA_CHOICES, default='USD')
    terminos_pago = models.CharField(max_length=100, blank=True, null=True, verbose_name='Términos de Pago')
    limite_credito = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, verbose_name='Límite de Crédito')
    descuento_general = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='Descuento General (%)')
    
    # Estado y fechas
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='activo')
    fecha_inicio_relacion = models.DateField(blank=True, null=True, verbose_name='Fecha Inicio Relación')
    notas = models.TextField(blank=True, null=True, verbose_name='Notas Adicionales')
    
    # Metadatos
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    creado_por = models.ForeignKey(
        'usuarios.Usuario', 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='proveedores_creados'
    )
    
    class Meta:
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['estado', 'tipo_proveedor']),
            models.Index(fields=['nombre']),
        ]
    
    def __str__(self):
        return self.nombre_comercial or self.nombre
    
    @property
    def nombre_completo(self):
        if self.nombre_comercial and self.nombre_comercial != self.nombre:
            return f"{self.nombre_comercial} ({self.nombre})"
        return self.nombre
    
    @property
    def contacto_principal(self):
        if self.persona_contacto:
            return f"{self.persona_contacto}"
        return "No definido"
    
    @property
    def telefono_principal(self):
        return self.telefono_contacto or self.telefono or "No definido"
    
    @property
    def email_principal(self):
        return self.email_contacto or self.email or "No definido"
    
    @property
    def esta_activo(self):
        return self.estado == 'activo'
    
    def total_compras(self):
        """Calcula el total de compras realizadas a este proveedor"""
        return self.motocicletas.aggregate(
            total=models.Sum('precio_compra')
        )['total'] or 0
    
    def total_motocicletas(self):
        """Cuenta el total de motocicletas suministradas por este proveedor"""
        return self.motocicletas.count()


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
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.PROTECT,
        related_name='motocicletas',
        verbose_name='Proveedor',
        blank=True,
        null=True,
        help_text='Proveedor que suministra este modelo'
    )
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
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.PROTECT,
        related_name='motos_legacy',
        verbose_name='Proveedor',
        blank=True,
        null=True,
        help_text='Proveedor que suministra esta motocicleta'
    )
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
