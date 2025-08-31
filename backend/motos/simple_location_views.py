from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db.models import Count, Sum
from django.utils import timezone
import qrcode
import io
import base64
from .models import Almacen, Zona, Pasillo, Ubicacion

# Serializers simples
class SimpleUbicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ubicacion
        fields = '__all__'

class SimpleAlmacenViewSet(viewsets.ModelViewSet):
    """ViewSet simplificado para almacenes"""
    queryset = Almacen.objects.all()
    permission_classes = [AllowAny]
    
    def list(self, request):
        almacenes = Almacen.objects.all()
        data = []
        for almacen in almacenes:
            data.append({
                'id': almacen.id,
                'nombre': almacen.nombre,
                'codigo': almacen.codigo,
                'direccion': almacen.direccion,
                'descripcion': almacen.descripcion,
                'activo': almacen.activo,
                'fecha_creacion': almacen.fecha_creacion
            })
        return Response(data)

class SimpleZonaViewSet(viewsets.ModelViewSet):
    """ViewSet simplificado para zonas"""
    queryset = Zona.objects.all()
    permission_classes = [AllowAny]
    
    def list(self, request):
        zonas = Zona.objects.select_related('almacen').all()
        almacen_id = request.query_params.get('almacen')
        if almacen_id:
            zonas = zonas.filter(almacen_id=almacen_id)
            
        data = []
        for zona in zonas:
            data.append({
                'id': zona.id,
                'nombre': zona.nombre,
                'codigo': zona.codigo,
                'tipo': zona.tipo,
                'capacidad_maxima': zona.capacidad_maxima,
                'descripcion': zona.descripcion,
                'activo': zona.activo,
                'almacen': {
                    'id': zona.almacen.id,
                    'nombre': zona.almacen.nombre,
                    'codigo': zona.almacen.codigo
                }
            })
        return Response(data)

class SimplePasilloViewSet(viewsets.ModelViewSet):
    """ViewSet simplificado para pasillos"""
    queryset = Pasillo.objects.all()
    permission_classes = [AllowAny]
    
    def list(self, request):
        pasillos = Pasillo.objects.select_related('zona__almacen').all()
        zona_id = request.query_params.get('zona')
        if zona_id:
            pasillos = pasillos.filter(zona_id=zona_id)
            
        data = []
        for pasillo in pasillos:
            data.append({
                'id': pasillo.id,
                'nombre': pasillo.nombre,
                'codigo': pasillo.codigo,
                'numero_orden': pasillo.numero_orden,
                'activo': pasillo.activo,
                'zona': {
                    'id': pasillo.zona.id,
                    'nombre': pasillo.zona.nombre,
                    'codigo': pasillo.zona.codigo,
                    'almacen': {
                        'id': pasillo.zona.almacen.id,
                        'nombre': pasillo.zona.almacen.nombre,
                        'codigo': pasillo.zona.almacen.codigo
                    }
                }
            })
        return Response(data)

class SimpleUbicacionViewSet(viewsets.ModelViewSet):
    """ViewSet simplificado para ubicaciones"""
    queryset = Ubicacion.objects.all()
    serializer_class = SimpleUbicacionSerializer
    permission_classes = [AllowAny]
    
    def list(self, request):
        ubicaciones = Ubicacion.objects.select_related('pasillo__zona__almacen').all()
        
        # Filtros
        pasillo_id = request.query_params.get('pasillo')
        zona_id = request.query_params.get('zona')
        almacen_id = request.query_params.get('almacen')
        disponible = request.query_params.get('disponible')
        
        if pasillo_id:
            ubicaciones = ubicaciones.filter(pasillo_id=pasillo_id)
        if zona_id:
            ubicaciones = ubicaciones.filter(pasillo__zona_id=zona_id)
        if almacen_id:
            ubicaciones = ubicaciones.filter(pasillo__zona__almacen_id=almacen_id)
        if disponible == 'true':
            ubicaciones = ubicaciones.filter(activo=True, reservado=False)
            
        data = []
        for ubicacion in ubicaciones:
            data.append({
                'id': ubicacion.id,
                'nombre': ubicacion.nombre,
                'codigo': ubicacion.codigo,
                'codigo_completo': ubicacion.codigo_completo,
                'direccion_legible': ubicacion.direccion_legible,
                'tipo': ubicacion.tipo,
                'nivel': ubicacion.nivel,
                'posicion': ubicacion.posicion,
                'capacidad_maxima': ubicacion.capacidad_maxima,
                'ocupacion_actual': 0,  # Simplificado
                'espacios_libres': ubicacion.capacidad_maxima,  # Simplificado
                'largo_cm': float(ubicacion.largo_cm) if ubicacion.largo_cm else None,
                'ancho_cm': float(ubicacion.ancho_cm) if ubicacion.ancho_cm else None,
                'alto_cm': float(ubicacion.alto_cm) if ubicacion.alto_cm else None,
                'activo': ubicacion.activo,
                'reservado': ubicacion.reservado,
                'qr_code_generado': ubicacion.qr_code_generado,
                'notas': ubicacion.notas,
                'fecha_creacion': ubicacion.fecha_creacion,
                'pasillo': {
                    'id': ubicacion.pasillo.id,
                    'nombre': ubicacion.pasillo.nombre,
                    'codigo': ubicacion.pasillo.codigo,
                    'zona': {
                        'id': ubicacion.pasillo.zona.id,
                        'nombre': ubicacion.pasillo.zona.nombre,
                        'codigo': ubicacion.pasillo.zona.codigo,
                        'tipo': ubicacion.pasillo.zona.tipo,
                        'almacen': {
                            'id': ubicacion.pasillo.zona.almacen.id,
                            'nombre': ubicacion.pasillo.zona.almacen.nombre,
                            'codigo': ubicacion.pasillo.zona.almacen.codigo
                        }
                    }
                }
            })
        return Response(data)
    
    def create(self, request):
        """Crear nueva ubicación"""
        try:
            data = request.data
            ubicacion = Ubicacion.objects.create(
                pasillo_id=data.get('pasillo_id'),
                nombre=data.get('nombre'),
                codigo=data.get('codigo'),
                tipo=data.get('tipo', 'estante'),
                nivel=data.get('nivel', ''),
                posicion=data.get('posicion', ''),
                capacidad_maxima=data.get('capacidad_maxima', 1),
                largo_cm=data.get('largo_cm') if data.get('largo_cm') else None,
                ancho_cm=data.get('ancho_cm') if data.get('ancho_cm') else None,
                alto_cm=data.get('alto_cm') if data.get('alto_cm') else None,
                notas=data.get('notas', '')
            )
            return Response({'id': ubicacion.id, 'message': 'Ubicación creada exitosamente'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, pk=None):
        """Actualizar ubicación existente"""
        try:
            ubicacion = Ubicacion.objects.get(pk=pk)
            data = request.data
            
            ubicacion.nombre = data.get('nombre', ubicacion.nombre)
            ubicacion.codigo = data.get('codigo', ubicacion.codigo)
            ubicacion.tipo = data.get('tipo', ubicacion.tipo)
            ubicacion.nivel = data.get('nivel', ubicacion.nivel)
            ubicacion.posicion = data.get('posicion', ubicacion.posicion)
            ubicacion.capacidad_maxima = data.get('capacidad_maxima', ubicacion.capacidad_maxima)
            ubicacion.notas = data.get('notas', ubicacion.notas)
            
            if data.get('largo_cm'):
                ubicacion.largo_cm = data.get('largo_cm')
            if data.get('ancho_cm'):
                ubicacion.ancho_cm = data.get('ancho_cm')  
            if data.get('alto_cm'):
                ubicacion.alto_cm = data.get('alto_cm')
                
            ubicacion.save()
            return Response({'message': 'Ubicación actualizada exitosamente'})
        except Ubicacion.DoesNotExist:
            return Response({'error': 'Ubicación no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def generar_qr(self, request, pk=None):
        """Genera código QR para una ubicación"""
        try:
            ubicacion = Ubicacion.objects.get(pk=pk)
            
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
                'message': 'Código QR generado exitosamente'
            })
        except Ubicacion.DoesNotExist:
            return Response({'error': 'Ubicación no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SimpleLocationStatsView(APIView):
    """Vista simplificada para estadísticas de ubicaciones"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            # Estadísticas básicas
            total_almacenes = Almacen.objects.filter(activo=True).count()
            total_zonas = Zona.objects.filter(activo=True).count()
            total_ubicaciones = Ubicacion.objects.filter(activo=True).count()
            
            # Capacidad total
            capacidad_total = Zona.objects.filter(activo=True).aggregate(
                total=Sum('capacidad_maxima')
            )['total'] or 0
            
            # Distribución por tipo de zona
            distribucion_zonas = []
            for tipo_choice in Zona.TIPOS_ZONA:
                tipo_code, tipo_name = tipo_choice
                count = Zona.objects.filter(activo=True, tipo=tipo_code).count()
                capacidad = Zona.objects.filter(activo=True, tipo=tipo_code).aggregate(
                    total=Sum('capacidad_maxima')
                )['total'] or 0
                
                distribucion_zonas.append({
                    'tipo': tipo_code,
                    'tipo_display': tipo_name,
                    'count': count,
                    'capacidad': capacidad
                })
            
            # Ubicaciones destacadas
            ubicaciones_destacadas = []
            ubicaciones_top = Ubicacion.objects.filter(activo=True).order_by('-capacidad_maxima')[:10]
            for ub in ubicaciones_top:
                ubicaciones_destacadas.append({
                    'codigo': ub.codigo_completo,
                    'nombre': ub.nombre,
                    'ocupacion': 0,  # Simplificado
                    'capacidad': ub.capacidad_maxima,
                    'porcentaje': 0  # Simplificado
                })
            
            return Response({
                'resumen': {
                    'total_almacenes': total_almacenes,
                    'total_zonas': total_zonas,
                    'total_ubicaciones': total_ubicaciones,
                    'capacidad_total': capacidad_total,
                    'ocupacion_total': 0,  # Simplificado
                    'porcentaje_ocupacion': 0  # Simplificado
                },
                'distribucion_zonas': distribucion_zonas,
                'ubicaciones_mas_ocupadas': ubicaciones_destacadas,
                'movimientos_recientes': []  # Simplificado
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error al cargar estadísticas: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )