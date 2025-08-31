from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db.models import Q, Count, Sum, F, Case, When, IntegerField
from django.http import HttpResponse
from django.utils import timezone
import qrcode
import io
import base64
from .models import (
    Almacen, Zona, Pasillo, Ubicacion, 
    MovimientoInventario, MotoInventarioLocation
)
from .serializers import (
    AlmacenSerializer, ZonaSerializer, PasilloSerializer, 
    UbicacionSerializer, MovimientoInventarioSerializer,
    MotoInventarioLocationSerializer
)


class AlmacenViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar almacenes"""
    queryset = Almacen.objects.all()
    serializer_class = AlmacenSerializer
    permission_classes = [AllowAny]
    
    @action(detail=True, methods=['get'])
    def estadisticas(self, request, pk=None):
        """Obtiene estadísticas de un almacén específico"""
        almacen = self.get_object()
        
        # Estadísticas básicas
        total_zonas = almacen.zonas.filter(activo=True).count()
        total_ubicaciones = Ubicacion.objects.filter(
            pasillo__zona__almacen=almacen,
            activo=True
        ).count()
        
        # Capacidad y ocupación
        capacidad_total = almacen.zonas.filter(activo=True).aggregate(
            total=Sum('capacidad_maxima')
        )['total'] or 0
        
        ocupacion_total = Ubicacion.objects.filter(
            pasillo__zona__almacen=almacen,
            activo=True
        ).count()  # Simplificado por ahora
        
        # Distribución por zonas
        zonas_stats = []
        for zona in almacen.zonas.filter(activo=True):
            zonas_stats.append({
                'zona': zona.nombre,
                'tipo': zona.get_tipo_display(),
                'ocupacion': zona.ocupacion_actual,
                'capacidad': zona.capacidad_maxima,
                'porcentaje': zona.porcentaje_ocupacion
            })
        
        return Response({
            'almacen': almacen.nombre,
            'total_zonas': total_zonas,
            'total_ubicaciones': total_ubicaciones,
            'capacidad_total': capacidad_total,
            'ocupacion_total': ocupacion_total,
            'porcentaje_ocupacion': (ocupacion_total / capacidad_total * 100) if capacidad_total > 0 else 0,
            'distribución_zonas': zonas_stats
        })


class ZonaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar zonas"""
    queryset = Zona.objects.all()
    serializer_class = ZonaSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Zona.objects.all()
        almacen_id = self.request.query_params.get('almacen')
        tipo = self.request.query_params.get('tipo')
        
        if almacen_id:
            queryset = queryset.filter(almacen_id=almacen_id)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
            
        return queryset.select_related('almacen')


class PasilloViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar pasillos"""
    queryset = Pasillo.objects.all()
    serializer_class = PasilloSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Pasillo.objects.all()
        zona_id = self.request.query_params.get('zona')
        
        if zona_id:
            queryset = queryset.filter(zona_id=zona_id)
            
        return queryset.select_related('zona__almacen')


class UbicacionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar ubicaciones específicas"""
    queryset = Ubicacion.objects.all()
    serializer_class = UbicacionSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Ubicacion.objects.all()
        pasillo_id = self.request.query_params.get('pasillo')
        zona_id = self.request.query_params.get('zona')
        almacen_id = self.request.query_params.get('almacen')
        disponible = self.request.query_params.get('disponible')
        
        if pasillo_id:
            queryset = queryset.filter(pasillo_id=pasillo_id)
        if zona_id:
            queryset = queryset.filter(pasillo__zona_id=zona_id)
        if almacen_id:
            queryset = queryset.filter(pasillo__zona__almacen_id=almacen_id)
        if disponible == 'true':
            queryset = queryset.filter(activo=True, reservado=False)
            
        return queryset.select_related('pasillo__zona__almacen')
    
    @action(detail=True, methods=['post'])
    def generar_qr(self, request, pk=None):
        """Genera código QR para una ubicación"""
        ubicacion = self.get_object()
        
        # Datos para el QR
        qr_data = {
            'tipo': 'ubicacion',
            'uuid': str(ubicacion.qr_code_uuid),
            'codigo': ubicacion.codigo_completo,
            'nombre': ubicacion.nombre,
            'almacen': ubicacion.pasillo.zona.almacen.codigo
        }
        
        # Crear QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(f"UBICACION:{ubicacion.qr_code_uuid}")
        qr.make(fit=True)
        
        # Generar imagen
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convertir a base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        qr_image_b64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Actualizar registro
        ubicacion.qr_code_generado = True
        ubicacion.fecha_ultimo_qr = timezone.now()
        ubicacion.save()
        
        return Response({
            'qr_code': f"data:image/png;base64,{qr_image_b64}",
            'uuid': str(ubicacion.qr_code_uuid),
            'codigo': ubicacion.codigo_completo,
            'datos': qr_data
        })
    
    @action(detail=True, methods=['get'])
    def inventario(self, request, pk=None):
        """Obtiene el inventario actual de una ubicación"""
        ubicacion = self.get_object()
        
        inventario_items = ubicacion.inventario_items.select_related(
            'inventario__modelo'
        ).all()
        
        items_data = []
        for item in inventario_items:
            items_data.append({
                'inventario_id': item.inventario.id,
                'modelo': f"{item.inventario.modelo.marca} {item.inventario.modelo.modelo}",
                'color': item.inventario.color,
                'cantidad': 1,  # Simplificado por ahora
                'fecha_asignacion': item.fecha_asignacion
            })
        
        return Response({
            'ubicacion': ubicacion.codigo_completo,
            'direccion': ubicacion.direccion_legible,
            'capacidad': ubicacion.capacidad_maxima,
            'ocupacion': ubicacion.ocupacion_actual,
            'espacios_libres': ubicacion.espacios_libres,
            'inventario': items_data
        })


