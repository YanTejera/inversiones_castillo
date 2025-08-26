"""
URL configuration for concesionario_app project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.generic import TemplateView
from django.views.static import serve

def api_root(request):
    return JsonResponse({
        'message': 'Inversiones C&C API',
        'version': '1.0',
        'endpoints': {
            'auth': '/api/auth/',
            'usuarios': '/api/usuarios/',
            'motos': '/api/motos/',
            'ventas': '/api/ventas/',
            'pagos': '/api/pagos/',
            'reportes': '/api/reportes/',
            'notificaciones': '/api/notificaciones/'
        }
    })

def frontend_view(request):
    """
    Vista catch-all para servir el frontend SPA.
    Esta función maneja rutas que no son de API y las redirige al frontend.
    """
    import logging
    from django.http import HttpResponseRedirect
    from decouple import config
    
    logger = logging.getLogger(__name__)
    logger.info(f"Frontend route accessed: {request.path}")
    
    # En producción, redirigir al frontend deployado con la ruta preservada
    if not settings.DEBUG:
        frontend_url = config('FRONTEND_URL', default='https://inversiones-castillo1.onrender.com')
        full_url = f"{frontend_url}{request.path}"
        return HttpResponseRedirect(full_url)
    
    # En desarrollo, mostrar mensaje informativo
    return JsonResponse({
        'message': f'Frontend route: {request.path}',
        'info': 'Access this route via React app',
        'frontend_url': f'http://localhost:5174{request.path}',
        'debug': True
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include(('usuarios.urls', 'usuarios'), namespace='auth')),
    path('api/usuarios/', include(('usuarios.urls', 'usuarios'), namespace='usuarios')),
    path('api/motos/', include('motos.urls')),
    path('api/ventas/', include('ventas.urls')),
    path('api/pagos/', include('pagos.urls')),
    path('api/reportes/', include('reportes.urls')),
    path('api/notificaciones/', include('notificaciones.urls')),
]

# Catch-all pattern for frontend SPA routes (before static files)
# This handles routes like /login, /home, /clientes, /ventas, /motos, etc.
# Must exclude api/, admin/, media/, and static/ routes
urlpatterns += [
    re_path(r'^(?!api/|admin/|media/|static/).*$', frontend_view, name='frontend_catchall'),
]

# Serve media files in development and production
# Force serving media files even in production (for Render deployment)
# Always serve media files regardless of DEBUG setting
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

# Serve static files
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
