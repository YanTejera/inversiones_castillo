from rest_framework import generics, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum
from .models import Proveedor, MotoModelo, Moto
from .serializers import (
    ProveedorSerializer, ProveedorCreateSerializer, ProveedorListSerializer,
    MotoModeloSerializer, MotoSerializer
)

class ProveedorListCreateView(generics.ListCreateAPIView):
    queryset = Proveedor.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'nombre_comercial', 'ruc', 'cedula', 'persona_contacto', 'ciudad']
    ordering_fields = ['nombre', 'fecha_creacion', 'tipo_proveedor', 'estado']
    ordering = ['nombre']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProveedorCreateSerializer
        return ProveedorListSerializer
    
    def get_queryset(self):
        queryset = Proveedor.objects.all()
        
        # Filtros disponibles
        estado = self.request.query_params.get('estado', None)
        tipo_proveedor = self.request.query_params.get('tipo_proveedor', None)
        pais = self.request.query_params.get('pais', None)
        activo = self.request.query_params.get('activo', None)
        
        if estado:
            queryset = queryset.filter(estado=estado)
        if tipo_proveedor:
            queryset = queryset.filter(tipo_proveedor=tipo_proveedor)
        if pais:
            queryset = queryset.filter(pais__icontains=pais)
        if activo is not None:
            if activo.lower() == 'true':
                queryset = queryset.filter(estado='activo')
            elif activo.lower() == 'false':
                queryset = queryset.exclude(estado='activo')
        
        return queryset

class ProveedorDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProveedorCreateSerializer
        return ProveedorSerializer

class ProveedorEstadisticasView(APIView):
    """Vista para obtener estadísticas detalladas de un proveedor"""
    
    def get(self, request, proveedor_id):
        try:
            from django.db.models import Sum, Count, Avg
            from ventas.models import VentaDetalle
            
            proveedor = Proveedor.objects.get(id=proveedor_id)
            
            # Obtener modelos de motocicletas del proveedor
            modelos_proveedor = MotoModelo.objects.filter(proveedor=proveedor)
            motos_legacy_proveedor = Moto.objects.filter(proveedor=proveedor)
            
            # Estadísticas de inventario actual
            stock_total_modelos = 0
            valor_inventario_modelos = 0
            for modelo in modelos_proveedor:
                stock_modelo = modelo.total_stock
                stock_total_modelos += stock_modelo
                valor_inventario_modelos += float(modelo.precio_compra) * stock_modelo
            
            stock_total_legacy = motos_legacy_proveedor.aggregate(Sum('cantidad_stock'))['cantidad_stock__sum'] or 0
            valor_inventario_legacy = sum(float(moto.precio_compra) * moto.cantidad_stock for moto in motos_legacy_proveedor)
            
            # Estadísticas de ventas (aproximadas usando el modelo legacy)
            total_vendidas = 0
            ingresos_totales = 0
            ganancias_totales = 0
            
            # Resumen por tipo de motocicleta
            resumen_por_marca = {}
            for modelo in modelos_proveedor:
                marca = modelo.marca
                if marca not in resumen_por_marca:
                    resumen_por_marca[marca] = {
                        'modelos_count': 0,
                        'stock_total': 0,
                        'valor_inventario': 0
                    }
                
                resumen_por_marca[marca]['modelos_count'] += 1
                stock_marca = modelo.total_stock
                resumen_por_marca[marca]['stock_total'] += stock_marca
                resumen_por_marca[marca]['valor_inventario'] += float(modelo.precio_compra) * stock_marca
            
            estadisticas = {
                'proveedor_info': {
                    'id': proveedor.id,
                    'nombre_completo': proveedor.nombre_completo,
                    'tipo_proveedor': proveedor.get_tipo_proveedor_display(),
                    'estado': proveedor.get_estado_display(),
                    'contacto_principal': proveedor.contacto_principal,
                    'telefono_principal': proveedor.telefono_principal,
                    'email_principal': proveedor.email_principal,
                    'ciudad': proveedor.ciudad,
                    'pais': proveedor.pais,
                    'moneda_preferida': proveedor.get_moneda_preferida_display(),
                    'terminos_pago': proveedor.terminos_pago,
                    'limite_credito': float(proveedor.limite_credito) if proveedor.limite_credito else None,
                    'descuento_general': float(proveedor.descuento_general),
                    'fecha_inicio_relacion': proveedor.fecha_inicio_relacion,
                },
                'inventario_actual': {
                    'modelos_suministrados': modelos_proveedor.count(),
                    'motos_legacy_suministradas': motos_legacy_proveedor.count(),
                    'stock_total': stock_total_modelos + stock_total_legacy,
                    'valor_inventario_total': valor_inventario_modelos + valor_inventario_legacy,
                    'resumen_por_marca': resumen_por_marca,
                },
                'performance': {
                    'total_motocicletas_suministradas': proveedor.total_motocicletas(),
                    'total_compras_realizadas': float(proveedor.total_compras()),
                    'total_vendidas_estimadas': total_vendidas,
                    'ingresos_por_ventas_estimados': ingresos_totales,
                    'ganancias_estimadas': ganancias_totales,
                },
                'resumen': {
                    'promedio_precio_compra': (valor_inventario_modelos + valor_inventario_legacy) / (stock_total_modelos + stock_total_legacy) if (stock_total_modelos + stock_total_legacy) > 0 else 0,
                    'rotacion_estimada': (total_vendidas / (stock_total_modelos + stock_total_legacy + total_vendidas)) * 100 if (stock_total_modelos + stock_total_legacy + total_vendidas) > 0 else 0,
                    'rentabilidad_estimada': (ganancias_totales / ingresos_totales * 100) if ingresos_totales > 0 else 0,
                }
            }
            
            return Response(estadisticas)
            
        except Proveedor.DoesNotExist:
            return Response(
                {'error': 'Proveedor no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class ProveedorMotocicletasView(APIView):
    """Vista para obtener todas las motocicletas de un proveedor específico"""
    
    def get(self, request, proveedor_id):
        try:
            proveedor = Proveedor.objects.get(id=proveedor_id)
            
            # Obtener modelos del proveedor
            modelos = MotoModelo.objects.filter(proveedor=proveedor)
            modelos_serialized = MotoModeloSerializer(modelos, many=True)
            
            # Obtener motos legacy del proveedor
            motos_legacy = Moto.objects.filter(proveedor=proveedor)
            motos_legacy_serialized = MotoSerializer(motos_legacy, many=True)
            
            return Response({
                'proveedor': ProveedorListSerializer(proveedor).data,
                'modelos_actuales': modelos_serialized.data,
                'motos_legacy': motos_legacy_serialized.data,
                'total_modelos': modelos.count(),
                'total_motos_legacy': motos_legacy.count(),
                'stock_total_modelos': sum(modelo.total_stock for modelo in modelos),
                'stock_total_legacy': motos_legacy.aggregate(Sum('cantidad_stock'))['cantidad_stock__sum'] or 0
            })
            
        except Proveedor.DoesNotExist:
            return Response(
                {'error': 'Proveedor no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )