from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Usuario, Rol, Cliente, Fiador, Documento

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ['id', 'nombre_rol', 'descripcion']

class UsuarioSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.CharField(source='rol.nombre_rol', read_only=True)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                 'telefono', 'rol', 'rol_nombre', 'estado', 'fecha_creacion', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user

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
    class Meta:
        model = Fiador
        fields = '__all__'

class DocumentoSerializer(serializers.ModelSerializer):
    tipo_documento_display = serializers.CharField(source='get_tipo_documento_display', read_only=True)
    
    class Meta:
        model = Documento
        fields = ['id', 'tipo_documento', 'tipo_documento_display', 'descripcion', 
                 'archivo', 'fecha_creacion', 'cliente']

class ClienteSerializer(serializers.ModelSerializer):
    fiador = FiadorSerializer(read_only=True)
    documentos = DocumentoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Cliente
        fields = ['id', 'nombre', 'apellido', 'direccion', 'ciudad', 'pais', 
                 'cedula', 'telefono', 'celular', 'email', 'estado_civil', 
                 'fecha_registro', 'fiador', 'documentos']
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['nombre_completo'] = f"{instance.nombre} {instance.apellido}"
        return representation