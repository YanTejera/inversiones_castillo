from django.db import models
from decimal import Decimal
from django.core.validators import RegexValidator
import uuid

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
    rnc = models.CharField(max_length=20, unique=True, blank=True, null=True, verbose_name='RNC (Registro Nacional de Contribuyentes)')
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
        permissions = [
            ('view_contabilidad', 'Ver contabilidad de proveedores'),
            ('manage_contabilidad', 'Gestionar contabilidad de proveedores'),
            ('create_orden_compra', 'Crear órdenes de compra'),
            ('approve_orden_compra', 'Aprobar órdenes de compra'),
            ('view_estadisticas_financieras', 'Ver estadísticas financieras'),
            ('manage_credito', 'Gestionar límites de crédito'),
            ('view_pagos', 'Ver historial de pagos'),
            ('create_factura', 'Crear facturas de proveedor'),
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
    
    def saldo_actual(self):
        """Calcula el saldo actual (deuda pendiente) del proveedor"""
        facturas = self.facturas_proveedor.filter(estado='pendiente')
        return sum(factura.total for factura in facturas)
    
    def credito_disponible(self):
        """Calcula el crédito disponible del proveedor"""
        if not self.limite_credito:
            return 0
        return max(0, self.limite_credito - self.saldo_actual())


class FacturaProveedor(models.Model):
    """Modelo para gestionar facturas de proveedores"""
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagada', 'Pagada'),
        ('vencida', 'Vencida'),
        ('anulada', 'Anulada'),
    ]
    
    TIPO_FACTURA_CHOICES = [
        ('compra', 'Compra de Inventario'),
        ('servicio', 'Servicios'),
        ('gastos', 'Gastos Operativos'),
        ('otros', 'Otros'),
    ]
    
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE,
        related_name='facturas_proveedor'
    )
    numero_factura = models.CharField(max_length=50, unique=True, verbose_name='Número de Factura')
    tipo_factura = models.CharField(max_length=20, choices=TIPO_FACTURA_CHOICES, default='compra')
    fecha_emision = models.DateField(verbose_name='Fecha de Emisión')
    fecha_vencimiento = models.DateField(verbose_name='Fecha de Vencimiento')
    
    # Montos
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    impuestos = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='ITBIS/IVA')
    descuento = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    moneda = models.CharField(max_length=3, choices=Proveedor.MONEDA_CHOICES, default='USD')
    
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción/Conceptos')
    archivo_factura = models.FileField(upload_to='facturas_proveedores/', blank=True, null=True)
    
    # Metadatos
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    creado_por = models.ForeignKey(
        'usuarios.Usuario',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='facturas_proveedor_creadas'
    )
    
    class Meta:
        verbose_name = 'Factura de Proveedor'
        verbose_name_plural = 'Facturas de Proveedores'
        ordering = ['-fecha_emision']
        indexes = [
            models.Index(fields=['proveedor', 'estado']),
            models.Index(fields=['fecha_vencimiento', 'estado']),
        ]
    
    def __str__(self):
        return f"Factura {self.numero_factura} - {self.proveedor.nombre}"
    
    @property
    def dias_vencimiento(self):
        """Calcula los días hasta el vencimiento (negativo si ya venció)"""
        from datetime import date
        return (self.fecha_vencimiento - date.today()).days
    
    @property
    def esta_vencida(self):
        """Verifica si la factura está vencida"""
        from datetime import date
        return self.fecha_vencimiento < date.today() and self.estado == 'pendiente'
    
    @property
    def monto_pendiente(self):
        """Calcula el monto pendiente de pago"""
        if self.estado == 'pagada':
            return 0
        pagos_realizados = self.pagos_factura.aggregate(
            total_pagado=models.Sum('monto')
        )['total_pagado'] or 0
        return self.total - pagos_realizados


class PagoProveedor(models.Model):
    """Modelo para registrar pagos realizados a proveedores"""
    METODO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia Bancaria'),
        ('cheque', 'Cheque'),
        ('tarjeta', 'Tarjeta de Crédito/Débito'),
        ('otros', 'Otros'),
    ]
    
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE,
        related_name='pagos_realizados'
    )
    factura = models.ForeignKey(
        FacturaProveedor,
        on_delete=models.CASCADE,
        related_name='pagos_factura',
        blank=True,
        null=True,
        help_text='Factura específica que se está pagando (opcional para pagos generales)'
    )
    
    numero_pago = models.CharField(max_length=50, unique=True, verbose_name='Número de Pago')
    fecha_pago = models.DateField(verbose_name='Fecha del Pago')
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    moneda = models.CharField(max_length=3, choices=Proveedor.MONEDA_CHOICES, default='USD')
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES, default='transferencia')
    
    # Referencias bancarias
    numero_referencia = models.CharField(max_length=100, blank=True, null=True, verbose_name='Número de Referencia/Cheque')
    banco = models.CharField(max_length=100, blank=True, null=True)
    
    notas = models.TextField(blank=True, null=True, verbose_name='Notas del Pago')
    comprobante = models.FileField(upload_to='comprobantes_pagos/', blank=True, null=True)
    
    # Metadatos
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(
        'usuarios.Usuario',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='pagos_proveedor_registrados'
    )
    
    class Meta:
        verbose_name = 'Pago a Proveedor'
        verbose_name_plural = 'Pagos a Proveedores'
        ordering = ['-fecha_pago']
        indexes = [
            models.Index(fields=['proveedor', 'fecha_pago']),
            models.Index(fields=['factura']),
        ]
    
    def __str__(self):
        return f"Pago {self.numero_pago} - {self.proveedor.nombre} ({self.monto} {self.moneda})"


