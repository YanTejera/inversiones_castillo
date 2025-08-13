from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from datetime import datetime, timedelta
from .models import Pago, Reporte, Auditoria
from .serializers import PagoSerializer, PagoCreateSerializer, ReporteSerializer, AuditoriaSerializer
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
