from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    # Financiamiento
    EntidadesFinancierasListView,
    CalculadoraCreditoView,
    SolicitudCreditoListCreateView,
    SolicitudCreditoDetailView,
    ProcesarSolicitudView,
    ActualizarEstadoSolicitudView,
    DocumentosCreditoView,
    EstadisticasFinanciamientoView,
    
    # Comisiones
    EsquemaComisionListCreateView,
    EsquemaComisionDetailView,
    AsignacionComisionListCreateView,
    ComisionCalculadaListView,
    CalcularComisionView,
    AprobarComisionView,
    PagarComisionView,
    MetaVendedorListCreateView,
    ResumenComisionesVendedorView,
    EstadisticasComisionesView,
)

app_name = 'financiamiento'

urlpatterns = [
    # ========================
    # URLs DE FINANCIAMIENTO
    # ========================
    
    # Entidades financieras
    path('entidades/', EntidadesFinancierasListView.as_view(), name='entidades-list'),
    
    # Calculadora de crédito
    path('calculadora/', CalculadoraCreditoView.as_view(), name='calculadora-credito'),
    
    # Solicitudes de crédito
    path('solicitudes/', SolicitudCreditoListCreateView.as_view(), name='solicitudes-list-create'),
    path('solicitudes/<int:pk>/', SolicitudCreditoDetailView.as_view(), name='solicitudes-detail'),
    path('solicitudes/<int:pk>/procesar/', ProcesarSolicitudView.as_view(), name='solicitudes-procesar'),
    path('solicitudes/<int:pk>/actualizar-estado/', ActualizarEstadoSolicitudView.as_view(), name='solicitudes-actualizar-estado'),
    
    # Documentos de crédito
    path('solicitudes/<int:solicitud_id>/documentos/', DocumentosCreditoView.as_view(), name='documentos-list-create'),
    
    # Estadísticas de financiamiento
    path('estadisticas/', EstadisticasFinanciamientoView.as_view(), name='estadisticas-financiamiento'),
    
    # ========================
    # URLs DE COMISIONES
    # ========================
    
    # Esquemas de comisión
    path('esquemas-comision/', EsquemaComisionListCreateView.as_view(), name='esquemas-list-create'),
    path('esquemas-comision/<int:pk>/', EsquemaComisionDetailView.as_view(), name='esquemas-detail'),
    
    # Asignaciones de comisión
    path('asignaciones-comision/', AsignacionComisionListCreateView.as_view(), name='asignaciones-list-create'),
    
    # Comisiones calculadas
    path('comisiones/', ComisionCalculadaListView.as_view(), name='comisiones-list'),
    path('ventas/<int:venta_id>/calcular-comision/', CalcularComisionView.as_view(), name='calcular-comision'),
    path('comisiones/<int:pk>/aprobar/', AprobarComisionView.as_view(), name='aprobar-comision'),
    path('comisiones/<int:pk>/pagar/', PagarComisionView.as_view(), name='pagar-comision'),
    
    # Metas de vendedores
    path('metas/', MetaVendedorListCreateView.as_view(), name='metas-list-create'),
    
    # Resúmenes y estadísticas de comisiones
    path('vendedores/<int:vendedor_id>/resumen-comisiones/', ResumenComisionesVendedorView.as_view(), name='resumen-comisiones'),
    path('estadisticas-comisiones/', EstadisticasComisionesView.as_view(), name='estadisticas-comisiones'),
]

# URLs adicionales para webhooks y integraciones externas
webhooks_patterns = [
    # Webhooks de entidades financieras
    path('webhook/solicitud/<uuid:numero_solicitud>/estado/', ActualizarEstadoSolicitudView.as_view(), name='webhook-estado-solicitud'),
]

urlpatterns += [
    path('webhooks/', include(webhooks_patterns)),
]