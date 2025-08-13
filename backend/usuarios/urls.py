from django.urls import path
from . import views

app_name = 'usuarios'

urlpatterns = [
    # Autenticación
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # Roles
    path('roles/', views.RolListView.as_view(), name='rol-list'),
    
    # Usuarios
    path('usuarios/', views.UsuarioListCreateView.as_view(), name='usuario-list-create'),
    path('usuarios/<int:pk>/', views.UsuarioDetailView.as_view(), name='usuario-detail'),
    
    # Clientes
    path('clientes/', views.ClienteListCreateView.as_view(), name='cliente-list-create'),
    path('clientes/<int:pk>/', views.ClienteDetailView.as_view(), name='cliente-detail'),
    
    # Fiadores
    path('fiadores/', views.FiadorListCreateView.as_view(), name='fiador-list-create'),
    path('fiadores/<int:pk>/', views.FiadorDetailView.as_view(), name='fiador-detail'),
    
    # Documentos
    path('documentos/', views.DocumentoListCreateView.as_view(), name='documento-list-create'),
    path('documentos/<int:pk>/', views.DocumentoDetailView.as_view(), name='documento-detail'),
]