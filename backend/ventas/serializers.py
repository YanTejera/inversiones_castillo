from rest_framework import serializers
from .models import Venta, VentaDetalle
from usuarios.serializers import ClienteSerializer, UsuarioSerializer

class VentaDetalleSerializer(serializers.ModelSerializer):
    producto_info = serializers.SerializerMethodField()
    
    class Meta:
        model = VentaDetalle
        fields = ['id', 'venta', 'moto', 'producto_info', 'cantidad', 'precio_unitario', 'subtotal']
        read_only_fields = ['subtotal']
    
    def get_producto_info(self, obj):
        """Obtener información completa del producto (moto) con detalles de color, chasis, etc."""
        if obj.moto:
            return {
                'id': obj.moto.id,
                'marca': obj.moto.marca,
                'modelo': obj.moto.modelo,
                'ano': obj.moto.ano,
                'color': obj.moto.color,
                'chasis': obj.moto.chasis,
                'cilindraje': obj.moto.cilindraje,
                'tipo_motor': obj.moto.tipo_motor,
                'condicion': obj.moto.condicion,
                'precio_venta': obj.moto.precio_venta,
                'imagen': obj.moto.imagen.url if obj.moto.imagen else None
            }
        return None

class VentaSerializer(serializers.ModelSerializer):
    cliente_info = ClienteSerializer(source='cliente', read_only=True)
    usuario_info = UsuarioSerializer(source='usuario', read_only=True)
    usuario_cancelacion_info = UsuarioSerializer(source='usuario_cancelacion', read_only=True)
    detalles = VentaDetalleSerializer(many=True, read_only=True)
    saldo_pendiente = serializers.ReadOnlyField()
    tipo_venta_display = serializers.CharField(source='get_tipo_venta_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    motivo_cancelacion_display = serializers.CharField(source='get_motivo_cancelacion_display', read_only=True)
    documentos_generados = serializers.SerializerMethodField()
    
    class Meta:
        model = Venta
        fields = ['id', 'cliente', 'cliente_info', 'usuario', 'usuario_info', 
                 'fecha_venta', 'tipo_venta', 'tipo_venta_display', 'monto_total', 
                 'monto_inicial', 'cuotas', 'tasa_interes', 'pago_mensual', 
                 'monto_total_con_intereses', 'estado', 'estado_display',
                 'motivo_cancelacion', 'motivo_cancelacion_display', 'descripcion_cancelacion',
                 'fecha_cancelacion', 'usuario_cancelacion', 'usuario_cancelacion_info',
                 'detalles', 'saldo_pendiente', 'documentos_generados']
    
    def get_documentos_generados(self, obj):
        """Obtener lista de documentos que se generarían/han generado para esta venta"""
        # Por ahora, devolvemos una lista básica de documentos típicos de una venta
        # En el futuro, esto podría venir de una tabla de documentos reales
        documentos_base = [
            {
                'nombre': 'Contrato de Compraventa',
                'tipo': 'contrato',
                'fecha_creacion': obj.fecha_venta.isoformat() if obj.fecha_venta else None
            },
            {
                'nombre': 'Recibo de Pago Inicial',
                'tipo': 'recibo',
                'fecha_creacion': obj.fecha_venta.isoformat() if obj.fecha_venta else None
            }
        ]
        
        if obj.tipo_venta == 'financiado':
            documentos_base.extend([
                {
                    'nombre': 'Plan de Pagos',
                    'tipo': 'plan_pagos',
                    'fecha_creacion': obj.fecha_venta.isoformat() if obj.fecha_venta else None
                },
                {
                    'nombre': 'Pagaré',
                    'tipo': 'pagare',
                    'fecha_creacion': obj.fecha_venta.isoformat() if obj.fecha_venta else None
                }
            ])
        
        return documentos_base

class VentaDetalleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VentaDetalle
        fields = ['moto', 'cantidad', 'precio_unitario']

class VentaCreateSerializer(serializers.ModelSerializer):
    detalles = VentaDetalleCreateSerializer(many=True)
    
    class Meta:
        model = Venta
        fields = ['cliente', 'tipo_venta', 'monto_total', 'monto_inicial', 
                 'cuotas', 'tasa_interes', 'pago_mensual', 'monto_total_con_intereses', 'detalles']
    
    def validate_detalles(self, value):
        """Validate that there's enough stock for all motorcycles in the sale"""
        for detalle_data in value:
            moto = detalle_data['moto']
            cantidad = detalle_data['cantidad']
            
            if moto.cantidad_stock < cantidad:
                raise serializers.ValidationError(
                    f"Stock insuficiente para {moto.marca} {moto.modelo}. "
                    f"Stock disponible: {moto.cantidad_stock}, solicitado: {cantidad}"
                )
            
            if not moto.activa:
                raise serializers.ValidationError(
                    f"La moto {moto.marca} {moto.modelo} no está disponible para venta"
                )
        
        return value
    
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        validated_data['usuario'] = self.context['request'].user
        venta = Venta.objects.create(**validated_data)
        
        for detalle_data in detalles_data:
            VentaDetalle.objects.create(venta=venta, **detalle_data)
        
        # Generar cuotas automáticamente si es venta financiada
        if venta.tipo_venta == 'financiado':
            from pagos.models import CuotaVencimiento
            CuotaVencimiento.generar_cuotas_venta(venta)
            
        return venta