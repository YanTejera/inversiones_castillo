from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    EntidadFinanciera, TipoCredito, SolicitudCredito, DocumentoCredito,
    HistorialCredito, EsquemaComision, ComisionCalculada, MetaVendedor,
    AsignacionComision, TramosComision
)

User = get_user_model()


class TipoCreditoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoCredito
        fields = '__all__'


class EntidadFinancieraSerializer(serializers.ModelSerializer):
    tipos_credito = TipoCreditoSerializer(many=True, read_only=True)
    
    class Meta:
        model = EntidadFinanciera
        fields = [
            'id', 'nombre', 'tipo', 'logo', 'tasa_minima', 'tasa_maxima',
            'plazo_minimo', 'plazo_maximo', 'monto_minimo', 'monto_maximo',
            'requiere_inicial', 'porcentaje_inicial_minimo', 'contacto_nombre',
            'contacto_telefono', 'contacto_email', 'activa', 'tipos_credito'
        ]


class DocumentoCreditoSerializer(serializers.ModelSerializer):
    usuario_subida_nombre = serializers.CharField(source='usuario_subida.get_full_name', read_only=True)
    validado_por_nombre = serializers.CharField(source='validado_por.get_full_name', read_only=True)
    
    class Meta:
        model = DocumentoCredito
        fields = [
            'id', 'tipo', 'nombre', 'archivo', 'obligatorio', 'estado_validacion',
            'observaciones_validacion', 'fecha_subida', 'usuario_subida',
            'usuario_subida_nombre', 'validado_por', 'validado_por_nombre',
            'fecha_validacion'
        ]
        read_only_fields = ['fecha_subida', 'usuario_subida']


class HistorialCreditoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    
    class Meta:
        model = HistorialCredito
        fields = [
            'id', 'estado_anterior', 'estado_nuevo', 'usuario', 'usuario_nombre',
            'observaciones', 'fecha', 'datos_adicionales'
        ]
        read_only_fields = ['fecha']


class SolicitudCreditoSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.nombre_completo', read_only=True)
    cliente_cedula = serializers.CharField(source='cliente.cedula', read_only=True)
    entidad_nombre = serializers.CharField(source='entidad_financiera.nombre', read_only=True)
    vendedor_nombre = serializers.CharField(source='vendedor.get_full_name', read_only=True)
    venta_numero = serializers.CharField(source='venta.numero_venta', read_only=True)
    
    documentos = DocumentoCreditoSerializer(many=True, read_only=True)
    historial = HistorialCreditoSerializer(many=True, read_only=True)
    
    # Campos calculados
    monto_financiar = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    porcentaje_inicial = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = SolicitudCredito
        fields = [
            'id', 'numero_solicitud', 'cliente', 'cliente_nombre', 'cliente_cedula',
            'venta', 'venta_numero', 'entidad_financiera', 'entidad_nombre',
            'tipo_credito', 'vendedor', 'vendedor_nombre', 'monto_solicitado',
            'monto_inicial', 'plazo_meses', 'monto_aprobado', 'tasa_aprobada',
            'cuota_mensual', 'plazo_aprobado', 'estado', 'fecha_solicitud',
            'fecha_envio', 'fecha_respuesta', 'fecha_desembolso',
            'numero_credito_externo', 'observaciones', 'motivo_rechazo',
            'condiciones_aprobacion', 'documentos', 'historial',
            'monto_financiar', 'porcentaje_inicial'
        ]
        read_only_fields = [
            'numero_solicitud', 'fecha_solicitud', 'monto_financiar', 
            'porcentaje_inicial'
        ]

    def create(self, validated_data):
        # El usuario de creación se asigna automáticamente
        validated_data['usuario_creacion'] = self.context['request'].user
        return super().create(validated_data)


class CalculadoraCreditoSerializer(serializers.Serializer):
    """Serializer para la calculadora de crédito"""
    monto = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    inicial = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0, default=0)
    tasa = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, max_value=100)
    plazo = serializers.IntegerField(min_value=1, max_value=120)
    
    def validate(self, data):
        if data['inicial'] >= data['monto']:
            raise serializers.ValidationError(
                "La cuota inicial debe ser menor al monto total del vehículo"
            )
        return data


# ========================
# SERIALIZERS DE COMISIONES
# ========================

class TramosComisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TramosComision
        fields = '__all__'


