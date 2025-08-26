from django.urls import path
from . import views

app_name = 'notificaciones'

urlpatterns = [
    # CRUD básico de notificaciones
    path('', views.NotificacionListView.as_view(), name='notificacion-list'),
    path('crear/', views.NotificacionCreateView.as_view(), name='notificacion-create'),
    path('<int:pk>/', views.NotificacionDetailView.as_view(), name='notificacion-detail'),
    
    # Funciones especiales
    path('resumen/', views.NotificacionResumenView.as_view(), name='notificacion-resumen'),
    path('marcar-leida/', views.MarcarLeidaView.as_view(), name='marcar-leida'),
    path('marcar-todas-leidas/', views.MarcarTodasLeidasView.as_view(), name='marcar-todas-leidas'),
    
    # Preferencias
    path('preferencias/', views.PreferenciaNotificacionView.as_view(), name='preferencias'),
    
    # Utilidades
    path('crear-rapida/', views.crear_notificacion_rapida, name='crear-rapida'),
    
    # Push notifications
    path('push/suscribir/', views.suscribir_push, name='suscribir-push'),
    path('push/desuscribir/', views.desuscribir_push, name='desuscribir-push'),
]