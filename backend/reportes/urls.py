from django.urls import path
from .views import (
    ReporteVentasPeriodoView,
    ReporteInventarioView,
    ReporteCobranzaView,
    ReporteFinancieroView
)

urlpatterns = [
    path('ventas-periodo/', ReporteVentasPeriodoView.as_view(), name='reporte-ventas-periodo'),
    path('inventario/', ReporteInventarioView.as_view(), name='reporte-inventario'),
    path('cobranza/', ReporteCobranzaView.as_view(), name='reporte-cobranza'),
    path('financiero/', ReporteFinancieroView.as_view(), name='reporte-financiero'),
]