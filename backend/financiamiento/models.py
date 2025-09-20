from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid


class EntidadFinanciera(models.Model):
    """Entidades financieras (bancos, cooperativas, financieras)"""
    TIPOS = [
        ('banco', 'Banco'),
        ('cooperativa', 'Cooperativa'),
        ('financiera', 'Financiera'),
        ('leasing', 'Leasing'),
        ('casa_comercial', 'Casa Comercial'),
    ]
    
    nombre = models.CharField(max_length=100, unique=True)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    logo = models.ImageField(upload_to='financieras/logos/', blank=True, null=True)
    
    # Configuración de tasas y plazos
    tasa_minima = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    tasa_maxima = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    plazo_minimo = models.PositiveIntegerField(default=6)  # meses
    plazo_maximo = models.PositiveIntegerField(default=72)  # meses
    
    # Configuración de montos
    monto_minimo = models.DecimalField(max_digits=12, decimal_places=2, default=1000000)
    monto_maximo = models.DecimalField(max_digits=12, decimal_places=2, default=50000000)
    
    # Configuración de inicial
    requiere_inicial = models.BooleanField(default=True)
    porcentaje_inicial_minimo = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=20,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Información de contacto
    contacto_nombre = models.CharField(max_length=100, blank=True)
    contacto_telefono = models.CharField(max_length=20, blank=True)
    contacto_email = models.EmailField(blank=True)
    
    # Configuración API (para integraciones futuras)
    endpoint_api = models.URLField(blank=True, null=True)
    api_key = models.CharField(max_length=200, blank=True)
    webhook_url = models.URLField(blank=True, null=True)
    
    # Estados y metadatos
    activa = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Entidad Financiera"
        verbose_name_plural = "Entidades Financieras"
        ordering = ['nombre']
    
    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_display()})"


class TipoCredito(models.Model):
    """Tipos de crédito que maneja cada entidad financiera"""
    entidad = models.ForeignKey(EntidadFinanciera, on_delete=models.CASCADE, related_name='tipos_credito')
    nombre = models.CharField(max_length=100)  # "Crédito Vehículos", "Libranza", "Libre Inversión"
    descripcion = models.TextField(blank=True)
    
    # Configuración específica del tipo
    tasa_interes = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    plazo_maximo = models.PositiveIntegerField()
    score_minimo_requerido = models.PositiveIntegerField(default=300)
    ingresos_minimos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Documentos requeridos
    requiere_centrales_riesgo = models.BooleanField(default=True)
    requiere_referencias_comerciales = models.BooleanField(default=False)
    requiere_referencias_familiares = models.BooleanField(default=True)
    
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Tipo de Crédito"
        verbose_name_plural = "Tipos de Crédito"
        unique_together = ['entidad', 'nombre']
    
    def __str__(self):
        return f"{self.entidad.nombre} - {self.nombre}"


class SolicitudCredito(models.Model):
    """Solicitudes de crédito de los clientes"""
    ESTADOS = [
        ('borrador', 'Borrador'),
        ('enviada', 'Enviada'),
        ('en_evaluacion', 'En Evaluación'),
        ('documentos_pendientes', 'Documentos Pendientes'),
        ('aprobada', 'Aprobada'),
        ('aprobada_condicionada', 'Aprobada con Condiciones'),
        ('rechazada', 'Rechazada'),
        ('desembolsada', 'Desembolsada'),
        ('cancelada', 'Cancelada'),
    ]
    
    # ID único para referencia externa
    numero_solicitud = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Relaciones principales
    cliente = models.ForeignKey('usuarios.Cliente', on_delete=models.CASCADE, related_name='solicitudes_credito')
    venta = models.ForeignKey('ventas.Venta', on_delete=models.CASCADE, related_name='solicitudes_credito')
    entidad_financiera = models.ForeignKey(EntidadFinanciera, on_delete=models.PROTECT)
    tipo_credito = models.ForeignKey(TipoCredito, on_delete=models.PROTECT)
    vendedor = models.ForeignKey('usuarios.Usuario', on_delete=models.PROTECT, related_name='solicitudes_gestionadas')
    
    # Datos del crédito solicitado
    monto_solicitado = models.DecimalField(max_digits=12, decimal_places=2)
    monto_inicial = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    plazo_meses = models.PositiveIntegerField()
    
    # Datos aprobados (se llenan cuando es aprobada)
    monto_aprobado = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    tasa_aprobada = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    cuota_mensual = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    plazo_aprobado = models.PositiveIntegerField(null=True, blank=True)
    
    # Estados y fechas
    estado = models.CharField(max_length=25, choices=ESTADOS, default='borrador')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_envio = models.DateTimeField(null=True, blank=True)
    fecha_respuesta = models.DateTimeField(null=True, blank=True)
    fecha_desembolso = models.DateTimeField(null=True, blank=True)
    fecha_vencimiento_respuesta = models.DateTimeField(null=True, blank=True)
    
    # Información externa y seguimiento
    numero_credito_externo = models.CharField(max_length=100, blank=True)
    observaciones = models.TextField(blank=True)
    motivo_rechazo = models.TextField(blank=True)
    condiciones_aprobacion = models.TextField(blank=True)
    
    # Campos de auditoría
    usuario_creacion = models.ForeignKey(
        'usuarios.Usuario', 
        on_delete=models.PROTECT, 
        related_name='solicitudes_creadas'
    )
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Solicitud de Crédito"
        verbose_name_plural = "Solicitudes de Crédito"
        ordering = ['-fecha_solicitud']
    
    def __str__(self):
        return f"Solicitud {self.numero_solicitud} - {self.cliente.nombre_completo}"
    
    @property
    def monto_financiar(self):
        return self.monto_solicitado - self.monto_inicial
    
    @property
    def porcentaje_inicial(self):
        if self.monto_solicitado > 0:
            return (self.monto_inicial / self.monto_solicitado) * 100
        return 0


