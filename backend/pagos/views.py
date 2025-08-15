from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from datetime import datetime, timedelta
from .models import Pago, Reporte, Auditoria, CuotaVencimiento, AlertaPago
from .serializers import PagoSerializer, PagoCreateSerializer, ReporteSerializer, AuditoriaSerializer, CuotaVencimientoSerializer, AlertaPagoSerializer
from ventas.models import Venta
from motos.models import Moto
from usuarios.models import Cliente

class PagoListCreateView(generics.ListCreateAPIView):
    queryset = Pago.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PagoCreateSerializer
        return PagoSerializer
    
    def get_queryset(self):
        queryset = Pago.objects.all()
        venta_id = self.request.query_params.get('venta', None)
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)
        
        if venta_id is not None:
            queryset = queryset.filter(venta_id=venta_id)
        if fecha_desde is not None:
            queryset = queryset.filter(fecha_pago__gte=fecha_desde)
        if fecha_hasta is not None:
            queryset = queryset.filter(fecha_pago__lte=fecha_hasta)
            
        return queryset
    
    def perform_create(self, serializer):
        """
        Al crear un pago, generar automáticamente las cuotas si no existen
        """
        pago = serializer.save()
        
        # Si la venta es financiada y no tiene cuotas generadas, generarlas
        if (pago.venta.tipo_venta == 'financiado' and 
            not pago.venta.cuotas_programadas.exists()):
            CuotaVencimiento.generar_cuotas_venta(pago.venta)

class PagoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Pago.objects.all()
    serializer_class = PagoSerializer

class PagosPorVentaView(generics.ListAPIView):
    serializer_class = PagoSerializer
    
    def get_queryset(self):
        venta_id = self.kwargs['venta_id']
        return Pago.objects.filter(venta_id=venta_id)

class ReporteListCreateView(generics.ListCreateAPIView):
    queryset = Reporte.objects.all()
    serializer_class = ReporteSerializer
    
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class ReporteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reporte.objects.all()
    serializer_class = ReporteSerializer

class AuditoriaListView(generics.ListAPIView):
    queryset = Auditoria.objects.all()
    serializer_class = AuditoriaSerializer
    
    def get_queryset(self):
        queryset = Auditoria.objects.all()
        usuario_id = self.request.query_params.get('usuario', None)
        tabla = self.request.query_params.get('tabla', None)
        
        if usuario_id is not None:
            queryset = queryset.filter(usuario_id=usuario_id)
        if tabla is not None:
            queryset = queryset.filter(tabla_afectada=tabla)
            
        return queryset

class DashboardView(APIView):
    def get(self, request):
        hoy = datetime.now().date()
        inicio_mes = hoy.replace(day=1)
        hace_una_semana = hoy - timedelta(days=7)
        
        # Ventas del día
        ventas_hoy = Venta.objects.filter(
            fecha_venta__date=hoy
        ).aggregate(
            total=models.Sum('monto_total'),
            count=models.Count('id')
        )
        
        # Ventas del mes
        ventas_mes = Venta.objects.filter(
            fecha_venta__date__gte=inicio_mes
        ).aggregate(
            total=models.Sum('monto_total'),
            count=models.Count('id')
        )
        
        # Pagos del día
        pagos_hoy = Pago.objects.filter(
            fecha_pago__date=hoy
        ).aggregate(
            total=models.Sum('monto_pagado'),
            count=models.Count('id')
        )
        
        # Stock crítico
        stock_critico = Moto.objects.filter(
            cantidad_stock__lte=5,
            activa=True
        ).count()
        
        # Cobros pendientes
        ventas_con_saldo = []
        for venta in Venta.objects.filter(estado='activa'):
            if venta.saldo_pendiente > 0:
                ventas_con_saldo.append({
                    'venta_id': venta.id,
                    'cliente': f"{venta.cliente.nombre} {venta.cliente.apellido}",
                    'saldo': venta.saldo_pendiente
                })
        
        return Response({
            'ventas_hoy': {
                'total': ventas_hoy['total'] or 0,
                'count': ventas_hoy['count'] or 0
            },
            'ventas_mes': {
                'total': ventas_mes['total'] or 0,
                'count': ventas_mes['count'] or 0
            },
            'pagos_hoy': {
                'total': pagos_hoy['total'] or 0,
                'count': pagos_hoy['count'] or 0
            },
            'stock_critico': stock_critico,
            'cobros_pendientes': len(ventas_con_saldo),
            'ventas_con_saldo': ventas_con_saldo[:10]  # Primeras 10
        })

