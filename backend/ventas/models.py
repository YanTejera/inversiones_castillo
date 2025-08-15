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
    monto_total = models.DecimalField(max_digits=20, decimal_places=2)
    monto_inicial = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    cuotas = models.IntegerField(default=1)
    tasa_interes = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Tasa de interés mensual en porcentaje")
    pago_mensual = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    monto_total_con_intereses = models.DecimalField(max_digits=20, decimal_places=2, default=0, help_text="Monto total que pagará el cliente incluyendo intereses")
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
    precio_unitario = models.DecimalField(max_digits=20, decimal_places=2)
    subtotal = models.DecimalField(max_digits=20, decimal_places=2)
    
    class Meta:
        verbose_name = 'Detalle de Venta'
        verbose_name_plural = 'Detalles de Venta'
    
    def __str__(self):
        return f"{self.moto.marca} {self.moto.modelo} - Venta {self.venta.id}"
    
    def save(self, *args, **kwargs):
        self.subtotal = self.cantidad * self.precio_unitario
        
        # Reduce motorcycle stock when creating new sale detail
        if not self.pk:  # Only when creating, not updating
            if self.moto.cantidad_stock >= self.cantidad:
                self.moto.cantidad_stock -= self.cantidad
                self.moto.save()
            else:
                raise ValueError(f"Stock insuficiente. Stock disponible: {self.moto.cantidad_stock}, solicitado: {self.cantidad}")
        
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        # Restore motorcycle stock when deleting sale detail
        self.moto.cantidad_stock += self.cantidad
        self.moto.save()
        super().delete(*args, **kwargs)
