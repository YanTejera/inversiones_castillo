from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.utils import timezone

from .models import Notificacion, PreferenciaNotificacion
from .serializers import (
    NotificacionSerializer, NotificacionCreateSerializer,
    PreferenciaNotificacionSerializer, NotificacionResumenSerializer,
    MarcarLeidaSerializer
)


class NotificacionListView(generics.ListAPIView):
    """Lista las notificaciones del usuario autenticado"""
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Construir filtros de notificaciones de manera segura
        filters = Q(usuario=user) | Q(es_global=True)
        
        # Agregar filtro por rol solo si el usuario tiene rol
        if hasattr(user, 'rol') and user.rol:
            filters |= Q(roles_destinatarios__icontains=user.rol.nombre_rol)
        
        # Filtros por parámetros de query
        queryset = Notificacion.objects.filter(filters).select_related('usuario')
        
        # Filtrar por leídas/no leídas
        leidas = self.request.query_params.get('leidas')
        if leidas is not None:
            queryset = queryset.filter(leida=leidas.lower() == 'true')
        
        # Filtrar por tipo
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        
        # Filtrar por prioridad
        prioridad = self.request.query_params.get('prioridad')
        if prioridad:
            queryset = queryset.filter(prioridad=prioridad)
        
        # Excluir expiradas por defecto
        incluir_expiradas = self.request.query_params.get('incluir_expiradas', 'false')
        if incluir_expiradas.lower() != 'true':
            queryset = queryset.filter(
                Q(fecha_expiracion__isnull=True) | Q(fecha_expiracion__gt=timezone.now())
            )
        
        return queryset.order_by('-fecha_creacion')


class NotificacionCreateView(generics.CreateAPIView):
    """Crear una nueva notificación"""
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionCreateSerializer
    permission_classes = [IsAuthenticated]


class NotificacionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Obtener, actualizar o eliminar una notificación específica"""
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Construir filtros de notificaciones de manera segura
        filters = Q(usuario=user) | Q(es_global=True)
        
        # Agregar filtro por rol solo si el usuario tiene rol
        if hasattr(user, 'rol') and user.rol:
            filters |= Q(roles_destinatarios__icontains=user.rol.nombre_rol)
        
        return Notificacion.objects.filter(filters)


class NotificacionResumenView(APIView):
    """Vista para obtener resumen de notificaciones del usuario"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Construir filtros de notificaciones de manera segura
        filters = Q(usuario=user) | Q(es_global=True)
        
        # Agregar filtro por rol solo si el usuario tiene rol
        if hasattr(user, 'rol') and user.rol:
            filters |= Q(roles_destinatarios__icontains=user.rol.nombre_rol)
        
        # Obtener notificaciones del usuario
        notificaciones = Notificacion.objects.filter(filters).filter(
            Q(fecha_expiracion__isnull=True) | Q(fecha_expiracion__gt=timezone.now())
        ).select_related('usuario')
        
        # Calcular estadísticas
        total = notificaciones.count()
        no_leidas = notificaciones.filter(leida=False).count()
        urgentes = notificaciones.filter(prioridad__in=['alta', 'urgente'], leida=False).count()
        
        # Agrupar por tipo
        por_tipo = dict(notificaciones.values('tipo').annotate(count=Count('tipo')).values_list('tipo', 'count'))
        
        # Obtener las 5 más recientes no leídas
        recientes = notificaciones.filter(leida=False).order_by('-fecha_creacion')[:5]
        
        # Crear datos básicos sin serializer complejo para evitar errores
        recientes_data = []
        for notif in recientes:
            recientes_data.append({
                'id': notif.id,
                'titulo': notif.titulo,
                'mensaje': notif.mensaje,
                'tipo': notif.tipo,
                'prioridad': notif.prioridad,
                'fecha_creacion': notif.fecha_creacion.isoformat(),
                'leida': notif.leida
            })
        
        data = {
            'total': total,
            'no_leidas': no_leidas,
            'urgentes': urgentes,
            'por_tipo': por_tipo,
            'recientes': recientes_data
        }
        
        return Response(data)


