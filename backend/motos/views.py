from rest_framework import generics, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.db import models
from .models import Moto, MotoModelo, MotoInventario
from .serializers import (
    MotoSerializer, MotoDisponibleSerializer, 
    MotoModeloSerializer, MotoModeloCreateSerializer, MotoInventarioSerializer
)

class MotoListCreateView(generics.ListCreateAPIView):
    queryset = Moto.objects.all()
    serializer_class = MotoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['marca', 'modelo', 'chasis']
    ordering_fields = ['fecha_ingreso', 'marca', 'modelo', 'precio_venta']
    ordering = ['-fecha_ingreso']
    
    def get_queryset(self):
        queryset = Moto.objects.all()
        marca = self.request.query_params.get('marca', None)
        activa = self.request.query_params.get('activa', None)
        disponible = self.request.query_params.get('disponible', None)
        
        if marca is not None:
            queryset = queryset.filter(marca__icontains=marca)
        if activa is not None:
            queryset = queryset.filter(activa=activa.lower() == 'true')
        if disponible is not None and disponible.lower() == 'true':
            queryset = queryset.filter(cantidad_stock__gt=0, activa=True)
            
        return queryset

class MotoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Moto.objects.all()
    serializer_class = MotoSerializer

class MotoDisponibleListView(generics.ListAPIView):
    serializer_class = MotoDisponibleSerializer
    
    def get_queryset(self):
        return Moto.objects.filter(cantidad_stock__gt=0, activa=True)

class StockCriticoView(APIView):
    def get(self, request):
        limite_critico = int(request.query_params.get('limite', 5))
        motos_criticas = Moto.objects.filter(
            cantidad_stock__lte=limite_critico,
            activa=True
        ).order_by('cantidad_stock')
        
        serializer = MotoSerializer(motos_criticas, many=True)
        return Response({
            'limite_critico': limite_critico,
            'count': motos_criticas.count(),
            'motos': serializer.data
        })

# Nuevas vistas para el sistema de modelos con inventario por color

class MotoModeloListCreateView(generics.ListCreateAPIView):
    queryset = MotoModelo.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['marca', 'modelo']
    ordering_fields = ['fecha_creacion', 'marca', 'modelo', 'precio_venta']
    ordering = ['-fecha_creacion']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MotoModeloCreateSerializer
        return MotoModeloSerializer
    
    def create(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.debug(f"POST request data: {request.data}")
        logger.debug(f"POST request FILES: {request.FILES}")
        logger.debug(f"Content-Type: {request.content_type}")
        
        try:
            response = super().create(request, *args, **kwargs)
            logger.debug(f"Success response: {response.data}")
            return response
        except Exception as e:
            logger.error(f"Error in create: {e}")
            logger.error(f"Error type: {type(e)}")
            raise
    
    def get_queryset(self):
        queryset = MotoModelo.objects.all()
        marca = self.request.query_params.get('marca', None)
        activa = self.request.query_params.get('activa', None)
        disponible = self.request.query_params.get('disponible', None)
        
        if marca is not None:
            queryset = queryset.filter(marca__icontains=marca)
        if activa is not None:
            queryset = queryset.filter(activa=activa.lower() == 'true')
        if disponible is not None and disponible.lower() == 'true':
            queryset = queryset.filter(
                inventario__cantidad_stock__gt=0, 
                activa=True
            ).distinct()
            
        return queryset

class MotoModeloDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MotoModelo.objects.all()
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return MotoModeloCreateSerializer  # Usa el serializer que maneja inventario_data
        return MotoModeloSerializer

class MotoModeloEstadisticasView(APIView):
    """Vista para obtener estadísticas detalladas de un modelo de moto"""
    
    def get(self, request, modelo_id):
        try:
            from django.db.models import Sum, Count, Avg
            from ventas.models import VentaDetalle
            
            modelo = MotoModelo.objects.get(id=modelo_id)
            
            # Obtener todas las motos individuales de este modelo
            motos_individuales = Moto.objects.filter(
                marca=modelo.marca,
                modelo=modelo.modelo, 
                ano=modelo.ano
            )
            
            # Estadísticas de ventas por color
            ventas_por_color = {}
            ingresos_por_color = {}
            total_vendidas = 0
            total_ingresos = 0
            
            for moto in motos_individuales:
                color = moto.color or 'Sin color'
                
                # Contar ventas de esta moto específica
                ventas = VentaDetalle.objects.filter(moto=moto)
                cantidad_vendida = ventas.aggregate(Sum('cantidad'))['cantidad__sum'] or 0
                ingresos = ventas.aggregate(Sum('subtotal'))['subtotal__sum'] or 0
                
                if color not in ventas_por_color:
                    ventas_por_color[color] = 0
                    ingresos_por_color[color] = 0
                
                ventas_por_color[color] += cantidad_vendida
                ingresos_por_color[color] += float(ingresos)
                total_vendidas += cantidad_vendida
                total_ingresos += float(ingresos)
            
            # Inventario actual del modelo unificado con información de chasis
            inventario_actual = {}
            stock_total_actual = 0
            for inventario in modelo.inventario.all():
                color = inventario.color
                if color not in inventario_actual:
                    inventario_actual[color] = {
                        'stock': 0,
                        'descuento': float(inventario.descuento_porcentaje),
                        'precio_con_descuento': float(inventario.precio_con_descuento),
                        'chasis_list': []
                    }
                
                inventario_actual[color]['stock'] += inventario.cantidad_stock
                if inventario.chasis:
                    inventario_actual[color]['chasis_list'].append({
                        'chasis': inventario.chasis,
                        'cantidad': inventario.cantidad_stock,
                        'fecha_ingreso': inventario.fecha_ingreso
                    })
                stock_total_actual += inventario.cantidad_stock
            
            # Calcular ganancias
            ganancia_por_unidad = float(modelo.ganancia)
            ganancia_total_stock = ganancia_por_unidad * stock_total_actual
            ganancia_total_ventas = ganancia_por_unidad * total_vendidas
            
            estadisticas = {
                'modelo_info': {
                    'id': modelo.id,
                    'marca': modelo.marca,
                    'modelo': modelo.modelo,
                    'ano': modelo.ano,
                    'precio_compra': float(modelo.precio_compra),
                    'precio_venta': float(modelo.precio_venta),
                    'ganancia_por_unidad': ganancia_por_unidad,
                    'activa': modelo.activa,
                    'cilindraje': modelo.cilindraje,
                    'tipo_motor': modelo.get_tipo_motor_display() if modelo.tipo_motor else None,
                    'potencia': modelo.potencia,
                    'torque': modelo.torque,
                    'combustible': modelo.combustible,
                    'transmision': modelo.transmision,
                    'peso': float(modelo.peso) if modelo.peso else None,
                    'capacidad_tanque': float(modelo.capacidad_tanque) if modelo.capacidad_tanque else None,
                    'descripcion': modelo.descripcion,
                },
                'inventario_actual': {
                    'por_color': inventario_actual,
                    'stock_total': stock_total_actual,
                    'ganancia_total_stock': ganancia_total_stock,
                },
                'ventas_historicas': {
                    'por_color': ventas_por_color,
                    'ingresos_por_color': ingresos_por_color,
                    'total_vendidas': total_vendidas,
                    'total_ingresos': total_ingresos,
                    'ganancia_total_ventas': ganancia_total_ventas,
                },
                'resumen': {
                    'valor_inventario_actual': float(modelo.precio_venta) * stock_total_actual,
                    'rotacion_stock': total_vendidas / (stock_total_actual + total_vendidas) * 100 if (stock_total_actual + total_vendidas) > 0 else 0,
                    'precio_promedio_venta': total_ingresos / total_vendidas if total_vendidas > 0 else 0,
                }
            }
            
            return Response(estadisticas)
            
        except MotoModelo.DoesNotExist:
            return Response(
                {'error': 'Modelo de moto no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class MotoInventarioListCreateView(generics.ListCreateAPIView):
    serializer_class = MotoInventarioSerializer
    
    def get_queryset(self):
        modelo_id = self.kwargs.get('modelo_id')
        if modelo_id:
            return MotoInventario.objects.filter(modelo_id=modelo_id)
        return MotoInventario.objects.all()
    
    def perform_create(self, serializer):
        modelo_id = self.kwargs.get('modelo_id')
        if modelo_id:
            modelo = MotoModelo.objects.get(id=modelo_id)
            serializer.save(modelo=modelo)

class MotoInventarioDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MotoInventario.objects.all()
    serializer_class = MotoInventarioSerializer

class VentaDirectaView(APIView):
    """API para crear venta directa desde el apartado de motos"""
    
    def post(self, request):
        try:
            modelo_id = request.data.get('modelo_id')
            color = request.data.get('color')
            cantidad = int(request.data.get('cantidad', 1))
            cliente_id = request.data.get('cliente_id')
            
            # Verificar que exista el modelo
            modelo = MotoModelo.objects.get(id=modelo_id)
            
            # Verificar stock disponible para el color específico
            inventario_items = MotoInventario.objects.filter(
                modelo=modelo, 
                color=color, 
                cantidad_stock__gt=0
            ).order_by('fecha_ingreso')
            
            total_disponible = sum(item.cantidad_stock for item in inventario_items)
            
            if total_disponible < cantidad:
                return Response(
                    {'error': f'Stock insuficiente. Disponible: {total_disponible}, solicitado: {cantidad}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Aquí iría la lógica para crear la venta
            # Por ahora solo devolvemos la información de confirmación
            
            return Response({
                'modelo': MotoModeloSerializer(modelo).data,
                'color': color,
                'cantidad': cantidad,
                'total_disponible': total_disponible,
                'precio_total': modelo.precio_venta * cantidad,
                'mensaje': 'Venta preparada. Confirmar para procesar.'
            })
            
        except MotoModelo.DoesNotExist:
            return Response(
                {'error': 'Modelo de moto no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
