from rest_framework import serializers
from .models import Moto, MotoModelo, MotoInventario

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

class MotoInventarioSerializer(serializers.ModelSerializer):
    precio_con_descuento = serializers.ReadOnlyField()
    
    class Meta:
        model = MotoInventario
        fields = ['id', 'color', 'chasis', 'cantidad_stock', 'descuento_porcentaje', 
                 'precio_con_descuento', 'fecha_ingreso']

class MotoModeloSerializer(serializers.ModelSerializer):
    inventario = MotoInventarioSerializer(many=True, read_only=True)
    ganancia = serializers.ReadOnlyField()
    total_stock = serializers.ReadOnlyField()
    disponible = serializers.ReadOnlyField()
    
    class Meta:
        model = MotoModelo
        fields = ['id', 'marca', 'modelo', 'ano', 'descripcion', 'imagen', 
                 'precio_compra', 'precio_venta', 'ganancia', 'activa', 
                 'fecha_creacion', 'total_stock', 'disponible', 'inventario']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['nombre_completo'] = f"{instance.marca} {instance.modelo} {instance.ano}"
        
        # Agregar resumen de colores disponibles
        inventario_resumen = {}
        for item in instance.inventario.all():
            if item.color in inventario_resumen:
                inventario_resumen[item.color] += item.cantidad_stock
            else:
                inventario_resumen[item.color] = item.cantidad_stock
        
        representation['colores_disponibles'] = inventario_resumen
        return representation

class MotoModeloCreateSerializer(serializers.ModelSerializer):
    inventario_data = serializers.CharField(
        write_only=True, 
        required=False,
        help_text="JSON string containing inventory data"
    )
    
    class Meta:
        model = MotoModelo
        fields = ['marca', 'modelo', 'ano', 'descripcion', 'imagen', 
                 'precio_compra', 'precio_venta', 'activa', 'inventario_data']
    
    def validate(self, data):
        # Verificar si ya existe un modelo con la misma marca, modelo y año
        marca = data.get('marca')
        modelo = data.get('modelo')
        ano = data.get('ano')
        
        if MotoModelo.objects.filter(marca=marca, modelo=modelo, ano=ano).exists():
            raise serializers.ValidationError({
                'non_field_errors': [
                    f"Ya existe un modelo {marca} {modelo} {ano}. "
                    "Para agregar más colores, edite el modelo existente."
                ]
            })
        
        # Validar inventario_data si está presente
        inventario_data_str = data.get('inventario_data', '[]')
        if inventario_data_str:
            try:
                import json
                if isinstance(inventario_data_str, str):
                    inventario_data = json.loads(inventario_data_str)
                    
                    # Validar que cada item tenga los campos requeridos
                    for idx, item in enumerate(inventario_data):
                        if not isinstance(item, dict):
                            raise serializers.ValidationError({
                                'inventario_data': [f"Item {idx + 1}: Debe ser un objeto válido"]
                            })
                        
                        if not item.get('color'):
                            raise serializers.ValidationError({
                                'inventario_data': [f"Item {idx + 1}: El color es requerido"]
                            })
                        
                        cantidad = item.get('cantidad_stock', 0)
                        if not isinstance(cantidad, int) or cantidad < 1:
                            raise serializers.ValidationError({
                                'inventario_data': [f"Item {idx + 1}: La cantidad debe ser un número mayor a 0"]
                            })
                        
                        descuento = item.get('descuento_porcentaje', 0)
                        if not isinstance(descuento, (int, float)) or descuento < 0 or descuento > 100:
                            raise serializers.ValidationError({
                                'inventario_data': [f"Item {idx + 1}: El descuento debe estar entre 0 y 100"]
                            })
                            
            except json.JSONDecodeError as e:
                raise serializers.ValidationError({
                    'inventario_data': [f"JSON inválido: {str(e)}"]
                })
        
        return data
    
    def create(self, validated_data):
        import json
        import logging
        
        logger = logging.getLogger(__name__)
        logger.debug(f"Creating model with validated_data: {validated_data}")
        
        inventario_data_str = validated_data.pop('inventario_data', '[]')
        logger.debug(f"Inventario data string: {inventario_data_str}")
        
        # Parsear el JSON string a lista de diccionarios
        try:
            if isinstance(inventario_data_str, str):
                inventario_data = json.loads(inventario_data_str)
            else:
                inventario_data = inventario_data_str if inventario_data_str else []
            logger.debug(f"Parsed inventario data: {inventario_data}")
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            inventario_data = []
        
        try:
            modelo = MotoModelo.objects.create(**validated_data)
            logger.debug(f"Created model: {modelo}")
            
            for item_data in inventario_data:
                if isinstance(item_data, dict):
                    inventario = MotoInventario.objects.create(modelo=modelo, **item_data)
                    logger.debug(f"Created inventory: {inventario}")
            
            return modelo
        except Exception as e:
            logger.error(f"Error creating model: {e}")
            raise