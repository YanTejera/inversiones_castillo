from rest_framework import serializers
from .models import Moto, MotoModelo, MotoInventario, Proveedor

class MotoSerializer(serializers.ModelSerializer):
    ganancia = serializers.ReadOnlyField()
    disponible = serializers.ReadOnlyField()
    
    class Meta:
        model = Moto
        fields = ['id', 'marca', 'modelo', 'ano', 'condicion', 'chasis', 'precio_compra', 
                 'precio_venta', 'ganancia', 'cantidad_stock', 'descripcion', 
                 'imagen', 'fecha_ingreso', 'activa', 'disponible', 'cilindraje', 'tipo_motor',
                 'potencia', 'torque', 'combustible', 'transmision', 'peso', 'capacidad_tanque']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['nombre_completo'] = f"{instance.marca} {instance.modelo} {instance.ano}"
        
        # Generar URL absoluta para imagen
        if instance.imagen:
            from django.conf import settings
            
            imagen_url = str(instance.imagen)
            print(f"🖼️ [Moto] DEBUG={settings.DEBUG}, Imagen original: {imagen_url}")
            
            if settings.DEBUG:
                base_url = 'http://localhost:8000'
                full_url = f"{base_url}{settings.MEDIA_URL}{imagen_url}"
            else:
                full_url = f"{settings.MEDIA_URL}{imagen_url}"
            
            representation['imagen'] = full_url
            print(f"🖼️ [Moto] URL final: {full_url}")
        
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
        
        # Asegurar URL absoluta para imagen (si existe)
        if hasattr(instance, 'imagen') and instance.imagen:
            from django.conf import settings
            from decouple import config
            imagen_url = representation.get('imagen', '')
            if imagen_url and not imagen_url.startswith('http'):
                if settings.DEBUG:
                    # Desarrollo local
                    backend_url = 'http://localhost:8000'
                    representation['imagen'] = f"{backend_url}{imagen_url}"
                else:
                    # Producción
                    backend_url = config('RENDER_EXTERNAL_URL', default='https://inversiones-castillo.onrender.com')
                    representation['imagen'] = f"{backend_url}{imagen_url}"
        
        return representation

class MotoInventarioSerializer(serializers.ModelSerializer):
    precio_con_descuento = serializers.ReadOnlyField()
    
    class Meta:
        model = MotoInventario
        fields = ['id', 'color', 'chasis', 'cantidad_stock', 'descuento_porcentaje', 
                 'precio_con_descuento', 'fecha_ingreso', 'precio_compra_individual', 
                 'tasa_dolar', 'fecha_compra']

class MotoModeloSerializer(serializers.ModelSerializer):
    inventario = MotoInventarioSerializer(many=True, read_only=True)
    ganancia = serializers.ReadOnlyField()
    total_stock = serializers.ReadOnlyField()
    disponible = serializers.ReadOnlyField()
    proveedor_nombre = serializers.CharField(source='proveedor.nombre_completo', read_only=True)
    
    class Meta:
        model = MotoModelo
        fields = ['id', 'marca', 'modelo', 'ano', 'condicion', 'descripcion', 'imagen', 
                 'precio_compra', 'precio_venta', 'moneda_compra', 'moneda_venta', 'proveedor', 'proveedor_nombre', 'ganancia', 'activa', 
                 'fecha_creacion', 'total_stock', 'disponible', 'inventario', 'cilindraje', 'tipo_motor',
                 'potencia', 'torque', 'combustible', 'transmision', 'peso', 'capacidad_tanque']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['nombre_completo'] = f"{instance.marca} {instance.modelo} {instance.ano}"
        
        # Generar URL absoluta para imagen
        if instance.imagen:
            from django.conf import settings
            
            imagen_url = str(instance.imagen)
            print(f"🖼️ [MotoModelo] DEBUG={settings.DEBUG}, Imagen original: {imagen_url}")
            print(f"🖼️ [MotoModelo] MEDIA_URL={settings.MEDIA_URL}")
            
            # Usar la configuración de Django para generar la URL
            if settings.DEBUG:
                base_url = 'http://localhost:8000'
                full_url = f"{base_url}{settings.MEDIA_URL}{imagen_url}"
            else:
                # En producción, usar la configuración ya establecida en settings
                full_url = f"{settings.MEDIA_URL}{imagen_url}"
            
            representation['imagen'] = full_url
            print(f"🖼️ [MotoModelo] URL final: {full_url}")
        
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
        fields = ['marca', 'modelo', 'ano', 'condicion', 'descripcion', 'imagen', 
                 'precio_compra', 'precio_venta', 'moneda_compra', 'moneda_venta', 'proveedor', 'activa', 'inventario_data', 'cilindraje', 'tipo_motor',
                 'potencia', 'torque', 'combustible', 'transmision', 'peso', 'capacidad_tanque']
    
    def validate(self, data):
        # Solo verificar duplicados al crear (no al actualizar)
        if not self.instance:  # Si es creación (no update)
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
        print(f"🔍 VALIDATING INVENTARIO DATA: {inventario_data_str}")
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
                        print(f"🔍 ITEM {idx + 1}: descuento_porcentaje = {descuento} (type: {type(descuento)})")
                        # Descuento es opcional, pero si se proporciona debe estar entre 0 y 100
                        if descuento is not None and descuento != '':
                            try:
                                # Convertir a float si es string
                                if isinstance(descuento, str):
                                    descuento = float(descuento)
                                if not isinstance(descuento, (int, float)) or descuento < 0 or descuento > 100:
                                    raise serializers.ValidationError({
                                        'inventario_data': [f"Item {idx + 1}: El descuento debe estar entre 0 y 100 (valor recibido: {descuento})"]
                                    })
                            except (ValueError, TypeError):
                                raise serializers.ValidationError({
                                    'inventario_data': [f"Item {idx + 1}: El descuento debe ser un número válido (valor recibido: {descuento})"]
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
                    # Limpiar campos que no pertenecen al modelo MotoInventario
                    clean_item_data = {}
                    valid_fields = ['color', 'chasis', 'cantidad_stock', 'descuento_porcentaje', 
                                  'precio_compra_individual', 'tasa_dolar', 'fecha_compra']
                    for field in valid_fields:
                        if field in item_data:
                            clean_item_data[field] = item_data[field]
                    
                    inventario = MotoInventario.objects.create(modelo=modelo, **clean_item_data)
                    logger.debug(f"Created inventory: {inventario}")
            
            return modelo
        except Exception as e:
            logger.error(f"Error creating model: {e}")
            raise
    
    def update(self, instance, validated_data):
        import json
        import logging
        
        logger = logging.getLogger(__name__)
        print(f"🔄 UPDATING MODEL {instance.id} with validated_data: {validated_data}")
        logger.debug(f"Updating model {instance.id} with validated_data: {validated_data}")
        
        # Extraer inventario_data antes de actualizar el modelo
        inventario_data_str = validated_data.pop('inventario_data', None)
        print(f"📦 INVENTARIO DATA STRING: {inventario_data_str}")
        logger.debug(f"Inventario data string: {inventario_data_str}")
        
        # Actualizar campos básicos del modelo
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        logger.debug(f"Updated basic fields for model: {instance}")
        
        # Manejar inventario_data si está presente
        if inventario_data_str:
            try:
                if isinstance(inventario_data_str, str):
                    inventario_data = json.loads(inventario_data_str)
                else:
                    inventario_data = inventario_data_str if inventario_data_str else []
                logger.debug(f"Parsed inventario data: {inventario_data}")
                
                # Eliminar inventario existente
                instance.inventario.all().delete()
                logger.debug("Deleted existing inventory")
                
                # Crear nuevo inventario
                for item_data in inventario_data:
                    if isinstance(item_data, dict):
                        # Limpiar campos que no pertenecen al modelo MotoInventario
                        clean_item_data = {}
                        valid_fields = ['color', 'chasis', 'cantidad_stock', 'descuento_porcentaje', 
                                      'precio_compra_individual', 'tasa_dolar', 'fecha_compra']
                        for field in valid_fields:
                            if field in item_data:
                                clean_item_data[field] = item_data[field]
                        
                        print(f"🧹 CLEANED ITEM DATA: {clean_item_data}")
                        inventario = MotoInventario.objects.create(modelo=instance, **clean_item_data)
                        logger.debug(f"Created new inventory: {inventario}")
                        
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error during update: {e}")
            except Exception as e:
                logger.error(f"Error updating inventory: {e}")
                raise
        
        return instance

class ProveedorSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.ReadOnlyField()
    contacto_principal = serializers.ReadOnlyField()
    telefono_principal = serializers.ReadOnlyField()
    email_principal = serializers.ReadOnlyField()
    esta_activo = serializers.ReadOnlyField()
    total_compras = serializers.SerializerMethodField()
    total_motocicletas = serializers.SerializerMethodField()
    
    class Meta:
        model = Proveedor
        fields = [
            'id', 'nombre', 'nombre_comercial', 'tipo_proveedor', 'ruc', 'cedula', 
            'registro_mercantil', 'telefono', 'telefono2', 'email', 'sitio_web',
            'direccion', 'ciudad', 'provincia', 'pais', 'codigo_postal',
            'persona_contacto', 'cargo_contacto', 'telefono_contacto', 'email_contacto',
            'moneda_preferida', 'terminos_pago', 'limite_credito', 'descuento_general',
            'estado', 'fecha_inicio_relacion', 'notas', 'fecha_creacion', 'fecha_actualizacion',
            'creado_por', 'nombre_completo', 'contacto_principal', 'telefono_principal',
            'email_principal', 'esta_activo', 'total_compras', 'total_motocicletas'
        ]
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion', 'creado_por']
    
    def get_total_compras(self, obj):
        return obj.total_compras()
    
    def get_total_motocicletas(self, obj):
        return obj.total_motocicletas()

class ProveedorCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = [
            'nombre', 'nombre_comercial', 'tipo_proveedor', 'ruc', 'cedula',
            'registro_mercantil', 'telefono', 'telefono2', 'email', 'sitio_web',
            'direccion', 'ciudad', 'provincia', 'pais', 'codigo_postal',
            'persona_contacto', 'cargo_contacto', 'telefono_contacto', 'email_contacto',
            'moneda_preferida', 'terminos_pago', 'limite_credito', 'descuento_general',
            'estado', 'fecha_inicio_relacion', 'notas'
        ]
    
    def validate(self, data):
        # Validar que al menos RUC o cédula esté presente
        if not data.get('ruc') and not data.get('cedula'):
            raise serializers.ValidationError({
                'non_field_errors': ['Debe proporcionar al menos RUC o cédula del proveedor.']
            })
        
        # Validar que la dirección esté presente
        if not data.get('direccion'):
            raise serializers.ValidationError({
                'direccion': ['La dirección es requerida.']
            })
        
        return data
    
    def create(self, validated_data):
        # Asignar el usuario que crea el proveedor
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['creado_por'] = request.user
        
        return super().create(validated_data)

class ProveedorListSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.ReadOnlyField()
    esta_activo = serializers.ReadOnlyField()
    contacto_principal = serializers.ReadOnlyField()
    telefono_principal = serializers.ReadOnlyField()
    total_motocicletas = serializers.SerializerMethodField()
    
    class Meta:
        model = Proveedor
        fields = [
            'id', 'nombre_completo', 'tipo_proveedor', 'ciudad', 'pais',
            'contacto_principal', 'telefono_principal', 'email', 'estado',
            'esta_activo', 'total_motocicletas', 'fecha_creacion'
        ]
    
    def get_total_motocicletas(self, obj):
        return obj.total_motocicletas()