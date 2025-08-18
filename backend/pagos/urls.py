from django.urls import path
from . import views

app_name = 'pagos'

urlpatterns = [
    path('', views.PagoListCreateView.as_view(), name='pago-list-create'),
    path('<int:pk>/', views.PagoDetailView.as_view(), name='pago-detail'),
    path('<int:pk>/cancelar/', views.CancelarPagoView.as_view(), name='cancelar-pago'),
    path('<int:pk>/factura/', views.GenerarFacturaPagoView.as_view(), name='pago-factura'),
    path('por-venta/<int:venta_id>/', views.PagosPorVentaView.as_view(), name='pagos-por-venta'),
    path('reportes/', views.ReporteListCreateView.as_view(), name='reporte-list-create'),
    path('reportes/<int:pk>/', views.ReporteDetailView.as_view(), name='reporte-detail'),
    path('auditoria/', views.AuditoriaListView.as_view(), name='auditoria-list'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    
    # Cuotas de vencimiento
    path('cuotas/', views.CuotaVencimientoListView.as_view(), name='cuotas-list'),
    path('cuotas/<int:pk>/', views.CuotaVencimientoDetailView.as_view(), name='cuotas-detail'),
    path('cuotas/generar/<int:venta_id>/', views.GenerarCuotasVentaView.as_view(), name='generar-cuotas'),
    
    # Alertas de pago
    path('alertas/', views.AlertaPagoListView.as_view(), name='alertas-list'),
    path('alertas/<int:pk>/', views.AlertaPagoDetailView.as_view(), name='alertas-detail'),
    path('alertas/generar/', views.GenerarAlertasAutomaticasView.as_view(), name='generar-alertas'),
    path('alertas/<int:pk>/leida/', views.MarcarAlertaLeidaView.as_view(), name='marcar-alerta-leida'),
    path('alertas/<int:pk>/resuelta/', views.MarcarAlertaResueltaView.as_view(), name='marcar-alerta-resuelta'),
    
    # Resumen de cobros
    path('resumen-cobros/', views.ResumenCobrosView.as_view(), name='resumen-cobros'),
    
    # Búsqueda de clientes con saldo pendiente
    path('clientes-financiados/', views.BuscarClientesFinanciadosView.as_view(), name='clientes-con-saldo'),
]