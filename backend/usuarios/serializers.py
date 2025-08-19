from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Usuario, Rol, Cliente, Fiador, Documento

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
    
    # Campos calculados para estado de pagos
    estado_pago = serializers.SerializerMethodField()
    dias_atraso = serializers.SerializerMethodField()
    saldo_total_pendiente = serializers.SerializerMethodField()
    cuota_actual = serializers.SerializerMethodField()
    proximo_pago = serializers.SerializerMethodField()
    total_cuotas_vencidas = serializers.SerializerMethodField()
    ventas_activas = serializers.SerializerMethodField()
    
    class Meta:
        model = Cliente
        fields = ['id', 'nombre', 'apellido', 'direccion', 'ciudad', 'pais', 
                 'cedula', 'telefono', 'celular', 'email', 'estado_civil', 
                 'fecha_nacimiento', 'ocupacion', 'ingresos', 'referencias_personales',
                 'fecha_registro', 'nombre_completo', 'fiador', 'documentos',
                 'estado_pago', 'dias_atraso', 'saldo_total_pendiente', 'cuota_actual',
                 'proximo_pago', 'total_cuotas_vencidas', 'ventas_activas']
    
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