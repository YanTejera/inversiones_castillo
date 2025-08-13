from django.db import models
from django.conf import settings
from usuarios.models import Cliente
from motos.models import Moto

class Venta(models.Model):
    TIPO_VENTA_CHOICES = [
        ('contado', 'Contado'),
        ('financiado', 'Financiado'),
    ]
    
    ESTADO_CHOICES = [
        ('activa', 'Activa'),
        ('cancelada', 'Cancelada'),
        ('finalizada', 'Finalizada'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='ventas')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ventas')
    fecha_venta = models.DateTimeField(auto_now_add=True)
    tipo_venta = models.CharField(max_length=15, choices=TIPO_VENTA_CHOICES)
    monto_total = models.DecimalField(max_digits=15, decimal_places=2)
    monto_inicial = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    cuotas = models.IntegerField(default=1)
    pago_mensual = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='activa')
    
    class Meta:
        verbose_name = 'Venta'
        verbose_name_plural = 'Ventas'
        ordering = ['-fecha_venta']
    
    def __str__(self):
        return f"Venta {self.id} - {self.cliente.nombre} {self.cliente.apellido}"
    
    @property
    def saldo_pendiente(self):
        total_pagado = sum([pago.monto_pagado for pago in self.pagos.all()])
        return self.monto_total - total_pagado

class VentaDetalle(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    moto = models.ForeignKey(Moto, on_delete=models.CASCADE)
    cantidad = models.IntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=15, decimal_places=2)
    
    class Meta:
        verbose_name = 'Detalle de Venta'
        verbose_name_plural = 'Detalles de Venta'
    
    def __str__(self):
        return f"{self.moto.marca} {self.moto.modelo} - Venta {self.venta.id}"
    
    def save(self, *args, **kwargs):
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)
