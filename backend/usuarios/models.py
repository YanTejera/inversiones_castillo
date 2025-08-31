from django.contrib.auth.models import AbstractUser, Permission, Group
from django.contrib.contenttypes.models import ContentType
from django.db import models

class Rol(models.Model):
    ROLES_CHOICES = [
        ('master', 'Master (Dueño)'),
        ('admin', 'Administrador'),
        ('vendedor', 'Vendedor'),
        ('cobrador', 'Cobrador'),
    ]
    
    nombre_rol = models.CharField(max_length=50, choices=ROLES_CHOICES, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    # Permisos específicos
    puede_gestionar_usuarios = models.BooleanField(default=False)
    puede_ver_reportes = models.BooleanField(default=False)
    puede_gestionar_motos = models.BooleanField(default=False)
    puede_crear_ventas = models.BooleanField(default=False)
    puede_gestionar_pagos = models.BooleanField(default=False)
    puede_ver_finanzas = models.BooleanField(default=False)
    puede_configurar_sistema = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
    
    def __str__(self):
        return f"{self.get_nombre_rol_display()}"

class PermisoGranular(models.Model):
    """Modelo para gestionar permisos granulares del sistema"""
    
    CATEGORIA_CHOICES = [
        ('motos', 'Motocicletas e Inventario'),
        ('proveedores', 'Proveedores y Compras'),
        ('clientes', 'Clientes y Ventas'),
        ('finanzas', 'Finanzas y Contabilidad'),
        ('reportes', 'Reportes y Analytics'),
        ('usuarios', 'Usuarios y Sistema'),
        ('configuracion', 'Configuración'),
    ]
    
    codigo = models.CharField(max_length=100, unique=True, help_text="Código único del permiso (ej: motos.view_precio_compra)")
    nombre = models.CharField(max_length=200, help_text="Nombre descriptivo del permiso")
    descripcion = models.TextField(help_text="Descripción detallada del permiso")
    categoria = models.CharField(max_length=50, choices=CATEGORIA_CHOICES)
    es_critico = models.BooleanField(default=False, help_text="Permiso crítico que requiere aprobación especial")
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Permiso Granular'
        verbose_name_plural = 'Permisos Granulares'
        ordering = ['categoria', 'nombre']
    
    def __str__(self):
        return f"{self.categoria}.{self.codigo.split('.')[-1]} - {self.nombre}"

class RolPermiso(models.Model):
    """Relación entre roles y permisos granulares"""
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, related_name='permisos_granulares')
    permiso = models.ForeignKey(PermisoGranular, on_delete=models.CASCADE, related_name='roles')
    concedido_por = models.ForeignKey('Usuario', on_delete=models.SET_NULL, null=True, blank=True)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Permiso de Rol'
        verbose_name_plural = 'Permisos de Roles'
        unique_together = ['rol', 'permiso']
    
    def __str__(self):
        return f"{self.rol.nombre_rol} - {self.permiso.codigo}"

class Usuario(AbstractUser):
    telefono = models.CharField(max_length=20, blank=True, null=True)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, related_name='usuarios')
    estado = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultimo_acceso = models.DateTimeField(blank=True, null=True)
    foto_perfil = models.ImageField(upload_to='usuarios/perfiles/', blank=True, null=True)
    
    # Configuraciones de usuario
    tema_oscuro = models.BooleanField(default=False)
    notificaciones_email = models.BooleanField(default=True)
    idioma = models.CharField(max_length=10, default='es', choices=[
        ('es', 'Español'),
        ('en', 'English'),
    ])
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
    
    @property
    def nombre_completo(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    @property
    def es_master(self):
        return self.rol.nombre_rol == 'master'
    
    @property 
    def es_admin(self):
        return self.rol.nombre_rol in ['master', 'admin']
    
    def puede_acceder_a(self, permiso):
        """Verifica si el usuario puede acceder a una funcionalidad específica (método legacy)"""
        if not self.estado:
            return False
        if self.es_master:
            return True
        return getattr(self.rol, permiso, False)
    
    def tiene_permiso(self, codigo_permiso):
        """Verifica si el usuario tiene un permiso granular específico"""
        if not self.estado:
            return False
        if self.es_master:
            return True
        
        # Verificar permisos granulares del rol
        return self.rol.permisos_granulares.filter(
            permiso__codigo=codigo_permiso,
            permiso__activo=True,
            activo=True
        ).exists()
    
    def obtener_permisos(self):
        """Obtiene todos los permisos granulares del usuario"""
        if not self.estado:
            return []
        if self.es_master:
            # Master tiene todos los permisos
            return list(PermisoGranular.objects.filter(activo=True).values_list('codigo', flat=True))
        
        return list(
            self.rol.permisos_granulares.filter(
                permiso__activo=True,
                activo=True
            ).values_list('permiso__codigo', flat=True)
        )
    
    def obtener_permisos_por_categoria(self):
        """Obtiene permisos organizados por categoría"""
        if not self.estado:
            return {}
        
        if self.es_master:
            permisos = PermisoGranular.objects.filter(activo=True)
        else:
            permisos = PermisoGranular.objects.filter(
                roles__rol=self.rol,
                roles__activo=True,
                activo=True
            )
        
        permisos_por_categoria = {}
        for permiso in permisos:
            if permiso.categoria not in permisos_por_categoria:
                permisos_por_categoria[permiso.categoria] = []
            permisos_por_categoria[permiso.categoria].append({
                'codigo': permiso.codigo,
                'nombre': permiso.nombre,
                'descripcion': permiso.descripcion
            })
        
        return permisos_por_categoria

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
    foto_perfil = models.ImageField(upload_to='clientes/fotos/', blank=True, null=True, verbose_name='Foto de Perfil')
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
    descripcion = models.TextField(blank=True, null=True)
    archivo = models.FileField(upload_to='documentos/', blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Documento'
        verbose_name_plural = 'Documentos'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        propietario_nombre = self.cliente.fiador.nombre if self.propietario == 'fiador' and hasattr(self.cliente, 'fiador') else self.cliente.nombre
        return f"{propietario_nombre} ({self.get_propietario_display()}) - {self.get_tipo_documento_display()}"
