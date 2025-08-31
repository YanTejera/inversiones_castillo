from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Avg, F
from datetime import datetime, timedelta
from .models import MotoModelo
from ventas.models import VentaDetalle

class AlertasInteligentesView(APIView):
    """Vista para generar alertas inteligentes del inventario"""
    
    def get(self, request):
        try:
            alertas = []
            
            # Obtener modelos activos
            modelos = MotoModelo.objects.filter(activa=True).prefetch_related('inventario')
            
            for modelo in modelos:
                stock_actual = sum(item.cantidad_stock for item in modelo.inventario.all())
                
                # 1. ALERTAS DE STOCK BAJO (punto de reorden)
                fecha_inicio = datetime.now() - timedelta(days=180)
                ventas_6_meses = VentaDetalle.objects.filter(
                    moto__marca=modelo.marca,
                    moto__modelo=modelo.modelo,
                    venta__fecha_venta__gte=fecha_inicio
                ).aggregate(total=Sum('cantidad'))['total'] or 0
                
                venta_promedio_mensual = ventas_6_meses / 6 if ventas_6_meses > 0 else 0
                punto_reorden = venta_promedio_mensual * 2  # 2 meses de inventario
                
                if stock_actual <= punto_reorden and venta_promedio_mensual > 0:
                    dias_restantes = (stock_actual / venta_promedio_mensual * 30) if venta_promedio_mensual > 0 else 999
                    
                    if dias_restantes <= 30:
                        prioridad = 'urgente' if dias_restantes <= 7 else 'alta'
                        alertas.append({
                            'tipo': 'stock_bajo',
                            'prioridad': prioridad,
                            'modelo_id': modelo.id,
                            'modelo': f"{modelo.marca} {modelo.modelo}",
                            'stock_actual': stock_actual,
                            'punto_reorden': round(punto_reorden, 1),
                            'dias_restantes': round(dias_restantes, 1),
                            'venta_mensual': round(venta_promedio_mensual, 1),
                            'cantidad_sugerida': max(round(punto_reorden * 2), 5),
                            'mensaje': f'Stock bajo: {stock_actual} unidades, {round(dias_restantes)} días restantes',
                            'accion_sugerida': f'Ordenar {max(round(punto_reorden * 2), 5)} unidades'
                        })
                
                # 2. ALERTAS DE EXCESO DE INVENTARIO
                if venta_promedio_mensual > 0 and stock_actual > (venta_promedio_mensual * 6):
                    meses_exceso = (stock_actual / venta_promedio_mensual) - 6
                    valor_exceso = float(modelo.precio_compra) * (meses_exceso * venta_promedio_mensual)
                    
                    alertas.append({
                        'tipo': 'exceso_inventario',
                        'prioridad': 'media',
                        'modelo_id': modelo.id,
                        'modelo': f"{modelo.marca} {modelo.modelo}",
                        'stock_actual': stock_actual,
                        'meses_inventario': round(stock_actual / venta_promedio_mensual, 1),
                        'exceso_unidades': round(meses_exceso * venta_promedio_mensual),
                        'valor_exceso': valor_exceso,
                        'mensaje': f'Exceso de inventario: {round(stock_actual / venta_promedio_mensual, 1)} meses de stock',
                        'accion_sugerida': 'Considerar promoción o descuento para acelerar ventas'
                    })
                
                # 3. ALERTAS DE PRODUCTOS SIN MOVIMIENTO
                fecha_sin_movimiento = datetime.now() - timedelta(days=120)
                if stock_actual > 0:
                    tiene_ventas_recientes = VentaDetalle.objects.filter(
                        moto__marca=modelo.marca,
                        moto__modelo=modelo.modelo,
                        venta__fecha_venta__gte=fecha_sin_movimiento
                    ).exists()
                    
                    if not tiene_ventas_recientes:
                        valor_riesgo = float(modelo.precio_compra) * stock_actual
                        dias_sin_movimiento = (datetime.now().date() - modelo.fecha_creacion.date()).days
                        
                        if dias_sin_movimiento > 120:
                            alertas.append({
                                'tipo': 'sin_movimiento',
                                'prioridad': 'alta' if dias_sin_movimiento > 180 else 'media',
                                'modelo_id': modelo.id,
                                'modelo': f"{modelo.marca} {modelo.modelo}",
                                'stock_actual': stock_actual,
                                'dias_sin_movimiento': dias_sin_movimiento,
                                'valor_riesgo': valor_riesgo,
                                'mensaje': f'Sin ventas por {dias_sin_movimiento} días',
                                'accion_sugerida': 'Revisar precio o considerar descuento especial'
                            })
                
                # 4. ALERTAS DE ALTA DEMANDA
                fecha_alta_demanda = datetime.now() - timedelta(days=30)
                ventas_mes = VentaDetalle.objects.filter(
                    moto__marca=modelo.marca,
                    moto__modelo=modelo.modelo,
                    venta__fecha_venta__gte=fecha_alta_demanda
                ).aggregate(total=Sum('cantidad'))['total'] or 0
                
                if ventas_mes > stock_actual and stock_actual > 0:
                    alertas.append({
                        'tipo': 'alta_demanda',
                        'prioridad': 'media',
                        'modelo_id': modelo.id,
                        'modelo': f"{modelo.marca} {modelo.modelo}",
                        'stock_actual': stock_actual,
                        'ventas_mes': ventas_mes,
                        'ratio_demanda': round(ventas_mes / stock_actual, 2),
                        'mensaje': f'Alta demanda: {ventas_mes} ventas vs {stock_actual} en stock',
                        'accion_sugerida': f'Incrementar pedido, demanda {round(ventas_mes / stock_actual, 1)}x el stock'
                    })
            
            # Ordenar alertas por prioridad
            orden_prioridad = {'urgente': 0, 'alta': 1, 'media': 2, 'baja': 3}
            alertas.sort(key=lambda x: orden_prioridad.get(x['prioridad'], 3))
            
            return Response({
                'alertas': alertas,
                'resumen': {
                    'total_alertas': len(alertas),
                    'por_prioridad': {
                        'urgente': len([a for a in alertas if a['prioridad'] == 'urgente']),
                        'alta': len([a for a in alertas if a['prioridad'] == 'alta']),
                        'media': len([a for a in alertas if a['prioridad'] == 'media']),
                        'baja': len([a for a in alertas if a['prioridad'] == 'baja'])
                    },
                    'por_tipo': {
                        'stock_bajo': len([a for a in alertas if a['tipo'] == 'stock_bajo']),
                        'exceso_inventario': len([a for a in alertas if a['tipo'] == 'exceso_inventario']),
                        'sin_movimiento': len([a for a in alertas if a['tipo'] == 'sin_movimiento']),
                        'alta_demanda': len([a for a in alertas if a['tipo'] == 'alta_demanda'])
                    }
                }
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar alertas: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )