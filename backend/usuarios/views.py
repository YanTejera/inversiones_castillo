from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login
from django.db import models
from .models import Usuario, Rol, Cliente, Fiador, Documento
from .serializers import (
    UsuarioSerializer, RolSerializer, LoginSerializer, 
    ClienteSerializer, FiadorSerializer, DocumentoSerializer
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
            'user': UsuarioSerializer(user).data
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
    serializer_class = ClienteSerializer

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
