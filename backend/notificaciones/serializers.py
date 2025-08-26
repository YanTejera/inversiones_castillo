from rest_framework import serializers
from .models import Notificacion, PreferenciaNotificacion
from usuarios.serializers import UsuarioSerializer


class NotificacionSerializer(serializers.ModelSerializer):
    usuario_info = UsuarioSerializer(source='usuario', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    esta_expirada = serializers.BooleanField(read_only=True)
    es_urgente = serializers.BooleanField(read_only=True)
    tiempo_transcurrido = serializers.SerializerMethodField()
    
    class Meta:
        model = Notificacion
        fields = [
            'id', 'titulo', 'mensaje', 'tipo', 'tipo_display', 'prioridad', 'prioridad_display',
            'usuario', 'usuario_info', 'es_global', 'roles_destinatarios',
            'leida', 'fecha_leida', 'fecha_creacion', 'fecha_expiracion',
            'datos_adicionales', 'enviada_push', 'fecha_envio_push',
            'esta_expirada', 'es_urgente', 'tiempo_transcurrido'
        ]
        read_only_fields = ['fecha_creacion', 'fecha_leida', 'fecha_envio_push']
    
    def get_tiempo_transcurrido(self, obj):
        """Calcular tiempo transcurrido desde la creación de manera amigable"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.fecha_creacion
        
        if diff.days > 0:
            return f"hace {diff.days} día{'s' if diff.days > 1 else ''}"
        elif diff.seconds > 3600:
            horas = diff.seconds // 3600
            return f"hace {horas} hora{'s' if horas > 1 else ''}"
        elif diff.seconds > 60:
            minutos = diff.seconds // 60
            return f"hace {minutos} minuto{'s' if minutos > 1 else ''}"
        else:
            return "hace unos momentos"


class NotificacionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = [
            'titulo', 'mensaje', 'tipo', 'prioridad', 'usuario', 'es_global',
            'roles_destinatarios', 'datos_adicionales', 'fecha_expiracion'
        ]
    
    def validate(self, data):
        # Si es global, no debe tener usuario específico
        if data.get('es_global') and data.get('usuario'):
            raise serializers.ValidationError(
                "Una notificación global no puede tener un usuario específico"
            )
        
        # Si no es global, debe tener usuario o roles
        if not data.get('es_global') and not data.get('usuario') and not data.get('roles_destinatarios'):
            raise serializers.ValidationError(
                "Debe especificar un usuario, roles destinatarios o marcar como global"
            )
        
        return data


class PreferenciaNotificacionSerializer(serializers.ModelSerializer):
    usuario_info = UsuarioSerializer(source='usuario', read_only=True)
    
    class Meta:
        model = PreferenciaNotificacion
        fields = [
            'id', 'usuario', 'usuario_info',
            'pago_vencido', 'pago_proximo', 'nueva_venta', 'pago_recibido',
            'stock_bajo', 'nueva_moto', 'cliente_nuevo', 'venta_cancelada',
            'sistema', 'recordatorio',
            'mostrar_en_app', 'enviar_push', 'enviar_email',
            'push_subscription', 'fecha_actualizacion'
        ]
        read_only_fields = ['usuario', 'fecha_actualizacion']


class NotificacionResumenSerializer(serializers.Serializer):
    """Serializer para el resumen de notificaciones"""
    total = serializers.IntegerField()
    no_leidas = serializers.IntegerField()
    urgentes = serializers.IntegerField()
    por_tipo = serializers.DictField()
    recientes = NotificacionSerializer(many=True)


class MarcarLeidaSerializer(serializers.Serializer):
    """Serializer para marcar notificaciones como leídas"""
    notificacion_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        help_text="Lista de IDs de notificaciones a marcar como leídas"
    )