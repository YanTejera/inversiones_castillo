from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse
from django.template.loader import get_template
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
    serializer_class = VentaSerializer

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
