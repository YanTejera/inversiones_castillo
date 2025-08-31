from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Usuario, Rol, Cliente, Fiador, Documento, PermisoGranular, RolPermiso

class RolSerializer(serializers.ModelSerializer):
    nombre_rol_display = serializers.CharField(source='get_nombre_rol_display', read_only=True)
    
    class Meta:
        model = Rol
        fields = ['id', 'nombre_rol', 'nombre_rol_display', 'descripcion', 
                 'puede_gestionar_usuarios', 'puede_ver_reportes', 'puede_gestionar_motos',
                 'puede_crear_ventas', 'puede_gestionar_pagos', 'puede_ver_finanzas',
                 'puede_configurar_sistema']

class UsuarioSerializer(serializers.ModelSerializer):
    rol_info = RolSerializer(source='rol', read_only=True)
    nombre_completo = serializers.CharField(read_only=True)
    es_master = serializers.BooleanField(read_only=True)
    es_admin = serializers.BooleanField(read_only=True)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'nombre_completo',
                 'telefono', 'rol', 'rol_info', 'estado', 'fecha_creacion', 'ultimo_acceso',
                 'foto_perfil', 'tema_oscuro', 'notificaciones_email', 'idioma', 
                 'es_master', 'es_admin', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)

class UsuarioUpdateSerializer(serializers.ModelSerializer):
    """Serializer específico para actualizar datos del usuario sin contraseña"""
    nombre_completo = serializers.CharField(read_only=True)
    
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'nombre_completo',
                 'telefono', 'foto_perfil', 'tema_oscuro', 'notificaciones_email', 'idioma']