class OrdenCompra(models.Model):
    """Modelo para órdenes de compra/pedidos a proveedores"""
    ESTADO_CHOICES = [
        ('borrador', 'Borrador'),
        ('enviada', 'Enviada'),
        ('confirmada', 'Confirmada'),
        ('recibida_parcial', 'Recibida Parcialmente'),
        ('recibida_completa', 'Recibida Completamente'),
        ('cancelada', 'Cancelada'),
    ]
    
    PRIORIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('normal', 'Normal'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente'),
    ]
    
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE,
        related_name='ordenes_compra'
    )
    numero_orden = models.CharField(max_length=50, unique=True, verbose_name='Número de Orden')
    fecha_orden = models.DateField(verbose_name='Fecha de la Orden')
    fecha_entrega_esperada = models.DateField(verbose_name='Fecha de Entrega Esperada')
    
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='borrador')
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='normal')
    
    # Montos
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    impuestos = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    descuento = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    moneda = models.CharField(max_length=3, choices=Proveedor.MONEDA_CHOICES, default='USD')
    
    notas = models.TextField(blank=True, null=True, verbose_name='Notas de la Orden')
    condiciones_especiales = models.TextField(blank=True, null=True, verbose_name='Condiciones Especiales')
    
    # Metadatos
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    creado_por = models.ForeignKey(
        'usuarios.Usuario',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='ordenes_compra_creadas'
    )
    
    class Meta:
        verbose_name = 'Orden de Compra'
        verbose_name_plural = 'Órdenes de Compra'
        ordering = ['-fecha_orden']
        indexes = [
            models.Index(fields=['proveedor', 'estado']),
            models.Index(fields=['fecha_entrega_esperada', 'estado']),
        ]
        permissions = [
            ('view_todas_ordenes', 'Ver todas las órdenes de compra'),
            ('create_orden_urgente', 'Crear órdenes con prioridad urgente'),
            ('change_estado_orden', 'Cambiar estado de órdenes'),
            ('cancel_orden', 'Cancelar órdenes de compra'),
            ('view_orden_pdf', 'Ver/descargar PDFs de órdenes'),
            ('receive_orden', 'Marcar órdenes como recibidas'),
        ]
    
    def __str__(self):
        return f"Orden {self.numero_orden} - {self.proveedor.nombre}"
    
    @property
    def dias_para_entrega(self):
        """Calcula los días hasta la fecha de entrega esperada"""
        from datetime import date
        return (self.fecha_entrega_esperada - date.today()).days
    
    @property
    def esta_atrasada(self):
        """Verifica si la orden está atrasada"""
        from datetime import date
        return (self.fecha_entrega_esperada < date.today() and 
                self.estado not in ['recibida_completa', 'cancelada'])


class DetalleOrdenCompra(models.Model):
    """Detalle de productos en una orden de compra"""
    orden = models.ForeignKey(
        OrdenCompra,
        on_delete=models.CASCADE,
        related_name='detalles'
    )
    modelo_moto = models.ForeignKey(
        'MotoModelo',
        on_delete=models.CASCADE,
        related_name='detalles_orden'
    )
    color = models.CharField(max_length=50, verbose_name='Color Solicitado')
    cantidad_solicitada = models.PositiveIntegerField(verbose_name='Cantidad Solicitada')
    cantidad_recibida = models.PositiveIntegerField(default=0, verbose_name='Cantidad Recibida')
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Precio Unitario')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Subtotal')
    
    notas = models.TextField(blank=True, null=True, verbose_name='Notas del Item')
    
    class Meta:
        verbose_name = 'Detalle de Orden de Compra'
        verbose_name_plural = 'Detalles de Órdenes de Compra'
        unique_together = ['orden', 'modelo_moto', 'color']
    
    def __str__(self):
        return f"{self.modelo_moto} {self.color} - Orden {self.orden.numero_orden}"
    
    @property
    def cantidad_pendiente(self):
        """Calcula la cantidad pendiente de recibir"""
        return self.cantidad_solicitada - self.cantidad_recibida
    
    @property
    def esta_completo(self):
        """Verifica si este detalle está completamente recibido"""
        return self.cantidad_recibida >= self.cantidad_solicitada


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
        permissions = [
            ('view_precio_compra', 'Ver precio de compra de motocicletas'),
            ('change_precio_compra', 'Modificar precio de compra'),
            ('view_precio_venta', 'Ver precio de venta'),
            ('change_precio_venta', 'Modificar precio de venta'),
            ('view_ganancia', 'Ver ganancias de motocicletas'),
            ('export_motos', 'Exportar datos de motocicletas'),
            ('import_motos', 'Importar datos de motocicletas'),
            ('manage_inventory', 'Gestionar inventario completo'),
            ('view_stock_minimo', 'Ver configuraciones de stock mínimo'),
        ]
    
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
    
    # Nuevos campos para gestión de precios por lote
    precio_compra_individual = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        blank=True, 
        null=True,
        help_text="Precio de compra específico para este lote/color (si es diferente al precio base del modelo)"
    )
    tasa_dolar = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        blank=True, 
        null=True,
        help_text="Tasa del dólar al momento de la compra de este lote"
    )
    fecha_compra = models.DateField(
        blank=True, 
        null=True,
        help_text="Fecha específica de compra de este lote"
    )
    
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


# ====================
# MODELOS DE UBICACIONES FÍSICAS
# ====================

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
        return self.inventario_items.aggregate(
            total=models.Sum('cantidad_stock')
        )['total'] or 0
    
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
