from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.template.loader import get_template
from django.utils import timezone
from datetime import datetime
from .models import Venta, VentaDetalle
from .serializers import VentaSerializer, VentaCreateSerializer, VentaDetalleSerializer

class VentaListCreateView(generics.ListCreateAPIView):
    queryset = Venta.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return VentaCreateSerializer
        return VentaSerializer
    
    def get_queryset(self):
        queryset = Venta.objects.all()
        cliente_id = self.request.query_params.get('cliente', None)
        estado = self.request.query_params.get('estado', None)
        tipo_venta = self.request.query_params.get('tipo_venta', None)
        
        if cliente_id is not None:
            queryset = queryset.filter(cliente_id=cliente_id)
        if estado is not None:
            queryset = queryset.filter(estado=estado)
        if tipo_venta is not None:
            queryset = queryset.filter(tipo_venta=tipo_venta)
            
        return queryset

class VentaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Venta.objects.all()
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return VentaCreateSerializer
        return VentaSerializer
    
    def partial_update(self, request, *args, **kwargs):
        print(f"Datos recibidos para actualizar venta: {request.data}")
        
        # Si solo se está actualizando el estado, usar un serializer más simple
        if 'estado' in request.data and len(request.data) == 1:
            instance = self.get_object()
            estado = request.data.get('estado')
            
            # Validar que el estado sea válido
            estados_validos = ['activa', 'cancelada', 'finalizada']
            if estado not in estados_validos:
                return Response(
                    {'error': f'Estado inválido. Debe ser uno de: {estados_validos}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            instance.estado = estado
            instance.save()
            
            serializer = VentaSerializer(instance)
            return Response(serializer.data)
        
        return super().partial_update(request, *args, **kwargs)

class VentaDetalleListCreateView(generics.ListCreateAPIView):
    queryset = VentaDetalle.objects.all()
    serializer_class = VentaDetalleSerializer
    
    def get_queryset(self):
        queryset = VentaDetalle.objects.all()
        venta_id = self.request.query_params.get('venta', None)
        if venta_id is not None:
            queryset = queryset.filter(venta_id=venta_id)
        return queryset

class VentaDetalleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = VentaDetalle.objects.all()
    serializer_class = VentaDetalleSerializer

class VentaActivaListView(generics.ListAPIView):
    serializer_class = VentaSerializer
    
    def get_queryset(self):
        return Venta.objects.filter(estado='activa')

class CalcularVentaView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            print("Datos recibidos en API calcular:", request.data)
            
            detalles = request.data.get('detalles', [])
            tipo_venta = request.data.get('tipo_venta', 'contado')
            monto_inicial = request.data.get('monto_inicial', 0)
            cuotas = request.data.get('cuotas', 1)
            tasa_interes = request.data.get('tasa_interes', 0)
            
            print(f"Detalles procesados: {detalles}")
            print(f"Tipo venta: {tipo_venta}, Inicial: {monto_inicial}, Cuotas: {cuotas}, Tasa: {tasa_interes}")
            
            # Calcular monto total - convertir strings a float si es necesario
            monto_total = 0
            for detalle in detalles:
                cantidad = float(detalle['cantidad'])
                precio_unitario = float(detalle['precio_unitario'])
                monto_total += cantidad * precio_unitario
            
            print(f"Monto total calculado: {monto_total}")
            
            # Calcular valores según tipo de venta
            if tipo_venta == 'financiado':
                monto_inicial = float(monto_inicial) if monto_inicial else 0
                cuotas = int(cuotas) if cuotas else 1
                tasa_interes = float(tasa_interes) if tasa_interes else 0
                
                saldo_financiado = monto_total - monto_inicial
                
                # Calcular pago mensual con interés
                if tasa_interes > 0 and cuotas > 0:
                    # Fórmula de cuota fija con interés: C = P * [r(1+r)^n] / [(1+r)^n-1]
                    r = float(tasa_interes) / 100  # Convertir porcentaje a decimal
                    factor = pow(1 + r, cuotas)
                    
                    # Validar que el factor no sea infinito o demasiado grande
                    if factor > 1e10:  # Evitar números demasiado grandes
                        pago_mensual = saldo_financiado / cuotas  # Fallback sin interés
                    else:
                        pago_mensual = saldo_financiado * (r * factor) / (factor - 1)
                        
                    # Asegurar que el pago mensual no sea negativo o infinito
                    if pago_mensual <= 0 or pago_mensual == float('inf'):
                        pago_mensual = saldo_financiado / cuotas
                else:
                    # Sin interés, dividir en partes iguales
                    pago_mensual = saldo_financiado / cuotas if cuotas > 0 else saldo_financiado
                
                # Redondear pago_mensual a 2 decimales
                pago_mensual = round(pago_mensual, 2)
                
                # Calcular monto total con intereses (inicial + cuotas * pago_mensual)
                monto_total_con_intereses = round(monto_inicial + (pago_mensual * cuotas), 2)
                
                # Calcular total de intereses pagados
                total_intereses = round(monto_total_con_intereses - monto_total, 2)
            else:
                monto_inicial = round(monto_total, 2)
                saldo_financiado = 0
                pago_mensual = 0
                cuotas = 1
                tasa_interes = 0
                monto_total_con_intereses = round(monto_total, 2)
                total_intereses = 0
            
            return Response({
                'monto_total': monto_total,
                'monto_inicial': monto_inicial,
                'saldo_financiado': saldo_financiado,
                'pago_mensual': pago_mensual,
                'cuotas': cuotas,
                'tasa_interes': tasa_interes,
                'monto_total_con_intereses': monto_total_con_intereses,
                'total_intereses': total_intereses
            })
        except Exception as e:
            print(f"Error en CalcularVentaView: {str(e)}")
            print(f"Datos que causaron el error: {request.data}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class GenerarFacturaView(APIView):
    def get(self, request, pk):
        try:
            venta = Venta.objects.get(pk=pk)
            
            return Response({
                'venta_id': venta.id,
                'cliente': f"{venta.cliente.nombre} {venta.cliente.apellido}",
                'fecha': venta.fecha_venta,
                'total': venta.monto_total,
                'message': 'Factura generada exitosamente'
            })
        except Venta.DoesNotExist:
            return Response(
                {'error': 'Venta no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class ClienteVentasView(APIView):
    """
    Vista para obtener todas las ventas de un cliente específico, 
    separadas por activas y finalizadas
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, cliente_id):
        try:
            # Obtener ventas activas
            ventas_activas = Venta.objects.filter(
                cliente_id=cliente_id, 
                estado='activa'
            ).order_by('-fecha_venta')
            
            # Obtener ventas finalizadas/canceladas
            ventas_finalizadas = Venta.objects.filter(
                cliente_id=cliente_id, 
                estado__in=['finalizada', 'cancelada']
            ).order_by('-fecha_venta')
            
            # Serializar los datos
            activas_data = VentaSerializer(ventas_activas, many=True).data
            finalizadas_data = VentaSerializer(ventas_finalizadas, many=True).data
            
            return Response({
                'activas': activas_data,
                'finalizadas': finalizadas_data,
                'resumen': {
                    'total_activas': len(activas_data),
                    'total_finalizadas': len(finalizadas_data),
                    'monto_activo': sum([float(v['monto_total']) for v in activas_data]),
                    'saldo_pendiente': sum([float(v['saldo_pendiente']) for v in activas_data])
                }
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CancelarVentaView(APIView):
    def post(self, request, pk):
        """
        Cancela una venta específica y devuelve el stock de motocicletas al inventario
        """
        try:
            venta = Venta.objects.get(pk=pk)
            
            # Verificar que la venta no esté ya cancelada
            if venta.estado == 'cancelada':
                return Response({'error': 'Esta venta ya está cancelada'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Obtener datos de la cancelación
            motivo = request.data.get('motivo', 'otros')
            descripcion = request.data.get('descripcion', '')
            
            # Devolver stock de motocicletas al inventario
            stock_devuelto = []
            for detalle in venta.detalles.all():
                moto = detalle.moto
                cantidad_devuelta = detalle.cantidad
                
                # Aumentar el stock de la moto
                moto.cantidad_stock += cantidad_devuelta
                moto.save()
                
                stock_devuelto.append({
                    'moto': f"{moto.marca} {moto.modelo}",
                    'cantidad': cantidad_devuelta,
                    'nuevo_stock': moto.cantidad_stock
                })
            
            # Marcar la venta como cancelada
            venta.estado = 'cancelada'
            venta.motivo_cancelacion = motivo
            venta.descripcion_cancelacion = descripcion
            venta.fecha_cancelacion = timezone.now()
            venta.usuario_cancelacion = request.user
            venta.save()
            
            # Registrar la cancelación en auditoría
            from pagos.models import Auditoria
            Auditoria.objects.create(
                usuario=request.user,
                accion='CANCELAR_VENTA',
                tabla_afectada='Venta',
                id_registro=venta.id,
                detalles={
                    'monto_total': float(venta.monto_total),
                    'cliente': f"{venta.cliente.nombre} {venta.cliente.apellido}",
                    'motivo': motivo,
                    'descripcion': descripcion,
                    'stock_devuelto': stock_devuelto,
                    'fecha_cancelacion': timezone.now().isoformat()
                }
            )
            
            # Cancelar cuotas programadas si las hay
            try:
                from pagos.models import CuotaVencimiento
                cuotas_pendientes = CuotaVencimiento.objects.filter(
                    venta=venta,
                    estado__in=['pendiente', 'parcial', 'vencida']
                )
                cuotas_canceladas = cuotas_pendientes.count()
                cuotas_pendientes.delete()
            except Exception as e:
                cuotas_canceladas = 0
                print(f"Error cancelando cuotas: {e}")
            
            return Response({
                'message': f'Venta cancelada exitosamente. Stock devuelto al inventario.',
                'venta_id': venta.id,
                'motivo': venta.get_motivo_cancelacion_display(),
                'descripcion': descripcion,
                'stock_devuelto': stock_devuelto,
                'cuotas_canceladas': cuotas_canceladas
            }, status=status.HTTP_200_OK)
            
        except Venta.DoesNotExist:
            return Response({'error': 'Venta no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
