from rest_framework import serializers
from .models import Moto

class MotoSerializer(serializers.ModelSerializer):
    ganancia = serializers.ReadOnlyField()
    disponible = serializers.ReadOnlyField()
    
    class Meta:
        model = Moto
        fields = ['id', 'marca', 'modelo', 'ano', 'chasis', 'precio_compra', 
                 'precio_venta', 'ganancia', 'cantidad_stock', 'descripcion', 
                 'imagen', 'fecha_ingreso', 'activa', 'disponible']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['nombre_completo'] = f"{instance.marca} {instance.modelo} {instance.ano}"
        return representation

class MotoDisponibleSerializer(serializers.ModelSerializer):
    ganancia = serializers.ReadOnlyField()
    
    class Meta:
        model = Moto
        fields = ['id', 'marca', 'modelo', 'ano', 'chasis', 'precio_venta', 
                 'ganancia', 'cantidad_stock']
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['nombre_completo'] = f"{instance.marca} {instance.modelo} {instance.ano}"
        return representation