class DocumentoCredito(models.Model):
    """Documentos requeridos para cada solicitud de crédito"""
    TIPOS_DOCUMENTO = [
        ('cedula', 'Cédula de Ciudadanía'),
        ('ingresos', 'Certificado de Ingresos'),
        ('laborales', 'Certificado Laboral'),
        ('bancarios', 'Referencias Bancarias'),
        ('comerciales', 'Referencias Comerciales'),
        ('familiares', 'Referencias Familiares'),
        ('centrales_riesgo', 'Centrales de Riesgo'),
        ('autorizacion_debito', 'Autorización Débito Automático'),
        ('pagare', 'Pagaré'),
        ('otros', 'Otros'),
    ]
    
    ESTADOS_VALIDACION = [
        ('pendiente', 'Pendiente'),
        ('validado', 'Validado'),
        ('rechazado', 'Rechazado'),
        ('requiere_correccion', 'Requiere Corrección'),
    ]
    
    solicitud = models.ForeignKey(SolicitudCredito, on_delete=models.CASCADE, related_name='documentos')
    tipo = models.CharField(max_length=20, choices=TIPOS_DOCUMENTO)
    nombre = models.CharField(max_length=200)
    archivo = models.FileField(upload_to='creditos/documentos/%Y/%m/')
    
    # Validación
    obligatorio = models.BooleanField(default=False)
    estado_validacion = models.CharField(max_length=20, choices=ESTADOS_VALIDACION, default='pendiente')
    observaciones_validacion = models.TextField(blank=True)
    
    # Metadatos
    fecha_subida = models.DateTimeField(auto_now_add=True)
    usuario_subida = models.ForeignKey('usuarios.Usuario', on_delete=models.PROTECT)
    validado_por = models.ForeignKey(
        'usuarios.Usuario', 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True,
        related_name='documentos_validados'
    )
    fecha_validacion = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Documento de Crédito"
        verbose_name_plural = "Documentos de Crédito"
        unique_together = ['solicitud', 'tipo']
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.solicitud.numero_solicitud}"


class HistorialCredito(models.Model):
    """Historial de cambios de estado de las solicitudes"""
    solicitud = models.ForeignKey(SolicitudCredito, on_delete=models.CASCADE, related_name='historial')
    estado_anterior = models.CharField(max_length=25)
    estado_nuevo = models.CharField(max_length=25)
    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.PROTECT)
    observaciones = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    
    # Datos adicionales del cambio
    datos_adicionales = models.JSONField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Historial de Crédito"
        verbose_name_plural = "Historiales de Crédito"
        ordering = ['-fecha']
    
    def __str__(self):
        return f"{self.solicitud.numero_solicitud}: {self.estado_anterior} → {self.estado_nuevo}"


# ========================
# MODELOS DE COMISIONES
# ========================

