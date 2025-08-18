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
    
    # Vistas específicas por cliente
    path('clientes/<int:cliente_id>/fiador/', views.ClienteFiadorView.as_view(), name='cliente-fiador'),
    path('clientes/<int:cliente_id>/documentos/', views.ClienteDocumentosView.as_view(), name='cliente-documentos'),
    
    # ===== NUEVAS RUTAS PARA GESTIÓN AVANZADA =====
    # Perfil de usuario
    path('perfil/', views.PerfilUsuarioView.as_view(), name='perfil-usuario'),
    path('cambiar-password/', views.CambiarPasswordView.as_view(), name='cambiar-password'),
    
    # Estadísticas y gestión
    path('estadisticas/', views.EstadisticasUsuariosView.as_view(), name='estadisticas-usuarios'),
    path('usuarios/<int:usuario_id>/toggle-estado/', views.ActivarDesactivarUsuarioView.as_view(), name='toggle-estado-usuario'),
    
    # Gestión de roles (solo master)
    path('gestion/roles/', views.GestionRolesView.as_view(), name='gestion-roles'),
    path('gestion/roles/<int:rol_id>/', views.GestionRolDetailView.as_view(), name='gestion-rol-detail'),
    
    # Configuración del sistema
    path('configuracion/', views.ConfiguracionSistemaView.as_view(), name='configuracion-sistema'),
]