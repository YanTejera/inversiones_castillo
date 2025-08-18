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
    
    class Meta:
        model = Cliente
        fields = ['id', 'nombre', 'apellido', 'direccion', 'ciudad', 'pais', 
                 'cedula', 'telefono', 'celular', 'email', 'estado_civil', 
                 'fecha_nacimiento', 'ocupacion', 'ingresos', 'referencias_personales',
                 'fecha_registro', 'nombre_completo', 'fiador', 'documentos']