class MarcarLeidaView(APIView):
    """Marcar notificaciones como leídas"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = MarcarLeidaSerializer(data=request.data)
        
        if serializer.is_valid():
            user = request.user
            notificacion_ids = serializer.validated_data['notificacion_ids']
            
            # Construir filtros de notificaciones de manera segura
            filters = Q(usuario=user) | Q(es_global=True)
            
            # Agregar filtro por rol solo si el usuario tiene rol
            if hasattr(user, 'rol') and user.rol:
                filters |= Q(roles_destinatarios__icontains=user.rol.nombre_rol)
            
            # Filtrar notificaciones del usuario
            notificaciones = Notificacion.objects.filter(
                id__in=notificacion_ids
            ).filter(filters)
            
            # Marcar como leídas
            updated = 0
            for notificacion in notificaciones:
                if not notificacion.leida:
                    notificacion.marcar_como_leida()
                    updated += 1
            
            return Response({
                'message': f'Se marcaron {updated} notificaciones como leídas',
                'updated_count': updated
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MarcarTodasLeidasView(APIView):
    """Marcar todas las notificaciones del usuario como leídas"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        # Construir filtros de notificaciones de manera segura
        filters = Q(usuario=user) | Q(es_global=True)
        
        # Agregar filtro por rol solo si el usuario tiene rol
        if hasattr(user, 'rol') and user.rol:
            filters |= Q(roles_destinatarios__icontains=user.rol.nombre_rol)
        
        # Obtener notificaciones no leídas del usuario
        notificaciones = Notificacion.objects.filter(
            filters,
            leida=False
        ).filter(
            Q(fecha_expiracion__isnull=True) | Q(fecha_expiracion__gt=timezone.now())
        )
        
        updated = 0
        for notificacion in notificaciones:
            notificacion.marcar_como_leida()
            updated += 1
        
        return Response({
            'message': f'Se marcaron {updated} notificaciones como leídas',
            'updated_count': updated
        })


class PreferenciaNotificacionView(APIView):
    """Vista para obtener y actualizar preferencias de notificaciones"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        preferencia, created = PreferenciaNotificacion.objects.get_or_create(usuario=user)
        
        serializer = PreferenciaNotificacionSerializer(preferencia)
        return Response(serializer.data)
    
    def patch(self, request):
        user = request.user
        preferencia, created = PreferenciaNotificacion.objects.get_or_create(usuario=user)
        
        serializer = PreferenciaNotificacionSerializer(preferencia, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_notificacion_rapida(request):
    """Endpoint para crear notificaciones rápidas desde otros módulos"""
    data = request.data.copy()
    
    # Si no se especifica usuario, usar el usuario actual
    if not data.get('usuario') and not data.get('es_global'):
        data['usuario'] = request.user.id
    
    serializer = NotificacionCreateSerializer(data=data)
    
    if serializer.is_valid():
        notificacion = serializer.save()
        return Response(
            NotificacionSerializer(notificacion).data,
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def suscribir_push(request):
    """Endpoint para suscribirse a notificaciones push"""
    user = request.user
    subscription_data = request.data.get('subscription')
    
    if not subscription_data:
        return Response(
            {'error': 'Datos de suscripción requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Obtener o crear preferencias
    preferencia, created = PreferenciaNotificacion.objects.get_or_create(usuario=user)
    preferencia.push_subscription = subscription_data
    preferencia.enviar_push = True
    preferencia.save()
    
    return Response({'message': 'Suscripción a push notifications guardada exitosamente'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def desuscribir_push(request):
    """Endpoint para desuscribirse de notificaciones push"""
    user = request.user
    
    try:
        preferencia = PreferenciaNotificacion.objects.get(usuario=user)
        preferencia.push_subscription = None
        preferencia.enviar_push = False
        preferencia.save()
        
        return Response({'message': 'Desuscripción exitosa'})
    except PreferenciaNotificacion.DoesNotExist:
        return Response({'message': 'No había suscripción activa'})