class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(required=True)
    password_nueva = serializers.CharField(required=True, min_length=8)
    confirmar_password = serializers.CharField(required=True)
    
    def validate(self, data):
        if data['password_nueva'] != data['confirmar_password']:
            raise serializers.ValidationError("Las contraseñas nuevas no coinciden")
        return data
    
    def validate_password_actual(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta")
        return value

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Credenciales inválidas')
            if not user.estado:
                raise serializers.ValidationError('Usuario inactivo')
            data['user'] = user
        else:
            raise serializers.ValidationError('Debe proporcionar username y password')
        
        return data

class FiadorSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.CharField(read_only=True)
    
    class Meta:
        model = Fiador
        fields = '__all__'

class DocumentoSerializer(serializers.ModelSerializer):
    tipo_documento_display = serializers.CharField(source='get_tipo_documento_display', read_only=True)
    propietario_display = serializers.CharField(source='get_propietario_display', read_only=True)
    
    class Meta:
        model = Documento
        fields = ['id', 'propietario', 'propietario_display', 'tipo_documento', 'tipo_documento_display', 
                 'descripcion', 'archivo', 'fecha_creacion', 'cliente']

class ClienteSerializer(serializers.ModelSerializer):
    fiador = FiadorSerializer(read_only=True)
    documentos = DocumentoSerializer(many=True, read_only=True)
    nombre_completo = serializers.CharField(read_only=True)
    
    class Meta:
        model = Cliente
        fields = ['id', 'nombre', 'apellido', 'direccion', 'ciudad', 'pais', 
                 'cedula', 'telefono', 'celular', 'email', 'estado_civil', 
                 'fecha_nacimiento', 'ocupacion', 'ingresos', 'referencias_personales',
                 'foto_perfil', 'fecha_registro', 'nombre_completo', 'fiador', 'documentos']
    
    def get_estado_pago(self, obj):
        """Calcula el estado de pago del cliente basado en cuotas vencidas"""
        from datetime import date
        from pagos.models import CuotaVencimiento
        
        # Obtener cuotas vencidas no pagadas
        cuotas_vencidas = CuotaVencimiento.objects.filter(
            venta__cliente=obj,
            fecha_vencimiento__lt=date.today(),
            estado='pendiente'
        )
        
        if cuotas_vencidas.exists():
            return 'atrasado'
        
        # Verificar si tiene cuotas próximas (7 días)
        from datetime import timedelta
        fecha_limite = date.today() + timedelta(days=7)
        cuotas_proximas = CuotaVencimiento.objects.filter(
            venta__cliente=obj,
            fecha_vencimiento__lte=fecha_limite,
            fecha_vencimiento__gte=date.today(),
            estado='pendiente'
        )
        
        if cuotas_proximas.exists():
            return 'proximo'
        
        # Verificar si tiene ventas activas sin cuotas vencidas
        from ventas.models import Venta
        ventas_activas = Venta.objects.filter(
            cliente=obj,
            estado='activa',
            tipo_venta='financiado'
        )
        
        if ventas_activas.exists():
            return 'al_dia'
        
        return 'sin_deudas'
    
    def get_dias_atraso(self, obj):
        """Calcula los días de atraso basado en la cuota más antigua vencida"""
        from datetime import date
        from pagos.models import CuotaVencimiento
        
        cuota_mas_antigua = CuotaVencimiento.objects.filter(
            venta__cliente=obj,
            fecha_vencimiento__lt=date.today(),
            estado='pendiente'
        ).order_by('fecha_vencimiento').first()
        
        if cuota_mas_antigua:
            dias_atraso = (date.today() - cuota_mas_antigua.fecha_vencimiento).days
            return max(0, dias_atraso)
        
        return 0
    
    def get_saldo_total_pendiente(self, obj):
        """Calcula el saldo total pendiente de todas las ventas activas"""
        from ventas.models import Venta
        
        ventas_activas = Venta.objects.filter(
            cliente=obj,
            estado='activa'
        )
        
        saldo_total = sum(venta.saldo_pendiente for venta in ventas_activas)
        return float(saldo_total)
    
    def get_cuota_actual(self, obj):
        """Obtiene el monto de la próxima cuota a pagar"""
        from datetime import date
        from pagos.models import CuotaVencimiento
        
        proxima_cuota = CuotaVencimiento.objects.filter(
            venta__cliente=obj,
            estado='pendiente'
        ).order_by('fecha_vencimiento').first()
        
        if proxima_cuota:
            return float(proxima_cuota.monto_cuota)
        
        return 0
    
    def get_proximo_pago(self, obj):
        """Obtiene la fecha del próximo pago"""
        from pagos.models import CuotaVencimiento
        
        proxima_cuota = CuotaVencimiento.objects.filter(
            venta__cliente=obj,
            estado='pendiente'
        ).order_by('fecha_vencimiento').first()
        
        if proxima_cuota:
            return proxima_cuota.fecha_vencimiento.isoformat()
        
        return None
    
    def get_total_cuotas_vencidas(self, obj):
        """Cuenta el número total de cuotas vencidas"""
        from datetime import date
        from pagos.models import CuotaVencimiento
        
        return CuotaVencimiento.objects.filter(
            venta__cliente=obj,
            fecha_vencimiento__lt=date.today(),
            estado='pendiente'
        ).count()
    
    def get_ventas_activas(self, obj):
        """Obtiene información resumida de las ventas activas"""
        from ventas.models import Venta
        
        ventas = Venta.objects.filter(
            cliente=obj,
            estado='activa'
        ).select_related('cliente', 'usuario')
        
        return [{
            'id': venta.id,
            'fecha_venta': venta.fecha_venta.isoformat(),
            'monto_total': float(venta.monto_total),
            'saldo_pendiente': float(venta.saldo_pendiente),
            'tipo_venta': venta.tipo_venta,
            'cuotas': venta.cuotas,
            'pago_mensual': float(venta.pago_mensual) if venta.pago_mensual else None
        } for venta in ventas]
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Generar URL absoluta para la foto de perfil
        if instance.foto_perfil:
            from django.conf import settings
            
            imagen_url = str(instance.foto_perfil)
            print(f"[IMG] [Cliente] DEBUG={settings.DEBUG}, Foto original: {imagen_url}")
            
            if settings.DEBUG:
                base_url = 'http://localhost:8000'
                full_url = f"{base_url}{settings.MEDIA_URL}{imagen_url}"
            else:
                full_url = f"{settings.MEDIA_URL}{imagen_url}"
            
            representation['foto_perfil'] = full_url
            print(f"[IMG] [Cliente] URL final: {full_url}")
        
        return representation

class ClienteDetalleSerializer(ClienteSerializer):
    """Serializer extendido para detalles completos del cliente incluyendo ventas y pagos"""
    
    # Campos calculados para estado de pagos
    estado_pago = serializers.SerializerMethodField()
    dias_atraso = serializers.SerializerMethodField()
    saldo_total_pendiente = serializers.SerializerMethodField()
    cuota_actual = serializers.SerializerMethodField()
    proximo_pago = serializers.SerializerMethodField()
    total_cuotas_vencidas = serializers.SerializerMethodField()
    ventas_activas = serializers.SerializerMethodField()
    
    class Meta(ClienteSerializer.Meta):
        fields = ClienteSerializer.Meta.fields + [
            'estado_pago', 'dias_atraso', 'saldo_total_pendiente', 'cuota_actual',
            'proximo_pago', 'total_cuotas_vencidas', 'ventas_activas'
        ]

# ===== SERIALIZERS DE PERMISOS GRANULARES =====

class PermisoGranularSerializer(serializers.ModelSerializer):
    """Serializer para permisos granulares"""
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    
    class Meta:
        model = PermisoGranular
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'categoria', 'categoria_display', 
                 'es_critico', 'activo', 'fecha_creacion']
        read_only_fields = ['fecha_creacion']

