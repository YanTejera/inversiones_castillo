from django.contrib.auth.models import AbstractUser
from django.db import models

class Rol(models.Model):
    nombre_rol = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
    
    def __str__(self):
        return self.nombre_rol

class Usuario(AbstractUser):
    telefono = models.CharField(max_length=20, blank=True, null=True)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, related_name='usuarios')
    estado = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

class Cliente(models.Model):
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    direccion = models.TextField(blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    pais = models.CharField(max_length=100, default='Colombia')
    cedula = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    celular = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    estado_civil = models.CharField(max_length=20, blank=True, null=True)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    ocupacion = models.CharField(max_length=100, blank=True, null=True)
    ingresos = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    referencias_personales = models.TextField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['-fecha_registro']
    
    @property
    def nombre_completo(self):
        return f"{self.nombre} {self.apellido}"
    
    def __str__(self):
        return f"{self.nombre} {self.apellido} - {self.cedula}"

class Fiador(models.Model):
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    cedula = models.CharField(max_length=20)
    direccion = models.TextField()
    telefono = models.CharField(max_length=20, blank=True, null=True)
    celular = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    estado_civil = models.CharField(max_length=20, blank=True, null=True)
    ocupacion = models.CharField(max_length=100, blank=True, null=True)
    ingresos = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    lugar_trabajo = models.CharField(max_length=200, blank=True, null=True)
    telefono_trabajo = models.CharField(max_length=20, blank=True, null=True)
    referencias_personales = models.TextField(blank=True, null=True)
    parentesco_cliente = models.CharField(max_length=50, blank=True, null=True, help_text="Relación con el cliente (padre, hermano, amigo, etc.)")
    cliente = models.OneToOneField(Cliente, on_delete=models.CASCADE, related_name='fiador')
    
    class Meta:
        verbose_name = 'Fiador'
        verbose_name_plural = 'Fiadores'
    
    @property
    def nombre_completo(self):
        return f"{self.nombre} {self.apellido}"
    
    def __str__(self):
        return f"{self.nombre} {self.apellido} - Fiador de {self.cliente.nombre}"

class Documento(models.Model):
    TIPO_DOCUMENTO_CHOICES = [
        ('cedula', 'Cédula'),
        ('pasaporte', 'Pasaporte'),
        ('licencia_conducir', 'Licencia de Conducir'),
        ('prueba_direccion', 'Prueba de Dirección'),
    ]
    
    PROPIETARIO_CHOICES = [
        ('cliente', 'Cliente'),
        ('fiador', 'Fiador'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='documentos')
    propietario = models.CharField(max_length=10, choices=PROPIETARIO_CHOICES, default='cliente')
    tipo_documento = models.CharField(max_length=20, choices=TIPO_DOCUMENTO_CHOICES)
    descripcion = models.TextField()
    archivo = models.FileField(upload_to='documentos/', blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Documento'
        verbose_name_plural = 'Documentos'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        propietario_nombre = self.cliente.fiador.nombre if self.propietario == 'fiador' and hasattr(self.cliente, 'fiador') else self.cliente.nombre
        return f"{propietario_nombre} ({self.get_propietario_display()}) - {self.get_tipo_documento_display()}"