class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar movimientos de inventario"""
    queryset = MovimientoInventario.objects.all()
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = MovimientoInventario.objects.select_related(
            'inventario_item__modelo',
            'ubicacion_origen__pasillo__zona__almacen',
            'ubicacion_destino__pasillo__zona__almacen'
        )
        
        # Filtros
        inventario_id = self.request.query_params.get('inventario')
        tipo = self.request.query_params.get('tipo')
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        
        if inventario_id:
            queryset = queryset.filter(inventario_item_id=inventario_id)
        if tipo:
            queryset = queryset.filter(tipo_movimiento=tipo)
        if fecha_desde:
            queryset = queryset.filter(fecha_movimiento__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_movimiento__lte=fecha_hasta)
            
        return queryset


class LocationManagerView(APIView):
    """Vista principal para la gestión de ubicaciones"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Obtiene resumen completo del sistema de ubicaciones"""
        try:
            # Estadísticas generales
            total_almacenes = Almacen.objects.filter(activo=True).count()
            total_zonas = Zona.objects.filter(activo=True).count()
            total_ubicaciones = Ubicacion.objects.filter(activo=True).count()
            
            # Capacidad total vs ocupación
            capacidad_total = Zona.objects.filter(activo=True).aggregate(
                total=Sum('capacidad_maxima')
            )['total'] or 0
            
            ocupacion_total = 0  # Simplificado por ahora
            
            # Distribución por tipo de zona
            distribucion_zonas = Zona.objects.filter(activo=True).values('tipo').annotate(
                count=Count('id'),
                capacidad=Sum('capacidad_maxima')
            ).order_by('tipo')
            
            # Top ubicaciones más ocupadas (simplificado por ahora)
            ubicaciones_ocupadas = Ubicacion.objects.filter(
                activo=True
            ).order_by('-capacidad_maxima')[:10]
            
            ubicaciones_data = []
            for ub in ubicaciones_ocupadas:
                ubicaciones_data.append({
                    'codigo': ub.codigo_completo,
                    'nombre': ub.nombre,
                    'ocupacion': 0,  # Simplificado por ahora
                    'capacidad': ub.capacidad_maxima,
                    'porcentaje': 0  # Simplificado por ahora
                })
            
            # Movimientos recientes (simplificado por ahora)
            movimientos_data = []  # Vacío por ahora
            
            return Response({
                'resumen': {
                    'total_almacenes': total_almacenes,
                    'total_zonas': total_zonas,
                    'total_ubicaciones': total_ubicaciones,
                    'capacidad_total': capacidad_total,
                    'ocupacion_total': ocupacion_total,
                    'porcentaje_ocupacion': (ocupacion_total / capacidad_total * 100) if capacidad_total > 0 else 0
                },
                'distribucion_zonas': list(distribucion_zonas),
                'ubicaciones_mas_ocupadas': ubicaciones_data,
                'movimientos_recientes': movimientos_data
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error al cargar datos de ubicaciones: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class QRScannerView(APIView):
    """Vista para procesar códigos QR escaneados"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Procesa un código QR escaneado"""
        try:
            qr_data = request.data.get('qr_data', '')
            
            if not qr_data:
                return Response(
                    {'error': 'No se proporcionó datos del QR'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Procesar QR de ubicación
            if qr_data.startswith('UBICACION:'):
                uuid_str = qr_data.replace('UBICACION:', '')
                
                try:
                    ubicacion = Ubicacion.objects.select_related(
                        'pasillo__zona__almacen'
                    ).get(qr_code_uuid=uuid_str)
                    
                    # Obtener inventario actual
                    inventario_items = ubicacion.inventario_items.select_related(
                        'inventario__modelo'
                    ).all()
                    
                    items_data = []
                    for item in inventario_items:
                        items_data.append({
                            'inventario_id': item.inventario.id,
                            'modelo': f"{item.inventario.modelo.marca} {item.inventario.modelo.modelo}",
                            'color': item.inventario.color,
                            'cantidad': 1,  # Simplificado por ahora
                        })
                    
                    return Response({
                        'tipo': 'ubicacion',
                        'ubicacion': {
                            'id': ubicacion.id,
                            'codigo': ubicacion.codigo_completo,
                            'nombre': ubicacion.nombre,
                            'direccion': ubicacion.direccion_legible,
                            'capacidad': ubicacion.capacidad_maxima,
                            'ocupacion': ubicacion.ocupacion_actual,
                            'espacios_libres': ubicacion.espacios_libres,
                            'inventario': items_data
                        }
                    })
                    
                except Ubicacion.DoesNotExist:
                    return Response(
                        {'error': 'Ubicación no encontrada'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                return Response(
                    {'error': 'Formato de QR no reconocido'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Error al procesar QR: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )