from django.db import models
from django.utils import timezone
from datetime import timedelta
from usuarios.models import Usuario

class Notificacion(models.Model):
    """Modelo para gestionar notificaciones del sistema"""
    
    TIPO_CHOICES = [
        ('pago_vencido', 'Pago Vencido'),
        ('pago_proximo', 'Pago Próximo a Vencer'),
        ('nueva_venta', 'Nueva Venta Registrada'),
        ('pago_recibido', 'Pago Recibido'),
        ('stock_bajo', 'Stock Bajo'),
        ('nueva_moto', 'Nueva Moto Registrada'),
        ('cliente_nuevo', 'Nuevo Cliente Registrado'),
        ('venta_cancelada', 'Venta Cancelada'),
        ('sistema', 'Notificación del Sistema'),
        ('recordatorio', 'Recordatorio'),
    ]
    
    PRIORIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente'),
    ]
    
    # Información básica
    titulo = models.CharField(max_length=200, verbose_name='Título')
    mensaje = models.TextField(verbose_name='Mensaje')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, verbose_name='Tipo')
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='media', verbose_name='Prioridad')
    
    # Destinatarios
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='notificaciones', null=True, blank=True)
    es_global = models.BooleanField(default=False, verbose_name='Para todos los usuarios')
    roles_destinatarios = models.CharField(max_length=100, blank=True, null=True, 
                                         help_text='Roles separados por coma: admin,vendedor,cobrador')
    
    # Estado
    leida = models.BooleanField(default=False, verbose_name='Leída')
    fecha_leida = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de lectura')
    
    # Metadatos
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    fecha_expiracion = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de expiración')
    
    # Datos adicionales (JSON para información específica del tipo de notificación)
    datos_adicionales = models.JSONField(default=dict, blank=True, 
                                       help_text='Información adicional específica del tipo de notificación')
    
    # Para Web Push
    enviada_push = models.BooleanField(default=False, verbose_name='Enviada como Push')
    fecha_envio_push = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['usuario', 'leida']),
            models.Index(fields=['tipo', 'fecha_creacion']),
            models.Index(fields=['prioridad', 'leida']),
        ]
    
    def __str__(self):
        destinatario = self.usuario.get_full_name() if self.usuario else "Global"
        return f"{self.get_tipo_display()} - {destinatario} - {self.titulo}"
    
    def marcar_como_leida(self):
        """Marcar la notificación como leída"""
        if not self.leida:
            self.leida = True
            self.fecha_leida = timezone.now()
            self.save(update_fields=['leida', 'fecha_leida'])
    
    @property
    def esta_expirada(self):
        """Verificar si la notificación ha expirado"""
        if self.fecha_expiracion:
            return timezone.now() > self.fecha_expiracion
        return False
    
    @property
    def es_urgente(self):
        """Verificar si la notificación es urgente"""
        return self.prioridad in ['alta', 'urgente']
    
    @classmethod
    def crear_notificacion(cls, tipo, titulo, mensaje, usuario=None, prioridad='media', 
                          datos_adicionales=None, expira_en_dias=None):
        """Método helper para crear notificaciones fácilmente"""
        fecha_expiracion = None
        if expira_en_dias:
            fecha_expiracion = timezone.now() + timedelta(days=expira_en_dias)
        
        return cls.objects.create(
            tipo=tipo,
            titulo=titulo,
            mensaje=mensaje,
            usuario=usuario,
            prioridad=prioridad,
            datos_adicionales=datos_adicionales or {},
            fecha_expiracion=fecha_expiracion
        )
    
    @classmethod
    def notificar_pago_vencido(cls, cliente, venta, dias_vencido):
        """Crear notificación para pago vencido"""
        return cls.crear_notificacion(
            tipo='pago_vencido',
            titulo=f'Pago Vencido - {cliente.nombre_completo}',
            mensaje=f'El cliente {cliente.nombre_completo} tiene un pago vencido por {dias_vencido} días. Venta #{venta.id}',
            prioridad='alta',
            datos_adicionales={
                'cliente_id': cliente.id,
                'venta_id': venta.id,
                'dias_vencido': dias_vencido,
                'monto_pendiente': float(venta.saldo_pendiente)
            },
            expira_en_dias=30
        )
    
    @classmethod
    def notificar_nueva_venta(cls, venta, vendedor):
        """Crear notificación para nueva venta"""
        return cls.crear_notificacion(
            tipo='nueva_venta',
            titulo=f'Nueva Venta Registrada - #{venta.id}',
            mensaje=f'Se registró una nueva venta por {venta.monto_total:,.0f} para {venta.cliente.nombre_completo}',
            usuario=vendedor,
            prioridad='media',
            datos_adicionales={
                'venta_id': venta.id,
                'cliente_id': venta.cliente.id,
                'monto_total': float(venta.monto_total)
            },
            expira_en_dias=7
        )
    
    @classmethod
    def notificar_pago_recibido(cls, pago):
        """Crear notificación para pago recibido"""
        return cls.crear_notificacion(
            tipo='pago_recibido',
            titulo=f'Pago Recibido - {pago.venta.cliente.nombre_completo}',
            mensaje=f'Se recibió un pago de {pago.monto_pagado:,.0f} del cliente {pago.venta.cliente.nombre_completo}',
            prioridad='media',
            datos_adicionales={
                'pago_id': pago.id,
                'venta_id': pago.venta.id,
                'cliente_id': pago.venta.cliente.id,
                'monto_pagado': float(pago.monto_pagado)
            },
            expira_en_dias=7
        )


