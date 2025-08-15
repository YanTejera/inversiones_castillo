from rest_framework import serializers
from .models import Pago, Reporte, Auditoria, CuotaVencimiento, AlertaPago
from ventas.serializers import VentaSerializer
from usuarios.serializers import UsuarioSerializer

class PagoSerializer(serializers.ModelSerializer):
    venta_info = VentaSerializer(source='venta', read_only=True)
    usuario_cobrador_info = UsuarioSerializer(source='usuario_cobrador', read_only=True)
    tipo_pago_display = serializers.CharField(source='get_tipo_pago_display', read_only=True)
    
    class Meta:
        model = Pago
        fields = ['id', 'venta', 'venta_info', 'fecha_pago', 'monto_pagado', 
                 'tipo_pago', 'tipo_pago_display', 'observaciones', 
                 'usuario_cobrador', 'usuario_cobrador_info']

class PagoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = ['venta', 'monto_pagado', 'tipo_pago', 'observaciones']
    
    def create(self, validated_data):
        validated_data['usuario_cobrador'] = self.context['request'].user
        return super().create(validated_data)

class ReporteSerializer(serializers.ModelSerializer):
    usuario_info = UsuarioSerializer(source='usuario', read_only=True)
    tipo_reporte_display = serializers.CharField(source='get_tipo_reporte_display', read_only=True)
    
    class Meta:
        model = Reporte
        fields = ['id', 'usuario', 'usuario_info', 'tipo_reporte', 
                 'tipo_reporte_display', 'parametros', 'fecha_generacion', 'archivo']

class AuditoriaSerializer(serializers.ModelSerializer):
    usuario_info = UsuarioSerializer(source='usuario', read_only=True)
    
    class Meta:
        model = Auditoria
        fields = ['id', 'usuario', 'usuario_info', 'accion', 'tabla_afectada', 
                 'id_registro', 'fecha_accion', 'detalles']

class CuotaVencimientoSerializer(serializers.ModelSerializer):
    venta_info = VentaSerializer(source='venta', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    saldo_pendiente = serializers.ReadOnlyField()
    esta_vencida = serializers.ReadOnlyField()
    dias_vencido = serializers.ReadOnlyField()
    tiene_mora = serializers.ReadOnlyField()
    monto_mora = serializers.ReadOnlyField()
    
    class Meta:
        model = CuotaVencimiento
        fields = ['id', 'venta', 'venta_info', 'numero_cuota', 'fecha_vencimiento', 
                 'monto_cuota', 'monto_pagado', 'estado', 'estado_display',
                 'saldo_pendiente', 'esta_vencida', 'dias_vencido', 'tiene_mora', 'monto_mora',
                 'fecha_creacion', 'fecha_actualizacion']

class AlertaPagoSerializer(serializers.ModelSerializer):
    venta_info = VentaSerializer(source='venta', read_only=True)
    cuota_info = CuotaVencimientoSerializer(source='cuota', read_only=True)
    usuario_asignado_info = UsuarioSerializer(source='usuario_asignado', read_only=True)
    tipo_alerta_display = serializers.CharField(source='get_tipo_alerta_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = AlertaPago
        fields = ['id', 'venta', 'venta_info', 'cuota', 'cuota_info', 'tipo_alerta',
                 'tipo_alerta_display', 'mensaje', 'fecha_creacion', 'fecha_lectura',
                 'estado', 'estado_display', 'usuario_asignado', 'usuario_asignado_info']