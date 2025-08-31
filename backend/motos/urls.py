from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import proveedor_views
from . import accounting_views
from .alerts_view import AlertasInteligentesView
from .simple_location_views import (
    SimpleAlmacenViewSet, SimpleZonaViewSet, SimplePasilloViewSet, SimpleUbicacionViewSet,
    SimpleLocationStatsView
)
from .export_views import (
    ExportInventoryView, ExportSalesView, ExportLocationsView, ExportTemplatesView,
    ExportClientesView, ExportProveedoresView, ExportVentasView, ExportPagosView, ExportDocumentosView
)
from .import_views import (
    ImportInventoryView, ImportLocationsView, ImportValidationView
)

app_name = 'motos'

# Router para ViewSets de ubicaciones
router = DefaultRouter()
router.register(r'almacenes', SimpleAlmacenViewSet)
router.register(r'zonas', SimpleZonaViewSet)
router.register(r'pasillos', SimplePasilloViewSet)
router.register(r'ubicaciones', SimpleUbicacionViewSet)

urlpatterns = [
    # URLs originales para el modelo Moto
    path('', views.MotoListCreateView.as_view(), name='moto-list-create'),
    path('<int:pk>/', views.MotoDetailView.as_view(), name='moto-detail'),
    path('disponibles/', views.MotoDisponibleListView.as_view(), name='moto-disponibles'),
    path('stock-critico/', views.StockCriticoView.as_view(), name='stock-critico'),
    
    # URLs para el nuevo sistema de modelos con inventario por color
    path('modelos/', views.MotoModeloListCreateView.as_view(), name='modelo-list-create'),
    path('modelos/<int:pk>/', views.MotoModeloDetailView.as_view(), name='modelo-detail'),
    path('modelos/<int:modelo_id>/estadisticas/', views.MotoModeloEstadisticasView.as_view(), name='modelo-estadisticas'),
    path('modelos/<int:modelo_id>/inventario/', views.MotoInventarioListCreateView.as_view(), name='inventario-list-create'),
    path('modelos/<int:modelo_id>/chasis/<str:color>/', views.ChasisByColorView.as_view(), name='chasis-by-color'),
    path('inventario/<int:pk>/', views.MotoInventarioDetailView.as_view(), name='inventario-detail'),
    path('test-image/<int:modelo_id>/', views.TestImageView.as_view(), name='test-image'),
    path('venta-directa/', views.VentaDirectaView.as_view(), name='venta-directa'),
    
    # URLs para gestión de proveedores
    path('proveedores/', proveedor_views.ProveedorListCreateView.as_view(), name='proveedor-list-create'),
    path('proveedores/<int:pk>/', proveedor_views.ProveedorDetailView.as_view(), name='proveedor-detail'),
    path('proveedores/<int:proveedor_id>/estadisticas/', proveedor_views.ProveedorEstadisticasView.as_view(), name='proveedor-estadisticas'),
    path('proveedores/<int:proveedor_id>/motocicletas/', proveedor_views.ProveedorMotocicletasView.as_view(), name='proveedor-motocicletas'),
    
    # URLs para sistema de contabilidad de proveedores
    path('facturas/', accounting_views.FacturaProveedorListCreateView.as_view(), name='factura-list-create'),
    path('facturas/<int:pk>/', accounting_views.FacturaProveedorDetailView.as_view(), name='factura-detail'),
    path('facturas/<int:factura_id>/pdf/', accounting_views.imprimir_factura_proveedor_pdf, name='factura-pdf'),
    path('pagos/', accounting_views.PagoProveedorListCreateView.as_view(), name='pago-list-create'),
    path('pagos/<int:pk>/', accounting_views.PagoProveedorDetailView.as_view(), name='pago-detail'),
    path('proveedores/<int:proveedor_id>/estadisticas-financieras/', accounting_views.EstadisticasProveedorView.as_view(), name='proveedor-estadisticas-financieras'),
    
    # URLs para órdenes de compra y re-stock
    path('ordenes-compra/', accounting_views.OrdenCompraListCreateView.as_view(), name='orden-compra-list-create'),
    path('ordenes-compra/<int:pk>/', accounting_views.OrdenCompraDetailView.as_view(), name='orden-compra-detail'),
    path('ordenes-compra/<int:orden_id>/pdf/', accounting_views.imprimir_orden_compra_pdf, name='orden-compra-pdf'),
    path('ordenes-compra/detalles/', accounting_views.DetalleOrdenCompraListCreateView.as_view(), name='detalle-orden-list-create'),
    path('restock/sugerencias/', accounting_views.SugerenciasRestockView.as_view(), name='sugerencias-restock'),
    path('restock/crear-orden/', accounting_views.CrearOrdenCompraAutomaticaView.as_view(), name='crear-orden-automatica'),
    
    # URLs para analytics avanzados
    path('analytics/', views.AnalyticsAvanzadosView.as_view(), name='analytics-avanzados'),
    path('alertas/', AlertasInteligentesView.as_view(), name='alertas-inteligentes'),
    
    # URLs para gestión de ubicaciones físicas
    path('locations/', SimpleLocationStatsView.as_view(), name='location-manager'),
    
    # URLs para importación/exportación de datos
    path('export/inventory/', ExportInventoryView.as_view(), name='export-inventory'),
    path('export/sales/', ExportSalesView.as_view(), name='export-sales'),
    path('export/locations/', ExportLocationsView.as_view(), name='export-locations'),
    path('export/templates/', ExportTemplatesView.as_view(), name='export-templates'),
    path('export/clientes/', ExportClientesView.as_view(), name='export-clientes'),
    path('export/proveedores/', ExportProveedoresView.as_view(), name='export-proveedores'),
    path('export/ventas/', ExportVentasView.as_view(), name='export-ventas'),
    path('export/pagos/', ExportPagosView.as_view(), name='export-pagos'),
    path('export/documentos/', ExportDocumentosView.as_view(), name='export-documentos'),
    path('import/inventory/', ImportInventoryView.as_view(), name='import-inventory'),
    path('import/locations/', ImportLocationsView.as_view(), name='import-locations'),
    path('import/validate/', ImportValidationView.as_view(), name='import-validate'),
    
    # Include router URLs para ubicaciones
    path('', include(router.urls)),
]