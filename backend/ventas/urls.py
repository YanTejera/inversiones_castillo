from django.urls import path
from . import views

app_name = 'ventas'

urlpatterns = [
    path('', views.VentaListCreateView.as_view(), name='venta-list-create'),
    path('<int:pk>/', views.VentaDetailView.as_view(), name='venta-detail'),
    path('calcular/', views.CalcularVentaView.as_view(), name='calcular-venta'),
    path('detalles/', views.VentaDetalleListCreateView.as_view(), name='detalle-list-create'),
    path('detalles/<int:pk>/', views.VentaDetalleDetailView.as_view(), name='detalle-detail'),
    path('activas/', views.VentaActivaListView.as_view(), name='venta-activas'),
    path('<int:pk>/factura/', views.GenerarFacturaView.as_view(), name='generar-factura'),
    path('cliente/<int:cliente_id>/', views.ClienteVentasView.as_view(), name='cliente-ventas'),
]