class EsquemaComisionSerializer(serializers.ModelSerializer):
    tramos = TramosComisionSerializer(many=True, read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    
    class Meta:
        model = EsquemaComision
        fields = [
            'id', 'nombre', 'descripcion', 'tipo_esquema', 'porcentaje_base',
            'monto_fijo', 'incluye_financiamiento', 'porcentaje_financiamiento',
            'aplica_modelos', 'monto_minimo_venta',
            'monto_maximo_venta', 'activo', 'fecha_inicio', 'fecha_fin',
            'fecha_creacion', 'creado_por', 'creado_por_nombre', 'tramos'
        ]
        read_only_fields = ['fecha_creacion', 'creado_por']

    def create(self, validated_data):
        validated_data['creado_por'] = self.context['request'].user
        return super().create(validated_data)


class AsignacionComisionSerializer(serializers.ModelSerializer):
    vendedor_nombre = serializers.CharField(source='vendedor.get_full_name', read_only=True)
    esquema_nombre = serializers.CharField(source='esquema.nombre', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    
    class Meta:
        model = AsignacionComision
        fields = [
            'id', 'vendedor', 'vendedor_nombre', 'esquema', 'esquema_nombre',
            'fecha_inicio', 'fecha_fin', 'activa', 'porcentaje_personalizado',
            'fecha_creacion', 'creado_por', 'creado_por_nombre'
        ]
        read_only_fields = ['fecha_creacion', 'creado_por']

    def create(self, validated_data):
        validated_data['creado_por'] = self.context['request'].user
        return super().create(validated_data)


class ComisionCalculadaSerializer(serializers.ModelSerializer):
    venta_numero = serializers.CharField(source='venta.numero_venta', read_only=True)
    vendedor_nombre = serializers.CharField(source='vendedor.get_full_name', read_only=True)
    esquema_nombre = serializers.CharField(source='esquema_aplicado.nombre', read_only=True)
    cliente_nombre = serializers.CharField(source='venta.cliente.nombre_completo', read_only=True)
    aprobada_por_nombre = serializers.CharField(source='aprobada_por.get_full_name', read_only=True)
    pagada_por_nombre = serializers.CharField(source='pagada_por.get_full_name', read_only=True)
    
    class Meta:
        model = ComisionCalculada
        fields = [
            'id', 'venta', 'venta_numero', 'vendedor', 'vendedor_nombre',
            'esquema_aplicado', 'esquema_nombre', 'cliente_nombre',
            'monto_venta', 'monto_utilidad', 'porcentaje_aplicado',
            'comision_venta', 'comision_financiamiento', 'comision_total',
            'estado', 'fecha_calculo', 'fecha_aprobacion', 'fecha_pago',
            'numero_pago', 'observaciones', 'aprobada_por', 'aprobada_por_nombre',
            'pagada_por', 'pagada_por_nombre'
        ]
        read_only_fields = [
            'fecha_calculo', 'monto_venta', 'monto_utilidad', 'porcentaje_aplicado',
            'comision_venta', 'comision_financiamiento', 'comision_total'
        ]


class MetaVendedorSerializer(serializers.ModelSerializer):
    vendedor_nombre = serializers.CharField(source='vendedor.get_full_name', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    
    # Campos calculados de progreso (se calcularán en el viewset)
    progreso_unidades = serializers.IntegerField(read_only=True)
    progreso_monto = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    porcentaje_cumplimiento_unidades = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )
    porcentaje_cumplimiento_monto = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )
    
    class Meta:
        model = MetaVendedor
        fields = [
            'id', 'vendedor', 'vendedor_nombre', 'periodo', 'ano', 'mes',
            'meta_unidades', 'meta_monto', 'bonificacion_cumplimiento',
            'bonificacion_sobrecumplimiento', 'fecha_creacion', 'creado_por',
            'creado_por_nombre', 'progreso_unidades', 'progreso_monto',
            'porcentaje_cumplimiento_unidades', 'porcentaje_cumplimiento_monto'
        ]
        read_only_fields = ['fecha_creacion', 'creado_por']

    def create(self, validated_data):
        validated_data['creado_por'] = self.context['request'].user
        return super().create(validated_data)

    def validate(self, data):
        # Validar que las metas mensuales incluyan el mes
        if data['periodo'] == 'mensual' and not data.get('mes'):
            raise serializers.ValidationError(
                "Las metas mensuales requieren especificar el mes"
            )
        
        # Validar que las metas no mensuales no incluyan mes
        if data['periodo'] != 'mensual' and data.get('mes'):
            raise serializers.ValidationError(
                f"Las metas {data['periodo']}es no deben especificar mes"
            )
        
        return data


class ResumenComisionesSerializer(serializers.Serializer):
    """Serializer para resumen de comisiones de un vendedor"""
    vendedor_id = serializers.IntegerField()
    vendedor_nombre = serializers.CharField()
    periodo_inicio = serializers.DateField()
    periodo_fin = serializers.DateField()
    
    # Totales
    total_ventas = serializers.IntegerField()
    total_monto_ventas = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_comisiones = serializers.DecimalField(max_digits=12, decimal_places=2)
    
    # Desglose
    comision_ventas = serializers.DecimalField(max_digits=12, decimal_places=2)
    comision_financiamiento = serializers.DecimalField(max_digits=12, decimal_places=2)
    bonificaciones = serializers.DecimalField(max_digits=12, decimal_places=2)
    
    # Estados
    comisiones_calculadas = serializers.DecimalField(max_digits=12, decimal_places=2)
    comisiones_aprobadas = serializers.DecimalField(max_digits=12, decimal_places=2)
    comisiones_pagadas = serializers.DecimalField(max_digits=12, decimal_places=2)
    comisiones_pendientes = serializers.DecimalField(max_digits=12, decimal_places=2)