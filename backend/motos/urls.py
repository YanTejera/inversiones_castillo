from django.urls import path
from . import views

app_name = 'motos'

urlpatterns = [
    path('', views.MotoListCreateView.as_view(), name='moto-list-create'),
    path('<int:pk>/', views.MotoDetailView.as_view(), name='moto-detail'),
    path('disponibles/', views.MotoDisponibleListView.as_view(), name='moto-disponibles'),
    path('stock-critico/', views.StockCriticoView.as_view(), name='stock-critico'),
]