from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import login
from django.db import models
from django.shortcuts import get_object_or_404
from .models import Usuario, Rol, Cliente, Fiador, Documento, PermisoGranular, RolPermiso
from .serializers import (
    UsuarioSerializer, UsuarioUpdateSerializer, CambiarPasswordSerializer,
    RolSerializer, LoginSerializer, 
    ClienteSerializer, ClienteDetalleSerializer, FiadorSerializer, DocumentoSerializer,
    PermisoGranularSerializer, RolPermisoSerializer, RolConPermisosSerializer,
    UsuarioConPermisosSerializer, AsignarPermisoSerializer, PermisosUsuarioResponseSerializer
)

class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': UsuarioSerializer(user).data,
            'permisos': user.obtener_permisos(),
            'permisos_por_categoria': user.obtener_permisos_por_categoria()
        })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        token = Token.objects.get(user=request.user)
        token.delete()
        return Response({'message': 'Sesión cerrada exitosamente'})
    except Token.DoesNotExist:
        return Response({'error': 'Token no encontrado'}, status=status.HTTP_400_BAD_REQUEST)

class RolListView(generics.ListAPIView):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer

class UsuarioListCreateView(generics.ListCreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    
    def get_queryset(self):
        queryset = Usuario.objects.all()
        rol = self.request.query_params.get('rol', None)
        if rol is not None:
            queryset = queryset.filter(rol__nombre_rol=rol)
        return queryset

class UsuarioDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

class ClienteListCreateView(generics.ListCreateAPIView):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    
    def get_queryset(self):
        queryset = Cliente.objects.all()
        search = self.request.query_params.get('search', None)
        if search is not None:
            queryset = queryset.filter(
                models.Q(nombre__icontains=search) |
                models.Q(apellido__icontains=search) |
                models.Q(cedula__icontains=search)
            )
        return queryset

class ClienteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Cliente.objects.all()
    serializer_class = ClienteDetalleSerializer

class FiadorListCreateView(generics.ListCreateAPIView):
    queryset = Fiador.objects.all()
    serializer_class = FiadorSerializer

class FiadorDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Fiador.objects.all()
    serializer_class = FiadorSerializer

class DocumentoListCreateView(generics.ListCreateAPIView):
    queryset = Documento.objects.all()
    serializer_class = DocumentoSerializer
    
    def get_queryset(self):
        queryset = Documento.objects.all()
        cliente_id = self.request.query_params.get('cliente', None)
        if cliente_id is not None:
            queryset = queryset.filter(cliente_id=cliente_id)
        return queryset

class DocumentoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Documento.objects.all()
    serializer_class = DocumentoSerializer

# Vistas específicas para manejo por cliente
class ClienteFiadorView(APIView):
    """
    Vista para obtener el fiador de un cliente específico
    """
    def get(self, request, cliente_id):
        try:
            cliente = get_object_or_404(Cliente, id=cliente_id)
            fiador = cliente.fiador
            serializer = FiadorSerializer(fiador)
            return Response(serializer.data)
        except Fiador.DoesNotExist:
            return Response({'error': 'Cliente no tiene fiador'}, status=status.HTTP_404_NOT_FOUND)

class ClienteDocumentosView(APIView):
    """
    Vista para obtener todos los documentos de un cliente específico
    """
    def get(self, request, cliente_id):
        cliente = get_object_or_404(Cliente, id=cliente_id)
        documentos = cliente.documentos.all()
        serializer = DocumentoSerializer(documentos, many=True)
        return Response(serializer.data)

# ===== NUEVAS VISTAS PARA GESTIÓN AVANZADA DE USUARIOS =====

class PerfilUsuarioView(APIView):
    """Vista para obtener y actualizar el perfil del usuario actual"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UsuarioUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CambiarPasswordView(APIView):
    """Vista para cambiar la contraseña del usuario"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = CambiarPasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['password_nueva'])
            user.save()
            return Response({'message': 'Contraseña cambiada exitosamente'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EstadisticasUsuariosView(APIView):
    """Vista para obtener estadísticas de usuarios (solo para admins)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.puede_acceder_a('puede_ver_reportes'):
            return Response({'error': 'No tiene permisos para ver estadísticas'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        total_usuarios = Usuario.objects.count()
        usuarios_activos = Usuario.objects.filter(estado=True).count()
        usuarios_por_rol = {}
        
        for rol in Rol.objects.all():
            usuarios_por_rol[rol.get_nombre_rol_display()] = Usuario.objects.filter(rol=rol).count()
        
        return Response({
            'total_usuarios': total_usuarios,
            'usuarios_activos': usuarios_activos,
            'usuarios_inactivos': total_usuarios - usuarios_activos,
            'usuarios_por_rol': usuarios_por_rol
        })

class GestionRolesView(APIView):
    """Vista para gestionar roles (solo para master)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.es_master:
            return Response({'error': 'Solo el master puede gestionar roles'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        roles = Rol.objects.all()
        serializer = RolSerializer(roles, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        if not request.user.es_master:
            return Response({'error': 'Solo el master puede crear roles'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        serializer = RolSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GestionRolDetailView(APIView):
    """Vista para gestionar un rol específico"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, rol_id):
        if not request.user.es_master:
            return Response({'error': 'Solo el master puede ver detalles de roles'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        rol = get_object_or_404(Rol, id=rol_id)
        serializer = RolSerializer(rol)
        return Response(serializer.data)
    
    def put(self, request, rol_id):
        if not request.user.es_master:
            return Response({'error': 'Solo el master puede modificar roles'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        rol = get_object_or_404(Rol, id=rol_id)
        serializer = RolSerializer(rol, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ActivarDesactivarUsuarioView(APIView):
    """Vista para activar/desactivar usuarios"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, usuario_id):
        if not request.user.puede_acceder_a('puede_gestionar_usuarios'):
            return Response({'error': 'No tiene permisos para gestionar usuarios'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        usuario = get_object_or_404(Usuario, id=usuario_id)
        
        # Evitar que se desactive a sí mismo
        if usuario == request.user:
            return Response({'error': 'No puede desactivar su propia cuenta'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Solo el master puede desactivar otros masters
        if usuario.es_master and not request.user.es_master:
            return Response({'error': 'Solo el master puede gestionar otros masters'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        usuario.estado = not usuario.estado
        usuario.save()
        
        return Response({
            'message': f'Usuario {"activado" if usuario.estado else "desactivado"} exitosamente',
            'estado': usuario.estado
        })

class ConfiguracionSistemaView(APIView):
    """Vista para configuraciones del sistema"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.puede_acceder_a('puede_configurar_sistema'):
            return Response({'error': 'No tiene permisos para ver configuraciones'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        return Response({
            'version_sistema': '1.0.0',
            'roles_disponibles': [{'value': k, 'label': v} for k, v in Rol.ROLES_CHOICES],
            'idiomas_disponibles': [{'value': 'es', 'label': 'Español'}, {'value': 'en', 'label': 'English'}],
            'configuraciones_usuario': {
                'tema_oscuro_disponible': True,
                'notificaciones_disponibles': True,
                'cambio_idioma_disponible': True
            }
        })

# ===== VISTAS DE PERMISOS GRANULARES =====

class PermisosGranularesListView(generics.ListAPIView):
    """Vista para listar todos los permisos granulares"""
    queryset = PermisoGranular.objects.filter(activo=True).order_by('categoria', 'nombre')
    serializer_class = PermisoGranularSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Solo usuarios con permiso pueden ver la lista completa
        if not (self.request.user.es_master or self.request.user.tiene_permiso('usuarios.view_usuarios')):
            return PermisoGranular.objects.none()
        
        queryset = super().get_queryset()
        categoria = self.request.query_params.get('categoria', None)
        if categoria:
            queryset = queryset.filter(categoria=categoria)
        return queryset

class RolesConPermisosView(generics.ListAPIView):
    """Vista para listar roles con sus permisos granulares"""
    queryset = Rol.objects.all()
    serializer_class = RolConPermisosSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if not (self.request.user.es_master or self.request.user.tiene_permiso('usuarios.manage_permissions')):
            return Rol.objects.none()
        return super().get_queryset()

class RolPermisosDetailView(APIView):
    """Vista para obtener/modificar permisos de un rol específico"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, rol_id):
        if not (request.user.es_master or request.user.tiene_permiso('usuarios.manage_permissions')):
            return Response({'error': 'No tiene permisos para gestionar permisos'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        rol = get_object_or_404(Rol, id=rol_id)
        serializer = RolConPermisosSerializer(rol)
        return Response(serializer.data)

class AsignarPermisoView(APIView):
    """Vista para asignar/desasignar permisos a roles"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if not (request.user.es_master or request.user.tiene_permiso('usuarios.manage_permissions')):
            return Response({'error': 'No tiene permisos para asignar permisos'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        serializer = AsignarPermisoSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            rol_permiso = serializer.save()
            return Response(RolPermisoSerializer(rol_permiso).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        if not (request.user.es_master or request.user.tiene_permiso('usuarios.manage_permissions')):
            return Response({'error': 'No tiene permisos para remover permisos'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        rol_id = request.data.get('rol_id')
        permiso_id = request.data.get('permiso_id')
        
        if not rol_id or not permiso_id:
            return Response({'error': 'rol_id y permiso_id son requeridos'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            rol_permiso = RolPermiso.objects.get(rol_id=rol_id, permiso_id=permiso_id)
            rol_permiso.delete()
            return Response({'message': 'Permiso removido exitosamente'})
        except RolPermiso.DoesNotExist:
            return Response({'error': 'Relación rol-permiso no encontrada'}, 
                          status=status.HTTP_404_NOT_FOUND)

class PermisosUsuarioView(APIView):
    """Vista para obtener los permisos del usuario actual"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        data = {
            'permisos': user.obtener_permisos(),
            'permisos_por_categoria': user.obtener_permisos_por_categoria(),
            'rol': user.rol.get_nombre_rol_display(),
            'es_master': user.es_master,
            'es_admin': user.es_admin,
        }
        
        serializer = PermisosUsuarioResponseSerializer(data)
        return Response(serializer.data)

class UsuariosConPermisosView(generics.ListAPIView):
    """Vista para listar usuarios con información detallada de permisos"""
    queryset = Usuario.objects.select_related('rol').filter(estado=True)
    serializer_class = UsuarioConPermisosSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.tiene_permiso('usuarios.view_usuarios'):
            return Usuario.objects.none()
        return super().get_queryset()

class ValidarPermisoView(APIView):
    """Vista para validar si un usuario tiene un permiso específico"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        codigo_permiso = request.data.get('codigo_permiso')
        if not codigo_permiso:
            return Response({'error': 'codigo_permiso es requerido'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        tiene_permiso = request.user.tiene_permiso(codigo_permiso)
        return Response({
            'codigo_permiso': codigo_permiso,
            'tiene_permiso': tiene_permiso,
            'usuario': request.user.username,
            'rol': request.user.rol.get_nombre_rol_display()
        })

class EstadisticasPermisosView(APIView):
    """Vista para obtener estadísticas de permisos del sistema"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not (request.user.es_master or request.user.tiene_permiso('usuarios.manage_permissions')):
            return Response({'error': 'No tiene permisos para ver estadísticas de permisos'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        total_permisos = PermisoGranular.objects.filter(activo=True).count()
        permisos_criticos = PermisoGranular.objects.filter(activo=True, es_critico=True).count()
        
        permisos_por_categoria = {}
        for categoria, label in PermisoGranular.CATEGORIA_CHOICES:
            count = PermisoGranular.objects.filter(categoria=categoria, activo=True).count()
            permisos_por_categoria[label] = count
        
        roles_stats = []
        for rol in Rol.objects.all():
            permisos_asignados = rol.permisos_granulares.filter(permiso__activo=True, activo=True).count()
            usuarios_con_rol = Usuario.objects.filter(rol=rol, estado=True).count()
            roles_stats.append({
                'rol': rol.get_nombre_rol_display(),
                'permisos_asignados': permisos_asignados,
                'usuarios_activos': usuarios_con_rol
            })
        
        return Response({
            'total_permisos': total_permisos,
            'permisos_criticos': permisos_criticos,
            'permisos_por_categoria': permisos_por_categoria,
            'roles_estadisticas': roles_stats
        })
