from rest_framework import generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from .models import Moto
from .serializers import MotoSerializer, MotoDisponibleSerializer

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
