from django.urls import path
from . import views
from . import proveedor_views

app_name = 'motos'

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
]