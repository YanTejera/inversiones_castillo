from rest_framework import serializers
from .models import Venta, VentaDetalle
from usuarios.serializers import ClienteSerializer, UsuarioSerializer
from motos.serializers import MotoSerializer

class VentaDetalleSerializer(serializers.ModelSerializer):
    moto_info = MotoSerializer(source='moto', read_only=True)
    
    class Meta:
        model = VentaDetalle
        fields = ['id', 'venta', 'moto', 'moto_info', 'cantidad', 'precio_unitario', 'subtotal']
        read_only_fields = ['subtotal']

class VentaSerializer(serializers.ModelSerializer):
    cliente_info = ClienteSerializer(source='cliente', read_only=True)
    usuario_info = UsuarioSerializer(source='usuario', read_only=True)
    detalles = VentaDetalleSerializer(many=True, read_only=True)
    saldo_pendiente = serializers.ReadOnlyField()
    tipo_venta_display = serializers.CharField(source='get_tipo_venta_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = Venta
        fields = ['id', 'cliente', 'cliente_info', 'usuario', 'usuario_info', 
                 'fecha_venta', 'tipo_venta', 'tipo_venta_display', 'monto_total', 
                 'monto_inicial', 'cuotas', 'pago_mensual', 'estado', 'estado_display',
                 'detalles', 'saldo_pendiente']

class VentaCreateSerializer(serializers.ModelSerializer):
    detalles = VentaDetalleSerializer(many=True)
    
    class Meta:
        model = Venta
        fields = ['cliente', 'tipo_venta', 'monto_total', 'monto_inicial', 
                 'cuotas', 'pago_mensual', 'detalles']
    
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        validated_data['usuario'] = self.context['request'].user
        venta = Venta.objects.create(**validated_data)
        
        for detalle_data in detalles_data:
            VentaDetalle.objects.create(venta=venta, **detalle_data)
            
        return venta