class EsquemaComision(models.Model):
    """Esquemas de comisiones para diferentes tipos de ventas"""
    TIPOS_ESQUEMA = [
        ('porcentaje_venta', 'Porcentaje sobre Venta'),
        ('porcentaje_utilidad', 'Porcentaje sobre Utilidad'),
        ('monto_fijo', 'Monto Fijo'),
        ('escalado', 'Escalado por Metas'),
        ('mixto', 'Mixto'),
    ]
    
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    tipo_esquema = models.CharField(max_length=20, choices=TIPOS_ESQUEMA)
    
    # Configuración básica
    porcentaje_base = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    monto_fijo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Configuración para esquemas escalados
    incluye_financiamiento = models.BooleanField(default=False)
    porcentaje_financiamiento = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Filtros de aplicación
    aplica_modelos = models.ManyToManyField('motos.MotoModelo', blank=True)
    monto_minimo_venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    monto_maximo_venta = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Estados
    activo = models.BooleanField(default=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    
    # Metadatos
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    creado_por = models.ForeignKey('usuarios.Usuario', on_delete=models.PROTECT)
    
    class Meta:
        verbose_name = "Esquema de Comisión"
        verbose_name_plural = "Esquemas de Comisión"
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class TramosComision(models.Model):
    """Tramos para esquemas escalados"""
    esquema = models.ForeignKey(EsquemaComision, on_delete=models.CASCADE, related_name='tramos')
    desde_unidades = models.PositiveIntegerField(default=0)
    hasta_unidades = models.PositiveIntegerField(null=True, blank=True)  # None = sin límite
    desde_monto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    hasta_monto = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Comisión para este tramo
    porcentaje = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    monto_fijo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        verbose_name = "Tramo de Comisión"
        verbose_name_plural = "Tramos de Comisión"
        ordering = ['desde_unidades', 'desde_monto']
    
    def __str__(self):
        return f"{self.esquema.nombre} - Tramo {self.desde_unidades}-{self.hasta_unidades or '∞'}"


class AsignacionComision(models.Model):
    """Asignación de esquemas de comisión a vendedores"""
    vendedor = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='asignaciones_comision')
    esquema = models.ForeignKey(EsquemaComision, on_delete=models.CASCADE)
    
    # Vigencia
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    activa = models.BooleanField(default=True)
    
    # Configuración específica del vendedor
    porcentaje_personalizado = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Sobrescribe el porcentaje base del esquema"
    )
    
    # Metadatos
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    creado_por = models.ForeignKey(
        'usuarios.Usuario', 
        on_delete=models.PROTECT,
        related_name='asignaciones_creadas'
    )
    
    class Meta:
        verbose_name = "Asignación de Comisión"
        verbose_name_plural = "Asignaciones de Comisión"
        unique_together = ['vendedor', 'esquema', 'fecha_inicio']
    
    def __str__(self):
        return f"{self.vendedor.get_full_name()} - {self.esquema.nombre}"


class ComisionCalculada(models.Model):
    """Comisiones calculadas por cada venta"""
    ESTADOS = [
        ('calculada', 'Calculada'),
        ('aprobada', 'Aprobada'),
        ('pagada', 'Pagada'),
        ('retenida', 'Retenida'),
        ('anulada', 'Anulada'),
    ]
    
    # Relaciones
    venta = models.OneToOneField('ventas.Venta', on_delete=models.CASCADE, related_name='comision')
    vendedor = models.ForeignKey('usuarios.Usuario', on_delete=models.PROTECT, related_name='comisiones')
    esquema_aplicado = models.ForeignKey(EsquemaComision, on_delete=models.PROTECT)
    
    # Montos de cálculo
    monto_venta = models.DecimalField(max_digits=12, decimal_places=2)
    monto_utilidad = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    porcentaje_aplicado = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Comisión base
    comision_venta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    comision_financiamiento = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    comision_total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Estado y fechas
    estado = models.CharField(max_length=15, choices=ESTADOS, default='calculada')
    fecha_calculo = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    fecha_pago = models.DateTimeField(null=True, blank=True)
    
    # Referencias de pago
    numero_pago = models.CharField(max_length=100, blank=True)
    observaciones = models.TextField(blank=True)
    
    # Auditoría
    aprobada_por = models.ForeignKey(
        'usuarios.Usuario', 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True,
        related_name='comisiones_aprobadas'
    )
    pagada_por = models.ForeignKey(
        'usuarios.Usuario', 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True,
        related_name='comisiones_pagadas'
    )
    
    class Meta:
        verbose_name = "Comisión Calculada"
        verbose_name_plural = "Comisiones Calculadas"
        ordering = ['-fecha_calculo']
    
    def __str__(self):
        return f"Comisión {self.venta.numero_venta} - ${self.comision_total:,.0f}"


class MetaVendedor(models.Model):
    """Metas mensuales/anuales para vendedores"""
    PERIODOS = [
        ('mensual', 'Mensual'),
        ('trimestral', 'Trimestral'),
        ('semestral', 'Semestral'),
        ('anual', 'Anual'),
    ]
    
    vendedor = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='metas')
    periodo = models.CharField(max_length=15, choices=PERIODOS)
    ano = models.PositiveIntegerField()
    mes = models.PositiveIntegerField(null=True, blank=True)  # Solo para metas mensuales
    
    # Metas
    meta_unidades = models.PositiveIntegerField(default=0)
    meta_monto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Bonificaciones por cumplimiento
    bonificacion_cumplimiento = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bonificacion_sobrecumplimiento = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Metadatos
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    creado_por = models.ForeignKey(
        'usuarios.Usuario', 
        on_delete=models.PROTECT,
        related_name='metas_creadas'
    )
    
    class Meta:
        verbose_name = "Meta de Vendedor"
        verbose_name_plural = "Metas de Vendedores"
        unique_together = ['vendedor', 'periodo', 'ano', 'mes']
        ordering = ['-ano', '-mes']
    
    def __str__(self):
        periodo_str = f"{self.get_periodo_display()}"
        if self.mes:
            periodo_str += f" {self.mes:02d}"
        return f"{self.vendedor.get_full_name()} - {periodo_str}/{self.ano}"