class CuotaVencimientoListView(generics.ListAPIView):
    serializer_class = CuotaVencimientoSerializer
    
    def get_queryset(self):
        queryset = CuotaVencimiento.objects.all()
        venta_id = self.request.query_params.get('venta', None)
        estado = self.request.query_params.get('estado', None)
        vencidas = self.request.query_params.get('vencidas', None)
        
        if venta_id is not None:
            queryset = queryset.filter(venta_id=venta_id)
        if estado is not None:
            queryset = queryset.filter(estado=estado)
        if vencidas == 'true':
            hoy = datetime.now().date()
            queryset = queryset.filter(fecha_vencimiento__lt=hoy, estado__in=['pendiente', 'parcial'])
            
        return queryset

class CuotaVencimientoDetailView(generics.RetrieveUpdateAPIView):
    queryset = CuotaVencimiento.objects.all()
    serializer_class = CuotaVencimientoSerializer

class GenerarCuotasVentaView(APIView):
    def post(self, request, venta_id):
        try:
            venta = Venta.objects.get(id=venta_id)
            CuotaVencimiento.generar_cuotas_venta(venta)
            return Response({'message': 'Cuotas generadas exitosamente'}, status=status.HTTP_201_CREATED)
        except Venta.DoesNotExist:
            return Response({'error': 'Venta no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AlertaPagoListView(generics.ListAPIView):
    serializer_class = AlertaPagoSerializer
    
    def get_queryset(self):
        queryset = AlertaPago.objects.all()
        estado = self.request.query_params.get('estado', None)
        tipo = self.request.query_params.get('tipo', None)
        activas_solo = self.request.query_params.get('activas_solo', None)
        
        if estado is not None:
            queryset = queryset.filter(estado=estado)
        if tipo is not None:
            queryset = queryset.filter(tipo_alerta=tipo)
        if activas_solo == 'true':
            queryset = queryset.filter(estado='activa')
            
        return queryset

class AlertaPagoDetailView(generics.RetrieveUpdateAPIView):
    queryset = AlertaPago.objects.all()
    serializer_class = AlertaPagoSerializer

class GenerarAlertasAutomaticasView(APIView):
    def post(self, request):
        try:
            AlertaPago.generar_alertas_automaticas()
            return Response({'message': 'Alertas generadas exitosamente'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MarcarAlertaLeidaView(APIView):
    def post(self, request, pk):
        try:
            alerta = AlertaPago.objects.get(pk=pk)
            alerta.marcar_como_leida(request.user)
            return Response({'message': 'Alerta marcada como leída'})
        except AlertaPago.DoesNotExist:
            return Response({'error': 'Alerta no encontrada'}, status=status.HTTP_404_NOT_FOUND)

class MarcarAlertaResueltaView(APIView):
    def post(self, request, pk):
        try:
            alerta = AlertaPago.objects.get(pk=pk)
            alerta.marcar_como_resuelta()
            return Response({'message': 'Alerta marcada como resuelta'})
        except AlertaPago.DoesNotExist:
            return Response({'error': 'Alerta no encontrada'}, status=status.HTTP_404_NOT_FOUND)

class ResumenCobrosView(APIView):
    def get(self, request):
        hoy = datetime.now().date()
        
        # Cuotas vencidas
        cuotas_vencidas = CuotaVencimiento.objects.filter(
            fecha_vencimiento__lt=hoy,
            estado__in=['pendiente', 'parcial']
        ).count()
        
        # Cuotas próximas a vencer (7 días)
        fecha_limite = hoy + timedelta(days=7)
        cuotas_proximas = CuotaVencimiento.objects.filter(
            fecha_vencimiento__lte=fecha_limite,
            fecha_vencimiento__gte=hoy,
            estado='pendiente'
        ).count()
        
        # Total pendiente de cuotas vencidas (calculado manualmente)
        cuotas_vencidas_qs = CuotaVencimiento.objects.filter(
            fecha_vencimiento__lt=hoy,
            estado__in=['pendiente', 'parcial']
        )
        
        total_vencido = 0
        for cuota in cuotas_vencidas_qs:
            total_vencido += (cuota.monto_cuota - cuota.monto_pagado)
        
        # Alertas activas
        alertas_activas = AlertaPago.objects.filter(estado='activa').count()
        
        # Ventas con múltiples cuotas vencidas
        ventas_riesgo = CuotaVencimiento.objects.filter(
            estado='vencida'
        ).values('venta').annotate(
            total_vencidas=models.Count('id')
        ).filter(total_vencidas__gte=2).count()
        
        return Response({
            'cuotas_vencidas': cuotas_vencidas,
            'cuotas_proximas_vencer': cuotas_proximas,
            'total_monto_vencido': total_vencido,
            'alertas_activas': alertas_activas,
            'ventas_alto_riesgo': ventas_riesgo
        })

class BuscarClientesFinanciadosView(APIView):
    def get(self, request):
        """
        Busca clientes que tienen ventas activas con saldo pendiente (financiado o contado)
        """
        search_term = request.query_params.get('q', '')
        
        # Obtener todas las ventas que no están canceladas (pueden tener saldo pendiente)
        ventas_activas = Venta.objects.exclude(
            estado='cancelada'
        ).select_related('cliente')
        
        # Filtrar solo las que tienen saldo pendiente
        ventas_con_saldo = []
        for venta in ventas_activas:
            if venta.saldo_pendiente > 0:
                ventas_con_saldo.append(venta)
        
        if search_term:
            ventas_filtradas = []
            for venta in ventas_con_saldo:
                if (search_term.lower() in venta.cliente.nombre.lower() or
                    search_term.lower() in venta.cliente.apellido.lower() or
                    search_term.lower() in venta.cliente.cedula.lower()):
                    ventas_filtradas.append(venta)
            ventas_con_saldo = ventas_filtradas
        
        # Construir respuesta con información de la venta
        clientes_data = []
        for venta in ventas_con_saldo:
            # Para ventas financiadas
            if venta.tipo_venta == 'financiado':
                # Calcular cuotas restantes
                cuotas_pagadas = venta.cuotas_programadas.filter(estado='pagada').count()
                cuotas_restantes = venta.cuotas - cuotas_pagadas
                
                # Calcular mora total
                cuotas_con_mora = venta.cuotas_programadas.filter(
                    estado__in=['vencida', 'parcial']
                )
                total_mora = sum(cuota.monto_mora for cuota in cuotas_con_mora)
                
                # Próxima cuota
                proxima_cuota = venta.cuotas_programadas.filter(
                    estado__in=['pendiente', 'parcial', 'vencida']
                ).order_by('numero_cuota').first()
            else:
                # Para ventas al contado
                cuotas_pagadas = 0
                cuotas_restantes = 0
                total_mora = 0
                proxima_cuota = None
            
            # Calcular total pagado
            total_pagado = sum(pago.monto_pagado for pago in venta.pagos.all())
            
            cliente_data = {
                'cliente_id': venta.cliente.id,
                'nombre_completo': f"{venta.cliente.nombre} {venta.cliente.apellido}",
                'cedula': venta.cliente.cedula,
                'venta_id': venta.id,
                'fecha_venta': venta.fecha_venta,
                'monto_total': venta.monto_total,
                'monto_con_intereses': venta.monto_total_con_intereses,
                'saldo_pendiente': venta.saldo_pendiente,
                'total_pagado': total_pagado,
                'cuotas_totales': venta.cuotas,
                'cuotas_pagadas': cuotas_pagadas,
                'cuotas_restantes': cuotas_restantes,
                'pago_mensual': venta.pago_mensual,
                'tasa_interes': venta.tasa_interes,
                'total_mora': total_mora,
                'proxima_cuota': {
                    'numero': proxima_cuota.numero_cuota if proxima_cuota else None,
                    'fecha_vencimiento': proxima_cuota.fecha_vencimiento if proxima_cuota else None,
                    'monto': proxima_cuota.monto_cuota if proxima_cuota else None,
                    'dias_vencido': proxima_cuota.dias_vencido if proxima_cuota else 0,
                    'tiene_mora': proxima_cuota.tiene_mora if proxima_cuota else False
                } if proxima_cuota else None
            }
            
            clientes_data.append(cliente_data)
        
        return Response(clientes_data)
