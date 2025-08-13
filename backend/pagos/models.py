from django.db import models
from django.conf import settings
from ventas.models import Venta

class Pago(models.Model):
    TIPO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('tarjeta', 'Tarjeta'),
        ('cheque', 'Cheque'),
    ]
    
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='pagos')
    fecha_pago = models.DateTimeField(auto_now_add=True)
    monto_pagado = models.DecimalField(max_digits=15, decimal_places=2)
    tipo_pago = models.CharField(max_length=20, choices=TIPO_PAGO_CHOICES)
    observaciones = models.TextField(blank=True, null=True)
    usuario_cobrador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cobros_realizados')
    
    class Meta:
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-fecha_pago']
    
    def __str__(self):
        return f"Pago {self.id} - Venta {self.venta.id} - ${self.monto_pagado}"

class Reporte(models.Model):
    TIPO_REPORTE_CHOICES = [
        ('ventas', 'Ventas'),
        ('pagos', 'Pagos'),
        ('stock', 'Stock'),
        ('clientes', 'Clientes'),
        ('rentabilidad', 'Rentabilidad'),
    ]
    
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reportes_generados')
    tipo_reporte = models.CharField(max_length=20, choices=TIPO_REPORTE_CHOICES)
    parametros = models.JSONField(default=dict, blank=True)
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    archivo = models.FileField(upload_to='reportes/', blank=True, null=True)
    
    class Meta:
        verbose_name = 'Reporte'
        verbose_name_plural = 'Reportes'
        ordering = ['-fecha_generacion']
    
    def __str__(self):
        return f"Reporte {self.get_tipo_reporte_display()} - {self.fecha_generacion.strftime('%d/%m/%Y')}"

class Auditoria(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='acciones_auditoria')
    accion = models.CharField(max_length=100)
    tabla_afectada = models.CharField(max_length=50)
    id_registro = models.IntegerField()
    fecha_accion = models.DateTimeField(auto_now_add=True)
    detalles = models.JSONField(default=dict, blank=True)
    
    class Meta:
        verbose_name = 'Auditoría'
        verbose_name_plural = 'Auditorías'
        ordering = ['-fecha_accion']
    
    def __str__(self):
        return f"{self.usuario.username} - {self.accion} en {self.tabla_afectada}"