class RolPermisoSerializer(serializers.ModelSerializer):
    """Serializer para la relación rol-permiso"""
    permiso_info = PermisoGranularSerializer(source='permiso', read_only=True)
    concedido_por_info = serializers.CharField(source='concedido_por.nombre_completo', read_only=True)
    
    class Meta:
        model = RolPermiso
        fields = ['id', 'rol', 'permiso', 'permiso_info', 'concedido_por', 'concedido_por_info', 
                 'fecha_asignacion', 'activo']
        read_only_fields = ['fecha_asignacion']

class RolConPermisosSerializer(serializers.ModelSerializer):
    """Serializer extendido para roles con sus permisos granulares"""
    nombre_rol_display = serializers.CharField(source='get_nombre_rol_display', read_only=True)
    permisos_granulares = RolPermisoSerializer(many=True, read_only=True)
    permisos_activos = serializers.SerializerMethodField()
    total_permisos = serializers.SerializerMethodField()
    
    class Meta:
        model = Rol
        fields = ['id', 'nombre_rol', 'nombre_rol_display', 'descripcion', 
                 'puede_gestionar_usuarios', 'puede_ver_reportes', 'puede_gestionar_motos',
                 'puede_crear_ventas', 'puede_gestionar_pagos', 'puede_ver_finanzas',
                 'puede_configurar_sistema', 'permisos_granulares', 'permisos_activos', 'total_permisos']
    
    def get_permisos_activos(self, obj):
        """Obtiene solo los permisos activos del rol"""
        return obj.permisos_granulares.filter(
            permiso__activo=True, 
            activo=True
        ).count()
    
    def get_total_permisos(self, obj):
        """Obtiene el total de permisos del rol"""
        return obj.permisos_granulares.count()

class UsuarioConPermisosSerializer(serializers.ModelSerializer):
    """Serializer extendido para usuarios con información de permisos"""
    rol_info = RolConPermisosSerializer(source='rol', read_only=True)
    nombre_completo = serializers.CharField(read_only=True)
    es_master = serializers.BooleanField(read_only=True)
    es_admin = serializers.BooleanField(read_only=True)
    permisos_usuario = serializers.SerializerMethodField()
    permisos_por_categoria = serializers.SerializerMethodField()
    
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'nombre_completo',
                 'telefono', 'rol', 'rol_info', 'estado', 'fecha_creacion', 'ultimo_acceso',
                 'foto_perfil', 'tema_oscuro', 'notificaciones_email', 'idioma', 
                 'es_master', 'es_admin', 'permisos_usuario', 'permisos_por_categoria']
    
    def get_permisos_usuario(self, obj):
        """Obtiene la lista de códigos de permisos del usuario"""
        return obj.obtener_permisos()
    
    def get_permisos_por_categoria(self, obj):
        """Obtiene los permisos organizados por categoría"""
        return obj.obtener_permisos_por_categoria()

class AsignarPermisoSerializer(serializers.Serializer):
    """Serializer para asignar permisos a un rol"""
    rol_id = serializers.IntegerField()
    permiso_id = serializers.IntegerField()
    activo = serializers.BooleanField(default=True)
    
    def validate_rol_id(self, value):
        try:
            rol = Rol.objects.get(id=value)
            return value
        except Rol.DoesNotExist:
            raise serializers.ValidationError("Rol no encontrado")
    
    def validate_permiso_id(self, value):
        try:
            permiso = PermisoGranular.objects.get(id=value)
            if not permiso.activo:
                raise serializers.ValidationError("El permiso no está activo")
            return value
        except PermisoGranular.DoesNotExist:
            raise serializers.ValidationError("Permiso no encontrado")
    
    def save(self):
        rol = Rol.objects.get(id=self.validated_data['rol_id'])
        permiso = PermisoGranular.objects.get(id=self.validated_data['permiso_id'])
        
        rol_permiso, created = RolPermiso.objects.get_or_create(
            rol=rol,
            permiso=permiso,
            defaults={
                'activo': self.validated_data['activo'],
                'concedido_por': self.context['request'].user
            }
        )
        
        if not created:
            # Si ya existe, actualizar solo el estado activo
            rol_permiso.activo = self.validated_data['activo']
            rol_permiso.concedido_por = self.context['request'].user
            rol_permiso.save()
        
        return rol_permiso

class PermisosUsuarioResponseSerializer(serializers.Serializer):
    """Serializer para la respuesta de permisos de usuario (para el frontend)"""
    permisos = serializers.ListField(child=serializers.CharField())
    permisos_por_categoria = serializers.DictField()
    rol = serializers.CharField()
    es_master = serializers.BooleanField()
    es_admin = serializers.BooleanField()