class PreferenciaNotificacion(models.Model):
    """Modelo para gestionar las preferencias de notificaciones de cada usuario"""
    
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='preferencias_notificaciones')
    
    # Preferencias por tipo de notificación
    pago_vencido = models.BooleanField(default=True, verbose_name='Pagos Vencidos')
    pago_proximo = models.BooleanField(default=True, verbose_name='Pagos Próximos')
    nueva_venta = models.BooleanField(default=True, verbose_name='Nuevas Ventas')
    pago_recibido = models.BooleanField(default=True, verbose_name='Pagos Recibidos')
    stock_bajo = models.BooleanField(default=True, verbose_name='Stock Bajo')
    nueva_moto = models.BooleanField(default=True, verbose_name='Nuevas Motos')
    cliente_nuevo = models.BooleanField(default=True, verbose_name='Nuevos Clientes')
    venta_cancelada = models.BooleanField(default=True, verbose_name='Ventas Canceladas')
    sistema = models.BooleanField(default=True, verbose_name='Notificaciones del Sistema')
    recordatorio = models.BooleanField(default=True, verbose_name='Recordatorios')
    
    # Preferencias de entrega
    mostrar_en_app = models.BooleanField(default=True, verbose_name='Mostrar en la aplicación')
    enviar_push = models.BooleanField(default=True, verbose_name='Enviar notificaciones push')
    enviar_email = models.BooleanField(default=False, verbose_name='Enviar por email')
    
    # Configuración de Web Push
    push_subscription = models.JSONField(null=True, blank=True, 
                                       help_text='Datos de suscripción para Web Push')
    
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Preferencia de Notificación'
        verbose_name_plural = 'Preferencias de Notificaciones'
    
    def __str__(self):
        return f"Preferencias de {self.usuario.get_full_name()}"
    
    def debe_recibir_notificacion(self, tipo_notificacion):
        """Verificar si el usuario debe recibir este tipo de notificación"""
        if not self.mostrar_en_app:
            return False
        
        # Mapear tipos a campos del modelo
        tipo_field_map = {
            'pago_vencido': self.pago_vencido,
            'pago_proximo': self.pago_proximo,
            'nueva_venta': self.nueva_venta,
            'pago_recibido': self.pago_recibido,
            'stock_bajo': self.stock_bajo,
            'nueva_moto': self.nueva_moto,
            'cliente_nuevo': self.cliente_nuevo,
            'venta_cancelada': self.venta_cancelada,
            'sistema': self.sistema,
            'recordatorio': self.recordatorio,
        }
        
        return tipo_field_map.get(tipo_notificacion, True)