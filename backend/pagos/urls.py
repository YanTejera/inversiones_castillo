from django.urls import path
from . import views

app_name = 'pagos'

urlpatterns = [
    path('', views.PagoListCreateView.as_view(), name='pago-list-create'),
    path('<int:pk>/', views.PagoDetailView.as_view(), name='pago-detail'),
    path('por-venta/<int:venta_id>/', views.PagosPorVentaView.as_view(), name='pagos-por-venta'),
    path('reportes/', views.ReporteListCreateView.as_view(), name='reporte-list-create'),
    path('reportes/<int:pk>/', views.ReporteDetailView.as_view(), name='reporte-detail'),
    path('auditoria/', views.AuditoriaListView.as_view(), name='auditoria-list'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
]