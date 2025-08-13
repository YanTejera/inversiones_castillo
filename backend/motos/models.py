from django.db import models
from decimal import Decimal

class Moto(models.Model):
    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    ano = models.IntegerField(verbose_name='Año')
    chasis = models.CharField(max_length=100, unique=True)
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
        return f"{self.marca} {self.modelo} {self.ano} - {self.chasis}"
    
    @property
    def ganancia(self):
        return self.precio_venta - self.precio_compra
    
    @property
    def disponible(self):
        return self.cantidad_stock > 0 and self.activa
